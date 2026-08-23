import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadVerificationReport } from "../ui/server/report-loader.js";
import { ROOT } from "../lib/nemesis/config.js";

const temporary: string[] = [];
afterEach(async () => { await Promise.all(temporary.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true }))); });

describe("Run 2 report loading", () => {
  it("loads and validates the real initial report", async () => {
    const result = await loadVerificationReport(path.join(ROOT, ".nemesis/reports"), "initial");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.report.summary.defended).toBe(2);
  });
  it("returns the required missing-report message", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "nemesis-ui-missing-")); temporary.push(dir);
    await expect(loadVerificationReport(dir, "initial")).resolves.toEqual({ ok: false, kind: "missing", message: "No verification reports found. Run npm run demo:all first." });
  });
  it("rejects invalid JSON without falling back", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "nemesis-ui-invalid-")); temporary.push(dir);
    await fs.writeFile(path.join(dir, "initial.json"), "{not-json");
    const result = await loadVerificationReport(dir, "initial");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe("Unable to render verification report.");
  });
});
