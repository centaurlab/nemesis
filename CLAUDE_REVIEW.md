# Nemesis Run 1 adversarial review artifact

## Product invariants

Only valid, type-correct, bootable counterfactuals that preserve stable unrelated behavior and have an executable two-sided witness enter scoring. Build, boot, unrelated-regression, empty child-test output, and witness failures are `INVALID`, never `KILLED`. Only stable relevant tests may kill a challenge. A surviving valid challenge makes its requirement `NOT_DEFENDED`; no valid challenge makes it `UNVERIFIED`. Verification uses detached disposable worktrees and compares the original worktree status before and after. Counterfactual files are mechanically forbidden from editing candidate tests. Strengthening accepts test paths only, runs the full true suite, checks the production fingerprint, and creates a disposable-repository checkpoint commit. Reports expose requirement verdicts and never a mutation score.

## Demo repository

`demo/template/base` is the pre-feature service and one unrelated stable test. `demo/template/candidate` adds the correct invitation implementation and 17 feature tests, producing 18 candidate tests total. `demo/template/strengthened` adds two tests only. The materialized repository is `demo/.workdir/repo`; reset copies layers, runs `git init`, commits the base, then commits the candidate. The template has no `.git`; `.workdir` is ignored by the parent repository.

## Test execution

Every child fixture invocation is constructed in `runner.ts` with `vitest.mjs --run --reporter=json --outputFile=...`. Per-test `fullName` and status come only from the JSON reporter. Human stdout is not parsed. Root `vitest.config.ts` includes only `tests/**/*.test.ts` and explicitly excludes `demo/**`, `demo/.workdir/**`, `.nemesis/**`, and dependencies. Thus demo tests run only as intentional children.

## Test taxonomy and baseline stability

Run 1 uses an explicit relevant-file mapping for R1–R4. All other discovered fixture test files are unrelated regression evidence. The complete true suite runs twice; test IDs green in both runs are stable, outcome changes are listed as flaky and excluded from later scoring. The fixture has zero flaky tests.

## Counterfactuals

- R1 changes only `ALLOW_MEMBERS_TO_INVITE` and permits member invitations.
- R2 changes only `ENFORCE_EXPIRY` and accepts invitations after expiry.
- R3 changes only `INVALIDATE_OLD_ON_RESEND` and leaves the prior token usable.
- R4 changes only `RESET_EXPIRY_ON_RESEND` and retains the first expiration.

Fixtures are deterministic descriptions in `demo/counterfactuals/fixtures.json`. The fixture provider applies exactly one source replacement and emits a structured counterfactual with a temporary witness.

## Validity gate and witnesses

For each challenge, Nemesis creates detached true and adversarial worktrees at the exact candidate SHA. The adversarial worktree runs typecheck, deterministic boot, and stable unrelated tests in that order. The same temporary witness file is then executed in both worktrees. Its `[expected]` assertion must pass on the true implementation and its `[counterfactual]` assertion must pass on the changed implementation. R1 observes forbidden versus created; R2 expired versus accepted at day eight; R3 invalid versus accepted for token A after resend; R4 T0+10 versus T0+7 expiration.

A witness failure on the true implementation is persisted distinctly as `witness-failed-on-true-implementation` with `possibleImplementationViolation: true`. It is not converted to a proven bug. Run 1 implements the state and unit coverage, but no regeneration because the fixture path never triggers it. Future generation is capped at one retry; two generations from one model would not be described as independent.

## Scoring and isolation

After validity, stable relevant tests decide `KILLED` or `SURVIVED`. All valid killed means `DEFENDED`; any valid survivor means `NOT_DEFENDED`; no valid challenges means `UNVERIFIED`. Worktree cleanup is in `finally` blocks. A status snapshot proves verification did not alter the materialized candidate.

## Strengthening boundary, fingerprint, and cache

Production fingerprinting hashes sorted `src` code paths and bytes. Tests, fixtures, reports, docs, cache, and build output are outside that set. Strengthening copies only the two tests, inspects changed paths, rejects anything outside test directories, runs all true tests, verifies the fingerprint again, and commits. The cache key hashes exact task text, production fingerprint, prompt version, and `fixture-v1`. Therefore the candidate SHA changes while the cache key stays stable. Cached challenge artifact does not mean cached verdict: the strengthened run repeats every process and score.

## Actual observed initial result

```text
INITIAL

✓ BUILD
✓ TESTS
✕ PROOF

R1 DEFENDED
R2 NOT_DEFENDED
R3 NOT_DEFENDED
R4 DEFENDED

2 / 4 requirements defended
```

## Actual observed strengthened result

```text
STRENGTHENED

✓ BUILD
✓ TESTS
✓ PROOF

R1 DEFENDED
R2 DEFENDED
R3 DEFENDED
R4 DEFENDED

4 / 4 requirements defended
```

## Tests run

- `npm install` — dependencies installed.
- `npm run typecheck` — passed.
- `npm test` — 2 files, 15 tests passed, including the unmocked integration path.
- `npm run demo:reset` — created clean base and candidate commits.
- `npm run demo:verify` — real 2/4 result.
- `npm run demo:strengthen` — full true suite passed, test-only commit created, real 4/4 result.

## Known compromises

This run has one deterministic challenge per requirement, an explicit test taxonomy, a single production module for the invitation domain, and no model-generated challenges. Cache artifacts contain full replacement source for that module. Timestamps and Git commit SHAs are real and therefore change after reset. The distinct failed-on-true state exists, but witness regeneration is intentionally deferred because Run 1 has no stochastic provider.

## Deviations

No UI, Codex Skill, live adversary, Guided mode, AUTORUN, database, network call, or deployment was added. The report shape retains every requested semantic distinction. The implementation uses two worktrees per challenge (one pristine witness worktree plus one adversarial worktree) so verification never writes even a temporary harness into the developer worktree.
