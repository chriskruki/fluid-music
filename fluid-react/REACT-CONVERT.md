# Fluid Music - React/Next.js Conversion Plan

## Table of Contents
1. [Overview](#overview)
2. [Architecture Decisions](#architecture-decisions)
3. [Core Fluid Simulation Class Design](#core-fluid-simulation-class-design)
4. [Next.js App Structure](#nextjs-app-structure)
5. [Component Breakdown](#component-breakdown)
6. [State Management Strategy](#state-management-strategy)
7. [WebGL Integration Pattern](#webgl-integration-pattern)
8. [Migration Strategy](#migration-strategy)
9. [Implementation Phases](#implementation-phases)
10. [File Structure](#file-structure)
11. [Dependencies](#dependencies)
12. [TypeScript Types](#typescript-types)
13. [Testing Strategy](#testing-strategy)

---

## Overview

### Goals
- Convert existing TypeScript fluid simulation into a reusable, standalone class
- Build Next.js application with modern React patterns
- Create beautiful landing page with Framer Motion animations
- Maintain all existing functionality
- Use shadcn UI for consistent, accessible components
- Preserve WebGL performance and rendering quality

### Domain Structure
- **Landing Page**: `fluid.christoflux.com/` - Animated title, nav buttons
- **Simulator**: `fluid.christoflux.com/sim` - Main fluid simulation
- **Controller**: `fluid.christoflux.com/control` - Remote control interface
- **Beat Detector**: `fluid.christoflux.com/beat` - Audio beat detection

---

## Architecture Decisions

### 1. Fluid Simulation as Standalone Class

**Decision**: Create a `FluidSimulation` class that encapsulates all WebGL logic, simulation state, and rendering.

**Rationale**:
- Encapsulates WebGL resources (prevents leaks)
- Reusable across components
- Clear lifecycle management
- Testable independently
- Follows Single Responsibility Principle

**Pattern**: Factory pattern for initialization, class for instance management.

### 2. React Integration Pattern

**Decision**: Use custom hooks (`useFluidSimulation`, `useWebGL`) to bridge React and WebGL.

**Rationale**:
- WebGL context lifecycle tied to React component lifecycle
- Hooks provide clean API for components
- Automatic cleanup on unmount
- Can be shared across components

### 3. State Management

**Decision**: Zustand for global config state, React state for UI, refs for WebGL resources.

**Rationale**:
- Zustand: Lightweight, performant, simple API for config
- React state: For UI that needs re-renders
- Refs: For WebGL resources that shouldn't trigger re-renders

### 4. WebSocket Management

**Decision**: Custom hook `useWebSocket` with Zustand store for connection state.

**Rationale**:
- Centralized connection management
- Automatic reconnection
- Type-safe message handling
- Can be used across multiple components

### 5. Component Architecture

**Decision**: 
- Container components handle WebGL/WebSocket logic
- Presentational components handle UI
- Custom hooks bridge the gap

**Rationale**:
- Separation of concerns
- Easier testing
- Reusable UI components
- Clear data flow

---

## Core Fluid Simulation Class Design

### Class Structure

```typescript
/**
 * FluidSimulation - Standalone WebGL fluid dynamics simulation
 * 
 * Encapsulates all WebGL resources, simulation state, and rendering logic.
 * Can be instantiated, configured, and destroyed independently.
 */
class FluidSimulation {
  // WebGL Context
  private gl: WebGLRenderingContext
  private ext: WebGLExtensions
  private canvas: HTMLCanvasElement
  
  // Configuration
  private config: FluidConfig
  
  // Shaders
  private baseVertexShader: WebGLShader
  private blurVertexShader: WebGLShader
  private splatShader: WebGLShader
  // ... all other shaders
  
  // Programs
  private splatProgram: Program
  private advectionProgram: Program
  // ... all other programs
  
  // Materials
  private displayMaterial: Material
  
  // Framebuffers
  private dye: DoubleFBO
  private velocity: DoubleFBO
  private pressure: DoubleFBO
  private curl: FBO
  private divergence: FBO
  private bloom: FBO
  private sunrays: FBO
  private sunraysTemp: FBO
  private bloomFramebuffers: FBO[]
  
  // Textures
  private ditheringTexture: TextureObject
  
  // Blit function
  private blit: BlitFunction
  
  // State
  private animationId: number | null
  private lastUpdateTime: number
  private colorUpdateTimer: number
  private isInitialized: boolean
  private isPaused: boolean
  
  // Pointers (local input)
  private pointers: PointerPrototype[]
  private splatStack: number[]
  
  // Callbacks
  private onFrameCallback?: () => void
  private onErrorCallback?: (error: Error) => void
  
  /**
   * Factory method - Creates and initializes a FluidSimulation instance
   */
  static async create(
    canvas: HTMLCanvasElement,
    config?: Partial<FluidConfig>
  ): Promise<FluidSimulation>
  
  /**
   * Private constructor - Use FluidSimulation.create() instead
   */
  private constructor(canvas: HTMLCanvasElement, config: FluidConfig)
  
  /**
   * Initialize WebGL context and resources
   */
  private async initialize(): Promise<void>
  
  /**
   * Start the simulation loop
   */
  start(): void
  
  /**
   * Stop the simulation loop
   */
  stop(): void
  
  /**
   * Pause/unpause simulation
   */
  setPaused(paused: boolean): void
  
  /**
   * Update configuration
   */
  updateConfig(updates: Partial<FluidConfig>): void
  
  /**
   * Get current configuration
   */
  getConfig(): Readonly<FluidConfig>
  
  /**
   * Handle pointer input (mouse/touch)
   */
  handlePointerDown(id: number, x: number, y: number): void
  handlePointerMove(id: number, x: number, y: number): void
  handlePointerUp(id: number): void
  
  /**
   * Create splat at position
   */
  createSplat(
    x: number,
    y: number,
    dx: number,
    dy: number,
    color: Color
  ): void
  
  /**
   * Create multiple random splats
   */
  createRandomSplats(count: number): void
  
  /**
   * Create pattern splats
   */
  createPattern(pattern: PatternType): void
  
  /**
   * Resize simulation (recreates framebuffers)
   */
  resize(): void
  
  /**
   * Cleanup and destroy all resources
   */
  destroy(): void
  
  /**
   * Main update loop (private)
   */
  private update(): void
  
  /**
   * Simulation step (private)
   */
  private step(dt: number): void
  
  /**
   * Render frame (private)
   */
  private render(): void
}
```

### Factory Pattern Implementation

```typescript
/**
 * Factory function for creating FluidSimulation instances
 * Handles async initialization (texture loading, etc.)
 */
static async create(
  canvas: HTMLCanvasElement,
  config?: Partial<FluidConfig>
): Promise<FluidSimulation> {
  // Merge default config with provided config
  const mergedConfig = { ...defaultConfig, ...config }
  
  // Create instance
  const simulation = new FluidSimulation(canvas, mergedConfig)
  
  // Initialize (async - loads textures, etc.)
  await simulation.initialize()
  
  return simulation
}
```

### Key Design Principles

1. **Encapsulation**: All WebGL resources private, accessed via public methods
2. **Lifecycle Management**: Clear initialization, running, and cleanup phases
3. **Configuration**: Immutable config updates trigger necessary reinitializations
4. **Error Handling**: Callbacks for errors, graceful degradation
5. **Performance**: Minimal allocations in hot paths, efficient buffer swapping

### Resource Management

**Initialization Order**:
1. WebGL context and extensions
2. Shader compilation
3. Program creation
4. Framebuffer creation
5. Texture loading (async)
6. Blit setup
7. Initial splats

**Cleanup Order**:
1. Stop animation loop
2. Delete all framebuffers
3. Delete all textures
4. Delete all programs
5. Delete all shaders
6. Release WebGL context

**Resize Handling**:
- Detects canvas size changes
- Recreates framebuffers at new resolution
- Preserves simulation state (copies old buffers)

---

## Next.js App Structure

### File Structure

```
fluid-react/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page (/)
│   ├── sim/
│   │   └── page.tsx            # Simulator page (/sim)
│   ├── control/
│   │   └── page.tsx             Controller page (/control)
│   └── beat/
│       └── page.tsx            # Beat detector page (/beat)
│
├── components/
│   ├── ui/                      # shadcn UI components
│   │   ├── button.tsx
│   │   ├── slider.tsx
│   │   ├── switch.tsx
│   │   ├── select.tsx
│   │   ├── color-picker.tsx
│   │   ├── card.tsx
│   │   ├── sheet.tsx
│   │   └── ...
│   │
│   ├── layout/
│   │   ├── Nav.tsx             # Navigation component
│   │   ├── Header.tsx          # Site header
│   │   └── Footer.tsx          # Site footer
│   │
│   ├── landing/
│   │   ├── Hero.tsx            # Hero section with title
│   │   ├── NavButtons.tsx      # Navigation buttons
│   │   └── AnimatedTitle.tsx   # Framer Motion title
│   │
│   ├── fluid-simulator/
│   │   ├── FluidSimulator.tsx  # Main simulator component
│   │   ├── SimulationCanvas.tsx # Canvas wrapper
│   │   ├── ControlsPanel.tsx   # Control panel (shadcn UI)
│   │   ├── SimulationControls.tsx # Simulation parameters
│   │   ├── ColorControls.tsx   # Color mode controls
│   │   ├── MirrorControls.tsx  # Mirror mode controls
│   │   ├── EffectControls.tsx  # Bloom/sunrays controls
│   │   └── PatternButtons.tsx   # Pattern trigger buttons
│   │
│   ├── remote-controller/
│   │   ├── RemoteController.tsx # Main controller component
│   │   ├── ControlCanvas.tsx   # Touch/mouse canvas
│   │   ├── ControlPanel.tsx    # Button panel
│   │   └── ConnectionStatus.tsx # WebSocket status
│   │
│   └── beat-detector/
│       ├── BeatDetector.tsx    # Main beat detector component
│       ├── FrequencyVisualizer.tsx # Canvas visualization
│       ├── BeatControls.tsx    # Frequency/sensitivity controls
│       └── BeatIndicator.tsx   # Visual beat indicator
│
├── hooks/
│   ├── useFluidSimulation.ts   # Fluid simulation hook
│   ├── useWebGL.ts             # WebGL context hook
│   ├── useWebSocket.ts         # WebSocket connection hook
│   ├── useAudioInput.ts        # Microphone access hook
│   ├── useCanvas.ts            # Canvas ref and resize hook
│   └── useAnimationFrame.ts    # Animation frame hook
│
├── lib/
│   ├── fluid/
│   │   ├── FluidSimulation.ts  # Main simulation class
│   │   ├── config.ts           # Configuration types and defaults
│   │   ├── shaders.ts          # Shader source strings
│   │   ├── programs.ts         # Program creation utilities
│   │   ├── framebuffers.ts     # FBO management
│   │   ├── simulation.ts       # Simulation step logic
│   │   ├── rendering.ts        # Rendering pipeline
│   │   ├── input.ts            # Input handling
│   │   └── colors.ts           # Color generation
│   │
│   ├── webgl/
│   │   ├── context.ts           # WebGL context initialization
│   │   ├── extensions.ts       # Extension detection
│   │   ├── shader-utils.ts     # Shader compilation
│   │   ├── program-utils.ts    # Program creation
│   │   └── texture-utils.ts    # Texture utilities
│   │
│   ├── websocket/
│   │   ├── client.ts           # WebSocket client wrapper
│   │   ├── messages.ts         # Message type definitions
│   │   └── handlers.ts         # Message handlers
│   │
│   └── audio/
│       ├── audio-context.ts   # Audio context management
│       ├── analyser.ts         # Frequency analysis
│       └── worklet-processor.ts # AudioWorklet processor
│
├── stores/
│   ├── fluidConfig.ts          # Zustand store for config
│   ├── websocket.ts            # WebSocket connection store
│   └── beatDetector.ts         # Beat detector state store
│
├── types/
│   ├── fluid.ts                # Fluid simulation types
│   ├── websocket.ts            # WebSocket message types
│   ├── webgl.ts                # WebGL types
│   └── audio.ts                # Audio types
│
├── public/
│   ├── LDR_LLL1_0.png         # Dithering texture
│   └── beat-detector-processor.js # AudioWorklet processor
│
├── styles/
│   └── globals.css             # Global styles + Tailwind
│
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Component Breakdown

### Landing Page (`app/page.tsx`)

**Structure**:
```tsx
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <AnimatedTitle />
      <NavButtons />
    </div>
  )
}
```

**Components**:

**AnimatedTitle** (`components/landing/AnimatedTitle.tsx`):
- Framer Motion fade-in animation
- Slide-in from top
- Staggered letter animation (optional)
- Title: "Fluid Music" or similar

**NavButtons** (`components/landing/NavButtons.tsx`):
- Three large navigation buttons
- Framer Motion: Fade in with delay, hover animations
- Icons + text
- Links to `/sim`, `/control`, `/beat`
- Responsive grid layout

### Simulator Page (`app/sim/page.tsx`)

**Structure**:
```tsx
'use client'

export default function SimulatorPage() {
  return (
    <div className="h-screen w-screen relative">
      <FluidSimulator />
      <ControlsPanel />
    </div>
  )
}
```

**FluidSimulator** (`components/fluid-simulator/FluidSimulator.tsx`):
- Container component
- Uses `useFluidSimulation` hook
- Renders `SimulationCanvas`
- Handles WebGL lifecycle
- Manages pointer events
- Connects to WebSocket for remote input

**SimulationCanvas** (`components/fluid-simulator/SimulationCanvas.tsx`):
- Canvas element with ref
- Fullscreen, fills container
- Handles resize
- No direct WebGL access (handled by hook)

**ControlsPanel** (`components/fluid-simulator/ControlsPanel.tsx`):
- shadcn Sheet/Drawer component (mobile-friendly)
- Toggle button to open/close
- Contains all control sub-components
- Uses Zustand store for config

**Sub-components**:
- `SimulationControls`: Quality, resolution, physics params
- `ColorControls`: Rainbow mode toggle, color picker
- `MirrorControls`: Mirror mode toggle, segment slider
- `EffectControls`: Bloom, sunrays toggles and params
- `PatternButtons`: Grid of pattern trigger buttons

### Controller Page (`app/control/page.tsx`)

**Structure**:
```tsx
'use client'

export default function ControllerPage() {
  return (
    <div className="h-screen w-screen relative">
      <RemoteController />
    </div>
  )
}
```

**RemoteController** (`components/remote-controller/RemoteController.tsx`):
- Uses `useWebSocket` hook
- Renders `ControlCanvas` (fullscreen)
- Renders `ControlPanel` (overlay drawer)
- Handles touch/mouse events
- Sends normalized coordinates via WebSocket

**ControlCanvas** (`components/remote-controller/ControlCanvas.tsx`):
- Fullscreen canvas (for visual feedback, optional)
- Or just a div with touch handlers
- Sends normalized coordinates

**ControlPanel** (`components/remote-controller/ControlPanel.tsx`):
- Sheet/Drawer component
- Pattern buttons
- Color controls (rainbow mode, color picker)
- Connection status indicator

### Beat Detector Page (`app/beat/page.tsx`)

**Structure**:
```tsx
'use client'

export default function BeatDetectorPage() {
  return (
    <div className="min-h-screen p-4">
      <BeatDetector />
    </div>
  )
}
```

**BeatDetector** (`components/beat-detector/BeatDetector.tsx`):
- Uses `useAudioInput` hook
- Uses `useWebSocket` hook
- Renders `FrequencyVisualizer`
- Renders `BeatControls`
- Renders `BeatIndicator`
- Handles audio processing and beat detection

**FrequencyVisualizer** (`components/beat-detector/FrequencyVisualizer.tsx`):
- Canvas element
- Draws frequency spectrum
- Logarithmic X-axis
- Highlights selected frequency range
- Shows threshold line
- Shows current energy

**BeatControls** (`components/beat-detector/BeatControls.tsx`):
- Start/Stop microphone button
- Min frequency slider
- Max frequency slider
- Sensitivity slider
- Frequency range visualization

---

## State Management Strategy

### Zustand Stores

**1. FluidConfig Store** (`stores/fluidConfig.ts`):
```typescript
interface FluidConfigState {
  config: FluidConfig
  updateConfig: (updates: Partial<FluidConfig>) => void
  resetConfig: () => void
}

export const useFluidConfig = create<FluidConfigState>((set) => ({
  config: defaultConfig,
  updateConfig: (updates) => set((state) => ({
    config: { ...state.config, ...updates }
  })),
  resetConfig: () => set({ config: defaultConfig })
}))
```

**2. WebSocket Store** (`stores/websocket.ts`):
```typescript
interface WebSocketState {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  clientId: string | null
  clientCounts: {
    controllers: number
    simulators: number
    beatDetectors: number
  }
  connect: () => void
  disconnect: () => void
  sendMessage: (message: Message) => void
}

export const useWebSocket = create<WebSocketState>((set, get) => ({
  // ... implementation
}))
```

**3. Beat Detector Store** (`stores/beatDetector.ts`):
```typescript
interface BeatDetectorState {
  isRecording: boolean
  minFrequency: number
  maxFrequency: number
  sensitivity: number
  currentEnergy: number
  currentThreshold: number
  lastBeatTime: number
  // ... update methods
}
```

### React State (Component-Level)

**When to use React state**:
- UI-only state (drawer open/closed, modal visibility)
- Form inputs (before submission)
- Animation states
- Loading states

**When to use refs**:
- WebGL resources (shaders, programs, framebuffers)
- Canvas element reference
- Animation frame ID
- Any value that shouldn't trigger re-renders

**When to use Zustand**:
- Global configuration
- WebSocket connection state
- Shared state across components
- State that persists across navigation

---

## WebGL Integration Pattern

### Custom Hook: `useFluidSimulation`

```typescript
export function useFluidSimulation(
  canvasRef: RefObject<HTMLCanvasElement>,
  config: FluidConfig
) {
  const simulationRef = useRef<FluidSimulation | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Initialize simulation
  useEffect(() => {
    if (!canvasRef.current) return
    
    let mounted = true
    
    FluidSimulation.create(canvasRef.current, config)
      .then((sim) => {
        if (!mounted) {
          sim.destroy()
          return
        }
        
        simulationRef.current = sim
        sim.start()
        setIsInitialized(true)
      })
      .catch((err) => {
        if (mounted) setError(err)
      })
    
    return () => {
      mounted = false
      simulationRef.current?.destroy()
      simulationRef.current = null
      setIsInitialized(false)
    }
  }, [canvasRef])
  
  // Update config when it changes
  useEffect(() => {
    if (simulationRef.current && isInitialized) {
      simulationRef.current.updateConfig(config)
    }
  }, [config, isInitialized])
  
  // Handle pointer events
  const handlePointerDown = useCallback((id: number, x: number, y: number) => {
    simulationRef.current?.handlePointerDown(id, x, y)
  }, [])
  
  const handlePointerMove = useCallback((id: number, x: number, y: number) => {
    simulationRef.current?.handlePointerMove(id, x, number)
  }, [])
  
  const handlePointerUp = useCallback((id: number) => {
    simulationRef.current?.handlePointerUp(id)
  }, [])
  
  // Pattern methods
  const createPattern = useCallback((pattern: PatternType) => {
    simulationRef.current?.createPattern(pattern)
  }, [])
  
  const createRandomSplats = useCallback((count: number) => {
    simulationRef.current?.createRandomSplats(count)
  }, [])
  
  return {
    isInitialized,
    error,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    createPattern,
    createRandomSplats,
    simulation: simulationRef.current
  }
}
```

### Canvas Component Pattern

```typescript
export function SimulationCanvas({
  onPointerDown,
  onPointerMove,
  onPointerUp
}: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Handle resize
  useCanvasResize(canvasRef, containerRef)
  
  // Handle pointer events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = (e.clientX - rect.left) / rect.width
    const y = 1.0 - (e.clientY - rect.top) / rect.height
    onPointerDown(-1, x, y)
  }, [onPointerDown])
  
  // Similar for mousemove, mouseup, touch events...
  
  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  )
}
```

### WebGL Context Hook

```typescript
export function useWebGL(canvasRef: RefObject<HTMLCanvasElement>) {
  const [context, setContext] = useState<{
    gl: WebGLRenderingContext
    ext: WebGLExtensions
  } | null>(null)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    if (!canvasRef.current) return
    
    try {
      const { gl, ext } = getWebGLContext(canvasRef.current)
      setContext({ gl, ext })
    } catch (err) {
      setError(err as Error)
    }
  }, [canvasRef])
  
  return { context, error }
}
```

---

## Migration Strategy

### Phase 1: Core Class Extraction

**Goal**: Extract fluid simulation into standalone class

**Steps**:
1. Create `lib/fluid/FluidSimulation.ts`
2. Move all WebGL initialization from `main.ts`
3. Move simulation step logic from `simulation.ts`
4. Move rendering logic from `rendering.ts`
5. Create factory method `FluidSimulation.create()`
6. Add lifecycle methods (start, stop, destroy)
7. Add configuration update methods
8. Add input handling methods
9. Test class independently (unit tests)

**Files to Create**:
- `lib/fluid/FluidSimulation.ts` (main class)
- `lib/fluid/config.ts` (config types, defaults)
- `lib/webgl/context.ts` (WebGL initialization)
- `lib/webgl/extensions.ts` (extension detection)

**Files to Modify**:
- Extract logic from existing files, keep as utilities

### Phase 2: React Hooks

**Goal**: Create React hooks for fluid simulation

**Steps**:
1. Create `hooks/useFluidSimulation.ts`
2. Create `hooks/useWebGL.ts`
3. Create `hooks/useCanvas.ts` (resize handling)
4. Create `hooks/useAnimationFrame.ts`
5. Test hooks in isolation

### Phase 3: Zustand Stores

**Goal**: Set up state management

**Steps**:
1. Install Zustand
2. Create `stores/fluidConfig.ts`
3. Create `stores/websocket.ts`
4. Create `stores/beatDetector.ts`
5. Migrate config usage to store

### Phase 4: Next.js Setup

**Goal**: Set up Next.js project structure

**Steps**:
1. Initialize Next.js project
2. Install dependencies (shadcn UI, Framer Motion, etc.)
3. Set up Tailwind CSS
4. Configure shadcn UI
5. Create app directory structure
6. Set up routing

### Phase 5: Landing Page

**Goal**: Create animated landing page

**Steps**:
1. Create `app/page.tsx`
2. Create `components/landing/AnimatedTitle.tsx` with Framer Motion
3. Create `components/landing/NavButtons.tsx` with animations
4. Style with Tailwind
5. Add responsive design

### Phase 6: Simulator Page

**Goal**: Migrate simulator to React

**Steps**:
1. Create `app/sim/page.tsx`
2. Create `components/fluid-simulator/FluidSimulator.tsx`
3. Integrate `useFluidSimulation` hook
4. Create `SimulationCanvas` component
5. Create control panel components (shadcn UI)
6. Connect to WebSocket for remote input
7. Test all functionality

### Phase 7: Controller Page

**Goal**: Migrate controller to React

**Steps**:
1. Create `app/control/page.tsx`
2. Create `components/remote-controller/RemoteController.tsx`
3. Create `ControlCanvas` component
4. Create `ControlPanel` with shadcn UI
5. Integrate WebSocket client
6. Test touch/mouse input
7. Test command sending

### Phase 8: Beat Detector Page

**Goal**: Migrate beat detector to React

**Steps**:
1. Create `app/beat/page.tsx`
2. Create `components/beat-detector/BeatDetector.tsx`
3. Create `FrequencyVisualizer` canvas component
4. Create `BeatControls` with shadcn UI
5. Integrate audio input hook
6. Integrate WebSocket client
7. Test beat detection and sending

### Phase 9: Polish & Optimization

**Goal**: Final touches and performance optimization

**Steps**:
1. Add loading states
2. Add error boundaries
3. Optimize re-renders (React.memo, useMemo)
4. Add accessibility attributes
5. Add keyboard shortcuts
6. Mobile optimization
7. Performance profiling
8. Bundle size optimization

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Deliverables**:
- ✅ FluidSimulation class extracted and tested
- ✅ WebGL utilities organized
- ✅ TypeScript types defined
- ✅ Unit tests for core class

**Tasks**:
1. Extract simulation logic into class
2. Create factory pattern
3. Add lifecycle methods
4. Write unit tests
5. Document class API

### Phase 2: React Integration (Week 2)

**Deliverables**:
- ✅ Custom hooks created
- ✅ Zustand stores set up
- ✅ Basic React components

**Tasks**:
1. Create useFluidSimulation hook
2. Create useWebSocket hook
3. Create Zustand stores
4. Create basic canvas component
5. Test React integration

### Phase 3: Next.js Setup (Week 2-3)

**Deliverables**:
- ✅ Next.js project initialized
- ✅ Landing page with animations
- ✅ Routing set up

**Tasks**:
1. Initialize Next.js
2. Install dependencies
3. Set up Tailwind + shadcn UI
4. Create landing page
5. Add Framer Motion animations
6. Set up routing

### Phase 4: Simulator Migration (Week 3-4)

**Deliverables**:
- ✅ Simulator page functional
- ✅ Control panel with shadcn UI
- ✅ WebSocket integration

**Tasks**:
1. Create simulator page
2. Migrate WebGL rendering
3. Create control components
4. Integrate WebSocket
5. Test all features

### Phase 5: Controller & Beat Detector (Week 4-5)

**Deliverables**:
- ✅ Controller page functional
- ✅ Beat detector page functional
- ✅ All pages connected

**Tasks**:
1. Migrate controller
2. Migrate beat detector
3. Test end-to-end flow
4. Fix any issues

### Phase 6: Polish (Week 5-6)

**Deliverables**:
- ✅ Production-ready application
- ✅ Optimized performance
- ✅ Mobile responsive
- ✅ Accessibility features

**Tasks**:
1. Add loading states
2. Add error handling
3. Optimize performance
4. Mobile optimization
5. Accessibility audit
6. Final testing

---

## File Structure Details

### Core Fluid Simulation Files

**`lib/fluid/FluidSimulation.ts`**:
- Main class definition
- Factory method
- Lifecycle management
- Public API methods

**`lib/fluid/config.ts`**:
```typescript
export interface FluidConfig {
  // ... all config properties
}

export const defaultConfig: FluidConfig = {
  // ... default values
}

export type PatternType = 
  | 'right' 
  | 'left' 
  | 'up' 
  | 'down' 
  | 'horizontal' 
  | 'vertical' 
  | 'corners'
```

**`lib/fluid/shaders.ts`**:
- All shader source strings as exported constants
- Organized by shader type
- Comments explaining each shader

**`lib/fluid/programs.ts`**:
- Program creation utilities
- Material class
- Program class

**`lib/fluid/framebuffers.ts`**:
- FBO creation functions
- DoubleFBO implementation
- Resize utilities
- Blit function setup

**`lib/fluid/simulation.ts`**:
- Simulation step function
- Splat functions
- Pattern creation functions
- Color generation

**`lib/fluid/rendering.ts`**:
- Render pipeline
- Bloom processing
- Sunrays processing
- Display rendering

**`lib/fluid/input.ts`**:
- Pointer handling
- Coordinate conversion
- Delta calculation

**`lib/fluid/colors.ts`**:
- Color generation
- HSV to RGB conversion
- Color evolution logic

### WebGL Utilities

**`lib/webgl/context.ts`**:
```typescript
export function getWebGLContext(
  canvas: HTMLCanvasElement
): { gl: WebGLRenderingContext; ext: WebGLExtensions }
```

**`lib/webgl/extensions.ts`**:
- Extension detection
- Format testing
- Fallback handling

**`lib/webgl/shader-utils.ts`**:
- `compileShader()`
- `addKeywords()`
- Shader compilation utilities

**`lib/webgl/program-utils.ts`**:
- `createProgram()`
- `getUniforms()`
- Program utilities

### WebSocket Files

**`lib/websocket/client.ts`**:
```typescript
export class WebSocketClient {
  private socket: WebSocket | null
  private url: string
  private reconnectDelay: number
  
  connect(): void
  disconnect(): void
  send(message: Message): void
  onMessage(callback: (message: Message) => void): void
  onError(callback: (error: Error) => void): void
  onConnect(callback: () => void): void
  onDisconnect(callback: () => void): void
}
```

**`lib/websocket/messages.ts`**:
- All message type definitions
- Type guards
- Message creators (factory functions)

### Hooks

**`hooks/useFluidSimulation.ts`**:
- Main hook for fluid simulation
- Returns simulation instance and control methods

**`hooks/useWebSocket.ts`**:
```typescript
export function useWebSocket(url: string) {
  // Returns: connection state, send function, message handlers
}
```

**`hooks/useAudioInput.ts`**:
```typescript
export function useAudioInput() {
  // Returns: analyser, frequency data, start/stop functions
}
```

**`hooks/useCanvas.ts`**:
```typescript
export function useCanvasResize(
  canvasRef: RefObject<HTMLCanvasElement>,
  containerRef: RefObject<HTMLElement>
) {
  // Handles canvas resize based on container
}
```

---

## Dependencies

### Core Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "framer-motion": "^10.16.0",
    "ws": "^8.14.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/ws": "^8.5.0",
    "@types/uuid": "^9.0.0",
    "typescript": "^5.2.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.50.0",
    "eslint-config-next": "^14.0.0"
  }
}
```

### shadcn UI Components Needed

Install via `npx shadcn-ui@latest add [component]`:

- `button`
- `slider`
- `switch`
- `select`
- `card`
- `sheet` (for mobile drawer)
- `drawer` (alternative to sheet)
- `input` (for numeric inputs)
- `label`
- `separator`
- `tabs` (for organizing controls)

### Additional Packages

- `clsx` or `class-variance-authority` (for className utilities)
- `tailwind-merge` (for merging Tailwind classes)
- `lucide-react` (for icons, if not using shadcn's icon system)

---

## TypeScript Types

### Core Types (`types/fluid.ts`)

```typescript
export interface Color {
  r: number
  g: number
  b: number
}

export interface BackColor {
  r: number
  g: number
  b: number
}

export interface FluidConfig {
  // ... all config properties
}

export interface PointerPrototype {
  id: number
  texcoordX: number
  texcoordY: number
  prevTexcoordX: number
  prevTexcoordY: number
  deltaX: number
  deltaY: number
  down: boolean
  moved: boolean
  color: Color
}

export type PatternType = 
  | 'right'
  | 'left'
  | 'up'
  | 'down'
  | 'horizontal'
  | 'vertical'
  | 'corners'
```

### WebGL Types (`types/webgl.ts`)

```typescript
export interface WebGLExtensions {
  formatRGBA: WebGLFormatObject
  formatRG: WebGLFormatObject
  formatR: WebGLFormatObject
  halfFloatTexType: number
  supportLinearFiltering: boolean
}

export interface WebGLFormatObject {
  internalFormat: number
  format: number
}

export interface FBO {
  texture: WebGLTexture
  fbo: WebGLFramebuffer
  width: number
  height: number
  texelSizeX: number
  texelSizeY: number
  attach: (id: number) => number
}

export interface DoubleFBO {
  width: number
  height: number
  texelSizeX: number
  texelSizeY: number
  read: FBO
  write: FBO
  swap: () => void
}

export type BlitFunction = (target: FBO | null, clear?: boolean) => void
```

### WebSocket Types (`types/websocket.ts`)

```typescript
export type ClientRole = 'simulator' | 'controller' | 'beat_detector'

export interface BaseMessage {
  type: string
  payload: any
  timestamp?: number
}

export interface ConnectMessage extends BaseMessage {
  type: 'connect'
  payload: {
    role: ClientRole
  }
}

export interface ConnectAckMessage extends BaseMessage {
  type: 'connect_ack'
  payload: {
    status: 'success' | 'error'
    sessionId: string
    connectedClients: {
      controllers: number
      simulators: number
      beatDetectors: number
    }
  }
}

// ... all other message types
```

---

## Testing Strategy

### Unit Tests

**FluidSimulation Class**:
- Test initialization
- Test configuration updates
- Test pointer handling
- Test pattern creation
- Test cleanup

**WebGL Utilities**:
- Test context creation
- Test extension detection
- Test shader compilation
- Test program creation

**Color Generation**:
- Test HSV to RGB conversion
- Test color generation (rainbow vs single)
- Test color evolution

### Integration Tests

**React Hooks**:
- Test useFluidSimulation hook
- Test useWebSocket hook
- Test hook cleanup

**Components**:
- Test component rendering
- Test user interactions
- Test WebSocket integration

### E2E Tests

**User Flows**:
- Landing page → Simulator
- Controller → Simulator communication
- Beat detector → Simulator communication
- Configuration changes
- Pattern triggers

### Performance Tests

- Frame rate monitoring
- Memory leak detection
- WebGL context loss handling
- Large number of splats performance

---

## Key Implementation Details

### 1. FluidSimulation Class Constructor

```typescript
private constructor(canvas: HTMLCanvasElement, config: FluidConfig) {
  this.canvas = canvas
  this.config = { ...config } // Deep copy to prevent external mutations
  this.pointers = []
  this.splatStack = []
  this.animationId = null
  this.lastUpdateTime = Date.now()
  this.colorUpdateTimer = 0.0
  this.isInitialized = false
  this.isPaused = false
}
```

### 2. Factory Method Pattern

```typescript
static async create(
  canvas: HTMLCanvasElement,
  config?: Partial<FluidConfig>
): Promise<FluidSimulation> {
  const mergedConfig = mergeConfig(defaultConfig, config || {})
  const simulation = new FluidSimulation(canvas, mergedConfig)
  await simulation.initialize()
  return simulation
}
```

### 3. Configuration Updates

```typescript
updateConfig(updates: Partial<FluidConfig>): void {
  const oldConfig = { ...this.config }
  this.config = { ...this.config, ...updates }
  
  // Handle resolution changes (requires framebuffer recreation)
  if (updates.SIM_RESOLUTION || updates.DYE_RESOLUTION) {
    this.initFramebuffers()
  }
  
  // Handle keyword changes (requires shader recompilation)
  if (updates.SHADING !== oldConfig.SHADING ||
      updates.BLOOM !== oldConfig.BLOOM ||
      updates.SUNRAYS !== oldConfig.SUNRAYS) {
    this.updateKeywords()
  }
  
  // Other config changes don't require reinitialization
}
```

### 4. Pointer Handling

```typescript
handlePointerDown(id: number, x: number, y: number): void {
  let pointer = this.pointers.find(p => p.id === id)
  if (!pointer) {
    pointer = new PointerPrototype()
    pointer.id = id
    this.pointers.push(pointer)
  }
  
  pointer.down = true
  pointer.moved = false
  pointer.texcoordX = x
  pointer.texcoordY = y
  pointer.prevTexcoordX = x
  pointer.prevTexcoordY = y
  pointer.deltaX = 0
  pointer.deltaY = 0
  pointer.color = generateColor(this.config)
}

handlePointerMove(id: number, x: number, y: number): void {
  const pointer = this.pointers.find(p => p.id === id)
  if (!pointer || !pointer.down) return
  
  pointer.prevTexcoordX = pointer.texcoordX
  pointer.prevTexcoordY = pointer.texcoordY
  pointer.texcoordX = x
  pointer.texcoordY = y
  
  // Calculate deltas with aspect ratio correction
  const aspectRatio = this.canvas.width / this.canvas.height
  pointer.deltaX = (x - pointer.prevTexcoordX) * (aspectRatio < 1 ? aspectRatio : 1)
  pointer.deltaY = (y - pointer.prevTexcoordY) * (aspectRatio > 1 ? 1 / aspectRatio : 1)
  pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0
  
  // Create splat immediately
  if (pointer.moved) {
    this.createSplatFromPointer(pointer)
    pointer.moved = false
  }
}
```

### 5. Animation Loop

```typescript
private update = (): void => {
  if (!this.isInitialized || this.isPaused) {
    this.animationId = requestAnimationFrame(this.update)
    return
  }
  
  const dt = this.calcDeltaTime()
  
  // Resize check
  if (this.resizeCanvas()) {
    this.initFramebuffers()
  }
  
  // Update colors
  this.updateColors(dt)
  
  // Apply queued splats
  this.processSplatStack()
  
  // Simulation step
  this.step(dt)
  
  // Render
  this.render()
  
  // Call frame callback if provided
  this.onFrameCallback?.()
  
  // Continue loop
  this.animationId = requestAnimationFrame(this.update)
}

private calcDeltaTime(): number {
  const now = Date.now()
  let dt = (now - this.lastUpdateTime) / 1000
  dt = Math.min(dt, 0.016666) // Cap at 60 FPS
  this.lastUpdateTime = now
  return dt
}
```

### 6. Cleanup Pattern

```typescript
destroy(): void {
  // Stop animation loop
  if (this.animationId !== null) {
    cancelAnimationFrame(this.animationId)
    this.animationId = null
  }
  
  // Delete framebuffers
  this.deleteFramebuffer(this.dye.read)
  this.deleteFramebuffer(this.dye.write)
  this.deleteFramebuffer(this.velocity.read)
  this.deleteFramebuffer(this.velocity.write)
  // ... delete all framebuffers
  
  // Delete textures
  if (this.ditheringTexture?.texture) {
    this.gl.deleteTexture(this.ditheringTexture.texture)
  }
  
  // Delete programs
  Object.values(this.programs).forEach(program => {
    this.gl.deleteProgram(program.program)
  })
  
  // Delete shaders
  this.gl.deleteShader(this.baseVertexShader)
  // ... delete all shaders
  
  // Clear state
  this.pointers = []
  this.splatStack = []
  this.isInitialized = false
}

private deleteFramebuffer(fbo: FBO): void {
  this.gl.deleteFramebuffer(fbo.fbo)
  this.gl.deleteTexture(fbo.texture)
}
```

---

## Component Implementation Examples

### FluidSimulator Component

```typescript
'use client'

import { useRef, useEffect } from 'react'
import { useFluidSimulation } from '@/hooks/useFluidSimulation'
import { useFluidConfig } from '@/stores/fluidConfig'
import { useWebSocket } from '@/hooks/useWebSocket'
import { SimulationCanvas } from './SimulationCanvas'
import { ControlsPanel } from './ControlsPanel'

export function FluidSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const config = useFluidConfig((state) => state.config)
  const updateConfig = useFluidConfig((state) => state.updateConfig)
  
  const {
    isInitialized,
    error,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    createPattern,
    createRandomSplats
  } = useFluidSimulation(canvasRef, config)
  
  // WebSocket for remote input
  const { isConnected, sendMessage } = useWebSocket('/ws', {
    role: 'simulator',
    onRemoteInput: (payload) => {
      // Process remote input (handled by hook internally)
    },
    onCommand: (payload) => {
      // Process commands
      if (payload.command === 'random_splats') {
        createRandomSplats(payload.parameters?.count || 5)
      } else if (payload.command === 'preset_pattern') {
        createPattern(payload.parameters?.patternName)
      }
      // ... other commands
    },
    onBeat: (payload) => {
      // Process beat events
      const intensity = payload.intensity
      if (intensity > 2.5) {
        createRandomSplats(Math.floor(intensity * 2))
        createPattern('corners')
      }
      // ... other beat handling
    }
  })
  
  if (error) {
    return <ErrorDisplay error={error} />
  }
  
  if (!isInitialized) {
    return <LoadingSpinner />
  }
  
  return (
    <div className="relative w-full h-full">
      <SimulationCanvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <ControlsPanel
        config={config}
        onConfigChange={updateConfig}
        onCreatePattern={createPattern}
        onCreateRandomSplats={createRandomSplats}
      />
      {!isConnected && (
        <ConnectionIndicator status="disconnected" />
      )}
    </div>
  )
}
```

### ControlsPanel Component

```typescript
'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { SimulationControls } from './SimulationControls'
import { ColorControls } from './ColorControls'
import { MirrorControls } from './MirrorControls'
import { EffectControls } from './EffectControls'
import { PatternButtons } from './PatternButtons'

export function ControlsPanel({
  config,
  onConfigChange,
  onCreatePattern,
  onCreateRandomSplats
}: ControlsPanelProps) {
  const [open, setOpen] = useState(false)
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="fixed top-4 left-4 z-50"
          aria-label="Toggle controls"
        >
          <SettingsIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Simulation Controls</h2>
          
          <SimulationControls
            config={config}
            onConfigChange={onConfigChange}
          />
          
          <ColorControls
            config={config}
            onConfigChange={onConfigChange={onConfigChange}
          />
          
          <MirrorControls
            config={config}
            onConfigChange={onConfigChange}
          />
          
          <EffectControls
            config={config}
            onConfigChange={onConfigChange}
          />
          
          <PatternButtons
            onCreatePattern={onCreatePattern}
            onCreateRandomSplats={onCreateRandomSplats}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

### SimulationControls Component (shadcn UI)

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function SimulationControls({
  config,
  onConfigChange
}: SimulationControlsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Quality</Label>
          <Select
            value={config.DYE_RESOLUTION.toString()}
            onValueChange={(value) =>
              onConfigChange({ DYE_RESOLUTION: parseInt(value) })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1024">High</SelectItem>
              <SelectItem value="512">Medium</SelectItem>
              <SelectItem value="256">Low</SelectItem>
              <SelectItem value="128">Very Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Simulation Resolution: {config.SIM_RESOLUTION}</Label>
          <Select
            value={config.SIM_RESOLUTION.toString()}
            onValueChange={(value) =>
              onConfigChange({ SIM_RESOLUTION: parseInt(value) })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="32">32</SelectItem>
              <SelectItem value="64">64</SelectItem>
              <SelectItem value="128">128</SelectItem>
              <SelectItem value="256">256</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Density Diffusion: {config.DENSITY_DISSIPATION.toFixed(2)}</Label>
          <Slider
            value={[config.DENSITY_DISSIPATION]}
            onValueChange={([value]) =>
              onConfigChange({ DENSITY_DISSIPATION: value })
            }
            min={0}
            max={4.0}
            step={0.1}
          />
        </div>
        
        {/* More controls... */}
      </CardContent>
    </Card>
  )
}
```

### RemoteController Component

```typescript
'use client'

import { useRef, useCallback } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { ControlCanvas } from './ControlCanvas'
import { ControlPanel } from './ControlPanel'
import { ConnectionStatus } from './ConnectionStatus'

export function RemoteController() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const { isConnected, sendMessage } = useWebSocket('/ws', {
    role: 'controller',
    onConnectAck: (payload) => {
      console.log('Connected:', payload.sessionId)
    }
  })
  
  const handlePointerDown = useCallback((x: number, y: number) => {
    sendMessage({
      type: 'input',
      payload: {
        eventType: 'mousedown',
        position: { x, y }
      }
    })
  }, [sendMessage])
  
  const handlePointerMove = useCallback((x: number, y: number) => {
    sendMessage({
      type: 'input',
      payload: {
        eventType: 'mousemove',
        position: { x, y }
      }
    })
  }, [sendMessage])
  
  const handlePointerUp = useCallback((x: number, y: number) => {
    sendMessage({
      type: 'input',
      payload: {
        eventType: 'mouseup',
        position: { x, y }
      }
    })
  }, [sendMessage])
  
  const handlePattern = useCallback((patternName: string) => {
    sendMessage({
      type: 'command',
      payload: {
        command: 'preset_pattern',
        parameters: { patternName }
      }
    })
  }, [sendMessage])
  
  const handleRandomSplats = useCallback(() => {
    sendMessage({
      type: 'command',
      payload: {
        command: 'random_splats',
        parameters: { count: 10 }
      }
    })
  }, [sendMessage])
  
  return (
    <div className="relative w-full h-full">
      <ControlCanvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <ControlPanel
        onPattern={handlePattern}
        onRandomSplats={handleRandomSplats}
      />
      <ConnectionStatus isConnected={isConnected} />
    </div>
  )
}
```

---

## Performance Considerations

### React Optimization

1. **Memoization**:
   - Use `React.memo` for control components
   - Use `useMemo` for expensive calculations
   - Use `useCallback` for event handlers

2. **Refs vs State**:
   - WebGL resources in refs (no re-renders)
   - UI state in state (triggers re-renders)
   - Config in Zustand (selective subscriptions)

3. **Component Splitting**:
   - Separate control components to prevent unnecessary re-renders
   - Use Zustand selectors to subscribe only to needed config values

### WebGL Optimization

1. **Resource Reuse**:
   - Reuse shaders and programs
   - Cache framebuffers when possible
   - Avoid creating new textures each frame

2. **Frame Rate**:
   - Cap delta time to prevent large jumps
   - Use `requestAnimationFrame` efficiently
   - Skip rendering when paused

3. **Memory Management**:
   - Properly delete WebGL resources on cleanup
   - Avoid memory leaks in animation loops
   - Monitor WebGL context loss

### Bundle Size Optimization

1. **Code Splitting**:
   - Dynamic imports for heavy components
   - Separate chunks for simulator, controller, beat detector
   - Lazy load shader code if possible

2. **Tree Shaking**:
   - Use ES modules
   - Avoid default exports where possible
   - Mark unused code clearly

---

## Accessibility Considerations

1. **Keyboard Navigation**:
   - All controls keyboard accessible
   - Focus management
   - Keyboard shortcuts (P for pause, Space for splats)

2. **Screen Readers**:
   - Proper ARIA labels
   - Live regions for status updates
   - Descriptive button labels

3. **Visual**:
   - High contrast mode support
   - Focus indicators
   - Error states clearly visible

4. **Controls**:
   - Large touch targets (44x44px minimum)
   - Clear visual feedback
   - Loading states

---

## Deployment Considerations

### Environment Variables

```env
NEXT_PUBLIC_WS_URL=wss://fluid.christoflux.com/ws
NEXT_PUBLIC_API_URL=https://fluid.christoflux.com
```

### Build Configuration

**`next.config.js`**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // WebGL requires client-side only
  experimental: {
    // If needed for WebGL
  },
  // Static assets
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
}

module.exports = nextConfig
```

### Server Requirements

- Node.js 18+ for Next.js
- WebSocket support (ws library)
- Express for API routes (if needed)

---

## Migration Checklist

### Phase 1: Core Class
- [ ] Extract FluidSimulation class
- [ ] Create factory method
- [ ] Add lifecycle methods
- [ ] Add configuration methods
- [ ] Add input handling methods
- [ ] Write unit tests
- [ ] Document API

### Phase 2: React Hooks
- [ ] Create useFluidSimulation hook
- [ ] Create useWebGL hook
- [ ] Create useCanvas hook
- [ ] Create useWebSocket hook
- [ ] Create useAudioInput hook
- [ ] Test hooks

### Phase 3: State Management
- [ ] Set up Zustand
- [ ] Create fluidConfig store
- [ ] Create websocket store
- [ ] Create beatDetector store
- [ ] Migrate config usage

### Phase 4: Next.js Setup
- [ ] Initialize Next.js
- [ ] Install dependencies
- [ ] Set up Tailwind
- [ ] Set up shadcn UI
- [ ] Create app structure
- [ ] Set up routing

### Phase 5: Landing Page
- [ ] Create landing page
- [ ] Add Framer Motion animations
- [ ] Create navigation buttons
- [ ] Style with Tailwind
- [ ] Make responsive

### Phase 6: Simulator
- [ ] Create simulator page
- [ ] Create FluidSimulator component
- [ ] Create SimulationCanvas
- [ ] Create control components
- [ ] Integrate WebSocket
- [ ] Test functionality

### Phase 7: Controller
- [ ] Create controller page
- [ ] Create RemoteController component
- [ ] Create ControlCanvas
- [ ] Create ControlPanel
- [ ] Test WebSocket communication

### Phase 8: Beat Detector
- [ ] Create beat detector page
- [ ] Create BeatDetector component
- [ ] Create FrequencyVisualizer
- [ ] Create BeatControls
- [ ] Integrate audio input
- [ ] Test beat detection

### Phase 9: Polish
- [ ] Add loading states
- [ ] Add error boundaries
- [ ] Optimize performance
- [ ] Add accessibility
- [ ] Mobile optimization
- [ ] Final testing

---

## Risk Mitigation

### Potential Issues

1. **WebGL Context Loss**:
   - Implement context loss handling
   - Reinitialize on context restore
   - Show user-friendly error messages

2. **Performance Degradation**:
   - Profile regularly
   - Monitor frame rate
   - Optimize hot paths
   - Use React DevTools Profiler

3. **WebSocket Disconnections**:
   - Automatic reconnection
   - Connection status indicators
   - Queue messages when disconnected

4. **Audio Permissions**:
   - Handle permission denial gracefully
   - Show clear instructions
   - Fallback options

5. **Mobile Performance**:
   - Lower default resolutions on mobile
   - Disable expensive effects by default
   - Optimize touch handling

---

## Success Criteria

### Functional Requirements
- ✅ All existing features work identically
- ✅ WebGL rendering quality maintained
- ✅ WebSocket communication functional
- ✅ Beat detection works correctly
- ✅ All controls accessible and functional

### Non-Functional Requirements
- ✅ 60 FPS on desktop
- ✅ 30+ FPS on mobile
- ✅ No memory leaks
- ✅ Responsive design
- ✅ Accessible (WCAG 2.1 AA)
- ✅ Fast page loads
- ✅ Smooth animations

### Code Quality
- ✅ TypeScript strict mode
- ✅ No `any` types
- ✅ Comprehensive error handling
- ✅ Clean component structure
- ✅ Reusable hooks
- ✅ Well-documented code

---

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Set up development environment**
3. **Begin Phase 1** (Core Class extraction)
4. **Iterate** based on learnings
5. **Test** thoroughly at each phase
6. **Deploy** incrementally if possible

---

## Conclusion

This conversion plan provides a comprehensive roadmap for migrating the Fluid Music simulation to Next.js and React while preserving all functionality and improving the codebase structure. The FluidSimulation class design ensures the core logic remains reusable and testable, while React hooks provide a clean integration layer. The component structure follows React best practices and uses modern UI libraries for a polished user experience.

The phased approach allows for incremental development and testing, reducing risk and enabling early feedback. Each phase builds on the previous one, ensuring a solid foundation before moving to the next level of complexity.

