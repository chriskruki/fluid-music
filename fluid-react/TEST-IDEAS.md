# Test Ideas & Scenarios

This document contains detailed test ideas organized by feature area. Use this as a reference when writing new tests.

## 🎯 Critical Path Tests (Must Have)

### 1. Core Simulation Functionality
- ✅ Canvas initializes with WebGL context
- ✅ Simulation starts and renders frames
- ✅ Mouse interactions create splats
- ✅ Touch interactions work on mobile
- ✅ Settings drawer opens and closes
- ✅ Presets apply correctly
- ✅ Configuration updates affect simulation

### 2. WebSocket Communication
- ✅ Simulator connects to WebSocket server
- ✅ Controller sends input messages
- ✅ Beat detector sends beat events
- ✅ Messages are received and processed
- ✅ Multiple clients can connect simultaneously
- ✅ Reconnection after disconnect

### 3. Settings & Configuration
- ✅ Default preset loads correctly
- ✅ All presets apply without errors
- ✅ Sliders update values correctly
- ✅ Switches toggle boolean values
- ✅ Color pickers update colors
- ✅ Settings persist during session

## 🚀 Performance Tests

### Frame Rate Monitoring
```typescript
test('should maintain 30+ FPS', async ({ page }) => {
  await page.goto('/sim')
  const fps = await getFrameRate(page, 5000)
  expect(fps).toBeGreaterThanOrEqual(30)
})
```

### Memory Leak Detection
```typescript
test('should not leak memory over time', async ({ page }) => {
  await page.goto('/sim')
  
  // Run for 5 minutes
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(5000)
    const memory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize)
    // Check memory doesn't grow unbounded
  }
})
```

### Load Testing
- Multiple simulators connected simultaneously
- High frequency of WebSocket messages
- Large number of splats created rapidly
- All effects enabled simultaneously

## 🔍 Edge Cases & Error Handling

### WebGL Context Loss
```typescript
test('should handle WebGL context loss', async ({ page }) => {
  await page.goto('/sim')
  
  // Simulate context loss
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    const gl = canvas?.getContext('webgl')
    const extension = gl?.getExtension('WEBGL_lose_context')
    extension?.loseContext()
  })
  
  // Should recover or show error message
  await page.waitForTimeout(1000)
  const errorMessage = page.locator('text=/error|not supported/i')
  // Either error message or recovery
})
```

### Invalid Configuration Values
```typescript
test('should handle invalid config values', async ({ page }) => {
  await page.goto('/sim')
  
  // Try to set invalid values
  await page.evaluate(() => {
    const store = useFluidConfig.getState()
    store.updateConfig({ SPLAT_RADIUS: -1 }) // Invalid
    store.updateConfig({ DENSITY_DISSIPATION: 1000 }) // Too high
  })
  
  // Should clamp or reject invalid values
})
```

### Network Failures
```typescript
test('should handle WebSocket disconnection', async ({ page }) => {
  await page.goto('/control')
  
  // Simulate network failure
  await page.route('ws://**', route => route.abort())
  
  // Should show disconnected status
  const status = page.locator('text=/disconnected/i')
  await expect(status).toBeVisible()
})
```

### Permission Denials
```typescript
test('should handle microphone permission denial', async ({ page, context }) => {
  await context.denyPermissions(['microphone'])
  await page.goto('/beat')
  
  const startButton = page.locator('button:has-text("Start Recording")')
  await startButton.click()
  
  // Should show error or fallback
  const error = page.locator('text=/permission|error/i')
  await expect(error).toBeVisible({ timeout: 5000 })
})
```

## 🎨 Visual Regression Tests

### Screenshot Comparisons
```typescript
test('should match visual baseline', async ({ page }) => {
  await page.goto('/sim')
  await page.waitForTimeout(2000) // Wait for simulation to stabilize
  
  await expect(page.locator('canvas')).toHaveScreenshot('simulator-default.png')
})
```

### Scenarios to Capture
- Default simulation state
- After applying each preset
- With mirror mode enabled (2, 4, 8 segments)
- With bloom enabled
- With sunrays enabled
- Single color mode
- Rainbow mode
- Different background colors

## 🔄 Integration Tests

### Full User Flows

#### Controller → Simulator Flow
```typescript
test('controller should control simulator', async ({ context }) => {
  const simulator = await context.newPage()
  const controller = await context.newPage()
  
  await simulator.goto('/sim')
  await controller.goto('/control')
  
  // Wait for connections
  await Promise.all([
    simulator.waitForTimeout(2000),
    controller.waitForTimeout(2000),
  ])
  
  // Send input from controller
  const canvas = controller.locator('div.absolute.inset-0')
  await canvas.tap({ position: { x: 200, y: 300 } })
  
  // Verify simulator received input (check for visual change or state)
  await simulator.waitForTimeout(1000)
  
  await Promise.all([simulator.close(), controller.close()])
})
```

#### Beat Detector → Simulator Flow
```typescript
test('beat detector should trigger simulator effects', async ({ context }) => {
  const simulator = await context.newPage()
  const beatDetector = await context.newPage()
  
  await simulator.goto('/sim')
  await beatDetector.goto('/beat')
  
  // Grant microphone permission
  await context.grantPermissions(['microphone'])
  
  // Start recording
  await beatDetector.locator('button:has-text("Start Recording")').click()
  
  // Simulate beat (or wait for real audio)
  await beatDetector.waitForTimeout(3000)
  
  // Verify simulator received beat event
  await simulator.waitForTimeout(1000)
  
  await Promise.all([simulator.close(), beatDetector.close()])
})
```

