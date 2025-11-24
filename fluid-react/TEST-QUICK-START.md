# Testing Quick Start Guide

## 🚀 Getting Started

### Install Dependencies
```bash
npm install
npx playwright install  # Install Playwright browsers
```

### Run Tests

**Unit Tests (Jest)**
```bash
npm test                 # Run once
npm test -- --watch     # Watch mode
npm run test:coverage    # With coverage report
```

**E2E Tests (Playwright)**
```bash
npm run test:e2e              # Run all tests
npm run test:e2e:ui           # Interactive UI mode
npm run test:e2e:headed       # See browser
npm run test:e2e -- chromium  # Specific browser
```

## 📁 Test Structure

```
fluid-react/
├── __tests__/              # Jest unit/component tests
│   ├── lib/
│   │   └── fluid/
│   │       ├── config.test.ts
│   │       └── presets.test.ts
│   └── stores/
│       └── fluidConfig.test.ts
│
├── e2e/                    # Playwright E2E tests
│   ├── simulator.spec.ts
│   ├── controller.spec.ts
│   ├── beat-detector.spec.ts
│   ├── websocket.spec.ts
│   └── landing.spec.ts
│
└── tests/                  # Shared test utilities
    └── helpers.ts
```

## 🧪 Test Types

### 1. Unit Tests (Jest)
**Location**: `__tests__/`

**What to Test**:
- Utility functions
- Config merging
- Preset application
- Zustand store actions
- Pure functions

**Example**:
```typescript
// __tests__/lib/fluid/config.test.ts
describe('mergeConfig', () => {
  it('should merge partial config', () => {
    const merged = mergeConfig({ SPLAT_RADIUS: 0.1 })
    expect(merged.SPLAT_RADIUS).toBe(0.1)
  })
})
```

### 2. Component Tests (Jest + React Testing Library)
**Location**: `__tests__/components/`

**What to Test**:
- Component rendering
- User interactions
- Props handling
- State updates

**Example**:
```typescript
// __tests__/components/SettingsDrawer.test.tsx
import { render, screen } from '@testing-library/react'
import { SettingsDrawer } from '@/components/fluid-simulator/SettingsDrawer'

test('should render settings drawer', () => {
  render(<SettingsDrawer />)
  expect(screen.getByText('Simulation Settings')).toBeInTheDocument()
})
```

### 3. E2E Tests (Playwright)
**Location**: `e2e/`

**What to Test**:
- Full user flows
- WebGL initialization
- WebSocket communication
- Cross-page navigation
- Browser-specific features

**Example**:
```typescript
// e2e/simulator.spec.ts
test('should initialize WebGL', async ({ page }) => {
  await page.goto('/sim')
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
})
```

## 🎯 Key Test Scenarios

### Critical Path (Must Test)
1. ✅ WebGL canvas initializes
2. ✅ Simulation renders frames
3. ✅ Mouse/touch input works
4. ✅ Settings drawer opens/closes
5. ✅ Presets apply correctly
6. ✅ WebSocket connects
7. ✅ Controller sends messages
8. ✅ Beat detector sends beats

### Important (Should Test)
1. All settings update simulation
2. Mirror mode creates duplicates
3. Rainbow vs single color
4. Performance (30+ FPS)
5. Mobile touch interactions
6. Error handling

### Nice to Have
1. Visual regression
2. Stress tests
3. Accessibility
3. Long-running stability

## 🛠️ Writing New Tests

### Jest Test Template
```typescript
import { describe, it, expect } from '@jest/globals'

describe('Feature Name', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test'
    
    // Act
    const result = functionToTest(input)
    
    // Assert
    expect(result).toBe('expected')
  })
})
```

### Playwright Test Template
```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Navigate
    await page.goto('/page')
    
    // Interact
    await page.click('button')
    
    // Assert
    await expect(page.locator('element')).toBeVisible()
  })
})
```

## 🔍 Debugging Tests

### Jest Debugging
```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# VS Code: Use "Debug Jest Test" configuration
```

### Playwright Debugging
```bash
# Interactive mode
npm run test:e2e:ui

# Step through test
PWDEBUG=1 npm run test:e2e

# Record new test
npx playwright codegen http://localhost:3000
```

## 📊 Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Component Tests**: 70%+ coverage  
- **E2E Tests**: All critical paths covered

## 🚨 Common Issues

### WebGL Context Not Available
- Use mocked WebGL in Jest tests
- Use real WebGL in Playwright tests
- Check browser support before tests

### WebSocket Connection Fails
- Mock WebSocket in unit tests
- Use real WebSocket in E2E tests
- Ensure server is running for E2E

### Audio Permission Denied
- Grant permissions in Playwright: `context.grantPermissions(['microphone'])`
- Mock AudioContext in Jest tests

### Tests Timeout
- Increase timeout for slow operations
- Use proper wait conditions instead of fixed delays
- Check for async operations completing

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/react)
- [TESTING.md](./TESTING.md) - Full testing documentation
- [TEST-IDEAS.md](./TEST-IDEAS.md) - Test scenarios and ideas

## 💡 Tips

1. **Use data-testid** for reliable selectors in E2E tests
2. **Mock external dependencies** in unit tests
3. **Wait for elements**, not arbitrary timeouts
4. **Group related tests** with describe blocks
5. **Keep tests isolated** - don't depend on test order
6. **Test behavior**, not implementation details
7. **Use fixtures** for shared setup in Playwright

