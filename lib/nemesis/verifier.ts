import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ALL_TEST_FILES, CACHE_ROOT, DEMO_REPO, RELEVANT_FILES, REPORT_ROOT, REQUIREMENTS, ROOT, TASK_TEXT, VERIFICATION_ROOT } from "./config.js";
import { establishBaseline } from "./baseline.js";
import { challengeCacheKey, productionFingerprint } from "./fingerprint.js";
import { createWorktree, git, removeWorktree } from "./git.js";
import { FixtureChallengeProvider } from "./provider.js";
import { runBoot, runTypecheck, runVitest } from "./runner.js";
import { scoreRequirement } from "./scoring.js";
import { writeReport } from "./report.js";
import { confirmWitness } from "./witness.js";
import { assertCounterfactualProductionOnly } from "./boundaries.js";
import type { Counterfactual, CounterfactualResult, TestOutcome, TraceEvent, VerificationReport } from "./types.js";

const now = () => new Date().toISOString();
const trace = (events: TraceEvent[], stage: string, message: string, status: TraceEvent["status"], requirementId?: string, counterfactualId?: string) => events.push({ timestamp: now(), stage, requirementId, counterfactualId, message, status });
const observed = (tests: TestOutcome[], marker: string) => tests.find((test) => test.id.includes(marker))?.status === "passed";
class InvalidChallenge extends Error { constructor(public readonly reason: string) { super(reason); } }
const gapMessages: Record<string, string> = {
  R2: "Your tests never exercise: \"accept an invitation after day 7\"",
  R3: "Your tests never exercise: \"use the original token after resend\""
};

async function cachedChallenges(key: string, source: string): Promise<Counterfactual[]> {
  await fs.mkdir(CACHE_ROOT, { recursive: true });
  const file = path.join(CACHE_ROOT, `${key}.json`);
  try { return JSON.parse(await fs.readFile(file, "utf8")) as Counterfactual[]; }
  catch {
    const provider = new FixtureChallengeProvider();
    const challenges = await Promise.all(REQUIREMENTS.map((requirement) => provider.getCounterfactual(requirement, source)));
    await fs.writeFile(file, JSON.stringify(challenges, null, 2) + "\n");
    return challenges;
  }
}

function stableOutcomes(run: TestOutcome[], stable: Set<string>) { return run.filter((test) => stable.has(test.id)); }

