'use strict'

// Import all components
import {
  config,
  pointers,
  splatStack,
  isMobile,
  getResolution,
  scaleByPixelRatio
} from './config.js'

import { getWebGLContext, CHECK_FRAMEBUFFER_STATUS } from './webgl-utils.js'

import {
  createBaseVertexShader,
  createBlurVertexShader,
  createBlurShader,
  createCopyShader,
  createClearShader,
  createColorShader,
  createCheckerboardShader,
  displayShaderSource,
  createBloomPrefilterShader,
  createBloomBlurShader,
  createBloomFinalShader,
  createSunraysMaskShader,
  createSunraysShader,
  createSplatShader,
  createAdvectionShader,
  createDivergenceShader,
  createCurlShader,
  createVorticityShader,
  createPressureShader,
  createGradientSubtractShader
} from './shaders.js'

import { Material, Program } from './core-classes.js'

import {
  createFBO,
  createDoubleFBO,
  resizeFBO,
  resizeDoubleFBO,
  createTextureAsync,
  setupBlit
} from './framebuffers.js'

import {
  render,
  drawColor,
  drawCheckerboard,
  drawDisplay,
  applyBloom,
  applySunrays,
  blur,
  normalizeColor
} from './rendering.js'

import {
  step,
  splatPointer,
  multipleSplats,
  splat,
  correctRadius,
  createSplatsRight,
  createSplatsLeft,
  createSplatsUp,
  createSplatsSide,
  createSplatsDown,
  createCornerSplats,
  generateColor,
  HSVtoRGB
} from './simulation.js'

import {
  updatePointerDownData,
  updatePointerMoveData,
  updatePointerUpData,
  correctDeltaX,
  correctDeltaY,
  setupEventListeners
} from './input.js'

import {
  startGUI,
  captureScreenshot,
  framebufferToTexture,
  normalizeTexture,
  clamp01,
  textureToCanvas,
  downloadURI
} from './gui.js'

// Main script
document.addEventListener('DOMContentLoaded', () => {})
const canvas = document.getElementsByTagName('canvas')[0]
resizeCanvas()

function resizeCanvas() {
  let width = scaleByPixelRatio(canvas.clientWidth)
  let height = scaleByPixelRatio(canvas.clientHeight)
  if (canvas.width != width || canvas.height != height) {
    canvas.width = width
    canvas.height = height
    return true
  }
  return false
}

// Initialize WebGL context
const { gl, ext } = getWebGLContext(canvas)

if (isMobile()) {
  config.DYE_RESOLUTION = 512
}
if (!ext.supportLinearFiltering) {
  config.DYE_RESOLUTION = 512
  config.SHADING = false
  config.BLOOM = false
  config.SUNRAYS = false
}

// Setup blit function
const blit = setupBlit(gl)

// Create shader instances
const baseVertexShader = createBaseVertexShader(gl)
const blurVertexShader = createBlurVertexShader(gl)
const blurShader = createBlurShader(gl)
const copyShader = createCopyShader(gl)
const clearShader = createClearShader(gl)
const colorShader = createColorShader(gl)
const checkerboardShader = createCheckerboardShader(gl)
const bloomPrefilterShader = createBloomPrefilterShader(gl)
const bloomBlurShader = createBloomBlurShader(gl)
const bloomFinalShader = createBloomFinalShader(gl)
const sunraysMaskShader = createSunraysMaskShader(gl)
const sunraysShader = createSunraysShader(gl)
const splatShader = createSplatShader(gl)
const advectionShader = createAdvectionShader(gl, ext)
const divergenceShader = createDivergenceShader(gl)
const curlShader = createCurlShader(gl)
const vorticityShader = createVorticityShader(gl)
const pressureShader = createPressureShader(gl)
const gradientSubtractShader = createGradientSubtractShader(gl)

