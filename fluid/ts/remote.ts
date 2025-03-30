// remote.ts - Handles remote WebSocket control events

import { PointerPrototype } from './config'
import { Program } from './core-classes'
import { DoubleFBO, FBO } from './framebuffers'
import {
  createCornerSplats,
  createSplatsDown,
  createSplatsHorizontal,
  createSplatsLeft,
  createSplatsRight,
  createSplatsUp,
  createSplatsVertical,
  generateColor,
  multipleSplats,
  splatPointer
} from './simulation'

// Remote pointer instances (separate from local pointers)
export const remotePointers: Map<string, PointerPrototype> = new Map()

// WebSocket connection
let socket: WebSocket | null = null
let isConnected = false

/**
 * Initialize WebSocket connection to server
 */
export function initRemoteControl(): void {
  // Determine WebSocket URL based on current location
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/ws`

  // Create WebSocket connection
  socket = new WebSocket(wsUrl)

  // Setup event handlers
  socket.onopen = handleSocketOpen
  socket.onmessage = handleSocketMessage
  socket.onclose = handleSocketClose
  socket.onerror = handleSocketError

  console.log('Remote control initialization started')
}

/**
 * Handle WebSocket open event
 */
function handleSocketOpen(): void {
  isConnected = true
  console.log('WebSocket connection established')

  // Send initial connection message
  sendMessage({
    type: 'connect',
    payload: {
      role: 'simulator'
    }
  })
}

/**
 * Handle incoming WebSocket messages
 */
function handleSocketMessage(event: MessageEvent): void {
  try {
    const message = JSON.parse(event.data)

    // Process different message types
    switch (message.type) {
      case 'connect_ack':
        console.log(`Connected to server. Session ID: ${message.payload.sessionId}`)
        break

      case 'remote_input':
        processRemoteInput(message.payload)
        break

      case 'command':
        processRemoteCommand(message.payload)
        break

      default:
        console.warn(`Unknown message type: ${message.type}`)
    }
  } catch (error) {
    console.error('Error processing WebSocket message:', error)
  }
}

/**
 * Process remote input events (mouse/touch)
 */
function processRemoteInput(payload: any): void {
  const { eventType, position, controllerId } = payload

  // Get or create a remote pointer for this controller
  let remotePointer = remotePointers.get(controllerId)
  if (!remotePointer) {
    remotePointer = new PointerPrototype()
    remotePointer.id = controllerId
    // Generate a more vibrant color for remote pointers
    const color = generateColor()
    // Make remote colors more vibrant - multiply by 10x
    color.r *= 10.0
    color.g *= 10.0
    color.b *= 10.0
    remotePointer.color = color
    remotePointers.set(controllerId, remotePointer)
  }

  // Update pointer properties based on the event
  switch (eventType) {
    case 'mousedown':
      remotePointer.down = true
      remotePointer.moved = false
      remotePointer.texcoordX = position.x
      remotePointer.texcoordY = position.y
      remotePointer.prevTexcoordX = position.x
      remotePointer.prevTexcoordY = position.y
      remotePointer.deltaX = 0
      remotePointer.deltaY = 0

      // Generate a new color on each mousedown event, just like local pointers do
      const color = generateColor()
      color.r *= 10.0
      color.g *= 10.0
      color.b *= 10.0
      remotePointer.color = color
      break

    case 'mousemove':
      if (!remotePointer.down) return

      remotePointer.prevTexcoordX = remotePointer.texcoordX
      remotePointer.prevTexcoordY = remotePointer.texcoordY
      remotePointer.texcoordX = position.x
      remotePointer.texcoordY = position.y

      // Calculate deltas (may need to adjust for aspect ratio)
      remotePointer.deltaX = 0
      remotePointer.deltaY = 0

      // Still mark as moved so the splat gets rendered
      remotePointer.moved = true
      break

    case 'mouseup':
      remotePointer.down = false
      break
  }
}

/**
 * Apply remote pointer to the simulation
 */
export function applyRemotePointers(
  gl: WebGLRenderingContext,
  splatProgram: Program,
  velocity: DoubleFBO,
  dye: DoubleFBO,
  canvas: HTMLCanvasElement,
  blit: (destination: FBO) => void
): void {
  // Process any queued remote pointers
  remotePointers.forEach((pointer) => {
    if (pointer.moved) {
      pointer.moved = false // Reset after processing
      splatPointer(gl, pointer, splatProgram, velocity, dye, canvas, blit)
    }
  })
}

/**
 * Process remote command events
 */
function processRemoteCommand(payload: any): void {
  const { command, parameters } = payload

  // These functions will be fully implemented when called with required parameters
  switch (command) {
    case 'random_splats':
      applyRemoteRandomSplats(parameters?.count || 5)
      break

    case 'clear':
      // Clear effect will be implemented as needed
      break

    case 'preset_pattern':
      applyRemotePattern(parameters?.patternName || 'default')
      break
  }
}

/**
 * Global state for remote actions that need to be processed in the main loop
 */
interface RemoteActions {
  randomSplats: number // Number of random splats to create
  patternName: string | null // Pattern to apply
}

export const remoteActions: RemoteActions = {
  randomSplats: 0,
  patternName: null
}

/**
 * Queue random splats for processing in main loop
 */
function applyRemoteRandomSplats(count: number): void {
  remoteActions.randomSplats = count
}

/**
 * Queue pattern for processing in main loop
 */
function applyRemotePattern(patternName: string): void {
  remoteActions.patternName = patternName
}

/**
 * Apply all queued remote actions (called from main update loop)
 */
export function processRemoteActions(
  gl: WebGLRenderingContext,
  splatProgram: Program,
  velocity: DoubleFBO,
  dye: DoubleFBO,
  canvas: HTMLCanvasElement,
  blit: (destination: FBO) => void
): void {
  // Process any queued remote pointers
  applyRemotePointers(gl, splatProgram, velocity, dye, canvas, blit)

  // Process random splats
  if (remoteActions.randomSplats > 0) {
    multipleSplats(gl, remoteActions.randomSplats, splatProgram, velocity, dye, canvas, blit)
    remoteActions.randomSplats = 0
  }

  // Process pattern commands
  if (remoteActions.patternName) {
    applyPattern(remoteActions.patternName, gl, splatProgram, velocity, dye, canvas, blit)
    remoteActions.patternName = null
  }
}

/**
 * Apply a named pattern
 */
function applyPattern(
  patternName: string,
  gl: WebGLRenderingContext,
  splatProgram: Program,
  velocity: DoubleFBO,
  dye: DoubleFBO,
  canvas: HTMLCanvasElement,
  blit: (destination: FBO) => void
): void {
  switch (patternName) {
    case 'right':
      createSplatsRight(gl, splatProgram, velocity, dye, canvas, blit)
      break
    case 'left':
      createSplatsLeft(gl, splatProgram, velocity, dye, canvas, blit)
      break
    case 'up':
      createSplatsUp(gl, splatProgram, velocity, dye, canvas, blit)
      break
    case 'down':
      createSplatsDown(gl, splatProgram, velocity, dye, canvas, blit)
      break
    case 'horizontal':
      createSplatsHorizontal(gl, splatProgram, velocity, dye, canvas, blit)
      break
    case 'vertical':
      createSplatsVertical(gl, splatProgram, velocity, dye, canvas, blit)
      break
    case 'corners':
      createCornerSplats(gl, splatProgram, velocity, dye, canvas, blit)
      break
    default:
      // Default pattern - create splats in all directions
      createSplatsRight(gl, splatProgram, velocity, dye, canvas, blit)
      createSplatsLeft(gl, splatProgram, velocity, dye, canvas, blit)
      break
  }
}

/**
 * Handle WebSocket close event
 */
function handleSocketClose(event: CloseEvent): void {
  isConnected = false
  console.log(`WebSocket connection closed: ${event.code} ${event.reason}`)

  // Attempt to reconnect after delay
  setTimeout(initRemoteControl, 5000)
}

/**
 * Handle WebSocket error
 */
function handleSocketError(error: Event): void {
  console.error('WebSocket error:', error)
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
 * Check if remote control is connected
 */
export function isRemoteControlConnected(): boolean {
  return isConnected
}

/**
 * Clean up resources
 */
export function cleanup(): void {
  if (socket) {
    socket.close()
    socket = null
  }
  remotePointers.clear()
}
