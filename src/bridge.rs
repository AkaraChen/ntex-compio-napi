use futures_channel::oneshot;
use neon::{event::Channel, prelude::*, types::Deferred};
use ntex::{
    http::{
        header::{HeaderName, HeaderValue},
        StatusCode,
    },
    web,
};
use std::{
    collections::HashMap,
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Arc, Mutex,
    },
};

static NEXT_ID: AtomicU64 = AtomicU64::new(1);

pub struct Response {
    pub status: StatusCode,
    pub headers: Vec<(HeaderName, HeaderValue)>,
    pub body: Vec<u8>,
}
impl Response {
    pub fn error(status: StatusCode, message: &str) -> Self {
        Self {
            status,
            headers: vec![],
            body: message.as_bytes().to_vec(),
        }
    }
    fn into_http(self) -> web::HttpResponse {
        let mut response = web::HttpResponse::build(self.status);
        for (name, value) in self.headers {
            response.header(name, value);
        }
        response.body(self.body)
    }
}

pub struct State {
    pub channel: Mutex<Option<Channel>>,
    pub dispatch: Mutex<Option<Root<JsFunction>>>,
    pub stop: Mutex<Option<oneshot::Sender<()>>>,
    pub closers: Mutex<Vec<Deferred>>,
    pub pending: Mutex<HashMap<u64, oneshot::Sender<Response>>>,
    pub running: AtomicBool,
    pub requests: AtomicU64,
    pub timed_out: AtomicU64,
    pub workers: usize,
    pub timeout_ms: u32,
}
impl State {
    pub fn complete(&self, id: u64, response: Response) -> bool {
        let sender = self.pending.lock().unwrap().remove(&id);
        sender.is_some_and(|sender| sender.send(response).is_ok())
    }
}

// Also removes the entry when ntex cancels a disconnected request or stops a worker.
struct PendingGuard {
    state: Arc<State>,
    id: u64,
}
impl Drop for PendingGuard {
    fn drop(&mut self) {
        self.state.pending.lock().unwrap().remove(&self.id);
    }
}

pub async fn handle(
    state: Arc<State>,
    req: web::HttpRequest,
    mut payload: web::types::Payload,
) -> web::HttpResponse {
    state.requests.fetch_add(1, Ordering::Relaxed);
    let mut body = Vec::new();
    while let Some(chunk) = payload.recv().await {
        match chunk {
            Ok(chunk) => body.extend_from_slice(&chunk),
            Err(_) => return web::HttpResponse::BadRequest().body("Cannot read request body"),
        }
    }
    let method = req.method().as_str().to_owned();
    let url = req.uri().to_string();
    let ip = req
        .peer_addr()
        .map(|p| p.ip().to_string())
        .unwrap_or_default();
    let headers: Vec<_> = req
        .headers()
        .iter()
        .map(|(k, v)| {
            (
                k.as_str().to_owned(),
                String::from_utf8_lossy(v.as_bytes()).into_owned(),
            )
        })
        .collect();
    let id = NEXT_ID.fetch_add(1, Ordering::Relaxed);
    let (tx, rx) = oneshot::channel();
    state.pending.lock().unwrap().insert(id, tx);
    let _guard = PendingGuard {
        state: state.clone(),
        id,
    };
    let dispatch_state = state.clone();
    // This schedules work only. Never join a Neon Channel JoinHandle here.
    let sent = state
        .channel
        .lock()
        .unwrap()
        .as_ref()
        .is_some_and(|channel| {
            channel
                .try_send(move |mut cx| {
                    if !dispatch_state.pending.lock().unwrap().contains_key(&id) {
                        return Ok(());
                    }
                    let result = cx.try_catch(|cx| {
                        let f = match dispatch_state.dispatch.lock().unwrap().as_ref() {
                            Some(root) => root.to_inner(cx),
                            None => return Ok(()),
                        };
                        let request = cx.empty_object();
                        let method = cx.string(method);
                        let url = cx.string(url);
                        let ip = cx.string(ip);
                        let body = JsBuffer::from_slice(cx, &body)?;
                        let js_headers = cx.empty_object();
                        for (key, value) in headers {
                            let value = cx.string(value);
                            js_headers.set(cx, key.as_str(), value)?;
                        }
                        request.set(cx, "method", method)?;
                        request.set(cx, "url", url)?;
                        request.set(cx, "ip", ip)?;
                        request.set(cx, "body", body)?;
                        request.set(cx, "headers", js_headers)?;
                        let id = cx.string(id.to_string());
                        f.bind(cx).args((id, request))?.exec()
                    });
                    if result.is_err() {
                        dispatch_state.complete(
                            id,
                            Response::error(
                                StatusCode::INTERNAL_SERVER_ERROR,
                                "JavaScript dispatch failed",
                            ),
                        );
                    }
                    Ok(())
                })
                .is_ok()
        });
    if !sent {
        state.complete(
            id,
            Response::error(StatusCode::SERVICE_UNAVAILABLE, "JavaScript channel closed"),
        );
    }
    match ntex::time::timeout(ntex::time::Millis(state.timeout_ms), rx).await {
        Ok(Ok(response)) => response.into_http(),
        Ok(Err(_)) => web::HttpResponse::ServiceUnavailable().body("Server stopping"),
        Err(_) => {
            state.timed_out.fetch_add(1, Ordering::Relaxed);
            web::HttpResponse::GatewayTimeout().body("JavaScript response timed out")
        }
    }
}