// Create programs
const blurProgram = new Program(gl, blurVertexShader, blurShader)
const copyProgram = new Program(gl, baseVertexShader, copyShader)
const clearProgram = new Program(gl, baseVertexShader, clearShader)
const colorProgram = new Program(gl, baseVertexShader, colorShader)
const checkerboardProgram = new Program(gl, baseVertexShader, checkerboardShader)
const bloomPrefilterProgram = new Program(gl, baseVertexShader, bloomPrefilterShader)
const bloomBlurProgram = new Program(gl, baseVertexShader, bloomBlurShader)
const bloomFinalProgram = new Program(gl, baseVertexShader, bloomFinalShader)
const sunraysMaskProgram = new Program(gl, baseVertexShader, sunraysMaskShader)
const sunraysProgram = new Program(gl, baseVertexShader, sunraysShader)
const splatProgram = new Program(gl, baseVertexShader, splatShader)
const advectionProgram = new Program(gl, baseVertexShader, advectionShader)
const divergenceProgram = new Program(gl, baseVertexShader, divergenceShader)
const curlProgram = new Program(gl, baseVertexShader, curlShader)
const vorticityProgram = new Program(gl, baseVertexShader, vorticityShader)
const pressureProgram = new Program(gl, baseVertexShader, pressureShader)
const gradienSubtractProgram = new Program(gl, baseVertexShader, gradientSubtractShader)

// Create display material
const displayMaterial = new Material(gl, baseVertexShader, displayShaderSource)

// Framebuffers
let dye
let velocity
let divergence
let curl
let pressure
let bloom
let bloomFramebuffers = []
let sunrays
let sunraysTemp

// Load dithering texture
let ditheringTexture = createTextureAsync(gl, './static/LDR_LLL1_0.png')

// Initialize framebuffers
initFramebuffers()

function initFramebuffers() {
  let simRes = getResolution(config.SIM_RESOLUTION)
  let dyeRes = getResolution(config.DYE_RESOLUTION)

  const texType = ext.halfFloatTexType
  const rgba = ext.formatRGBA
  const rg = ext.formatRG
  const r = ext.formatR
  const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST

  gl.disable(gl.BLEND)

  if (dye == null)
    dye = createDoubleFBO(
      gl,
      dyeRes.width,
      dyeRes.height,
      rgba.internalFormat,
      rgba.format,
      texType,
      filtering
    )
  else
    dye = resizeDoubleFBO(
      gl,
      copyProgram,
      dye,
      dyeRes.width,
      dyeRes.height,
      rgba.internalFormat,
      rgba.format,
      texType,
      filtering,
      blit
    )

  if (velocity == null)
    velocity = createDoubleFBO(
      gl,
      simRes.width,
      simRes.height,
      rg.internalFormat,
      rg.format,
      texType,
      filtering
    )
  else
    velocity = resizeDoubleFBO(
      gl,
      copyProgram,
      velocity,
      simRes.width,
      simRes.height,
      rg.internalFormat,
      rg.format,
      texType,
      filtering,
      blit
    )

  divergence = createFBO(
    gl,
    simRes.width,
    simRes.height,
    r.internalFormat,
    r.format,
    texType,
    gl.NEAREST
  )
  curl = createFBO(gl, simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST)
  pressure = createDoubleFBO(
    gl,
    simRes.width,
    simRes.height,
    r.internalFormat,
    r.format,
    texType,
    gl.NEAREST
  )

  initBloomFramebuffers()
  initSunraysFramebuffers()
}

function initBloomFramebuffers() {
  let res = getResolution(config.BLOOM_RESOLUTION)

  const texType = ext.halfFloatTexType
  const rgba = ext.formatRGBA
  const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST

  bloom = createFBO(gl, res.width, res.height, rgba.internalFormat, rgba.format, texType, filtering)

  bloomFramebuffers.length = 0
  for (let i = 0; i < config.BLOOM_ITERATIONS; i++) {
    let width = res.width >> (i + 1)
    let height = res.height >> (i + 1)

    if (width < 2 || height < 2) break

    let fbo = createFBO(gl, width, height, rgba.internalFormat, rgba.format, texType, filtering)
    bloomFramebuffers.push(fbo)
  }
}

