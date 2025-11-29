'use client'

import React, { useCallback, useEffect, useState, useRef } from 'react'
import { useWebSocket } from '@/stores/websocket'
import { useFluidConfig } from '@/stores/fluidConfig'
import { ControllerSettingsDrawer } from './ControllerSettingsDrawer'
import { Palette, CornerUpRight, ArrowLeftRight, ArrowUpDown, RefreshCw } from 'lucide-react'
import type { PatternType } from '@/types/fluid'

// Default blue color (scaled for fluid simulation)
const DEFAULT_BLUE_COLOR = { r: 0.15 * 0.15, g: 0.5 * 0.15, b: 1.0 * 0.15 } // Blue scaled down
const DEFAULT_BLUE_HEX = '#0080ff'

// Quick color presets
const QUICK_COLORS = [
  { name: 'red', hex: '#ff0000', color: { r: 1.0 * 0.15, g: 0.0 * 0.15, b: 0.0 * 0.15 } },
  { name: 'green', hex: '#00ff00', color: { r: 0.0 * 0.15, g: 1.0 * 0.15, b: 0.0 * 0.15 } },
  { name: 'blue', hex: '#0080ff', color: { r: 0.0 * 0.15, g: 0.5 * 0.15, b: 1.0 * 0.15 } },
  { name: 'purple', hex: '#8000ff', color: { r: 0.5 * 0.15, g: 0.0 * 0.15, b: 1.0 * 0.15 } },
  { name: 'orange', hex: '#ff8000', color: { r: 1.0 * 0.15, g: 0.5 * 0.15, b: 0.0 * 0.15 } },
]

