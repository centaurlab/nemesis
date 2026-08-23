import { promises as fs } from "node:fs";
import path from "node:path";
import { DEMO_REPO, ROOT } from "../lib/nemesis/config.js";
import { productionFiles, productionFingerprint } from "../lib/nemesis/fingerprint.js";
import { git } from "../lib/nemesis/git.js";
import { runVitest } from "../lib/nemesis/runner.js";
import { formatSummary, verify } from "../lib/nemesis/verifier.js";
import { assertTestOnlyChanges } from "../lib/nemesis/boundaries.js";

export async function strengthenDemo(repo = DEMO_REPO) {
  const fingerprintBefore = await productionFingerprint(repo), shaBefore = await git(repo, ["rev-parse", "HEAD"]);
  await fs.cp(path.join(ROOT, "demo/template/strengthened"), repo, { recursive: true });
  const changed = (await git(repo, ["status", "--porcelain"])).split("\n").filter(Boolean).map((line) => line.slice(3));
  await productionFiles(repo);
  assertTestOnlyChanges(changed);
  const suite = await runVitest(repo);
  if (!suite.passed) throw new Error("Strengthened true-implementation suite failed");
  const fingerprintAfter = await productionFingerprint(repo);
  if (fingerprintAfter !== fingerprintBefore) throw new Error("STRENGTHENING_VIOLATED_PRODUCTION_BOUNDARY");
  await git(repo, ["add", "tests"]); await git(repo, ["commit", "-m", "test: strengthen Nemesis verification"]);
  const shaAfter = await git(repo, ["rev-parse", "HEAD"]);
  if (shaAfter === shaBefore) throw new Error("Strengthening did not change candidate SHA");
  const report = await verify("strengthened", repo);
  return { report, fingerprintBefore, fingerprintAfter, shaBefore, shaAfter };
}

if (process.argv[1]?.endsWith("demo-strengthen.ts")) {
  const result = await strengthenDemo();
  console.log(formatSummary("STRENGTHENED", result.report));
  console.log(`\nproduction fingerprint before: ${result.fingerprintBefore}\nproduction fingerprint after:  ${result.fingerprintAfter}\ncandidate before: ${result.shaBefore}\ncandidate after:  ${result.shaAfter}`);
  if (result.report.summary.defended !== 4) process.exitCode = 1;
}
