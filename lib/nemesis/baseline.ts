import { runVitest } from "./runner.js";
import type { BaselineResult, TestOutcome } from "./types.js";

export function compareBaseline(run1: TestOutcome[], run2: TestOutcome[], passed1 = true, passed2 = true): BaselineResult {
  const first = new Map(run1.map((test) => [test.id, test.status]));
  const second = new Map(run2.map((test) => [test.id, test.status]));
  const ids = [...new Set([...first.keys(), ...second.keys()])].sort();
  const stableTests = ids.filter((id) => first.get(id) === "passed" && second.get(id) === "passed");
  return { run1Passed: passed1, run2Passed: passed2, totalTests: ids.length, stableTestCount: stableTests.length, stableTests, excludedFlakyTests: ids.filter((id) => first.get(id) !== second.get(id)) };
}
export async function establishBaseline(repo: string): Promise<BaselineResult> {
  const first = await runVitest(repo); const second = await runVitest(repo);
  return compareBaseline(first.tests, second.tests, first.passed, second.passed);
}
