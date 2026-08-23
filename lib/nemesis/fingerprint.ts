import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]))).flat();
}

export async function productionFiles(repo: string): Promise<string[]> {
  const src = path.join(repo, "src");
  return (await walk(src)).filter((file) => /\.(ts|tsx|js|jsx)$/.test(file) && !file.includes(".test.") && !file.includes("__fixtures__"))
    .map((file) => path.relative(repo, file).split(path.sep).join("/"))
    .sort();
}

export async function productionFingerprint(repo: string): Promise<string> {
  const hash = createHash("sha256");
  for (const file of await productionFiles(repo)) hash.update(file).update("\0").update(await fs.readFile(path.join(repo, file))).update("\0");
  return hash.digest("hex");
}

export function challengeCacheKey(task: string, fingerprint: string, promptVersion = "fixture-prompt-v1", model = "fixture-v1"): string {
  return createHash("sha256").update(task).update("\0").update(fingerprint).update("\0").update(promptVersion).update("\0").update(model).digest("hex");
}
