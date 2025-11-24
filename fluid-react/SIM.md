# Fluid Music Simulation - Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Fluid Simulation Algorithm](#fluid-simulation-algorithm)
5. [WebGL Rendering Pipeline](#webgl-rendering-pipeline)
6. [Input Handling System](#input-handling-system)
7. [Remote Control System](#remote-control-system)
8. [Beat Detection System](#beat-detection-system)
9. [Configuration System](#configuration-system)
10. [Shader System](#shader-system)
11. [Framebuffer Management](#framebuffer-management)
12. [Color System](#color-system)
13. [Mirror Mode Implementation](#mirror-mode-implementation)
14. [GUI System](#gui-system)
15. [Server Architecture](#server-architecture)
16. [Message Protocol](#message-protocol)
17. [Data Flow](#data-flow)
18. [Implementation Notes for React/Next.js](#implementation-notes-for-reactnextjs)

---

## System Overview

The Fluid Music application is a real-time WebGL-based fluid dynamics simulation with remote control capabilities and audio-reactive beat detection. The system consists of three main applications:

1. **Fluid Simulator** (`index.html`): Main WebGL fluid simulation with interactive controls
2. **Remote Controller** (`control.html`): Touch/mouse interface for remote control
3. **Beat Detector** (`beat-detector.html`): Audio analysis tool that detects beats and triggers visual effects

All components communicate via WebSocket through a Node.js/Express server.

### Technology Stack
- **Frontend**: TypeScript, WebGL 1.0/2.0, HTML5 Canvas
- **Backend**: Node.js, Express, WebSocket (ws library)
- **Build**: Vite, TypeScript compiler
- **GUI**: dat.GUI (to be replaced with shadcn UI in React version)

---

## Architecture

### High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Fluid Sim      │     │  Remote Control │     │  Beat Detector  │
│  (Simulator)    │     │  (Controller)   │     │  (Beat Source)  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                      │                        │
         │  WebSocket (ws://)    │                        │
         └──────────────────────┼────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   Express Server     │
                    │   WebSocket Server   │
                    │   (Message Router)   │
                    └──────────────────────┘
```

### Component Relationships

1. **Simulator** connects as role `'simulator'` - receives commands and input events
2. **Controller** connects as role `'controller'` - sends input events and commands
3. **Beat Detector** connects as role `'beat_detector'` - sends beat events

The server acts as a message router, broadcasting:
- Input events from controllers → simulators
- Commands from controllers → simulators
- Beat events from beat detectors → simulators

---

## Core Components

### 1. Main Simulation (`main.ts`)

**Purpose**: Orchestrates the entire fluid simulation, WebGL context, and rendering loop.

**Key Responsibilities**:
- Initialize WebGL context and extensions
- Create and manage shaders, programs, and framebuffers
- Run the main animation loop (`requestAnimationFrame`)
- Handle canvas resizing
- Coordinate input processing, simulation steps, and rendering
- Manage remote control and beat detection integration

**Initialization Sequence**:
1. Wait for DOM ready
2. Get canvas element
3. Initialize WebGL context (`getWebGLContext`)
4. Detect WebGL capabilities (WebGL1 vs WebGL2, extensions)
5. Create all shaders (vertex and fragment)
6. Create all programs (shader pairs)
7. Create framebuffers (dye, velocity, pressure, etc.)
8. Setup blit function (fullscreen quad renderer)
9. Initialize remote control WebSocket
10. Setup GUI (dat.GUI)
11. Setup input event listeners
12. Create initial random splats
13. Start animation loop

**Main Loop (`update()` function)**:
```typescript
function update(): void {
  1. Calculate delta time (capped at 16.67ms)
  2. Resize canvas if needed → reinitialize framebuffers
  3. Update colors (if rainbow mode enabled)
  4. Apply local inputs (mouse/touch splats)
  5. Process remote actions (remote inputs, commands, beats)
  6. Update beat visualizer UI
  7. Run simulation step (if not paused)
  8. Render to screen
  9. Request next animation frame
}
```

**Key Global Variables**:
- `canvas: HTMLCanvasElement` - The main rendering canvas
- `gl: WebGLRenderingContext` - WebGL rendering context
- `ext: WebGLExtensions` - WebGL extension capabilities
- `blit: (destination: FBO | null) => void` - Function to render fullscreen quad
- Shader instances (baseVertexShader, blurShader, etc.)
- Program instances (splatProgram, advectionProgram, etc.)
- Framebuffers (dye: DoubleFBO, velocity: DoubleFBO, pressure: DoubleFBO, etc.)
- `displayMaterial: Material` - Dynamic shader material for final display

### 2. Configuration System (`config.ts`)

**Purpose**: Centralized configuration object with all simulation parameters.

**Configuration Object Structure**:
```typescript
interface FluidConfig {
  // Resolution settings
  SIM_RESOLUTION: number        // Simulation resolution (32-256, default: 128)
  DYE_RESOLUTION: number        // Dye/color resolution (128-1024, default: 1024)
  CAPTURE_RESOLUTION: number    // Screenshot resolution (default: 512)
  
  // Physics parameters
  DENSITY_DISSIPATION: number   // How fast dye fades (0-4.0, default: 0.5)
  VELOCITY_DISSIPATION: number  // How fast velocity fades (0-4.0, default: 0.1)
  PRESSURE: number              // Pressure constant (0.0-1.0, default: 0.2)
  PRESSURE_ITERATIONS: number   // Pressure solver iterations (default: 20)
  CURL: number                  // Vorticity strength (0-50, default: 5)
  
  // Splat parameters
  SPLAT_RADIUS: number          // Size of splats (0.01-1.0, default: 0.25)
  SPLAT_FORCE: number           // Force multiplier (default: 6000)
  SPLAT_SPEED: number           // Speed of pattern splats (100-2000, default: 1000)
  SPLAT_COUNT: number           // Number of splats in patterns (1-50, default: 5)
  
  // Visual effects
  SHADING: boolean              // Enable 3D shading effect (default: true)
  COLORFUL: boolean             // Enable color evolution (default: true)
  COLOR_UPDATE_SPEED: number    // Speed of color changes (default: 10)
  RAINBOW_MODE: boolean         // Rainbow vs single color (default: true)
  SPLAT_COLOR: Color            // Single color when rainbow disabled ({r:0.15, g:0.5, b:1.0})
  
  // Mirror mode
  MIRROR_MODE: boolean          // Enable mirror mode (default: false)
  MIRROR_SEGMENTS: number       // Number of mirror segments (1-8, default: 2)
  
  // Post-processing
  BLOOM: boolean                // Bloom effect (default: false)
  BLOOM_ITERATIONS: number      // Bloom blur passes (default: 8)
  BLOOM_RESOLUTION: number      // Bloom resolution (default: 256)
  BLOOM_INTENSITY: number       // Bloom intensity (0.1-2.0, default: 0.1)
  BLOOM_THRESHOLD: number       // Bloom threshold (0.0-1.0, default: 0.6)
  BLOOM_SOFT_KNEE: number       // Bloom soft knee (default: 0.7)
  
  SUNRAYS: boolean              // Sunrays effect (default: true)
  SUNRAYS_RESOLUTION: number    // Sunrays resolution (default: 196)
  SUNRAYS_WEIGHT: number        // Sunrays weight (0.3-1.0, default: 0.5)
  
  // Display
  BACK_COLOR: BackColor         // Background color ({r:0, g:0, b:0})
  TRANSPARENT: boolean          // Transparent background (default: false)
  PAUSED: boolean               // Pause simulation (default: false)
  SHOW_DEBUG: boolean           // Show debug info (default: false)
}
```

**PointerPrototype Class**:
Represents a single input pointer (mouse or touch):
```typescript
class PointerPrototype {
  id: number              // Unique identifier (-1 for mouse, touch.identifier for touches)
  texcoordX: number       // Normalized X coordinate (0-1)
  texcoordY: number       // Normalized Y coordinate (0-1, flipped)
  prevTexcoordX: number   // Previous X for delta calculation
  prevTexcoordY: number   // Previous Y for delta calculation
  deltaX: number          // Movement delta X
  deltaY: number          // Movement delta Y
  down: boolean           // Is pointer pressed
  moved: boolean          // Has pointer moved since last frame
  color: Color            // Color for this pointer's splats
}
```

**Helper Functions**:
- `isMobile()`: Detects mobile devices via user agent
- `wrap(value, min, max)`: Wraps value within range
- `getResolution(gl, resolution)`: Calculates resolution accounting for aspect ratio
- `scaleByPixelRatio(input)`: Scales by device pixel ratio

### 3. WebGL Utilities (`webgl-utils.ts`)

**Purpose**: WebGL context initialization, extension detection, and shader compilation utilities.

**Key Functions**:

**`getWebGLContext(canvas)`**:
- Attempts WebGL2 first, falls back to WebGL1
- Detects and enables extensions:
  - `EXT_color_buffer_float` (WebGL2)
  - `OES_texture_half_float` (WebGL1)
  - `OES_texture_float_linear` / `OES_texture_half_float_linear`
- Tests supported texture formats (RGBA16F, RG16F, R16F) with fallbacks
- Returns `{ gl, ext }` where `ext` contains format information

**`compileShader(gl, type, source, keywords?)`**:
- Adds keyword defines to shader source
- Compiles shader
- Returns compiled WebGLShader

**`createProgram(gl, vertexShader, fragmentShader)`**:
- Links vertex and fragment shaders into a program
- Returns WebGLProgram

**`getUniforms(gl, program)`**:
- Queries all active uniforms in program
- Returns object mapping uniform names to locations

**Format Detection**:
The system tests framebuffer support for different formats:
- WebGL2: Prefers `RGBA16F`, `RG16F`, `R16F`
- WebGL1: Falls back to `RGBA` with half-float textures
- Tests by creating a test framebuffer and checking status

### 4. Core Classes (`core-classes.ts`)

**Material Class**:
Dynamic shader material that supports keyword-based shader variants:
```typescript
class Material {
  gl: WebGLRenderingContext
  vertexShader: WebGLShader
  fragmentShaderSource: string
  programs: Record<number, WebGLProgram>  // Cached programs by keyword hash
  activeProgram: WebGLProgram | null
  uniforms: Record<string, WebGLUniformLocation>
  
  setKeywords(keywords: string[]): void
    // Creates or retrieves program variant based on keywords
    // Keywords are added as #define statements in shader
    // Hash is computed from keyword array
    // Caches programs to avoid recompilation
  
  bind(): void
    // Activates the current program
}
```

**Program Class**:
Simple wrapper for a static shader program:
```typescript
class Program {
  gl: WebGLRenderingContext
  uniforms: Record<string, WebGLUniformLocation>
  program: WebGLProgram
  
  bind(): void
    // Activates the program
}
```

---

## Fluid Simulation Algorithm

The simulation implements a GPU-accelerated Navier-Stokes fluid solver using a pressure-projection method.

### Simulation Step (`simulation.ts` - `step()` function)

The simulation runs in multiple passes, each rendered to framebuffers:

**1. Curl Calculation**:
```glsl
// Fragment shader calculates curl (vorticity) from velocity field
curl = ∂v/∂x - ∂u/∂y
```
- Input: `velocity.read` (RG format, 2 channels)
- Output: `curl` (R format, single channel)
- Purpose: Measures local rotation in velocity field

**2. Vorticity Confinement**:
```glsl
// Adds vorticity force to velocity field
velocity += curl * CURL_STRENGTH * dt
```
- Input: `velocity.read`, `curl`
- Output: `velocity.write`
- Swaps velocity buffers
- Purpose: Preserves and enhances swirling motion

**3. Divergence Calculation**:
```glsl
// Calculates divergence (compression/expansion)
divergence = ∂u/∂x + ∂v/∂y
```
- Input: `velocity.read`
- Output: `divergence` (R format)
- Purpose: Measures how much velocity field compresses/expands

**4. Pressure Solver (Jacobi Iteration)**:
```glsl
// Iteratively solves for pressure to make velocity divergence-free
pressure = (divergence + neighbor_pressure_sum) / 4.0
```
- Runs `PRESSURE_ITERATIONS` times (default: 20)
- Uses double buffering (pressure.read ↔ pressure.write)
- Purpose: Makes velocity field incompressible (divergence ≈ 0)

**5. Gradient Subtract**:
```glsl
// Subtracts pressure gradient from velocity
velocity -= ∇pressure
```
- Input: `pressure.read`, `velocity.read`
- Output: `velocity.write`
- Swaps velocity buffers
- Purpose: Removes divergence from velocity field

**6. Velocity Advection**:
```glsl
// Advects velocity field using itself
velocity_new = sample(velocity_old, position - velocity * dt)
velocity *= dissipation_factor
```
- Input: `velocity.read`
- Output: `velocity.write`
- Swaps velocity buffers
- Purpose: Moves velocity field along its own flow, applies dissipation

**7. Dye Advection**:
```glsl
// Advects dye (color) using velocity field
dye_new = sample(dye_old, position - velocity * dt)
dye *= dissipation_factor
```
- Input: `dye.read`, `velocity.read`
- Output: `dye.write`
- Swaps dye buffers
- Purpose: Moves color along velocity flow, applies dissipation

### Splat System

**Splat Function** (`splat()`):
Creates a circular impulse in both velocity and dye fields:
```typescript
function splat(
  gl, x, y, dx, dy, color, splatProgram, velocity, dye, canvas, blit
)
```

**Process**:
1. Bind splat shader program
2. Render to velocity buffer:
   - Uniforms: `point` (x, y), `color` (dx, dy, 0), `radius`, `aspectRatio`
   - Shader creates Gaussian falloff: `exp(-dot(p, p) / radius)`
   - Adds velocity impulse
   - Swaps velocity buffers
3. Render to dye buffer:
   - Same point and radius
   - Color uniform: `(color.r, color.g, color.b)`
   - Adds color
   - Swaps dye buffers

**Splat Shader**:
```glsl
vec2 p = vUv - point.xy;
p.x *= aspectRatio;  // Correct for aspect ratio
vec3 splat = exp(-dot(p, p) / radius) * color;
vec3 base = texture2D(uTarget, vUv).xyz;
gl_FragColor = vec4(base + splat, 1.0);
```

**Mirror Mode Splatting** (`splatWithMirror()`):
When mirror mode is enabled, creates additional mirrored splats:

- **2 segments**: Horizontal mirror
  - Original: `(x, y)` with velocity `(dx, dy)`
  - Mirrored: `(1-x, y)` with velocity `(-dx, dy)`

- **4 segments**: Rotational symmetry (mandala)
  - Original: `(x, y)` with `(dx, dy)`
  - 90°: `(1-y, x)` with `(-dy, dx)`
  - 180°: `(1-x, 1-y)` with `(-dx, -dy)`
  - 270°: `(y, 1-x)` with `(dy, -dx)`

- **8 segments**: Adds diagonal mirrors
  - Diagonal 1: `(y, x)` with `(dy, dx)`
  - Diagonal 2: `(1-y, 1-x)` with `(-dy, -dx)`

**Pattern Functions**:
- `createSplatsRight()`: Horizontal line of splats moving right
- `createSplatsLeft()`: Horizontal line moving left
- `createSplatsUp()`: Vertical line moving up
- `createSplatsDown()`: Vertical line moving down
- `createSplatsHorizontal()`: Two horizontal lines (top left→right, bottom right→left)
- `createSplatsVertical()`: Two vertical lines
- `createCornerSplats()`: Splats from all four corners toward center
- `multipleSplats()`: Random splats at random positions

All pattern functions use `splatWithMirror()` to respect mirror mode.

### Color Generation

**`generateColor()`**:
- If `RAINBOW_MODE` is false: Returns `config.SPLAT_COLOR`
- If `RAINBOW_MODE` is true:
  1. Generates random hue (0-1)
  2. Converts HSV to RGB (saturation=1.0, value=1.0)
  3. Multiplies RGB by 0.15 (to reduce intensity)
  4. Returns color

**HSV to RGB Conversion**:
Standard HSV→RGB algorithm with 6 cases based on hue sector.

**Color Evolution** (`updateColors()`):
- Only runs if `COLORFUL` and `RAINBOW_MODE` are both true
- Uses timer: `colorUpdateTimer += dt * COLOR_UPDATE_SPEED`
- When timer >= 1.0:
  - Wraps timer back to 0-1 range
  - Generates new colors for all pointers (local and remote)

---

## WebGL Rendering Pipeline

### Framebuffer System (`framebuffers.ts`)

**FBO Interface**:
```typescript
interface FBO {
  texture: WebGLTexture      // The texture
  fbo: WebGLFramebuffer      // The framebuffer object
  width: number              // Width in pixels
  height: number             // Height in pixels
  texelSizeX: number         // 1.0 / width
  texelSizeY: number         // 1.0 / height
  attach(id: number): number // Binds texture to texture unit, returns id
}
```

**DoubleFBO Interface**:
```typescript
interface DoubleFBO {
  width: number
  height: number
  texelSizeX: number
  texelSizeY: number
  read: FBO                  // Read buffer
  write: FBO                 // Write buffer
  swap(): void               // Swaps read and write buffers
}
```

**Framebuffer Creation**:
- `createFBO()`: Creates single framebuffer with texture
  - Sets texture parameters (filtering, wrap mode)
  - Creates framebuffer and attaches texture
  - Clears to black
  - Returns FBO object

- `createDoubleFBO()`: Creates two FBOs for ping-pong buffering
  - Uses getters/setters to swap read/write
  - Essential for iterative algorithms (pressure solver, advection)

**Blit Function** (`setupBlit()`):
Creates a fullscreen quad renderer:
- Creates vertex buffer with quad vertices: `[-1,-1, -1,1, 1,1, 1,-1]`
- Creates index buffer: `[0,1,2, 0,2,3]`
- Returns function that:
  - Sets viewport (to target size or canvas size)
  - Binds framebuffer (target or null for screen)
  - Optionally clears
  - Draws quad using `gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)`

### Rendering Pipeline (`rendering.ts`)

**Main Render Function** (`render()`):
```typescript
function render(
  gl, target, dye, bloom, sunrays, sunraysTemp, ditheringTexture,
  displayMaterial, colorProgram, checkerboardProgram, blit,
  bloomFramebuffers, bloomPrefilterProgram, bloomBlurProgram,
  bloomFinalProgram, sunraysMaskProgram, sunraysProgram, blurProgram
)
```

**Render Order**:
1. **Bloom Preprocessing** (if `BLOOM` enabled):
   - Prefilter: Extracts bright areas above threshold
   - Blur: Multi-pass blur (downscaled mipmaps)
   - Final: Combines blurred layers

2. **Sunrays Processing** (if `SUNRAYS` enabled):
   - Mask: Creates alpha mask from bright areas
   - Sunrays: Radial blur effect from center
   - Blur: Additional blur pass

3. **Background**:
   - If not transparent: Fill with `BACK_COLOR`
   - If transparent: Draw checkerboard pattern

4. **Final Display**:
   - Binds display material (dynamic shader)
   - Sets keywords based on enabled effects (`SHADING`, `BLOOM`, `SUNRAYS`)
   - Attaches textures:
     - `uTexture`: dye.read (main fluid)
     - `uBloom`: bloom (if enabled)
     - `uSunrays`: sunrays (if enabled)
     - `uDithering`: dithering texture (if bloom enabled)
   - Renders to target (null = screen)

**Display Shader** (`displayShaderSource`):
Multi-purpose fragment shader with conditional compilation:

```glsl
// Base color from dye texture
vec3 c = texture2D(uTexture, vUv).rgb;

#ifdef SHADING
  // Calculate normal from gradient
  vec3 lc = texture2D(uTexture, vL).rgb;
  vec3 rc = texture2D(uTexture, vR).rgb;
  vec3 tc = texture2D(uTexture, vT).rgb;
  vec3 bc = texture2D(uTexture, vB).rgb;
  
  float dx = length(rc) - length(lc);
  float dy = length(tc) - length(bc);
  vec3 n = normalize(vec3(dx, dy, length(texelSize)));
  vec3 l = vec3(0.0, 0.0, 1.0);  // Light from camera
  
  float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
  c *= diffuse;  // Apply shading
#endif

#ifdef BLOOM
  vec3 bloom = texture2D(uBloom, vUv).rgb;
  float noise = texture2D(uDithering, vUv * ditherScale).r;
  noise = noise * 2.0 - 1.0;
  bloom += noise / 255.0;  // Dithering
  bloom = linearToGamma(bloom);  // Gamma correction
  c += bloom;  // Add bloom
#endif

#ifdef SUNRAYS
  float sunrays = texture2D(uSunrays, vUv).r;
  c *= sunrays;  // Multiply by sunrays
  #ifdef BLOOM
    bloom *= sunrays;  // Also affect bloom
  #endif
#endif

// Alpha channel is maximum of RGB
float a = max(c.r, max(c.g, c.b));
gl_FragColor = vec4(c, a);
```

**Bloom Effect**:
1. **Prefilter**: Extracts bright pixels above threshold
   - Uses soft-knee curve for smooth transition
   - Formula: `c *= max(rq, br - threshold) / max(br, 0.0001)`

2. **Blur**: Multi-pass downscaled blur
   - Creates mipmap chain (each level half resolution)
   - Uses 4-tap blur (L, R, T, B neighbors)
   - Blends back up the chain

3. **Final**: Applies intensity and adds to main image

**Sunrays Effect**:
1. **Mask**: Creates alpha mask from bright areas
   - `alpha = 1.0 - min(max(brightness * 20.0, 0.0), 0.8)`

2. **Sunrays**: Radial blur from center
   - Samples along ray from center to edge
   - Applies decay and exposure
   - 16 iterations

3. **Blur**: Additional horizontal blur pass

---

## Input Handling System

### Local Input (`input.ts`)

**Purpose**: Handles mouse and touch input on the main simulator canvas.

**Event Listeners**:
- `mousedown`: Creates/updates pointer, generates color
- `mousemove`: Updates pointer position, calculates delta, triggers splat
- `mouseup`: Marks pointer as not down
- `touchstart`: Creates multiple pointers (one per touch)
- `touchmove`: Updates touch positions, triggers splats
- `touchend`: Removes pointers
- `keydown`: 
  - 'P' key: Toggles pause
  - Spacebar: Adds random splats to queue

**Coordinate System**:
- Screen coordinates converted to normalized texture coordinates (0-1)
- Y-axis flipped: `texcoordY = 1.0 - (posY / canvas.height)`
- Deltas corrected for aspect ratio

**Pointer Management**:
- Local pointers stored in `pointers` array
- Mouse uses `pointers[0]` with `id = -1`
- Touches use `pointers[i+1]` with `id = touch.identifier`
- Each pointer has its own color (generated on mousedown/touchstart)

**Splat Queue**:
- `splatStack` array holds queued splat counts
- Spacebar pushes random count (5-25)
- Processed in `applyInputs()` function

### Remote Input (`remote.ts`)

**Purpose**: Receives and processes input events from remote controllers via WebSocket.

**Remote Pointer Management**:
- `remotePointers: Map<string, PointerPrototype>` - Maps controller IDs to pointers
- Each controller gets its own pointer instance
- Pointers created on first `mousedown` event
- Colors generated on each `mousedown` (multiplied by 10x for vibrancy)

**Message Processing** (`processRemoteInput()`):
- `mousedown`: Creates/updates pointer, generates color
- `mousemove`: Updates position, calculates delta, marks as moved
- `mouseup`: Marks pointer as not down

**Remote Actions Queue**:
```typescript
interface RemoteActions {
  randomSplats: number      // Count of random splats to create
  patternName: string | null // Pattern name to apply
}
```

**Command Processing** (`processRemoteCommand()`):
- `random_splats`: Queues random splats
- `preset_pattern`: Queues pattern (right, left, up, down, horizontal, vertical, corners)
- `set_rainbow_mode`: Updates `config.RAINBOW_MODE`
- `set_splat_color`: Updates `config.SPLAT_COLOR` (converts hex to RGB 0-1)

**Beat Event Processing** (`processBeatEvent()`):
- Updates `beatState` with intensity and timestamp
- Queues visual effects based on intensity:
  - Intensity > 2.5: Many random splats + corner pattern
  - Intensity > 1.5: Moderate splats + horizontal/vertical pattern
  - Otherwise: Minimal splats

**Application** (`processRemoteActions()`):
Called each frame from main loop:
1. Applies remote pointer movements (splats)
2. Processes queued random splats
3. Processes queued patterns
4. Updates beat state cooldown

---

## Beat Detection System

### Beat Detector (`beat-detector.ts`)

**Purpose**: Analyzes microphone audio input, detects beats, and sends events to server.

**Initialization**:
1. Gets DOM elements (sliders, canvas, buttons, etc.)
2. Sets up WebSocket connection
3. Initializes frequency labels and cursors
4. Sets up event listeners

**Audio Setup** (`setupAudio()`):
1. Creates `AudioContext`
2. Creates `AnalyserNode` (FFT size: 2048, smoothing: 0.3)
3. Creates `AudioWorkletNode` from processor code
4. Requests microphone access (`getUserMedia`)
5. Connects: `microphone → analyser` and `microphone → worklet`
6. Starts animation loop

**Audio Processing** (`processAudioData()`):
Called each frame:
1. Gets frequency data: `analyser.getByteFrequencyData(frequencyData)`
2. Draws frequency spectrum visualization
3. Calculates energy in selected frequency band
4. Adds energy to history (keeps last 43 samples)
5. Calculates threshold from history (mean + stddev / sensitivity)
6. Checks for beat:
   - Current energy > threshold
   - Time since last beat > minBeatIntervalMs (200ms)
7. If beat detected:
   - Calculates intensity: `energy / threshold`
   - Shows visual indicator
   - Sends beat event to server via WebSocket

**Frequency Band Selection**:
- `minFrequency` and `maxFrequency` define band (default: 20-2000 Hz)
- Sliders use logarithmic scale (20-2000 Hz range)
- Energy calculated as sum of squared normalized bin values
- Normalized by number of bins

**Threshold Calculation**:
```typescript
mean = sum(energyHistory) / history.length
variance = sum((energy - mean)^2) / history.length
threshold = mean + sqrt(variance) / sensitivity
```
- Higher sensitivity = lower threshold (more sensitive)
- Default sensitivity: 1.0

**Visualization**:
- Canvas shows frequency spectrum (logarithmic X-axis)
- Selected frequency range highlighted in red
- Current energy shown as cyan bar
- Threshold shown as yellow dashed line
- Frequency labels at: 20, 50, 100, 200, 500, 1000, 2000 Hz

### Audio Worklet Processor (`beat-detector-processor.ts`)

**Purpose**: Runs in separate audio thread, processes raw audio samples.

**Processor Code**:
```javascript
class BeatDetectorProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const samples = inputs[0][0];  // First input, first channel
    if (samples && samples.length > 0) {
      this.port.postMessage({
        type: 'audioData',
        data: samples
      });
    }
    return true;  // Keep processor alive
  }
}
registerProcessor('beat-detector-processor', BeatDetectorProcessor);
```

**Note**: Currently sends raw samples to main thread, but main thread uses AnalyserNode instead. The worklet could be used for more advanced processing in the future.

---

## Server Architecture

### Express Server (`server.ts`)

**Purpose**: HTTP server + WebSocket message router.

**Server Setup**:
- Express app serves static files from `dist/public`
- Static assets from `/static` directory
- Routes:
  - `/` → `index.html` (simulator)
  - `/control` → `control.html` (controller)
  - `/beat-detector` → `beat-detector.html` (beat detector)

**WebSocket Server**:
- Path: `/ws`
- Uses `ws` library
- Generates UUID for each connection

**Client Management**:
```typescript
const clients: ClientMap = {
  controllers: Map<string, WebSocket>,    // Remote controllers
  simulators: Map<string, WebSocket>,     // Fluid simulators
  beatDetectors: Map<string, WebSocket>   // Beat detectors
}
```

**Connection Flow**:
1. Client connects → Server generates `sessionId`
2. Client sends `{ type: 'connect', payload: { role: 'simulator'|'controller'|'beat_detector' } }`
3. Server adds to appropriate map
4. Server sends `connect_ack` with sessionId and client counts
5. Server broadcasts updated client counts to all clients

**Message Routing**:

**Input Events** (`type: 'input'`):
- From: Controllers
- To: All simulators
- Payload: `{ eventType: 'mousedown'|'mousemove'|'mouseup', position: {x, y} }`
- Server adds `controllerId` and broadcasts as `remote_input`

**Commands** (`type: 'command'`):
- From: Controllers
- To: All simulators
- Payload: `{ command: string, parameters: object }`
- Server adds `controllerId` and broadcasts

**Beat Events** (`type: 'beat'`):
- From: Beat detectors
- To: All simulators
- Payload: `{ intensity: number }`
- Server adds `beatDetectorId` and broadcasts

**Client Counts** (`type: 'client_counts'`):
- From: Server
- To: All clients
- Sent when clients connect/disconnect
- Payload: `{ controllers: number, simulators: number, beatDetectors: number }`

**Disconnection Handling**:
- Removes client from appropriate map
- Broadcasts updated counts
- No explicit cleanup needed (WebSocket handles it)

---

## Message Protocol

### Message Format

All messages are JSON objects with this structure:
```typescript
interface BaseMessage {
  type: string
  payload: any
  timestamp?: number  // Added by server
}
```

### Message Types

**1. Connect** (`type: 'connect'`):
```typescript
{
  type: 'connect',
  payload: {
    role: 'simulator' | 'controller' | 'beat_detector'
  }
}
```

**2. Connect Acknowledgment** (`type: 'connect_ack'`):
```typescript
{
  type: 'connect_ack',
  payload: {
    status: 'success',
    sessionId: string,
    connectedClients: {
      controllers: number,
      simulators: number,
      beatDetectors: number
    }
  },
  timestamp: number
}
```

**3. Input** (`type: 'input'`):
```typescript
{
  type: 'input',
  payload: {
    eventType: 'mousedown' | 'mousemove' | 'mouseup',
    position: {
      x: number,  // Normalized 0-1
      y: number   // Normalized 0-1
    }
  }
}
```

**4. Remote Input** (`type: 'remote_input'`):
```typescript
{
  type: 'remote_input',
  payload: {
    eventType: 'mousedown' | 'mousemove' | 'mouseup',
    position: { x: number, y: number },
    controllerId: string
  },
  timestamp: number
}
```

**5. Command** (`type: 'command'`):
```typescript
{
  type: 'command',
  payload: {
    command: 'random_splats' | 'preset_pattern' | 'set_rainbow_mode' | 'set_splat_color',
    parameters: {
      // For random_splats:
      count?: number
      
      // For preset_pattern:
      patternName?: 'right' | 'left' | 'up' | 'down' | 'horizontal' | 'vertical' | 'corners'
      
      // For set_rainbow_mode:
      enabled?: boolean
      
      // For set_splat_color:
      color?: string  // Hex color like "#ff0000"
    },
    controllerId?: string  // Added by server
  },
  timestamp?: number
}
```

**6. Beat** (`type: 'beat'`):
```typescript
{
  type: 'beat',
  payload: {
    intensity: number,  // energy / threshold ratio
    beatDetectorId?: string  // Added by server
  },
  timestamp?: number
}
```

**7. Client Counts** (`type: 'client_counts'`):
```typescript
{
  type: 'client_counts',
  payload: {
    controllers: number,
    simulators: number,
    beatDetectors: number
  },
  timestamp: number
}
```

---

## Shader System

### Vertex Shaders

**Base Vertex Shader** (`createBaseVertexShader`):
```glsl
precision highp float;

attribute vec2 aPosition;  // Quad vertices: [-1,-1], [-1,1], [1,1], [1,-1]
varying vec2 vUv;          // Texture coordinates (0-1)
varying vec2 vL, vR, vT, vB; // Neighbor coordinates for sampling
uniform vec2 texelSize;     // 1.0 / texture_size

void main() {
  vUv = aPosition * 0.5 + 0.5;  // Convert -1..1 to 0..1
  vL = vUv - vec2(texelSize.x, 0.0);  // Left neighbor
  vR = vUv + vec2(texelSize.x, 0.0);  // Right neighbor
  vT = vUv + vec2(0.0, texelSize.y);  // Top neighbor
  vB = vUv - vec2(0.0, texelSize.y);  // Bottom neighbor
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
```

**Blur Vertex Shader** (`createBlurVertexShader`):
Similar but with offset multiplier (1.33333333) for better blur quality.

### Fragment Shaders

**1. Advection Shader** (`createAdvectionShader`):
Advects a field using velocity:
```glsl
vec2 coord = vUv - velocity * dt;
vec3 result = texture2D(uSource, coord).rgb;
result *= dissipation;  // Fade over time
gl_FragColor = vec4(result, 1.0);
```

**2. Splat Shader** (`createSplatShader`):
Adds circular impulse:
```glsl
vec2 p = vUv - point.xy;
p.x *= aspectRatio;
vec3 splat = exp(-dot(p, p) / radius) * color;
vec3 base = texture2D(uTarget, vUv).xyz;
gl_FragColor = vec4(base + splat, 1.0);
```

**3. Curl Shader** (`createCurlShader`):
Calculates vorticity:
```glsl
float L = texture2D(uVelocity, vL).y;
float R = texture2D(uVelocity, vR).y;
float T = texture2D(uVelocity, vT).x;
float B = texture2D(uVelocity, vB).x;
float curl = (R - L) - (T - B);
gl_FragColor = vec4(curl, 0.0, 0.0, 1.0);
```

**4. Vorticity Shader** (`createVorticityShader`):
Adds vorticity force:
```glsl
float curl = texture2D(uCurl, vUv).x;
vec2 force = vec2(
  abs(curl) * (texture2D(uVelocity, vT).x - texture2D(uVelocity, vB).x),
  abs(curl) * (texture2D(uVelocity, vR).y - texture2D(uVelocity, vL).y)
);
force *= curl_strength * dt;
vec2 velocity = texture2D(uVelocity, vUv).xy + force;
gl_FragColor = vec4(velocity, 0.0, 1.0);
```

**5. Divergence Shader** (`createDivergenceShader`):
Calculates divergence:
```glsl
float L = texture2D(uVelocity, vL).x;
float R = texture2D(uVelocity, vR).x;
float T = texture2D(uVelocity, vT).y;
float B = texture2D(uVelocity, vB).y;
float divergence = ((R - L) + (T - B)) * 0.5;
gl_FragColor = vec4(divergence, 0.0, 0.0, 1.0);
```

**6. Pressure Shader** (`createPressureShader`):
Jacobi iteration for pressure:
```glsl
float divergence = texture2D(uDivergence, vUv).x;
float L = texture2D(uPressure, vL).x;
float R = texture2D(uPressure, vR).x;
float T = texture2D(uPressure, vT).x;
float B = texture2D(uPressure, vB).x;
float pressure = (L + R + T + B - divergence) * 0.25;
gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
```

**7. Gradient Subtract Shader** (`createGradientSubtractShader`):
Removes divergence:
```glsl
float pL = texture2D(uPressure, vL).x;
float pR = texture2D(uPressure, vR).x;
float pT = texture2D(uPressure, vT).x;
float pB = texture2D(uPressure, vB).x;
vec2 gradient = vec2((pR - pL) * 0.5, (pT - pB) * 0.5);
vec2 velocity = texture2D(uVelocity, vUv).xy - gradient;
gl_FragColor = vec4(velocity, 0.0, 1.0);
```

**8. Clear Shader** (`createClearShader`):
Multiplies by constant:
```glsl
vec4 value = texture2D(uTexture, vUv);
gl_FragColor = value * uniform_value;
```

**9. Copy Shader** (`createCopyShader`):
Simple texture copy:
```glsl
gl_FragColor = texture2D(uTexture, vUv);
```

**10. Color Shader** (`createColorShader`):
Solid color fill:
```glsl
gl_FragColor = uniform_color;
```

**11. Checkerboard Shader** (`createCheckerboardShader`):
Checkerboard pattern for transparent mode:
```glsl
vec2 uv = floor(vUv * SCALE * vec2(aspectRatio, 1.0));
float v = mod(uv.x + uv.y, 2.0);
v = v * 0.1 + 0.8;
gl_FragColor = vec4(vec3(v), 1.0);
```

**12. Blur Shader** (`createBlurShader`):
3-tap horizontal blur:
```glsl
vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
sum += texture2D(uTexture, vL) * 0.35294117;
sum += texture2D(uTexture, vR) * 0.35294117;
gl_FragColor = sum;
```

**13. Bloom Shaders**:
- **Prefilter**: Extracts bright areas with soft-knee curve
- **Blur**: 4-tap blur (L, R, T, B)
- **Final**: Applies intensity

**14. Sunrays Shaders**:
- **Mask**: Creates alpha mask from brightness
- **Sunrays**: Radial blur with decay

---

## Data Flow

### Frame Update Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Main Loop (60 FPS)                    │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Update Colors│  │ Apply Inputs │  │ Process      │
│ (if enabled) │  │ (local +     │  │ Remote       │
│              │  │  remote)     │  │ Actions      │
└──────────────┘  └──────────────┘  └──────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Simulation Step │
                 │ (if not paused) │
                 └─────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Calculate    │  │ Solve        │  │ Advect       │
│ Curl &       │  │ Pressure      │  │ Velocity &   │
│ Vorticity    │  │ (20 iters)   │  │ Dye          │
└──────────────┘  └──────────────┘  └──────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Render Pipeline │
                 └─────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Bloom        │  │ Sunrays      │  │ Final        │
│ Processing   │  │ Processing    │  │ Display      │
│ (if enabled) │  │ (if enabled)  │  │ Composite    │
└──────────────┘  └──────────────┘  └──────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Render to Screen│
                 └─────────────────┘
```

### Input Flow

**Local Input**:
```
Mouse/Touch Event
       │
       ▼
updatePointerDownData / updatePointerMoveData
       │
       ▼
Calculate normalized coordinates & deltas
       │
       ▼
Generate color (if mousedown)
       │
       ▼
Mark pointer.moved = true
       │
       ▼
Next Frame: applyInputs()
       │
       ▼
splatPointer() → splatWithMirror()
       │
       ▼
Render splat to velocity & dye buffers
```

**Remote Input**:
```
Controller Touch/Mouse
       │
       ▼
getNormalizedCoordinates()
       │
       ▼
Send WebSocket message { type: 'input', payload: {...} }
       │
       ▼
Server adds controllerId, broadcasts as 'remote_input'
       │
       ▼
Simulator receives → processRemoteInput()
       │
       ▼
Create/update remotePointer
       │
       ▼
Next Frame: processRemoteActions()
       │
       ▼
applyRemotePointers() → splatPointer() → splatWithMirror()
```

### Beat Detection Flow

```
Microphone Audio
       │
       ▼
AudioWorkletProcessor (separate thread)
       │
       ▼
AnalyserNode.getByteFrequencyData()
       │
       ▼
Calculate energy in frequency band
       │
       ▼
Add to energy history (43 samples)
       │
       ▼
Calculate threshold (mean + stddev / sensitivity)
       │
       ▼
Check: energy > threshold && timeSinceLastBeat > 200ms
       │
       ▼
If beat: Calculate intensity = energy / threshold
       │
       ▼
Send WebSocket: { type: 'beat', payload: { intensity } }
       │
       ▼
Server broadcasts to all simulators
       │
       ▼
Simulator: processBeatEvent()
       │
       ▼
Queue remoteActions based on intensity
       │
       ▼
Next Frame: processRemoteActions()
       │
       ▼
Create splats / patterns
```

---

## Implementation Notes for React/Next.js

### Component Structure

**Recommended Structure**:
```
app/
  page.tsx                    # Main simulator page
  control/
    page.tsx                  # Remote controller page
  beat-detector/
    page.tsx                  # Beat detector page
components/
  fluid-simulator/
    FluidSimulator.tsx        # Main WebGL component
    useFluidSimulation.ts     # Custom hook for simulation logic
    useWebGLContext.ts        # Custom hook for WebGL setup
  controls/
    SimulationControls.tsx    # shadcn UI controls panel
    ColorControls.tsx         # Color mode controls
    MirrorControls.tsx        # Mirror mode controls
  remote-controller/
    RemoteCanvas.tsx          # Touch/mouse canvas
    ControlPanel.tsx          # Button panel
  beat-detector/
    BeatDetector.tsx          # Audio analysis component
    FrequencyVisualizer.tsx   # Canvas visualization
hooks/
  useWebSocket.ts             # WebSocket connection hook
  useAudioInput.ts            # Microphone access hook
lib/
  webgl/
    shaders.ts                # Shader source strings
    programs.ts               # Program creation
    framebuffers.ts           # FBO management
    simulation.ts             # Simulation step logic
  config/
    fluidConfig.ts            # Configuration store (Zustand/Context)
  websocket/
    client.ts                 # WebSocket client wrapper
    messages.ts               # Message type definitions
```

### Key Implementation Considerations

**1. WebGL Context Management**:
- Use `useRef` for canvas element
- Initialize WebGL in `useEffect` with cleanup
- Store WebGL resources (shaders, programs, framebuffers) in refs or state
- Handle context loss: `gl.getExtension('WEBGL_lose_context')`

**2. Animation Loop**:
- Use `useEffect` with `requestAnimationFrame`
- Cleanup on unmount: `cancelAnimationFrame`
- Consider using `useFrame` from `@react-three/fiber` if integrating with Three.js

**3. State Management**:
- Use Zustand or Context API for `config` object
- WebGL resources should be in refs (not state) to avoid re-renders
- Pointer arrays can be in refs or state (state if UI needs updates)

**4. WebSocket Integration**:
- Create custom hook: `useWebSocket(url, onMessage)`
- Handle reconnection logic
- Use Zustand store for connection state

**5. Audio Worklet**:
- Next.js: Place worklet file in `public/` directory
- Load via: `audioContext.audioWorklet.addModule('/beat-detector-processor.js')`
- Or use Blob URL approach (as in current implementation)

**6. shadcn UI Components**:
- Replace dat.GUI with shadcn components:
  - `Slider` for numeric inputs
  - `Switch` for booleans
  - `Select` for dropdowns
  - `ColorPicker` for colors (or use `input[type="color"]`)
  - `Button` for pattern triggers
  - `Card` for grouping controls
  - `Sheet` or `Drawer` for mobile-friendly panels

**7. TypeScript Types**:
- Extract all interfaces to `types/` directory
- Use strict typing (no `any`)
- Define WebSocket message types with discriminated unions

**8. Performance**:
- Use `React.memo` for control components
- Debounce rapid control changes
- Consider `useMemo` for expensive calculations
- WebGL operations should be outside React render cycle

**9. Responsive Design**:
- Use Tailwind CSS (shadcn requirement)
- Mobile: Hide controls by default, use drawer/sheet
- Touch events: Use `onTouchStart`, `onTouchMove`, `onTouchEnd`
- Canvas: Should fill viewport, handle resize

**10. Server-Side Rendering**:
- WebGL components must be client-only: `'use client'`
- Use dynamic import with `ssr: false` if needed
- WebSocket connections only on client

**11. Build Considerations**:
- Shader strings: Keep as template literals or import from `.glsl` files
- Use `glslify` or similar for shader preprocessing if needed
- Ensure WebGL code is not tree-shaken incorrectly

**12. Testing**:
- Mock WebGL context for unit tests
- Test simulation logic independently
- Use React Testing Library for component tests
- Integration tests for WebSocket communication

### Migration Checklist

- [ ] Extract WebGL initialization to custom hook
- [ ] Convert config object to Zustand store
- [ ] Replace dat.GUI with shadcn components
- [ ] Create WebSocket hook with reconnection
- [ ] Implement audio worklet loading for Next.js
- [ ] Add TypeScript types for all WebSocket messages
- [ ] Create responsive layout with Tailwind
- [ ] Handle WebGL context loss
- [ ] Add error boundaries for WebGL failures
- [ ] Implement proper cleanup on unmount
- [ ] Add loading states for WebGL initialization
- [ ] Create mobile-friendly control panels
- [ ] Add accessibility attributes
- [ ] Implement keyboard shortcuts (P for pause, Space for splats)

---

## Additional Technical Details

### Coordinate Systems

**Screen Coordinates**:
- Origin: Top-left
- X: 0 to canvas.width (left to right)
- Y: 0 to canvas.height (top to bottom)

**Normalized Texture Coordinates**:
- Origin: Bottom-left (WebGL standard)
- X: 0.0 to 1.0 (left to right)
- Y: 0.0 to 1.0 (bottom to top)
- Conversion: `texcoordX = screenX / width`, `texcoordY = 1.0 - (screenY / height)`

**WebGL Clip Coordinates**:
- Fullscreen quad vertices: `[-1, -1]`, `[-1, 1]`, `[1, 1]`, `[1, -1]`
- Converted to UV: `vUv = aPosition * 0.5 + 0.5`

### Texture Formats

**RGBA Format** (for dye):
- WebGL2: `RGBA16F` internal, `RGBA` format
- WebGL1: `RGBA` internal, `RGBA` format (with half-float type)
- Stores: Red, Green, Blue, Alpha channels

**RG Format** (for velocity):
- WebGL2: `RG16F` internal, `RG` format
- WebGL1: Falls back to `RGBA`
- Stores: X velocity, Y velocity

**R Format** (for curl, divergence, pressure):
- WebGL2: `R16F` internal, `RED` format
- WebGL1: Falls back to `RGBA`
- Stores: Single scalar value

### Buffer Swapping

Double buffering is used for iterative algorithms:
- `read` buffer: Source data (read-only during pass)
- `write` buffer: Destination (written to)
- After pass: `swap()` exchanges pointers
- Next iteration reads from previous write

This prevents reading and writing to the same texture simultaneously.

### Aspect Ratio Handling

Splats are corrected for aspect ratio:
```typescript
function correctRadius(radius: number, canvas: HTMLCanvasElement): number {
  let aspectRatio = canvas.width / canvas.height
  if (aspectRatio > 1) radius *= aspectRatio
  return radius
}
```

In splat shader:
```glsl
p.x *= aspectRatio;  // Stretch X to make circles appear circular
```

### Delta Time

Delta time is calculated and capped:
```typescript
function calcDeltaTime(): number {
  let now = Date.now()
  let dt = (now - lastUpdateTime) / 1000  // Convert to seconds
  dt = Math.min(dt, 0.016666)  // Cap at 60 FPS (16.67ms)
  lastUpdateTime = now
  return dt
}
```

Capping prevents large jumps when tab regains focus.

### Color Intensity

Generated colors are multiplied by 0.15 to reduce intensity:
```typescript
c.r *= 0.15
c.g *= 0.15
c.b *= 0.15
```

Remote pointer colors are multiplied by 10x for vibrancy:
```typescript
color.r *= 10.0
color.g *= 10.0
color.b *= 10.0
```

This makes remote interactions more visible.

### Debug Information

When `SHOW_DEBUG` is enabled:
- Shows WebGL status (WebGL1/WebGL2)
- Shows animation status
- Shows canvas dimensions
- Shows frame counter
- Updates via `window.debugInfo` object

---

## Conclusion

This document provides a comprehensive technical overview of the Fluid Music simulation system. The architecture is modular and can be adapted to React/Next.js with careful attention to:

1. WebGL context lifecycle management
2. State management for configuration
3. WebSocket connection handling
4. Component structure and separation of concerns
5. Performance optimization (avoiding unnecessary re-renders)
6. Responsive design and mobile support

The core simulation algorithm is GPU-accelerated and runs independently of React's render cycle, making it well-suited for integration into a React application with proper hooks and refs management.

