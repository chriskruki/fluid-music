const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { WebSocketServer } = require('ws')
const { v4: uuidv4 } = require('uuid')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Store connected clients
const clients = {
  controllers: new Map(),
  simulators: new Map(),
  beatDetectors: new Map()
}

// Store client settings (color, colorful mode) per controller
const clientSettings = new Map() // clientId -> { color: {r, g, b}, colorful: boolean }

function broadcastToSimulators(message) {
  const messageStr = JSON.stringify(message)
  clients.simulators.forEach((ws) => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(messageStr)
    }
  })
}

function broadcastClientCounts() {
  const counts = {
    type: 'client_counts',
    payload: {
      controllers: clients.controllers.size,
      simulators: clients.simulators.size,
      beatDetectors: clients.beatDetectors.size
    },
    timestamp: Date.now()
  }
  
  const messageStr = JSON.stringify(counts)
  const allClients = [
    ...Array.from(clients.controllers.values()),
    ...Array.from(clients.simulators.values()),
    ...Array.from(clients.beatDetectors.values())
  ]
  
  allClients.forEach((ws) => {
    if (ws.readyState === 1) {
      ws.send(messageStr)
    }
  })
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Create WebSocket server
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws, req) => {
    let clientId = null
    let clientRole = null

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())

        if (message.type === 'connect') {
          const role = message.payload?.role
          if (!['controller', 'simulator', 'beat_detector'].includes(role)) {
            ws.close(1008, 'Invalid role')
            return
          }

          clientId = uuidv4()
          clientRole = role

          // Add to appropriate client map
          clients[role + 's'].set(clientId, ws)

          // Initialize default settings for controllers
          if (role === 'controller') {
            clientSettings.set(clientId, {
              color: { r: 0.0, g: 0.5 * 0.15, b: 1.0 * 0.15 }, // Default blue
              colorful: false
            })
          }

          // Send connection acknowledgment
          ws.send(
            JSON.stringify({
              type: 'connect_ack',
              payload: {
                status: 'success',
                sessionId: clientId,
                connectedClients: {
                  controllers: clients.controllers.size,
                  simulators: clients.simulators.size,
                  beatDetectors: clients.beatDetectors.size
                }
              },
              timestamp: Date.now()
            })
          )

          // Broadcast updated client counts
          broadcastClientCounts()
        } else if (clientId && clientRole) {
          // Handle client settings updates from controllers
          if (message.type === 'client_settings' && clientRole === 'controller') {
            // Update stored settings for this client
            const currentSettings = clientSettings.get(clientId) || {}
            if (message.payload?.color !== undefined) {
              currentSettings.color = message.payload.color
            }
            if (message.payload?.colorful !== undefined) {
              currentSettings.colorful = message.payload.colorful
            }
            clientSettings.set(clientId, currentSettings)
          }
          // Handle input messages from controllers
          else if (message.type === 'input' && clientRole === 'controller') {
            // Get stored settings for this client
            const settings = clientSettings.get(clientId) || { color: undefined, colorful: false }
            const remoteInput = {
              type: 'remote_input',
              payload: {
                ...message.payload,
                controllerId: clientId,
                // Use stored client settings (only include color if not in colorful mode)
                color: settings.colorful ? undefined : settings.color,
                colorful: settings.colorful || false
              },
              timestamp: Date.now()
            }
            broadcastToSimulators(remoteInput)
          }
          // Handle commands from controllers
          else if (message.type === 'command' && clientRole === 'controller') {
            const command = {
              type: 'command',
              payload: {
                ...message.payload,
                controllerId: clientId
              },
              timestamp: Date.now()
            }
            broadcastToSimulators(command)
          }
          // Handle beat events from beat detectors
          else if (message.type === 'beat' && clientRole === 'beat_detector') {
            const beat = {
              type: 'beat',
              payload: {
                ...message.payload,
                beatDetectorId: clientId
              },
              timestamp: Date.now()
            }
            broadcastToSimulators(beat)
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error)
      }
    })

    ws.on('close', () => {
      if (clientId && clientRole) {
        clients[clientRole + 's'].delete(clientId)
        // Clean up client settings when controller disconnects
        if (clientRole === 'controller') {
          clientSettings.delete(clientId)
        }
        broadcastClientCounts()
      }
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
  })

  server
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> WebSocket server ready on ws://${hostname}:${port}/ws`)
    })
})

