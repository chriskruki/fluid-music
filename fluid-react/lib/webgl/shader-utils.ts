/**
 * WebGL shader compilation utilities
 */

function hashCode(s: string): number {
  if (s.length === 0) return 0
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

export function compileShader(
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

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.trace(gl.getShaderInfoLog(shader))
  }

  return shader
}

export function addKeywords(source: string, keywords?: string[]): string {
  if (keywords == null) return source
  let keywordsString = ''
  keywords.forEach((keyword) => {
    keywordsString += '#define ' + keyword + '\n'
  })
  return keywordsString + source
}

export function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram {
  const program: WebGLProgram | null = gl.createProgram()
  if (!program) {
    throw new Error('Failed to create WebGL program')
  }
  
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.trace(gl.getProgramInfoLog(program))
  }

  return program
}

export function getUniforms(
  gl: WebGLRenderingContext,
  program: WebGLProgram
): Record<string, WebGLUniformLocation> {
  const uniforms: Record<string, WebGLUniformLocation> = {}
  const uniformCount: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < uniformCount; i++) {
    const activeUniform = gl.getActiveUniform(program, i)
    if (!activeUniform) continue

    const uniformName: string = activeUniform.name
    const uniformLocation = gl.getUniformLocation(program, uniformName)
    if (uniformLocation) {
      uniforms[uniformName] = uniformLocation
    }
  }
  return uniforms
}

export function getTextureScale(
  texture: { width: number; height: number },
  width: number,
  height: number
): { x: number; y: number } {
  return {
    x: width / texture.width,
    y: height / texture.height
  }
}

export { hashCode }

