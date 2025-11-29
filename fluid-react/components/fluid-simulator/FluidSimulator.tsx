'use client'

import { useRef, useEffect } from 'react'
import { useFluidSimulation } from '@/hooks/useFluidSimulation'
import { useFluidConfig } from '@/stores/fluidConfig'
import { useWebSocket } from '@/stores/websocket'
import { SimulationCanvas } from './SimulationCanvas'
import { SettingsDrawer } from './SettingsDrawer'
import type { Message } from '@/types/websocket'
import type { PatternType } from '@/types/fluid'

export function FluidSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const config = useFluidConfig((state) => state.config)
  const { connect, disconnect, sendMessage, socket, isConnected } = useWebSocket()
  
  const {
    isInitialized,
    error,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    createPattern,
    createRandomSplats,
    setPointerColor,
    setPointerColorful
  } = useFluidSimulation(canvasRef, config)
  
  // Connect to WebSocket as simulator
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    connect(wsUrl, 'simulator')
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])
  
  // Handle WebSocket messages
  useEffect(() => {
    if (!socket || !isConnected || !isInitialized) return
    
    const handleMessage = (event: MessageEvent) => {
      try {
        const message: Message = JSON.parse(event.data)
        
        switch (message.type) {
          case 'remote_input': {
            // Handle remote input from controllers
            const payload = message.payload as {
              eventType: 'mousedown' | 'mousemove' | 'mouseup' | 'touchstart' | 'touchmove' | 'touchend'
              position: { x: number; y: number }
              pointerId?: number
              controllerId?: string
              color?: { r: number; g: number; b: number }
              colorful?: boolean
            }
            
            // Use controllerId as pointer ID to distinguish between controllers
            const pointerId = payload.controllerId 
              ? parseInt(payload.controllerId.replace(/\D/g, ''), 10) || payload.pointerId || 1000
              : payload.pointerId || 1000
            
            switch (payload.eventType) {
              case 'mousedown':
              case 'touchstart':
                // Pass color and colorful flag to handlePointerDown (from server stored settings)
                handlePointerDown(pointerId, payload.position.x, payload.position.y, payload.color, payload.colorful)
                break
              case 'mousemove':
              case 'touchmove':
                // Update colorful mode if provided (from server stored settings)
                if (payload.colorful !== undefined) {
                  setPointerColorful(pointerId, payload.colorful)
                }
                // Update color if provided (only if not in colorful mode)
                if (payload.color && !payload.colorful) {
                  setPointerColor(pointerId, payload.color)
                }
                handlePointerMove(pointerId, payload.position.x, payload.position.y)
                break
              case 'mouseup':
              case 'touchend':
                handlePointerUp(pointerId)
                break
            }
            break
          }
          
          case 'command': {
            // Handle commands from controllers
            const payload = message.payload as {
              command: string
              parameters?: Record<string, unknown>
            }
            
            switch (payload.command) {
              case 'random_splats': {
                const count = (payload.parameters?.count as number) || 10
                createRandomSplats(count)
                break
              }
              case 'preset_pattern': {
                const patternName = payload.parameters?.patternName as PatternType
                if (patternName) {
                  createPattern(patternName)
                }
                break
              }
              case 'set_splat_color': {
                const r = payload.parameters?.r as number
                const g = payload.parameters?.g as number
                const b = payload.parameters?.b as number
                if (r !== undefined && g !== undefined && b !== undefined) {
                  const updateConfig = useFluidConfig.getState().updateConfig
                  updateConfig({
                    SPLAT_COLOR: { r, g, b },
                    RAINBOW_MODE: false
                  })
                }
                break
              }
              case 'set_rainbow_mode': {
                const enabled = payload.parameters?.enabled as boolean
                if (enabled !== undefined) {
                  const updateConfig = useFluidConfig.getState().updateConfig
                  updateConfig({ RAINBOW_MODE: enabled })
                }
                break
              }
            }
            break
          }
          
          case 'beat': {
            // Handle beat events from beat detector
            const payload = message.payload as {
              intensity: number
              frequency?: number
            }
            // Create splats based on beat intensity
            const splatCount = Math.floor(payload.intensity * 5)
            if (splatCount > 0) {
              createRandomSplats(splatCount)
            }
            break
          }
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error)
      }
    }
    
    socket.addEventListener('message', handleMessage)
    
    return () => {
      socket.removeEventListener('message', handleMessage)
    }
  }, [socket, isConnected, isInitialized, handlePointerDown, handlePointerMove, handlePointerUp, createPattern, createRandomSplats])
  
  return (
    <div className="relative w-full h-full">
      {/* Always render canvas so ref is available for initialization */}
      <SimulationCanvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-white bg-red-900 bg-opacity-90 z-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p>{error.message}</p>
            <pre className="mt-4 text-sm text-left bg-black bg-opacity-50 p-4 rounded overflow-auto max-w-2xl max-h-96">
              {error.stack}
            </pre>
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {!isInitialized && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-80 z-40">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Initializing simulation...</p>
          </div>
        </div>
      )}
      
      {/* WebSocket connection status */}
      {isInitialized && !isConnected && (
        <div className="absolute top-4 left-4 bg-yellow-600 text-white px-4 py-2 rounded z-30">
          WebSocket Disconnected
        </div>
      )}
      
      <SettingsDrawer />
    </div>
  )
}

