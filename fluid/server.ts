import express from 'express'
import http from 'http'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { WebSocket, WebSocketServer } from 'ws'

// Create Express app
const app = express()
const PORT = process.env.PORT || 3000

// Create HTTP server
const server = http.createServer(app)

// Create WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' })

// Define client types
type ClientRole = 'controller' | 'simulator' | 'beat_detector'

interface ClientMap {
  controllers: Map<string, WebSocket>
  simulators: Map<string, WebSocket>
  beatDetectors: Map<string, WebSocket>
}

// Store connected clients
const clients: ClientMap = {
  controllers: new Map(),
  simulators: new Map(),
  beatDetectors: new Map()
}

// Message interfaces
interface BaseMessage {
  type: string
  payload: any
  timestamp?: number
}

interface ConnectMessage extends BaseMessage {
  type: 'connect'
  payload: {
    role: ClientRole
  }
}

interface ConnectAckMessage extends BaseMessage {
  type: 'connect_ack'
  payload: {
    status: 'success' | 'error'
    sessionId: string
    connectedClients: {
      controllers: number
      simulators: number
      beatDetectors: number
    }
  }
}

interface InputMessage extends BaseMessage {
  type: 'input'
  payload: {
    eventType: 'mousedown' | 'mousemove' | 'mouseup'
    position: {
      x: number
      y: number
    }
    controllerId?: string
  }
}

interface RemoteInputMessage extends BaseMessage {
  type: 'remote_input'
  payload: {
    eventType: 'mousedown' | 'mousemove' | 'mouseup'
    position: {
      x: number
      y: number
    }
    controllerId: string
  }
}

interface CommandMessage extends BaseMessage {
  type: 'command'
  payload: {
    command: 'random_splats' | 'clear' | 'preset_pattern' | 'set_rainbow_mode' | 'set_splat_color'
    parameters?: {
      count?: number
      patternName?: string
      enabled?: boolean
      color?: string
    }
    controllerId?: string
  }
}

interface ClientCountsMessage extends BaseMessage {
  type: 'client_counts'
  payload: {
    controllers: number
    simulators: number
    beatDetectors: number
  }
}

interface BeatMessage extends BaseMessage {
  type: 'beat'
  payload: {
    intensity: number
    beatDetectorId?: string
  }
}

type Message =
  | ConnectMessage
  | ConnectAckMessage
  | InputMessage
  | RemoteInputMessage
  | CommandMessage
  | ClientCountsMessage
  | BeatMessage

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket) => {
  // Generate session ID for this connection
  const sessionId = uuidv4()
  let clientRole: ClientRole | null = null

  console.log(`New client connected: ${sessionId}`)

  // Handle messages from clients
  ws.on('message', (messageData: Buffer | ArrayBuffer | Buffer[]) => {
    try {
      const message = JSON.parse(messageData.toString()) as Message

      // Process different message types
      switch (message.type) {
        case 'connect':
          handleConnect(ws, message as ConnectMessage, sessionId)
          clientRole = (message as ConnectMessage).payload.role
          break

        case 'input':
          handleInput(ws, message as InputMessage, sessionId)
          break

        case 'command':
          handleCommand(ws, message as CommandMessage, sessionId)
          break

        case 'beat':
          handleBeat(ws, message as BeatMessage, sessionId)
          break

        default:
          console.warn(`Unknown message type: ${message.type}`)
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error)
    }
  })

  // Handle client disconnection
  ws.on('close', () => {
    console.log(`Client disconnected: ${sessionId}`)

    // Remove from appropriate client list
    if (clientRole === 'controller') {
      clients.controllers.delete(sessionId)
    } else if (clientRole === 'simulator') {
      clients.simulators.delete(sessionId)
    } else if (clientRole === 'beat_detector') {
      clients.beatDetectors.delete(sessionId)
    }

    // Broadcast updated counts
    broadcastClientCounts()
  })
})

