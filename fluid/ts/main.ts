'use strict'

// Import all components
import {
  config,
  getResolution,
  isMobile,
  PointerPrototype,
  pointers,
  scaleByPixelRatio,
  splatStack
} from './config'

import { getWebGLContext, WebGLExtensions } from './webgl-utils'

import {
  createAdvectionShader,
  createBaseVertexShader,
  createBloomBlurShader,
  createBloomFinalShader,
  createBloomPrefilterShader,
  createBlurShader,
  createBlurVertexShader,
  createCheckerboardShader,
  createClearShader,
  createColorShader,
  createCopyShader,
  createCurlShader,
  createDivergenceShader,
  createGradientSubtractShader,
  createPressureShader,
  createSplatShader,
  createSunraysMaskShader,
  createSunraysShader,
  createVorticityShader,
  displayShaderSource
} from './shaders'

import { Material, Program } from './core-classes'

import {
  createDoubleFBO,
  createFBO,
  createTextureAsync,
  DoubleFBO,
  FBO,
  resizeDoubleFBO,
  setupBlit,
  TextureObject
} from './framebuffers'

import { render } from './rendering'

import {
  createCornerSplats,
  createSplatsDown,
  createSplatsHorizontal,
  createSplatsLeft,
  createSplatsRight,
  createSplatsUp,
  createSplatsVertical,
  generateColor,
  multipleSplats,
  splatPointer,
  step
} from './simulation'

import { setupEventListeners } from './input'

import { startGUI } from './gui'
import {
  applyRemotePointers,
  beatState,
  initRemoteControl,
  processRemoteActions,
  remotePointers
} from './remote'

// Define the debug info interface for TypeScript
interface DebugInfo {
  frames: number
  updateWebGLStatus: (status: string) => void
  updateAnimationStatus: (status: string) => void
  updateCanvasInfo: (dimensions: string) => void
  incrementFrameCounter: () => void
}

// Extend the Window interface to include our debug property
declare global {
  interface Window {
    debugInfo?: DebugInfo
    updateBeatStatus?: (isConnected: boolean, count: number) => void
    showBeatPulse?: (intensity: number) => void
  }
}

// Global variables and context
let canvas: HTMLCanvasElement | null = null
let gl: WebGLRenderingContext | null = null
let ext: WebGLExtensions | null = null
let blit: (destination: FBO | null) => void

// Shader instances
let baseVertexShader: WebGLShader
let blurVertexShader: WebGLShader
let blurShader: WebGLShader
let copyShader: WebGLShader
let clearShader: WebGLShader
let colorShader: WebGLShader
let checkerboardShader: WebGLShader
let bloomPrefilterShader: WebGLShader
let bloomBlurShader: WebGLShader
let bloomFinalShader: WebGLShader
let sunraysMaskShader: WebGLShader
let sunraysShader: WebGLShader
let splatShader: WebGLShader
let advectionShader: WebGLShader
let divergenceShader: WebGLShader
let curlShader: WebGLShader
let vorticityShader: WebGLShader
let pressureShader: WebGLShader
let gradientSubtractShader: WebGLShader

// Programs
let blurProgram: Program
let copyProgram: Program
let clearProgram: Program
let colorProgram: Program
let checkerboardProgram: Program
let bloomPrefilterProgram: Program
let bloomBlurProgram: Program
let bloomFinalProgram: Program
let sunraysMaskProgram: Program
let sunraysProgram: Program
let splatProgram: Program
let advectionProgram: Program
let divergenceProgram: Program
let curlProgram: Program
let vorticityProgram: Program
let pressureProgram: Program
let gradienSubtractProgram: Program

// Materials
let displayMaterial: Material

// Framebuffers
let dye: DoubleFBO
let velocity: DoubleFBO
let divergence: FBO
let curl: FBO
let pressure: DoubleFBO
let bloom: FBO
let bloomFramebuffers: FBO[] = []
let sunrays: FBO
let sunraysTemp: FBO

// Textures
let ditheringTexture: TextureObject

