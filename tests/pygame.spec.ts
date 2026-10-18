import { test, expect, type Page } from "@playwright/test";
import { PYGAME_EXAMPLE, PYGAME_CHANNEL, PYGAME_LOAD_TIMEOUT } from "../lib/pygame";

const editor = (page: Page) =>
  page.getByRole("textbox", { name: "Pygame Python код" });
const run = (page: Page) =>
  page.getByRole("button", { name: "Ажиллуулах", exact: true });
const consoleOutput = (page: Page) => page.getByLabel("Pygame консол");

test("pygame editor, download, navigation, modal and responsive layout", async ({
  page,
}) => {
  await page.route("https://pygame-web.github.io/**", (route) =>
    route.fulfill({ contentType: "text/javascript", body: "" }),
  );
  await page.goto("/pygame");
  await expect(editor(page)).toHaveValue(PYGAME_EXAMPLE);
  await editor(page).fill("print('Сайн уу')");
  await editor(page).press("Home");
  await editor(page).press("Tab");
  await expect(editor(page)).toHaveValue("    print('Сайн уу')");
  await editor(page).press("Shift+Tab");
  await expect(editor(page)).not.toBeFocused();
  await editor(page).fill("print('Миний код')");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: ".py татах" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("main.py");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).toString("utf8")).toBe("print('Миний код')");

  await run(page).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("iframe")).toHaveAttribute(
    "sandbox",
    "allow-scripts",
  );
  // Matching data from the wrong window must never be accepted.
  await page.evaluate((channel) => {
    const runId = document.querySelector("iframe")!.src.split("#")[1];
    window.postMessage(
      { channel, runId, type: "output", text: "spoofed" },
      "*",
    );
  }, PYGAME_CHANNEL);
  await expect(consoleOutput(page)).not.toContainText("spoofed");
  await page.getByRole("button", { name: "Зогсоох", exact: true }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator(".pygame-status")).toHaveText("Зогсоосон");
  await page.getByRole("button", { name: "Дахин ажиллуулах" }).click();
  await expect(page.locator("iframe")).toHaveCount(1);
  await page.getByRole("button", { name: "Хаах", exact: true }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(editor(page)).toHaveValue("print('Миний код')");
  await expect(run(page)).toBeFocused();

  await page.getByRole("button", { name: "Цэс", exact: true }).click();
  await page.getByRole("menuitem", { name: "Тусламж", exact: true }).click();
  await expect(page).toHaveURL(/\/help$/);
  await expect(
    page.getByRole("button", { name: "Цэс", exact: true }),
  ).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Цэс", exact: true }).click();
  await page.getByRole("menuitem", { name: "Pygame", exact: true }).click();
  await expect(editor(page)).toHaveValue("print('Миний код')");
  await editor(page).fill("changed");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("flow-pygame-draft-v1"))).toBe("changed");
  await page.reload();
  await expect(editor(page)).toHaveValue("changed");
  await editor(page).fill("");
  await expect(run(page)).toBeDisabled();
  await page.getByRole("button", { name: "Жишээг сэргээх" }).click();
  await expect(editor(page)).toHaveValue(PYGAME_EXAMPLE);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(run(page)).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await run(page).click();
  const bounds = await page.getByRole("dialog").boundingBox();
  expect(bounds!.width).toBeLessThanOrEqual(390);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("pygame reports a failed runtime download and can retry", async ({
  page,
}) => {
  await page.route("https://pygame-web.github.io/**", (route) => route.abort());
  await page.goto("/pygame");
  await run(page).click();
  await expect(page.locator(".pygame-status")).toHaveText("Алдаа гарлаа");
  await expect(consoleOutput(page)).toContainText("Интернет холболтоо шалгаад");
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.getByRole("button", { name: "Дахин ажиллуулах" }).click();
  await expect(page.locator(".pygame-status")).toHaveText("Алдаа гарлаа");
  await expect(consoleOutput(page)).toContainText("Интернет холболтоо шалгаад");
});

test("slow runtime stays alive, can keep waiting, and can be cancelled", async ({ page }) => {
  await page.route("https://pygame-web.github.io/**", route => route.fulfill({ contentType: "text/javascript", body: "" }));
  await page.clock.install();
  await page.goto("/pygame");
  await run(page).click();
  const src = await page.locator("iframe").getAttribute("src");
  await page.clock.fastForward(60_001);
  await expect(page.locator("iframe")).toHaveAttribute("src", src!);
  await page.clock.fastForward(PYGAME_LOAD_TIMEOUT);
  await expect(page.getByRole("button", { name: "Үргэлжлүүлэн хүлээх" })).toBeVisible();
  await page.getByRole("button", { name: "Үргэлжлүүлэн хүлээх" }).click();
  await expect(page.locator("iframe")).toHaveAttribute("src", src!);
  await page.clock.fastForward(PYGAME_LOAD_TIMEOUT);
  await page.getByRole("button", { name: "Цуцлах", exact: true }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator(".pygame-status")).toHaveText("Зогсоосон");
});

