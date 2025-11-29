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

export interface ClientSettingsMessage extends BaseMessage {
  type: 'client_settings'
  payload: {
    color?: { r: number; g: number; b: number }
    colorful?: boolean
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

export interface RemoteInputMessage extends BaseMessage {
  type: 'remote_input'
  payload: {
    eventType: 'mousedown' | 'mousemove' | 'mouseup' | 'touchstart' | 'touchmove' | 'touchend'
    position: { x: number; y: number }
    pointerId?: number
    controllerId?: string
    color?: { r: number; g: number; b: number }
    colorful?: boolean
  }
}

export interface SimulatorConfigUpdateMessage extends BaseMessage {
  type: 'simulator_config_update'
  payload: {
    config: Partial<import('@/types/fluid').FluidConfig>
  }
}

export type Message = ConnectMessage | ConnectAckMessage | InputMessage | CommandMessage | BeatMessage | RemoteInputMessage | ClientSettingsMessage | SimulatorConfigUpdateMessage

