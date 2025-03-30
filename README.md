# Audio Streaming Server

A simple audio streaming server that captures audio from input devices and streams it as MP3 audio.

## Features

- Real-time audio streaming using [Audify](https://github.com/almoghamdani/audify)
- Low-latency audio capture and MP3 encoding
- Device selection and enumeration
- Health check endpoints
- Multiple concurrent client support

## Requirements

- Node.js 14 or higher
- npm or yarn
- Proper audio device drivers

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

## Usage

1. Start the server:

```bash
npm run dev
```

2. The server will start on port 3000 (configurable)

3. Available endpoints:
   - `/stream` - Main streaming endpoint (audio/mpeg)
   - `/health` - Health check endpoint
   - `/devices` - List available audio devices

## Configuration

Configuration settings are located in `audio/src/config.ts`.

Default configuration:

```typescript
{
  port: 3000,
  audioDevice: 'Microphone (NVIDIA Broadcast)',
  channels: 2,
  sampleRate: 44100,
  bitrate: 192,
}
```

## Implementation Details

This project uses:

- **Audify**: Cross-platform library for real-time audio input/output
- **Node-lame**: MP3 encoding for streaming
- **Express**: Web server framework

## License

MIT
