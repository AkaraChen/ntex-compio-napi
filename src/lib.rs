use neon::prelude::*;
fn stats(mut cx: FunctionContext) -> JsResult<JsObject> {
    let result = cx.empty_object();
    let runtime = cx.string("compio");
    result.set(&mut cx, "runtime", runtime)?;
    Ok(result)
}
#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("stats", stats)?;
    Ok(())
}
