// DOM elements
const minFreqSlider = document.getElementById('min-freq')
const maxFreqSlider = document.getElementById('max-freq')
const sensitivitySlider = document.getElementById('sensitivity')
const minFreqValue = document.getElementById('min-freq-value')
const maxFreqValue = document.getElementById('max-freq-value')
const sensitivityValue = document.getElementById('sensitivity-value')
const startBtn = document.getElementById('start-btn')
const stopBtn = document.getElementById('stop-btn')
const canvas = document.getElementById('canvas')
const beatIndicator = document.getElementById('beat-indicator')
const log = document.getElementById('log')
const connectionStatus = document.getElementById('connection-status')
const thresholdLine = document.getElementById('threshold-line')
const minFreqCursor = document.getElementById('min-freq-cursor')
const maxFreqCursor = document.getElementById('max-freq-cursor')

// Audio context variables
let audioContext
let analyser
let microphone
let audioWorkletNode
let socket

// Configuration
const config = {
  // Using a much wider frequency range for sliders
  minFrequency: parseInt(minFreqSlider.value),
  maxFrequency: parseInt(maxFreqSlider.value),
  sensitivity: parseFloat(sensitivitySlider.value),
  historySize: 43,
  minBeatIntervalMs: 200,
  // Full frequency range for the visualization
  minDisplayFreq: 20,
  maxDisplayFreq: 2000
}

// Beat detection state
let energyHistory = []
let lastBeatTime = 0
let currentThreshold = 0
let currentEnergy = 0
let frequencyData = null
let bufferLength = 0
let sampleRate = 44100

// Setup canvas
canvas.width = canvas.parentNode.offsetWidth
canvas.height = canvas.parentNode.offsetHeight
const canvasContext = canvas.getContext('2d')

// Initialize frequency labels
initFrequencyLabels()

// Connect to WebSocket server
function connectWebSocket() {
  // Get the current hostname and protocol
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host

  socket = new WebSocket(`${protocol}//${host}/ws`)

  socket.onopen = () => {
    // Send initial connection message identifying as beat_detector
    socket.send(
      JSON.stringify({
        type: 'connect',
        payload: {
          role: 'beat_detector'
        }
      })
    )

    connectionStatus.className = 'fixed top-4 left-4 p-2 rounded text-white bg-green-600 text-sm'
    connectionStatus.textContent = 'Connected to Server'
    logMessage('Connected to WebSocket server')
  }

  socket.onclose = () => {
    connectionStatus.className = 'fixed top-4 left-4 p-2 rounded text-white bg-red-600 text-sm'
    connectionStatus.textContent = 'Disconnected'
    logMessage('Disconnected from WebSocket server')

    // Try to reconnect after a delay
    setTimeout(connectWebSocket, 3000)
  }

  socket.onerror = (error) => {
    logMessage('WebSocket error: ' + error.message)
  }

  // Handle server messages
  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data)
      if (message.type === 'connect_ack') {
        logMessage(`Connected with session ID: ${message.payload.sessionId}`)
      }
    } catch (err) {
      logMessage('Error processing message: ' + err.message)
    }
  }
}

// Initialize WebSocket connection
connectWebSocket()

// Create frequency labels
function initFrequencyLabels() {
  const container = document.getElementById('frequency-labels')
  if (!container) return

  // Clear existing labels
  container.innerHTML = ''

  // Create labels at logarithmic intervals
  const freqPoints = [20, 50, 100, 200, 500, 1000, 2000]
  freqPoints.forEach((freq) => {
    const label = document.createElement('div')
    label.textContent = freq < 1000 ? freq : freq / 1000 + 'k'
    container.appendChild(label)
  })

  // Update cursor positions
  updateFrequencyCursors()
}

