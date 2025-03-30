'use strict'

import { config } from './config'
import { getTextureScale } from './webgl-utils'
import { FBO } from './framebuffers'
import { Color } from './simulation'
import { Material, Program } from './core-classes'

// Normalized color interface
interface NormalizedColor {
  r: number
  g: number
  b: number
}

// Rendering functions
function render(
  gl: WebGLRenderingContext,
  target: FBO | null,
  dye: { read: FBO; write: FBO; swap: () => void },
  bloom: FBO,
  sunrays: FBO,
  _sunraysTemp: FBO,
  ditheringTexture: {
    texture: WebGLTexture
    width: number
    height: number
    attach: (id: number) => number
  },
  displayMaterial: Material,
  colorProgram: Program,
  checkerboardProgram: Program,
  blit: (destination: FBO | null) => void,
  bloomFramebuffers: FBO[],
  bloomPrefilterProgram: Program,
  bloomBlurProgram: Program,
  bloomFinalProgram: Program,
  sunraysMaskProgram: Program,
  sunraysProgram: Program,
  blurProgram: Program
): void {
  if (!gl || !gl.canvas) {
    return
  }

  if (config.BLOOM)
    applyBloom(
      gl,
      dye.read,
      bloom,
      bloomFramebuffers,
      bloomPrefilterProgram,
      bloomBlurProgram,
      bloomFinalProgram,
      blit
    )
  if (config.SUNRAYS) {
    applySunrays(gl, dye.read, dye.write, sunrays, sunraysMaskProgram, sunraysProgram, blit)
    blur(gl, sunrays, _sunraysTemp, 1, blurProgram, blit)
  }

  if (target == null || !config.TRANSPARENT) {
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.BLEND)
  } else {
    gl.disable(gl.BLEND)
  }

  if (!config.TRANSPARENT)
    drawColor(gl, target, normalizeColor(config.BACK_COLOR), colorProgram, blit)
  if (target == null && config.TRANSPARENT) drawCheckerboard(gl, target, checkerboardProgram, blit)

  drawDisplay(
    gl,
    target,
    dye,
    bloom,
    sunrays,
    _sunraysTemp,
    ditheringTexture,
    displayMaterial,
    blit
  )
}

function drawColor(
  gl: WebGLRenderingContext,
  target: FBO | null,
  color: NormalizedColor,
  colorProgram: Program,
  blit: (destination: FBO | null) => void
): void {
  colorProgram.bind()
  gl.uniform4f(colorProgram.uniforms.color, color.r, color.g, color.b, 1)
  blit(target)
}

function drawCheckerboard(
  gl: WebGLRenderingContext,
  target: FBO | null,
  checkerboardProgram: Program,
  blit: (destination: FBO | null) => void
): void {
  checkerboardProgram.bind()
  gl.uniform1f(checkerboardProgram.uniforms.aspectRatio, gl.canvas.width / gl.canvas.height)
  blit(target)
}

function drawDisplay(
  gl: WebGLRenderingContext,
  target: FBO | null,
  dye: { read: FBO; write: FBO },
  bloom: FBO,
  sunrays: FBO,
  _sunraysTemp: FBO,
  ditheringTexture: {
    texture: WebGLTexture
    width: number
    height: number
    attach: (id: number) => number
  },
  displayMaterial: Material,
  blit: (destination: FBO | null) => void
): void {
  let width = target == null ? gl.drawingBufferWidth : target.width
  let height = target == null ? gl.drawingBufferHeight : target.height

  displayMaterial.bind()
  if (config.SHADING) gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / width, 1.0 / height)
  gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0))
  if (config.BLOOM) {
    gl.uniform1i(displayMaterial.uniforms.uBloom, bloom.attach(1))
    gl.uniform1i(displayMaterial.uniforms.uDithering, ditheringTexture.attach(2))
    let scale = getTextureScale(ditheringTexture, width, height)
    gl.uniform2f(displayMaterial.uniforms.ditherScale, scale.x, scale.y)
  }
  if (config.SUNRAYS) gl.uniform1i(displayMaterial.uniforms.uSunrays, sunrays.attach(3))

  blit(target)
}

