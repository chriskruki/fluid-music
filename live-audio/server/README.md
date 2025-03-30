# Live Audio Streaming Server

A Node.js server that captures audio from a local device and streams it to clients via WebSockets.

## Features

- Audio capture from configurable local devices
- WebSocket server for streaming audio data to clients
- REST API for device selection and configuration
- Automatic start/stop of audio capture based on client connections

## Requirements

- Node.js >= 14.x
- A system with a microphone or other audio input device
- node-microphone compatible system (Windows, macOS, Linux)

## Quick Start

1. Install dependencies:

   ```
   npm install
   ```

2. Start the server:

   ```
   npm run dev
   ```

3. The server will listen on port 8082 and WebSocket connections on the same port

## API Endpoints

- `GET /api/devices` - List available audio devices
- `GET /api/config` - Get current audio configuration
- `POST /api/config` - Update audio configuration

## WebSocket Protocol

- Connect to `ws://localhost:8082` to start receiving audio data
- Audio is streamed as raw PCM data in 16-bit format
- Text messages sent from the server are JSON formatted and may include configuration information

## Configuration

The server uses the following default configuration (stored in `config/config.json`):

- Device name: 'default'
- Sample rate: 44100 Hz
- Channels: 1 (mono)
- Bit depth: 16
