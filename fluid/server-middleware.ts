import http from 'http'
import { WebSocket, WebSocketServer } from 'ws'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import type { Connect } from 'vite'

// Define client types
type ClientRole = 'controller' | 'simulator'

interface ClientMap {
  controllers: Map<string, WebSocket>
  simulators: Map<string, WebSocket>
}

// Store connected clients
const clients: ClientMap = {
  controllers: new Map(),
  simulators: new Map()
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
    command: 'random_splats' | 'clear' | 'preset_pattern'
    parameters?: {
      count?: number
      patternName?: string
    }
    controllerId?: string
  }
}

interface ClientCountsMessage extends BaseMessage {
  type: 'client_counts'
  payload: {
    controllers: number
    simulators: number
  }
}

type Message =
  | ConnectMessage
  | ConnectAckMessage
  | InputMessage
  | RemoteInputMessage
  | CommandMessage
  | ClientCountsMessage

// Setup server with Vite middleware
export function setupServer(app: Connect.Server): http.Server {
  const server = http.createServer()

  // Create WebSocket server
  const wss = new WebSocketServer({ server, path: '/ws' })

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
      }

      // Broadcast updated counts
      broadcastClientCounts()
    })
  })

  // Server should be able to upgrade connections
  app.use((req, res, next) => {
    // For WebSocket handshake
    if (req.headers.upgrade === 'websocket' && req.url?.startsWith('/ws')) {
      // Store the WebSocket handshake info to handle later
      const { socket, head } = req as any
      wss.handleUpgrade(req, socket, head || Buffer.alloc(0), (ws) => {
        wss.emit('connection', ws, req)
      })
      return
    }
    next()
  })

  return server
}

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
  }

  // Send acknowledgment
  sendMessage(ws, {
    type: 'connect_ack',
    payload: {
      status: 'success',
      sessionId,
      connectedClients: {
        controllers: clients.controllers.size,
        simulators: clients.simulators.size
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

// Broadcast message to all simulator clients
function broadcastToSimulators(message: Message): void {
  clients.simulators.forEach((client) => {
    if (isSocketOpen(client)) {
      sendMessage(client, message)
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

// Broadcast client counts to all clients
function broadcastClientCounts(): void {
  const countMessage: ClientCountsMessage = {
    type: 'client_counts',
    payload: {
      controllers: clients.controllers.size,
      simulators: clients.simulators.size
    },
    timestamp: Date.now()
  }

  // Send to all clients
  ;[...clients.controllers.values(), ...clients.simulators.values()].forEach((client) => {
    if (isSocketOpen(client)) {
      sendMessage(client, countMessage)
    }
  })
}
