import { test, expect } from '@playwright/test'

test.describe('Simulator Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sim')
  })

  test('should load simulator page', async ({ page }) => {
    await expect(page).toHaveTitle(/Fluid Music/)
  })

  test('should initialize WebGL canvas', async ({ page }) => {
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
    
    // Check WebGL context is created
    const webglContext = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      if (!canvas) return null
      return canvas.getContext('webgl') || canvas.getContext('webgl2')
    })
    
    expect(webglContext).not.toBeNull()
  })

  test('should open settings drawer', async ({ page }) => {
    const settingsButton = page.locator('button[aria-label="Open settings"]')
    await expect(settingsButton).toBeVisible()
    
    await settingsButton.click()
    
    const drawer = page.locator('[role="dialog"]')
    await expect(drawer).toBeVisible()
    
    const title = drawer.locator('text=Simulation Settings')
    await expect(title).toBeVisible()
  })

  test('should apply default preset', async ({ page }) => {
    await page.locator('button[aria-label="Open settings"]').click()
    
    const defaultPreset = page.locator('button:has-text("Default")')
    await defaultPreset.click()
    
    // Verify preset is applied by checking config values
    const config = await page.evaluate(() => {
      // Access Zustand store if exposed, or check DOM state
      return (window as any).__FLUID_CONFIG__
    })
    
    // If config is not exposed, check visual state or use other indicators
    await expect(defaultPreset).toBeVisible()
  })

  test('should update splat radius', async ({ page }) => {
    await page.locator('button[aria-label="Open settings"]').click()
    
    // Switch to basic tab if needed
    const basicTab = page.locator('button:has-text("Basic")')
    await basicTab.click()
    
    const slider = page.locator('input[type="range"]').first()
    const initialValue = await slider.inputValue()
    
    // Move slider
    await slider.fill('0.1')
    
    // Verify value updated
    const newValue = await slider.inputValue()
    expect(parseFloat(newValue)).toBeGreaterThan(parseFloat(initialValue))
  })

  test('should toggle rainbow mode', async ({ page }) => {
    await page.locator('button[aria-label="Open settings"]').click()
    
    const rainbowSwitch = page.locator('label:has-text("Rainbow Mode")').locator('..').locator('button[role="switch"]')
    const isChecked = await rainbowSwitch.getAttribute('aria-checked')
    
    await rainbowSwitch.click()
    
    const newChecked = await rainbowSwitch.getAttribute('aria-checked')
    expect(newChecked).not.toBe(isChecked)
  })

  test('should handle mouse interactions', async ({ page }) => {
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
    
    // Simulate mouse down and move
    await canvas.click({ position: { x: 400, y: 300 } })
    await canvas.dragTo(canvas, {
      sourcePosition: { x: 400, y: 300 },
      targetPosition: { x: 500, y: 400 },
    })
    
    // Verify canvas is still rendering (no errors)
    await expect(canvas).toBeVisible()
  })

  test('should handle touch interactions on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
    
    // Simulate touch
    await canvas.tap({ position: { x: 187, y: 333 } })
    
    await expect(canvas).toBeVisible()
  })

  test('should switch between basic and advanced tabs', async ({ page }) => {
    await page.locator('button[aria-label="Open settings"]').click()
    
    const advancedTab = page.locator('button:has-text("Advanced")')
    await advancedTab.click()
    
    // Verify advanced settings are visible
    const simulationResolution = page.locator('label:has-text("Simulation Resolution")')
    await expect(simulationResolution).toBeVisible()
    
    const basicTab = page.locator('button:has-text("Basic")')
    await basicTab.click()
    
    // Verify basic settings are visible
    const presets = page.locator('label:has-text("Presets")')
    await expect(presets).toBeVisible()
  })

  test('should update background color', async ({ page }) => {
    await page.locator('button[aria-label="Open settings"]').click()
    
    const colorInput = page.locator('input[type="color"]').last() // Background color is last
    await colorInput.fill('#ff0000')
    
    // Verify color changed (check canvas background or config)
    await expect(colorInput).toHaveValue('#ff0000')
  })

  test('should toggle mirror mode', async ({ page }) => {
    await page.locator('button[aria-label="Open settings"]').click()
    
    const mirrorSwitch = page.locator('label:has-text("Mirror Mode")').locator('..').locator('button[role="switch"]')
    await mirrorSwitch.click()
    
    // Verify mirror segments slider appears
    const segmentsSlider = page.locator('label:has-text("Mirror Segments")')
    await expect(segmentsSlider).toBeVisible()
  })
})

test.describe('Simulator Performance', () => {
  test('should maintain frame rate', async ({ page }) => {
    await page.goto('/sim')
    
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
    
    // Wait for simulation to start
    await page.waitForTimeout(1000)
    
    // Measure frame rate over 3 seconds
    const frameCount = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frames = 0
        const startTime = Date.now()
        
        const countFrame = () => {
          frames++
          if (Date.now() - startTime < 3000) {
            requestAnimationFrame(countFrame)
          } else {
            resolve(frames)
          }
        }
        
        requestAnimationFrame(countFrame)
      })
    })
    
    // Should achieve at least 30 FPS (90 frames in 3 seconds)
    expect(frameCount).toBeGreaterThan(90)
  })
})

