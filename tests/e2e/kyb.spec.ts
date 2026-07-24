import {
  expect,
  test as base,
  type Page,
} from "@playwright/test";

const localOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3210",
  "http://127.0.0.1:8788",
]);

const test = base.extend<{ clientHealth: void }>({
  clientHealth: [
    async ({ page }, use) => {
      const failures: string[] = [];

      page.on("pageerror", (error) => {
        failures.push(`page error: ${error.message}`);
      });
      page.on("console", (message) => {
        if (message.type() === "error") {
          failures.push(`console error: ${message.text()}`);
        }
      });
      page.on("requestfailed", (request) => {
        const origin = new URL(request.url()).origin;
        const errorText = request.failure()?.errorText ?? "unknown error";
        const isCancelledNextPrefetch =
          errorText === "net::ERR_ABORTED" &&
          request.url().includes("_rsc=");

        if (localOrigins.has(origin) && !isCancelledNextPrefetch) {
          failures.push(
            `request failed: ${request.method()} ${request.url()} (${errorText})`,
          );
        }
      });
      page.on("response", (response) => {
        const origin = new URL(response.url()).origin;
        if (localOrigins.has(origin) && response.status() >= 400) {
          failures.push(
            `response failed: ${response.status()} ${response.url()}`,
          );
        }
      });

      await use();

      expect(failures, "browser and first-party request errors").toEqual([]);
    },
    { auto: true },
  ],
});

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
}

test("@smoke completes the evidence-first voter journey", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Know who you’re voting for." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Find my ballot" }).click();
  await expect(
    page.getByText("Enter a street address or ZIP code to continue."),
  ).toBeVisible();

  await page.getByLabel("Home address or ZIP code").fill("11557");
  await page.getByRole("button", { name: "Find my ballot" }).click();
  await expect(page).toHaveURL(/\/ballot\?zip=11557$/u);

  await expect(
    page.getByRole("heading", { name: "Your 2026 ballot" }),
  ).toBeVisible();
  await expect(
    page.getByText("ZIP 11557 · Hewlett, Nassau County, New York"),
  ).toBeVisible();
  await expect(page.getByText("2026 General Election")).toBeVisible();
  await expect(page.getByText("Election Day · November 3, 2026")).toBeVisible();
  await expect(
    page.getByText("Early voting: October 24 – November 1"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "U.S. Representative · NY-04",
    }),
  ).toBeVisible();

  for (const candidate of [
    "Laura A. Gillen",
    "Jeanine C. Driscoll",
    "Blay Tarnoff",
  ]) {
    await expect(page.getByText(candidate, { exact: true }).first()).toBeVisible();
  }
  for (const coverage of ["90% sourced", "79% sourced", "29% sourced"]) {
    await expect(page.getByText(coverage, { exact: true })).toBeVisible();
  }

  await page.getByRole("link", { name: "Compare all candidates" }).click();
  await expect(page).toHaveURL(/\/race\/ny-04$/u);
  await expect(
    page.getByRole("heading", {
      name: "Compare candidates for U.S. Representative",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Agenda and stated priorities" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Campaign-finance snapshots" }),
  ).toBeVisible();
  for (const amount of [
    "$5,097,222",
    "$1,276,602",
    "$3,843,824",
    "$264,824",
    "$38,550",
    "$226,274",
  ]) {
    await expect(page.getByText(amount, { exact: true })).toBeVisible();
  }
  const tarnoffFinance = page
    .getByRole("region", { name: "Campaign-finance snapshots" })
    .locator('[data-slot="card"]')
    .filter({ hasText: "Blay Tarnoff" });
  await expect(
    tarnoffFinance.getByText("No comparable filing captured", {
      exact: true,
    }),
  ).toHaveCount(2);

  await page
    .getByRole("button", { name: "How much has each campaign raised?" })
    .click();
  await expect(
    page.getByText("Campaign-finance snapshot", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("FEC · Gillen")).toBeVisible();
  await expect(page.getByText("FEC · Driscoll")).toBeVisible();

  const gillenCard = page
    .locator('[data-slot="card"]')
    .filter({ hasText: "Laura A. Gillen" })
    .first();
  await gillenCard.getByRole("link", { name: "Open full profile" }).click();
  await expect(page).toHaveURL(/\/candidate\/laura-gillen$/u);
  await expect(
    page.getByRole("heading", { name: "Laura A. Gillen" }),
  ).toBeVisible();
  await expect(page.getByText("Ballot line: DEM")).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Profile source coverage" }),
  ).toHaveAttribute("value", "100");
});

test("keeps missing evidence and unavailable profiles explicit", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");

  await page.goto("/candidate/blay-tarnoff");

  await expect(
    page.getByRole("heading", { name: "Blay Tarnoff" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "No candidate-specific 2026 platform was captured from a primary source in this pilot review.",
    ),
  ).toBeVisible();
  await expect(page.getByText("Evidence not found").first()).toBeVisible();
  await expect(page.getByText("Not available").first()).toBeVisible();

  await page.goto("/candidate/not-a-candidate");
  await expect(page.getByText("Candidate profile not found")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Return to comparison" }),
  ).toBeVisible();
});

test("shows deterministic research status and filters", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");

  await page.clock.setFixedTime(new Date("2026-07-24T08:00:00-04:00"));
  await page.goto("/research");

  await expect(
    page.getByRole("heading", {
      name: "Every update passes through evidence review.",
    }),
  ).toBeVisible();
  const summary = page.getByRole("region", {
    name: "Research status summary",
  });
  for (const [label, value] of [
    ["Tracked sources", "11"],
    ["Published claims", "19"],
    ["Changes queued", "0"],
    ["Refresh overdue", "0"],
  ]) {
    const card = summary.locator('[data-slot="card"]').filter({ hasText: label });
    await expect(card.getByText(value, { exact: true })).toBeVisible();
  }

  await page.getByRole("button", { name: "Needs refresh" }).click();
  await expect(
    page.getByRole("button", { name: "Needs refresh" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("table tbody tr")).toHaveCount(2);

  await page.getByRole("button", { name: "Primary only" }).click();
  await expect(page.locator("table tbody tr")).toHaveCount(7);
  await expect(page.getByText("Baseline pending")).toHaveCount(7);
});

test("mobile navigation covers every primary route without overflow", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-mobile");

  await page.goto("/");
  const mobileNavigation = page.getByRole("navigation", {
    name: "Mobile navigation",
  });
  await expect(mobileNavigation).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }),
  ).toBeHidden();
  await expect(page.getByRole("link", { name: "View ballot" })).toBeVisible();

  for (const [name, path] of [
    ["Ballot", "/ballot?zip=11557"],
    ["Compare", "/race/ny-04"],
    ["Research", "/research"],
    ["Home", "/"],
  ]) {
    await mobileNavigation.getByRole("link", { name }).click();
    await expect(page).toHaveURL(new RegExp(`${path.replace("?", "\\?")}$`, "u"));
    await expectNoHorizontalOverflow(page);
  }

  await mobileNavigation.getByRole("link", { name: "Research" }).click();
  await expect(page.locator("table")).toBeHidden();
  await expect(
    page.getByRole("link", { name: "2026 General Election Candidate List" }),
  ).toBeVisible();
});
