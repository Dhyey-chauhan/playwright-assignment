# Release Dashboard for Automation Runs + Unified Test Runs — Test Strategy (38 cases)

Epic: automation results join manual results **at the run** (where cases are selected) and
**at the release** (which adds them up). One page, one question: *can we ship?*

Companion to [`orchestration_test_strategy.md`](./orchestration_test_strategy.md). Same format:
**PRE** gates · **POSITIVE** works as designed · **NEGATIVE** rejected cleanly · **EDGE** hard paths.

**Balance:** 2 pre · 15 positive · 10 negative · 11 edge.

---

## What this ticket is, in short

Today a Release contains **only manual testing** — manual runs and exploratory sessions.
Automation runs exist but have **no connection to a release**. A team that tests both ways
gets two disconnected views and no combined verdict, so Inksoft/MergeCo exports both to
Excel every sprint and adds them up by hand (raised 2026-08-24).

The epic adds two surfaces:

| Level | What changes | The question it answers |
|---|---|---|
| **Release** | attach/detach an existing automation run; one combined verdict at **test-case grain**, always with a per-source breakdown (manual / exploratory / automation); failure analysis by cause; coverage gaps with a trust state | *Did CI go green for this release?* |
| **Run** | choose which cases enter a run (all / automated / manual / hand-picked); a **source** on every case; a synced automation verdict stored **beside** the human one with provenance; per-case status resolved **worst-of at read time**; four distinct not-executed states; a browser/platform axis with the cells CI missed handed to a tester | *How much of my library is covered, and by which side?* |

Four rules the whole thing hangs on — every case below is really testing one of these:

1. **Counting grain is the test case.** Automation *fills* cases, it does not form a second population. Adding a browser or re-running the suite must not move the number.
2. **Worst-of wins, nothing overwrites.** Human result and CI result coexist; the worse one is displayed; both stay visible. Sync never writes into the human result log — that is a schema property, not a convention.
3. **A run is a snapshot, a release is live.** A finished run must not change when CI re-runs tomorrow; the release always re-reads.
4. **Absence is never a pass.** Results that never arrived are a trust state / coverage gap, never green.

---

## Fixture — build this once, it answers ~15 cases in one pass

The fastest way through this plan is one deliberately-shaped project. Everything downstream
reads off it.

**Project `RDA-fixture`** — 10 manual test cases, `TC1…TC10`.

| Case | Linked to automation? | CI outcome | Manual outcome | Exists to prove |
|---|---|---|---|---|
| TC1 | yes | pass (all 3 browsers) | untested | plain automation fill |
| TC2 | yes | **fail on webkit only**, pass chromium+firefox | untested | cross-platform → **failed** (SC3) |
| TC3 | yes | pass | **fail** (human) | worst-of, both visible (SC7) |
| TC4 | yes | **never reported** | pass | absence ≠ pass (SC4) |
| TC5 | yes | **skipped** | untested | skipped ≠ untested ≠ not run |
| TC6 | yes | **incomplete / interrupted** | untested | 4th not-executed state |
| TC7 | yes | pass (chromium only — no webkit/firefox job) | — | tester handed only uncovered cells (SC8) |
| TC8 | **no link** | n/a | pass | manual-only path unaffected |
| TC9 | **no link** | n/a | untested | coverage gap |
| TC10 | yes | pass | **pass** (human, same case) | headline dedup — double count? (open decision) |

**Containers:** Release `R` → sub-release `R1`. Manual run `MR` (all 10 cases) lives in `R1`.
Automation run `AR` (the CI suite above) gets attached to `R1`.
Keep a **second release `R-control`** with manual testing only and **no** automation anywhere —
that is the regression baseline for SC9.

---

## Fast path — run these 9 first (~90 min). If any fails, stop and report.

`PRE1 → P1 → P4 → P7 → P9 → N1 → N3 → N4 → E5`

That sequence touches every one of the four rules above plus graceful degradation. The
remaining 29 cases are breadth; these 9 are the gate.

---

# PRE — gates. Run before anything else.

### PRE1 · Link adoption census — the stated prerequisite

**What to test:** in a **real** customer-shaped project (not the fixture), measure what share
of manual test cases carry a link to an automated test.

**Expect:** a number, reported back to the epic. Nothing currently turns a link into a result,
and link adoption has never been measured.

