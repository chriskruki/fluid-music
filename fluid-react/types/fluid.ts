/**
 * Core fluid simulation type definitions
 */

export interface Color {
  r: number
  g: number
  b: number
}

export interface BackColor {
  r: number
  g: number
  b: number
}

export interface FluidConfig {
  SIM_RESOLUTION: number
  DYE_RESOLUTION: number
  CAPTURE_RESOLUTION: number
  DENSITY_DISSIPATION: number
  VELOCITY_DISSIPATION: number
  PRESSURE: number
  PRESSURE_ITERATIONS: number
  CURL: number
  SPLAT_RADIUS: number
  SPLAT_FORCE: number
  SHADING: boolean
  COLORFUL: boolean
  COLOR_UPDATE_SPEED: number
  PAUSED: boolean
  BACK_COLOR: BackColor
  TRANSPARENT: boolean
  BLOOM: boolean
  BLOOM_ITERATIONS: number
  BLOOM_RESOLUTION: number
  BLOOM_INTENSITY: number
  BLOOM_THRESHOLD: number
  BLOOM_SOFT_KNEE: number
  SUNRAYS: boolean
  SUNRAYS_RESOLUTION: number
  SUNRAYS_WEIGHT: number
  MIRROR_MODE: boolean
  MIRROR_SEGMENTS: number
  SPLAT_SPEED: number
  SPLAT_COUNT: number
  SHOW_DEBUG: boolean
  RAINBOW_MODE: boolean
  SPLAT_COLOR: Color
}

export interface PointerPrototype {
  id: number
  texcoordX: number
  texcoordY: number
  prevTexcoordX: number
  prevTexcoordY: number
  deltaX: number
  deltaY: number
  down: boolean
  moved: boolean
  color: Color
}

export type PatternType =
  | 'right'
  | 'left'
  | 'up'
  | 'down'
  | 'horizontal'
  | 'vertical'
  | 'corners'

export interface Resolution {
  width: number
  height: number
}

