'use strict'

import { config } from './config.js'
import { getTextureScale } from './webgl-utils.js'

// Rendering functions
function render(
  gl,
  target,
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
) {
  if (config.BLOOM)
    applyBloom(
      gl,
      dye.read,
      bloom,
      sunraysTemp,
      blit,
      bloomFramebuffers,
      bloomPrefilterProgram,
      bloomBlurProgram,
      bloomFinalProgram
    )
  if (config.SUNRAYS) {
    applySunrays(gl, dye.read, dye.write, sunrays, sunraysMaskProgram, sunraysProgram, blit)
    blur(gl, sunrays, sunraysTemp, 1, blurProgram, blit)
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

  drawDisplay(gl, target, dye, bloom, sunrays, ditheringTexture, displayMaterial, blit)
}

function drawColor(gl, target, color, colorProgram, blit) {
  colorProgram.bind()
  gl.uniform4f(colorProgram.uniforms.color, color.r, color.g, color.b, 1)
  blit(target)
}

function drawCheckerboard(gl, target, checkerboardProgram, blit) {
  checkerboardProgram.bind()
  gl.uniform1f(checkerboardProgram.uniforms.aspectRatio, gl.canvas.width / gl.canvas.height)
  blit(target)
}

function drawDisplay(gl, target, dye, bloom, sunrays, ditheringTexture, displayMaterial, blit) {
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
  gl,
  source,
  destination,
  temp,
  blit,
  bloomFramebuffers,
  bloomPrefilterProgram,
  bloomBlurProgram,
  bloomFinalProgram
) {
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

function applySunrays(gl, source, mask, destination, sunraysMaskProgram, sunraysProgram, blit) {
  gl.disable(gl.BLEND)
  sunraysMaskProgram.bind()
  gl.uniform1i(sunraysMaskProgram.uniforms.uTexture, source.attach(0))
  blit(mask)

  sunraysProgram.bind()
  gl.uniform1f(sunraysProgram.uniforms.weight, config.SUNRAYS_WEIGHT)
  gl.uniform1i(sunraysProgram.uniforms.uTexture, mask.attach(0))
  blit(destination)
}

function blur(gl, target, temp, iterations, blurProgram, blit) {
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

function normalizeColor(input) {
  let output = {
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
