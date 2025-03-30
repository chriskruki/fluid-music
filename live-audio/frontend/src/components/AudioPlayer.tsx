import React, { useEffect, useRef, useState } from 'react'

interface AudioPlayerProps {
  serverUrl: string
}

/**
 * Component for playing audio streamed from the server via WebSocket
 */
const AudioPlayer: React.FC<AudioPlayerProps> = ({ serverUrl }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [status, setStatus] = useState<string>('Disconnected')
  const [error, setError] = useState<string>('')
  const socketRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const audioQueued = useRef<boolean>(false)
  const audioChunks = useRef<Float32Array[]>([])
  const gainNodeRef = useRef<GainNode | null>(null)

  useEffect(() => {
    // Initialize audio context
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.gain.value = 1.0 // Default volume
      gainNodeRef.current.connect(audioContextRef.current.destination)
    } catch (err) {
      setError(`Audio context initialization failed: ${(err as Error).message}`)
      return
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      disconnect()
    }
  }, [])

  /**
   * Connect to the WebSocket server
   */
  const connect = (): void => {
    try {
      socketRef.current = new WebSocket(serverUrl)
      setStatus('Connecting...')

      socketRef.current.onopen = () => {
        setIsConnected(true)
        setStatus('Connected')
        setError('')
      }

      socketRef.current.onmessage = (event) => {
        // Handle different message types (if the server sends any control messages)
        if (typeof event.data === 'string') {
          try {
            const message = JSON.parse(event.data)
            if (message.type === 'config') {
              console.log('Received config:', message.data)
            }
          } catch (e) {
            console.error('Error parsing JSON message:', e)
          }
          return
        }

        // Handle binary audio data
        event.data
          .arrayBuffer()
          .then((arrayBuffer: ArrayBuffer) => {
            if (audioContextRef.current) {
              // Convert PCM data to Float32Array for Web Audio API
              const pcmData = new Int16Array(arrayBuffer)
              const samples = new Float32Array(pcmData.length)

              // Convert from 16-bit PCM to float
              for (let i = 0; i < pcmData.length; i++) {
                // Convert from 16-bit integer to float
                samples[i] = pcmData[i] / 32768.0
              }

              audioChunks.current.push(samples)

              if (!audioQueued.current) {
                audioQueued.current = true
                scheduleAudioPlayback()
              }
            }
          })
          .catch((err) => {
            console.error('Error processing audio data:', err)
          })
      }

      socketRef.current.onerror = (error) => {
        setError(`WebSocket error: ${error.type}`)
        setStatus('Error')
        setIsConnected(false)
      }

      socketRef.current.onclose = () => {
        setIsConnected(false)
        setStatus('Disconnected')
      }
    } catch (err) {
      setError(`Connection error: ${(err as Error).message}`)
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  const disconnect = (): void => {
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }
    setIsConnected(false)
    setStatus('Disconnected')
    audioChunks.current = []
    audioQueued.current = false
  }

  /**
   * Schedule audio data to be played
   */
  const scheduleAudioPlayback = (): void => {
    if (!audioContextRef.current || !gainNodeRef.current || audioChunks.current.length === 0) {
      audioQueued.current = false
      return
    }

    const chunks = audioChunks.current.slice(0)
    audioChunks.current = []

    // Combine all chunks into one buffer
    let totalLength = 0
    for (const chunk of chunks) {
      totalLength += chunk.length
    }

    const combinedBuffer = new Float32Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      combinedBuffer.set(chunk, offset)
      offset += chunk.length
    }

    // Create audio buffer
    const audioBuffer = audioContextRef.current.createBuffer(
      1, // mono
      combinedBuffer.length,
      audioContextRef.current.sampleRate
    )

    // Fill the buffer with our audio data
    audioBuffer.getChannelData(0).set(combinedBuffer)

    // Create a source node and connect it to the gain node
    const source = audioContextRef.current.createBufferSource()
    source.buffer = audioBuffer
    source.connect(gainNodeRef.current)

    // Start playing
    source.start()

    // Clean up when done
    source.onended = () => {
      if (audioChunks.current.length > 0) {
        // If more chunks arrived while we were processing, play them
        scheduleAudioPlayback()
      } else {
        audioQueued.current = false
      }
    }
  }

  /**
   * Adjust volume
   */
  const adjustVolume = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const volume = parseFloat(event.target.value)
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume
    }
  }

  return (
    <div className="audio-player">
      <h2>Live Audio Player</h2>

      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
        <span>Status: {status}</span>
      </div>

      <div className="controls">
        {!isConnected ? (
          <button onClick={connect} className="connect-button">
            Connect to Stream
          </button>
        ) : (
          <button onClick={disconnect} className="disconnect-button">
            Disconnect
          </button>
        )}

        {isConnected && (
          <div className="volume-control">
            <label htmlFor="volume">Volume:</label>
            <input
              type="range"
              id="volume"
              min="0"
              max="2"
              step="0.1"
              defaultValue="1"
              onChange={adjustVolume}
            />
          </div>
        )}
      </div>

      {error && <div className="error-message">Error: {error}</div>}

      {isConnected && (
        <div className="info-message">
          <p>Streaming live audio from the server...</p>
        </div>
      )}
    </div>
  )
}

export default AudioPlayer
