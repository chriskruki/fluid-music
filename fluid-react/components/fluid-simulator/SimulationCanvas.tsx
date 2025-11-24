'use client'

import { forwardRef, useCallback } from 'react'

interface SimulationCanvasProps {
  onPointerDown?: (id: number, x: number, y: number) => void
  onPointerMove?: (id: number, x: number, y: number) => void
  onPointerUp?: (id: number) => void
}

export const SimulationCanvas = forwardRef<HTMLCanvasElement, SimulationCanvasProps>(
  ({ onPointerDown, onPointerMove, onPointerUp }, ref) => {
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = 1.0 - (e.clientY - rect.top) / rect.height
      onPointerDown?.(-1, x, y)
    }, [onPointerDown])
    
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.buttons === 0) return
      const canvas = e.currentTarget
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = 1.0 - (e.clientY - rect.top) / rect.height
      onPointerMove?.(-1, x, y)
    }, [onPointerMove])
    
    const handleMouseUp = useCallback(() => {
      onPointerUp?.(-1)
    }, [onPointerUp])
    
    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      const canvas = e.currentTarget
      const rect = canvas.getBoundingClientRect()
      Array.from(e.touches).forEach((touch) => {
        const x = (touch.clientX - rect.left) / rect.width
        const y = 1.0 - (touch.clientY - rect.top) / rect.height
        onPointerDown?.(touch.identifier, x, y)
      })
    }, [onPointerDown])
    
    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      const canvas = e.currentTarget
      const rect = canvas.getBoundingClientRect()
      Array.from(e.touches).forEach((touch) => {
        const x = (touch.clientX - rect.left) / rect.width
        const y = 1.0 - (touch.clientY - rect.top) / rect.height
        onPointerMove?.(touch.identifier, x, y)
      })
    }, [onPointerMove])
    
    const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      Array.from(e.changedTouches).forEach((touch) => {
        onPointerUp?.(touch.identifier)
      })
    }, [onPointerUp])
    
    return (
      <canvas
        ref={ref}
        className="absolute inset-0 w-full h-full z-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    )
  }
)

SimulationCanvas.displayName = 'SimulationCanvas'

