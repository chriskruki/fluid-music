declare module 'node-microphone' {
  import { EventEmitter } from 'events'
  import { Stream } from 'stream'

  interface MicrophoneOptions {
    device?: string
    rate?: number
    channels?: number
    endian?: string
    bitwidth?: string
    encoding?: string
    debug?: boolean
    additionalParameters?: string[]
    useDataEmitter?: boolean
  }

  class Microphone extends EventEmitter {
    constructor(options?: MicrophoneOptions)
    startRecording(): Stream
    stopRecording(): void
  }

  export = Microphone
}