test("Python editor completes, highlights, diagnoses and restores drafts", async ({ page }) => {
  await page.goto("/pygame");
  await editor(page).fill("pri");
  await expect(page.getByRole("option", { name: /print/ })).toBeVisible();
  await editor(page).press("Enter");
  await expect(editor(page)).toHaveValue("print()");
  await editor(page).fill("pygame.draw.ci");
  await editor(page).press("Tab");
  await expect(editor(page)).toHaveValue("pygame.draw.circle()");
  await editor(page).fill("if True\n    print('hello'");
  await expect(page.locator("#python-diagnostics")).toContainText("Мөр 1");
  await expect(page.locator("#python-diagnostics")).toContainText("хаалт хаагдаагүй");
  await editor(page).fill("print('hello') # comment");
  await expect(page.locator(".py-string")).toHaveText("'hello'");
  await expect(page.locator(".py-comment")).toHaveText("# comment");
  await expect(page.locator("#python-diagnostics button")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("flow-pygame-draft-v1"))).toBe("print('hello') # comment");
  await page.reload();
  await expect(editor(page)).toHaveValue("print('hello') # comment");
  await editor(page).fill("");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("flow-pygame-draft-v1"))).toBe("");
  await page.reload();
  await expect(editor(page)).toHaveValue("");
});

test.describe("real Pygame runtime", () => {
  test.skip(
    process.env.PYGAME_RUNTIME_TESTS !== "1",
    "Set PYGAME_RUNTIME_TESTS=1 to download and exercise the real WASM runtime.",
  );
  test.setTimeout(180_000);

  test("renders moving pixels, accepts keyboard/mouse, stops and restarts", async ({
    page,
  }) => {
    await page.goto("/pygame");
    await run(page).click();
    await expect(page.locator(".pygame-status")).toHaveText("Ажиллаж байна", {
      timeout: 65_000,
    });
    await expect(consoleOutput(page)).toContainText("Сумтай товчоор", {
      timeout: 10_000,
    });
    const canvas = page.frameLocator("iframe").locator("#canvas");
    const pixels = () =>
      canvas.evaluate((element) => {
        const canvas = element as HTMLCanvasElement;
        return Array.from(
          canvas
            .getContext("2d")!
            .getImageData(0, 0, canvas.width, canvas.height).data,
        ).reduce(
          (sum, value, i) => (sum + value * (i % 97)) % 1_000_000_007,
          0,
        );
      });
    const first = await pixels();
    await expect.poll(pixels).not.toBe(first);
    await canvas.click({ position: { x: 120, y: 100 } });
    await expect(consoleOutput(page)).toContainText("Хулгана:");
    await canvas.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(run(page)).toBeFocused();

    await editor(page).fill(`import asyncio, pygame
pygame.init()
screen = pygame.display.set_mode((100, 100))
async def main():
    while True:
        for event in pygame.event.get():
            if event.type == pygame.KEYDOWN:
                print("KEY", event.key)
        screen.fill((0, 220, 100))
        pygame.display.flip()
        await asyncio.sleep(0)
asyncio.run(main())`);
    await run(page).click();
    await expect(page.locator(".pygame-status")).toHaveText("Ажиллаж байна", {
      timeout: 65_000,
    });
    await canvas.press("ArrowRight");
    await expect(consoleOutput(page)).toContainText("KEY");
    await expect
      .poll(() =>
        canvas.evaluate((c) =>
          Array.from(
            (c as HTMLCanvasElement)
              .getContext("2d")!
              .getImageData(50, 50, 1, 1).data,
          ),
        ),
      )
      .toEqual([0, 220, 100, 255]);
    await page.getByRole("button", { name: "Зогсоох", exact: true }).click();
    await expect(page.locator("iframe")).toHaveCount(0);
    await page.getByRole("button", { name: "Дахин ажиллуулах" }).click();
    await expect(page.locator(".pygame-status")).toHaveText("Ажиллаж байна", {
      timeout: 65_000,
    });
    await expect(consoleOutput(page)).not.toContainText("KEY");
    await page.goto("/help");
    await expect(page.locator("iframe")).toHaveCount(0);
  });

  test("reports completion, syntax errors and asynchronous tracebacks", async ({
    page,
  }) => {
    await page.goto("/pygame");
    for (const scenario of [
      {
        code: "print('Сайн уу </script> 🌟')",
        status: "Ажиллаж дууслаа",
        output: "Сайн уу </script> 🌟",
      },
      {
        code: "import asyncio\nasync def child():\n    raise ValueError('handled')\nasync def main():\n    task = asyncio.create_task(child())\n    try:\n        await task\n    except ValueError:\n        print('caught correctly')\nasyncio.run(main())",
        status: "Ажиллаж дууслаа",
        output: "caught correctly",
      },
      {
        code: "import asyncio, sys\nasync def main():\n    await asyncio.sleep(0)\n    print('normal exit')\n    sys.exit(0)\nasyncio.run(main())",
        status: "Ажиллаж дууслаа",
        output: "normal exit",
      },
      { code: "print('bad'", status: "Алдаа гарлаа", output: "SyntaxError" },
      {
        code: "raise ValueError('sync error')",
        status: "Алдаа гарлаа",
        output: "ValueError: sync error",
      },
      {
        code: "import asyncio\nasync def main():\n    await asyncio.sleep(0)\n    raise ValueError('async error')\nasyncio.run(main())",
        status: "Алдаа гарлаа",
        output: "ValueError: async error",
      },
    ]) {
      await editor(page).fill(scenario.code);
      await run(page).click();
      await expect(page.locator(".pygame-status")).toHaveText(scenario.status, {
        timeout: 65_000,
      });
      await expect(consoleOutput(page)).toContainText(scenario.output);
      if (scenario.status === "Алдаа гарлаа")
        await expect(consoleOutput(page)).toContainText('File "main.py", line');
      await page.getByRole("button", { name: "Хаах", exact: true }).click();
    }
  });
});