// Main loop variables
let lastUpdateTime = Date.now()
let colorUpdateTimer = 0.0
let animationId: number
let lastBeatDetectorCount = 0

// Helper functions
function resizeCanvas(): boolean {
  if (!canvas) {
    return false
  }

  let width = scaleByPixelRatio(canvas.clientWidth)
  let height = scaleByPixelRatio(canvas.clientHeight)

  if (canvas.width != width || canvas.height != height) {
    canvas.width = width
    canvas.height = height

    if (window.debugInfo && config.SHOW_DEBUG) {
      window.debugInfo.updateCanvasInfo(`${width}x${height}`)
    }

    return true
  }
  return false
}

function initFramebuffers(): void {
  if (!gl || !ext) return

  let simRes = getResolution(gl, config.SIM_RESOLUTION)
  let dyeRes = getResolution(gl, config.DYE_RESOLUTION)

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

function initBloomFramebuffers(): void {
  if (!gl || !ext) return

  let res = getResolution(gl, config.BLOOM_RESOLUTION)

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

function initSunraysFramebuffers(): void {
  if (!gl || !ext) return

  let res = getResolution(gl, config.SUNRAYS_RESOLUTION)

  const texType = ext.halfFloatTexType
  const r = ext.formatR
  const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST

  sunrays = createFBO(gl, res.width, res.height, r.internalFormat, r.format, texType, filtering)
  sunraysTemp = createFBO(gl, res.width, res.height, r.internalFormat, r.format, texType, filtering)
}

function updateKeywords(): void {
  if (!displayMaterial) return

  let displayKeywords: string[] = []
  if (config.SHADING) displayKeywords.push('SHADING')
  if (config.BLOOM) displayKeywords.push('BLOOM')
  if (config.SUNRAYS) displayKeywords.push('SUNRAYS')
  displayMaterial.setKeywords(displayKeywords)
}

function calcDeltaTime(): number {
  let now = Date.now()
  let dt = (now - lastUpdateTime) / 1000
  dt = Math.min(dt, 0.016666)
  lastUpdateTime = now
  return dt
}

function updateColors(dt: number): void {
  // Only update colors if colorful mode is enabled AND rainbow mode is enabled
  if (!config.COLORFUL || !config.RAINBOW_MODE) return

  colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED
  if (colorUpdateTimer >= 1) {
    colorUpdateTimer = wrap(colorUpdateTimer, 0, 1)
    pointers.forEach((p) => {
      p.color = generateColor()
    })
    remotePointers.forEach((p) => {
      p.color = generateColor()
    })
  }
}

function applyInputs(): void {
  if (!gl || !canvas) return

  if (splatStack.length > 0 && splatStack[splatStack.length - 1] !== undefined) {
    const amount = splatStack.pop()
    if (amount !== undefined) {
      multipleSplats(
        gl as WebGLRenderingContext,
        amount,
        splatProgram,
        velocity,
        dye,
        canvas as HTMLCanvasElement,
        blit
      )
    }
  }

  pointers.forEach((p) => {
    if (p.moved) {
      p.moved = false
      splatPointer(
        gl as WebGLRenderingContext,
        p,
        splatProgram,
        velocity,
        dye,
        canvas as HTMLCanvasElement,
        blit
      )
    }
  })
}

// Update function called on each animation frame
function update(): void {
  if (!gl || !canvas) return

  const dt = calcDeltaTime()
  if (resizeCanvas()) initFramebuffers()
  updateColors(dt)
  applyInputs()

  // Process any remote inputs
  if (gl && canvas) {
    processRemoteActions(gl, splatProgram, velocity, dye, canvas, blit)
  }

  // Update beat visualizer
  updateBeatVisualizer()

  // Run simulation steps if not paused
  if (!config.PAUSED) {
    step(
      gl,
      dt,
      velocity,
      dye,
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
  }

  // Always render
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

  // Ensure animation continues with proper binding to window
  animationId = window.requestAnimationFrame(update)
}

// Function to update beat visualizer UI
function updateBeatVisualizer(): void {
  // Update beat detector connection status if count changed
  if (window.updateBeatStatus) {
    const beatDetectorCount = (window as any).clients?.beatDetectors?.size || 0
    if (beatDetectorCount !== lastBeatDetectorCount) {
      window.updateBeatStatus(beatDetectorCount > 0, beatDetectorCount)
      lastBeatDetectorCount = beatDetectorCount
    }
  }

  // Check if a beat is active and show pulse if needed
  if (beatState.active) {
    // Only show pulse if it's a new beat (first frame)
    if (Date.now() - beatState.lastBeatTime < 50) {
      if (window.showBeatPulse) {
        window.showBeatPulse(beatState.intensity)
      }
    }
  }
}

// Initialization function
function init(): void {
  if (!canvas || !gl || !ext) return

  // Update debug info
  if (window.debugInfo) {
    window.debugInfo.updateWebGLStatus(
      `Initialized (WebGL${gl instanceof WebGL2RenderingContext ? '2' : '1'})`
    )

    // Set initial display state of debug info
    const debugElement = document.getElementById('debug-info')
    if (debugElement) {
      debugElement.style.display = config.SHOW_DEBUG ? 'block' : 'none'
    }
  }

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
  blit = setupBlit(gl)

  // Create shader instances
  baseVertexShader = createBaseVertexShader(gl)
  blurVertexShader = createBlurVertexShader(gl)
  blurShader = createBlurShader(gl)
  copyShader = createCopyShader(gl)
  clearShader = createClearShader(gl)
  colorShader = createColorShader(gl)
  checkerboardShader = createCheckerboardShader(gl)
  bloomPrefilterShader = createBloomPrefilterShader(gl)
  bloomBlurShader = createBloomBlurShader(gl)
  bloomFinalShader = createBloomFinalShader(gl)
  sunraysMaskShader = createSunraysMaskShader(gl)
  sunraysShader = createSunraysShader(gl)
  splatShader = createSplatShader(gl)
  advectionShader = createAdvectionShader(gl, ext)
  divergenceShader = createDivergenceShader(gl)
  curlShader = createCurlShader(gl)
  vorticityShader = createVorticityShader(gl)
  pressureShader = createPressureShader(gl)
  gradientSubtractShader = createGradientSubtractShader(gl)

  // Create programs
  blurProgram = new Program(gl, blurVertexShader, blurShader)
  copyProgram = new Program(gl, baseVertexShader, copyShader)
  clearProgram = new Program(gl, baseVertexShader, clearShader)
  colorProgram = new Program(gl, baseVertexShader, colorShader)
  checkerboardProgram = new Program(gl, baseVertexShader, checkerboardShader)
  bloomPrefilterProgram = new Program(gl, baseVertexShader, bloomPrefilterShader)
  bloomBlurProgram = new Program(gl, baseVertexShader, bloomBlurShader)
  bloomFinalProgram = new Program(gl, baseVertexShader, bloomFinalShader)
  sunraysMaskProgram = new Program(gl, baseVertexShader, sunraysMaskShader)
  sunraysProgram = new Program(gl, baseVertexShader, sunraysShader)
  splatProgram = new Program(gl, baseVertexShader, splatShader)
  advectionProgram = new Program(gl, baseVertexShader, advectionShader)
  divergenceProgram = new Program(gl, baseVertexShader, divergenceShader)
  curlProgram = new Program(gl, baseVertexShader, curlShader)
  vorticityProgram = new Program(gl, baseVertexShader, vorticityShader)
  pressureProgram = new Program(gl, baseVertexShader, pressureShader)
  gradienSubtractProgram = new Program(gl, baseVertexShader, gradientSubtractShader)

  // Create display material
  displayMaterial = new Material(gl, baseVertexShader, displayShaderSource)

  // Load dithering texture
  ditheringTexture = createTextureAsync(gl, '/LDR_LLL1_0.png')

  // Initialize framebuffers
  initFramebuffers()
  updateKeywords()

  // Initialize remote control
  initRemoteControl()

  // Start GUI
  const customSplatsRight = (): void => {
    if (!gl || !canvas) return
    createSplatsRight(gl, splatProgram, velocity, dye, canvas, blit)
  }
  const customSplatsLeft = (): void => {
    if (!gl || !canvas) return
    createSplatsLeft(gl, splatProgram, velocity, dye, canvas, blit)
  }
  const customSplatsUp = (): void => {
    if (!gl || !canvas) return
    createSplatsUp(gl, splatProgram, velocity, dye, canvas, blit)
  }
  const customSplatsDown = (): void => {
    if (!gl || !canvas) return
    createSplatsDown(gl, splatProgram, velocity, dye, canvas, blit)
  }
  const customSplatsHorizontal = (): void => {
    if (!gl || !canvas) return
    createSplatsHorizontal(gl, splatProgram, velocity, dye, canvas, blit)
  }
  const customSplatsVertical = (): void => {
    if (!gl || !canvas) return
    createSplatsVertical(gl, splatProgram, velocity, dye, canvas, blit)
  }
  const customCornerSplats = (): void => {
    if (!gl || !canvas) return
    createCornerSplats(gl, splatProgram, velocity, dye, canvas, blit)
  }

  startGUI(
    customSplatsHorizontal,
    customSplatsVertical,
    customSplatsRight,
    customSplatsLeft,
    customSplatsUp,
    customSplatsDown,
    customCornerSplats,
    initFramebuffers,
    updateKeywords
  )

  // Create initial splats
  if (gl && canvas) {
    multipleSplats(
      gl,
      parseInt(Math.random() * 20 + '') + 5,
      splatProgram,
      velocity,
      dye,
      canvas,
      blit
    )
  }

  // Setup event listeners
  const customSplatPointer = (pointer: PointerPrototype): void => {
    if (!gl || !canvas) return
    splatPointer(gl, pointer, splatProgram, velocity, dye, canvas, blit)
  }
  setupEventListeners(canvas, customSplatPointer)

  // Start the main loop
  if (window.debugInfo && config.SHOW_DEBUG) {
    window.debugInfo.updateAnimationStatus('Starting')
  }
  update()
}

// Main script - initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementsByTagName('canvas')[0]
  if (!canvas) {
    return
  }

  // Update canvas info
  if (window.debugInfo && config.SHOW_DEBUG) {
    window.debugInfo.updateCanvasInfo(`${canvas.clientWidth}x${canvas.clientHeight}`)
  }

  const webglContext = getWebGLContext(canvas)
  gl = webglContext.gl
  ext = webglContext.ext

  if (gl && ext) {
    if (window.debugInfo && config.SHOW_DEBUG) {
      window.debugInfo.updateWebGLStatus('Context acquired')
    }
    init()

    // Handle window focus/blur to prevent animation freezing
    window.addEventListener('focus', () => {
      if (window.debugInfo && config.SHOW_DEBUG) {
        window.debugInfo.updateAnimationStatus('Running')
      }
      lastUpdateTime = Date.now()
      if (!animationId) {
        animationId = window.requestAnimationFrame(update)
      }
    })

    // Don't pause animation on blur - allow continuous running
    // Animation will continue running even when tab is not active
  } else {
    if (window.debugInfo && config.SHOW_DEBUG) {
      window.debugInfo.updateWebGLStatus('Error: WebGL initialization failed')
    }
  }
})

// Wrap function from config.js for internal use
function wrap(value: number, min: number, max: number): number {
  const range = max - min
  if (range == 0) return min
  return ((value - min) % range) + min
}

// Export global variables and context for other modules
export {
  animationId,
  blit,
  bloom,
  bloomFramebuffers,
  curl,
  ditheringTexture,
  divergence,
  dye,
  ext,
  gl,
  initFramebuffers,
  lastUpdateTime,
  pressure,
  sunrays,
  sunraysTemp,
  update,
  updateKeywords,
  velocity,
  wrap
}
