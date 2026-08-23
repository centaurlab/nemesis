import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ROOT } from "./config.js";
import type { TestOutcome, TestRun } from "./types.js";

export async function runProcess(command: string, args: string[], cwd: string): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env: { ...process.env, CI: "1" } });
    let stdout = "", stderr = "";
    child.stdout.on("data", (chunk) => stdout += chunk);
    child.stderr.on("data", (chunk) => stderr += chunk);
    child.on("close", (code) => resolve({ ok: code === 0, stdout, stderr }));
    child.on("error", (error) => resolve({ ok: false, stdout, stderr: stderr + error.message }));
  });
}

export async function runTypecheck(cwd: string) {
  return runProcess(process.execPath, [path.join(ROOT, "node_modules/typescript/bin/tsc"), "--noEmit", "-p", "tsconfig.json"], cwd);
}
export async function runBoot(cwd: string) {
  return runProcess(process.execPath, [path.join(ROOT, "node_modules/tsx/dist/cli.mjs"), "src/smoke.ts"], cwd);
}
export async function runVitest(cwd: string, files: string[] = []): Promise<TestRun> {
  const output = path.join(cwd, `.vitest-${randomUUID()}.json`);
  const args = [path.join(ROOT, "node_modules/vitest/vitest.mjs"), "--run", "--reporter=json", `--outputFile=${output}`, ...files];
  const processResult = await runProcess(process.execPath, args, cwd);
  let tests: TestOutcome[] = [];
  try {
    const parsed = JSON.parse(await fs.readFile(output, "utf8")) as { testResults?: Array<{ assertionResults?: Array<{ fullName?: string; title?: string; status: string }> }> };
    tests = (parsed.testResults ?? []).flatMap((suite) => (suite.assertionResults ?? []).map((item) => ({
      id: item.fullName ?? item.title ?? "unknown",
      status: item.status === "passed" ? "passed" : item.status === "pending" ? "skipped" : "failed"
    })));
  } finally { await fs.rm(output, { force: true }); }
  return { passed: processResult.ok && tests.every((test) => test.status !== "failed"), tests, stdout: processResult.stdout, stderr: processResult.stderr };
}
