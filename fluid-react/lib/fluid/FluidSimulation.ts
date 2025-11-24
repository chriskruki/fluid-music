/**
 * FluidSimulation - Standalone WebGL fluid dynamics simulation class
 * 
 * Encapsulates all WebGL resources, simulation state, and rendering logic.
 * Can be instantiated, configured, and destroyed independently.
 */

import type { FluidConfig, PatternType } from '@/types/fluid'
import type { WebGLExtensions, FBO, DoubleFBO, TextureObject, BlitFunction } from '@/types/webgl'
import { defaultConfig, mergeConfig, getResolution, scaleByPixelRatio, wrap } from './config'
import { getWebGLContext } from '@/lib/webgl/context'
import { Program, Material } from '@/lib/webgl/program-utils'
import {
  createFBO,
  createDoubleFBO,
  resizeDoubleFBO,
  createTextureAsync,
  setupBlit
} from './framebuffers'
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
} from './shaders'
import {
  step,
  splatPointer,
  multipleSplats,
  createPattern,
  generateColor
} from './simulation'
import { render } from './rendering'

export class FluidSimulation {
  // WebGL Context
  private gl!: WebGLRenderingContext
  private ext!: WebGLExtensions
  private canvas: HTMLCanvasElement
  
  // Configuration
  private config: FluidConfig
  
  // Shaders
  private baseVertexShader!: WebGLShader
  private blurVertexShader!: WebGLShader
  private blurShader!: WebGLShader
  private copyShader!: WebGLShader
  private clearShader!: WebGLShader
  private colorShader!: WebGLShader
  private checkerboardShader!: WebGLShader
  private bloomPrefilterShader!: WebGLShader
  private bloomBlurShader!: WebGLShader
  private bloomFinalShader!: WebGLShader
  private sunraysMaskShader!: WebGLShader
  private sunraysShader!: WebGLShader
  private splatShader!: WebGLShader
  private advectionShader!: WebGLShader
  private divergenceShader!: WebGLShader
  private curlShader!: WebGLShader
  private vorticityShader!: WebGLShader
  private pressureShader!: WebGLShader
  private gradientSubtractShader!: WebGLShader
  
  // Programs
  private blurProgram!: Program
  private copyProgram!: Program
  private clearProgram!: Program
  private colorProgram!: Program
  private checkerboardProgram!: Program
  private bloomPrefilterProgram!: Program
  private bloomBlurProgram!: Program
  private bloomFinalProgram!: Program
  private sunraysMaskProgram!: Program
  private sunraysProgram!: Program
  private splatProgram!: Program
  private advectionProgram!: Program
  private divergenceProgram!: Program
  private curlProgram!: Program
  private vorticityProgram!: Program
  private pressureProgram!: Program
  private gradienSubtractProgram!: Program
  
  // Materials
  private displayMaterial!: Material
  
  // Framebuffers
  private dye!: DoubleFBO
  private velocity!: DoubleFBO
  private pressure!: DoubleFBO
  private curl!: FBO
  private divergence!: FBO
  private bloom!: FBO
  private sunrays!: FBO
  private sunraysTemp!: FBO
  private bloomFramebuffers: FBO[] = []
  
  // Textures
  private ditheringTexture!: TextureObject
  
  // Blit function
  private blit!: BlitFunction
  
  // State
  private animationId: number | null = null
  private lastUpdateTime: number
  private colorUpdateTimer: number = 0.0
  private isInitialized: boolean = false
  private isPaused: boolean = false
  
  // Pointers (local input)
  private pointers: Pointer[] = []
  private splatStack: number[] = []
  
  // Callbacks
  private onFrameCallback?: () => void
  private onErrorCallback?: (error: Error) => void
  
  /**
   * Private constructor - Use FluidSimulation.create() instead
   */
  private constructor(canvas: HTMLCanvasElement, config: FluidConfig) {
    this.canvas = canvas
    this.config = { ...config } // Deep copy to prevent external mutations
    this.lastUpdateTime = Date.now()
    
    // Initialize pointer
    const pointer = new Pointer()
    pointer.id = -1
    this.pointers.push(pointer)
  }
  
