import { test, expect } from "@playwright/test";

test("run sum and restore an edited algorithm only when requested", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Цэс", exact: true }).click();
  await page
    .getByRole("menuitem", { name: "Бодлогын сан", exact: true })
    .click();
  await page.getByRole("button", { name: /Хоёр тооны нийлбэр/ }).click();
  await page.getByLabel("Алхмын хурд").selectOption("10");
  await page.getByRole("button", { name: "Ажиллуулах", exact: true }).click();
  await page.locator("#runtime-input").fill("7");
  await page.locator("#runtime-input").press("Enter");
  await expect(page.locator(".console-input label")).toHaveText("b =");
  await page.locator("#runtime-input").fill("5");
  await page.locator("#runtime-input").press("Enter");
  await expect(page.locator(".log-line.output")).toContainText("12");
  await expect(page.locator(".log-line.success")).toBeVisible();
  await page
    .getByRole("button", { name: "Утга олгох: sum = a + b", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Илэрхийлэл", exact: true })
    .fill("a * b");
  await page.getByRole("button", { name: "Хадгалах", exact: true }).click();
  await page.reload();
  await expect(page.locator(".flow-block")).toHaveCount(0);
  await expect(page.getByLabel("Алгоритмын нэр")).toHaveValue("Миний бодлого");
  await page.getByRole("button", { name: "Файлын цэс", exact: true }).click();
  await page
    .getByRole("button", { name: "Өмнөх ажлыг нээх", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Утга олгох: sum = a * b", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Буцаах", exact: true }),
  ).toBeEnabled();
});
test("examples execute branches and loops; step, add, undo and export work", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Цэс", exact: true }).click();
  await page
    .getByRole("menuitem", { name: "Бодлогын сан", exact: true })
    .click();
  await page.getByRole("button", { name: /1-ээс N хүртэлх нийлбэр/ }).click();
  await page.getByLabel("Алхмын хурд").selectOption("10");
  await page.getByRole("button", { name: "Алхмаар", exact: true }).click();
  await page.locator("#runtime-input").fill("10");
  await page.locator("#runtime-input").press("Enter");
  await expect(page.getByText("Түр зогссон", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Үргэлжлүүлэх", exact: true }).click();
  await expect(page.locator(".log-line.output")).toContainText("55");
  await expect(page.locator(".log-line.success")).toBeVisible();
  await page.getByRole("button", { name: "Цэс", exact: true }).click();
  await page
    .getByRole("menuitem", { name: "Бодлогын сан", exact: true })
    .click();
  await page.getByRole("button", { name: /Тэгш үү, сондгой юу/ }).click();
  await page.getByRole("button", { name: "Ажиллуулах", exact: true }).click();
  await page.locator("#runtime-input").fill("7");
  await page.locator("#runtime-input").press("Enter");
  await expect(page.locator(".log-line.output")).toContainText("Сондгой тоо");
  await expect(page.locator(".log-line.success")).toBeVisible();
  const before = await page.locator(".flow-block").count();
  await page.locator(".palette-item").filter({ hasText: "Гаралт" }).click();
  await page.getByRole("button", { name: "Хадгалах", exact: true }).click();
  await expect(page.locator(".flow-block")).toHaveCount(before + 1);
  await page.getByRole("button", { name: "Буцаах", exact: true }).click();
  await expect(page.locator(".flow-block")).toHaveCount(before);
  await page.getByRole("button", { name: "Дахин хийх", exact: true }).click();
  await expect(page.locator(".flow-block")).toHaveCount(before + 1);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Экспорт", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.flow.json$/);
});
test("desktop and mobile layout fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({ path: "/tmp/flow-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Ажиллуулах", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "/tmp/flow-mobile.png", fullPage: true });
});

