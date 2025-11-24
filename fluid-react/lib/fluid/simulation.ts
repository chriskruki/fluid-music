/**
 * Fluid simulation step logic and splat functions
 */

import type { FluidConfig, Color, PatternType } from '@/types/fluid'
import type { FBO, DoubleFBO } from '@/types/webgl'
import { Program } from '@/lib/webgl/program-utils'

/**
 * Main simulation step function
 */
export function step(
  gl: WebGLRenderingContext,
  dt: number,
  config: FluidConfig,
  velocity: DoubleFBO,
  dye: DoubleFBO,
  curl: FBO,
  divergence: FBO,
  pressure: DoubleFBO,
  curlProgram: Program,
  vorticityProgram: Program,
  divergenceProgram: Program,
  clearProgram: Program,
  pressureProgram: Program,
  gradienSubtractProgram: Program,
  advectionProgram: Program,
  blit: (destination: FBO) => void
): void {
  gl.disable(gl.BLEND)

  curlProgram.bind()
  gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
  gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0))
  blit(curl)

  vorticityProgram.bind()
  gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
  gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0))
  gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1))
  gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL)
  gl.uniform1f(vorticityProgram.uniforms.dt, dt)
  blit(velocity.write)
  velocity.swap()

  divergenceProgram.bind()
  gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
  gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0))
  blit(divergence)

  clearProgram.bind()
  gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0))
  gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE)
  blit(pressure.write)
  pressure.swap()

  pressureProgram.bind()
  gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
  gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0))
  for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
    gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1))
    blit(pressure.write)
    pressure.swap()
  }

  gradienSubtractProgram.bind()
  gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
  gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0))
  gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1))
  blit(velocity.write)
  velocity.swap()

  // Advect velocity first
  advectionProgram.bind()
  gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
  gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY)
  gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0))
  gl.uniform1i(advectionProgram.uniforms.uSource, velocity.read.attach(0))
  gl.uniform1f(advectionProgram.uniforms.dt, dt)
  gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION)
  blit(velocity.write)
  velocity.swap()

  // Then advect dye using the updated velocity field
  advectionProgram.bind()
  gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
  gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY)
  gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0))
  gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1))
  gl.uniform1f(advectionProgram.uniforms.dt, dt)
  gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION)
  blit(dye.write)
  dye.swap()
}

interface Pointer {
  texcoordX: number
  texcoordY: number
  deltaX: number
  deltaY: number
  color: Color
}

/**
 * Create splat from pointer
 */
export function splatPointer(
  gl: WebGLRenderingContext,
  pointer: Pointer,
  config: FluidConfig,
  splatProgram: Program,
  velocity: DoubleFBO,
  dye: DoubleFBO,
  canvas: HTMLCanvasElement,
  blit: (destination: FBO) => void
): void {
  const dx = pointer.deltaX * config.SPLAT_FORCE
  const dy = pointer.deltaY * config.SPLAT_FORCE
  splatWithMirror(
    gl,
    pointer.texcoordX,
    pointer.texcoordY,
    dx,
    dy,
    pointer.color,
    config,
    splatProgram,
    velocity,
    dye,
    canvas,
    blit
  )
}

/**
 * Create multiple random splats
 */
export function multipleSplats(
  gl: WebGLRenderingContext,
  amount: number,
  config: FluidConfig,
  splatProgram: Program,
  velocity: DoubleFBO,
  dye: DoubleFBO,
  canvas: HTMLCanvasElement,
  blit: (destination: FBO) => void
): void {
  for (let i = 0; i < amount; i++) {
    const color = generateColor(config)
    color.r *= 10.0
    color.g *= 10.0
    color.b *= 10.0
    const x = Math.random()
    const y = Math.random()
    const dx = 1000 * (Math.random() - 0.5)
    const dy = 1000 * (Math.random() - 0.5)
    splatWithMirror(gl, x, y, dx, dy, color, config, splatProgram, velocity, dye, canvas, blit)
  }
}

/**
 * Create a single splat at the specified location
 */
function splat(
  gl: WebGLRenderingContext,
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: Color,
  config: FluidConfig,
  splatProgram: Program,
  velocity: DoubleFBO,
  dye: DoubleFBO,
  canvas: HTMLCanvasElement,
  blit: (destination: FBO) => void
): void {
  splatProgram.bind()
  gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0))
  gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height)
  gl.uniform2f(splatProgram.uniforms.point, x, y)
  gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0)
  gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100.0, canvas))
  blit(velocity.write)
  velocity.swap()

  gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0))
  gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b)
  blit(dye.write)
  dye.swap()
}