  /**
   * Factory method - Creates and initializes a FluidSimulation instance
   */
  static async create(
    canvas: HTMLCanvasElement,
    config?: Partial<FluidConfig>
  ): Promise<FluidSimulation> {
    // Merge default config with provided config
    const mergedConfig = mergeConfig(config)
    
    // Create instance
    const simulation = new FluidSimulation(canvas, mergedConfig)
    
    // Initialize (async - loads textures, etc.)
    await simulation.initialize()
    
    return simulation
  }
  
  /**
   * Initialize WebGL context and resources
   */
  private async initialize(): Promise<void> {
    try {
      console.log('[FluidSimulation] Starting initialization...')
      
      // Get WebGL context
      console.log('[FluidSimulation] Getting WebGL context...')
      const webglContext = getWebGLContext(this.canvas)
      this.gl = webglContext.gl
      this.ext = webglContext.ext
      console.log('[FluidSimulation] WebGL context obtained')
      
      // Mobile and capability checks
      if (this.isMobile()) {
        this.config.DYE_RESOLUTION = 512
      }
      if (!this.ext.supportLinearFiltering) {
        this.config.DYE_RESOLUTION = 512
        this.config.SHADING = false
        this.config.BLOOM = false
        this.config.SUNRAYS = false
      }
      
      // Setup blit function
      console.log('[FluidSimulation] Setting up blit function...')
      this.blit = setupBlit(this.gl)
      
      // Create shader instances
      console.log('[FluidSimulation] Creating shaders...')
      this.baseVertexShader = createBaseVertexShader(this.gl)
      this.blurVertexShader = createBlurVertexShader(this.gl)
      this.blurShader = createBlurShader(this.gl)
      this.copyShader = createCopyShader(this.gl)
      this.clearShader = createClearShader(this.gl)
      this.colorShader = createColorShader(this.gl)
      this.checkerboardShader = createCheckerboardShader(this.gl)
      this.bloomPrefilterShader = createBloomPrefilterShader(this.gl)
      this.bloomBlurShader = createBloomBlurShader(this.gl)
      this.bloomFinalShader = createBloomFinalShader(this.gl)
      this.sunraysMaskShader = createSunraysMaskShader(this.gl)
      this.sunraysShader = createSunraysShader(this.gl)
      this.splatShader = createSplatShader(this.gl)
      this.advectionShader = createAdvectionShader(this.gl, this.ext)
      this.divergenceShader = createDivergenceShader(this.gl)
      this.curlShader = createCurlShader(this.gl)
      this.vorticityShader = createVorticityShader(this.gl)
      this.pressureShader = createPressureShader(this.gl)
      this.gradientSubtractShader = createGradientSubtractShader(this.gl)
      console.log('[FluidSimulation] Shaders created')
      
      // Create programs
      console.log('[FluidSimulation] Creating programs...')
      this.blurProgram = new Program(this.gl, this.blurVertexShader, this.blurShader)
      this.copyProgram = new Program(this.gl, this.baseVertexShader, this.copyShader)
      this.clearProgram = new Program(this.gl, this.baseVertexShader, this.clearShader)
      this.colorProgram = new Program(this.gl, this.baseVertexShader, this.colorShader)
      this.checkerboardProgram = new Program(this.gl, this.baseVertexShader, this.checkerboardShader)
      this.bloomPrefilterProgram = new Program(this.gl, this.baseVertexShader, this.bloomPrefilterShader)
      this.bloomBlurProgram = new Program(this.gl, this.baseVertexShader, this.bloomBlurShader)
      this.bloomFinalProgram = new Program(this.gl, this.baseVertexShader, this.bloomFinalShader)
      this.sunraysMaskProgram = new Program(this.gl, this.baseVertexShader, this.sunraysMaskShader)
      this.sunraysProgram = new Program(this.gl, this.baseVertexShader, this.sunraysShader)
      this.splatProgram = new Program(this.gl, this.baseVertexShader, this.splatShader)
      this.advectionProgram = new Program(this.gl, this.baseVertexShader, this.advectionShader)
      this.divergenceProgram = new Program(this.gl, this.baseVertexShader, this.divergenceShader)
      this.curlProgram = new Program(this.gl, this.baseVertexShader, this.curlShader)
      this.vorticityProgram = new Program(this.gl, this.baseVertexShader, this.vorticityShader)
      this.pressureProgram = new Program(this.gl, this.baseVertexShader, this.pressureShader)
      this.gradienSubtractProgram = new Program(this.gl, this.baseVertexShader, this.gradientSubtractShader)
      console.log('[FluidSimulation] Programs created')
      
      // Create display material
      console.log('[FluidSimulation] Creating display material...')
      this.displayMaterial = new Material(this.gl, this.baseVertexShader, displayShaderSource)
      
      // Load dithering texture (async)
      console.log('[FluidSimulation] Loading dithering texture...')
      this.ditheringTexture = createTextureAsync(this.gl, '/LDR_LLL1_0.png')
      
      // Initialize framebuffers
      console.log('[FluidSimulation] Initializing framebuffers...')
      this.initFramebuffers()
      console.log('[FluidSimulation] Framebuffers initialized')
      
      console.log('[FluidSimulation] Updating keywords...')
      this.updateKeywords()
      
      // Create initial splats
      console.log('[FluidSimulation] Creating initial splats...')
      multipleSplats(
        this.gl,
        Math.floor(Math.random() * 20) + 5,
        this.config,
        this.splatProgram,
        this.velocity,
        this.dye,
        this.canvas,
        this.blit
      )
      
      this.isInitialized = true
      console.log('[FluidSimulation] Initialization complete!')
    } catch (error) {
      console.error('[FluidSimulation] Initialization error:', error)
      this.onErrorCallback?.(error as Error)
      throw error
    }
  }
  
