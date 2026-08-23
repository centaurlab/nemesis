import { describe, expect, it } from "vitest";
import type { TraceEvent } from "../lib/nemesis/types.js";
import { replayActivity, replayDelayAfter, requirementReplayState, traceOffset } from "../ui/src/replay-model.js";

const trace: TraceEvent[] = [
  { timestamp: "2026-01-01T00:00:00.000Z", stage: "baseline run #1", message: "passed", status: "PASS" },
  { timestamp: "2026-01-01T00:00:01.250Z", stage: "worktree", requirementId: "R1", message: "created", status: "PASS" },
  { timestamp: "2026-01-01T00:00:02.500Z", stage: "score", requirementId: "R1", message: "SURVIVED", status: "INFO" },
  { timestamp: "2026-01-01T00:00:02.550Z", stage: "requirement", requirementId: "R1", message: "NOT_DEFENDED", status: "INFO" }
];

describe("verification replay presentation model", () => {
  it("does not reveal a verdict before its recorded requirement event", () => {
    expect(requirementReplayState(trace, 1, "R1")).toBe("QUEUED");
    expect(requirementReplayState(trace, 3, "R1")).toBe("CHALLENGING");
    expect(requirementReplayState(trace, 4, "R1")).toBe("NOT_DEFENDED");
  });

  it("preserves recorded time offsets and describes actual stages", () => {
    expect(traceOffset(trace, 2)).toBe("+2.500s");
    expect(replayActivity(trace[1])).toBe("Preparing the adversarial implementation for R1");
  });

  it("uses visual delays only and respects reduced-motion preference", () => {
    expect(replayDelayAfter(trace[3], false)).toBe(420);
    expect(replayDelayAfter(trace[3], true)).toBe(24);
  });
});