// Handle client connection
function handleConnect(ws: WebSocket, message: ConnectMessage, sessionId: string): void {
  const { role } = message.payload

  // Add to appropriate client list
  if (role === 'controller') {
    clients.controllers.set(sessionId, ws)
    console.log(`Controller connected: ${sessionId}`)
  } else if (role === 'simulator') {
    clients.simulators.set(sessionId, ws)
    console.log(`Simulator connected: ${sessionId}`)
  } else if (role === 'beat_detector') {
    clients.beatDetectors.set(sessionId, ws)
    console.log(`Beat detector connected: ${sessionId}`)
  }

  // Send acknowledgment
  sendMessage(ws, {
    type: 'connect_ack',
    payload: {
      status: 'success',
      sessionId,
      connectedClients: {
        controllers: clients.controllers.size,
        simulators: clients.simulators.size,
        beatDetectors: clients.beatDetectors.size
      }
    },
    timestamp: Date.now()
  } as ConnectAckMessage)

  // Broadcast updated counts to all clients
  broadcastClientCounts()
}

// Handle input events from controllers
function handleInput(ws: WebSocket, message: InputMessage, sessionId: string): void {
  // Add the controller ID and timestamp to the message
  const remoteMessage: RemoteInputMessage = {
    type: 'remote_input',
    payload: {
      ...message.payload,
      controllerId: sessionId
    },
    timestamp: Date.now()
  }

  // Broadcast to all simulators
  broadcastToSimulators(remoteMessage)
}

// Handle command events from controllers
function handleCommand(ws: WebSocket, message: CommandMessage, sessionId: string): void {
  // Add the controller ID and timestamp to the message
  const remoteMessage: CommandMessage = {
    type: 'command',
    payload: {
      ...message.payload,
      controllerId: sessionId
    },
    timestamp: Date.now()
  }

  // Broadcast to all simulators
  broadcastToSimulators(remoteMessage)
}

// Handle beat events from beat detectors
function handleBeat(ws: WebSocket, message: BeatMessage, sessionId: string): void {
  // Add the beat detector ID and timestamp to the message
  const beatMessage: BeatMessage = {
    type: 'beat',
    payload: {
      ...message.payload,
      beatDetectorId: sessionId
    },
    timestamp: Date.now()
  }

  // Broadcast to all simulators
  broadcastToSimulators(beatMessage)
}

// Broadcast message to all simulator clients
function broadcastToSimulators(message: Message): void {
  clients.simulators.forEach((client) => {
    if (isSocketOpen(client)) {
      sendMessage(client, message)
    }
  })
}

// Broadcast client counts to all clients
function broadcastClientCounts(): void {
  const countMessage: ClientCountsMessage = {
    type: 'client_counts',
    payload: {
      controllers: clients.controllers.size,
      simulators: clients.simulators.size,
      beatDetectors: clients.beatDetectors.size
    },
    timestamp: Date.now()
  }

  // Send to all clients
  ;[
    ...clients.controllers.values(),
    ...clients.simulators.values(),
    ...clients.beatDetectors.values()
  ].forEach((client) => {
    if (isSocketOpen(client)) {
      sendMessage(client, countMessage)
    }
  })
}

// Helper function to check if WebSocket is open
function isSocketOpen(client: WebSocket): boolean {
  return client.readyState === WebSocket.OPEN
}

// Helper function to send a message
function sendMessage(client: WebSocket, message: Message): void {
  if (isSocketOpen(client)) {
    client.send(JSON.stringify(message))
  }
}

// Log current directory and resolved paths
console.log('Current directory:', __dirname)

// Resolve paths relative to the server's location
// In dev mode, files are in dist/public, in production they're in public
const publicDir = path.join(__dirname, 'dist', 'public')
const staticDir = path.join(__dirname, 'static')

console.log('Public directory:', publicDir)
console.log('Static directory:', staticDir)

// Serve static files from the public directory
app.use(express.static(publicDir))

// Serve static files from the static directory
app.use('/static', express.static(staticDir))

// Route to handle control page
app.get('/control', (req, res) => {
  res.sendFile(path.join(publicDir, 'control.html'))
})

// Route to handle beat detector page
app.get('/beat-detector', (req, res) => {
  res.sendFile(path.join(publicDir, 'beat-detector.html'))
})

// Route to handle main page
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'))
})

// Start the server
server.listen(PORT, () => {
  console.log(`Simulator - http://localhost:${PORT}`)
  console.log(`Controller - http://localhost:${PORT}/control`)
  console.log(`Beat Detector - http://localhost:${PORT}/beat-detector`)
})