// Update frequency cursor positions
function updateFrequencyCursors() {
  if (!minFreqCursor || !maxFreqCursor || !canvas) return

  const canvasWidth = canvas.width

  // Calculate positions using logarithmic scale
  const minPos = logScale(
    config.minFrequency,
    config.minDisplayFreq,
    config.maxDisplayFreq,
    0,
    canvasWidth
  )
  const maxPos = logScale(
    config.maxFrequency,
    config.minDisplayFreq,
    config.maxDisplayFreq,
    0,
    canvasWidth
  )

  minFreqCursor.style.left = minPos + 'px'
  minFreqCursor.style.height = canvas.height + 'px'

  maxFreqCursor.style.left = maxPos + 'px'
  maxFreqCursor.style.height = canvas.height + 'px'
}

// Convert from linear to logarithmic scale
function logScale(value, inMin, inMax, outMin, outMax) {
  // Convert to a log scale
  const minLog = Math.log(inMin)
  const maxLog = Math.log(inMax)
  const valueLog = Math.log(value)

  // Calculate the position on a log scale
  const scale = (outMax - outMin) / (maxLog - minLog)
  return outMin + scale * (valueLog - minLog)
}

// Convert from logarithmic scale to linear
function logScaleInverse(position, inMin, inMax, outMin, outMax) {
  const minLog = Math.log(outMin)
  const maxLog = Math.log(outMax)

  const scale = (maxLog - minLog) / (inMax - inMin)
  return Math.exp(minLog + scale * (position - inMin))
}

// Setup audio processing with AudioWorkletNode
async function setupAudio() {
  try {
    // Create audio context
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    sampleRate = audioContext.sampleRate

    // Load and register the audio worklet processor
    await audioContext.audioWorklet.addModule('/static/js/audio-processor.js')

    // Create analyser node
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.3

    // Store the buffer length for later use
    bufferLength = analyser.frequencyBinCount

    // Pre-allocate frequency data array
    frequencyData = new Uint8Array(bufferLength)

    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    microphone = audioContext.createMediaStreamSource(stream)

    // Create AudioWorkletNode (replacing ScriptProcessorNode)
    audioWorkletNode = new AudioWorkletNode(audioContext, 'beat-detector-processor')

    // Connect the graph
    microphone.connect(analyser)
    microphone.connect(audioWorkletNode)

    // We don't need to connect the worklet to the destination since we're only using it for analysis

    // Setup audio processing callback from the worklet
    audioWorkletNode.port.onmessage = (event) => {
      if (event.data.type === 'audioData') {
        processAudioData()
      }
    }

    // Start animation frame to process data
    requestAnimationFrame(updateFrame)

    // Update UI
    startBtn.disabled = true
    stopBtn.disabled = false

    logMessage('Microphone started with AudioWorklet')
  } catch (err) {
    logMessage('Error setting up audio: ' + err.message)
    console.error(err)
  }
}

// Update frame for processing audio data and visualization
function updateFrame() {
  if (!analyser) return

  // Process audio data and update visualization
  processAudioData()

  // Continue animation loop if we're still active
  if (analyser) {
    requestAnimationFrame(updateFrame)
  }
}

// Stop audio processing
function stopAudio() {
  if (audioWorkletNode) {
    audioWorkletNode.disconnect()
    audioWorkletNode = null
  }

  if (microphone) {
    microphone.disconnect()
    microphone = null
  }

  if (analyser) {
    analyser.disconnect()
    analyser = null
  }

  if (audioContext) {
    audioContext.close().then(() => {
      audioContext = null
      logMessage('Audio stopped')
    })
  }

  // Update UI
  startBtn.disabled = false
  stopBtn.disabled = true
}

