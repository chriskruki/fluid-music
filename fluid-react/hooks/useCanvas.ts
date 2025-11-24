/**
 * Canvas resize hook
 */

import { useEffect, RefObject } from 'react'

export function useCanvasResize(
  canvasRef: RefObject<HTMLCanvasElement>,
  containerRef: RefObject<HTMLElement>
) {
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return
    
    const canvas = canvasRef.current
    const container = containerRef.current
    
    const resizeObserver = new ResizeObserver(() => {
      if (!canvas || !container) return
      
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      
      canvas.width = Math.floor(rect.width * dpr)
      canvas.height = Math.floor(rect.height * dpr)
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
      }
    })
    
    resizeObserver.observe(container)
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [canvasRef, containerRef])
}

