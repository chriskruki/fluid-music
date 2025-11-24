import { test, expect } from '@playwright/test'

test.describe('Beat Detector Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/beat')
  })

  test('should load beat detector page', async ({ page }) => {
    await expect(page).toHaveTitle(/Fluid Music/)
    
    const title = page.locator('h1:has-text("Beat Detector")')
    await expect(title).toBeVisible()
  })

  test('should display start recording button', async ({ page }) => {
    const startButton = page.locator('button:has-text("Start Recording")')
    await expect(startButton).toBeVisible()
  })

  test('should show frequency controls', async ({ page }) => {
    const minFreq = page.locator('label:has-text("Min Frequency")')
    const maxFreq = page.locator('label:has-text("Max Frequency")')
    
    await expect(minFreq).toBeVisible()
    await expect(maxFreq).toBeVisible()
  })

  test('should show sensitivity control', async ({ page }) => {
    const sensitivity = page.locator('label:has-text("Sensitivity")')
    await expect(sensitivity).toBeVisible()
  })

  test('should update frequency range', async ({ page }) => {
    const minSlider = page.locator('input[type="range"]').first()
    await minSlider.fill('100')
    
    const value = await minSlider.inputValue()
    expect(parseFloat(value)).toBeGreaterThanOrEqual(100)
  })

  test('should update sensitivity', async ({ page }) => {
    const sensitivitySlider = page.locator('input[type="range"]').nth(2)
    await sensitivitySlider.fill('2.5')
    
    const value = await sensitivitySlider.inputValue()
    expect(parseFloat(value)).toBeGreaterThanOrEqual(2.0)
  })

  test('should display energy visualization', async ({ page }) => {
    const energyLabel = page.locator('text=/Current Energy/')
    await expect(energyLabel).toBeVisible()
    
    const energyBar = page.locator('div.bg-blue-500')
    await expect(energyBar).toBeVisible()
  })

  test('should handle microphone permission', async ({ page, context }) => {
    // Grant microphone permission
    await context.grantPermissions(['microphone'])
    
    const startButton = page.locator('button:has-text("Start Recording")')
    await startButton.click()
    
    // Wait for audio context initialization
    await page.waitForTimeout(1000)
    
    // Check if recording started (button text changes or state changes)
    const stopButton = page.locator('button:has-text("Stop Recording")')
    await expect(stopButton).toBeVisible()
  })

  test('should stop recording', async ({ page, context }) => {
    await context.grantPermissions(['microphone'])
    
    const startButton = page.locator('button:has-text("Start Recording")')
    await startButton.click()
    
    await page.waitForTimeout(1000)
    
    const stopButton = page.locator('button:has-text("Stop Recording")')
    await stopButton.click()
    
    await page.waitForTimeout(500)
    
    // Button should change back to start
    await expect(startButton).toBeVisible()
  })
})

