import { promises as fs } from "node:fs";
import path from "node:path";
import { DEMO_REPO, ROOT, VERIFICATION_ROOT } from "../lib/nemesis/config.js";
import { git } from "../lib/nemesis/git.js";

async function copyLayer(source: string, target: string) { await fs.cp(source, target, { recursive: true }); }

export async function resetDemo() {
  await fs.rm(path.dirname(DEMO_REPO), { recursive: true, force: true });
  await fs.mkdir(DEMO_REPO, { recursive: true });
  await copyLayer(path.join(ROOT, "demo/template/base"), DEMO_REPO);
  await git(DEMO_REPO, ["init", "-b", "main"]);
  await git(DEMO_REPO, ["config", "user.email", "nemesis@example.test"]); await git(DEMO_REPO, ["config", "user.name", "Nemesis Demo"]);
  await git(DEMO_REPO, ["add", "."]); await git(DEMO_REPO, ["commit", "-m", "chore: base team service"]);
  const baseSha = await git(DEMO_REPO, ["rev-parse", "HEAD"]);
  await copyLayer(path.join(ROOT, "demo/template/candidate"), DEMO_REPO);
  await git(DEMO_REPO, ["add", "."]); await git(DEMO_REPO, ["commit", "-m", "feat: add team invitations"]);
  const candidateSha = await git(DEMO_REPO, ["rev-parse", "HEAD"]);
  await fs.mkdir(VERIFICATION_ROOT, { recursive: true });
  if (await git(DEMO_REPO, ["status", "--porcelain"])) throw new Error("Demo reset left dirty repository");
  return { baseSha, candidateSha };
}

if (process.argv[1]?.endsWith("demo-reset.ts")) {
  const result = await resetDemo(); console.log(`Demo reset\nbase: ${result.baseSha}\ncandidate: ${result.candidateSha}\nrepo: ${DEMO_REPO}`);
}
