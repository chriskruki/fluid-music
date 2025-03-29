const express = require('express')
const { spawn } = require('child_process')

const app = express()
const PORT = 3000

// Route to stream audio
app.get('/stream', (req, res) => {
  // Spawn an FFmpeg process to capture and encode audio
  const ffmpeg = spawn('ffmpeg', [
    '-f',
    'dshow', // Capture audio on Windows
    '-i',
    'audio="Stereo Mix (Realtek(R) Audio)"', // Use your audio device name
    '-ac',
    '2', // Set number of audio channels
    '-ar',
    '44100', // Set audio sample rate
    '-f',
    'mp3', // Output format
    'pipe:1' // Output to stdout
  ])

  // Set response headers for streaming
  res.set({
    'Content-Type': 'audio/mpeg',
    'Transfer-Encoding': 'chunked'
  })

  // Pipe FFmpeg output to the HTTP response
  ffmpeg.stdout.pipe(res)

  // Handle FFmpeg errors
  ffmpeg.stderr.on('data', (data) => {
    console.error(`FFmpeg error: ${data}`)
  })

  // Clean up FFmpeg process on client disconnect
  req.on('close', () => {
    ffmpeg.kill('SIGINT')
  })
})

// Start the server
app.listen(PORT, () => {
  console.log(`Audio streaming server running at http://localhost:${PORT}/stream`)
})
