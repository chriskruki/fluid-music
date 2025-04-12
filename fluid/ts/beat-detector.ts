import { processorCode } from './beat-detector-processor'

// Beat detector configuration
interface BeatDetectorConfig {
  minFrequency: number
  maxFrequency: number
  sensitivity: number
  historySize: number
  minBeatIntervalMs: number
  minDisplayFreq: number
  maxDisplayFreq: number
}

// Element references
interface DOMElements {
  minFreqSlider: HTMLInputElement
  maxFreqSlider: HTMLInputElement
  sensitivitySlider: HTMLInputElement
  minFreqValue: HTMLElement
  maxFreqValue: HTMLElement
  sensitivityValue: HTMLElement
  startBtn: HTMLButtonElement
  stopBtn: HTMLButtonElement
  canvas: HTMLCanvasElement
  canvasContext: CanvasRenderingContext2D
  beatIndicator: HTMLElement
  log: HTMLElement
  connectionStatus: HTMLElement
  thresholdLine: HTMLElement
  minFreqCursor: HTMLElement
  maxFreqCursor: HTMLElement
  frequencyLabels: HTMLElement
}

// Beat detection state
interface BeatState {
  energyHistory: number[]
  lastBeatTime: number
  currentThreshold: number
  currentEnergy: number
  frequencyData: Uint8Array | null
  bufferLength: number
  sampleRate: number
}

// WebSocket connection
let socket: WebSocket | null = null

// Audio context variables
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let microphone: MediaStreamAudioSourceNode | null = null
let audioWorkletNode: AudioWorkletNode | null = null

// State
let elements: DOMElements
let config: BeatDetectorConfig
let state: BeatState

/**
 * Initialize the beat detector
 */
export function initBeatDetector(): void {
  // Initialize DOM elements
  elements = {
    minFreqSlider: document.getElementById('min-freq') as HTMLInputElement,
    maxFreqSlider: document.getElementById('max-freq') as HTMLInputElement,
    sensitivitySlider: document.getElementById('sensitivity') as HTMLInputElement,
    minFreqValue: document.getElementById('min-freq-value') as HTMLElement,
    maxFreqValue: document.getElementById('max-freq-value') as HTMLElement,
    sensitivityValue: document.getElementById('sensitivity-value') as HTMLElement,
    startBtn: document.getElementById('start-btn') as HTMLButtonElement,
    stopBtn: document.getElementById('stop-btn') as HTMLButtonElement,
    canvas: document.getElementById('canvas') as HTMLCanvasElement,
    canvasContext: (document.getElementById('canvas') as HTMLCanvasElement).getContext(
      '2d'
    ) as CanvasRenderingContext2D,
    beatIndicator: document.getElementById('beat-indicator') as HTMLElement,
    log: document.getElementById('log') as HTMLElement,
    connectionStatus: document.getElementById('connection-status') as HTMLElement,
    thresholdLine: document.getElementById('threshold-line') as HTMLElement,
    minFreqCursor: document.getElementById('min-freq-cursor') as HTMLElement,
    maxFreqCursor: document.getElementById('max-freq-cursor') as HTMLElement,
    frequencyLabels: document.getElementById('frequency-labels') as HTMLElement
  }

  // Initial configuration
  config = {
    minFrequency: parseInt(elements.minFreqSlider.value),
    maxFrequency: parseInt(elements.maxFreqSlider.value),
    sensitivity: parseFloat(elements.sensitivitySlider.value),
    historySize: 43,
    minBeatIntervalMs: 200,
    minDisplayFreq: 20,
    maxDisplayFreq: 2000
  }

  // Initial state
  state = {
    energyHistory: [],
    lastBeatTime: 0,
    currentThreshold: 0,
    currentEnergy: 0,
    frequencyData: null,
    bufferLength: 0,
    sampleRate: 44100
  }

  // Setup canvas
  elements.canvas.width = elements.canvas.parentElement?.offsetWidth ?? 800
  elements.canvas.height = elements.canvas.parentElement?.offsetHeight ?? 300

  // Initialize frequency labels
  initFrequencyLabels()

  // Set up event listeners
  elements.startBtn.addEventListener('click', setupAudio)
  elements.stopBtn.addEventListener('click', stopAudio)
  elements.minFreqSlider.addEventListener('input', updateMinFrequency)
  elements.maxFreqSlider.addEventListener('input', updateMaxFrequency)
  elements.sensitivitySlider.addEventListener('input', updateSensitivity)

  // Initialize sliders with logarithmic scale
  initializeSliders()

  // Connect to WebSocket server
  connectWebSocket()

  // Handle window resize
  window.addEventListener('resize', handleResize)

  // Log initialization
  logMessage('Beat detector initialized. Click "Start Microphone" to begin.')
}

