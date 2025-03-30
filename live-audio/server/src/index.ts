import express from 'express'
import cors from 'cors'
import http from 'http'
import WebSocket from 'ws'
import path from 'path'
import fs from 'fs'
import { exec } from 'child_process'
import os from 'os'
// Using require to import the module as it uses module.exports
import MicrophoneModule = require('node-microphone')

// Configuration
const PORT = 8082
const CONFIG_DIR = path.join(__dirname, '../config')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

// Check system requirements before starting
checkSystemRequirements()

// Function to check if required dependencies are installed
function checkSystemRequirements(): void {
  const platform = os.type()

  if (platform.includes('Windows')) {
    // Check for SoX on Windows
    exec('sox --version', (error) => {
      if (error) {
        console.error('\x1b[31m%s\x1b[0m', '=================================================')
        console.error('\x1b[31m%s\x1b[0m', 'ERROR: SoX is not installed or not in your PATH')
        console.error('\x1b[31m%s\x1b[0m', '=================================================')
        console.error(
          '\x1b[33m%s\x1b[0m',
          'The node-microphone module requires SoX (Sound eXchange) to capture audio on Windows.'
        )
        console.error(
          '\x1b[33m%s\x1b[0m',
          'Please install SoX from: https://sourceforge.net/projects/sox/files/sox/'
        )
        console.error(
          '\x1b[33m%s\x1b[0m',
          'Make sure to add it to your system PATH during installation.'
        )
        console.error('\x1b[33m%s\x1b[0m', 'After installation, restart this application.')
        console.error('\x1b[31m%s\x1b[0m', '=================================================')
      } else {
        console.log('✓ SoX is installed')
      }
    })
  } else if (platform === 'Darwin') {
    // Check for 'rec' command on macOS (part of SoX)
    exec('rec --version', (error) => {
      if (error) {
        console.error('\x1b[31m%s\x1b[0m', '=================================================')
        console.error('\x1b[31m%s\x1b[0m', 'ERROR: SoX is not installed')
        console.error('\x1b[31m%s\x1b[0m', '=================================================')
        console.error(
          '\x1b[33m%s\x1b[0m',
          'The node-microphone module requires SoX (Sound eXchange) to capture audio on macOS.'
        )
        console.error('\x1b[33m%s\x1b[0m', 'Please install SoX using Homebrew:')
        console.error('\x1b[33m%s\x1b[0m', '  brew install sox')
        console.error('\x1b[33m%s\x1b[0m', 'After installation, restart this application.')
        console.error('\x1b[31m%s\x1b[0m', '=================================================')
      } else {
        console.log('✓ SoX is installed')
      }
    })
  } else {
    // Check for 'arecord' on Linux
    exec('arecord --version', (error) => {
      if (error) {
        console.error('\x1b[31m%s\x1b[0m', '=================================================')
        console.error('\x1b[31m%s\x1b[0m', 'ERROR: ALSA tools are not installed')
        console.error('\x1b[31m%s\x1b[0m', '=================================================')
        console.error(
          '\x1b[33m%s\x1b[0m',
          'The node-microphone module requires ALSA tools to capture audio on Linux.'
        )
        console.error('\x1b[33m%s\x1b[0m', 'Please install ALSA tools:')
        console.error('\x1b[33m%s\x1b[0m', '  Debian/Ubuntu: sudo apt-get install alsa-utils')
        console.error('\x1b[33m%s\x1b[0m', '  Red Hat/CentOS: sudo yum install alsa-utils')
        console.error('\x1b[33m%s\x1b[0m', 'After installation, restart this application.')
        console.error('\x1b[31m%s\x1b[0m', '=================================================')
      } else {
        console.log('✓ ALSA tools are installed')
      }
    })
  }
}

// Default configuration
const defaultConfig = {
  deviceName: 'default', // Default device
  sampleRate: 44100,
  channels: 1,
  bitDepth: 16
}

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true })
}

// If config doesn't exist, create it with default values
if (!fs.existsSync(CONFIG_FILE)) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2))
}

// Read the config
const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))

// Create Express app
const app = express()
app.use(cors())

