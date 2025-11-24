# Testing Documentation

## Overview

This document outlines the testing strategy for the Fluid Music application. We use a combination of Jest (unit/component tests) and Playwright (E2E tests) to ensure functionality across all features.

## Test Structure

```
fluid-react/
├── __tests__/              # Jest unit tests
│   ├── lib/                # Utility function tests
│   ├── hooks/              # React hook tests
│   └── stores/             # Zustand store tests
├── e2e/                    # Playwright E2E tests
│   ├── simulator.spec.ts
│   ├── controller.spec.ts
│   ├── beat-detector.spec.ts
│   └── websocket.spec.ts
└── tests/                  # Shared test utilities
    └── helpers.ts
```

## Testing Strategy

### Unit Tests (Jest)
- **Purpose**: Test individual functions, utilities, and logic in isolation
- **Use Cases**:
  - Config merging and presets
  - Color conversion utilities
  - Math/calculation functions
  - Zustand store actions
  - React hooks (with React Testing Library)

### Component Tests (Jest + React Testing Library)
- **Purpose**: Test React components in isolation
- **Use Cases**:
  - Component rendering
  - User interactions (clicks, inputs)
  - Props handling
  - State updates

### E2E Tests (Playwright)
- **Purpose**: Test full user flows and browser-specific features
- **Use Cases**:
  - WebGL canvas initialization
  - Mouse/touch interactions
  - WebSocket communication
  - Audio API access
  - Cross-page navigation
  - Settings drawer functionality
  - Preset application

## Test Scenarios

### 1. Landing Page Tests

#### E2E (Playwright)
- ✅ Page loads and displays title
- ✅ Navigation buttons are visible and clickable
- ✅ Framer Motion animations play on load
- ✅ Navigation buttons link to correct routes
- ✅ Responsive design works on mobile/tablet/desktop

#### Component (Jest)
- ✅ AnimatedTitle component renders
- ✅ NavButtons component renders with correct links
- ✅ Button hover states work

### 2. Simulator Page Tests

#### E2E (Playwright)
- ✅ Canvas initializes and WebGL context is created
- ✅ Fluid simulation starts running
- ✅ Mouse interactions create splats
- ✅ Touch interactions work on mobile
- ✅ Settings drawer opens/closes
- ✅ Settings changes update simulation
- ✅ Presets apply correctly
- ✅ Mirror mode creates duplicate splats
- ✅ Rainbow mode vs single color mode
- ✅ Background color changes
- ✅ Density diffusion slider works
- ✅ Splat radius slider works
- ✅ All advanced settings update correctly
- ✅ Canvas resizes correctly on window resize
- ✅ Performance: maintains 30+ FPS on mid-range device

#### Component (Jest)
- ✅ FluidSimulator component renders
- ✅ SimulationCanvas handles pointer events
- ✅ SettingsDrawer opens/closes
- ✅ SettingsDrawer tabs switch correctly
- ✅ Preset buttons trigger updates

#### Unit (Jest)
- ✅ FluidConfig store updates correctly
- ✅ Config merging works
- ✅ Preset application works
- ✅ Color conversion utilities

### 3. Controller Page Tests

#### E2E (Playwright)
- ✅ WebSocket connection establishes
- ✅ Touch/mouse input sends messages
- ✅ Pattern buttons send commands
- ✅ Random splats button works
- ✅ Connection status indicator shows correct state
- ✅ Disconnection handling
- ✅ Reconnection logic
- ✅ Multiple controllers can connect simultaneously

#### Component (Jest)
- ✅ RemoteController renders
- ✅ Connection status displays correctly
- ✅ Pattern buttons trigger WebSocket messages

#### Unit (Jest)
- ✅ WebSocket store connection/disconnection
- ✅ Message sending/receiving
- ✅ Client role assignment

### 4. Beat Detector Page Tests

#### E2E (Playwright)
- ✅ Microphone permission request appears
- ✅ Audio context initializes
- ✅ Frequency analysis works
- ✅ Beat detection triggers events
- ✅ Beat events send WebSocket messages
- ✅ Frequency sliders update analysis range
- ✅ Sensitivity slider affects detection threshold
- ✅ Visualization updates in real-time
- ✅ Stop recording releases microphone

#### Component (Jest)
- ✅ BeatDetector component renders
- ✅ Start/stop recording works
- ✅ Sliders update state

#### Unit (Jest)
- ✅ Frequency range calculation
- ✅ Beat detection algorithm
- ✅ Energy calculation

### 5. WebSocket Communication Tests

#### E2E (Playwright)
- ✅ Simulator receives remote input
- ✅ Simulator receives commands
- ✅ Simulator receives beat events
- ✅ Controller sends input correctly
- ✅ Beat detector sends beats correctly
- ✅ Multiple clients can connect
- ✅ Message routing works correctly
- ✅ Connection state syncs across clients
- ✅ Error handling on connection failure
- ✅ Reconnection after disconnect

#### Unit (Jest)
- ✅ Message type validation
- ✅ Message serialization/deserialization
- ✅ WebSocket store state management

### 6. Settings & Configuration Tests

#### E2E (Playwright)
- ✅ Default preset loads correctly
- ✅ All presets apply correctly
- ✅ Basic settings update simulation
- ✅ Advanced settings update simulation
- ✅ Settings persist during session
- ✅ Settings reset to defaults
- ✅ Color pickers work
- ✅ Sliders update values
- ✅ Switches toggle boolean values

