# Live Audio Streaming Frontend

This is a React frontend for receiving and playing audio streamed from the server via WebSockets.

## Features

- Direct WebSocket connection to audio stream
- Real-time audio playback using the Web Audio API
- Volume control
- Simple, user-friendly interface for connection management

## Requirements

- Node.js >= 14.x
- A modern web browser that supports the Web Audio API

## Quick Start

1. Install dependencies:

   ```
   npm install
   ```

2. Start the development server:

   ```
   npm run dev
   ```

3. Open your browser and navigate to http://localhost:3000

## How It Works

1. The application connects to the server via WebSocket
2. Audio data is received in real-time as binary data
3. The Web Audio API processes and plays the audio stream
4. No media files are downloaded - everything happens via direct streaming

## Note

Make sure the server is running at http://localhost:8082 before attempting to connect to the audio stream.
