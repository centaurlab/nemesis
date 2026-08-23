import { describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { DEMO_REPO, ROOT } from "../lib/nemesis/config.js";
import { git } from "../lib/nemesis/git.js";
import { verify } from "../lib/nemesis/verifier.js";
import { resetDemo } from "../scripts/demo-reset.js";
import { strengthenDemo } from "../scripts/demo-strengthen.js";

describe("real deterministic Nemesis proof", () => {
  it("uses real worktrees and execution to move from 2/4 to 4/4", async () => {
    expect(await fs.stat(path.join(ROOT, "demo/template/.git")).then(() => true).catch(() => false)).toBe(false);
    const commits = await resetDemo();
    expect(await git(DEMO_REPO, ["status", "--porcelain"])).toBe("");
    const beforeStatus = await git(DEMO_REPO, ["status", "--porcelain"]);
    const initial = await verify("initial", DEMO_REPO);
    expect(initial.requirements.map((r) => [r.id, r.verdict])).toEqual([["R1", "DEFENDED"], ["R2", "NOT_DEFENDED"], ["R3", "NOT_DEFENDED"], ["R4", "DEFENDED"]]);
    expect(initial.summary.defended).toBe(2);
    expect(await git(DEMO_REPO, ["status", "--porcelain"])).toBe(beforeStatus);
    const strengthened = await strengthenDemo(DEMO_REPO);
    expect(strengthened.report.requirements.map((r) => r.verdict)).toEqual(["DEFENDED", "DEFENDED", "DEFENDED", "DEFENDED"]);
    expect(strengthened.report.summary.defended).toBe(4);
    expect(strengthened.fingerprintAfter).toBe(strengthened.fingerprintBefore);
    expect(strengthened.shaAfter).not.toBe(strengthened.shaBefore);
    expect(commits.candidateSha).toBe(strengthened.shaBefore);
    expect(await git(DEMO_REPO, ["status", "--porcelain"])).toBe("");
  });
});
