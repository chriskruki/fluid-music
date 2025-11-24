// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock WebGL
global.WebGLRenderingContext = class MockWebGLRenderingContext {
  constructor() {
    this.canvas = null
    this.drawingBufferWidth = 800
    this.drawingBufferHeight = 600
  }
  
  createShader() { return {} }
  createProgram() { return {} }
  createTexture() { return {} }
  createFramebuffer() { return {} }
  createBuffer() { return {} }
  getExtension() { return null }
  getParameter() { return null }
  getShaderParameter() { return true }
  getProgramParameter() { return true }
  getUniformLocation() { return {} }
  getAttribLocation() { return 0 }
  shaderSource() {}
  compileShader() {}
  attachShader() {}
  linkProgram() {}
  useProgram() {}
  bindBuffer() {}
  bufferData() {}
  vertexAttribPointer() {}
  enableVertexAttribArray() {}
  activeTexture() {}
  bindTexture() {}
  texParameteri() {}
  texImage2D() {}
  bindFramebuffer() {}
  framebufferTexture2D() {}
  viewport() {}
  clear() {}
  clearColor() {}
  drawElements() {}
  uniform1f() {}
  uniform2f() {}
  uniform3f() {}
  uniform4f() {}
  uniform1i() {}
  getActiveUniform() { return { name: 'test' } }
  checkFramebufferStatus() { return this.FRAMEBUFFER_COMPLETE }
  
  // Constants
  VERTEX_SHADER = 35633
  FRAGMENT_SHADER = 35632
  ARRAY_BUFFER = 34962
  ELEMENT_ARRAY_BUFFER = 34963
  TEXTURE_2D = 3553
  TEXTURE0 = 33984
  FRAMEBUFFER = 36160
  COLOR_ATTACHMENT0 = 36064
  RGBA = 6408
  RGB = 6407
  UNSIGNED_BYTE = 5121
  FLOAT = 5126
  LINEAR = 9729
  NEAREST = 9728
  CLAMP_TO_EDGE = 33071
  REPEAT = 10497
  FRAMEBUFFER_COMPLETE = 36053
  BLEND = 3042
  ONE = 1
  ONE_MINUS_SRC_ALPHA = 771
  COLOR_BUFFER_BIT = 16384
  TRIANGLES = 4
  UNSIGNED_SHORT = 5123
}

global.HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return new global.WebGLRenderingContext()
  }
  return null
})

// Mock WebSocket
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = WebSocket.CONNECTING
    this.onopen = null
    this.onmessage = null
    this.onerror = null
    this.onclose = null
  }
  
  send = jest.fn()
  close = jest.fn()
  
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  
  // Helper to simulate connection
  _simulateOpen() {
    this.readyState = WebSocket.OPEN
    if (this.onopen) {
      this.onopen(new Event('open'))
    }
  }
  
  // Helper to simulate message
  _simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }))
    }
  }
}

// Mock AudioContext
global.AudioContext = class MockAudioContext {
  constructor() {
    this.state = 'running'
    this.sampleRate = 44100
  }
  
  createAnalyser() {
    return {
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      frequencyBinCount: 1024,
      getByteFrequencyData: jest.fn(),
      getByteTimeDomainData: jest.fn(),
    }
  }
  
  createMediaStreamSource() {
    return {
      connect: jest.fn(),
    }
  }
  
  audioWorklet = {
    addModule: jest.fn(() => Promise.resolve()),
  }
  
  close = jest.fn()
}

global.navigator.mediaDevices = {
  getUserMedia: jest.fn(() => Promise.resolve({
    getTracks: () => [{ stop: jest.fn() }],
  })),
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16)
  return 1
})

global.cancelAnimationFrame = jest.fn()

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

