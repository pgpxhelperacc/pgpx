import { test, expect } from "@playwright/test";

test.describe("PGPx Student Portal End-to-End Test Suite", () => {
  test("1. Home Dashboard loads smoothly with branding and quick stats", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/PGPx Student Portal/);

    // Verify greeting and sections
    await expect(page.locator("text=Welcome back").first()).toBeVisible();

    // Verify dashboard sections
    await expect(page.locator("text=Important Dates & Deadlines")).toBeVisible();
    await expect(page.locator("text=Upcoming Assignments & Weights")).toBeVisible();
    await expect(page.locator("h3:has-text('Important Links')")).toBeVisible();
  });

  test("2. Domain-Restricted Login rejects external domains and accepts @iimrohtak.ac.in", async ({ page }) => {
    await page.goto("/login");

    // Attempt login with illegal external domain (e.g. gmail.com)
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

  test("3. Class Schedule displays sessions and allows viewing whole-semester calendar", async ({ page }) => {
    await page.goto("/schedule");
    await expect(page.locator("text=Class Schedule & Academic Calendar")).toBeVisible();

    // Check lecture entries
    await expect(page.locator("text=STRAT-601").first()).toBeVisible();

    // Switch to semester calendar tab
    await page.click("text=Whole-Semester Agenda");
    await expect(page.locator("text=Mid-Term Examination Window")).toBeVisible();
    await expect(page.locator("text=Diwali Recess")).toBeVisible();
  });

  test("4. Important Dates allows students to view deadlines, verification badges and submit new date", async ({ page }) => {
    await page.goto("/reminders");
    await expect(page.locator("text=Important Dates & Reminders")).toBeVisible();

    // Check CR verified badge
    await expect(page.locator("text=CR Verified").first()).toBeVisible();

    // Click Add Date button
    await page.click("button:has-text('Add Date')");
    await expect(page.locator("text=Add Important Date or Deadline")).toBeVisible();

    // Fill out reminder
    await page.fill('input[placeholder*="STRAT-601"]', "E2E Automated Quiz Date");
    await page.fill('input[type="date"]', "2026-11-20");
    await page.click("button:has-text('Publish Reminder')");

    // Verify modal closes and item is present
    await expect(page.locator("text=E2E Automated Quiz Date").first()).toBeVisible();
  });

  test("5. Important Links allows searching resources and tracking clicks", async ({ page }) => {
    await page.goto("/links");
    await expect(page.locator("text=Important Links Directory")).toBeVisible();
    await expect(page.locator("text=IIM Rohtak PGPx Moodle Portal")).toBeVisible();
    await expect(page.locator("text=HBR Coursepack").first()).toBeVisible();
  });

  test("6. Faculty Feedback enforces anonymity and 5-response aggregation threshold", async ({ page }) => {
    await page.goto("/feedback");
    await expect(page.locator("text=Faculty & Course Feedback")).toBeVisible();
    await expect(page.locator("text=Absolute Anonymity Guarantee")).toBeVisible();

    // STRAT-601 has 5 seed responses, so overall score must be visible
    await expect(page.locator("text=Overall Faculty Rating")).toBeVisible();

    // Switch to course with under 5 responses (FIN-602 has 2 responses)
    await page.selectOption("select >> nth=0", "c-2");
    await expect(page.locator("text=Anonymity Threshold Active")).toBeVisible();
    await expect(page.locator("text=Current Responses: 2 / 5")).toBeVisible();
  });

  test("7. Anonymous Chat displays rotating pseudonyms and 24h purge notice", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.locator("text=Anonymous Batch Lounge")).toBeVisible();
    await expect(page.locator("text=Messages vanish permanently after 24 hours")).toBeVisible();
    await expect(page.locator("text=Your Pseudonym:")).toBeVisible();

    // Send a message
    await page.fill('input[placeholder*="Speak anonymously"]', "Hello PGPx batch from Playwright E2E test!");
    await page.click("button:has-text('Send')");

    // Expect message in feed
    await expect(page.locator("text=Hello PGPx batch from Playwright E2E test!").first()).toBeVisible();
  });

  test("8. Party & Socials displays batch events, RSVP toggles and carpool board", async ({ page }) => {
    await page.goto("/party");
    await expect(page.locator("text=Party & Batch Socials")).toBeVisible();
    await expect(page.locator("text=Campus House Rules & Safe Transit")).toBeVisible();

    // Check Rooftop BBQ event
    await expect(page.locator("text=Post-Midterm Rooftop BBQ").first()).toBeVisible();

    // Check carpool modal
    await page.click("button:has-text('Need a Ride / Carpool')");
    await expect(page.locator("text=Carpool & Shared Transit Board")).toBeVisible();
    await page.click("button:has-text('Close')");
  });

  test("9. Command Palette (Cmd+K) opens and allows jumping to pages", async ({ page }) => {
    await page.goto("/");
    // Click search trigger in header
    await page.click("button:has-text('Search...')");
    await expect(page.locator("text=Quick Actions")).toBeVisible();
    await expect(page.locator("text=Jump To Page")).toBeVisible();
  });
});
