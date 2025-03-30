'use strict'

import { compileShader, createProgram, getUniforms, hashCode } from './webgl-utils.js'

class Material {
  constructor(gl, vertexShader, fragmentShaderSource) {
    this.gl = gl
    this.vertexShader = vertexShader
    this.fragmentShaderSource = fragmentShaderSource
    this.programs = []
    this.activeProgram = null
    this.uniforms = []
  }

  setKeywords(keywords) {
    let hash = 0
    for (let i = 0; i < keywords.length; i++) hash += hashCode(keywords[i])

    let program = this.programs[hash]
    if (program == null) {
      let fragmentShader = compileShader(
        this.gl,
        this.gl.FRAGMENT_SHADER,
        this.fragmentShaderSource,
        keywords
      )
      program = createProgram(this.gl, this.vertexShader, fragmentShader)
      this.programs[hash] = program
    }

    if (program == this.activeProgram) return

    this.uniforms = getUniforms(this.gl, program)
    this.activeProgram = program
  }

  bind() {
    this.gl.useProgram(this.activeProgram)
  }
}

class Program {
  constructor(gl, vertexShader, fragmentShader) {
    this.gl = gl
    this.uniforms = {}
    this.program = createProgram(gl, vertexShader, fragmentShader)
    this.uniforms = getUniforms(gl, this.program)
  }

  bind() {
    this.gl.useProgram(this.program)
  }
}

export { Material, Program }
