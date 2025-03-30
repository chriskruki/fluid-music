'use strict'

import { config, pointers, PointerPrototype, splatStack, scaleByPixelRatio } from './config.js'
import { generateColor } from './simulation.js'

// Input handling functions
function updatePointerDownData(pointer, id, posX, posY) {
  pointer.id = id
  pointer.down = true
  pointer.moved = false
  pointer.texcoordX = posX / canvas.width
  pointer.texcoordY = 1.0 - posY / canvas.height
  pointer.prevTexcoordX = pointer.texcoordX
  pointer.prevTexcoordY = pointer.texcoordY
  pointer.deltaX = 0
  pointer.deltaY = 0
  pointer.color = generateColor()
}

function updatePointerMoveData(pointer, posX, posY, canvas) {
  pointer.prevTexcoordX = pointer.texcoordX
  pointer.prevTexcoordY = pointer.texcoordY
  pointer.texcoordX = posX / canvas.width
  pointer.texcoordY = 1.0 - posY / canvas.height
  pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX, canvas)
  pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY, canvas)
  pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0
}

function updatePointerUpData(pointer) {
  pointer.down = false
}

function correctDeltaX(delta, canvas) {
  let aspectRatio = canvas.width / canvas.height
  if (aspectRatio < 1) delta *= aspectRatio
  return delta
}

function correctDeltaY(delta, canvas) {
  let aspectRatio = canvas.width / canvas.height
  if (aspectRatio > 1) delta /= aspectRatio
  return delta
}

// Setup event listeners for input
function setupEventListeners(canvas, splatPointer) {
  canvas.addEventListener('mousedown', (e) => {
    let posX = scaleByPixelRatio(e.offsetX)
    let posY = scaleByPixelRatio(e.offsetY)
    let pointer = pointers.find((p) => p.id == -1)
    if (pointer == null) pointer = new PointerPrototype()
    updatePointerDownData(pointer, -1, posX, posY)
  })

  canvas.addEventListener('mousemove', (e) => {
    let pointer = pointers[0]
    if (!pointer.down) return
    let posX = scaleByPixelRatio(e.offsetX)
    let posY = scaleByPixelRatio(e.offsetY)
    updatePointerMoveData(pointer, posX, posY, canvas)
  })

  window.addEventListener('mouseup', () => {
    updatePointerUpData(pointers[0])
  })

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault()
    const touches = e.targetTouches
    while (touches.length >= pointers.length) pointers.push(new PointerPrototype())
    for (let i = 0; i < touches.length; i++) {
      let posX = scaleByPixelRatio(touches[i].pageX)
      let posY = scaleByPixelRatio(touches[i].pageY)
      updatePointerDownData(pointers[i + 1], touches[i].identifier, posX, posY)
    }
  })

  canvas.addEventListener(
    'touchmove',
    (e) => {
      e.preventDefault()
      const touches = e.targetTouches
      for (let i = 0; i < touches.length; i++) {
        let pointer = pointers[i + 1]
        if (!pointer.down) continue
        let posX = scaleByPixelRatio(touches[i].pageX)
        let posY = scaleByPixelRatio(touches[i].pageY)
        updatePointerMoveData(pointer, posX, posY, canvas)
      }
    },
    false
  )

  window.addEventListener('touchend', (e) => {
    const touches = e.changedTouches
    for (let i = 0; i < touches.length; i++) {
      let pointer = pointers.find((p) => p.id == touches[i].identifier)
      if (pointer == null) continue
      updatePointerUpData(pointer)
    }
  })

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP') config.PAUSED = !config.PAUSED
    if (e.key === ' ') splatStack.push(parseInt(Math.random() * 20) + 5)
  })
}

export {
  updatePointerDownData,
  updatePointerMoveData,
  updatePointerUpData,
  correctDeltaX,
  correctDeltaY,
  setupEventListeners
}
