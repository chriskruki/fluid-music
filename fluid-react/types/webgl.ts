/**
 * WebGL type definitions
 */

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

export interface FBO {
  texture: WebGLTexture
  fbo: WebGLFramebuffer
  width: number
  height: number
  texelSizeX: number
  texelSizeY: number
  attach: (id: number) => number
}

export interface DoubleFBO {
  width: number
  height: number
  texelSizeX: number
  texelSizeY: number
  read: FBO
  write: FBO
  swap: () => void
}

export interface TextureObject {
  texture: WebGLTexture
  width: number
  height: number
  attach: (id: number) => number
}

export type BlitFunction = (target: FBO | null, clear?: boolean) => void

