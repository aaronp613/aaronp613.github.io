import { test, expect } from "@playwright/test";

// Fails a test if the page logs a JavaScript error.
function trackErrors(page) {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  return errors;
}

test.describe("portfolio", () => {
  test("loads and renders the generated cards", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/");
    const leaks = page.locator("#leaks .article-card");
    expect(await leaks.count()).toBeGreaterThan(20);
    expect(await page.locator("#articles .article-card").count()).toBeGreaterThan(0);
    // The stat is generated from the data file.
    const stat = await page.locator('[data-build="leak-count"]').textContent();
    expect(stat).toBe(`${await leaks.count()}+`);
    expect(errors).toEqual([]);
  });

  test("My Articles has no share buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#articles .share-button-icon")).toHaveCount(0);
  });

  test("leaked product cards expand to show their articles", async ({ page }) => {
    await page.goto("/");
    const card = page.locator("#leaks .article-card").first();
    const face = card.locator(":scope > a");
    await expect(face).toHaveAttribute("aria-expanded", "false");
    await card.scrollIntoViewIfNeeded();
    await face.click();
    await expect(face).toHaveAttribute("aria-expanded", "true");
    await expect(card.locator(".article-sources a").first()).toBeVisible();
    // Only one card is open at a time.
    const second = page.locator("#leaks .article-card").nth(1);
    await second.locator(":scope > a").click();
    await expect(face).toHaveAttribute("aria-expanded", "false");
  });

  test("leaked products are listed newest first", async ({ page }) => {
    await page.goto("/");
    const dates = await page.locator("#leaks .article-card").evaluateAll(cards =>
      cards.map(card => card.querySelector(".article-sources a").getAttribute("href").match(/\/(\d{4}\/\d{2}\/\d{2})\//)[1])
    );
    expect(dates).toEqual([...dates].sort().reverse());
  });

  test("work cards expand with the shared chevron", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator(".work-card .details-toggle").first();
    await toggle.scrollIntoViewIfNeeded();
    await expect(toggle.locator("svg")).toHaveCount(1);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".work-card.expanded .role").first()).toBeVisible();
  });
});

test.describe("mcu tracker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mcu/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator("#list .mcu-card").first()).toBeVisible();
  });

  const remaining = page => page.locator("#stat-time-remaining").textContent();

  test("loads without errors", async ({ page }) => {
    const errors = trackErrors(page);
    await page.reload();
    await expect(page.locator("#list .mcu-card").first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("select, hide, undo and restore", async ({ page }) => {
    const before = await remaining(page);
    await page.locator("#selectModeBtn").click();
    await page.locator("#list .mcu-card").first().click();
    await expect(page.locator("#selectionCount")).toHaveText("1 selected");
    await page.locator("#hideSelectedBtn").click();

    await expect(page.locator("#watchUndoMessage")).toContainText("hidden");
    await expect(page.locator("#hiddenItemsBtn")).toBeVisible();
    expect(await remaining(page)).not.toBe(before);

    await page.locator("#undoWatchBtn").click();
    await expect(page.locator("#hiddenItemsBtn")).toBeHidden();
    expect(await remaining(page)).toBe(before);

    // Hide again, then restore from the Hidden list.
    await page.locator("#list .mcu-card").first().locator(".hide-btn").click();
    await expect(page.locator("#hiddenItemsBtn")).toBeVisible();
    await page.locator("#hiddenItemsBtn").click();
    await page.locator(".hidden-item-restore").first().click();
    await page.locator(".progress-modal-close").click();
    await expect(page.locator("#hiddenItemsBtn")).toBeHidden();
    expect(await remaining(page)).toBe(before);
  });

  test("whole show selects every episode of that show", async ({ page }) => {
    await page.locator("#search").fill("X-Men '97");
    await page.locator("#selectModeBtn").click();
    await page.locator("#list .mcu-card").first().click();
    await page.locator("#selectShowBtn").click();
    const count = await page.evaluate(() => selectedIds.size);
    const total = await page.evaluate(() => fullData.filter(item => item.show === "X-Men '97").length);
    expect(count).toBe(total);
    expect(total).toBeGreaterThan(1);
  });

  test("hidden titles survive export/import and share links", async ({ page }) => {
    await page.locator("#list .mcu-card").first().locator(".hide-btn").click();
    await expect(page.locator("#hiddenItemsBtn")).toBeVisible();

    await page.locator("#exportProgressBtn, #resetProgressBtn").first().waitFor({ state: "attached" });
    const code = await page.evaluate(() => encodeProgressWithDates());
    const share = await page.evaluate(() => encodeProgress());

    // Export code round trip.
    await page.evaluate(() => { localStorage.clear(); });
    await page.reload();
    await expect(page.locator("#hiddenItemsBtn")).toBeHidden();
    expect(await page.evaluate(c => decodeProgressWithDates(c), code)).toBe(true);
    await page.reload();
    await expect(page.locator("#hiddenItemsBtn")).toBeVisible();

    // Share link round trip, plus a legacy code without a hidden half still decodes.
    await page.evaluate(() => { localStorage.clear(); });
    await page.reload();
    expect(await page.evaluate(c => decodeProgress(c), share)).toBe(true);
    await page.reload();
    await expect(page.locator("#hiddenItemsBtn")).toBeVisible();
    const legacy = await page.evaluate(() => {
      const size = Math.ceil(fullData.length / 8);
      return btoa(String.fromCharCode(...new Uint8Array(size)));
    });
    expect(await page.evaluate(c => parseHiddenFromCode(c), legacy)).toBeNull();
  });

  test("next up marks the next title watched", async ({ page }) => {
    const panel = page.locator("#nextUp");
    await expect(panel).toBeVisible();
    const first = await page.locator("#nextUpTitle").textContent();
    await page.locator("#nextUpWatchBtn").click();
    await expect(page.locator("#nextUpTitle")).not.toHaveText(first);
  });

  test("progress by studio lists studios", async ({ page }) => {
    await page.locator("#studioProgress > summary").click();
    expect(await page.locator(".studio-row").count()).toBeGreaterThan(1);
  });
});