#### Unit (Jest)
- ✅ Preset definitions are valid
- ✅ Config validation
- ✅ Config merging logic

### 7. Performance Tests

#### E2E (Playwright)
- ✅ Frame rate monitoring (30+ FPS minimum)
- ✅ Memory leak detection (run for 5+ minutes)
- ✅ Large number of splats performance
- ✅ High resolution performance
- ✅ Multiple effects enabled performance
- ✅ WebGL context loss handling

### 8. Cross-Browser Tests

#### E2E (Playwright)
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari/WebKit
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### 9. Accessibility Tests

#### E2E (Playwright)
- ✅ Keyboard navigation works
- ✅ Screen reader compatibility
- ✅ Focus management
- ✅ ARIA labels present
- ✅ Color contrast ratios

### 10. Error Handling Tests

#### E2E (Playwright)
- ✅ WebGL not supported error message
- ✅ WebSocket connection failure
- ✅ Microphone permission denied
- ✅ Invalid configuration values
- ✅ Network disconnection recovery

## Test Implementation Ideas

### Mocking Strategy

#### WebGL Mocking
```typescript
// Mock WebGL context for unit tests
const mockWebGLContext = {
  createShader: jest.fn(),
  createProgram: jest.fn(),
  createTexture: jest.fn(),
  createFramebuffer: jest.fn(),
  // ... other WebGL methods
}
```

#### WebSocket Mocking
```typescript
// Mock WebSocket for unit tests
class MockWebSocket {
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  send = jest.fn()
  close = jest.fn()
}
```

#### Audio Context Mocking
```typescript
// Mock AudioContext for unit tests
const mockAudioContext = {
  createAnalyser: jest.fn(),
  createMediaStreamSource: jest.fn(),
  audioWorklet: {
    addModule: jest.fn()
  }
}
```

### Test Utilities

#### Playwright Helpers
- `waitForWebGL()` - Wait for WebGL context initialization
- `waitForWebSocket()` - Wait for WebSocket connection
- `simulateTouch()` - Simulate touch events
- `getFrameRate()` - Measure canvas frame rate
- `takeScreenshot()` - Capture canvas state

#### Jest Helpers
- `createMockConfig()` - Create test FluidConfig
- `createMockSimulation()` - Create mock FluidSimulation instance
- `waitForStoreUpdate()` - Wait for Zustand store update

## Running Tests

### Unit/Component Tests (Jest)
```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- SettingsDrawer.test.tsx
```

### E2E Tests (Playwright)
```bash
# Run all E2E tests
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e -- --ui

# Run specific test file
npm run test:e2e -- simulator.spec.ts

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run on specific browser
npm run test:e2e -- --project=chromium
```

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
- name: Run unit tests
  run: npm test -- --coverage

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage for utility functions
- **Component Tests**: 70%+ coverage for React components
- **E2E Tests**: Cover all critical user flows
- **Integration Tests**: Cover WebSocket and WebGL interactions

## Continuous Testing

### Pre-commit Hooks
- Run linting
- Run unit tests
- Check test coverage thresholds

### PR Checks
- All tests must pass
- Coverage must not decrease
- E2E tests must pass on all browsers

### Nightly Builds
- Full test suite
- Performance benchmarks
- Cross-browser testing
- Visual regression testing

## Debugging Tests

### Playwright Debugging
```bash
# Open Playwright Inspector
PWDEBUG=1 npm run test:e2e

# Use Playwright Codegen to record tests
npx playwright codegen http://localhost:3000
```

### Jest Debugging
```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Use VS Code debugger
# Add breakpoints and use "Debug Jest Test" configuration
```

## Performance Benchmarks

### Metrics to Track
- Initial load time
- Time to interactive
- Frame rate (FPS)
- Memory usage
- WebSocket message latency
- Beat detection accuracy

### Baseline Targets
- Initial load: < 2 seconds
- Time to interactive: < 3 seconds
- Frame rate: 30+ FPS (mobile), 60 FPS (desktop)
- Memory: < 200MB after 5 minutes
- WebSocket latency: < 100ms
- Beat detection: 90%+ accuracy

## Visual Regression Testing

### Screenshots
- Capture canvas state at key moments
- Compare against baseline images
- Detect visual regressions

### Example Scenarios
- Default simulation state
- After applying preset
- With mirror mode enabled
- With bloom enabled
- With sunrays enabled

## Test Data

### Test Presets
- Minimal config for fast tests
- Maximum config for stress tests
- Edge case configs (zero values, max values)

### Test Patterns
- Pre-defined splat patterns
- Known-good simulation states
- Expected visual outputs

## Future Test Ideas

1. **Stress Tests**
   - 1000+ simultaneous splats
   - Maximum resolution
   - All effects enabled
   - Long-running sessions (1+ hour)

2. **Compatibility Tests**
   - Different WebGL versions
   - Various GPU capabilities
   - Different screen resolutions
   - Different pixel ratios

3. **Security Tests**
   - WebSocket message validation
   - XSS prevention
   - CSRF protection
   - Input sanitization

4. **Accessibility Tests**
   - WCAG 2.1 AA compliance
   - Keyboard-only navigation
   - Screen reader compatibility
   - High contrast mode

5. **Integration Tests**
   - Full flow: Controller → Simulator
   - Full flow: Beat Detector → Simulator
   - Multiple clients simultaneously
   - Server restart/reconnection

6. **Load Tests**
   - Multiple simulators connected
   - High message frequency
   - Concurrent beat detectors
   - Server capacity limits

