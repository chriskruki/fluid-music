# Live Audio Streaming

A lightweight TypeScript application for live audio broadcasting and streaming using WebSockets, Node.js, and the Web Audio API.

## Project Structure

- `server/` - Node.js backend that captures audio from a local device and streams it to clients via WebSockets
- `frontend/` - React frontend for receiving and playing audio from the server

## Requirements

- Node.js (>= 14.x)
- A system with a microphone or other audio input device
- A modern web browser that supports the Web Audio API

## Setup Instructions

### Server Setup

1. Install dependencies:

   ```
   cd server
   npm install
   ```

2. Start the server:
   ```
   npm run dev
   ```

The server will run on http://localhost:8082, with WebSocket service on ws://localhost:8082.

### Frontend Setup

1. Install dependencies:

   ```
   cd frontend
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

The frontend will run on http://localhost:3000.

## How It Works

1. The server captures audio from a configurable device on the server machine
2. When a client connects to the WebSocket server, it receives the audio stream directly
3. The client plays the audio in real-time using the Web Audio API
4. No media files are downloaded - everything happens via direct streaming

## Server Configuration

The server supports configuration of:

- Audio device selection
- Sample rate
- Channel count
- Bit depth

To adjust these settings, modify the file at `server/config/config.json` or use the API endpoints:

- GET /api/devices - List available audio devices
- GET /api/config - Get current configuration
- POST /api/config - Update configuration

## License

ISC
