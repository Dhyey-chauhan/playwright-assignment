#!/usr/bin/env node
// Verifies that every part-4 test ended the way its tag says it should.
//
// part-4 is a fixture suite: 10 tests are meant to pass and 10 are meant to
// fail, so a non-zero Playwright exit code is EXPECTED and says nothing about
// whether the suite is healthy. What actually matters is that each test's
// outcome matches the @part-4-pass / @part-4-fail tag in its title. An intended
// failure that starts passing is just as much a regression as the reverse.
//
// The suite runs under more than one project (chromium + firefox), so the check
// is per BROWSER, not per spec — a test that passes in chromium and fails in
// firefox has to be reported, and collapsing the two would hide exactly that.
//
// Usage: node scripts/verify-part-4-outcomes.js <playwright-json-report>

const fs = require('fs');

const reportPath = process.argv[2];
if (!reportPath) {
  console.error('usage: node scripts/verify-part-4-outcomes.js <report.json>');
  process.exit(2);
}
if (!fs.existsSync(reportPath)) {
  console.error(`No JSON report at ${reportPath} — did the run start at all?`);
  process.exit(2);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// The JSON reporter nests suites arbitrarily deep (file -> describe -> ...).
const specs = [];
const walk = (suite) => {
  (suite.specs || []).forEach((spec) => specs.push(spec));
  (suite.suites || []).forEach(walk);
};
(report.suites || []).forEach(walk);

if (specs.length === 0) {
  console.error('The report contains no tests. A grep or path filter matched nothing.');
  process.exit(2);
}

const mismatches = [];
const tally = {}; // projectName -> { pass, fail }

for (const spec of specs) {
  const wantsPass = spec.title.includes('@part-4-pass');
  const wantsFail = spec.title.includes('@part-4-fail');

  if (wantsPass === wantsFail) {
    mismatches.push(`UNTAGGED  ${spec.title} — needs exactly one of @part-4-pass / @part-4-fail`);
    continue;
  }

  // One entry per project the spec ran under.
  for (const test of spec.tests || []) {
    const project = test.projectName || 'unknown';
    tally[project] = tally[project] || { pass: 0, fail: 0 };
    tally[project][wantsPass ? 'pass' : 'fail'] += 1;

    const last = (test.results || [])[(test.results || []).length - 1];
    const outcome = last ? last.status : 'never ran';
    const didPass = outcome === 'passed';

    if (wantsPass && !didPass) {
      mismatches.push(`REGRESSED [${project}] ${spec.title} — tagged @part-4-pass but ${outcome}`);
    }
    if (wantsFail && didPass) {
      mismatches.push(`STOPPED FAILING [${project}] ${spec.title} — tagged @part-4-fail but passed`);
    }
  }
}

const projects = Object.keys(tally).sort();
const total = projects.reduce((n, p) => n + tally[p].pass + tally[p].fail, 0);

console.log(`part-4: ${total} test runs across ${projects.length} project(s)`);
for (const project of projects) {
  console.log(`  ${project}: ${tally[project].pass} expected to pass, ${tally[project].fail} expected to fail`);
}

if (mismatches.length > 0) {
  console.error('\nOutcome did not match the tag:\n');
  mismatches.forEach((line) => console.error(`  ${line}`));
  process.exit(1);
}

console.log('Every part-4 test ended exactly as its tag requires, in every project.');