/**
 * Create splat with mirror mode support - duplicates splats based on mirror segments
 */
function splatWithMirror(
  gl: WebGLRenderingContext,
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: Color,
  config: FluidConfig,
  splatProgram: Program,
  velocity: DoubleFBO,
  dye: DoubleFBO,
  canvas: HTMLCanvasElement,
  blit: (destination: FBO) => void
): void {
  // Always create the original splat
  splat(gl, x, y, dx, dy, color, config, splatProgram, velocity, dye, canvas, blit)

  // If mirror mode is disabled or segments is 1, we're done
  if (!config.MIRROR_MODE || config.MIRROR_SEGMENTS <= 1) {
    return
  }

  const segments = config.MIRROR_SEGMENTS

  // For 2 segments: horizontal mirror (left to right)
  if (segments >= 2) {
    const mirroredX = 1.0 - x
    const mirroredDx = -dx
    splat(gl, mirroredX, y, mirroredDx, dy, color, config, splatProgram, velocity, dye, canvas, blit)
  }

  // For 4 segments: rotational symmetry (90° increments) - mandala effect
  if (segments >= 4) {
    // Rotate 90° clockwise: (x, y) -> (1-y, x), velocity rotates
    const rot90X = 1.0 - y
    const rot90Y = x
    const rot90Dx = -dy
    const rot90Dy = dx
    splat(gl, rot90X, rot90Y, rot90Dx, rot90Dy, color, config, splatProgram, velocity, dye, canvas, blit)

    // Rotate 180°: (x, y) -> (1-x, 1-y), velocity reverses
    const rot180X = 1.0 - x
    const rot180Y = 1.0 - y
    const rot180Dx = -dx
    const rot180Dy = -dy
    splat(gl, rot180X, rot180Y, rot180Dx, rot180Dy, color, config, splatProgram, velocity, dye, canvas, blit)

    // Rotate 270° clockwise: (x, y) -> (y, 1-x), velocity rotates
    const rot270X = y
    const rot270Y = 1.0 - x
    const rot270Dx = dy
    const rot270Dy = -dx
    splat(gl, rot270X, rot270Y, rot270Dx, rot270Dy, color, config, splatProgram, velocity, dye, canvas, blit)
  }

  // For 8 segments: add diagonal mirrors (45° increments)
  if (segments >= 8) {
    // Mirror across diagonal from top-left to bottom-right: (x, y) -> (y, x)
    const diag1X = y
    const diag1Y = x
    const diag1Dx = dy
    const diag1Dy = dx
    splat(gl, diag1X, diag1Y, diag1Dx, diag1Dy, color, config, splatProgram, velocity, dye, canvas, blit)

    // Mirror across diagonal from top-right to bottom-left: (x, y) -> (1-y, 1-x)
    const diag2X = 1.0 - y
    const diag2Y = 1.0 - x
    const diag2Dx = -dy
    const diag2Dy = -dx
    splat(gl, diag2X, diag2Y, diag2Dx, diag2Dy, color, config, splatProgram, velocity, dye, canvas, blit)
  }
}

function correctRadius(radius: number, canvas: HTMLCanvasElement): number {
  let aspectRatio = canvas.width / canvas.height
  if (aspectRatio > 1) radius *= aspectRatio
  return radius
}

// Directional splat functions
export function createSplatsRight(
  gl: WebGLRenderingContext,
  config: FluidConfig,
  splatProgram: Program,
  velocity: DoubleFBO,
  dye: DoubleFBO,
  canvas: HTMLCanvasElement,
  blit: (destination: FBO) => void
): void {
  const centerY = 0.5
  const splatCount = config.SPLAT_COUNT
  const splatInterval = 0.1
  const splatSpeed = config.SPLAT_SPEED

  for (let i = 0; i < splatCount; i++) {
    const x = i * splatInterval
    const y = centerY
    const dx = splatSpeed
    const dy = 0
    const color = generateColor(config)
    color.r *= 10.0
    color.g *= 10.0
    color.b *= 10.0
    splatWithMirror(gl, x, y, dx, dy, color, config, splatProgram, velocity, dye, canvas, blit)
  }
}

