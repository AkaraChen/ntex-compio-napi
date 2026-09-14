use futures_channel::oneshot;
use neon::{event::Channel, prelude::*, types::Deferred};
use std::sync::{atomic::{AtomicBool, AtomicU64}, Mutex};

pub struct State {
    pub channel: Mutex<Option<Channel>>,
    pub dispatch: Mutex<Option<Root<JsFunction>>>,
    pub stop: Mutex<Option<oneshot::Sender<()>>>,
    pub closers: Mutex<Vec<Deferred>>,
    pub running: AtomicBool,
    pub requests: AtomicU64,
    pub workers: usize,
}