// Process audio data
function processAudioData() {
  if (!analyser || !frequencyData) return

  // Get frequency data
  analyser.getByteFrequencyData(frequencyData)

  // Draw frequency data
  drawFrequencyData()

  // Calculate energy in frequency band
  currentEnergy = calculateBandEnergy()

  // Add to history
  energyHistory.push(currentEnergy)

  // Keep history at fixed size
  while (energyHistory.length > config.historySize) {
    energyHistory.shift()
  }

  // Need enough history to calculate threshold
  if (energyHistory.length < 10) {
    return
  }

  // Calculate threshold
  currentThreshold = calculateThreshold()

  // Update threshold line
  updateThresholdLine()

  // Check for beat
  const now = Date.now()
  const timeSinceLastBeat = now - lastBeatTime

  if (currentEnergy > currentThreshold && timeSinceLastBeat > config.minBeatIntervalMs) {
    // Beat detected!
    lastBeatTime = now
    const intensity = currentEnergy / currentThreshold

    // Show beat indicator
    beatIndicator.style.opacity = Math.min(1, intensity / 3)
    setTimeout(() => {
      beatIndicator.style.opacity = 0
    }, 100)

    // Send beat event to server
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: 'beat',
          payload: {
            intensity: intensity
          }
        })
      )

      logMessage(`Beat detected! Intensity: ${intensity.toFixed(2)}`)
    }
  }
}

// Update threshold line visualization
function updateThresholdLine() {
  if (!thresholdLine || !canvas) return

  // Convert threshold value to pixel position (inverted, since canvas origin is top left)
  const height = canvas.height
  const thresholdHeight = height - currentThreshold * height * 4 // Scaling factor for better visibility

  // Set threshold line position
  thresholdLine.style.top = Math.max(0, Math.min(height, thresholdHeight)) + 'px'
}

// Calculate energy in frequency band
function calculateBandEnergy() {
  if (!analyser || !frequencyData) return 0

  const binSize = sampleRate / (bufferLength * 2)

  // Convert frequencies to bin indices
  const minBin = Math.max(0, Math.floor(config.minFrequency / binSize))
  const maxBin = Math.min(frequencyData.length - 1, Math.floor(config.maxFrequency / binSize))

  let energy = 0
  for (let i = minBin; i <= maxBin; i++) {
    // Normalized value (0-1) squared for energy
    const value = frequencyData[i] / 255
    energy += value * value
  }

  // Normalize by number of bins to make consistent regardless of frequency range width
  energy /= maxBin - minBin + 1

  return energy
}

// Calculate threshold based on history
function calculateThreshold() {
  // Calculate mean energy
  const mean = energyHistory.reduce((sum, val) => sum + val, 0) / energyHistory.length

  // Calculate variance
  let variance = 0
  for (const energy of energyHistory) {
    const diff = energy - mean
    variance += diff * diff
  }
  variance /= energyHistory.length

  // Threshold is based on mean and variance
  // The higher the sensitivity value, the lower the threshold will be
  // because we multiply the standard deviation by a smaller value when sensitivity is high
  return mean + Math.sqrt(variance) / config.sensitivity
}

// Draw frequency data on canvas
function drawFrequencyData() {
  if (!canvasContext || !frequencyData) return

  const width = canvas.width
  const height = canvas.height

  // Clear canvas
  canvasContext.clearRect(0, 0, width, height)

  // Draw background
  canvasContext.fillStyle = '#111827'
  canvasContext.fillRect(0, 0, width, height)

  // Calculate bin to pixel ratio - using log scale for frequencies
  const binSize = sampleRate / (bufferLength * 2)

  // Draw frequency spectrum
  for (let i = 0; i < bufferLength; i++) {
    const frequency = i * binSize

    // Skip frequencies outside our display range
    if (frequency < config.minDisplayFreq || frequency > config.maxDisplayFreq) continue

    // Calculate x position using log scale
    const x = logScale(frequency, config.minDisplayFreq, config.maxDisplayFreq, 0, width)

    // Calculate bar height (normalize frequency data value)
    const barHeight = (frequencyData[i] / 255) * height

    // Highlight selected frequency range
    if (frequency >= config.minFrequency && frequency <= config.maxFrequency) {
      canvasContext.fillStyle = 'rgb(239, 68, 68)' // Red for selected range
    } else {
      canvasContext.fillStyle = 'rgb(59, 130, 246)' // Blue for other frequencies
    }

    // Draw thinner bars for better resolution at higher frequencies (log scale)
    const barWidth = 2

    // Draw the bar
    canvasContext.fillRect(x, height - barHeight, barWidth, barHeight)
  }

  // Draw current energy level
  canvasContext.fillStyle = 'rgba(6, 182, 212, 0.5)' // Cyan
  const energyHeight = currentEnergy * height * 4 // Scale for better visibility
  canvasContext.fillRect(0, height - energyHeight, width, 4)

  // Draw the current threshold if available
  if (currentThreshold > 0) {
    canvasContext.strokeStyle = '#fbbf24' // Yellow
    canvasContext.lineWidth = 2
    canvasContext.setLineDash([5, 5]) // Dashed line
    canvasContext.beginPath()
    const thresholdHeight = currentThreshold * height * 4
    canvasContext.moveTo(0, height - thresholdHeight)
    canvasContext.lineTo(width, height - thresholdHeight)
    canvasContext.stroke()
    canvasContext.setLineDash([]) // Reset dash
  }
}

