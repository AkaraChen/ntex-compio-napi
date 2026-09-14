mod bridge;
mod server;
use bridge::{Response, State};
use futures_channel::oneshot;
use neon::prelude::*;
use neon::types::buffer::TypedArray;
use ntex::http::{
    header::{HeaderName, HeaderValue},
    StatusCode,
};
use std::{
    cell::RefCell,
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Arc, Mutex,
    },
};

thread_local! { static STATE: RefCell<Option<Arc<State>>> = const { RefCell::new(None) }; }
fn current() -> Option<Arc<State>> {
    STATE.with(|s| s.borrow().clone())
}

fn start(mut cx: FunctionContext) -> JsResult<JsPromise> {
    if current().is_some_and(|s| s.running.load(Ordering::Acquire)) {
        return cx.throw_error("server already running");
    }
    let options = cx.argument::<JsObject>(0)?;
    let dispatch = cx.argument::<JsFunction>(1)?;
    let host: Handle<JsString> = options.get(&mut cx, "host")?;
    let host = host.value(&mut cx);
    let port: Handle<JsNumber> = options.get(&mut cx, "port")?;
    let port = port.value(&mut cx);
    if !port.is_finite() || port.fract() != 0.0 || !(1.0..=65535.0).contains(&port) {
        return cx.throw_range_error("port must be an integer in 1..65535");
    }
    let workers = options
        .get_opt::<JsNumber, _, _>(&mut cx, "workers")?
        .map(|v| v.value(&mut cx))
        .unwrap_or(1.0);
    if !workers.is_finite() || workers.fract() != 0.0 || !(1.0..=64.0).contains(&workers) {
        return cx.throw_range_error("workers must be an integer in 1..64");
    }
    let timeout = options
        .get_opt::<JsNumber, _, _>(&mut cx, "timeoutMs")?
        .map(|v| v.value(&mut cx))
        .unwrap_or(30_000.0);
    if !timeout.is_finite() || timeout.fract() != 0.0 || !(1.0..=600_000.0).contains(&timeout) {
        return cx.throw_range_error("timeoutMs must be an integer in 1..600000");
    }
    let max_body_bytes = options
        .get_opt::<JsNumber, _, _>(&mut cx, "maxBodyBytes")?
        .map(|v| v.value(&mut cx))
        .unwrap_or(1048576.0);
    if !max_body_bytes.is_finite()
        || max_body_bytes.fract() != 0.0
        || !(1.0..=1073741824.0).contains(&max_body_bytes)
    {
        return cx.throw_range_error("maxBodyBytes must be an integer in 1..1073741824");
    }
    let max_in_flight = options
        .get_opt::<JsNumber, _, _>(&mut cx, "maxInFlight")?
        .map(|v| v.value(&mut cx))
        .unwrap_or(1024.0);
    if !max_in_flight.is_finite()
        || max_in_flight.fract() != 0.0
        || !(1.0..=1000000.0).contains(&max_in_flight)
    {
        return cx.throw_range_error("maxInFlight must be an integer in 1..1000000");
    }
    let max_queued = options
        .get_opt::<JsNumber, _, _>(&mut cx, "maxQueued")?
        .map(|v| v.value(&mut cx))
        .unwrap_or(0.0);
    if !max_queued.is_finite()
        || max_queued.fract() != 0.0
        || !(0.0..=1000000.0).contains(&max_queued)
    {
        return cx.throw_range_error("maxQueued must be an integer in 0..1000000");
    }
    let (tx, rx) = oneshot::channel();
    let state = Arc::new(State {
        channel: Mutex::new(Some(cx.channel())),
        dispatch: Mutex::new(Some(dispatch.root(&mut cx))),
        stop: Mutex::new(Some(tx)),
        closers: Mutex::new(Vec::new()),
        running: AtomicBool::new(true),
        requests: AtomicU64::new(0),
        workers: workers as usize,
        timeout_ms: timeout as u32,
        timed_out: AtomicU64::new(0),
        pending: Mutex::new(bridge::Pending::default()),
        max_body_bytes: max_body_bytes as usize,
        max_in_flight: max_in_flight as usize,
        max_queued: max_queued as usize,
        rejected413: AtomicU64::new(0),
        rejected503: AtomicU64::new(0),
    });
    STATE.with(|s| *s.borrow_mut() = Some(state.clone()));
    let (deferred, promise) = cx.promise();
    server::spawn(state, host, port as u16, deferred, rx);
    Ok(promise)
}
fn stop(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let (deferred, promise) = cx.promise();
    if let Some(state) = current().filter(|s| s.running.load(Ordering::Acquire)) {
        state.closers.lock().unwrap().push(deferred);
        if let Some(tx) = state.stop.lock().unwrap().take() {
            let _ = tx.send(());
        }
    } else {
        let value = cx.undefined();
        deferred.resolve(&mut cx, value);
    }
    Ok(promise)
}
fn respond(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let id = cx.argument::<JsString>(0)?.value(&mut cx);
    let Ok(id) = id.parse::<u64>() else {
        return cx.throw_type_error("id must be a decimal u64 string");
    };
    let status = cx.argument::<JsNumber>(1)?.value(&mut cx);
    if !status.is_finite() || status.fract() != 0.0 || !(200.0..=599.0).contains(&status) {
        return cx.throw_range_error("status must be an integer in 200..599");
    }
    let input = cx.argument::<JsObject>(2)?;
    let mut pairs = Vec::new();
    if let Ok(array) = input.downcast::<JsArray, _>(&mut cx) {
        for value in array.to_vec(&mut cx)? {
            let pair = value.downcast_or_throw::<JsArray, _>(&mut cx)?;
            let name: Handle<JsString> = pair.get(&mut cx, 0)?;
            let value: Handle<JsString> = pair.get(&mut cx, 1)?;
            pairs.push((name.value(&mut cx), value.value(&mut cx)));
        }
    } else {
        for key in input.get_own_property_names(&mut cx)?.to_vec(&mut cx)? {
            let key = key.to_string(&mut cx)?.value(&mut cx);
            let value: Handle<JsString> = input.get(&mut cx, key.as_str())?;
            pairs.push((key, value.value(&mut cx)));
        }
    }
    let mut headers = Vec::new();
    for (name, value) in pairs {
        let (Ok(name), Ok(value)) = (
            HeaderName::from_bytes(name.as_bytes()),
            HeaderValue::from_bytes(value.as_bytes()),
        ) else {
            return cx.throw_type_error("invalid HTTP header");
        };
        headers.push((name, value));
    }
    let body = cx.argument::<JsValue>(3)?;
    let body = if let Ok(buffer) = body.downcast::<JsBuffer, _>(&mut cx) {
        buffer.as_slice(&cx).to_vec()
    } else {
        body.downcast_or_throw::<JsString, _>(&mut cx)?
            .value(&mut cx)
            .into_bytes()
    };
    let accepted = current().is_some_and(|state| {
        state.complete(
            id,
            Response {
                status: StatusCode::from_u16(status as u16).unwrap(),
                headers,
                body,
            },
        )
    });
    Ok(cx.boolean(accepted))
}
fn stats(mut cx: FunctionContext) -> JsResult<JsObject> {
    let result = cx.empty_object();
    let runtime = cx.string("compio");
    result.set(&mut cx, "runtime", runtime)?;
    let state = current();
    let requests = cx.number(
        state
            .as_ref()
            .map_or(0, |s| s.requests.load(Ordering::Relaxed)) as f64,
    );
    let workers = cx.number(state.as_ref().map_or(0, |s| s.workers) as f64);
    let (in_flight, peak, queued) = state.as_ref().map_or((0, 0, 0), |s| {
        let pending = s.pending.lock().unwrap();
        (pending.active.len(), pending.peak, pending.queued.len())
    });
    let in_flight = cx.number(in_flight as f64);
    let timed_out = cx.number(
        state
            .as_ref()
            .map_or(0, |s| s.timed_out.load(Ordering::Relaxed)) as f64,
    );
    result.set(&mut cx, "requests", requests)?;
    result.set(&mut cx, "workers", workers)?;
    result.set(&mut cx, "inFlight", in_flight)?;
    result.set(&mut cx, "timedOut", timed_out)?;
    for (name, value) in [
        ("peakInFlight", peak as u64),
        ("queued", queued as u64),
        (
            "maxBodyBytes",
            state.as_ref().map_or(1048576, |s| s.max_body_bytes) as u64,
        ),
        (
            "maxInFlight",
            state.as_ref().map_or(1024, |s| s.max_in_flight) as u64,
        ),
        (
            "maxQueued",
            state.as_ref().map_or(0, |s| s.max_queued) as u64,
        ),
        (
            "rejected413",
            state
                .as_ref()
                .map_or(0, |s| s.rejected413.load(Ordering::Relaxed)),
        ),
        (
            "rejected503",
            state
                .as_ref()
                .map_or(0, |s| s.rejected503.load(Ordering::Relaxed)),
        ),
    ] {
        let value = cx.number(value as f64);
        result.set(&mut cx, name, value)?;
    }
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
