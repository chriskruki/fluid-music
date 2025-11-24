import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should load landing page', async ({ page }) => {
    await page.goto('/')
    
    await expect(page).toHaveTitle(/Fluid Music/)
  })

  test('should display animated title', async ({ page }) => {
    const title = page.locator('h1:has-text("Fluid Music")')
    await expect(title).toBeVisible()
  })

  test('should display navigation buttons', async ({ page }) => {
    const simulatorButton = page.locator('a:has-text("Simulator")')
    const controlButton = page.locator('a:has-text("Control")')
    const beatButton = page.locator('a:has-text("Beat Detector")')
    
    await expect(simulatorButton).toBeVisible()
    await expect(controlButton).toBeVisible()
    await expect(beatButton).toBeVisible()
  })

  test('should navigate to simulator', async ({ page }) => {
    const simulatorButton = page.locator('a:has-text("Simulator")')
    await simulatorButton.click()
    
    await expect(page).toHaveURL(/\/sim/)
  })

  test('should navigate to controller', async ({ page }) => {
    const controlButton = page.locator('a:has-text("Control")')
    await controlButton.click()
    
    await expect(page).toHaveURL(/\/control/)
  })

  test('should navigate to beat detector', async ({ page }) => {
    const beatButton = page.locator('a:has-text("Beat Detector")')
    await beatButton.click()
    
    await expect(page).toHaveURL(/\/beat/)
  })

  test('should have hover animations on buttons', async ({ page }) => {
    const simulatorButton = page.locator('a:has-text("Simulator")')
    
    // Hover over button
    await simulatorButton.hover()
    
    // Wait for animation
    await page.waitForTimeout(100)
    
    // Button should still be visible and interactive
    await expect(simulatorButton).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    const title = page.locator('h1:has-text("Fluid Music")')
    await expect(title).toBeVisible()
    
    const buttons = page.locator('a')
    const buttonCount = await buttons.count()
    expect(buttonCount).toBeGreaterThanOrEqual(3)
  })
})