**Why it gates:** if adoption is near zero, the automated-results table renders **empty** and
every counting case below is untestable on real data — the correct first job becomes *making
linking happen*, and only the automated-results ticket is blocked. Every other ticket in the
epic is unaffected, so the plan continues on the fixture either way.

**Deliverable:** `linked / total` per project, plus how the links got there (manual, import, auto-match accepted).

---

### PRE2 · Baseline snapshot of a release and run with no automation

**What to test:** before the feature is enabled, capture `R-control`: release counts, per-source
breakdown, run roster, run headline, sidebar labels. Screenshot + raw API response.

**Expect:** a frozen artifact to diff against in **E10**.

**Fails if:** nothing — this is a recording step. Skipping it makes SC9 unprovable.

---

# POSITIVE — the feature works as designed

---

### P1 · Attach an automation run from the run's page

**What to test:** open `AR`, attach it to release `R1`.

**Expect:** attachment succeeds; `R1` immediately lists `AR` as a **result source**; the
combined verdict recomputes; `AR`'s own page is otherwise unchanged (same results, same status).

**Fails if:** attaching mutates the run, or the release verdict does not move.

---

### P2 · Attach from inside the release — the second entry point

**What to test:** detach, then attach the same run from the release's own picker.

**Expect:** byte-identical end state to P1 — same attachment record, same numbers. Two entry
points, one mechanism.

**Fails if:** the two paths produce different records, or using both creates two attachments of one run.

---

### P3 · Detach returns the release to baseline exactly

**What to test:** note the release verdict pre-attach, attach, detach, compare.

**Expect:** counts return **exactly** to the pre-attach values. The run survives detach untouched
and is still attachable again.

**Fails if:** residue remains (a lingering source row, a stale automation count, a changed manual number).

---

### P4 · Combined verdict at test-case grain, with the per-source breakdown always present

**What to test:** the release page with `AR` attached.

**Expect:**
- One headline verdict, counted in **test cases**.
- A breakdown by source — manual / exploratory / automation — visible **alongside** it, never instead of it.
- Numbers reconcile: the breakdown sums to the headline under whatever dedup rule is in force (see **E1**).

**Fails if:** the headline appears without a breakdown, or the two disagree.

---

### P5 · A run attached to a sub-release counts toward the parent

**What to test:** `AR` attached to `R1`; open parent `R`.

**Expect:** `R` includes `AR`'s results, exactly as it already rolls up manual runs from `R1`.

**Fails if:** the parent shows manual results from its children but automation only from itself —
the inconsistency this rule exists to prevent.

---

### P6 · Run is a snapshot, release is live

**What to test:** finish the run. Re-run the same CI suite with a different outcome. Reload both pages.

**Expect:**
- The **run**'s stored automation verdict and its provenance are **unchanged** — historical record intact.
- The **release** reflects the fresh CI result.

**Fails if:** a finished run silently rewrites itself, or the release caches a stale verdict.

---

### P7 · Case selection at run creation — all four modes

**What to test:** create four runs from the same suite: **all**, **automated only**, **manual only**,
**hand-picked**.

**Expect:** each roster matches its filter exactly against the fixture table (automated-only → TC1–TC7, TC10; manual-only → TC8, TC9; hand-picked → precisely what was ticked).

**Fails if:** a filter leaks a case, or hand-picked selection is lost on save.

---

### P8 · The run reports its manual/automated split, and the split agrees with the results beside it

**What to test:** the run header on a mixed run.

**Expect:** the split matches the roster's per-case `source` field, and matches the results
displayed in the rows. One number, three places, no drift.

**Fails if:** the header split and the row sources disagree.

---

### P9 · Worst-of at read time — TC3

**What to test:** TC3 (human **fail**, CI **pass**).

**Expect:** the resolved status is **failed**. Both results remain visible and individually
attributable. Flip the human result to pass → resolved status recomputes on read, with no
write to the automation side.

**Fails if:** either side overwrites the other, or the resolution is baked in at write time
(check by changing one side and confirming the other is untouched).

---

### P10 · A synced verdict never enters the human result log

**What to test:** TC1 (CI pass, no human ever touched it). Inspect the case row, the result
history/activity log, and the raw record.

**Expect:** the automation verdict lives in **its own field** with provenance (run, commit/branch,
timestamp, config). The human result log is **empty** for TC1. The attribution never names a person.

**Fails if:** a CI result appears as a human status, or a user is shown as having "set" it.

---

### P11 · Four not-executed states stay apart in the row, merge only in the headline