  /**
   * Start the simulation loop
   */
  start(): void {
    if (!this.isInitialized) {
      throw new Error('Simulation not initialized. Call initialize() first.')
    }
    
    if (this.animationId !== null) {
      return // Already running
    }
    
    this.lastUpdateTime = Date.now()
    this.update()
  }
  
  /**
   * Stop the simulation loop
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }
  
  /**
   * Pause/unpause simulation
   */
  setPaused(paused: boolean): void {
    this.isPaused = paused
    this.config.PAUSED = paused
  }
  
  /**
   * Update configuration
   */
  updateConfig(updates: Partial<FluidConfig>): void {
    const oldConfig = { ...this.config }
    this.config = { ...this.config, ...updates }
    
    // Handle resolution changes (requires framebuffer recreation)
    if (updates.SIM_RESOLUTION || updates.DYE_RESOLUTION) {
      this.initFramebuffers()
    }
    
    // Handle keyword changes (requires shader recompilation)
    if (updates.SHADING !== oldConfig.SHADING ||
        updates.BLOOM !== oldConfig.BLOOM ||
        updates.SUNRAYS !== oldConfig.SUNRAYS) {
      this.updateKeywords()
    }
    
    // Handle pause state
    if (updates.PAUSED !== undefined) {
      this.isPaused = updates.PAUSED
    }
  }
  
  /**
   * Get current configuration
   */
  getConfig(): Readonly<FluidConfig> {
    return { ...this.config }
  }
  
  /**
   * Handle pointer input (mouse/touch)
   */
  handlePointerDown(id: number, x: number, y: number, color?: { r: number; g: number; b: number }, colorful?: boolean): void {
    let pointer = this.pointers.find(p => p.id === id)
    if (!pointer) {
      pointer = new Pointer()
      pointer.id = id
      this.pointers.push(pointer)
    }
    
    pointer.down = true
    pointer.moved = false
    pointer.texcoordX = x
    pointer.texcoordY = y
    pointer.prevTexcoordX = x
    pointer.prevTexcoordY = y
    pointer.deltaX = 0
    pointer.deltaY = 0
    
    // Set colorful mode if provided
    if (colorful !== undefined) {
      pointer.colorful = colorful
    }
    
    // Use provided color or generate one (if colorful mode, generate rainbow color)
    if (color) {
      pointer.color = color
    } else if (pointer.colorful) {
      pointer.color = generateColor({ ...this.config, RAINBOW_MODE: true, COLORFUL: true })
    } else {
      pointer.color = generateColor(this.config)
    }
  }
  
  /**
   * Set pointer color (for remote controllers)
   */
  setPointerColor(id: number, color: { r: number; g: number; b: number }): void {
    const pointer = this.pointers.find(p => p.id === id)
    if (pointer) {
      pointer.color = color
    }
  }
  
