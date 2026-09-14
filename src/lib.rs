mod bridge;
mod server;
use bridge::State;
use futures_channel::oneshot;
use neon::prelude::*;
use std::{cell::RefCell, sync::{atomic::{AtomicBool, AtomicU64, Ordering}, Arc, Mutex}};

thread_local! { static STATE: RefCell<Option<Arc<State>>> = const { RefCell::new(None) }; }
fn current() -> Option<Arc<State>> { STATE.with(|s| s.borrow().clone()) }

fn start(mut cx: FunctionContext) -> JsResult<JsPromise> {
    if current().is_some_and(|s| s.running.load(Ordering::Acquire)) { return cx.throw_error("server already running"); }
    let options = cx.argument::<JsObject>(0)?;
    let dispatch = cx.argument::<JsFunction>(1)?;
    let host: Handle<JsString> = options.get(&mut cx, "host")?;
    let host = host.value(&mut cx);
    let port: Handle<JsNumber> = options.get(&mut cx, "port")?;
    let port = port.value(&mut cx);
    if !port.is_finite() || port.fract() != 0.0 || !(1.0..=65535.0).contains(&port) { return cx.throw_range_error("port must be an integer in 1..65535"); }
    let workers = options.get_opt::<JsNumber, _, _>(&mut cx, "workers")?.map(|v| v.value(&mut cx)).unwrap_or(1.0);
    if !workers.is_finite() || workers.fract() != 0.0 || !(1.0..=64.0).contains(&workers) { return cx.throw_range_error("workers must be an integer in 1..64"); }
    let (tx, rx) = oneshot::channel();
    let state = Arc::new(State { channel: Mutex::new(Some(cx.channel())), dispatch: Mutex::new(Some(dispatch.root(&mut cx))), stop: Mutex::new(Some(tx)), closers: Mutex::new(Vec::new()), running: AtomicBool::new(true), requests: AtomicU64::new(0), workers: workers as usize });
    STATE.with(|s| *s.borrow_mut() = Some(state.clone()));
    let (deferred, promise) = cx.promise();
    server::spawn(state, host, port as u16, deferred, rx);
    Ok(promise)
}
fn stop(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let (deferred, promise) = cx.promise();
    if let Some(state) = current().filter(|s| s.running.load(Ordering::Acquire)) {
        state.closers.lock().unwrap().push(deferred);
        if let Some(tx) = state.stop.lock().unwrap().take() { let _ = tx.send(()); }
    } else { let value = cx.undefined(); deferred.resolve(&mut cx, value); }
    Ok(promise)
}
fn respond(mut cx: FunctionContext) -> JsResult<JsBoolean> { Ok(cx.boolean(false)) }
fn stats(mut cx: FunctionContext) -> JsResult<JsObject> {
    let result = cx.empty_object();
    let runtime = cx.string("compio");
    result.set(&mut cx, "runtime", runtime)?;
    let state = current();
    let requests = cx.number(state.as_ref().map_or(0, |s| s.requests.load(Ordering::Relaxed)) as f64);
    let workers = cx.number(state.as_ref().map_or(0, |s| s.workers) as f64);
    let zero = cx.number(0);
    result.set(&mut cx, "requests", requests)?;
    result.set(&mut cx, "workers", workers)?;
    result.set(&mut cx, "inFlight", zero)?;
    Ok(result)
}
#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("start", start)?;
    cx.export_function("respond", respond)?;
    cx.export_function("stop", stop)?;
    cx.export_function("stats", stats)?;
    Ok(())
}
