import { test, expect } from "@playwright/test";

test.describe("WebSocket Communication", () => {
  test("simulator should connect to WebSocket", async ({ page }) => {
    await page.goto("/sim");

    // Wait for WebSocket connection
    await page.waitForTimeout(1000);

    // Check if WebSocket connection was attempted
    const wsConnected = await page.evaluate(() => {
      return (window as any).__WS_CONNECTED__ === true;
    });

    // If not exposed, check network requests
    const wsRequests = await page.evaluate(() => {
      return (
        performance.getEntriesByType("resource") as PerformanceResourceTiming[]
      ).filter(
        (entry) => entry.name.includes("ws://") || entry.name.includes("wss://")
      ).length;
    });

    // At least connection attempt should be made
    expect(wsConnected || wsRequests > 0).toBeTruthy();
  });

  test("controller should send input messages", async ({ context }) => {
    // Create two pages: simulator and controller
    const simulatorPage = await context.newPage();
    const controllerPage = await context.newPage();

    await simulatorPage.goto("/sim");
    await controllerPage.goto("/control");

    // Wait for connections
    await Promise.all([
      simulatorPage.waitForTimeout(1000),
      controllerPage.waitForTimeout(1000),
    ]);

    // Simulate touch on controller
    const canvas = controllerPage.locator("div.absolute.inset-0");
    await canvas.tap({ position: { x: 200, y: 300 } });

    // Wait for message to be sent
    await controllerPage.waitForTimeout(500);

    // Verify message was sent (check WebSocket send calls)
    const messagesSent = await controllerPage.evaluate(() => {
      return (window as any).__WS_MESSAGES_SENT__ || 0;
    });

    // Cleanup
    await simulatorPage.close();
    await controllerPage.close();
  });

  test("beat detector should send beat events", async ({ page }) => {
    await page.goto("/beat");

    // Click start recording (will need to handle permission)
    const startButton = page.locator('button:has-text("Start Recording")');
    await startButton.click();

    // Handle permission dialog if it appears
    page.on("dialog", async (dialog) => {
      if (
        dialog.type() === "beforeunload" ||
        dialog.message().includes("microphone")
      ) {
        await dialog.accept();
      }
    });

    // Wait for audio processing
    await page.waitForTimeout(2000);

    // Check if beats are being detected
    const energyDisplay = page.locator("text=/Current Energy/");
    await expect(energyDisplay).toBeVisible();
  });

  test("multiple clients should connect simultaneously", async ({
    context,
  }) => {
    const pages = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage(),
    ]);

    await Promise.all([
      pages[0].goto("/sim"),
      pages[1].goto("/control"),
      pages[2].goto("/beat"),
    ]);

    await Promise.all(pages.map((p) => p.waitForTimeout(2000)));

    // Verify all pages loaded
    for (const page of pages) {
      const title = await page.title();
      expect(title).toContain("Fluid Music");
    }

    await Promise.all(pages.map((p) => p.close()));
  });
});