function initSunraysFramebuffers() {
  let res = getResolution(config.SUNRAYS_RESOLUTION)

  const texType = ext.halfFloatTexType
  const r = ext.formatR
  const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST

  sunrays = createFBO(gl, res.width, res.height, r.internalFormat, r.format, texType, filtering)
  sunraysTemp = createFBO(gl, res.width, res.height, r.internalFormat, r.format, texType, filtering)
}

// Update keywords
function updateKeywords() {
  let displayKeywords = []
  if (config.SHADING) displayKeywords.push('SHADING')
  if (config.BLOOM) displayKeywords.push('BLOOM')
  if (config.SUNRAYS) displayKeywords.push('SUNRAYS')
  displayMaterial.setKeywords(displayKeywords)
}

updateKeywords()

// Start GUI
const customSplatsRight = () => createSplatsRight(gl, splatProgram, velocity, dye, canvas, blit)
const customSplatsLeft = () => createSplatsLeft(gl, splatProgram, velocity, dye, canvas, blit)
const customSplatsUp = () => createSplatsUp(gl, splatProgram, velocity, dye, canvas, blit)
const customSplatsDown = () => createSplatsDown(gl, splatProgram, velocity, dye, canvas, blit)
const customSplatsSide = () => createSplatsSide(gl, splatProgram, velocity, dye, canvas, blit)
const customCornerSplats = () => createCornerSplats(gl, splatProgram, velocity, dye, canvas, blit)

startGUI(
  customSplatsRight,
  customSplatsLeft,
  customSplatsSide,
  customSplatsUp,
  customSplatsDown,
  customCornerSplats,
  initFramebuffers,
  updateKeywords
)

// Create initial splats
multipleSplats(gl, parseInt(Math.random() * 20) + 5, splatProgram, velocity, dye, canvas, blit)

// Setup event listeners
const customSplatPointer = (pointer) =>
  splatPointer(gl, pointer, splatProgram, velocity, dye, canvas, blit)
setupEventListeners(canvas, customSplatPointer)

// Main loop variables
let lastUpdateTime = Date.now()
let colorUpdateTimer = 0.0

// Start the main loop
update()

function update() {
  const dt = calcDeltaTime()
  if (resizeCanvas()) initFramebuffers()
  updateColors(dt)
  applyInputs()
  if (!config.PAUSED)
    step(
      gl,
      dt,
      velocity,
      curl,
      divergence,
      pressure,
      curlProgram,
      vorticityProgram,
      divergenceProgram,
      clearProgram,
      pressureProgram,
      gradienSubtractProgram,
      advectionProgram,
      blit
    )
  render(
    gl,
    null,
    dye,
    bloom,
    sunrays,
    sunraysTemp,
    ditheringTexture,
    displayMaterial,
    colorProgram,
    checkerboardProgram,
    blit,
    bloomFramebuffers,
    bloomPrefilterProgram,
    bloomBlurProgram,
    bloomFinalProgram,
    sunraysMaskProgram,
    sunraysProgram,
    blurProgram
  )
  requestAnimationFrame(update)
}

function calcDeltaTime() {
  let now = Date.now()
  let dt = (now - lastUpdateTime) / 1000
  dt = Math.min(dt, 0.016666)
  lastUpdateTime = now
  return dt
}

function updateColors(dt) {
  if (!config.COLORFUL) return

  colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED
  if (colorUpdateTimer >= 1) {
    colorUpdateTimer = wrap(colorUpdateTimer, 0, 1)
    pointers.forEach((p) => {
      p.color = generateColor()
    })
  }
}

function wrap(value, min, max) {
  const range = max - min
  if (range == 0) return min
  return ((value - min) % range) + min
}

function applyInputs() {
  if (splatStack.length > 0)
    multipleSplats(gl, splatStack.pop(), splatProgram, velocity, dye, canvas, blit)

  pointers.forEach((p) => {
    if (p.moved) {
      p.moved = false
      splatPointer(gl, p, splatProgram, velocity, dye, canvas, blit)
    }
  })
}
