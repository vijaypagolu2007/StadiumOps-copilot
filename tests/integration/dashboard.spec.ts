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
  await page.locator("#venueSelect").waitFor({ state: "attached" });
  await page.keyboard.press("Tab");
  await expect(page.locator("#venueSelect")).toBeFocused();
});

test("operator can generate and review a safe plan", async ({ page }) => {
  await page.route("**/api/plan", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        traceId: "test-plan",
        source: "openai",
        reason: null,
        summary: "East concourse operations need a staged response.",
        fanMessage: "Please follow staff guidance near East Concourse.",
        actions: [
          {
            title: "Stage east concourse staff",
            dispatch: "Deploy a supervisor before publishing a route update.",
            priority: "high",
            channel: "radio",
            zoneId: "east",
          },
        ],
      }),
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Generate plan" }).click();
  await expect(page.getByText("Recommended actions")).toBeVisible();
  await expect(
    page
      .locator("#actionBoard")
      .getByText("Open overflow lanes at East Gate", { exact: false }),
  ).toBeVisible();
});

test("dashboard passes basic axe scan", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
