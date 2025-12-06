# Audio Frequency Analysis Libraries - Research

## Overview
Research into existing GitHub repositories and npm packages that handle parsing low/mid/high frequency hits for audio analysis using Web Audio API.

## Top Recommendations

### 1. **audioMotion-analyzer** ⭐ Most Relevant
- **GitHub**: https://github.com/hvianna/audioMotion-analyzer
- **Language**: JavaScript (no dependencies)
- **Features**:
  - High-resolution real-time audio spectrum analyzer
  - Works with Web Audio API
  - Customizable frequency ranges
  - Various visualization modes
  - Real-time frequency band analysis
- **Pros**: 
  - Pure JavaScript, no dependencies
  - Designed for Web Audio API
  - Actively maintained
  - Good documentation
- **Cons**: 
  - Focused on visualization (may need to extract analysis logic)
  - May be heavier than needed if only using analysis features

### 2. **butterchurn** (Already Referenced)
- **GitHub**: https://github.com/jberg/butterchurn
- **Language**: JavaScript/TypeScript
- **Features**:
  - WebGL audio visualizer
  - AudioProcessor component handles frequency analysis
  - Processes low/mid/high bands
  - Uses Web Audio API AnalyserNode
- **Pros**:
  - Well-documented audio processing pipeline
  - Production-ready code
  - Good reference implementation
- **Cons**:
  - Tied to visualization system
  - May be complex to extract just analysis logic

### 3. **audioFlux**
- **GitHub**: https://github.com/libAudioFlux/audioFlux
- **Language**: Python/C++ (with JavaScript bindings)
- **Features**:
  - Deep learning audio analysis
  - Time-frequency transformations
  - Feature extraction
  - Spectral analysis
- **Pros**:
  - Very comprehensive
  - Advanced features
- **Cons**:
  - Primarily Python/C++
  - May be overkill for simple frequency band analysis
  - Not specifically designed for Web Audio API

### 4. **aubio**
- **GitHub**: https://github.com/aubio/aubio
- **Language**: C (with bindings)
- **Features**:
  - Onset detection
  - Pitch tracking
  - Beat tracking
  - Frequency analysis
- **Pros**:
  - Mature library
  - Well-tested algorithms
- **Cons**:
  - C library (requires bindings for JS)
  - Not Web Audio API native
  - More complex integration

## NPM Packages

### Potential NPM Packages to Check:
1. **web-audio-beat-detector** - Beat detection using Web Audio API
2. **audio-oscilloscope** - Audio visualization (may include analysis)
3. **wavesurfer.js** - Audio waveform visualization (includes analysis features)
4. **tone.js** - Web Audio framework (may have analysis utilities)

## Comparison with Current Implementation

### Current Implementation Strengths:
- ✅ Already working with Web Audio API
- ✅ Customizable frequency bands
- ✅ Threshold-based hit detection
- ✅ Real-time analysis
- ✅ Background tab optimization
- ✅ React/TypeScript integration

### What Libraries Could Add:
- More sophisticated beat detection algorithms
- Better smoothing/averaging techniques
- Pre-tuned frequency band ranges
- Additional audio features (onset detection, pitch tracking)
- Optimized performance

## Recommendation

**Best Option: Use audioMotion-analyzer as Reference**

Since your current implementation is already functional and well-integrated with your React app, I recommend:

1. **Keep your current implementation** - It's working well and tailored to your needs
2. **Reference audioMotion-analyzer** - Study their frequency band calculation methods
3. **Consider extracting specific algorithms** - If you find better smoothing or beat detection logic

### Why Not Replace?
- Your implementation is already integrated with React
- You have custom UI components (vertical sliders, range sliders)
- Background tab optimization is already implemented
- Threshold-based hit detection is working
- Custom frequency ranges are configurable

### Potential Improvements from Libraries:
- **Better smoothing algorithms** from audioMotion-analyzer
- **Beat detection algorithms** from aubio/audioFlux
- **Frequency band optimization** from butterchurn

## Next Steps

1. **Review audioMotion-analyzer source code**:
   - Check their frequency band calculation methods
   - See how they handle smoothing
   - Compare with current implementation

2. **Consider extracting specific utilities**:
   - If you find better algorithms, extract just those functions
   - Keep your React component structure
   - Maintain your custom UI

3. **Benchmark performance**:
   - Compare your implementation with library versions
   - Measure CPU usage
   - Test with different audio sources

## Links

- [audioMotion-analyzer](https://github.com/hvianna/audioMotion-analyzer)
- [butterchurn](https://github.com/jberg/butterchurn)
- [audioFlux](https://github.com/libAudioFlux/audioFlux)
- [aubio](https://github.com/aubio/aubio)
- [Web Audio API Spec](https://www.w3.org/TR/webaudio/)

