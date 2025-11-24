'use client'

import React, { useCallback, useEffect } from 'react'
import { useWebSocket } from '@/stores/websocket'
import type { PatternType } from '@/types/fluid'

export function RemoteController() {
  const { isConnected, sendMessage, connect, disconnect } = useWebSocket()
  
  // Connect on mount
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    connect(wsUrl, 'controller')
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (touch.clientX - rect.left) / rect.width
    const y = 1.0 - (touch.clientY - rect.top) / rect.height
    
    sendMessage({
      type: 'input',
      payload: {
        eventType: 'touchstart',
        position: { x, y },
        pointerId: touch.identifier
      }
    })
  }, [sendMessage])
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (touch.clientX - rect.left) / rect.width
    const y = 1.0 - (touch.clientY - rect.top) / rect.height
    
    sendMessage({
      type: 'input',
      payload: {
        eventType: 'touchmove',
        position: { x, y },
        pointerId: touch.identifier
      }
    })
  }, [sendMessage])
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.changedTouches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (touch.clientX - rect.left) / rect.width
    const y = 1.0 - (touch.clientY - rect.top) / rect.height
    
    sendMessage({
      type: 'input',
      payload: {
        eventType: 'touchend',
        position: { x, y },
        pointerId: touch.identifier
      }
    })
  }, [sendMessage])
  
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
        <button
          onClick={() => handlePattern('corners')}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Corners
        </button>
        <button
          onClick={() => handlePattern('horizontal')}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Horizontal
        </button>
        <button
          onClick={() => handlePattern('vertical')}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Vertical
        </button>
        <button
          onClick={handleRandomSplats}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Random Splats
        </button>
      </div>
      {!isConnected && (
        <div className="absolute top-4 left-4 bg-yellow-600 text-white px-4 py-2 rounded">
          Disconnected
        </div>
      )}
    </div>
  )
}

