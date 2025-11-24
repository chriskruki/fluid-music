'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useWebSocket } from '@/stores/websocket'

export function BeatDetector() {
  const [isRecording, setIsRecording] = useState(false)
  const [minFrequency, setMinFrequency] = useState(20)
  const [maxFrequency, setMaxFrequency] = useState(20000)
  const [sensitivity, setSensitivity] = useState(1.5)
  const [currentEnergy, setCurrentEnergy] = useState(0)
  const [lastBeatTime, setLastBeatTime] = useState(0)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  
  const { isConnected, sendMessage, connect, disconnect } = useWebSocket()
  
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    connect(wsUrl, 'beat_detector')
    
    return () => {
      disconnect()
      stopRecording()
    }
  }, [connect, disconnect])
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)
      
      const bufferLength = analyser.frequencyBinCount
      const buffer = new ArrayBuffer(bufferLength)
      const dataArray = new Uint8Array(buffer)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      dataArrayRef.current = dataArray
      
      setIsRecording(true)
      analyzeAudio()
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }
  
  const stopRecording = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    analyserRef.current = null
    dataArrayRef.current = null
    setIsRecording(false)
  }
  
  const analyzeAudio = () => {
    if (!analyserRef.current || !dataArrayRef.current) return
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current)
    
    // Calculate energy in frequency range
    const startBin = Math.floor((minFrequency / 22050) * dataArrayRef.current.length)
    const endBin = Math.floor((maxFrequency / 22050) * dataArrayRef.current.length)
    
    let energy = 0
    for (let i = startBin; i < endBin; i++) {
      energy += dataArrayRef.current[i]
    }
    energy = energy / (endBin - startBin) / 255
    
    setCurrentEnergy(energy)
    
    // Beat detection
    const threshold = sensitivity
    const now = Date.now()
    
    if (energy > threshold && now - lastBeatTime > 200) {
      setLastBeatTime(now)
      
      // Send beat event
      if (isConnected) {
        sendMessage({
          type: 'beat',
          payload: {
            intensity: energy,
            frequency: (minFrequency + maxFrequency) / 2,
            timestamp: now
          }
        })
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(analyzeAudio)
  }
  
  return (
    <div className="min-h-screen p-4 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">Beat Detector</h1>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-6 py-3 rounded font-semibold ${
              isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>
        
        <div>
          <label className="block mb-2">
            Min Frequency: {minFrequency} Hz
          </label>
          <input
            type="range"
            min="20"
            max="20000"
            value={minFrequency}
            onChange={(e) => setMinFrequency(Number(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block mb-2">
            Max Frequency: {maxFrequency} Hz
          </label>
          <input
            type="range"
            min="20"
            max="20000"
            value={maxFrequency}
            onChange={(e) => setMaxFrequency(Number(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block mb-2">
            Sensitivity: {sensitivity.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <p>Current Energy: {currentEnergy.toFixed(3)}</p>
          <div className="w-full bg-gray-700 h-4 rounded mt-2">
            <div
              className="bg-blue-500 h-4 rounded transition-all"
              style={{ width: `${Math.min(currentEnergy * 100, 100)}%` }}
            />
          </div>
        </div>
        
        {!isConnected && (
          <div className="bg-yellow-600 text-white px-4 py-2 rounded">
            WebSocket Disconnected
          </div>
        )}
      </div>
    </div>
  )
}

