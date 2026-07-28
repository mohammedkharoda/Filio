import { test, expect } from "@playwright/test";

test.describe("Filio happy path", () => {
  test("landing → eligibility → wizard → review → download", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /your itr, finally made clear/i })).toBeVisible();
    // The core trust promise is visible on the landing page.
    await expect(page.getByText(/never leaves your device/i).first()).toBeVisible();

    await page.getByRole("link", { name: /find your form/i }).first().click();

    // Eligibility: defaults are eligible.
    await expect(page.getByRole("heading", { name: /which itr fits you/i })).toBeVisible();
    await page.getByRole("button", { name: /prepare itr-1/i }).click();
    await page.waitForURL(/\/wizard/);

    // Personal step
    await expect(page.getByRole("heading", { name: /about you/i })).toBeVisible();
    await page.locator("#pan").fill("ABCDE1234F");
    await page.locator("#fullName").fill("Asha Kumar");
    await page.getByText("Under 60", { exact: true }).click();
    // Confirm residency (the only checkbox on this step).
    await page.getByRole("checkbox").first().click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();

    // Income step
    await expect(page.getByRole("heading", { name: /your income/i })).toBeVisible();
    await page.locator("#grossSalary").fill("1275000");
    await page.locator("#tdsOnSalary").fill("30000");
    await page.getByRole("button", { name: "Continue", exact: true }).click();

    // Other income
    await expect(page.getByRole("heading", { name: /other income/i })).toBeVisible();
    await page.locator("#savingsInterest").fill("8000");
    await page.getByRole("button", { name: "Continue", exact: true }).click();

    // Deductions
    await expect(page.getByRole("heading", { name: /^Deductions/i })).toBeVisible();
    await page.getByRole("button", { name: "Continue", exact: true }).click();

    // Regime
    await expect(page.getByRole("heading", { name: /choose your regime/i })).toBeVisible();
    await page.getByRole("button", { name: /review my answers/i }).click();
    await page.waitForURL(/\/review/);

    // Review
    await expect(page.getByRole("heading", { name: /review your answers/i })).toBeVisible();
    await page.getByRole("button", { name: /get my summary/i }).click();
    await page.waitForURL(/\/download/);

    // Download
    await expect(page.getByRole("heading", { name: /your itr-1 summary/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /field-mapping sheet/i })).toBeVisible();
    // The mapping sheet shows the PAN we entered.
    await expect(page.getByText("ABCDE1234F").first()).toBeVisible();
  });

  test("live tax panel reflects the new-regime rebate", async ({ page }) => {
    await page.goto("/eligibility");
    await page.getByRole("button", { name: /prepare itr-1/i }).click();
    await page.waitForURL(/\/wizard/);
    await page.getByRole("button", { name: "Continue", exact: true }).click(); // skip personal
    await expect(page.getByRole("heading", { name: /your income/i })).toBeVisible();
    await page.locator("#grossSalary").fill("1275000"); // taxable 12L after 75k SD → tax 0
    await expect(page.getByText("Old vs new regime")).toBeVisible();
    await expect(page.getByText(/new regime saves/i)).toBeVisible();
  });

  test("business income routes away from ITR-1", async ({ page }) => {
    await page.goto("/eligibility");
    // "Do you have any income from a business or profession?" → Yes
    const businessCard = page
      .locator("div")
      .filter({ hasText: /income from a business or profession/i })
      .last();
    await businessCard.getByRole("radio", { name: "Yes" }).click();
    await expect(page.getByText(/itr-1 doesn't cover/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /prepare itr-3/i })).toBeVisible();
  });
});
