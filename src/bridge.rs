use futures_channel::oneshot;
use neon::{event::Channel, prelude::*, types::Deferred};
use ntex::{
    http::{
        header::{HeaderName, HeaderValue},
        StatusCode,
    },
    util::{select, Either},
    web,
};
use std::{
    collections::{BTreeMap, HashMap},
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

struct Request {
    method: String,
    url: String,
    ip: String,
    headers: Vec<(String, String)>,
    body: Vec<u8>,
}

#[derive(Default)]
pub struct PendingRequest {
    response: Option<oneshot::Sender<Response>>,
    request: Option<Request>,
    cancel: Option<oneshot::Sender<()>>,
}

pub struct QueuedRequest {
    ready: oneshot::Sender<()>,
    entry: PendingRequest,
}

// One lock makes admission, cancellation, and slot transfer atomic across workers.
#[derive(Default)]
pub struct Pending {
    pub active: HashMap<u64, PendingRequest>,
    pub queued: BTreeMap<u64, QueuedRequest>,
    pub peak: usize,
    pub stopping: bool,
    dispatch_scheduled: bool,
    drained: Option<oneshot::Sender<()>>,
}

pub struct State {
    pub channel: Mutex<Option<Channel>>,
    pub dispatch: Mutex<Option<Root<JsFunction>>>,
    pub stop: Mutex<Option<oneshot::Sender<()>>>,
    pub closers: Mutex<Vec<Deferred>>,
    pub pending: Mutex<Pending>,
    pub max_body_bytes: usize,
    pub max_in_flight: usize,
    pub max_queued: usize,
    pub rejected413: AtomicU64,
    pub rejected503: AtomicU64,
    pub running: AtomicBool,
    pub requests: AtomicU64,
    pub timed_out: AtomicU64,
    pub workers: usize,
    pub timeout_ms: u32,
}
impl State {
    pub fn complete(&self, id: u64, response: Response) -> bool {
        let sender = self
            .pending
            .lock()
            .unwrap()
            .active
            .get_mut(&id)
            .and_then(|entry| entry.response.take());
        sender.is_some_and(|sender| sender.send(response).is_ok())
    }

    pub fn begin_shutdown(&self) -> oneshot::Receiver<()> {
        let (tx, rx) = oneshot::channel();
        let mut pending = self.pending.lock().unwrap();
        pending.stopping = true;
        if pending.active.is_empty() && pending.queued.is_empty() {
            let _ = tx.send(());
        } else {
            pending.drained = Some(tx);
        }
        rx
    }

    pub fn cancel_all(&self) {
        let mut pending = self.pending.lock().unwrap();
        for entry in pending.active.values_mut() {
            if let Some(cancel) = entry.cancel.take() {
                let _ = cancel.send(());
            }
        }
        for queued in pending.queued.values_mut() {
            if let Some(cancel) = queued.entry.cancel.take() {
                let _ = cancel.send(());
            }
        }
    }
}

// Also removes the entry when ntex cancels a disconnected request or stops a worker.
struct PendingGuard {
    state: Arc<State>,
    id: u64,
}
impl Drop for PendingGuard {
    fn drop(&mut self) {
        let mut pending = self.state.pending.lock().unwrap();
        pending.queued.remove(&self.id);
        if pending.active.remove(&self.id).is_some() {
            while let Some((id, queued)) = pending.queued.pop_first() {
                // Reserve before waking: a new arrival cannot steal this slot.
                pending.active.insert(id, queued.entry);
                if queued.ready.send(()).is_ok() {
                    break;
                }
                pending.active.remove(&id);
            }
        }
        if pending.active.is_empty() && pending.queued.is_empty() {
            if let Some(drained) = pending.drained.take() {
                let _ = drained.send(());
            }
        }
    }
}

fn too_large(state: &State) -> web::HttpResponse {
    state.rejected413.fetch_add(1, Ordering::Relaxed);
    web::HttpResponse::PayloadTooLarge()
        .force_close()
        .content_type("text/plain; charset=utf-8")
        .body(format!(
            "Request body exceeds maxBodyBytes={} bytes",
            state.max_body_bytes
        ))
}

pub async fn handle(
    state: Arc<State>,
    req: web::HttpRequest,
    payload: web::types::Payload,
) -> web::HttpResponse {
    state.requests.fetch_add(1, Ordering::Relaxed);
    // Do this before admission and before the first payload poll. Never drain refusals.
    if req
        .headers()
        .get("content-length")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.parse::<u64>().ok())
        .is_some_and(|length| length > state.max_body_bytes as u64)
    {
        return too_large(&state);
    }
    let disconnected = req.io().map(|io| io.on_disconnect());
    let work = handle_admitted(state, req, payload);
    if let Some(disconnected) = disconnected {
        // ntex need not drop a pending service future immediately on peer EOF.
        // Dropping work here releases queued/reserved/pending state through the guard.
        match select(disconnected, work).await {
            Either::Left(()) => web::HttpResponse::BadRequest().force_close().finish(),
            Either::Right(response) => response,
        }
    } else {
        work.await
    }
}

