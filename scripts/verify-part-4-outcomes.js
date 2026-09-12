#!/usr/bin/env node
// Verifies that every part-4 test ended the way its tag says it should.
//
// part-4 is a fixture suite: 10 tests are meant to pass and 10 are meant to
// fail, so a non-zero Playwright exit code is EXPECTED and says nothing about
// whether the suite is healthy. What actually matters is that each test's
// outcome matches the @part-4-pass / @part-4-fail tag in its title. An intended
// failure that starts passing is just as much a regression as the reverse.
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
let expectedPass = 0;
let expectedFail = 0;

for (const spec of specs) {
  // A spec repeats per project; spec.ok is false if any projection failed.
  const wantsPass = spec.title.includes('@part-4-pass');
  const wantsFail = spec.title.includes('@part-4-fail');

  if (wantsPass === wantsFail) {
    mismatches.push(`UNTAGGED  ${spec.title} — needs exactly one of @part-4-pass / @part-4-fail`);
    continue;
  }

  if (wantsPass) expectedPass += 1;
  else expectedFail += 1;

  if (wantsPass && !spec.ok) {
    mismatches.push(`REGRESSED ${spec.title} — tagged @part-4-pass but FAILED`);
  }
  if (wantsFail && spec.ok) {
    mismatches.push(`STOPPED FAILING ${spec.title} — tagged @part-4-fail but PASSED`);
  }
}

console.log(`part-4: ${specs.length} tests — ${expectedPass} expected to pass, ${expectedFail} expected to fail`);

if (mismatches.length > 0) {
  console.error('\nOutcome did not match the tag:\n');
  mismatches.forEach((line) => console.error(`  ${line}`));
  process.exit(1);
}

console.log('Every part-4 test ended exactly as its tag requires.');