  /**
   * Set pointer colorful mode (for remote controllers)
   */
  setPointerColorful(id: number, colorful: boolean): void {
    const pointer = this.pointers.find(p => p.id === id)
    if (pointer) {
      pointer.colorful = colorful
      // If enabling colorful mode, generate a new rainbow color
      if (colorful) {
        pointer.color = generateColor({ ...this.config, RAINBOW_MODE: true, COLORFUL: true })
      }
    }
  }
  
  handlePointerMove(id: number, x: number, y: number): void {
    const pointer = this.pointers.find(p => p.id === id)
    if (!pointer || !pointer.down) return
    
    pointer.prevTexcoordX = pointer.texcoordX
    pointer.prevTexcoordY = pointer.texcoordY
    pointer.texcoordX = x
    pointer.texcoordY = y
    
    // Calculate deltas with aspect ratio correction
    const aspectRatio = this.canvas.width / this.canvas.height
    pointer.deltaX = (x - pointer.prevTexcoordX) * (aspectRatio < 1 ? aspectRatio : 1)
    pointer.deltaY = (y - pointer.prevTexcoordY) * (aspectRatio > 1 ? 1 / aspectRatio : 1)
    pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0
    
    // Create splat immediately
    if (pointer.moved) {
      splatPointer(
        this.gl,
        pointer,
        this.config,
        this.splatProgram,
        this.velocity,
        this.dye,
        this.canvas,
        this.blit
      )
      pointer.moved = false
    }
  }
  
  handlePointerUp(id: number): void {
    const pointer = this.pointers.find(p => p.id === id)
    if (pointer) {
      pointer.down = false
    }
  }
  
  /**
   * Create splat at position
   */
  createSplat(
    _x: number,
    _y: number,
    _dx: number,
    _dy: number,
    color?: { r: number; g: number; b: number }
  ): void {
    const splatColor = color || generateColor(this.config)
    // Implementation would call internal splat function
    // This is a simplified version - full implementation would use splatWithMirror
    void splatColor // Suppress unused variable warning
  }
  
  /**
   * Create multiple random splats
   */
  createRandomSplats(count: number): void {
    multipleSplats(
      this.gl,
      count,
      this.config,
      this.splatProgram,
      this.velocity,
      this.dye,
      this.canvas,
      this.blit
    )
  }
  
  /**
   * Create pattern splats
   */
  createPattern(pattern: PatternType): void {
    createPattern(
      this.gl,
      pattern,
      this.config,
      this.splatProgram,
      this.velocity,
      this.dye,
      this.canvas,
      this.blit
    )
  }
  
  /**
   * Resize simulation (recreates framebuffers)
   */
  resize(): void {
    if (this.resizeCanvas()) {
      this.initFramebuffers()
    }
  }
  
  /**
   * Cleanup and destroy all resources
   */
  destroy(): void {
    // Stop animation loop
    this.stop()
    
    // Delete framebuffers
    this.deleteFramebuffer(this.dye.read)
    this.deleteFramebuffer(this.dye.write)
    this.deleteFramebuffer(this.velocity.read)
    this.deleteFramebuffer(this.velocity.write)
    this.deleteFramebuffer(this.pressure.read)
    this.deleteFramebuffer(this.pressure.write)
    this.deleteFramebuffer(this.curl)
    this.deleteFramebuffer(this.divergence)
    this.deleteFramebuffer(this.bloom)
    this.deleteFramebuffer(this.sunrays)
    this.deleteFramebuffer(this.sunraysTemp)
    this.bloomFramebuffers.forEach(fbo => this.deleteFramebuffer(fbo))
    
    // Delete textures
    if (this.ditheringTexture?.texture) {
      this.gl.deleteTexture(this.ditheringTexture.texture)
    }
    
    // Delete programs
    const programs = [
      this.blurProgram, this.copyProgram, this.clearProgram, this.colorProgram,
      this.checkerboardProgram, this.bloomPrefilterProgram, this.bloomBlurProgram,
      this.bloomFinalProgram, this.sunraysMaskProgram, this.sunraysProgram,
      this.splatProgram, this.advectionProgram, this.divergenceProgram,
      this.curlProgram, this.vorticityProgram, this.pressureProgram,
      this.gradienSubtractProgram
    ]
    programs.forEach(program => {
      if (program?.program) {
        this.gl.deleteProgram(program.program)
      }
    })
    
    // Delete shaders
    const shaders = [
      this.baseVertexShader, this.blurVertexShader, this.blurShader,
      this.copyShader, this.clearShader, this.colorShader, this.checkerboardShader,
      this.bloomPrefilterShader, this.bloomBlurShader, this.bloomFinalShader,
      this.sunraysMaskShader, this.sunraysShader, this.splatShader,
      this.advectionShader, this.divergenceShader, this.curlShader,
      this.vorticityShader, this.pressureShader, this.gradientSubtractShader
    ]
    shaders.forEach(shader => {
      if (shader) {
        this.gl.deleteShader(shader)
      }
    })
    
    // Clear state
    this.pointers = []
    this.splatStack = []
    this.isInitialized = false
  }
  
