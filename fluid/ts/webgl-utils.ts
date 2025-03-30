'use strict'

export interface WebGLFormatObject {
  internalFormat: number
  format: number
}

export interface WebGLExtensions {
  formatRGBA: WebGLFormatObject
  formatRG: WebGLFormatObject
  formatR: WebGLFormatObject
  halfFloatTexType: number
  supportLinearFiltering: boolean
}

function getWebGLContext(canvas: HTMLCanvasElement): {
  gl: WebGLRenderingContext
  ext: WebGLExtensions
} {
  const params: WebGLContextAttributes = {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false
  }

  let gl: WebGLRenderingContext = canvas.getContext('webgl2', params) as WebGLRenderingContext
  const isWebGL2: boolean = !!gl
  if (!isWebGL2) {
    gl = (canvas.getContext('webgl', params) ||
      canvas.getContext('experimental-webgl', params)) as WebGLRenderingContext
  }

  if (!gl) {
    throw new Error('WebGL not supported')
  }

  let halfFloat: any
  let supportLinearFiltering: any
  if (isWebGL2) {
    gl.getExtension('EXT_color_buffer_float')
    supportLinearFiltering = gl.getExtension('OES_texture_float_linear')
  } else {
    halfFloat = gl.getExtension('OES_texture_half_float')
    supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear')
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0)

  const halfFloatTexType: number = isWebGL2
    ? (gl as WebGL2RenderingContext).HALF_FLOAT
    : halfFloat.HALF_FLOAT_OES

  // Get RGBA format with fallback
  let formatRGBAResult = getSupportedFormat(
    gl,
    isWebGL2 ? (gl as WebGL2RenderingContext).RGBA16F : gl.RGBA,
    gl.RGBA,
    halfFloatTexType
  )
  if (!formatRGBAResult) {
    formatRGBAResult = { internalFormat: gl.RGBA, format: gl.RGBA }
  }
  const formatRGBA = formatRGBAResult

  // Get RG format with fallback
  let formatRGResult = getSupportedFormat(
    gl,
    isWebGL2 ? (gl as WebGL2RenderingContext).RG16F : gl.RGBA,
    isWebGL2 ? (gl as WebGL2RenderingContext).RG : gl.RGBA,
    halfFloatTexType
  )
  if (!formatRGResult) {
    formatRGResult = { internalFormat: gl.RGBA, format: gl.RGBA }
  }
  const formatRG = formatRGResult

  // Get R format with fallback
  let formatRResult = getSupportedFormat(
    gl,
    isWebGL2 ? (gl as WebGL2RenderingContext).R16F : gl.RGBA,
    isWebGL2 ? (gl as WebGL2RenderingContext).RED : gl.RGBA,
    halfFloatTexType
  )
  if (!formatRResult) {
    formatRResult = { internalFormat: gl.RGBA, format: gl.RGBA }
  }
  const formatR = formatRResult

  return {
    gl,
    ext: {
      formatRGBA,
      formatRG,
      formatR,
      halfFloatTexType,
      supportLinearFiltering
    }
  }
}

function getSupportedFormat(
  gl: WebGLRenderingContext,
  internalFormat: number,
  format: number,
  type: number
): WebGLFormatObject | null {
  if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
    switch (internalFormat) {
      case (gl as WebGL2RenderingContext).R16F:
        return getSupportedFormat(
          gl,
          (gl as WebGL2RenderingContext).RG16F,
          (gl as WebGL2RenderingContext).RG,
          type
        )
      case (gl as WebGL2RenderingContext).RG16F:
        return getSupportedFormat(gl, (gl as WebGL2RenderingContext).RGBA16F, gl.RGBA, type)
      default:
        return null
    }
  }

  return {
    internalFormat,
    format
  }
}

function supportRenderTextureFormat(
  gl: WebGLRenderingContext,
  internalFormat: number,
  format: number,
  type: number
): boolean {
  let texture: WebGLTexture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null)

  let fbo: WebGLFramebuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

  let status: number = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
  return status == gl.FRAMEBUFFER_COMPLETE
}

function hashCode(s: string): number {
  if (s.length == 0) return 0
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
  keywords?: string[]
): WebGLShader {
  source = addKeywords(source, keywords)

  const shader = gl.createShader(type)
  if (!shader) {
    throw new Error('Unable to create shader')
  }

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.trace(gl.getShaderInfoLog(shader))

  return shader
}

function addKeywords(source: string, keywords?: string[]): string {
  if (keywords == null) return source
  let keywordsString = ''
  keywords.forEach((keyword) => {
    keywordsString += '#define ' + keyword + '\n'
  })
  return keywordsString + source
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram {
  let program: WebGLProgram = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) console.trace(gl.getProgramInfoLog(program))

  return program
}

function getUniforms(
  gl: WebGLRenderingContext,
  program: WebGLProgram
): Record<string, WebGLUniformLocation> {
  let uniforms: Record<string, WebGLUniformLocation> = {}
  let uniformCount: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < uniformCount; i++) {
    const activeUniform = gl.getActiveUniform(program, i)
    if (!activeUniform) continue

    let uniformName: string = activeUniform.name
    const uniformLocation = gl.getUniformLocation(program, uniformName)
    if (uniformLocation) {
      uniforms[uniformName] = uniformLocation
    }
  }
  return uniforms
}

interface TextureScale {
  x: number
  y: number
}

function getTextureScale(
  texture: { width: number; height: number },
  width: number,
  height: number
): TextureScale {
  return {
    x: width / texture.width,
    y: height / texture.height
  }
}

function CHECK_FRAMEBUFFER_STATUS(gl: WebGLRenderingContext): void {
  let status: number = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
  if (status != gl.FRAMEBUFFER_COMPLETE) console.trace('Framebuffer error: ' + status)
}

export {
  getWebGLContext,
  getSupportedFormat,
  supportRenderTextureFormat,
  hashCode,
  compileShader,
  addKeywords,
  createProgram,
  getUniforms,
  getTextureScale,
  CHECK_FRAMEBUFFER_STATUS
}