function applyBloom(
  gl: WebGLRenderingContext,
  source: FBO,
  destination: FBO,
  bloomFramebuffers: FBO[],
  bloomPrefilterProgram: Program,
  bloomBlurProgram: Program,
  bloomFinalProgram: Program,
  blit: (destination: FBO | null) => void
): void {
  if (bloomFramebuffers.length < 2) return

  let last = destination

  gl.disable(gl.BLEND)
  bloomPrefilterProgram.bind()
  let knee = config.BLOOM_THRESHOLD * config.BLOOM_SOFT_KNEE + 0.0001
  let curve0 = config.BLOOM_THRESHOLD - knee
  let curve1 = knee * 2
  let curve2 = 0.25 / knee
  gl.uniform3f(bloomPrefilterProgram.uniforms.curve, curve0, curve1, curve2)
  gl.uniform1f(bloomPrefilterProgram.uniforms.threshold, config.BLOOM_THRESHOLD)
  gl.uniform1i(bloomPrefilterProgram.uniforms.uTexture, source.attach(0))
  blit(last)

  bloomBlurProgram.bind()
  for (let i = 0; i < bloomFramebuffers.length; i++) {
    let dest = bloomFramebuffers[i]
    gl.uniform2f(bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY)
    gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0))
    blit(dest)
    last = dest
  }

  gl.blendFunc(gl.ONE, gl.ONE)
  gl.enable(gl.BLEND)

  for (let i = bloomFramebuffers.length - 2; i >= 0; i--) {
    let baseTex = bloomFramebuffers[i]
    gl.uniform2f(bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY)
    gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0))
    gl.viewport(0, 0, baseTex.width, baseTex.height)
    blit(baseTex)
    last = baseTex
  }

  gl.disable(gl.BLEND)
  bloomFinalProgram.bind()
  gl.uniform2f(bloomFinalProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY)
  gl.uniform1i(bloomFinalProgram.uniforms.uTexture, last.attach(0))
  gl.uniform1f(bloomFinalProgram.uniforms.intensity, config.BLOOM_INTENSITY)
  blit(destination)
}

function applySunrays(
  gl: WebGLRenderingContext,
  source: FBO,
  mask: FBO,
  destination: FBO,
  sunraysMaskProgram: Program,
  sunraysProgram: Program,
  blit: (destination: FBO | null) => void
): void {
  gl.disable(gl.BLEND)
  sunraysMaskProgram.bind()
  gl.uniform1i(sunraysMaskProgram.uniforms.uTexture, source.attach(0))
  blit(mask)

  sunraysProgram.bind()
  gl.uniform1f(sunraysProgram.uniforms.weight, config.SUNRAYS_WEIGHT)
  gl.uniform1i(sunraysProgram.uniforms.uTexture, mask.attach(0))
  blit(destination)
}

function blur(
  gl: WebGLRenderingContext,
  target: FBO,
  temp: FBO,
  iterations: number,
  blurProgram: Program,
  blit: (destination: FBO | null) => void
): void {
  blurProgram.bind()
  for (let i = 0; i < iterations; i++) {
    gl.uniform2f(blurProgram.uniforms.texelSize, target.texelSizeX, 0.0)
    gl.uniform1i(blurProgram.uniforms.uTexture, target.attach(0))
    blit(temp)

    gl.uniform2f(blurProgram.uniforms.texelSize, 0.0, target.texelSizeY)
    gl.uniform1i(blurProgram.uniforms.uTexture, temp.attach(0))
    blit(target)
  }
}

function normalizeColor(input: Color): NormalizedColor {
  let output: NormalizedColor = {
    r: input.r / 255,
    g: input.g / 255,
    b: input.b / 255
  }
  return output
}

export {
  render,
  drawColor,
  drawCheckerboard,
  drawDisplay,
  applyBloom,
  applySunrays,
  blur,
  normalizeColor
}

// Export the interface type properly
export type { NormalizedColor }
