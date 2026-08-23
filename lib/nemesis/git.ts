import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
const exec = promisify(execFile);

export async function git(repo: string, args: string[]): Promise<string> {
  const { stdout } = await exec("git", args, { cwd: repo, maxBuffer: 10_000_000 });
  return stdout.trim();
}
export async function createWorktree(repo: string, target: string, sha: string): Promise<void> {
  await fs.mkdir(path.dirname(target), { recursive: true });
  await git(repo, ["worktree", "add", "--detach", target, sha]);
}
export async function removeWorktree(repo: string, target: string): Promise<void> {
  await git(repo, ["worktree", "remove", "--force", target]).catch(() => undefined);
  await fs.rm(target, { recursive: true, force: true });
  await git(repo, ["worktree", "prune"]);
}
