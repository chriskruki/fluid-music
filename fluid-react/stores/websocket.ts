/**
 * Zustand store for WebSocket connection state
 */

import { create } from 'zustand'
import type { ClientRole, Message } from '@/types/websocket'

interface WebSocketState {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  clientId: string | null
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
  setClientCounts: (counts: Partial<WebSocketState['clientCounts']>) => void
}

export const useWebSocket = create<WebSocketState>((set, get) => ({
  isConnected: false,
  connectionStatus: 'disconnected',
  clientId: null,
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
            set({
              clientId: payload.sessionId,
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
  setClientId: (id) => set({ clientId: id }),
  setClientCounts: (counts) => set((state) => ({
    clientCounts: { ...state.clientCounts, ...counts }
  }))
}))

