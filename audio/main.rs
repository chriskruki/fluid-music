use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc;
use warp::Filter;

#[tokio::main]
async fn main() {
    // Shared buffer for audio data
    let audio_data = Arc::new(Mutex::new(Vec::new()));

    // Start capturing audio
    let audio_data_clone = audio_data.clone();
    tokio::spawn(async move {
        capture_audio(audio_data_clone).unwrap();
    });

    // Start the HTTP server
    start_http_server(audio_data).await;
}

fn capture_audio(audio_data: Arc<Mutex<Vec<u8>>>) -> Result<(), Box<dyn std::error::Error>> {
    // Initialize audio host and default input device
    let host = cpal::default_host();
    let device = host.default_input_device().expect("No input device available");
    let config = device.default_input_config()?;

    // Configure audio stream
    let audio_data = audio_data.clone();
    let stream = device.build_input_stream(
        &config.into(),
        move |data: &[f32], _: &cpal::InputCallbackInfo| {
            // Convert audio samples to bytes and store in shared buffer
            let mut audio_buffer = audio_data.lock().unwrap();
            for &sample in data {
                audio_buffer.extend_from_slice(&sample.to_le_bytes());
            }
        },
        |err| {
            eprintln!("Error occurred in audio stream: {}", err);
        },
    )?;

    // Start streaming
    stream.play()?;
    println!("Audio capture started!");
    std::thread::park(); // Keep the thread alive for audio capture
    Ok(())
}

async fn start_http_server(audio_data: Arc<Mutex<Vec<u8>>>) {
    // Define an HTTP route for streaming audio
    let stream_route = warp::path("stream")
        .map(move || {
            let audio_data = audio_data.clone();
            warp::sse::reply(warp::sse::keep_alive().stream(async_stream::stream! {
                loop {
                    // Get the latest audio data
                    let mut buffer = audio_data.lock().unwrap();
                    if !buffer.is_empty() {
                        let chunk = buffer.clone();
                        buffer.clear(); // Clear the buffer after sending
                        yield Ok::<_, warp::Error>(warp::sse::data(chunk));
                    }
                    tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
                }
            }))
        });

    // Run the server on port 3030
    println!("Server running at http://<your-ip>:3030/stream");
    warp::serve(stream_route).run(([0, 0, 0, 0], 3030)).await;
}