  /**
   * Main update loop (private)
   */
  private update = (): void => {
    if (!this.isInitialized || this.isPaused) {
      this.animationId = requestAnimationFrame(this.update)
      return
    }
    
    const dt = this.calcDeltaTime()
    
    // Resize check
    if (this.resizeCanvas()) {
      this.initFramebuffers()
    }
    
    // Update colors
    this.updateColors(dt)
    
    // Apply queued splats
    this.processSplatStack()
    
    // Simulation step
    if (!this.config.PAUSED) {
      step(
        this.gl,
        dt,
        this.config,
        this.velocity,
        this.dye,
        this.curl,
        this.divergence,
        this.pressure,
        this.curlProgram,
        this.vorticityProgram,
        this.divergenceProgram,
        this.clearProgram,
        this.pressureProgram,
        this.gradienSubtractProgram,
        this.advectionProgram,
        this.blit
      )
    }
    
    // Render
    render(
      this.gl,
      null,
      this.config,
      this.dye,
      this.bloom,
      this.sunrays,
      this.sunraysTemp,
      this.ditheringTexture,
      this.displayMaterial,
      this.colorProgram,
      this.checkerboardProgram,
      this.blit,
      this.bloomFramebuffers,
      this.bloomPrefilterProgram,
      this.bloomBlurProgram,
      this.bloomFinalProgram,
      this.sunraysMaskProgram,
      this.sunraysProgram,
      this.blurProgram
    )
    
    // Call frame callback if provided
    this.onFrameCallback?.()
    
    // Continue loop
    this.animationId = requestAnimationFrame(this.update)
  }
  
  /**
   * Simulation step (private)
   */
  private calcDeltaTime(): number {
    const now = Date.now()
    let dt = (now - this.lastUpdateTime) / 1000
    dt = Math.min(dt, 0.016666) // Cap at 60 FPS
    this.lastUpdateTime = now
    return dt
  }
  
