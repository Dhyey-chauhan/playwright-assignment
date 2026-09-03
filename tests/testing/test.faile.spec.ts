import { test, expect } from '@playwright/test';

/**
 * status vs outcome — baseline reproduction.
 *
 * Playwright sends two fields per test case:
 *   status  — what a single attempt did      ("did this run pass?")
 *   outcome — Playwright's verdict for the test ("is this test a pass?")
 *
 * They agree on every ordinary test. They disagree only when a test declares
 * test.fail(), because then a failing attempt is the expected result. TestDino
 * read `status` everywhere and ignored `outcome`, so both directions were wrong:
 *
 *   A  test.fail() that fails   Playwright: passed   TestDino showed: failed
 *   B  test.fail() that passes  Playwright: failed   TestDino showed: passed
 *
 * B is the false green — CI goes red while the dashboard reports all clear.
 *
 * This file is the ticket's reproduction spec, kept to exactly five cases so the
 * expected numbers stay fixed and checkable:
 *
 *   Playwright's own summary line:  2 passed, 2 failed, 1 skipped  (of 5)
 *
 * Do not add cases to this file. Every acceptance criterion in the ticket is
 * stated against that 5/2/2/1 shape — one extra case and the counts no longer
 * compare. Regression scenarios (flaky, timeout, interrupted, fixme) live in
 * their own specs so they cannot contaminate this baseline.
 *
 * The assertions are deliberately pure — no page, no network, no storefront.
 * A baseline used to compare counters must not be able to fail for any reason
 * other than the one it is testing.
 *
 * Run at retries 0, 1 and 2 (criteria 3 and 4 only differ once retries are on).
 */
test.describe('status vs outcome — expected-failure reproduction', {
  tag: ['@outcome-vs-status'],
}, () => {

  // ------------------------------------------------------------------- A
  // Expected failure. test.fail() declares the failure, and the assertion
  // duly fails — so Playwright counts this as a PASS.
  //   status: failed   outcome: expected   -> passed
  // Bug: shown with a red X, listed in Error Clusters, and reported as a
  // failed test to Slack and the quality gates.
  test('A: test.fail() that fails — expected failure, counts as passed', {
    tag: ['@outcome-vs-status', '@expected-failure'],
    annotation: [
      { type: 'expects', description: 'Playwright verdict: passed (outcome=expected)' },
      { type: 'criteria', description: 'AC 1, 2, 5, 6, 7 — must not appear as failed anywhere' },
    ],
  }, async () => {
    test.fail();

    expect(1).toBe(2);
  });

  // ------------------------------------------------------------------- B
  // Unexpected pass. test.fail() declares a failure that does not arrive —
  // the test was supposed to be broken and no longer is, so Playwright
  // counts this as a FAILURE.
  //   status: passed   outcome: unexpected   -> failed
  // Bug: shown with a green tick. This is the false green — a run whose only
  // defect is B sends a failure alert with an empty failed-test list.
  test('B: test.fail() that passes — unexpected pass, counts as failed', {
    tag: ['@outcome-vs-status', '@unexpected-pass'],
    annotation: [
      { type: 'expects', description: 'Playwright verdict: failed (outcome=unexpected)' },
      { type: 'criteria', description: 'AC 1, 2, 6, 7 — must be listed as failed, never an empty list' },
    ],
  }, async () => {
    test.fail();

    expect(1).toBe(1);
  });

  // ------------------------------------------------------------------- C
  // Control. Ordinary pass — status and outcome agree, must be unaffected.
  test('C: ordinary passing test — control', {
    tag: ['@outcome-vs-status', '@control'],
    annotation: [{ type: 'expects', description: 'Playwright verdict: passed' }],
  }, async () => {
    expect(1).toBe(1);
  });

  // ------------------------------------------------------------------- D
  // Control. Ordinary failure — status and outcome agree, must be unaffected.
  // D is also the positive check for Error Clusters: A must drop out of the
  // clusters after the fix, D must stay.
  test('D: ordinary failing test — control', {
    tag: ['@outcome-vs-status', '@control'],
    annotation: [
      { type: 'expects', description: 'Playwright verdict: failed' },
      { type: 'criteria', description: 'AC 5 — D must still appear in Error Clusters' },
    ],
  }, async () => {
    expect(1).toBe(2);
  });

  // ------------------------------------------------------------------- E
  // Control. Skipped keeps its own bucket and is never counted as a pass.
  // E is the check for the terminal summary bug: the skip currently vanishes
  // from the summary box whenever retries are configured.
  test('E: skipped test — control', {
    tag: ['@outcome-vs-status', '@control', '@skipped'],
    annotation: [
      { type: 'expects', description: 'Playwright verdict: skipped' },
      { type: 'criteria', description: 'AC 4 — must appear in the terminal summary at retries 1 and 2' },
    ],
  }, async () => {
    test.skip();

    expect(1).toBe(1);
  });
});