**What to test:** TC9 (**untested**), TC4 (**not run** — never arrived), TC5 (**skipped**), TC6 (**incomplete**).

**Expect:** four visually and semantically distinct row states; the headline may collapse them
into one "not executed" bucket, and the sum matches.

**Fails if:** any two collapse in the row, or the headline bucket miscounts.

---

### P12 · Configuration axis — one case, one row

**What to test:** TC2 across chromium/firefox/webkit.

**Expect:** TC2 remains **one** roster row. The configuration axis lives inside the row (per-cell
results). The same axis is available to manual cases.

**Fails if:** the roster multiplies rows per configuration (explicitly out of scope).

---

### P13 · Uncovered configuration cells are handed to a tester — TC7

**What to test:** TC7 ran chromium only; firefox and webkit have no CI job.

**Expect:** exactly those two cells are surfaced as manual work. The chromium cell is **not**
re-offered to a human.

**Fails if:** a tester is handed cells CI already covered, or the uncovered cells are silently passed/hidden.

---

### P14 · Failure analysis by cause, and coverage gaps with a trust state

**What to test:** the release's analysis panels with the fixture attached.

**Expect:**
- Failures grouped by **cause**, not just listed.
- A coverage-gap view containing TC9 (never tested) and TC4 (result never arrived), where TC4
  carries an explicit **trust state** distinguishing "we don't know" from "not covered".

**Fails if:** the two kinds of gap are merged, or a gap is rendered as a pass.

---

### P15 · Attached CI runs present as result sources, not as a second container

**What to test:** the release layout.

**Expect:** `AR` appears as a **source feeding the runs** in the release — not as a peer list
beside them. There is exactly **one** path by which a CI job reaches the release verdict.

**Fails if:** automation reaches the release by two independent paths (that yields two different
numbers for the same CI job).

---

### P16 · Sidebar rename once a run is no longer manual-only

**What to test:** the sidebar label before and after the feature.

**Expect:** the label no longer says "manual"; naming is consistent across sidebar, breadcrumb,
page title, and empty states.

**Fails if:** one surface renames and the others do not.

---

# NEGATIVE — must be rejected or absorbed cleanly

---

### N1 · Adding a browser does not change the test-case count — SC2

**What to test:** record the release count. Add a **4th** browser to the CI config. Re-run. Re-read.

**Expect:** the **test-case count is identical**. Only the configuration axis widens.

**Fails if:** the number grows with the matrix — that is counting executions, not cases, and it is
the exact failure the grain rule exists to prevent.

---

### N2 · Re-running the same suite does not change the count — SC2

**What to test:** run the same suite 3×, attach each.

**Expect:** count stable across all three. Attaching a second run of the same suite does not
create a second population of the same cases.

**Fails if:** each re-run inflates the total.

---

### N3 · A result that never arrived is never reported as passed — SC4, TC4

**What to test:** CI reports nothing for TC4 (test dropped from the suite / job died / partial upload).

**Expect:** TC4 is **not run** with a trust state, and is excluded from the pass count. The release
verdict cannot be green on the strength of a missing result.

**Fails if:** a missing result is treated as a pass, or is quietly omitted so the pass **rate**
looks clean.

---

### N4 · Fails on one platform, passes on the others → failed — SC3, TC2

**What to test:** TC2 (webkit fail, chromium+firefox pass).

**Expect:** reported **failed** at case grain. Per-cell detail still shows the two passes.

**Fails if:** it reports passed, "mostly passed", or a 2/3 ratio in the headline.

---

### N5 · Attaching the same run twice, and to two releases

**What to test:** (a) attach `AR` to `R1` twice; (b) attach `AR` to `R1` and also to a different release.

**Expect:** (a) idempotent or rejected — never a second attachment, never double-counted.
(b) Whatever the product decides, it must be **explicit and visible on both releases**, and
neither release may count it twice.

**Fails if:** a duplicate attachment silently doubles a number anywhere.

---

### N6 · Invalid, foreign, or deleted run → clean rejection

**What to test:** attach (a) a made-up run id, (b) a valid run from **another project/tenant**,
(c) a deleted run.

