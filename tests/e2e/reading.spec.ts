import { expect, test } from "@playwright/test";

const publication = {
  id: "b3547a37-3c4f-40c6-ad46-5d1d79f9b9b6",
  title: "通胀数据公布后，市场重新评估利率路径与科技公司的投资计划",
  sourceId: "测试来源",
  url: "https://example.com/news/1",
  publishedAt: "2026-10-01T08:00:00.000Z",
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/health", (route) =>
    route.fulfill({ json: { status: "ok", service: "news-draft-api" } }),
  );
});

test("shows loading before an empty response", async ({ page }) => {
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/publications", async (route) => {
    await ready;
    await route.fulfill({ json: { items: [] } });
  });
  try {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "正在获取内容" })).toBeVisible();
    await expect(page.getByRole("status")).toHaveAttribute("aria-busy", "true");
  } finally {
    release();
  }
  await expect(page.getByRole("heading", { name: "还没有内容" })).toBeVisible();
  await expect(page.getByText("已连接", { exact: true })).toBeVisible();
});

test("renders publications and keeps the layout within the viewport", async ({ page }, info) => {
  await page.route("**/api/publications", (route) =>
    route.fulfill({ json: { items: [publication] } }),
  );
  await page.goto("/");
  await expect(page.getByRole("heading", { name: publication.title })).toBeVisible();
  await expect(page.locator("article time")).toHaveAttribute("datetime", publication.publishedAt);
  const link = page.getByRole("link", { name: "查看原文" });
  await expect(link).toHaveAttribute("href", publication.url);
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).not.toHaveAttribute("type");
  await expect(page.locator("article button")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: info.outputPath("reading.png"), fullPage: true });
});

test("lets the reader retry after a failed request", async ({ page }) => {
  let available = false;
  let release!: () => void;
  const responseReady = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/publications", async (route) => {
    if (available) {
      await responseReady;
      await route.fulfill({ json: { items: [publication] } });
    } else {
      await route.fulfill({ status: 503, json: { error: "API_UNAVAILABLE" } });
    }
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "暂时无法获取内容" })).toBeVisible();
  const retry = page.getByRole("button", { name: "重新获取" });
  await expect(retry).toBeEnabled();
  await expect(retry).toHaveAttribute("type", "button");
  await expect(retry).toHaveCSS("min-height", "44px");
  await expect(retry).toHaveCSS("padding-left", "18px");
  await retry.focus();
  await expect(retry).toHaveCSS("outline-style", "solid");
  await page.screenshot({ path: test.info().outputPath("retry.png"), fullPage: true });
  available = true;
  try {
    await retry.press("Enter");
    await expect(page.getByRole("heading", { name: "正在获取内容" })).toBeVisible();
    await expect(page.getByRole("status")).toHaveAttribute("aria-busy", "true");
    await expect(retry).not.toBeVisible();
  } finally {
    release();
  }
  await expect(page.getByRole("heading", { name: publication.title })).toBeVisible();
  await expect(retry).not.toBeVisible();
});

test("serves the PWA manifest and installation icons", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/");
  for (const icon of manifest.icons) {
    const image = await request.get(icon.src);
    expect(image.ok()).toBe(true);
    expect(image.headers()["content-type"]).toContain("image/png");
  }
});
