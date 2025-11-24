/**
 * Shared test utilities and helpers
 */

import type { FluidConfig } from '@/types/fluid'
import { defaultConfig } from '@/lib/fluid/config'

/**
 * Create a mock FluidConfig for testing
 */
export function createMockConfig(overrides?: Partial<FluidConfig>): FluidConfig {
  return { ...defaultConfig, ...overrides }
}

/**
 * Wait for WebGL context to be initialized
 */
export async function waitForWebGL(page: any): Promise<void> {
  await page.waitForFunction(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return false
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2')
    return gl !== null
  })
}

/**
 * Wait for WebSocket connection
 */
export async function waitForWebSocket(page: any, timeout = 5000): Promise<void> {
  await page.waitForFunction(
    () => (window as any).__WS_CONNECTED__ === true,
    { timeout }
  ).catch(() => {
    // WebSocket might not expose connection state, continue anyway
  })
}

/**
 * Simulate touch event on canvas
 */
export async function simulateTouch(
  page: any,
  canvas: any,
  x: number,
  y: number
): Promise<void> {
  await canvas.tap({ position: { x, y } })
  await page.waitForTimeout(100)
}

/**
 * Get frame rate from canvas
 */
export async function getFrameRate(page: any, duration = 3000): Promise<number> {
  return await page.evaluate((duration: number) => {
    return new Promise<number>((resolve) => {
      let frames = 0
      const startTime = Date.now()
      
      const countFrame = () => {
        frames++
        if (Date.now() - startTime < duration) {
          requestAnimationFrame(countFrame)
        } else {
          const fps = frames / (duration / 1000)
          resolve(fps)
        }
      }
      
      requestAnimationFrame(countFrame)
    })
  }, duration)
}

/**
 * Check if WebGL is supported
 */
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl') || canvas.getContext('webgl2'))
  } catch {
    return false
  }
}

/**
 * Create mock WebSocket message
 */
export function createMockMessage(type: string, payload: unknown): string {
  return JSON.stringify({ type, payload, timestamp: Date.now() })
}

