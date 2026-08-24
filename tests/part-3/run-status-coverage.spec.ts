import { test, expect } from '@playwright/test';

/**
 * Run-status coverage.
 *
 * TestDino's run detail page offers a status filter for every outcome Playwright
 * can report, but the rest of this suite only ever produces `passed` and
 * `failed` — so `Skipped`, `Flaky` and `Timed out` are selectable filters that
 * match zero test cases. Each test below deliberately produces one of those
 * outcomes so the filters have something to show.
 *
 * `interrupted` cannot be produced from inside a spec (the runner has to abort
 * the run), so it lives in tests/part-3/interrupted/ and has its own npm script.
 */
test.describe('Run status coverage', { tag: ['@status-coverage'] }, () => {

  // ---------------------------------------------------------------- skipped
  test.skip('Skipped: unconditionally skipped case', {
    tag: ['@skipped', '@status-coverage'],
    annotation: [{ type: 'reason', description: 'Static skip — fills the Skipped filter' }],
  }, async ({ page }) => {
    await page.goto('/');
  });

  test('Skipped: skipped at runtime by an environment condition', {
    tag: ['@skipped', '@conditional', '@status-coverage'],
  }, async ({ page }) => {
    // Runtime skip: the case starts, then bails out before doing any work.
    test.skip(process.env.RUN_LEGACY_CHECKOUT !== '1', 'Legacy checkout flow is disabled');

    await page.goto('/');
    await expect(page).toHaveURL(/storedemo/);
  });

  // ------------------------------------------------------------------ fixme
  test.fixme('Fixme: known broken case awaiting a fix', {
    tag: ['@fixme', '@status-coverage'],
    annotation: [{ type: 'fixme', description: 'Cart badge does not reset after removing the last item' }],
  }, async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('cart-badge')).toHaveText('0');
  });

  // -------------------------------------------------------- expected failure
  test('Expected failure: case marked test.fail() that does fail', {
    tag: ['@expected-failure', '@status-coverage'],
  }, async ({ page }) => {
    // Documents a known product bug: the assertion below is expected to fail,
    // and Playwright reports the case as an expected failure rather than a red.
    test.fail();

    await page.goto('/');
    await expect(page).toHaveTitle('This title does not exist on the storefront');
  });

  // --------------------------------------------------------------- timed out
  test('Timed out: case exceeds its own timeout while the API hangs', {
    tag: ['@timeout', '@status-coverage'],
  }, async ({ page }) => {
    test.setTimeout(5_000);

    // The products call never resolves inside the 5s budget, so the navigation
    // below is still pending when the test timeout fires.
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 30_000));
      await route.continue();
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toBeVisible();
  });
});

// ---------------------------------------------------------------------- flaky
// `retries` is 0 in playwright.config.ts, and a case can only be reported flaky
// if it is retried — so this block opts itself in.
test.describe('Run status coverage - flaky', {
  tag: ['@status-coverage', '@flaky'],
}, () => {
  test.describe.configure({ retries: 2 });

  test('Flaky: fails on the first attempt and passes on retry', {
    tag: ['@flaky', '@status-coverage'],
  }, async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page).toHaveURL(/storedemo/);

    // Stands in for a genuinely unstable condition (a race, a cold cache): the
    // first attempt always fails, any retry passes, which is exactly the
    // fail-then-pass shape TestDino classifies as flaky.
    expect(
      testInfo.retry,
      'simulated instability: first attempt fails, retry succeeds',
    ).toBeGreaterThan(0);

    await expect(page.locator('body')).toBeVisible();
  });
});
