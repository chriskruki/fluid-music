/**
 * WebSocket message type definitions
 */

export type ClientRole = 'simulator' | 'controller' | 'beat_detector'

export interface BaseMessage {
  type: string
  payload: unknown
  timestamp?: number
}

export interface ConnectMessage extends BaseMessage {
  type: 'connect'
  payload: {
    role: ClientRole
  }
}

export interface ConnectAckMessage extends BaseMessage {
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

export interface InputMessage extends BaseMessage {
  type: 'input'
  payload: {
    eventType: 'mousedown' | 'mousemove' | 'mouseup' | 'touchstart' | 'touchmove' | 'touchend'
    position: { x: number; y: number }
    pointerId?: number
  }
}

export interface CommandMessage extends BaseMessage {
  type: 'command'
  payload: {
    command: string
    parameters?: Record<string, unknown>
  }
}

export interface BeatMessage extends BaseMessage {
  type: 'beat'
  payload: {
    intensity: number
    frequency: number
    timestamp: number
  }
}

export type Message = ConnectMessage | ConnectAckMessage | InputMessage | CommandMessage | BeatMessage

