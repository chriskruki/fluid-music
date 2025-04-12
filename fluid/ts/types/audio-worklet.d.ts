/**
 * Type declarations for AudioWorklet and related interfaces
 */

interface AudioWorkletGlobalScope {
  registerProcessor: (name: string, processorCtor: new () => AudioWorkletProcessor) => void
  currentTime: number
  sampleRate: number
}

declare class AudioWorkletProcessor {
  port: MessagePort
  constructor()
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean
}

interface AudioParamDescriptor {
  name: string
  defaultValue?: number
  minValue?: number
  maxValue?: number
  automationRate?: 'a-rate' | 'k-rate'
}

declare function registerProcessor(
  name: string,
  processorCtor: new () => AudioWorkletProcessor
): void