**Expect:** all three rejected identically — no partial attachment, no leak of whether the id
exists elsewhere (same 404-cloak parity as the orchestration plan's N4).

**Fails if:** the responses distinguish "doesn't exist" from "not yours".

---

### N7 · Automation results are immutable

**What to test:** try to edit a synced verdict — in the UI, then by direct API call.

**Expect:** no edit affordance; the API rejects. Results belong to the run. (A waiver mechanism
is a **later** addition — its absence is not a bug.)

**Fails if:** a synced verdict can be changed from the run or release surface.

---

### N8 · Attaching a still-running or partially-ingested run

**What to test:** attach a run that is mid-flight, and one whose ingestion failed halfway.

**Expect:** the release does not present in-flight numbers as final — the source is marked
in-progress/partial, and its unknowns land in the trust state, not the pass column.

**Fails if:** a running job's partial greens are folded into the verdict without qualification.

---

### N9 · Auto-match suggests, never writes

**What to test:** a manual case whose title closely matches an automated test, with **no** link.

**Expect:** a suggestion at most. **No result is attributed.** The case stays uncovered until a
human creates the link. Fuzzy title matching as the join is explicitly out of scope.

**Fails if:** a result appears against an unlinked case.

---

### N10 · Permissions

**What to test:** a read-only / viewer role on the release.

**Expect:** attach and detach are unavailable in the UI **and** rejected by the API.

**Fails if:** the guard is UI-only.

---

# EDGE — the hard paths and the open decisions

> **E1–E4 are open decisions.** Record the actual behaviour with evidence and report it.
> Do **not** file these as bugs unless the observed behaviour contradicts something already decided.

### E1 · Headline dedup — TC10 (OPEN)

**What to test:** TC10 has both a human pass and a CI pass.

**Record:** is it counted **once** (a test case that automation filled) or **twice** (two
populations)? Today the release adds manual and automation as separate populations, so once
cases are linked a both-covered case is counted twice.

**Favoured:** count test cases; let automation fill them. Blocks the automated-results ticket only.

**Contradiction to file as a bug:** if the headline and the per-source breakdown imply
different totals with no explanation on the page.

---

### E2 · Does completing a release freeze its automation numbers? (OPEN)

**What to test:** complete/sign off release `R`. Re-run CI with a different outcome. Reload `R`.

**Record:** does the finished release's verdict change? Today it would.

---

### E3 · Runs from different branches in one selection (OPEN)

**What to test:** attach two runs of the same suite from different branches.

**Record:** allowed or blocked; and if allowed, whether the **branch is shown on every result**.
**Favoured:** allow, and show the branch.

---

### E4 · Freshness delay after a run finishes (OPEN)

**What to test:** finish a CI run, then immediately (a) look for it in the attach picker, (b) attach it, (c) watch the counts land.

**Record:** measure each interval in seconds. The question is whether the delay is acceptable or
whether attaching should nudge processing.

---

### E5 · data-handler unavailable → release still renders — SC10

**What to test:** make the automation-counts source unreachable, then load the release.

**Expect:** the page renders with **manual-only** counts and an **explicit notice** that
automation counts could not be fetched. Manual numbers are correct and unzeroed.

**Fails if:** the page 500s, spins forever, shows automation as 0/passed, or drops the notice.

---

### E6 · Detach mid-sync / attach-then-immediately-detach

**What to test:** detach while a sync is in flight; attach and detach within a second.

**Expect:** no orphaned counts, no permanently "syncing" source, no half-attached state.

**Fails if:** the release is left with a source it cannot remove, or counts from a detached run.

---

### E7 · Fan-in / fan-out links

**What to test:** (a) one manual case linked to **three** automated tests; (b) one automated test
linked to **two** manual cases.

**Expect:** worst-of applies across **all** linked results; counting grain stays one row per case
in both directions. (b) must not create a second population.

**Fails if:** one link wins arbitrarily, or (b) double-counts the automated test.

---

### E8 · The linked automated test disappears from CI

**What to test:** delete/rename the automated test behind TC1, re-run, reload.

**Expect:** TC1 degrades to a **coverage gap with a trust state** — not a pass held over from
last week, not a crash. The last-known result, if shown, is clearly stamped as stale.

**Fails if:** a stale pass is presented as current.

---

### E9 · Scale

**What to test:** a release with several attached runs over a few hundred cases, plus a sub-release.

**Expect:** the page renders within budget; counts identical to the sum of the parts; no N+1 timeout.

**Fails if:** the verdict changes depending on pagination, or the page times out.

---

### E10 · Zero-automation regression sweep — SC9

**What to test:** diff `R-control` and a manual-only run against the **PRE2** baseline.

**Expect:** identical, apart from the sidebar rename (P16). Nothing about a release or run that
contains no automation may change.

**Fails if:** a manual-only release gains empty automation panels, changed counts, or new "0 automated" noise.

---

### E11 · Deleting an attached run, or the sub-release holding it

**What to test:** delete `AR` while attached; separately delete `R1` while it holds `AR`.

**Expect:** parent `R` recomputes cleanly and says what happened. No ghost counts, no broken page.

**Fails if:** the parent keeps counting a run that no longer exists.

---

## Coverage map — success criteria → cases

| Success criterion | Cases |
|---|---|
| Combined verdict + per-source breakdown | P4, P15, E1 |
| Count stable across browsers / re-runs | N1, N2, P12 |
| Fail on one platform → failed | N4, P12 |
| Never-arrived is never passed | N3, P11, P14, E8, N8 |
| Sub-release counts toward parent | P5, E11 |
| Run reports its split, split agrees | P7, P8 |
| Human + CI never overwrite; worst-of; both visible | P9, P10, E7, N7 |
| Tester handed only uncovered cells | P13, P12 |
| Nothing regresses without automation | PRE2, E10, P16 |
| Release renders when data-handler is down | E5 |
| Customer stops exporting to Excel | P4 + N1 + N2 + E1 together — the number has to be trustworthy *and* stable |
| Attach / detach mechanics | P1, P2, P3, N5, N6, N10, E6 |
| Snapshot vs live | P6, E2 |
| Linking prerequisite | PRE1, N9 |

---

## Out of scope — do not file bugs

Auto-attaching runs by branch / tag / environment (attaching stays deliberate) · editing or
waiving automation results · a `--release` flag in the CLI · a separate "test plan" object (the
Release is the container; sub-releases already group) · one roster row **per configuration** ·
fuzzy title matching as the join (auto-match suggests, never writes) · triggering runs from a
release · release-to-release comparison.

---

## Results log

| # | Case | Result | Evidence | Notes |
|---|---|---|---|---|
| PRE1 | Link adoption census | ⏳ | | `linked/total` = ? — gates the automated-results ticket only |
| PRE2 | No-automation baseline | ⏳ | | |
| P1 | Attach from run page | ⏳ | | |
| P2 | Attach from release | ⏳ | | |
| P3 | Detach → baseline | ⏳ | | |
| P4 | Combined verdict + breakdown | ⏳ | | |
| P5 | Sub-release roll-up | ⏳ | | |
| P6 | Snapshot vs live | ⏳ | | |
| P7 | Four selection modes | ⏳ | | |
| P8 | Split agrees | ⏳ | | |
| P9 | Worst-of at read time | ⏳ | | |
| P10 | Sync never writes human log | ⏳ | | |
| P11 | Four not-executed states | ⏳ | | |
| P12 | One case, one row | ⏳ | | |
| P13 | Uncovered cells to tester | ⏳ | | |
| P14 | Failure causes + trust state | ⏳ | | |
| P15 | Sources, not containers | ⏳ | | |
| P16 | Sidebar rename | ⏳ | | |
| N1 | +1 browser, same count | ⏳ | | |
| N2 | Re-run, same count | ⏳ | | |
| N3 | Never-arrived ≠ pass | ⏳ | | |
| N4 | One-platform fail → failed | ⏳ | | |
| N5 | Double attach | ⏳ | | |
| N6 | Invalid / foreign run | ⏳ | | |
| N7 | Immutable results | ⏳ | | |
| N8 | In-flight run attached | ⏳ | | |
| N9 | Auto-match never writes | ⏳ | | |
| N10 | Permissions | ⏳ | | |
| E1 | Headline dedup | ⏳ | | OPEN — record, don't file |
| E2 | Freeze on completion | ⏳ | | OPEN — record, don't file |
| E3 | Multi-branch selection | ⏳ | | OPEN — record, don't file |
| E4 | Freshness delay | ⏳ | | OPEN — measure in seconds |
| E5 | data-handler down | ⏳ | | |
| E6 | Detach mid-sync | ⏳ | | |
| E7 | Fan-in / fan-out links | ⏳ | | |
| E8 | Automated test deleted | ⏳ | | |
| E9 | Scale | ⏳ | | |
| E10 | Zero-automation regression | ⏳ | | |
| E11 | Delete attached run / sub-release | ⏳ | | |
