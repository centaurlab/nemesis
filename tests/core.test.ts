import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { scoreRequirement } from "../lib/nemesis/scoring.js";
import { compareBaseline } from "../lib/nemesis/baseline.js";
import { challengeCacheKey, productionFingerprint } from "../lib/nemesis/fingerprint.js";
import { confirmWitness } from "../lib/nemesis/witness.js";
import { verificationReportSchema } from "../lib/nemesis/schemas.js";
import { assertCounterfactualProductionOnly, assertTestOnlyChanges } from "../lib/nemesis/boundaries.js";
import type { Counterfactual, VerificationReport } from "../lib/nemesis/types.js";

const temporary: string[] = [];
afterEach(async () => { await Promise.all(temporary.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true }))); });
async function fixture() { const dir = await fs.mkdtemp(path.join(os.tmpdir(), "nemesis-unit-")); temporary.push(dir); await fs.mkdir(path.join(dir, "src")); await fs.mkdir(path.join(dir, "tests")); await fs.writeFile(path.join(dir, "src/app.ts"), "export const value = 1;\n"); await fs.writeFile(path.join(dir, "tests/app.test.ts"), "test('x',()=>{});\n"); return dir; }

describe("requirement scoring", () => {
  it("is DEFENDED when every valid challenge is killed", () => expect(scoreRequirement(["KILLED", "KILLED"])).toBe("DEFENDED"));
  it("is NOT_DEFENDED when one challenge survives", () => expect(scoreRequirement(["KILLED", "SURVIVED"])).toBe("NOT_DEFENDED"));
  it("does not count INVALID as KILLED", () => expect(scoreRequirement(["INVALID", "SURVIVED"])).toBe("NOT_DEFENDED"));
  it("is UNVERIFIED with no valid challenge", () => expect(scoreRequirement(["INVALID"])).toBe("UNVERIFIED"));
});

describe("witness and stability policy", () => {
  it("requires different executable observations", () => { expect(confirmWitness("EXPECTED", "COUNTERFACTUAL").confirmed).toBe(true); expect(confirmWitness("EXPECTED", "EXPECTED").confirmed).toBe(false); });
  it("excludes a flaky baseline test", () => { const result = compareBaseline([{ id: "stable", status: "passed" }, { id: "flaky", status: "passed" }], [{ id: "stable", status: "passed" }, { id: "flaky", status: "failed" }]); expect(result.stableTests).toEqual(["stable"]); expect(result.excludedFlakyTests).toEqual(["flaky"]); });
  it("preserves failed-on-true as a distinct diagnostic without claiming a proven bug", () => { const result = confirmWitness("HARNESS_FAILURE", "COUNTERFACTUAL"); expect(result.diagnostic).toBe("witness-failed-on-true-implementation"); expect(result.possibleImplementationViolation).toBe(true); expect(JSON.stringify(result)).not.toContain("PROVEN BUG"); });
});

describe("source boundaries and cache identity", () => {
  it("excludes tests from the production fingerprint", async () => { const dir = await fixture(); const before = await productionFingerprint(dir); await fs.writeFile(path.join(dir, "tests/app.test.ts"), "changed\n"); expect(await productionFingerprint(dir)).toBe(before); });
  it("test-only modification preserves fingerprint and cache identity", async () => { const dir = await fixture(); const before = await productionFingerprint(dir), key = challengeCacheKey("task", before); await fs.writeFile(path.join(dir, "tests/new.test.ts"), "new\n"); const after = await productionFingerprint(dir); expect(after).toBe(before); expect(challengeCacheKey("task", after)).toBe(key); });
  it("production changes modify the fingerprint", async () => { const dir = await fixture(); const before = await productionFingerprint(dir); await fs.writeFile(path.join(dir, "src/app.ts"), "export const value = 2;\n"); expect(await productionFingerprint(dir)).not.toBe(before); });
  it("rejects counterfactual edits to candidate tests", () => { const value = { id: "x", targetRequirementId: "R1", description: "x", files: [{ path: "tests/a.test.ts", content: "" }], witness: { scenario: "", expectedBehavior: "", counterfactualBehavior: "", testPath: "", testSource: "" } } satisfies Counterfactual; expect(() => assertCounterfactualProductionOnly(value)).toThrow("counterfactual-cannot-edit-candidate-tests"); });
  it("aborts strengthening when production changed", () => expect(() => assertTestOnlyChanges(["tests/new.test.ts", "src/app.ts"])).toThrow("STRENGTHENING_VIOLATED_PRODUCTION_BOUNDARY"));
  it("accepts test-only strengthening", () => expect(() => assertTestOnlyChanges(["tests/new.test.ts"])).not.toThrow());
});

describe("report schema", () => {
  it("validates the persisted contract", () => {
    const report: VerificationReport = { schemaVersion: "1", id: "id", createdAt: new Date(0).toISOString(), repo: { path: "/tmp/x", baseRef: "a", candidateRef: "HEAD", candidateSha: "b", productionSourceFingerprint: "f" }, task: { exactText: "task" }, baseline: { run1Passed: true, run2Passed: true, totalTests: 1, stableTestCount: 1, excludedFlakyTests: [] }, requirements: [], summary: { totalRequirements: 0, defended: 0, notDefended: 0, unverified: 0, build: "PASS", tests: "PASS", proof: "PASS" }, executionTrace: [], metadata: { verifierVersion: "1", challengeProvider: "fixture-v1", adversaryPromptVersion: "v1", challengeCacheKey: "key" } };
    expect(verificationReportSchema.parse(report)).toEqual(report);
  });
});
