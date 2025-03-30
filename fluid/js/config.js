'use strict'

// Configuration settings
const config = {
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 1024,
  CAPTURE_RESOLUTION: 512,
  DENSITY_DISSIPATION: 1,
  VELOCITY_DISSIPATION: 0.1,
  PRESSURE: 0.8,
  PRESSURE_ITERATIONS: 20,
  CURL: 30,
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
  BLOOM_INTENSITY: 0.8,
  BLOOM_THRESHOLD: 0.6,
  BLOOM_SOFT_KNEE: 0.7,
  SUNRAYS: true,
  SUNRAYS_RESOLUTION: 196,
  SUNRAYS_WEIGHT: 1.0,
  MIRROR_MODE: false,
  SPLAT_SPEED: 1000,
  SPLAT_COUNT: 5
}

// Pointer class
class PointerPrototype {
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
    this.color = [30, 0, 300]
  }
}

// Initialize pointers array
let pointers = []
let splatStack = []
pointers.push(new PointerPrototype())

// Helper functions
function isMobile() {
  return /Mobi|Android/i.test(navigator.userAgent)
}

function wrap(value, min, max) {
  let range = max - min
  if (range == 0) return min
  return ((value - min) % range) + min
}

function getResolution(resolution) {
  let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight
  if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio

  let min = Math.round(resolution)
  let max = Math.round(resolution * aspectRatio)

  if (gl.drawingBufferWidth > gl.drawingBufferHeight) return { width: max, height: min }
  else return { width: min, height: max }
}

function scaleByPixelRatio(input) {
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
