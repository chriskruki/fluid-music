# Fluid Music - React/Next.js Conversion

This is the React/Next.js conversion of the Fluid Music WebGL simulation application.

## Current Status

### ✅ Completed
- Next.js project structure initialized
- TypeScript configuration
- Tailwind CSS setup
- Landing page with Framer Motion animations
- Basic UI components (Button)
- Type definitions (fluid, webgl, websocket)
- WebGL context utilities
- Shader utilities
- Program/Material classes
- Configuration system
- Placeholder pages for /sim, /control, /beat

### 🚧 In Progress
- FluidSimulation class extraction
- Framebuffer management
- Shader source strings
- Simulation step logic
- Rendering pipeline
- React hooks (useFluidSimulation, useWebSocket)
- Zustand stores
- Component implementations

### 📋 Remaining Work

#### Core Fluid Simulation
1. **lib/fluid/FluidSimulation.ts** - Main class (needs to be created)
   - Factory method `FluidSimulation.create()`
   - Lifecycle management (init, start, stop, destroy)
   - Configuration updates
   - Input handling
   - Pattern creation methods

2. **lib/fluid/framebuffers.ts** - FBO management (needs to be created)
   - createFBO, createDoubleFBO
   - resizeFBO, resizeDoubleFBO
   - createTextureAsync
   - setupBlit

3. **lib/fluid/shaders.ts** - Shader source strings (needs to be created)
   - All shader creation functions
   - displayShaderSource constant

4. **lib/fluid/simulation.ts** - Simulation logic (needs to be created)
   - step function
   - splat functions
   - pattern creation functions
   - color generation

5. **lib/fluid/rendering.ts** - Rendering pipeline (needs to be created)
   - render function
   - bloom processing
   - sunrays processing
   - display rendering

#### React Integration
1. **hooks/useFluidSimulation.ts** - Main hook
2. **hooks/useWebSocket.ts** - WebSocket connection hook
3. **hooks/useAudioInput.ts** - Audio input hook
4. **stores/fluidConfig.ts** - Zustand store for config
5. **stores/websocket.ts** - WebSocket state store

#### Components
1. **components/fluid-simulator/** - Simulator components
2. **components/remote-controller/** - Controller components
3. **components/beat-detector/** - Beat detector components
4. **components/ui/** - shadcn UI components (need to install more)

#### Pages
1. **app/sim/page.tsx** - Integrate FluidSimulator component
2. **app/control/page.tsx** - Integrate RemoteController component
3. **app/beat/page.tsx** - Integrate BeatDetector component

## Migration Strategy

The conversion follows the plan outlined in `REACT-CONVERT.md`. The existing TypeScript logic from `fluid/ts/` should be migrated to the new structure while:

1. Converting global state to class-based encapsulation
2. Creating React hooks for WebGL lifecycle
3. Using Zustand for configuration state
4. Building React components with shadcn UI

## Next Steps

1. Complete the FluidSimulation class extraction
2. Create all shader source files
3. Implement framebuffer utilities
4. Create React hooks
5. Build component implementations
6. Integrate WebSocket functionality
7. Add audio input handling

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Testing

### Unit & Component Tests (Jest)

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run with coverage
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npm run test:e2e -- simulator.spec.ts
```

See [TESTING.md](./TESTING.md) for detailed testing documentation and [TEST-IDEAS.md](./TEST-IDEAS.md) for test scenarios and ideas.

## References

- Original implementation: `../fluid/ts/`
- Conversion plan: `REACT-CONVERT.md`
- Technical details: `SIM.md`
- Testing guide: `TESTING.md`
- Test ideas: `TEST-IDEAS.md`

