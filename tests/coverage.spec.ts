import { test, expect } from './support/test';

/**
 * Code-coverage specs.
 *
 * These run only under the `coverage` project, whose baseURL points at an
 * Istanbul-instrumented build of the store (COVERAGE_BASE_URL). They import the
 * TestDino fixture from ./support/test — that fixture is what reads
 * `window.__coverage__` after each test and attaches it for the reporter.
 *
 * Run with: npm run test:coverage
 */

test.describe('Storefront code coverage', { tag: ['@coverage'] }, () => {
  test('instrumented build exposes window.__coverage__', {
    tag: ['@coverage', '@coverage-low', '@coverage-mid', '@coverage-high'],
    annotation: [
      { type: 'testdino:priority', description: 'critical' },
      { type: 'testdino:feature', description: 'Code coverage instrumentation' },
      { type: 'testdino:owner', description: 'Dhyey-chauhan' },
      {
        type: 'testdino:context',
        description:
          'Guard test. Without window.__coverage__ the TestDino fixture collects nothing and the suite would go green with an empty coverage report.',
      },
    ],
  }, async ({ page }) => {
    const scripts: string[] = [];
    page.on('response', (response) => {
      if (new URL(response.url()).pathname.endsWith('.js')) scripts.push(response.url());
    });

    await page.goto('/');

    if (process.env.COVERAGE_MODE === 'v8') {
      // V8 mode measures the served bundles; there is no window.__coverage__ to find.
      expect(
        scripts.length,
        'No JS bundles were served, so Chromium V8 coverage would collect nothing.',
      ).toBeGreaterThan(0);
      return;
    }

    const coverage = await page.evaluate(
      () => (globalThis as Record<string, unknown>).__coverage__ ?? null,
    );

    expect(
      coverage,
      'window.__coverage__ is missing — the app served at this baseURL is not Istanbul-instrumented. ' +
        'Serve an instrumented build (npm run start:test) and point COVERAGE_BASE_URL at it, ' +
        'or collect V8 coverage instead with COVERAGE_MODE=v8.',
    ).not.toBeNull();

    expect(Object.keys(coverage as object).length).toBeGreaterThan(0);
  });

  test('homepage renders the featured product catalog', {
    tag: ['@coverage', '@coverage-low'],
    annotation: [
      { type: 'testdino:priority', description: 'high' },
      { type: 'testdino:feature', description: 'Product catalog' },
      { type: 'testdino:owner', description: 'Dhyey-chauhan' },
      {
        type: 'testdino:context',
        description: 'Low-depth profile: exercises catalog listing and routing code paths only.',
      },
    ],
  }, async ({ page }) => {
    await page.goto('/');

    const featured = page.getByTestId('featured-products-section');
    await expect(featured).toBeVisible();

    const productLinks = featured.getByRole('link');
    await expect(productLinks.first()).toBeVisible();
    expect(await productLinks.count()).toBeGreaterThan(0);

    await expect(page.getByTestId('header-cart-icon')).toBeVisible();
  });

  test('product detail page adds an item to the cart', {
    tag: ['@coverage', '@coverage-mid'],
    annotation: [
      { type: 'testdino:priority', description: 'high' },
      { type: 'testdino:feature', description: 'Add to cart' },
      { type: 'testdino:owner', description: 'Dhyey-chauhan' },
      {
        type: 'testdino:context',
        description: 'Mid-depth profile: catalog → product detail → cart state mutation.',
      },
    ],
  }, async ({ page }) => {
    await page.goto('/');

    await page.getByText('Seagate 4TB External Hard Drive').first().click();

    const addToCart = page.getByTestId('add-to-cart-button');
    await expect(addToCart).toBeVisible();
    await addToCart.click();

    // The badge is a sibling of the (SVG) cart icon and only renders once the cart
    // is non-empty, so its presence is itself the assertion that state changed.
    await expect(page.getByTestId('header-cart-count')).toHaveText('1');
  });

  test('cart drawer updates quantity, totals, and removal', {
    tag: ['@coverage', '@coverage-high'],
    annotation: [
      { type: 'testdino:priority', description: 'critical' },
      { type: 'testdino:feature', description: 'Cart and checkout' },
      { type: 'testdino:owner', description: 'Dhyey-chauhan' },
      {
        type: 'testdino:context',
        description:
          'High-depth profile: full purchase funnel — catalog, product detail, cart drawer, quantity and pricing recalculation, line-item removal.',
      },
    ],
  }, async ({ page }) => {
    const dollars = async (locator: ReturnType<typeof page.getByTestId>) =>
      Number((await locator.innerText()).replace(/[^0-9.]/g, ''));

    await page.goto('/');

    await page.getByText('JBL Charge 4 Bluetooth Speaker').first().click();

    const addToCart = page.getByTestId('add-to-cart-button');
    await expect(addToCart).toBeVisible();
    await addToCart.click();

    await page.getByTestId('header-cart-icon').click();

    await expect(page.getByTestId('cart-item')).toHaveCount(1);
    await expect(page.getByTestId('item-quantity').first()).toHaveText('1');

    const checkout = page.getByTestId('checkout-button');
    await expect(checkout).toBeVisible();
    await expect(checkout).toBeEnabled();

    // Unit price drives the totals, so the subtotal must track quantity exactly.
    const unitPrice = await dollars(page.getByTestId('item-price').first());
    expect(unitPrice).toBeGreaterThan(0);
    expect(await dollars(page.getByTestId('subtotal-value'))).toBe(unitPrice);

    await page.getByTestId('increase-quantity').first().click();
    await expect(page.getByTestId('item-quantity').first()).toHaveText('2');
    await expect
      .poll(() => dollars(page.getByTestId('subtotal-value')))
      .toBe(unitPrice * 2);

    // The badge counts distinct line items, not units, so it stays at 1.
    await expect(page.getByTestId('header-cart-count')).toHaveText('1');

    await page.getByTestId('remove-item').first().click();
    await expect(page.getByTestId('cart-item')).toHaveCount(0);
    await expect(page.getByTestId('checkout-button')).toHaveCount(0);
    await expect(page.getByTestId('header-cart-count')).toHaveCount(0);
  });
});
