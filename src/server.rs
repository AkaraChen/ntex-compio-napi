use crate::bridge::State;
use futures_channel::oneshot;
use neon::{prelude::*, types::Deferred};
use ntex::web;
use std::sync::{atomic::Ordering, Arc, Mutex};

type Ready = Arc<Mutex<Option<Deferred>>>;

pub fn spawn(
    state: Arc<State>,
    host: String,
    port: u16,
    ready: Deferred,
    stop: oneshot::Receiver<()>,
) {
    let ready = Arc::new(Mutex::new(Some(ready)));
    let thread_state = state.clone();
    let thread_ready = ready.clone();
    let spawned = std::thread::Builder::new()
        .name("napi-http".into())
        .spawn(move || {
            let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                let sys = ntex::rt::System::new("napi-http", ntex::rt::DefaultRuntime);
                let state = thread_state.clone();
                let ready = thread_ready.clone();
                sys.block_on(async move {
                    let factory_state = state.clone();
                    let server = web::HttpServer::new(move || {
                        let state = factory_state.clone();
                        async move {
                            web::App::new().default_service(web::to(
                                move |req: web::HttpRequest, payload: web::types::Payload| {
                                    crate::bridge::handle(state.clone(), req, payload)
                                },
                            ))
                        }
                    })
                    .disable_signals()
                    // Let pending JS responses reach their deadline before
                    // ntex's graceful-shutdown budget expires.
                    .shutdown_timeout(ntex::time::Seconds(
                        (state.timeout_ms / 1000 + 2).min(65535) as u16,
                    ))
                    .bind((host.as_str(), port))?
                    .workers(state.workers)
                    .run();
                    let deferred = ready.lock().unwrap().take().unwrap();
                    deferred.settle_with(
                        state.channel.lock().unwrap().as_ref().unwrap(),
                        move |mut cx| Ok(cx.number(port)),
                    );
                    let _ = stop.await;
                    server.stop(true).await;
                    server.await
                })
            }));
            let error = match result {
                Ok(Ok(())) => None,
                Ok(Err(e)) => Some(e.to_string()),
                Err(_) => Some("server thread panicked".to_owned()),
            };
            finish(thread_state, thread_ready, error);
        });
    // Even an OS thread creation failure must release the referenced Channel.
    if let Err(error) = spawned {
        finish(state, ready, Some(error.to_string()));
    }
}

fn finish(state: Arc<State>, ready: Ready, error: Option<String>) {
    let cleanup = state.clone();
    state
        .channel
        .lock()
        .unwrap()
        .as_ref()
        .unwrap()
        .send(move |mut cx| {
            if let Some(ready) = ready.lock().unwrap().take() {
                let err = cx.error(
                    error
                        .as_deref()
                        .unwrap_or("server stopped before listening"),
                )?;
                ready.reject(&mut cx, err);
            }
            cleanup.pending.lock().unwrap().clear();
            if let Some(root) = cleanup.dispatch.lock().unwrap().take() {
                root.drop(&mut cx);
            }
            if let Some(mut channel) = cleanup.channel.lock().unwrap().take() {
                channel.unref(&mut cx);
            }
            cleanup.running.store(false, Ordering::Release);
            for deferred in cleanup.closers.lock().unwrap().drain(..) {
                if let Some(error) = &error {
                    let error = cx.error(error)?;
                    deferred.reject(&mut cx, error);
                } else {
                    let value = cx.undefined();
                    deferred.resolve(&mut cx, value);
                }
            }
            Ok(())
        });
}