## 📱 Mobile-Specific Tests

### Touch Interactions
- Single touch creates splat
- Multi-touch creates multiple splats
- Touch and drag creates continuous splats
- Touch release stops splat creation
- Touch outside canvas doesn't create splats

### Responsive Design
- Settings drawer opens correctly on mobile
- Controls are accessible on small screens
- Canvas fills viewport correctly
- Text is readable on mobile
- Buttons are large enough for touch

### Performance on Mobile
- Maintains 30+ FPS on mid-range device
- Lower resolution automatically applied
- Effects disabled if not supported
- Memory usage stays reasonable

## 🌐 Cross-Browser Tests

### Browser-Specific Features
- WebGL support detection
- WebSocket implementation differences
- Audio API differences
- Touch event handling
- CSS feature support

### Known Issues to Test
- Safari WebGL context creation
- Firefox WebSocket reconnection
- Chrome audio worklet support
- Edge WebGL extensions

## 🔐 Security Tests

### Input Validation
- WebSocket message validation
- Configuration value sanitization
- XSS prevention in user inputs
- CSRF protection

### Permission Handling
- Microphone permission request
- Permission denial handling
- Permission revocation handling

## 📊 Analytics & Monitoring Tests

### Metrics Collection
- Frame rate tracking
- Error rate tracking
- User interaction tracking
- Performance metrics

### Error Reporting
- Errors are logged correctly
- Error messages are user-friendly
- Errors don't crash the app
- Recovery from errors works

## 🧪 Stress Tests

### High Load Scenarios
- 1000+ simultaneous splats
- Maximum resolution (2048x2048)
- All effects enabled
- Long-running session (1+ hour)
- Rapid configuration changes
- High WebSocket message frequency

### Resource Limits
- Memory usage under load
- CPU usage under load
- Network bandwidth usage
- Browser tab performance

## 🎯 Accessibility Tests

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space activate buttons
- Escape closes modals/drawers
- Arrow keys navigate sliders

### Screen Reader
- All elements have ARIA labels
- Dynamic content is announced
- Status changes are announced
- Error messages are announced

### Visual Accessibility
- Color contrast ratios meet WCAG AA
- Text is readable at all sizes
- Focus indicators are visible
- No color-only information

## 🔧 Developer Experience Tests

### Hot Reload
- Changes reflect without full reload
- State persists during hot reload
- WebGL context survives reload

### Error Messages
- Helpful error messages
- Stack traces in development
- Error boundaries catch crashes

## 📝 Test Data & Fixtures

### Test Presets
```typescript
export const testPresets = {
  minimal: {
    SIM_RESOLUTION: 32,
    DYE_RESOLUTION: 128,
    BLOOM: false,
    SUNRAYS: false,
  },
  maximum: {
    SIM_RESOLUTION: 256,
    DYE_RESOLUTION: 2048,
    BLOOM: true,
    SUNRAYS: true,
  },
}
```

### Test Patterns
- Pre-defined splat coordinates
- Known-good simulation states
- Expected visual outputs
- Performance baselines

## 🚦 Test Priorities

### P0 (Critical - Must Pass)
- WebGL initialization
- Basic simulation rendering
- Mouse/touch input
- Settings drawer functionality
- WebSocket connection
- Preset application

### P1 (Important - Should Pass)
- All settings update correctly
- Mirror mode works
- Rainbow vs single color
- Controller → Simulator communication
- Beat detector → Simulator communication
- Performance targets

### P2 (Nice to Have)
- Visual regression tests
- Stress tests
- Cross-browser edge cases
- Accessibility compliance
- Long-running stability

## 💡 Creative Test Ideas

### Simulation Behavior Tests
- Splats decay over time correctly
- Velocity affects dye movement
- Pressure calculations are correct
- Curl creates vortices
- Mirror mode creates symmetrical patterns

### Visual Effect Tests
- Bloom creates glow effect
- Sunrays create light rays
- Shading creates depth
- Colors blend correctly
- Transparency works

### Interaction Tests
- Rapid clicking creates multiple splats
- Dragging creates continuous splats
- Touch gestures work
- Keyboard shortcuts work
- Settings changes apply immediately

### Edge Case Interactions
- Very small splat radius
- Very large splat radius
- Maximum density diffusion
- Zero density diffusion
- All effects enabled simultaneously

## 📈 Performance Benchmarks

### Baseline Targets
- Initial load: < 2 seconds
- Time to interactive: < 3 seconds
- Frame rate: 30+ FPS (mobile), 60 FPS (desktop)
- Memory: < 200MB after 5 minutes
- WebSocket latency: < 100ms
- Beat detection accuracy: 90%+

### Measurement Points
- Page load time
- WebGL initialization time
- First frame render time
- Settings update latency
- WebSocket message latency
- Beat detection latency

## 🎓 Learning Resources

### Playwright Best Practices
- Use data-testid attributes for reliable selectors
- Wait for elements, not arbitrary timeouts
- Use page object models for complex pages
- Group related tests with describe blocks
- Use fixtures for shared setup

### Jest Best Practices
- Test behavior, not implementation
- Use descriptive test names
- Keep tests isolated
- Mock external dependencies
- Use snapshots sparingly

### WebGL Testing Tips
- Mock WebGL context for unit tests
- Use real WebGL for E2E tests
- Check for WebGL support before tests
- Handle context loss gracefully
- Test on multiple GPU types

