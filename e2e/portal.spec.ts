import { test, expect } from "@playwright/test";

test.describe("PGPx Student Portal End-to-End Test Suite", () => {
  test("1. Home Dashboard loads with Anonymous Batch Lounge as hero and 4 quick blocks", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/PGPx Student Portal/);

    // Verify Anonymous Batch Lounge acquires the major space
    await expect(page.locator("text=Anonymous Batch Lounge").first()).toBeVisible();
    await expect(page.locator("text=Posting as:").first()).toBeVisible();

    // Verify 4 action blocks
    await expect(page.locator("text=Add Important Date")).toBeVisible();
    await expect(page.locator("text=Add Assignment")).toBeVisible();
    await expect(page.locator("text=Add Important Link")).toBeVisible();
    await expect(page.locator("text=Create Party Chat")).toBeVisible();
  });

  test("2. Domain-Restricted Login rejects external domains and accepts @iimrohtak.ac.in", async ({ page }) => {
    await page.goto("/login");

    // Attempt login with illegal external domain (e.g. hacker@gmail.com)
    await page.fill('input[type="email"]', "hacker@gmail.com");
    await page.click('button[type="submit"]');

    // Expect access denied error message
    await expect(page.locator("text=Access Denied")).toBeVisible();

    // Now login with valid institute email (@iimrohtak.ac.in)
    await page.fill('input[type="email"]', "student@iimrohtak.ac.in");
    await page.click('button[type="submit"]');

    // Expect access granted message
    await expect(page.locator("text=Access Granted")).toBeVisible();
  });

  test("3. Block 1: Add Important Date publishes date and renders in feed", async ({ page }) => {
    await page.goto("/");

    // Click block 1
    await page.click("button:has-text('Add Important Date')");
    await expect(page.locator("text=Add Important Date or Deadline")).toBeVisible();

    // Fill reminder form
    await page.fill('input[placeholder*="Case Study 3"]', "Economics Quiz 1");
    await page.fill('input[type="date"]', "2026-11-25");
    await page.click("button:has-text('Publish Date')");

    // Verify modal closes and item is present in feed
    await expect(page.locator("text=Economics Quiz 1").first()).toBeVisible();
  });

  test("4. Block 3: Add Important Link publishes resource and renders in feed", async ({ page }) => {
    await page.goto("/");

    // Click block 3
    await page.click("button:has-text('Add Important Link')");
    await expect(page.locator("text=Create New Link / Resource")).toBeVisible();

    // Fill link form
    await page.fill('input[placeholder*="Attendance Sheet"]', "HBR Case Studies Drive");
    await page.fill('input[type="url"]', "https://drive.google.com/hbr-cases");
    await page.click("button:has-text('Add Link')");

    // Verify item appears in feed
    await expect(page.locator("text=HBR Case Studies Drive").first()).toBeVisible();
  });

  test("5. Major Anonymous Chat Lounge sends message and shows dynamic pseudonym", async ({ page }) => {
    await page.goto("/");

    // Verify hero anonymous chat input is visible
    const input = page.locator('input[placeholder*="Text anonymously as"]').first();
    await expect(input).toBeVisible();

    // Send a message
    await input.fill("Hello PGPx batch from Playwright!");
    await page.click('form button:has-text("Send")');

    // Verify message appears in feed
    await expect(page.locator("text=Hello PGPx batch from Playwright!").first()).toBeVisible();
  });

  test("6. Command Palette (Cmd+K) opens and displays quick actions", async ({ page }) => {
    await page.goto("/");
    // Click search trigger in header by title or text
    await page.click("button[title*='Search']");
    await expect(page.locator("text=Jump To Page")).toBeVisible();
  });
});
