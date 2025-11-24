import { test, expect } from '@playwright/test'

test.describe('Controller Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/control')
  })

  test('should load controller page', async ({ page }) => {
    await expect(page).toHaveTitle(/Fluid Music/)
  })

  test('should display connection status', async ({ page }) => {
    // Wait for WebSocket connection attempt
    await page.waitForTimeout(1000)
    
    // Check for connection status indicator
    const statusIndicator = page.locator('text=/Disconnected|Connected/')
    await expect(statusIndicator).toBeVisible()
  })

  test('should send touch input', async ({ page }) => {
    const canvas = page.locator('div.absolute.inset-0.bg-black')
    await expect(canvas).toBeVisible()
    
    // Simulate touch
    await canvas.tap({ position: { x: 200, y: 300 } })
    
    // Wait for message to be sent
    await page.waitForTimeout(500)
    
    // Verify canvas is still visible (no errors)
    await expect(canvas).toBeVisible()
  })

  test('should send pattern commands', async ({ page }) => {
    const cornersButton = page.locator('button:has-text("Corners")')
    await expect(cornersButton).toBeVisible()
    
    await cornersButton.click()
    
    // Wait for command to be sent
    await page.waitForTimeout(500)
    
    // Verify button is still visible
    await expect(cornersButton).toBeVisible()
  })

  test('should send random splats command', async ({ page }) => {
    const randomButton = page.locator('button:has-text("Random Splats")')
    await expect(randomButton).toBeVisible()
    
    await randomButton.click()
    
    await page.waitForTimeout(500)
    
    await expect(randomButton).toBeVisible()
  })

  test('should handle multiple touch points', async ({ page }) => {
    const canvas = page.locator('div.absolute.inset-0.bg-black')
    
    // Simulate multi-touch
    await canvas.tap({ position: { x: 100, y: 200 } })
    await page.waitForTimeout(100)
    await canvas.tap({ position: { x: 300, y: 400 } })
    
    await page.waitForTimeout(500)
    
    await expect(canvas).toBeVisible()
  })
})