  private resizeCanvas(): boolean {
    const width = scaleByPixelRatio(this.canvas.clientWidth)
    const height = scaleByPixelRatio(this.canvas.clientHeight)
    
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
      return true
    }
    return false
  }
  
  private initFramebuffers(): void {
    const simRes = getResolution(this.gl, this.config.SIM_RESOLUTION)
    const dyeRes = getResolution(this.gl, this.config.DYE_RESOLUTION)
    
    const texType = this.ext.halfFloatTexType
    const rgba = this.ext.formatRGBA
    const rg = this.ext.formatRG
    const r = this.ext.formatR
    const filtering = this.ext.supportLinearFiltering ? this.gl.LINEAR : this.gl.NEAREST
    
    this.gl.disable(this.gl.BLEND)
    
    if (this.dye == null)
      this.dye = createDoubleFBO(
        this.gl,
        dyeRes.width,
        dyeRes.height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      )
    else
      this.dye = resizeDoubleFBO(
        this.gl,
        this.copyProgram,
        this.dye,
        dyeRes.width,
        dyeRes.height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering,
        this.blit
      )
    
    if (this.velocity == null)
      this.velocity = createDoubleFBO(
        this.gl,
        simRes.width,
        simRes.height,
        rg.internalFormat,
        rg.format,
        texType,
        filtering
      )
    else
      this.velocity = resizeDoubleFBO(
        this.gl,
        this.copyProgram,
        this.velocity,
        simRes.width,
        simRes.height,
        rg.internalFormat,
        rg.format,
        texType,
        filtering,
        this.blit
      )
    
    this.divergence = createFBO(
      this.gl,
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      this.gl.NEAREST
    )
    this.curl = createFBO(this.gl, simRes.width, simRes.height, r.internalFormat, r.format, texType, this.gl.NEAREST)
    this.pressure = createDoubleFBO(
      this.gl,
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      this.gl.NEAREST
    )
    
    this.initBloomFramebuffers()
    this.initSunraysFramebuffers()
  }
  
  private initBloomFramebuffers(): void {
    const res = getResolution(this.gl, this.config.BLOOM_RESOLUTION)
    
    const texType = this.ext.halfFloatTexType
    const rgba = this.ext.formatRGBA
    const filtering = this.ext.supportLinearFiltering ? this.gl.LINEAR : this.gl.NEAREST
    
    this.bloom = createFBO(this.gl, res.width, res.height, rgba.internalFormat, rgba.format, texType, filtering)
    
    this.bloomFramebuffers = []
    for (let i = 0; i < this.config.BLOOM_ITERATIONS; i++) {
      const width = res.width >> (i + 1)
      const height = res.height >> (i + 1)
      
      if (width < 2 || height < 2) break
      
      const fbo = createFBO(this.gl, width, height, rgba.internalFormat, rgba.format, texType, filtering)
      this.bloomFramebuffers.push(fbo)
    }
  }
  
  private initSunraysFramebuffers(): void {
    const res = getResolution(this.gl, this.config.SUNRAYS_RESOLUTION)
    
    const texType = this.ext.halfFloatTexType
    const r = this.ext.formatR
    const filtering = this.ext.supportLinearFiltering ? this.gl.LINEAR : this.gl.NEAREST
    
    this.sunrays = createFBO(this.gl, res.width, res.height, r.internalFormat, r.format, texType, filtering)
    this.sunraysTemp = createFBO(this.gl, res.width, res.height, r.internalFormat, r.format, texType, filtering)
  }
  
  private updateKeywords(): void {
    const displayKeywords: string[] = []
    if (this.config.SHADING) displayKeywords.push('SHADING')
    if (this.config.BLOOM) displayKeywords.push('BLOOM')
    if (this.config.SUNRAYS) displayKeywords.push('SUNRAYS')
    this.displayMaterial.setKeywords(displayKeywords)
  }
  
  private updateColors(dt: number): void {
    // Only update colors for pointers that have colorful mode enabled
    const colorfulPointers = this.pointers.filter(p => p.colorful)
    if (colorfulPointers.length === 0) return
    
    this.colorUpdateTimer += dt * this.config.COLOR_UPDATE_SPEED
    if (this.colorUpdateTimer >= 1) {
      this.colorUpdateTimer = wrap(this.colorUpdateTimer, 0, 1)
      colorfulPointers.forEach((p) => {
        // Generate rainbow color for this pointer
        p.color = generateColor({ ...this.config, RAINBOW_MODE: true, COLORFUL: true })
      })
    }
  }
  
  private processSplatStack(): void {
    if (this.splatStack.length > 0 && this.splatStack[this.splatStack.length - 1] !== undefined) {
      const amount = this.splatStack.pop()
      if (amount !== undefined) {
        this.createRandomSplats(amount)
      }
    }
  }
  
  private deleteFramebuffer(fbo: FBO): void {
    this.gl.deleteFramebuffer(fbo.fbo)
    this.gl.deleteTexture(fbo.texture)
  }
  
  private isMobile(): boolean {
    return /Mobi|Android/i.test(navigator.userAgent)
  }
  
  // Getters for internal state (for debugging)
  get isRunning(): boolean {
    return this.animationId !== null
  }
  
  get initialized(): boolean {
    return this.isInitialized
  }
}

// Internal Pointer class
class Pointer {
  id: number = -1
  texcoordX: number = 0
  texcoordY: number = 0
  prevTexcoordX: number = 0
  prevTexcoordY: number = 0
  deltaX: number = 0
  deltaY: number = 0
  down: boolean = false
  moved: boolean = false
  color: { r: number; g: number; b: number } = { r: 30, g: 0, b: 300 }
  colorful: boolean = false // Per-pointer colorful/rainbow mode
}