/**
 * Connect to WebSocket server
 */
function connectWebSocket(): void {
  // Get the current hostname and protocol
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host

  socket = new WebSocket(`${protocol}//${host}/ws`)

  socket.onopen = (): void => {
    // Send initial connection message identifying as beat_detector
    socket.send(
      JSON.stringify({
        type: 'connect',
        payload: {
          role: 'beat_detector'
        }
      })
    )

    elements.connectionStatus.className =
      'fixed top-4 left-4 p-2 rounded text-white bg-green-600 text-sm'
    elements.connectionStatus.textContent = 'Connected to Server'
    logMessage('Connected to WebSocket server')
  }

  socket.onclose = (): void => {
    elements.connectionStatus.className =
      'fixed top-4 left-4 p-2 rounded text-white bg-red-600 text-sm'
    elements.connectionStatus.textContent = 'Disconnected'
    logMessage('Disconnected from WebSocket server')

    // Try to reconnect after a delay
    setTimeout(connectWebSocket, 3000)
  }

  socket.onerror = (error: Event): void => {
    logMessage('WebSocket error')
    console.error('WebSocket error:', error)
  }

  // Handle server messages
  socket.onmessage = (event: MessageEvent): void => {
    try {
      const message = JSON.parse(event.data)
      if (message.type === 'connect_ack') {
        logMessage(`Connected with session ID: ${message.payload.sessionId}`)
      }
    } catch (err) {
      console.error('Error processing message:', err)
      if (err instanceof Error) {
        logMessage('Error processing message: ' + err.message)
      }
    }
  }
}

/**
 * Initialize frequency labels
 */
function initFrequencyLabels(): void {
  if (!elements.frequencyLabels) return

  // Clear existing labels
  elements.frequencyLabels.innerHTML = ''

  // Create labels at logarithmic intervals
  const freqPoints = [20, 50, 100, 200, 500, 1000, 2000]
  freqPoints.forEach((freq) => {
    const label = document.createElement('div')
    label.textContent = freq < 1000 ? `${freq}` : `${freq / 1000}k`
    elements.frequencyLabels.appendChild(label)
  })

  // Update cursor positions
  updateFrequencyCursors()
}

/**
 * Update frequency cursor positions
 */
function updateFrequencyCursors(): void {
  if (!elements.minFreqCursor || !elements.maxFreqCursor || !elements.canvas) return

  const canvasWidth = elements.canvas.width

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

  elements.minFreqCursor.style.left = `${minPos}px`
  elements.minFreqCursor.style.height = `${elements.canvas.height}px`

  elements.maxFreqCursor.style.left = `${maxPos}px`
  elements.maxFreqCursor.style.height = `${elements.canvas.height}px`
}

/**
 * Convert from linear to logarithmic scale
 */
function logScale(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  // Convert to a log scale
  const minLog = Math.log(inMin)
  const maxLog = Math.log(inMax)
  const valueLog = Math.log(value)

  // Calculate the position on a log scale
  const scale = (outMax - outMin) / (maxLog - minLog)
  return outMin + scale * (valueLog - minLog)
}

/**
 * Convert from logarithmic scale to linear
 */
function logScaleInverse(
  position: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  const minLog = Math.log(outMin)
  const maxLog = Math.log(outMax)

  const scale = (maxLog - minLog) / (inMax - inMin)
  return Math.exp(minLog + scale * (position - inMin))
}

/**
 * Set up audio processing with AudioWorkletNode
 */
async function setupAudio(): Promise<void> {
  try {
    // Create audio context
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    state.sampleRate = audioContext.sampleRate

    // Create a Blob from the processor code
    const blob = new Blob([processorCode], { type: 'application/javascript' })
    const workletUrl = URL.createObjectURL(blob)

    // Load the worklet
    await audioContext.audioWorklet.addModule(workletUrl)

    // Create analyser node
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.3

    // Store the buffer length for later use
    state.bufferLength = analyser.frequencyBinCount

    // Pre-allocate frequency data array
    state.frequencyData = new Uint8Array(state.bufferLength)

    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    microphone = audioContext.createMediaStreamSource(stream)

    // Create AudioWorkletNode
    audioWorkletNode = new AudioWorkletNode(audioContext, 'beat-detector-processor')

    // Connect the graph
    microphone.connect(analyser)
    microphone.connect(audioWorkletNode)

    // Setup audio processing callback from the worklet
    audioWorkletNode.port.onmessage = (event: MessageEvent): void => {
      if (event.data.type === 'audioData') {
        processAudioData()
      }
    }

    // Start animation frame to process data
    requestAnimationFrame(updateFrame)

    // Update UI
    elements.startBtn.disabled = true
    elements.stopBtn.disabled = false

    logMessage('Microphone started with AudioWorklet')
  } catch (err) {
    console.error('Error setting up audio:', err)
    if (err instanceof Error) {
      logMessage('Error setting up audio: ' + err.message)
    }
  }
}

