import { test, expect } from "@playwright/test";

// Hits the real dev server and the real data/app.db file (no test-DB isolation
// exists for Playwright yet), so each run registers a fresh, timestamped email
// to avoid a 409 conflict against accounts created by earlier runs.
test("register, see logged-in header, log out, log back in", async ({
  page,
}) => {
  const email = `test-${Date.now()}@example.com`;
  const password = "password123";

  await page.goto("/");
  await page.getByRole("button", { name: "Нэвтрэх", exact: true }).click();
  await page
    .getByRole("button", { name: "Бүртгэл үүсгэх", exact: true })
    .click();
  await page.getByLabel("Имэйл").fill(email);
  await page.getByLabel("Нууц үг").fill(password);
  await page
    .locator(".auth-form")
    .getByRole("button", { name: "Бүртгүүлэх", exact: true })
    .click();
  await expect(page.getByTitle(email)).toBeVisible();

  await page.getByRole("button", { name: "Гарах", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Нэвтрэх", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Нэвтрэх", exact: true }).click();
  await page.getByLabel("Имэйл").fill(email);
  await page.getByLabel("Нууц үг").fill(password);
  await page
    .locator(".auth-form")
    .getByRole("button", { name: "Нэвтрэх", exact: true })
    .click();
  await expect(page.getByTitle(email)).toBeVisible();
});
