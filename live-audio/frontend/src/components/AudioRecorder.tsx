import React, { useState, useEffect, useRef } from 'react'

type RecordingStatus = 'inactive' | 'ready' | 'recording'

interface AudioRecorderProps {
  serverUrl: string
}

/**
 * Component for recording and streaming audio to the server
 */
const AudioRecorder: React.FC<AudioRecorderProps> = ({ serverUrl }) => {
  const [status, setStatus] = useState<RecordingStatus>('inactive')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const socketRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  /**
   * Initialize the audio capture system
   */
  const initializeAudio = async (): Promise<void> => {
    try {
      // Reset any previous error messages
      setErrorMessage('')

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setStatus('ready')
    } catch (error) {
      setErrorMessage(`Microphone access error: ${(error as Error).message}`)
      setStatus('inactive')
    }
  }

  /**
   * Start recording and streaming audio
   */
  const startRecording = (): void => {
    if (!streamRef.current) {
      setErrorMessage('No audio stream available')
      return
    }

    try {
      // Initialize WebSocket connection
      socketRef.current = new WebSocket(serverUrl)

      socketRef.current.onopen = () => {
        // Start MediaRecorder once the socket is open
        if (streamRef.current) {
          const mediaRecorder = new MediaRecorder(streamRef.current, {
            mimeType: 'audio/webm'
          })

          mediaRecorderRef.current = mediaRecorder

          // Send audio data to server when available
          mediaRecorder.ondataavailable = (event) => {
            if (
              event.data.size > 0 &&
              socketRef.current &&
              socketRef.current.readyState === WebSocket.OPEN
            ) {
              event.data
                .arrayBuffer()
                .then((buffer) => {
                  socketRef.current?.send(buffer)
                })
                .catch((error) => {
                  console.error('Error converting data to ArrayBuffer:', error)
                })
            }
          }

          // Start capturing audio data every second
          mediaRecorder.start(1000)
          setStatus('recording')
        }
      }

      socketRef.current.onerror = (error) => {
        setErrorMessage(`WebSocket error: ${error.type}`)
        stopRecording()
      }

      socketRef.current.onclose = () => {
        stopRecording()
      }
    } catch (error) {
      setErrorMessage(`Recording error: ${(error as Error).message}`)
      stopRecording()
    }
  }

  /**
   * Stop recording and close connections
   */
  const stopRecording = (): void => {
    // Stop MediaRecorder if running
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }

    // Close WebSocket if open
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close()
      socketRef.current = null
    }

    // Set status back to ready if we still have access to the microphone
    setStatus(streamRef.current ? 'ready' : 'inactive')
  }

  /**
   * Clean up resources when the component unmounts
   */
  useEffect(() => {
    return () => {
      stopRecording()

      // Stop all tracks in the media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  return (
    <div className="audio-recorder">
      <h2>Live Audio Broadcaster</h2>

      <div className="controls">
        {status === 'inactive' ? (
          <button onClick={initializeAudio} className="initialize-button">
            Initialize Microphone
          </button>
        ) : status === 'ready' ? (
          <button onClick={startRecording} className="start-button">
            Start Broadcasting
          </button>
        ) : (
          <button onClick={stopRecording} className="stop-button">
            Stop Broadcasting
          </button>
        )}
      </div>

      <div className="status">
        <div className={`status-indicator ${status}`}></div>
        <span>Status: {status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </div>

      {errorMessage && <div className="error-message">Error: {errorMessage}</div>}

      {status === 'recording' && (
        <div className="info-message">
          <p>Broadcasting live audio to the server...</p>
          <p>Play back the stream at: http://localhost:8082/hls/audio.m3u8</p>
        </div>
      )}
    </div>
  )
}

export default AudioRecorder
