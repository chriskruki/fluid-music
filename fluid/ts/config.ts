'use strict'

// Configuration settings
interface BackColor {
  r: number
  g: number
  b: number
}

// Define Color interface locally to avoid circular dependencies
interface Color {
  r: number
  g: number
  b: number
}

interface FluidConfig {
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
  SPLAT_SPEED: number
  SPLAT_COUNT: number
  SHOW_DEBUG: boolean
}

const config: FluidConfig = {
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 1024,
  CAPTURE_RESOLUTION: 512,
  DENSITY_DISSIPATION: 0.5,
  VELOCITY_DISSIPATION: 0.1,
  PRESSURE: 0.2,
  PRESSURE_ITERATIONS: 20,
  CURL: 5,
  SPLAT_RADIUS: 0.25,
  SPLAT_FORCE: 6000,
  SHADING: true,
  COLORFUL: true,
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
  SUNRAYS: true,
  SUNRAYS_RESOLUTION: 196,
  SUNRAYS_WEIGHT: 0.5,
  MIRROR_MODE: false,
  SPLAT_SPEED: 1000,
  SPLAT_COUNT: 5,
  SHOW_DEBUG: false
}

// Update the PointerPrototype color type
class PointerPrototype {
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

  constructor() {
    this.id = -1
    this.texcoordX = 0
    this.texcoordY = 0
    this.prevTexcoordX = 0
    this.prevTexcoordY = 0
    this.deltaX = 0
    this.deltaY = 0
    this.down = false
    this.moved = false
    this.color = { r: 30, g: 0, b: 300 }
  }
}

// Initialize pointers array
let pointers: PointerPrototype[] = []
let splatStack: number[] = []
pointers.push(new PointerPrototype())

// Helper functions
function isMobile(): boolean {
  return /Mobi|Android/i.test(navigator.userAgent)
}

function wrap(value: number, min: number, max: number): number {
  let range = max - min
  if (range == 0) return min
  return ((value - min) % range) + min
}

interface Resolution {
  width: number
  height: number
}

function getResolution(gl: WebGLRenderingContext, resolution: number): Resolution {
  let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight
  if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio

  let min = Math.round(resolution)
  let max = Math.round(resolution * aspectRatio)

  if (gl.drawingBufferWidth > gl.drawingBufferHeight) return { width: max, height: min }
  else return { width: min, height: max }
}

function scaleByPixelRatio(input: number): number {
  let pixelRatio = window.devicePixelRatio || 1
  return Math.floor(input * pixelRatio)
}

export {
  config,
  PointerPrototype,
  pointers,
  splatStack,
  isMobile,
  wrap,
  getResolution,
  scaleByPixelRatio
}