async fn handle_admitted(
    state: Arc<State>,
    req: web::HttpRequest,
    mut payload: web::types::Payload,
) -> web::HttpResponse {
    let id = NEXT_ID.fetch_add(1, Ordering::Relaxed);
    let (cancel, cancelled) = oneshot::channel();
    let entry = PendingRequest {
        cancel: Some(cancel),
        ..PendingRequest::default()
    };
    let waiting = {
        let mut pending = state.pending.lock().unwrap();
        if pending.stopping {
            return web::HttpResponse::ServiceUnavailable()
                .force_close()
                .header("retry-after", "1")
                .body("Server stopping");
        } else if pending.active.len() < state.max_in_flight {
            pending.active.insert(id, entry);
            pending.peak = pending.peak.max(pending.active.len());
            None
        } else if pending.queued.len() < state.max_queued {
            let (tx, rx) = oneshot::channel();
            pending
                .queued
                .insert(id, QueuedRequest { ready: tx, entry });
            Some(rx)
        } else {
            state.rejected503.fetch_add(1, Ordering::Relaxed);
            return web::HttpResponse::ServiceUnavailable()
                .force_close()
                .header("retry-after", "1")
                .content_type("text/plain; charset=utf-8")
                .body("Request capacity exhausted; retry after 1 second");
        }
    };
    let _guard = PendingGuard {
        state: state.clone(),
        id,
    };
    let io = req.io().cloned();
    let work = async {
        if let Some(waiting) = waiting {
            if waiting.await.is_err() {
                return web::HttpResponse::ServiceUnavailable()
                    .force_close()
                    .body("Server stopping");
            }
        }
        let mut body = Vec::new();
        while let Some(chunk) = payload.recv().await {
            match chunk {
                Ok(chunk) => {
                    if chunk.len() > state.max_body_bytes - body.len() {
                        return too_large(&state);
                    }
                    body.extend_from_slice(&chunk);
                }
                Err(_) => {
                    return web::HttpResponse::BadRequest()
                        .force_close()
                        .body("Cannot read request body")
                }
            }
        }
        let request = Request {
            method: req.method().as_str().to_owned(),
            url: req.uri().to_string(),
            ip: req
                .peer_addr()
                .map(|p| p.ip().to_string())
                .unwrap_or_default(),
            headers: req
                .headers()
                .iter()
                .map(|(k, v)| {
                    (
                        k.as_str().to_owned(),
                        String::from_utf8_lossy(v.as_bytes()).into_owned(),
                    )
                })
                .collect(),
            body,
        };
        let (tx, rx) = oneshot::channel();
        let schedule = {
            let mut pending = state.pending.lock().unwrap();
            let entry = pending.active.get_mut(&id).unwrap();
            entry.response = Some(tx);
            entry.request = Some(request);
            // Coalesce notifications: expired requests must not leave an unbounded
            // Neon callback queue when the JS thread is busy.
            let schedule = !pending.dispatch_scheduled;
            pending.dispatch_scheduled = true;
            schedule
        };
        let dispatch_state = state.clone();
        // This schedules work only. Never join a Neon Channel JoinHandle here.
        let sent = !schedule
            || state
                .channel
                .lock()
                .unwrap()
                .as_ref()
                .is_some_and(|channel| {
                    channel
                        .try_send(move |mut cx| {
                            let ids: Vec<_> = {
                                let mut pending = dispatch_state.pending.lock().unwrap();
                                pending.dispatch_scheduled = false;
                                pending
                                    .active
                                    .iter()
                                    .filter_map(|(&id, entry)| entry.request.as_ref().map(|_| id))
                                    .collect()
                            };
                            for id in ids {
                                // Notifications carry no bytes. A cancelled request is absent
                                // even if JS has not yet processed its notification.
                                let request = dispatch_state
                                    .pending
                                    .lock()
                                    .unwrap()
                                    .active
                                    .get_mut(&id)
                                    .and_then(|entry| entry.request.take());
                                let Some(Request {
                                    method,
                                    url,
                                    ip,
                                    headers,
                                    body,
                                }) = request
                                else {
                                    continue;
                                };
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
                            }
                            Ok(())
                        })
                        .is_ok()
                });
        if !sent {
            let mut pending = state.pending.lock().unwrap();
            pending.dispatch_scheduled = false;
            for entry in pending.active.values_mut() {
                if entry.request.take().is_some() {
                    if let Some(sender) = entry.response.take() {
                        let _ = sender.send(Response::error(
                            StatusCode::SERVICE_UNAVAILABLE,
                            "JavaScript channel closed",
                        ));
                    }
                }
            }
        }
        match ntex::time::timeout(ntex::time::Millis(state.timeout_ms), rx).await {
            Ok(Ok(response)) => response.into_http(),
            Ok(Err(_)) => web::HttpResponse::ServiceUnavailable().body("Server stopping"),
            Err(_) => {
                state.timed_out.fetch_add(1, Ordering::Relaxed);
                web::HttpResponse::GatewayTimeout().body("JavaScript response timed out")
            }
        }
    };
    match select(cancelled, work).await {
        Either::Left(_) => {
            if let Some(io) = io {
                io.terminate();
            }
            web::HttpResponse::ServiceUnavailable()
                .force_close()
                .body("Server stopping")
        }
        Either::Right(response) => response,
    }
}
