/**
 * This file will be compiled and loaded as a worklet script.
 * It defines the audio processor that handles the raw audio data
 * and sends it back to the main thread for analysis.
 */

// The following code will be exported as a string and used to register the processor
export const processorCode = `
// Beat detector audio processor
class BeatDetectorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Setup message port for communication with main thread
    this.port.onmessage = this.handleMessage.bind(this);
  }
  
  // Process audio data - this runs in a separate thread
  process(inputs, outputs, parameters) {
    // Get the first input's first channel
    const input = inputs[0];
    if (input && input.length > 0) {
      const samples = input[0];
      
      // If we have audio data, send it to the main thread for analysis
      if (samples && samples.length > 0) {
        this.port.postMessage({
          type: 'audioData',
          data: samples
        });
      }
    }
    
    // Return true to keep the processor alive
    return true;
  }
  
  // Handle messages from the main thread
  handleMessage(event) {
    // Currently no messages are needed from main thread,
    // but this could be used for configuration changes
  }
}

// Register the processor
registerProcessor('beat-detector-processor', BeatDetectorProcessor);
`
