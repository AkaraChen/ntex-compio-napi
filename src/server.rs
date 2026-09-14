use crate::bridge::State;
use futures_channel::oneshot;
use neon::{prelude::*, types::Deferred};
use ntex::web;
use std::sync::{atomic::Ordering, Arc};

pub fn spawn(
    state: Arc<State>,
    host: String,
    port: u16,
    ready: Deferred,
    stop: oneshot::Receiver<()>,
) {
    std::thread::Builder::new()
        .name("napi-http".into())
        .spawn(move || {
            let ready = Arc::new(std::sync::Mutex::new(Some(ready)));
            let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                let sys = ntex::rt::System::new("napi-http", ntex::rt::DefaultRuntime);
                let state = state.clone();
                let ready = ready.clone();
                sys.block_on(async move {
                    let counter = state.clone();
                    let server = web::HttpServer::new(move || {
                        let counter = counter.clone();
                        async move {
                            web::App::new().default_service(web::to(
                                move |req: web::HttpRequest, payload: web::types::Payload| {
                                    crate::bridge::handle(counter.clone(), req, payload)
                                },
                            ))
                        }
                    })
                    .disable_signals()
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
                    if let Some(root) = cleanup.dispatch.lock().unwrap().take() {
                        root.drop(&mut cx);
                    }
                    if let Some(mut channel) = cleanup.channel.lock().unwrap().take() {
                        channel.unref(&mut cx);
                    }
                    cleanup.running.store(false, Ordering::Release);
                    for deferred in cleanup.closers.lock().unwrap().drain(..) {
                        let value = cx.undefined();
                        deferred.resolve(&mut cx, value);
                    }
                    Ok(())
                });
        })
        .expect("spawn HTTP thread");
}