// Create an endpoint to list available audio devices
app.get('/api/devices', (req, res) => {
  try {
    // This is a placeholder - in a real-world app, you would use
    // a platform-specific way to enumerate audio devices
    // For example, on Windows you might use the `AudioDeviceEnumerator` API,
    // on macOS you might use `CoreAudio`, etc.
    res.json([
      { id: 'default', name: 'Default Device' },
      { id: 'mic', name: 'Microphone' }
      // Add more devices here in a real application
    ])
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

// Create an endpoint to get/update the config
app.get('/api/config', (req, res) => {
  res.json(config)
})

app.post('/api/config', express.json(), (req, res) => {
  try {
    const newConfig = { ...config, ...req.body }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2))
    Object.assign(config, newConfig)

    // If the microphone is active, restart it
    if (microphone) {
      restartMicrophone()
    }

    res.json(config)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

// Create HTTP server
const server = http.createServer(app)

// Create WebSocket server
const wss = new WebSocket.Server({ server })

// Store microphone instance
let microphone: InstanceType<typeof MicrophoneModule> | null = null

// Function to restart the microphone
function restartMicrophone(): void {
  if (microphone) {
    microphone.stopRecording()
    microphone = null
  }
  startMicrophone()
}

// Function to start the microphone
function startMicrophone(): void {
  try {
    // Create the microphone instance using constructor
    microphone = new MicrophoneModule({
      device: config.deviceName,
      rate: config.sampleRate,
      channels: config.channels,
      debug: false
    })

    // Handle microphone data
    const micStream = microphone.startRecording()

    micStream.on('data', (data: Buffer) => {
      // Broadcast the audio data to all connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data)
        }
      })
    })

    micStream.on('error', (error: Error) => {
      console.error('Microphone error:', error)
      // If there's an error, restart the microphone after a delay
      setTimeout(restartMicrophone, 5000)
    })

    console.log(`Started recording from device: ${config.deviceName}`)
  } catch (error) {
    console.error('Failed to start microphone:', (error as Error).message)

    // Check if the error is related to missing dependencies
    if (
      (error as Error).message.includes('ENOENT') &&
      (error as Error).message.includes('spawn sox')
    ) {
      console.error('\x1b[31m%s\x1b[0m', '=================================================')
      console.error('\x1b[31m%s\x1b[0m', 'ERROR: SoX is not installed or not in your PATH')
      console.error('\x1b[31m%s\x1b[0m', '=================================================')
      console.error(
        '\x1b[33m%s\x1b[0m',
        'The node-microphone module requires SoX (Sound eXchange) to capture audio on Windows.'
      )
      console.error(
        '\x1b[33m%s\x1b[0m',
        'Please install SoX from: https://sourceforge.net/projects/sox/files/sox/'
      )
      console.error(
        '\x1b[33m%s\x1b[0m',
        'Make sure to add it to your system PATH during installation.'
      )
      console.error('\x1b[33m%s\x1b[0m', 'After installation, restart this application.')
      console.error('\x1b[31m%s\x1b[0m', '=================================================')
    } else if (
      (error as Error).message.includes('ENOENT') &&
      (error as Error).message.includes('spawn rec')
    ) {
      console.error('\x1b[31m%s\x1b[0m', '=================================================')
      console.error('\x1b[31m%s\x1b[0m', 'ERROR: SoX is not installed')
      console.error('\x1b[31m%s\x1b[0m', '=================================================')
      console.error(
        '\x1b[33m%s\x1b[0m',
        'The node-microphone module requires SoX (Sound eXchange) to capture audio on macOS.'
      )
      console.error('\x1b[33m%s\x1b[0m', 'Please install SoX using Homebrew:')
      console.error('\x1b[33m%s\x1b[0m', '  brew install sox')
      console.error('\x1b[33m%s\x1b[0m', 'After installation, restart this application.')
      console.error('\x1b[31m%s\x1b[0m', '=================================================')
    } else if (
      (error as Error).message.includes('ENOENT') &&
      (error as Error).message.includes('spawn arecord')
    ) {
      console.error('\x1b[31m%s\x1b[0m', '=================================================')
      console.error('\x1b[31m%s\x1b[0m', 'ERROR: ALSA tools are not installed')
      console.error('\x1b[31m%s\x1b[0m', '=================================================')
      console.error(
        '\x1b[33m%s\x1b[0m',
        'The node-microphone module requires ALSA tools to capture audio on Linux.'
      )
      console.error('\x1b[33m%s\x1b[0m', 'Please install ALSA tools:')
      console.error('\x1b[33m%s\x1b[0m', '  Debian/Ubuntu: sudo apt-get install alsa-utils')
      console.error('\x1b[33m%s\x1b[0m', '  Red Hat/CentOS: sudo yum install alsa-utils')
      console.error('\x1b[33m%s\x1b[0m', 'After installation, restart this application.')
      console.error('\x1b[31m%s\x1b[0m', '=================================================')
    }
  }
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected')

  // Start microphone if it's not already started
  if (!microphone) {
    startMicrophone()
  }

  // Handle client messages (could be used for control commands)
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`)
    // You could add support for control messages here if needed
  })

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected')

    // If no clients are connected, stop the microphone
    if (wss.clients.size === 0 && microphone) {
      microphone.stopRecording()
      microphone = null
      console.log('Stopped recording - no clients connected')
    }
  })

  // Send initial config to the client
  ws.send(JSON.stringify({ type: 'config', data: config }))
})

// Start the server
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`)
  console.log('Connect to ws://localhost:8082 to receive audio stream')
})
