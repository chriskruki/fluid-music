'use strict'

import { config } from './config.js'

// Fluid simulation functions
function step(
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
) {
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

  advectionProgram.bind()
  gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
  gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0))
  gl.uniform1i(advectionProgram.uniforms.uSource, velocity.read.attach(0))
  gl.uniform1f(advectionProgram.uniforms.dt, dt)
  gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION)
  blit(velocity.write)
  velocity.swap()
}

function splatPointer(gl, pointer, splatProgram, velocity, dye, canvas, blit) {
  let dx = pointer.deltaX * config.SPLAT_FORCE
  let dy = pointer.deltaY * config.SPLAT_FORCE
  splat(
    gl,
    pointer.texcoordX,
    pointer.texcoordY,
    dx,
    dy,
    pointer.color,
    splatProgram,
    velocity,
    dye,
    canvas,
    blit
  )
}

function multipleSplats(gl, amount, splatProgram, velocity, dye, canvas, blit) {
  for (let i = 0; i < amount; i++) {
    const color = generateColor()
    color.r *= 10.0
    color.g *= 10.0
    color.b *= 10.0
    const x = Math.random()
    const y = Math.random()
    const dx = 1000 * (Math.random() - 0.5)
    const dy = 1000 * (Math.random() - 0.5)
    splat(gl, x, y, dx, dy, color, splatProgram, velocity, dye, canvas, blit)
  }
}

function splat(gl, x, y, dx, dy, color, splatProgram, velocity, dye, canvas, blit) {
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

function correctRadius(radius, canvas) {
  let aspectRatio = canvas.width / canvas.height
  if (aspectRatio > 1) radius *= aspectRatio
  return radius
}

// Directional splat functions
function createSplatsRight(gl, splatProgram, velocity, dye, canvas, blit) {
  const centerY = 0.5 // Center of the screen in normalized coordinates
  const splatCount = config.SPLAT_COUNT // Use config setting
  const splatInterval = 0.1 // Interval between splats in normalized coordinates
  const splatSpeed = config.SPLAT_SPEED // Use config setting

  for (let i = 0; i < splatCount; i++) {
    const x = i * splatInterval
    const y = centerY
    const dx = splatSpeed
    const dy = 0
    const color = generateColor()
    color.r *= 10.0
    color.g *= 10.0
    color.b *= 10.0
    splat(gl, x, y, dx, dy, color, splatProgram, velocity, dye, canvas, blit)
  }
}

function createSplatsLeft(gl, splatProgram, velocity, dye, canvas, blit) {
  const centerY = 0.5
  const splatCount = config.SPLAT_COUNT // Use config setting
  const splatInterval = 0.1
  const splatSpeed = -config.SPLAT_SPEED // Use config setting

  for (let i = 0; i < splatCount; i++) {
    const x = 1 - i * splatInterval
    const y = centerY
    const dx = splatSpeed
    const dy = 0
    const color = generateColor()
    color.r *= 10.0
    color.g *= 10.0
    color.b *= 10.0
    splat(gl, x, y, dx, dy, color, splatProgram, velocity, dye, canvas, blit)
  }
}

function createSplatsUp(gl, splatProgram, velocity, dye, canvas, blit) {
  const centerX = 0.5
  const splatCount = config.SPLAT_COUNT // Use config setting
  const splatInterval = 0.1
  const splatSpeed = config.SPLAT_SPEED // Use config setting

  for (let i = 0; i < splatCount; i++) {
    const x = centerX
    const y = i * splatInterval
    const dx = 0
    const dy = splatSpeed
    const color = generateColor()
    color.r *= 10.0
    color.g *= 10.0
    color.b *= 10.0
    splat(gl, x, y, dx, dy, color, splatProgram, velocity, dye, canvas, blit)
  }
}

function createSplatsSide(gl, splatProgram, velocity, dye, canvas, blit) {
  const centerY = 0.5
  const splatCount = config.SPLAT_COUNT // Use config setting
  const splatInterval = 0.1
  const splatSpeed = config.SPLAT_SPEED // Use config setting

  for (let i = 0; i < splatCount; i++) {
    const x = 1 - i * splatInterval
    const y = 0.4
    const dx = -splatSpeed
    const dy = 0
    const color = generateColor()
    color.r *= 10.0
    color.g *= 10.0
    color.b *= 10.0
    splat(gl, x, y, dx, dy, color, splatProgram, velocity, dye, canvas, blit)
  }

  for (let i = 0; i < splatCount; i++) {
    const x = i * splatInterval
    const y = 0.6
    const dx = splatSpeed
    const dy = 0
    const color = generateColor()
    color.r *= 10.0
    color.g *= 10.0
    color.b *= 10.0
    splat(gl, x, y, dx, dy, color, splatProgram, velocity, dye, canvas, blit)
  }
}

function createSplatsDown(gl, splatProgram, velocity, dye, canvas, blit) {
  const centerX = 0.5
  const splatCount = config.SPLAT_COUNT // Use config setting
  const splatInterval = 0.1
  const splatSpeed = -config.SPLAT_SPEED // Use config setting

  for (let i = 0; i < splatCount; i++) {
    const x = centerX
    const y = 1 - i * splatInterval
    const dx = 0
    const dy = splatSpeed
    const color = generateColor()
    color.r *= 10.0
    color.g *= 10.0
    color.b *= 10.0
    splat(gl, x, y, dx, dy, color, splatProgram, velocity, dye, canvas, blit)
  }
}

function createCornerSplats(gl, splatProgram, velocity, dye, canvas, blit) {
  const centerX = 0.5 // Center of the screen in normalized coordinates
  const centerY = 0.5 // Center of the screen in normalized coordinates
  const splatSpeed = config.SPLAT_SPEED // Use config setting
  const splatCount = config.SPLAT_COUNT // Use config setting

  // Define the corners
  const corners = [
    { x: 0, y: 0 }, // Top-left corner
    { x: 1, y: 0 }, // Top-right corner
    { x: 0, y: 1 }, // Bottom-left corner
    { x: 1, y: 1 } // Bottom-right corner
  ]

  // Create splats from each corner towards the center
  corners.forEach((corner) => {
    for (let i = 0; i < splatCount; i++) {
      const dx = (centerX - corner.x) * splatSpeed * 5
      const dy = (centerY - corner.y) * splatSpeed * 5
      const color = generateColor()
      color.r *= 10.0
      color.g *= 10.0
      color.b *= 10.0
      splat(gl, corner.x, corner.y, dx, dy, color, splatProgram, velocity, dye, canvas, blit)
    }
  })
}

function generateColor() {
  let c = HSVtoRGB(Math.random(), 1.0, 1.0)
  c.r *= 0.15
  c.g *= 0.15
  c.b *= 0.15
  return c
}

function HSVtoRGB(h, s, v) {
  let r, g, b, i, f, p, q, t
  i = Math.floor(h * 6)
  f = h * 6 - i
  p = v * (1 - s)
  q = v * (1 - f * s)
  t = v * (1 - (1 - f) * s)

  switch (i % 6) {
    case 0:
      ;(r = v), (g = t), (b = p)
      break
    case 1:
      ;(r = q), (g = v), (b = p)
      break
    case 2:
      ;(r = p), (g = v), (b = t)
      break
    case 3:
      ;(r = p), (g = q), (b = v)
      break
    case 4:
      ;(r = t), (g = p), (b = v)
      break
    case 5:
      ;(r = v), (g = p), (b = q)
      break
  }

  return {
    r,
    g,
    b
  }
}

export {
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
}
