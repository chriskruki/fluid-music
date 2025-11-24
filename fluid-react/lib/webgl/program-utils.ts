/**
 * WebGL program utilities
 */

import { getUniforms, createProgram, compileShader } from './shader-utils'

export class Program {
  gl: WebGLRenderingContext
  uniforms: Record<string, WebGLUniformLocation>
  program: WebGLProgram

  constructor(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    this.gl = gl
    this.uniforms = {}
    const program = createProgram(gl, vertexShader, fragmentShader)

    // Ensure the program is created successfully
    if (!program) {
      throw new Error('Failed to create WebGL program')
    }

    this.program = program
    this.uniforms = getUniforms(gl, this.program)
  }

  bind(): void {
    this.gl.useProgram(this.program)
  }
}

export class Material {
  gl: WebGLRenderingContext
  vertexShader: WebGLShader
  fragmentShaderSource: string
  programs: Record<number, WebGLProgram>
  activeProgram: WebGLProgram | null
  uniforms: Record<string, WebGLUniformLocation>

  constructor(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShaderSource: string) {
    this.gl = gl
    this.vertexShader = vertexShader
    this.fragmentShaderSource = fragmentShaderSource
    this.programs = {}
    this.activeProgram = null
    this.uniforms = {}
  }

  setKeywords(keywords: string[]): void {
    // Import hashCode dynamically to avoid circular dependency
    const hashCode = (s: string): number => {
      if (s.length === 0) return 0
      let hash = 0
      for (let i = 0; i < s.length; i++) {
        hash = (hash << 5) - hash + s.charCodeAt(i)
        hash |= 0
      }
      return hash
    }
    let hash = 0
    for (let i = 0; i < keywords.length; i++) hash += hashCode(keywords[i])

    let program = this.programs[hash]
    if (program == null) {
      const fragmentShader = compileShader(
        this.gl,
        this.gl.FRAGMENT_SHADER,
        this.fragmentShaderSource,
        keywords
      )

      const newProgram = createProgram(this.gl, this.vertexShader, fragmentShader)
      if (!newProgram) {
        throw new Error('Failed to create WebGL program with keywords')
      }

      program = newProgram
      this.programs[hash] = program
    }

    if (program === this.activeProgram) return

    this.uniforms = getUniforms(this.gl, program)
    this.activeProgram = program
  }

  bind(): void {
    if (!this.activeProgram) {
      throw new Error('No active program to bind')
    }
    this.gl.useProgram(this.activeProgram)
  }
}