test("create a personal problem, edit with modal, cancel, validate, run and export Python", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".flow-block")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Өөрийн бодлого", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Бодлогын нэр", exact: true })
    .fill("Квадратын талбай");
  await page
    .getByRole("textbox", { name: /Бодлогын нөхцөл/ })
    .fill("Талын урт n өгөгдвөл талбайг ол.");
  await page.getByRole("button", { name: "Блок угсарч эхлэх" }).click();
  await expect(page.getByLabel("Нөхцөл", { exact: true })).toHaveValue(
    /Талын урт n/,
  );
  await page.getByRole("button", { name: "Эхний блок нэмэх" }).click();
  await page
    .getByRole("textbox", { name: "Хувьсагчийн нэр", exact: true })
    .fill("n");
  await page.getByRole("button", { name: "Хадгалах", exact: true }).click();
  await page.locator(".palette-item").filter({ hasText: "Гаралт" }).click();
  await page
    .getByRole("textbox", { name: "Илэрхийлэл", exact: true })
    .fill("n *");
  await page.getByRole("button", { name: "Хадгалах", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".form-error")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Илэрхийлэл", exact: true })
    .fill("n * n");
  await page.getByRole("button", { name: "Хадгалах", exact: true }).click();
  await page
    .getByRole("button", { name: "Гаралт: n * n", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Илэрхийлэл", exact: true })
    .fill("n + 1");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Гаралт: n * n", exact: true }),
  ).toBeVisible();
  await page.locator(".palette-item").filter({ hasText: "Нөхцөл" }).click();
  await page.getByRole("button", { name: "Болих", exact: true }).click();
  await expect(page.locator(".flow-block")).toHaveCount(2);
  await page.getByRole("button", { name: "Python", exact: true }).click();
  await expect(page.locator(".code-view")).toContainText("def main():");
  await expect(page.locator(".code-view")).toContainText("print(");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: ".py татах" }).click();
  expect((await downloaded).suggestedFilename()).toBe("Квадратын талбай.py");
  await page.getByLabel("Алхмын хурд").selectOption("10");
  await page.getByRole("button", { name: "Ажиллуулах", exact: true }).click();
  await page.locator("#runtime-input").fill("9");
  await page.locator("#runtime-input").press("Enter");
  await expect(page.locator(".log-line.output")).toContainText("81");
  await page.reload();
  await expect(page.locator(".flow-block")).toHaveCount(0);
  await expect(page.getByLabel("Алгоритмын нэр")).toHaveValue("Миний бодлого");
  await page.getByRole("button", { name: "Файлын цэс", exact: true }).click();
  await page
    .getByRole("button", { name: "Өмнөх ажлыг нээх", exact: true })
    .click();
  await expect(page.getByLabel("Нөхцөл", { exact: true })).toHaveValue(
    /Талын урт n/,
  );
  await expect(page.locator(".flow-block")).toHaveCount(2);
});

test("workspace routes preserve the project and paused execution across navigation", async ({
  page,
}) => {
  await page.goto("/problems");
  await expect(
    page.getByRole("heading", { name: "Бодлогын сан" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Хоёр тооны нийлбэр/ }).click();
  await expect(page).toHaveURL(/\/editor$/);
  await page.getByLabel("Алхмын хурд").selectOption("10");
  await page.getByRole("button", { name: "Алхмаар", exact: true }).click();
  await page.locator("#runtime-input").fill("9");
  await page.locator("#runtime-input").press("Enter");
  await expect(page.getByText("Түр зогссон", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Цэс", exact: true }).click();
  await page.getByRole("menuitem", { name: "Тусламж", exact: true }).click();
  await expect(page).toHaveURL(/\/help$/);
  await expect(
    page.getByRole("heading", { name: "Санаагаа алгоритм болгоё." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Засварлагч руу" }).click();
  await expect(page).toHaveURL(/\/editor$/);
  await expect(page.getByLabel("Алгоритмын нэр")).toHaveValue(
    "Хоёр тооны нийлбэр",
  );
  await expect(page.getByText("Түр зогссон", { exact: true })).toBeVisible();
  await expect(
    page.locator(".variable-row").filter({ hasText: "Number" }),
  ).toContainText("9");
  await page.getByRole("button", { name: "Үргэлжлүүлэх", exact: true }).click();
  await page.locator("#runtime-input").fill("2");
  await page.locator("#runtime-input").press("Enter");
  await expect(page.locator(".log-line.output")).toContainText("11");
  await expect(page.locator(".log-line.success")).toBeVisible();
  await page.getByRole("button", { name: "Буцаах", exact: true }).click();
  await expect(page.locator(".flow-block")).toHaveCount(0);
});

test("startup stays blank with a previously saved problem and does not overwrite it", async ({
  page,
}) => {
  const saved = {
    title: "Өмнөх бодлого",
    description: "Хадгалсан нөхцөл",
    blocks: [
      {
        id: "previous-output",
        kind: "output",
        name: "",
        expression: "42",
        children: [],
        otherwise: [],
      },
    ],
  };
  await page.addInitScript(
    (project) => localStorage.setItem("flow-project", JSON.stringify(project)),
    saved,
  );
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Эхний блок нэмэх" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Файлын цэс", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Өмнөх ажлыг нээх", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".flow-block")).toHaveCount(0);
  await expect(page.getByLabel("Алгоритмын нэр")).toHaveValue("Миний бодлого");
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("flow-project")!),
    ),
  ).toEqual(saved);
});

test("a library problem is judged against its tests", async ({ page }) => {
  await page.goto("/problems");
  await page.getByRole("button", { name: /Хоёр тооны нийлбэр/ }).click();
  await expect(page.locator(".problem-panel")).toContainText("Жишээ 1");
  await page.getByRole("button", { name: "Шалгах", exact: true }).click();
  await expect(page.locator(".log-line.success").last()).toContainText(
    "Бүх тест давлаа (4/4)",
  );
  // Break the solution: now at least one test must fail.
  await page
    .getByRole("button", { name: "Утга олгох: sum = a + b", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Илэрхийлэл", exact: true })
    .fill("a - b");
  await page.getByRole("button", { name: "Хадгалах", exact: true }).click();
  await page.getByRole("button", { name: "Шалгах", exact: true }).click();
  await expect(page.locator(".log-line.error").last()).toContainText(
    "тест давлаа",
  );
  await expect(page.locator(".log-line.error").first()).toContainText("✗");
});