export async function verify(reportName: "initial" | "strengthened", repo = DEMO_REPO): Promise<VerificationReport> {
  const events: TraceEvent[] = [];
  const originalStatus = await git(repo, ["status", "--porcelain"]);
  const candidateSha = await git(repo, ["rev-parse", "HEAD"]), baseSha = await git(repo, ["rev-parse", "HEAD~1"]);
  const fingerprint = await productionFingerprint(repo), key = challengeCacheKey(TASK_TEXT, fingerprint);
  const source = await fs.readFile(path.join(repo, "src/app.ts"), "utf8");
  const challenges = await cachedChallenges(key, source);
  const build = await runTypecheck(repo), boot = await runBoot(repo);
  trace(events, "candidate typecheck", build.ok ? "passed" : build.stderr, build.ok ? "PASS" : "FAIL");
  trace(events, "candidate boot", boot.ok ? "passed" : boot.stderr, boot.ok ? "PASS" : "FAIL");
  const baseline = await establishBaseline(repo);
  trace(events, "baseline run #1", `${baseline.totalTests} tests; ${baseline.run1Passed ? "passed" : "failed"}`, baseline.run1Passed ? "PASS" : "FAIL");
  trace(events, "baseline run #2", `${baseline.totalTests} tests; ${baseline.run2Passed ? "passed" : "failed"}`, baseline.run2Passed ? "PASS" : "FAIL");
  const stable = new Set(baseline.stableTests);
  const results = [] as VerificationReport["requirements"];
  await fs.mkdir(VERIFICATION_ROOT, { recursive: true });

  for (const requirement of REQUIREMENTS) {
    const challenge = challenges.find((item) => item.targetRequirementId === requirement.id)!;
    const cfDir = path.join(VERIFICATION_ROOT, `${reportName}-${challenge.id}-${randomUUID()}`);
    const trueDir = `${cfDir}-true`;
    let result: CounterfactualResult = { id: challenge.id, description: challenge.description, validity: "INVALID", score: "INVALID" };
    try {
      await createWorktree(repo, cfDir, candidateSha); await createWorktree(repo, trueDir, candidateSha);
      trace(events, "worktree", "counterfactual and true witness worktrees created", "PASS", requirement.id, challenge.id);
      assertCounterfactualProductionOnly(challenge);
      for (const file of challenge.files) {
        await fs.writeFile(path.join(cfDir, file.path), file.content);
      }
      const typecheck = await runTypecheck(cfDir);
      if (!typecheck.ok) { trace(events, "typecheck", "failed", "FAIL", requirement.id, challenge.id); throw new InvalidChallenge("typecheck"); }
      trace(events, "typecheck", "passed", "PASS", requirement.id, challenge.id);
      const smoke = await runBoot(cfDir);
      if (!smoke.ok) { trace(events, "boot", "failed", "FAIL", requirement.id, challenge.id); throw new InvalidChallenge("boot"); }
      trace(events, "boot", "passed", "PASS", requirement.id, challenge.id);
      const relevantCandidates = [...RELEVANT_FILES[requirement.id], ...(requirement.id === "R2" ? ["tests/r2-after-expiry.test.ts"] : requirement.id === "R3" ? ["tests/r3-old-token.test.ts"] : [])];
      const relevantFiles = [] as string[];
      for (const file of relevantCandidates) if (await fs.stat(path.join(cfDir, file)).then(() => true).catch(() => false)) relevantFiles.push(file);
      const allFiles = [...ALL_TEST_FILES, "tests/r2-after-expiry.test.ts", "tests/r3-old-token.test.ts"];
      const unrelatedFiles = [] as string[];
      for (const file of allFiles.filter((file) => !relevantFiles.includes(file))) if (await fs.stat(path.join(cfDir, file)).then(() => true).catch(() => false)) unrelatedFiles.push(file);
      const unrelated = await runVitest(cfDir, unrelatedFiles);
      if (unrelated.tests.length === 0) throw new InvalidChallenge("test-harness");
      const stableUnrelated = stableOutcomes(unrelated.tests, stable);
      if (stableUnrelated.some((test) => test.status !== "passed")) { trace(events, "unrelated tests", "stable unrelated regression", "FAIL", requirement.id, challenge.id); throw new InvalidChallenge("unrelated-regression"); }
      trace(events, "unrelated tests", `${stableUnrelated.length} stable tests passed`, "PASS", requirement.id, challenge.id);
      await fs.writeFile(path.join(trueDir, challenge.witness.testPath), challenge.witness.testSource);
      await fs.writeFile(path.join(cfDir, challenge.witness.testPath), challenge.witness.testSource);
      const trueWitness = await runVitest(trueDir, [challenge.witness.testPath]);
      const cfWitness = await runVitest(cfDir, [challenge.witness.testPath]);
      const confirmation = confirmWitness(observed(trueWitness.tests, "[expected]") ? "EXPECTED" : "HARNESS_FAILURE", observed(cfWitness.tests, "[counterfactual]") ? "COUNTERFACTUAL" : "HARNESS_FAILURE");
      if (!confirmation.confirmed) {
        result.invalidReason = confirmation.diagnostic;
        result.diagnostics = { witnessFailedOnTrueImplementation: confirmation.diagnostic === "witness-failed-on-true-implementation", possibleImplementationViolation: confirmation.possibleImplementationViolation };
        trace(events, "witness", confirmation.diagnostic ?? "not confirmed", "FAIL", requirement.id, challenge.id); throw new InvalidChallenge(confirmation.diagnostic ?? "witness-not-confirmed");
      }
      trace(events, "witness / true", challenge.witness.expectedBehavior, "PASS", requirement.id, challenge.id);
      trace(events, "witness / counterfactual", challenge.witness.counterfactualBehavior, "PASS", requirement.id, challenge.id);
      const relevant = await runVitest(cfDir, relevantFiles);
      if (relevant.tests.length === 0) throw new InvalidChallenge("test-harness");
      const stableRelevant = stableOutcomes(relevant.tests, stable);
      if (stableRelevant.length === 0) throw new InvalidChallenge("no-stable-relevant-tests");
      const killed = stableRelevant.filter((test) => test.status === "failed").map((test) => test.id);
      result = {
        id: challenge.id, description: challenge.description, validity: "VALID", score: killed.length ? "KILLED" : "SURVIVED",
        gapMessage: killed.length ? undefined : gapMessages[requirement.id],
        witness: { scenario: challenge.witness.scenario, expectedBehavior: challenge.witness.expectedBehavior, counterfactualBehavior: challenge.witness.counterfactualBehavior, confirmed: true },
        killedByTests: killed, stableRelevantTestsRun: stableRelevant.map((test) => test.id), stableUnrelatedTestsRun: stableUnrelated.map((test) => test.id)
      };
      trace(events, "relevant tests", killed.length ? `killed by ${killed.join(", ")}` : "all stable relevant tests passed", killed.length ? "FAIL" : "PASS", requirement.id, challenge.id);
      trace(events, "score", result.score!, "INFO", requirement.id, challenge.id);
    } catch (error) {
      if (!(error instanceof InvalidChallenge)) throw error;
      result.invalidReason ??= error.reason;
      trace(events, "score", `INVALID: ${error.reason}`, "INFO", requirement.id, challenge.id);
    } finally { await removeWorktree(repo, trueDir); await removeWorktree(repo, cfDir); }
    const verdict = scoreRequirement([result.score ?? "INVALID"]);
    trace(events, "requirement", verdict, "INFO", requirement.id, challenge.id);
    results.push({ ...requirement, verdict, counterfactuals: [result] });
  }
  const finalStatus = await git(repo, ["status", "--porcelain"]);
  if (finalStatus !== originalStatus) throw new Error("Original candidate worktree changed during verification");
  const defended = results.filter((r) => r.verdict === "DEFENDED").length, notDefended = results.filter((r) => r.verdict === "NOT_DEFENDED").length, unverified = results.filter((r) => r.verdict === "UNVERIFIED").length;
  const report: VerificationReport = {
    schemaVersion: "1.0.0", id: `${reportName}-${randomUUID()}`, createdAt: now(),
    repo: { path: repo, baseRef: baseSha, candidateRef: "HEAD", candidateSha, productionSourceFingerprint: fingerprint }, task: { exactText: TASK_TEXT },
    baseline: { run1Passed: baseline.run1Passed, run2Passed: baseline.run2Passed, totalTests: baseline.totalTests, stableTestCount: baseline.stableTestCount, excludedFlakyTests: baseline.excludedFlakyTests },
    requirements: results,
    summary: { totalRequirements: results.length, defended, notDefended, unverified, build: build.ok && boot.ok ? "PASS" : "FAIL", tests: baseline.run1Passed && baseline.run2Passed ? "PASS" : "FAIL", proof: unverified ? "UNVERIFIED" : defended === results.length ? "PASS" : "FAIL" },
    executionTrace: events,
    metadata: { verifierVersion: "nemesis-core-v1", challengeProvider: "fixture-v1", adversaryPromptVersion: "fixture-prompt-v1", challengeCacheKey: key }
  };
  const reportFile = path.join(REPORT_ROOT, `${reportName}.json`);
  await writeReport(reportFile, report);
  await fs.copyFile(reportFile, path.join(ROOT, `demo/sample-${reportName}-report.json`));
  return report;
}

export function formatSummary(label: string, report: VerificationReport): string {
  const mark = (pass: boolean) => pass ? "✓" : "✕";
  return [label.toUpperCase(), "", `${mark(report.summary.build === "PASS")} BUILD`, `${mark(report.summary.tests === "PASS")} TESTS`, `${mark(report.summary.proof === "PASS")} PROOF`, "", ...report.requirements.map((r) => `${mark(r.verdict === "DEFENDED")} ${r.id} ${r.verdict}`), "", `${report.summary.defended} / ${report.summary.totalRequirements} requirements defended`].join("\n");
}