export function createSplatsLeft(
  gl: WebGLRenderingContext,
  config: FluidConfig,
  splatProgram: Program,
  velocity: DoubleFBO,
  dye: DoubleFBO,
  canvas: HTMLCanvasElement,
  blit: (destination: FBO) => void
): void {
  const centerY = 0.5
  const splatCount = config.SPLAT_COUNT
  const splatInterval = 0.1
  const splatSpeed = -config.SPLAT_SPEED

  for (let i = 0; i < splatCount; i++) {
    const x = 1 - i * splatInterval
    const y = centerY
    const dx = splatSpeed
    const dy = 0
    const color = generateColor(config)
    color.r *= 10.0
    color.g *= 10.0
    color.b *= 10.0
    splatWithMirror(gl, x, y, dx, dy, color, config, splatProgram, velocity, dye, canvas, blit)
  }
}

export function createSplatsUp(
  gl: WebGLRenderingContext,
  config: FluidConfig,
  splatProgram: Program,
  velocity: DoubleFBO,
  dye: DoubleFBO,
  canvas: HTMLCanvasElement,
  blit: (destination: FBO) => void
): void {
  const centerX = 0.5
  const splatCount = config.SPLAT_COUNT
  const splatInterval = 0.1
  const splatSpeed = config.SPLAT_SPEED

  for (let i = 0; i < splatCount; i++) {
    const x = centerX
    const y = i * splatInterval
    const dx = 0
    const dy = splatSpeed
    const color = generateColor(config)
    color.r *= 10.0
    color.g *= 10.0
    color.b *= 10.0
    splatWithMirror(gl, x, y, dx, dy, color, config, splatProgram, velocity, dye, canvas, blit)
  }
}

export function createSplatsDown(
  gl: WebGLRenderingContext,
  config: FluidConfig,
  splatProgram: Program,
  velocity: DoubleFBO,
  dye: DoubleFBO,
  canvas: HTMLCanvasElement,
  blit: (destination: FBO) => void
): void {
  const centerX = 0.5
  const splatCount = config.SPLAT_COUNT
  const splatInterval = 0.1
  const splatSpeed = -config.SPLAT_SPEED

  for (let i = 0; i < splatCount; i++) {
    const x = centerX
    const y = 1 - i * splatInterval
    const dx = 0
    const dy = splatSpeed
    const color = generateColor(config)
    color.r *= 10.0
    color.g *= 10.0
    color.b *= 10.0
    splatWithMirror(gl, x, y, dx, dy, color, config, splatProgram, velocity, dye, canvas, blit)
  }
}

export function createSplatsHorizontal(
  gl: WebGLRenderingContext,
  config: FluidConfig,
  splatProgram: Program,
  velocity: DoubleFBO,
  dye: DoubleFBO,
  canvas: HTMLCanvasElement,
  blit: (destination: FBO) => void
): void {
  const splatCount = config.SPLAT_COUNT
  const splatInterval = 0.1
  const splatSpeed = config.SPLAT_SPEED

  for (let i = 0; i < splatCount; i++) {
    const x = 1 - i * splatInterval
    const y = 0.4
    const dx = -splatSpeed
    const dy = 0
    const color = generateColor(config)
    color.r *= 10.0
    color.g *= 10.0
    color.b *= 10.0
    splatWithMirror(gl, x, y, dx, dy, color, config, splatProgram, velocity, dye, canvas, blit)
  }

  for (let i = 0; i < splatCount; i++) {
    const x = i * splatInterval
    const y = 0.6
    const dx = splatSpeed
    const dy = 0
    const color = generateColor(config)
    color.r *= 10.0
    color.g *= 10.0
    color.b *= 10.0
    splatWithMirror(gl, x, y, dx, dy, color, config, splatProgram, velocity, dye, canvas, blit)
  }
}