// Log message to UI
function logMessage(message) {
  const timestamp = new Date().toLocaleTimeString()
  log.innerHTML += `<div class="text-sm text-gray-300">[${timestamp}] ${message}</div>`
  log.scrollTop = log.scrollHeight
}

// Event listeners
startBtn.addEventListener('click', setupAudio)
stopBtn.addEventListener('click', stopAudio)

minFreqSlider.addEventListener('input', () => {
  // Logarithmic scale for frequency slider
  const minFreq = Math.round(
    logScaleInverse(minFreqSlider.value / 100, 0, 1, config.minDisplayFreq, config.maxDisplayFreq)
  )

  config.minFrequency = minFreq
  minFreqValue.textContent = minFreq

  // Ensure min doesn't exceed max
  if (config.minFrequency >= config.maxFrequency) {
    config.minFrequency = config.maxFrequency - 10
    minFreqValue.textContent = config.minFrequency
    minFreqSlider.value = logScale(
      config.minFrequency,
      config.minDisplayFreq,
      config.maxDisplayFreq,
      0,
      100
    )
  }

  // Update frequency cursors
  updateFrequencyCursors()
})

maxFreqSlider.addEventListener('input', () => {
  // Logarithmic scale for frequency slider
  const maxFreq = Math.round(
    logScaleInverse(maxFreqSlider.value / 100, 0, 1, config.minDisplayFreq, config.maxDisplayFreq)
  )

  config.maxFrequency = maxFreq
  maxFreqValue.textContent = maxFreq

  // Ensure max doesn't go below min
  if (config.maxFrequency <= config.minFrequency) {
    config.maxFrequency = config.minFrequency + 10
    maxFreqValue.textContent = config.maxFrequency
    maxFreqSlider.value = logScale(
      config.maxFrequency,
      config.minDisplayFreq,
      config.maxDisplayFreq,
      0,
      100
    )
  }

  // Update frequency cursors
  updateFrequencyCursors()
})

sensitivitySlider.addEventListener('input', () => {
  config.sensitivity = parseFloat(sensitivitySlider.value)
  sensitivityValue.textContent = config.sensitivity.toFixed(1)
})

// Set slider initial positions based on logarithmic scale
function initializeSliders() {
  // Convert linear frequencies to logarithmic positions (0-100)
  minFreqSlider.value = logScale(
    config.minFrequency,
    config.minDisplayFreq,
    config.maxDisplayFreq,
    0,
    100
  )

  maxFreqSlider.value = logScale(
    config.maxFrequency,
    config.minDisplayFreq,
    config.maxDisplayFreq,
    0,
    100
  )
}

// Initial setup
initializeSliders()
updateFrequencyCursors()
logMessage('Beat detector initialized. Click "Start Microphone" to begin.')

// Handle window resize
window.addEventListener('resize', () => {
  canvas.width = canvas.parentNode.offsetWidth
  canvas.height = canvas.parentNode.offsetHeight
  updateFrequencyCursors()
})
