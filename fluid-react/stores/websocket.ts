/**
 * Zustand store for WebSocket connection state
 */

import { create } from 'zustand'
import type { ClientRole, Message } from '@/types/websocket'

interface WebSocketState {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  clientId: string | null
  controllerColor: { r: number; g: number; b: number } | null
  clientCounts: {
    controllers: number
    simulators: number
    beatDetectors: number
  }
  socket: WebSocket | null
  connect: (url: string, role: ClientRole) => void
  disconnect: () => void
  sendMessage: (message: Message) => void
  setConnectionStatus: (status: WebSocketState['connectionStatus']) => void
  setClientId: (id: string | null) => void
  setControllerColor: (color: { r: number; g: number; b: number } | null) => void
  setClientCounts: (counts: Partial<WebSocketState['clientCounts']>) => void
}

// Generate a unique color for each controller based on client ID
function generateControllerColor(clientId: string | null): { r: number; g: number; b: number } {
  if (!clientId) {
    // Fallback: random color
    const hue = Math.random()
    return HSVtoRGB(hue, 1.0, 1.0)
  }
  
  // Use clientId hash to generate consistent color
  let hash = 0
  for (let i = 0; i < clientId.length; i++) {
    hash = clientId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = (hash % 360) / 360
  return HSVtoRGB(hue, 0.8, 1.0)
}

function HSVtoRGB(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
  const m = v - c
  
  let r = 0, g = 0, b = 0
  
  if (h * 6 < 1) {
    r = c; g = x; b = 0
  } else if (h * 6 < 2) {
    r = x; g = c; b = 0
  } else if (h * 6 < 3) {
    r = 0; g = c; b = x
  } else if (h * 6 < 4) {
    r = 0; g = x; b = c
  } else if (h * 6 < 5) {
    r = x; g = 0; b = c
  } else {
    r = c; g = 0; b = x
  }
  
  return {
    r: (r + m) * 0.15, // Scale down for fluid simulation
    g: (g + m) * 0.15,
    b: (b + m) * 0.15
  }
}

export const useWebSocket = create<WebSocketState>((set, get) => ({
  isConnected: false,
  connectionStatus: 'disconnected',
  clientId: null,
  controllerColor: null,
  clientCounts: {
    controllers: 0,
    simulators: 0,
    beatDetectors: 0
  },
  socket: null,
  
  connect: (url: string, role: ClientRole) => {
    const { socket, disconnect } = get()
    
    // Disconnect existing connection if any
    if (socket) {
      disconnect()
    }
    
    set({ connectionStatus: 'connecting' })
    
    try {
      const ws = new WebSocket(url)
      
      ws.onopen = () => {
        set({ isConnected: true, connectionStatus: 'connected', socket: ws })
        
        // Send initial connection message
        ws.send(JSON.stringify({
          type: 'connect',
          payload: { role }
        }))
      }
      
      ws.onmessage = (event) => {
        try {
          const message: Message = JSON.parse(event.data)
          
          if (message.type === 'connect_ack') {
            const payload = message.payload as { sessionId: string; connectedClients: { controllers: number; simulators: number; beatDetectors: number } }
            const color = generateControllerColor(payload.sessionId)
            set({
              clientId: payload.sessionId,
              controllerColor: color,
              clientCounts: payload.connectedClients
            })
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
      
      ws.onerror = () => {
        set({ connectionStatus: 'error', isConnected: false })
      }
      
      ws.onclose = () => {
        set({ 
          isConnected: false, 
          connectionStatus: 'disconnected',
          socket: null 
        })
      }
      
    } catch (error) {
      set({ connectionStatus: 'error', isConnected: false })
    }
  },
  
  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.close()
      set({ 
        socket: null,
        isConnected: false,
        connectionStatus: 'disconnected'
      })
    }
  },
  
  sendMessage: (message: Message) => {
    const { socket, isConnected } = get()
    if (socket && isConnected) {
      socket.send(JSON.stringify(message))
    } else {
      console.warn('Cannot send message: WebSocket not connected')
    }
  },
  
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setClientId: (id) => {
    const color = generateControllerColor(id)
    set({ clientId: id, controllerColor: color })
  },
  setControllerColor: (color) => set({ controllerColor: color }),
  setClientCounts: (counts) => set((state) => ({
    clientCounts: { ...state.clientCounts, ...counts }
  }))
}))

