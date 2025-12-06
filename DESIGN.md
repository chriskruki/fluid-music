# Live Audio Streaming - Design Document

## Overview

The live-audio project is a TypeScript application that enables real-time audio streaming from a server-side microphone to browser clients via WebSockets. The system consists of two main components: a Node.js server that captures audio from the local device, and a React frontend that receives and plays the audio stream.

## Architecture

### System Components

1. **Server (`server/`)**

   - Node.js backend using Express and WebSocket
   - Captures audio from local microphone using `node-microphone`
   - Streams raw PCM audio data to connected clients via WebSocket
   - Manages audio device configuration

2. **Frontend (`frontend/`)**
   - React application built with Vite
   - Receives audio stream via WebSocket
   - Plays audio using Web Audio API
   - Provides UI for connection management and volume control

## Current Implementation Details

### Server Architecture

#### Audio Capture

- **Library**: `node-microphone` (requires SoX on macOS/Windows, ALSA on Linux)
- **Configuration**: JSON file at `server/config/config.json`
  - `deviceName`: Audio device identifier (default: "default")
  - `sampleRate`: 44100 Hz
  - `channels`: 1 (mono)
  - `bitDepth`: 16 bits

#### WebSocket Server

- **Port**: 8082
- **Protocol**: Binary PCM data streaming
- **Connection Management**:
  - Microphone starts when first client connects
  - Microphone stops when last client disconnects
  - Sends initial config message to new clients

#### API Endpoints

- `GET /api/devices`: Returns list of available audio devices (currently placeholder)
- `GET /api/config`: Returns current audio configuration
- `POST /api/config`: Updates configuration and restarts microphone if active

#### Data Flow

```
Microphone (node-microphone)
    ↓
PCM Audio Buffer (16-bit, mono, 44.1kHz)
    ↓
WebSocket Broadcast (binary)
    ↓
All Connected Clients
```

### Frontend Architecture

#### Audio Player Component (`AudioPlayer.tsx`)

- **Connection**: WebSocket client connecting to `ws://localhost:8082`
- **Audio Processing**:
  1. Receives binary PCM data via WebSocket
  2. Converts Int16Array to Float32Array (normalized to -1.0 to 1.0)
  3. Buffers audio chunks
  4. Creates AudioBuffer from combined chunks
  5. Plays via AudioBufferSourceNode → GainNode → AudioContext.destination

#### Audio Recorder Component (`AudioRecorder.tsx`)

- **Purpose**: Client-side microphone recording (not currently used in main flow)
- **Implementation**: Uses MediaRecorder API to capture audio and send to server
- **Note**: This component exists but is not integrated into the main streaming flow

#### State Management

- Connection status tracking
- Error handling and display
- Volume control via GainNode

## Limitations and Issues

### Current Limitations

1. **Device Enumeration**: The `/api/devices` endpoint returns hardcoded placeholder data. Real device enumeration would require platform-specific APIs.

2. **No Audio Analysis**: The current implementation only streams and plays audio. There's no frequency analysis, beat detection, or FFT processing.

3. **No Client-Side Analysis**: The frontend receives audio but doesn't analyze it for frequency bands or intensity.

4. **Single Device Support**: Only one microphone device can be active at a time on the server.

5. **No Frequency Band Detection**: No separation of low/mid/high frequency bands or intensity calculation.

6. **Limited Error Recovery**: Basic error handling with automatic restart attempts, but no sophisticated retry logic.

### Platform Dependencies

- **macOS**: Requires SoX (`brew install sox`)
- **Windows**: Requires SoX in PATH
- **Linux**: Requires ALSA tools (`alsa-utils`)

## Data Formats

### WebSocket Messages

**Binary Audio Data**:

- Raw PCM samples as Buffer
- 16-bit signed integers
- Mono channel
- 44.1kHz sample rate

**JSON Control Messages**:

```json
{
  "type": "config",
  "data": {
    "deviceName": "default",
    "sampleRate": 44100,
    "channels": 1,
    "bitDepth": 16
  }
}
```

### Audio Buffer Conversion

**Server → Client**:

- Server: 16-bit PCM integers (-32768 to 32767)
- Client: Float32Array normalized to (-1.0 to 1.0)
- Conversion: `floatValue = int16Value / 32768.0`

## Use Cases

1. **Live Audio Broadcasting**: Server captures microphone input and streams to multiple clients
2. **Remote Audio Monitoring**: Clients can listen to audio from a remote server
3. **Multi-client Audio Distribution**: Single audio source distributed to multiple listeners

## Future Improvements Needed

1. **Frequency Analysis**: Add FFT-based frequency band analysis (low/mid/high)
2. **Beat Detection**: Implement beat detection algorithms similar to butterchurn
3. **Client-Side Analysis**: Move analysis to client-side using Web Audio API AnalyserNode
4. **Device Selection**: Implement proper device enumeration and selection
5. **Real-time Visualization**: Add frequency spectrum visualization
6. **Hit Detection**: Detect intensity peaks in frequency bands and emit "hit" events
7. **Better Error Handling**: More robust error recovery and user feedback

## References

- **Butterchurn**: WebGL implementation of Milkdrop visualizer that uses Web Audio API for frequency analysis
- **ChromeAudioVisualizerExtension**: Browser extension that analyzes audio frequencies using AnalyserNode and FFT
