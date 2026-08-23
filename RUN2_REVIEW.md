# Nemesis Run 2 review

## Frozen engine confirmation

Run 2 adds a local report UI, a request-time report loader, and loader tests. It does not change `lib/nemesis`, scoring, witnesses, counterfactuals, fingerprinting, cache identity, strengthening, or the report schema. The UI consumes the existing schema and `VerificationReport` type.

## Report parsing approach

`ui/server/report-loader.ts` reads the selected report from `.nemesis/reports` on every API request and validates it with the frozen Run 1 Zod schema. Vite exposes only two fixed endpoints, `/api/reports/initial` and `/api/reports/strengthened`, with `Cache-Control: no-store`. The browser requests both with `cache: "no-store"`.

Missing files return:

```text
No verification reports found. Run npm run demo:all first.
```

Malformed JSON or schema failure returns:

```text
Unable to render verification report.
```

There is no sample-data fallback.

## Real report paths

- `.nemesis/reports/initial.json`
- `.nemesis/reports/strengthened.json`
- `REPORT_SCHEMA.md`

Both real reports were schema-validated before implementation and are the browser acceptance source.

## Gap message handling

Evidence drawers render `counterfactual.gapMessage` directly. The UI does not derive or rebuild it. Browser inspection confirmed both canonical strings are present in their R2 and R3 drawers.

## Demo flow

The root route begins with false comfort and hides proof failure. “Verify independently” transitions to the real initial report. “View strengthened proof” transitions to the real strengthened report. “Reset demo” returns to false comfort. `/initial` and `/strengthened` are fixed direct routes.

The browser never runs Git, invokes Codex, shells out, or starts strengthening. State transitions only select one of the two validated reports.

## Trace replay behavior

The trace panel consumes `executionTrace` in array order and keys equal timestamps with their array index. It exposes all 40 actual events. Replay temporarily reveals those same events in order using a 75 ms visual-only delay, clearly labeled as non-engine timing. Browser QA observed 40 events initially, 3 during replay, and all 40 after completion.

## Dynamic rendering proof

With the development server left running, the initial report was regenerated from candidate SHA `43208af1e41dc03087d590a209b36be245f7fdbc` to `925d2ef46f5f8074b032707735c9bed9da5eecd6`. Reloading `/initial` without rebuilding displayed `925d2ef46f5f`, proving request-time loading.

## Screenshots

- False comfort: `artifacts/run2/false-comfort.png`
- Contradiction: `artifacts/run2/contradiction.png`
- Verified: `artifacts/run2/verified.png`

## Browser result

- False-comfort start state inspected.
- Initial contradiction inspected: BUILD and TESTS pass, PROOF fails, 2/4 defended.
- R2 and R3 evidence drawers closed and reopened successfully.
- Both report-supplied canonical gap messages were visible.
- Strengthened state inspected: BUILD, TESTS, and PROOF pass, 4/4 defended, VERIFIED visible.
- Reset control returned to `/` and restored false comfort.
- Mobile check at 375 × 812 reported no horizontal overflow and both evidence gaps present.
- Browser console warnings/errors: none.

## Tests run

- `npm run ui:build`: UI typecheck and production build passed.
- `npm test`: 3 files and 18 tests passed after UI integration, including the real Run 1 integration test and 3 report-loader tests.
- Final Run 1 regression commands and their exact outcomes are recorded below after the closeout run.

## Run 1 regression results

- `npm run typecheck`: passed.
- `npm test`: 3 files, 18 tests passed. Root collection contained only `tests/core.test.ts`, `tests/integration.test.ts`, and `tests/ui-report-loader.test.ts`; no demo fixture test was collected.
- `npm run demo:reset`: clean disposable base and candidate commits created.
- `npm run demo:verify`: BUILD and TESTS passed; R1/R4 defended, R2/R3 not defended; 2/4 defended.
- `npm run demo:strengthen`: BUILD, TESTS, and PROOF passed; 4/4 defended.
- Final production fingerprints before and after strengthening were identical: `d158fff73f43e7807873dcb79b1f93cd7e36c8be1d673ee6d675bd7430225933`.
- Final candidate SHA changed from `3549697ec094e3234ddfe9a28c75a22c09bc3d3e` to `63917c4af3bb04876e267b015e7bba7abbc4542d`.

## Known compromises and cuts

- The deterministic Run 2 scope intentionally supports only the initial and strengthened reports, not a generic report browser.
- The Vite server plugin provides request-time local report loading instead of Next.js server components. It satisfies reload-without-rebuild acceptance while keeping Run 1 isolated.
- Screenshots use the Codex in-app browser’s narrow QA viewport, which also exercises the responsive layout.
- No deployment or social-preview generation was performed because the Run 2 specification explicitly forbids deployment and prioritizes the local proof path.
- No requested proof-path feature was cut. Execution trace, replay, and defended-requirement drawers are included; extra visual effects were intentionally omitted.
