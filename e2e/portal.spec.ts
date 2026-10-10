import { test, expect } from "@playwright/test";

test.describe("PGPx Student Portal End-to-End Test Suite", () => {
  test("1. Home Dashboard loads with Vercel B&W aesthetic, 4 blocks, and floating chat popup", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/PGPx Student Portal/);

    // Verify 4 action blocks on top
    await expect(page.locator("text=Create New Reminder")).toBeVisible();
    await expect(page.locator("text=Create New Assignment")).toBeVisible();
    await expect(page.locator("text=Create New Link")).toBeVisible();
    await expect(page.locator("text=Create New Party Chat")).toBeVisible();

    // Verify floating anonymous chat trigger button in bottom right
    await expect(page.locator("text=Anonymous Batch Chat")).toBeVisible();
  });

  test("2. Domain-Restricted Login rejects external domains and accepts @iimrohtak.ac.in", async ({ page }) => {
    await page.goto("/login");

    // Attempt login with illegal external domain (e.g. hacker@gmail.com)
    await page.fill('input[type="email"]', "hacker@gmail.com");
    await page.click('button[type="submit"]');

    // Expect access denied error message
    await expect(page.locator("text=Access Denied")).toBeVisible();

    // Now login with valid institute email (@iimrohtak.ac.in)
    await page.fill('input[type="email"]', "rahul.v24@iimrohtak.ac.in");
    await page.click('button[type="submit"]');

    // Expect access granted message
    await expect(page.locator("text=Access Granted")).toBeVisible();
  });

  test("3. Block 1: Create New Reminder publishes date and renders in list below", async ({ page }) => {
    await page.goto("/");

    // Click block 1
    await page.click("button:has-text('Create New Reminder')");
    await expect(page.locator("text=Add Important Date or Deadline")).toBeVisible();

    // Fill reminder form
    await page.fill('input[placeholder*="STRAT-601"]', "Case Study 4 Deadline");
    await page.fill('input[type="date"]', "2026-11-25");
    await page.click("button:has-text('Publish Reminder')");

    // Verify modal closes and item is present in list below
    await expect(page.locator("text=Case Study 4 Deadline").first()).toBeVisible();
  });

  test("4. Block 3: Create New Link publishes resource and renders in list below", async ({ page }) => {
    await page.goto("/");

    // Click block 3
    await page.click("button:has-text('Create New Link')");
    await expect(page.locator("text=Create New Link / Resource")).toBeVisible();

    // Fill link form
    await page.fill('input[placeholder*="Attendance Sheet"]', "HBR Case Studies Drive");
    await page.fill('input[type="url"]', "https://drive.google.com/hbr-cases");
    await page.click("button:has-text('Add Link')");

    // Verify item appears in list below
    await expect(page.locator("text=HBR Case Studies Drive").first()).toBeVisible();
  });

  test("5. Floating Anonymous Chat Popup opens in bottom right and sends text message", async ({ page }) => {
    await page.goto("/");

    // Click floating anonymous chat button in bottom right
    await page.click("button:has-text('Anonymous Batch Chat')");
    await expect(page.locator("text=Posting as:")).toBeVisible();

    // Send a text message
    await page.fill('input[placeholder*="Text anonymously"]', "Hello batch from Playwright!");
    await page.click('form button[type="submit"]');

    // Verify text message appears in stream
    await expect(page.locator("text=Hello batch from Playwright!").first()).toBeVisible();
  });

  test("6. Command Palette (Cmd+K) opens and displays quick actions", async ({ page }) => {
    await page.goto("/");
    // Click search trigger in header by title or text
    await page.click("button[title*='Search']");
    await expect(page.locator("text=Jump To Page")).toBeVisible();
  });
});
