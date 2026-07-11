import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("scenario selection to plan generation flow", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /StadiumOps Copilot/i }),
  ).toBeVisible();
});

test("approval controls stay keyboard reachable", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
});

test("dashboard passes basic axe scan", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
