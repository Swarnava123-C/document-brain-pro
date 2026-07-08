import { test, expect } from "@playwright/test";

// These are smoke tests intended to be run against a local dev server (http://localhost:8080).
// Signup/login use randomised emails; the Cloud project has auto-confirm enabled.

test.describe("IndustrialMind AI — smoke", () => {
  test("landing loads", async ({ page }) => {
    await page.goto("http://localhost:8080/");
    await expect(page).toHaveTitle(/IndustrialMind AI/);
  });

  test("protected routes redirect to /login when signed out", async ({ page }) => {
    await page.goto("http://localhost:8080/dashboard");
    await page.waitForURL(/\/login/);
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });

  test("signup → dashboard → upload → sign out", async ({ page }) => {
    const email = `qa+${Date.now()}@industrialmind.test`;
    await page.goto("http://localhost:8080/signup");
    await page.getByLabel(/first name/i).fill("QA");
    await page.getByLabel(/last name/i).fill("Bot");
    await page.getByLabel(/work email/i).fill(email);
    await page.getByLabel(/^password/i).fill("passw0rd-strong");
    await page.getByRole("button", { name: /create workspace/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.getByRole("main")).toBeVisible();

    // Navigate to Document Intelligence
    await page.getByRole("link", { name: /upload center|document intelligence|quick upload/i }).first().click().catch(() => {});
    await page.goto("http://localhost:8080/upload");
    await expect(page.getByRole("heading", { name: /document intelligence/i })).toBeVisible();

    // Simulate file upload via hidden input
    const buffer = Buffer.from("dummy pdf content");
    await page.setInputFiles('input[type="file"]', { name: "P&ID-Unit3.pdf", mimeType: "application/pdf", buffer });
    await expect(page.getByText(/P&ID-Unit3\.pdf/)).toBeVisible({ timeout: 5_000 });

    // Sign out
    await page.getByRole("button", { name: /account menu/i }).click();
    await page.getByRole("menuitem", { name: /sign out/i }).click();
    await page.waitForURL(/\/login/);
  });

  test("library page renders", async ({ page }) => {
    // Requires an authenticated session; skipped if redirected to login.
    await page.goto("http://localhost:8080/documents");
    if (page.url().includes("/login")) test.skip(true, "requires auth");
    await expect(page.getByRole("heading", { name: /document library/i })).toBeVisible();
  });
});