/**
 * Update frame for processing audio data and visualization
 */
function updateFrame(): void {
  if (!analyser) return

  // Process audio data and update visualization
  processAudioData()

  // Continue animation loop if we're still active
  if (analyser) {
    requestAnimationFrame(updateFrame)
  }
}

/**
 * Stop audio processing
 */
function stopAudio(): void {
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
  elements.startBtn.disabled = false
  elements.stopBtn.disabled = true
}

/**
 * Process audio data
 */
function processAudioData(): void {
  if (!analyser || !state.frequencyData) return

  // Get frequency data
  analyser.getByteFrequencyData(state.frequencyData)

  // Draw frequency data
  drawFrequencyData()

  // Calculate energy in frequency band
  state.currentEnergy = calculateBandEnergy()

  // Add to history
  state.energyHistory.push(state.currentEnergy)

  // Keep history at fixed size
  while (state.energyHistory.length > config.historySize) {
    state.energyHistory.shift()
  }

  // Need enough history to calculate threshold
  if (state.energyHistory.length < 10) {
    return
  }

  // Calculate threshold
  state.currentThreshold = calculateThreshold()

  // Update threshold line
  updateThresholdLine()

  // Check for beat
  const now = Date.now()
  const timeSinceLastBeat = now - state.lastBeatTime

  if (
    state.currentEnergy > state.currentThreshold &&
    timeSinceLastBeat > config.minBeatIntervalMs
  ) {
    // Beat detected!
    state.lastBeatTime = now
    const intensity = state.currentEnergy / state.currentThreshold

    // Show beat indicator
    elements.beatIndicator.style.opacity = Math.min(1, intensity / 3).toString()
    setTimeout(() => {
      elements.beatIndicator.style.opacity = '0'
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

/**
 * Update threshold line visualization
 */
function updateThresholdLine(): void {
  if (!elements.thresholdLine || !elements.canvas) return

  // Convert threshold value to pixel position (inverted, since canvas origin is top left)
  const height = elements.canvas.height
  const thresholdHeight = height - state.currentThreshold * height * 4 // Scaling factor for better visibility

  // Set threshold line position
  elements.thresholdLine.style.top = `${Math.max(0, Math.min(height, thresholdHeight))}px`
}

/**
 * Calculate energy in frequency band
 */
function calculateBandEnergy(): number {
  if (!analyser || !state.frequencyData) return 0

  const binSize = state.sampleRate / (state.bufferLength * 2)

  // Convert frequencies to bin indices
  const minBin = Math.max(0, Math.floor(config.minFrequency / binSize))
  const maxBin = Math.min(state.frequencyData.length - 1, Math.floor(config.maxFrequency / binSize))

  let energy = 0
  for (let i = minBin; i <= maxBin; i++) {
    // Normalized value (0-1) squared for energy
    const value = state.frequencyData[i] / 255
    energy += value * value
  }

  // Normalize by number of bins to make consistent regardless of frequency range width
  energy /= maxBin - minBin + 1

  return energy
}

/**
 * Calculate threshold based on history
 */
function calculateThreshold(): number {
  // Calculate mean energy
  const mean = state.energyHistory.reduce((sum, val) => sum + val, 0) / state.energyHistory.length

  // Calculate variance
  let variance = 0
  for (const energy of state.energyHistory) {
    const diff = energy - mean
    variance += diff * diff
  }
  variance /= state.energyHistory.length

  // Threshold is based on mean and variance
  // The higher the sensitivity value, the lower the threshold will be
  // because we multiply the standard deviation by a smaller value when sensitivity is high
  return mean + Math.sqrt(variance) / config.sensitivity
}

/**
 * Draw frequency data on canvas
 */
function drawFrequencyData(): void {
  if (!elements.canvasContext || !state.frequencyData) return

  const width = elements.canvas.width
  const height = elements.canvas.height

  // Clear canvas
  elements.canvasContext.clearRect(0, 0, width, height)

  // Draw background
  elements.canvasContext.fillStyle = '#111827'
  elements.canvasContext.fillRect(0, 0, width, height)

  // Calculate bin to pixel ratio - using log scale for frequencies
  const binSize = state.sampleRate / (state.bufferLength * 2)

  // Draw frequency spectrum
  for (let i = 0; i < state.bufferLength; i++) {
    const frequency = i * binSize

    // Skip frequencies outside our display range
    if (frequency < config.minDisplayFreq || frequency > config.maxDisplayFreq) continue

    // Calculate x position using log scale
    const x = logScale(frequency, config.minDisplayFreq, config.maxDisplayFreq, 0, width)

    // Calculate bar height (normalize frequency data value)
    const barHeight = (state.frequencyData[i] / 255) * height

    // Highlight selected frequency range
    if (frequency >= config.minFrequency && frequency <= config.maxFrequency) {
      elements.canvasContext.fillStyle = 'rgb(239, 68, 68)' // Red for selected range
    } else {
      elements.canvasContext.fillStyle = 'rgb(59, 130, 246)' // Blue for other frequencies
    }

    // Draw thinner bars for better resolution at higher frequencies (log scale)
    const barWidth = 2

    // Draw the bar
    elements.canvasContext.fillRect(x, height - barHeight, barWidth, barHeight)
  }

  // Draw current energy level
  elements.canvasContext.fillStyle = 'rgba(6, 182, 212, 0.5)' // Cyan
  const energyHeight = state.currentEnergy * height * 4 // Scale for better visibility
  elements.canvasContext.fillRect(0, height - energyHeight, width, 4)

  // Draw the current threshold if available
  if (state.currentThreshold > 0) {
    elements.canvasContext.strokeStyle = '#fbbf24' // Yellow
    elements.canvasContext.lineWidth = 2
    elements.canvasContext.setLineDash([5, 5]) // Dashed line
    elements.canvasContext.beginPath()
    const thresholdHeight = state.currentThreshold * height * 4
    elements.canvasContext.moveTo(0, height - thresholdHeight)
    elements.canvasContext.lineTo(width, height - thresholdHeight)
    elements.canvasContext.stroke()
    elements.canvasContext.setLineDash([]) // Reset dash
  }
}

/**
 * Log message to UI
 */
function logMessage(message: string): void {
  const timestamp = new Date().toLocaleTimeString()
  elements.log.innerHTML += `<div class="text-sm text-gray-300">[${timestamp}] ${message}</div>`
  elements.log.scrollTop = elements.log.scrollHeight
}

/**
 * Update minimum frequency
 */
function updateMinFrequency(): void {
  // Logarithmic scale for frequency slider
  const minFreq = Math.round(
    logScaleInverse(
      parseInt(elements.minFreqSlider.value) / 100,
      0,
      1,
      config.minDisplayFreq,
      config.maxDisplayFreq
    )
  )

  config.minFrequency = minFreq
  elements.minFreqValue.textContent = minFreq.toString()

  // Ensure min doesn't exceed max
  if (config.minFrequency >= config.maxFrequency) {
    config.minFrequency = config.maxFrequency - 10
    elements.minFreqValue.textContent = config.minFrequency.toString()
    elements.minFreqSlider.value = logScale(
      config.minFrequency,
      config.minDisplayFreq,
      config.maxDisplayFreq,
      0,
      100
    ).toString()
  }

  // Update frequency cursors
  updateFrequencyCursors()
}

/**
 * Update maximum frequency
 */
function updateMaxFrequency(): void {
  // Logarithmic scale for frequency slider
  const maxFreq = Math.round(
    logScaleInverse(
      parseInt(elements.maxFreqSlider.value) / 100,
      0,
      1,
      config.minDisplayFreq,
      config.maxDisplayFreq
    )
  )

  config.maxFrequency = maxFreq
  elements.maxFreqValue.textContent = maxFreq.toString()

  // Ensure max doesn't go below min
  if (config.maxFrequency <= config.minFrequency) {
    config.maxFrequency = config.minFrequency + 10
    elements.maxFreqValue.textContent = config.maxFrequency.toString()
    elements.maxFreqSlider.value = logScale(
      config.maxFrequency,
      config.minDisplayFreq,
      config.maxDisplayFreq,
      0,
      100
    ).toString()
  }

  // Update frequency cursors
  updateFrequencyCursors()
}

/**
 * Update sensitivity
 */
function updateSensitivity(): void {
  config.sensitivity = parseFloat(elements.sensitivitySlider.value)
  elements.sensitivityValue.textContent = config.sensitivity.toFixed(1)
}

/**
 * Set slider initial positions based on logarithmic scale
 */
function initializeSliders(): void {
  // Convert linear frequencies to logarithmic positions (0-100)
  elements.minFreqSlider.value = logScale(
    config.minFrequency,
    config.minDisplayFreq,
    config.maxDisplayFreq,
    0,
    100
  ).toString()

  elements.maxFreqSlider.value = logScale(
    config.maxFrequency,
    config.minDisplayFreq,
    config.maxDisplayFreq,
    0,
    100
  ).toString()
}

/**
 * Handle window resize
 */
function handleResize(): void {
  elements.canvas.width = elements.canvas.parentElement?.offsetWidth ?? 800
  elements.canvas.height = elements.canvas.parentElement?.offsetHeight ?? 300
  updateFrequencyCursors()
}
