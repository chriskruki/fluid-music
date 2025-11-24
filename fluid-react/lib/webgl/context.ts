/**
 * WebGL context initialization and extension detection
 */

import type { WebGLExtensions, WebGLFormatObject } from '@/types/webgl'

export function getWebGLContext(canvas: HTMLCanvasElement): {
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
      supportLinearFiltering: !!supportLinearFiltering
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
  const texture: WebGLTexture | null = gl.createTexture()
  if (!texture) return false
  
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null)

  const fbo: WebGLFramebuffer | null = gl.createFramebuffer()
  if (!fbo) {
    gl.deleteTexture(texture)
    return false
  }
  
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

  const status: number = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
  gl.deleteTexture(texture)
  gl.deleteFramebuffer(fbo)
  return status === gl.FRAMEBUFFER_COMPLETE
}

