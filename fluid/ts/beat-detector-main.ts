/**
 * Main entry point for the beat detector
 * This file will be compiled by Vite and included in the beat-detector.html page
 */

import { initBeatDetector } from './beat-detector'

// Initialize the beat detector on page load
document.addEventListener('DOMContentLoaded', () => {
  initBeatDetector()
})