export function RemoteController() {
  const { isConnected, sendMessage, connect, disconnect, clientId } = useWebSocket()
  const config = useFluidConfig((state) => state.config)
  const updateConfig = useFluidConfig((state) => state.updateConfig)
  
  // Local state for this controller's color (default to blue)
  const [localColor, setLocalColor] = useState<{ r: number; g: number; b: number }>(DEFAULT_BLUE_COLOR)
  const [selectedColor, setSelectedColor] = useState(DEFAULT_BLUE_HEX)
  const [isRainbowMode, setIsRainbowMode] = useState(false)
  const colorInputRef = useRef<HTMLInputElement>(null)
  const isDraggingRef = useRef(false)
  const canvasRectRef = useRef<DOMRect | null>(null)
  
  // Get the current color to use (local color, default is blue)
  const currentColor = localColor
  
  // Connect on mount
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    connect(wsUrl, 'controller')
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])
  
  // Send initial settings when connected
  useEffect(() => {
    if (isConnected && sendMessage) {
      sendMessage({
        type: 'client_settings',
        payload: {
          color: localColor,
          colorful: isRainbowMode
        }
      })
    }
  }, [isConnected, sendMessage, localColor, isRainbowMode])
  
  const handleColorChange = useCallback((color: string) => {
    setSelectedColor(color)
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255
    
    // Scale down for fluid simulation (same as generateColor does)
    const fluidColor = { r: r * 0.15, g: g * 0.15, b: b * 0.15 }
    
    // Update local color for this controller instance only
    setLocalColor(fluidColor)
    
    // Turn off rainbow mode when selecting a solid color
    if (isRainbowMode) {
      setIsRainbowMode(false)
    }
    
    // Send settings update to server
    sendMessage({
      type: 'client_settings',
      payload: {
        color: fluidColor,
        colorful: false
      }
    })
  }, [isRainbowMode, sendMessage])
  
  const handleQuickColor = useCallback((color: { r: number; g: number; b: number }, hex: string) => {
    setLocalColor(color)
    setSelectedColor(hex)
    
    // Turn off rainbow mode when selecting a quick color
    if (isRainbowMode) {
      setIsRainbowMode(false)
    }
    
    // Send settings update to server
    sendMessage({
      type: 'client_settings',
      payload: {
        color: color,
        colorful: false
      }
    })
  }, [isRainbowMode, sendMessage])
  
  const handleRainbowModeToggle = useCallback(() => {
    const newRainbowMode = !isRainbowMode
    setIsRainbowMode(newRainbowMode)
    
    // Send settings update to server
    sendMessage({
      type: 'client_settings',
      payload: {
        colorful: newRainbowMode
      }
    })
  }, [isRainbowMode, sendMessage])
  
  const handleColorPickerClick = useCallback(() => {
    colorInputRef.current?.click()
  }, [])
  
  const getNormalizedCoords = useCallback((clientX: number, clientY: number, rect: DOMRect) => {
    const x = (clientX - rect.left) / rect.width
    const y = 1.0 - (clientY - rect.top) / rect.height
    return { x, y }
  }, [])
  
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !canvasRectRef.current) return
    
    const { x, y } = getNormalizedCoords(e.clientX, e.clientY, canvasRectRef.current)
    
    sendMessage({
      type: 'input',
      payload: {
        eventType: 'mousemove',
        position: { x, y },
        pointerId: -1
      }
    })
  }, [sendMessage, getNormalizedCoords])
  
  const handleGlobalMouseUp = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !canvasRectRef.current) return
    
    isDraggingRef.current = false
    const { x, y } = getNormalizedCoords(e.clientX, e.clientY, canvasRectRef.current)
    
    sendMessage({
      type: 'input',
      payload: {
        eventType: 'mouseup',
        position: { x, y },
        pointerId: -1
      }
    })
    
    canvasRectRef.current = null
    
    // Remove global listeners
    window.removeEventListener('mousemove', handleGlobalMouseMove)
    window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [sendMessage, getNormalizedCoords, handleGlobalMouseMove])
  
  // Cleanup global mouse listeners on unmount
  useEffect(() => {
    return () => {
      if (isDraggingRef.current) {
        window.removeEventListener('mousemove', handleGlobalMouseMove)
        window.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [handleGlobalMouseMove, handleGlobalMouseUp])
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    canvasRectRef.current = rect
    isDraggingRef.current = true
    const { x, y } = getNormalizedCoords(e.clientX, e.clientY, rect)
    
    // Add global listeners for dragging
    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    
    sendMessage({
      type: 'input',
      payload: {
        eventType: 'mousedown',
        position: { x, y },
        pointerId: -1
      }
    })
  }, [sendMessage, getNormalizedCoords, handleGlobalMouseMove, handleGlobalMouseUp])
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // This is a fallback for when mouse is still over the element
    if (!isDraggingRef.current) return
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    canvasRectRef.current = rect
    const { x, y } = getNormalizedCoords(e.clientX, e.clientY, rect)
    
    sendMessage({
      type: 'input',
      payload: {
        eventType: 'mousemove',
        position: { x, y },
        pointerId: -1
      }
    })
  }, [sendMessage, getNormalizedCoords])
  
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return
    e.preventDefault()
    isDraggingRef.current = false
    const rect = e.currentTarget.getBoundingClientRect()
    const { x, y } = getNormalizedCoords(e.clientX, e.clientY, rect)
    
    // Remove global listeners
    window.removeEventListener('mousemove', handleGlobalMouseMove)
    window.removeEventListener('mouseup', handleGlobalMouseUp)
    
    sendMessage({
      type: 'input',
      payload: {
        eventType: 'mouseup',
        position: { x, y },
        pointerId: -1
      }
    })
    
    canvasRectRef.current = null
  }, [sendMessage, getNormalizedCoords, handleGlobalMouseMove, handleGlobalMouseUp])
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    const { x, y } = getNormalizedCoords(touch.clientX, touch.clientY, rect)
    
    sendMessage({
      type: 'input',
      payload: {
        eventType: 'touchstart',
        position: { x, y },
        pointerId: touch.identifier
      }
    })
  }, [sendMessage, getNormalizedCoords])
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 0) return
    const touch = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    canvasRectRef.current = rect
    const { x, y } = getNormalizedCoords(touch.clientX, touch.clientY, rect)
    
    sendMessage({
      type: 'input',
      payload: {
        eventType: 'touchmove',
        position: { x, y },
        pointerId: touch.identifier
      }
    })
  }, [sendMessage, getNormalizedCoords])
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.changedTouches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    const { x, y } = getNormalizedCoords(touch.clientX, touch.clientY, rect)
    
    sendMessage({
      type: 'input',
      payload: {
        eventType: 'touchend',
        position: { x, y },
        pointerId: touch.identifier
      }
    })
  }, [sendMessage, getNormalizedCoords])
  
  const handlePattern = useCallback((pattern: PatternType) => {
    sendMessage({
      type: 'command',
      payload: {
        command: 'preset_pattern',
        parameters: { patternName: pattern }
      }
    })
  }, [sendMessage])
  
  const handleRandomSplats = useCallback(() => {
    sendMessage({
      type: 'command',
      payload: {
        command: 'random_splats',
        parameters: { count: 10 }
      }
    })
  }, [sendMessage])
  
  return (
    <div className="relative w-full h-full">
      <div
        className="absolute inset-0 bg-black"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 items-center">
        {/* Color Controls */}
        <div className="flex items-center gap-2 bg-gray-800/80 backdrop-blur-sm px-3 py-2 rounded-lg">
          {/* Hidden color input */}
          <input
            ref={colorInputRef}
            type="color"
            value={selectedColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="hidden"
          />
          
          {/* Color picker icon button */}
          <button
            onClick={handleColorPickerClick}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title="Open color picker"
          >
            <Palette className="h-5 w-5 text-gray-300" />
          </button>
          
          {/* Quick color squares */}
          {QUICK_COLORS.map((quickColor) => (
            <button
              key={quickColor.name}
              onClick={() => handleQuickColor(quickColor.color, quickColor.hex)}
              className="w-8 h-8 rounded border-2 border-gray-600 hover:border-white transition-colors"
              style={{ backgroundColor: quickColor.hex }}
              title={quickColor.name.charAt(0).toUpperCase() + quickColor.name.slice(1)}
            />
          ))}
          
          {/* Rainbow mode toggle */}
          <button
            onClick={handleRainbowModeToggle}
            className={`w-8 h-8 rounded border-2 transition-all ${
              isRainbowMode
                ? 'border-white bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500'
                : 'border-gray-600 bg-gray-700 hover:border-gray-500'
            }`}
            title={isRainbowMode ? 'Disable rainbow mode' : 'Enable rainbow mode'}
          />
        </div>
        
        {/* Pattern Buttons */}
        <div className="flex items-center gap-2 bg-gray-800/80 backdrop-blur-sm px-3 py-2 rounded-lg">
          <button
            onClick={() => handlePattern('corners')}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title="Corners"
          >
            <CornerUpRight className="h-5 w-5 text-gray-300" />
          </button>
          <button
            onClick={() => handlePattern('horizontal')}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title="Horizontal"
          >
            <ArrowLeftRight className="h-5 w-5 text-gray-300" />
          </button>
          <button
            onClick={() => handlePattern('vertical')}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title="Vertical"
          >
            <ArrowUpDown className="h-5 w-5 text-gray-300" />
          </button>
          <button
            onClick={handleRandomSplats}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title="Random Splats"
          >
            <RefreshCw className="h-5 w-5 text-gray-300" />
          </button>
        </div>
      </div>
      {!isConnected && (
        <div className="absolute top-4 left-4 bg-yellow-600 text-white px-4 py-2 rounded">
          Disconnected
        </div>
      )}
      <ControllerSettingsDrawer />
    </div>
  )
}