export function createSplatsVertical(
  gl: WebGLRenderingContext,
  config: FluidConfig,
  splatProgram: Program,
  velocity: DoubleFBO,
  dye: DoubleFBO,
  canvas: HTMLCanvasElement,
  blit: (destination: FBO) => void
): void {
  const splatCount = config.SPLAT_COUNT
  const splatInterval = 0.1
  const splatSpeed = config.SPLAT_SPEED

  for (let i = 0; i < splatCount; i++) {
    const x = 0.4
    const y = 1 - i * splatInterval
    const dx = 0
    const dy = -splatSpeed
    const color = generateColor(config)
    color.r *= 10.0
    color.g *= 10.0
    color.b *= 10.0
    splatWithMirror(gl, x, y, dx, dy, color, config, splatProgram, velocity, dye, canvas, blit)
  }

  for (let i = 0; i < splatCount; i++) {
    const x = 0.6
    const y = 1 - i * splatInterval
    const dx = 0
    const dy = -splatSpeed
    const color = generateColor(config)
    color.r *= 10.0
    color.g *= 10.0
    color.b *= 10.0
    splatWithMirror(gl, x, y, dx, dy, color, config, splatProgram, velocity, dye, canvas, blit)
  }
}

interface Corner {
  x: number
  y: number
}

export function createCornerSplats(
  gl: WebGLRenderingContext,
  config: FluidConfig,
  splatProgram: Program,
  velocity: DoubleFBO,
  dye: DoubleFBO,
  canvas: HTMLCanvasElement,
  blit: (destination: FBO) => void
): void {
  const centerX = 0.5
  const centerY = 0.5
  const splatSpeed = config.SPLAT_SPEED
  const splatCount = config.SPLAT_COUNT

  // Define the corners
  const corners: Corner[] = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 }
  ]

  // Create splats from each corner towards the center
  corners.forEach((corner) => {
    for (let i = 0; i < splatCount; i++) {
      const dx = (centerX - corner.x) * splatSpeed * 20
      const dy = (centerY - corner.y) * splatSpeed * 20
      const color = generateColor(config)
      color.r *= 10.0
      color.g *= 10.0
      color.b *= 10.0
      splatWithMirror(gl, corner.x, corner.y, dx, dy, color, config, splatProgram, velocity, dye, canvas, blit)
    }
  })
}

/**
 * Generate color based on config
 */
export function generateColor(config: FluidConfig): Color {
  // If rainbow mode is disabled, return the configured single color
  if (!config.RAINBOW_MODE) {
    return {
      r: config.SPLAT_COLOR.r,
      g: config.SPLAT_COLOR.g,
      b: config.SPLAT_COLOR.b
    }
  }

  // Rainbow mode: generate random HSV color
  const c = HSVtoRGB(Math.random(), 1.0, 1.0)
  c.r *= 0.15
  c.g *= 0.15
  c.b *= 0.15
  return c
}

function HSVtoRGB(h: number, s: number, v: number): Color {
  let r = 0,
    g = 0,
    b = 0,
    i = 0,
    f = 0,
    p = 0,
    q = 0,
    t = 0
  i = Math.floor(h * 6)
  f = h * 6 - i
  p = v * (1 - s)
  q = v * (1 - f * s)
  t = v * (1 - (1 - f) * s)

  switch (i % 6) {
    case 0:
      r = v
      g = t
      b = p
      break
    case 1:
      r = q
      g = v
      b = p
      break
    case 2:
      r = p
      g = v
      b = t
      break
    case 3:
      r = p
      g = q
      b = v
      break
    case 4:
      r = t
      g = p
      b = v
      break
    case 5:
      r = v
      g = p
      b = q
      break
  }

  return { r, g, b }
}

/**
 * Create pattern based on pattern type
 */
export function createPattern(
  gl: WebGLRenderingContext,
  pattern: PatternType,
  config: FluidConfig,
  splatProgram: Program,
  velocity: DoubleFBO,
  dye: DoubleFBO,
  canvas: HTMLCanvasElement,
  blit: (destination: FBO) => void
): void {
  switch (pattern) {
    case 'right':
      createSplatsRight(gl, config, splatProgram, velocity, dye, canvas, blit)
      break
    case 'left':
      createSplatsLeft(gl, config, splatProgram, velocity, dye, canvas, blit)
      break
    case 'up':
      createSplatsUp(gl, config, splatProgram, velocity, dye, canvas, blit)
      break
    case 'down':
      createSplatsDown(gl, config, splatProgram, velocity, dye, canvas, blit)
      break
    case 'horizontal':
      createSplatsHorizontal(gl, config, splatProgram, velocity, dye, canvas, blit)
      break
    case 'vertical':
      createSplatsVertical(gl, config, splatProgram, velocity, dye, canvas, blit)
      break
    case 'corners':
      createCornerSplats(gl, config, splatProgram, velocity, dye, canvas, blit)
      break
  }
}

