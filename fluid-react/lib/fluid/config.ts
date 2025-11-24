/**
 * Fluid simulation configuration and defaults
 */

import type { FluidConfig, Color, BackColor } from '@/types/fluid'

export const defaultConfig: FluidConfig = {
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 1024,
  CAPTURE_RESOLUTION: 512,
  DENSITY_DISSIPATION: 0.5,
  VELOCITY_DISSIPATION: 0.3,
  PRESSURE: 0.04,
  PRESSURE_ITERATIONS: 20,
  CURL: 0,
  SPLAT_RADIUS: 0.13,
  SPLAT_FORCE: 1000,
  SHADING: true,
  COLORFUL: false,
  COLOR_UPDATE_SPEED: 10,
  PAUSED: false,
  BACK_COLOR: { r: 0, g: 0, b: 0 },
  TRANSPARENT: false,
  BLOOM: false,
  BLOOM_ITERATIONS: 8,
  BLOOM_RESOLUTION: 256,
  BLOOM_INTENSITY: 0.1,
  BLOOM_THRESHOLD: 0.6,
  BLOOM_SOFT_KNEE: 0.7,
  SUNRAYS: false,
  SUNRAYS_RESOLUTION: 196,
  SUNRAYS_WEIGHT: 0.5,
  MIRROR_MODE: false,
  MIRROR_SEGMENTS: 2,
  SPLAT_SPEED: 5000,
  SPLAT_COUNT: 1,
  SHOW_DEBUG: false,
  RAINBOW_MODE: false,
  SPLAT_COLOR: { r: 1, g: 0.1411764705882353, b: 0.1411764705882353 }
}

/**
 * Merge partial config with defaults
 */
export function mergeConfig(partial?: Partial<FluidConfig>): FluidConfig {
  return { ...defaultConfig, ...partial }
}

/**
 * Helper functions
 */
export function isMobile(): boolean {
  return /Mobi|Android/i.test(navigator.userAgent)
}

export function wrap(value: number, min: number, max: number): number {
  const range = max - min
  if (range === 0) return min
  return ((value - min) % range) + min
}

export function getResolution(gl: WebGLRenderingContext, resolution: number): { width: number; height: number } {
  let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight
  if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio

  const min = Math.round(resolution)
  const max = Math.round(resolution * aspectRatio)

  if (gl.drawingBufferWidth > gl.drawingBufferHeight) {
    return { width: max, height: min }
  } else {
    return { width: min, height: max }
  }
}

export function scaleByPixelRatio(input: number): number {
  const pixelRatio = window.devicePixelRatio || 1
  return Math.floor(input * pixelRatio)
}

