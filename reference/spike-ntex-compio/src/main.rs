// Spike: prove ntex's web HttpServer actually serves requests when the
// `compio` runtime feature is selected (i.e. NOT tokio).
//
// Success = process starts, binds 127.0.0.1:18711, answers GET /hello and
// POST /echo (body read), twice in a row (keep-alive + repeated accept).

use ntex::web;

#[ntex::main]
async fn main() -> std::io::Result<()> {
    println!("[spike] ntex HttpServer starting on 127.0.0.1:18711");
    web::HttpServer::new(async || {
        web::App::new()
            .route(
                "/hello",
                web::get().to(|| async { "hello from ntex on compio\n" }),
            )
            .route(
                "/echo",
                web::post().to(|mut body: web::types::Payload| async move {
                    let mut n = 0usize;
                    while let Some(chunk) = body.recv().await {
                        match chunk {
                            Ok(b) => n += b.len(),
                            Err(_) => break,
                        }
                    }
                    format!("echo:{n}\n")
                }),
            )
    })
    .bind("127.0.0.1:18711")?
    .workers(1)
    .run()
    .await
}
