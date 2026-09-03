#!/usr/bin/env node
/**
 * Generates the regression suite used to compare sharded vs orchestrated runs.
 *
 * Design constraints:
 *   - MIXED OUTCOMES. A suite where everything passes proves nothing about how a
 *     scheduler behaves under real conditions: pass, fail, skip and flaky all
 *     travel different paths through the reporter and the retry logic.
 *   - REAL ASSERTIONS. Each test builds a DOM, interacts with it, and asserts on
 *     the result. Nothing is a stub.
 *   - DETERMINISTIC COST. Per-file "latency" is modelled with explicit waits
 *     rather than by hammering storedemo 4000 times. Waits behave identically on
 *     a laptop and on a CI runner, so the 6-8 minute budget holds on both — and
 *     the suite cannot flake on network conditions.
 *   - UNEVEN COST. File weights vary pseudo-randomly, which is what makes
 *     count-based --shard leave idle time for orchestration to reclaim.
 */
const fs = require('fs');
const path = require('path');

const FILES = 160;
const TESTS_PER_FILE = 25;
const SHARDS = 8;
const WORKERS = 4;
const OUT = path.join(__dirname, '..', 'tests', 'regression');

// Pseudo-random but deterministic. Deliberately NOT `i % 8`: Playwright assigns
// file i to shard (i % shards), so a modulo weight would hand one shard every
// heavy file and make the baseline pathologically slow rather than merely uneven.
const weightOf = i => ((i * i + 3 * i + 7) % 8);
const waitMs = w => 520 + w * 330;          // 520ms .. 2.83s
const WORK_MS = 250;                         // real interaction + assertion cost

// outcome mix, spread across each file so every shard sees all four kinds
const outcomeOf = (i, t) => {
  const n = (i * 31 + t * 17) % 100;
  if (n < 12) return 'fail';
  if (n < 20) return 'skip';
  if (n < 28) return 'flaky';
  return 'pass';
};

const page = (i, t) => `\`
      <main id="app">
        <header><h1>Store ${i}</h1><span data-testid="cart-count">0</span></header>
        <ul id="catalogue">\${Array.from({ length: 6 }, (_, n) =>
          \`<li data-sku="sku-\${n}"><span class="name">Item \${n}</span>
             <span class="price">\$\${(n + 1) * 10}</span>
             <button data-add="\${n}">Add</button></li>\`).join('')}
        </ul>
        <form id="checkout"><input name="email" /><button type="submit">Pay</button></form>
      </main>
      <script>
        let count = 0;
        document.querySelectorAll('[data-add]').forEach(b =>
          b.addEventListener('click', () => {
            document.querySelector('[data-testid="cart-count"]').textContent = ++count;
          }));
      </script>\``;

const bodies = {
  pass: (i, t, w) => `
  test('spec ${i} · case ${t} · adds items and updates the cart @regression-load', async ({ page }) => {
    await page.setContent(${page(i, t)});
    await expect(page.locator('h1')).toHaveText('Store ${i}');
    await expect(page.locator('#catalogue li')).toHaveCount(6);
    await page.click('[data-add="2"]');
    await page.click('[data-add="4"]');
    await expect(page.getByTestId('cart-count')).toHaveText('2');
    await page.fill('input[name="email"]', 'buyer${t}@example.com');
    await expect(page.locator('input[name="email"]')).toHaveValue('buyer${t}@example.com');
    await page.waitForTimeout(${waitMs(w)});
  });
`,
  fail: (i, t, w) => `
  test('spec ${i} · case ${t} · cart count regression @regression-load @known-failure', async ({ page }) => {
    await page.setContent(${page(i, t)});
    await page.click('[data-add="1"]');
    await page.waitForTimeout(${waitMs(w)});
    // Intentional: one click was made, the assertion demands three. Deliberate
    // failures keep the failure path exercised on every run.
    await expect(page.getByTestId('cart-count')).toHaveText('3');
  });
`,
  skip: (i, t, w) => `
  test('spec ${i} · case ${t} · gated behind a feature flag @regression-load @gated', async ({ page }) => {
    test.skip(!process.env.FEATURE_CHECKOUT_V2, 'FEATURE_CHECKOUT_V2 is not enabled');
    await page.setContent(${page(i, t)});
    await expect(page.locator('#checkout')).toBeVisible();
    await page.waitForTimeout(${waitMs(w)});
  });
`,
  flaky: (i, t, w) => `
  test('spec ${i} · case ${t} · settles only on retry @regression-load @flaky', async ({ page }) => {
    await page.setContent(${page(i, t)});
    await page.click('[data-add="0"]');
    await expect(page.getByTestId('cart-count')).toHaveText('1');
    await page.waitForTimeout(${waitMs(w)});
    // Fails the first attempt, passes the retry — the flaky path, deterministically.
    expect(test.info().retry, 'first attempt is expected to fail').toBeGreaterThan(0);
  });
`,
};

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.spec.ts')) fs.unlinkSync(path.join(OUT, f));

const counts = { pass: 0, fail: 0, skip: 0, flaky: 0 };
const fileCost = [];

for (let i = 1; i <= FILES; i++) {
  const w = weightOf(i);
  const id = String(i).padStart(3, '0');
  let out = '';
  let cost = 0;
  for (let t = 1; t <= TESTS_PER_FILE; t++) {
    const kind = outcomeOf(i, t);
    counts[kind]++;
    out += bodies[kind](id, t, w);
    // skips cost nothing; flaky runs twice
    cost += kind === 'skip' ? 0 : (waitMs(w) + WORK_MS) * (kind === 'flaky' ? 2 : 1);
  }
  fileCost.push(cost);
  fs.writeFileSync(
    path.join(OUT, `regression-${id}.spec.ts`),
    `import { test, expect } from '@playwright/test';\n\n` +
    `// GENERATED by scripts/generate-load-tests.js — do not edit by hand.\n` +
    `// weight ${w} — ${waitMs(w)}ms of simulated latency per test\n\n` +
    `test.describe('regression suite ${id}', () => {\n` +
    `  // the flaky cases need one retry to demonstrate recovery\n` +
    `  test.describe.configure({ retries: 1 });\n${out}});\n`
  );
}

// Project the baseline: Playwright assigns file i to shard (i % SHARDS).
const shard = Array.from({ length: SHARDS }, () => 0);
fileCost.forEach((c, idx) => { shard[idx % SHARDS] += c; });
const perShard = shard.map(ms => ms / WORKERS / 1000);
const slowest = Math.max(...perShard), fastest = Math.min(...perShard);

console.log(`generated ${FILES} files, ${FILES * TESTS_PER_FILE} tests`);
console.log(`  pass ${counts.pass} · fail ${counts.fail} · skip ${counts.skip} · flaky ${counts.flaky}`);
console.log(`projected at ${SHARDS} shards x ${WORKERS} workers:`);
console.log(`  slowest shard ${slowest.toFixed(0)}s (${(slowest / 60).toFixed(1)} min)`);
console.log(`  fastest shard ${fastest.toFixed(0)}s (${(fastest / 60).toFixed(1)} min)`);
console.log(`  spread ${(slowest - fastest).toFixed(0)}s — the idle time orchestration should reclaim`);
