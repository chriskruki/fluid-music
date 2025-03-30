// DOM Elements
let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D | null
let connectionDot: HTMLElement
let connectionStatus: HTMLElement
let instructions: HTMLElement

// WebSocket connection
let socket: WebSocket | null = null
let isConnected = false
let clientId: string | null = null

/**
 * Initialize the control interface elements
 */
function initElements(): void {
  canvas = document.getElementById('control-canvas') as HTMLCanvasElement
  ctx = canvas.getContext('2d')
  connectionDot = document.getElementById('connection-dot') as HTMLElement
  connectionStatus = document.getElementById('connection-status') as HTMLElement
  instructions = document.getElementById('instructions') as HTMLElement

  // Initialize pattern buttons
  document.getElementById('random-splats')?.addEventListener('click', sendRandomSplats)
  document.getElementById('pattern-right')?.addEventListener('click', () => sendPattern('right'))
  document.getElementById('pattern-left')?.addEventListener('click', () => sendPattern('left'))
  document.getElementById('pattern-up')?.addEventListener('click', () => sendPattern('up'))
  document.getElementById('pattern-down')?.addEventListener('click', () => sendPattern('down'))
  document
    .getElementById('pattern-corners')
    ?.addEventListener('click', () => sendPattern('corners'))

  // Setup canvas event listeners
  setupCanvasEvents()

  // Handle window resize
  window.addEventListener('resize', resizeCanvas)
}

/**
 * Resize canvas to fill container
 */
function resizeCanvas(): void {
  if (!canvas) return

  const container = document.getElementById('canvas-container')
  if (!container) return

  canvas.width = container.clientWidth
  canvas.height = container.clientHeight
}

/**
 * Initialize WebSocket connection
 */
function initWebSocket(): void {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/ws`

  socket = new WebSocket(wsUrl)

  socket.onopen = handleSocketOpen
  socket.onmessage = handleSocketMessage
  socket.onclose = handleSocketClose
  socket.onerror = handleSocketError
}

/**
 * Handle WebSocket open event
 */
function handleSocketOpen(): void {
  console.log('WebSocket connection established')
  isConnected = true
  updateConnectionStatus(true)

  // Send initial connection message
  sendMessage({
    type: 'connect',
    payload: {
      role: 'controller'
    }
  })
}

/**
 * Handle incoming WebSocket messages
 */
function handleSocketMessage(event: MessageEvent): void {
  try {
    const message = JSON.parse(event.data)

    switch (message.type) {
      case 'connect_ack':
        clientId = message.payload.sessionId
        console.log(`Connected with ID: ${clientId}`)
        connectionStatus.textContent = `Connected (Controllers: ${message.payload.connectedClients.controllers}, Simulators: ${message.payload.connectedClients.simulators})`
        break

      case 'client_counts':
        connectionStatus.textContent = `Connected (Controllers: ${message.payload.controllers}, Simulators: ${message.payload.simulators})`
        break

      default:
        console.log('Received message:', message)
    }
  } catch (error) {
    console.error('Error processing message:', error)
  }
}

/**
 * Handle WebSocket close event
 */
function handleSocketClose(): void {
  console.log('WebSocket connection closed')
  isConnected = false
  updateConnectionStatus(false)

  // Attempt to reconnect after delay
  setTimeout(initWebSocket, 5000)
}

/**
 * Handle WebSocket error
 */
function handleSocketError(error: Event): void {
  console.error('WebSocket error:', error)
  isConnected = false
  updateConnectionStatus(false)
}

/**
 * Update connection status UI
 */
function updateConnectionStatus(connected: boolean): void {
  if (connected) {
    connectionDot.classList.add('connected')
    connectionStatus.textContent = 'Connected'
  } else {
    connectionDot.classList.remove('connected')
    connectionStatus.textContent = 'Disconnected'
  }
}

/**
 * Send message to server
 */
function sendMessage(message: any): void {
  if (socket && isConnected) {
    socket.send(JSON.stringify(message))
  }
}

/**
 * Get normalized coordinates from mouse/touch event
 */
function getNormalizedCoordinates(event: MouseEvent | Touch): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width
  const y = (event.clientY - rect.top) / rect.height
  return { x, y }
}

/**
 * Set up canvas event listeners
 */
function setupCanvasEvents(): void {
  // Initialize pointers for multi-touch
  const pointers = new Map()

  // Mouse event handlers
  canvas.addEventListener('mousedown', (e: MouseEvent) => {
    const position = getNormalizedCoordinates(e)

    sendMessage({
      type: 'input',
      payload: {
        eventType: 'mousedown',
        position
      }
    })

    // Hide instructions after first interaction
    instructions.classList.add('hidden')
  })

  canvas.addEventListener('mousemove', (e: MouseEvent) => {
    if (e.buttons !== 1) return // Only send when button is pressed

    const position = getNormalizedCoordinates(e)

    sendMessage({
      type: 'input',
      payload: {
        eventType: 'mousemove',
        position
      }
    })
  })

  canvas.addEventListener('mouseup', (e: MouseEvent) => {
    const position = getNormalizedCoordinates(e)

    sendMessage({
      type: 'input',
      payload: {
        eventType: 'mouseup',
        position
      }
    })
  })

  // Touch event handlers
  canvas.addEventListener('touchstart', (e: TouchEvent) => {
    e.preventDefault()

    Array.from(e.changedTouches).forEach((touch) => {
      const position = getNormalizedCoordinates(touch)
      pointers.set(touch.identifier, position)

      sendMessage({
        type: 'input',
        payload: {
          eventType: 'mousedown',
          position
        }
      })
    })

    // Hide instructions after first interaction
    instructions.classList.add('hidden')
  })

  canvas.addEventListener('touchmove', (e: TouchEvent) => {
    e.preventDefault()

    Array.from(e.changedTouches).forEach((touch) => {
      const position = getNormalizedCoordinates(touch)
      pointers.set(touch.identifier, position)

      sendMessage({
        type: 'input',
        payload: {
          eventType: 'mousemove',
          position
        }
      })
    })
  })

  canvas.addEventListener('touchend', (e: TouchEvent) => {
    e.preventDefault()

    Array.from(e.changedTouches).forEach((touch) => {
      const position = getNormalizedCoordinates(touch)
      pointers.delete(touch.identifier)

      sendMessage({
        type: 'input',
        payload: {
          eventType: 'mouseup',
          position
        }
      })
    })
  })
}

/**
 * Send random splats command
 */
function sendRandomSplats(): void {
  sendMessage({
    type: 'command',
    payload: {
      command: 'random_splats',
      parameters: {
        count: 10
      }
    }
  })
}

/**
 * Send pattern command
 */
function sendPattern(patternName: string): void {
  sendMessage({
    type: 'command',
    payload: {
      command: 'preset_pattern',
      parameters: {
        patternName
      }
    }
  })
}

/**
 * Initialize the control interface
 */
function initialize(): void {
  initElements()
  resizeCanvas()
  initWebSocket()
}

// Initialize on load
window.addEventListener('load', initialize)

export {}
