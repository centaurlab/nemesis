import type { TraceEvent } from "../../lib/nemesis/types.js";

export type ReplayRequirementState = "QUEUED" | "CHALLENGING" | "DEFENDED" | "NOT_DEFENDED" | "UNVERIFIED";

export function replayDelayAfter(event: TraceEvent, reducedMotion: boolean): number {
  if (reducedMotion) return 24;
  if (event.stage === "requirement") return 420;
  if (event.stage === "score") return 240;
  if (event.stage === "baseline run #2") return 280;
  return 105;
}

export function requirementReplayState(trace: TraceEvent[], visibleCount: number, requirementId: string): ReplayRequirementState {
  const visible = trace.slice(0, visibleCount).filter((event) => event.requirementId === requirementId);
  const verdict = [...visible].reverse().find((event) => event.stage === "requirement");
  if (verdict?.message === "DEFENDED" || verdict?.message === "NOT_DEFENDED" || verdict?.message === "UNVERIFIED") return verdict.message;
  return visible.length > 0 ? "CHALLENGING" : "QUEUED";
}

export function traceOffset(trace: TraceEvent[], index: number): string {
  if (trace.length === 0 || !trace[index]) return "+0.000s";
  const start = Date.parse(trace[0].timestamp);
  const current = Date.parse(trace[index].timestamp);
  const elapsed = Number.isFinite(start) && Number.isFinite(current) ? Math.max(0, current - start) / 1000 : 0;
  return `+${elapsed.toFixed(3)}s`;
}

export function replayActivity(event?: TraceEvent): string {
  if (!event) return "Preparing recorded verification evidence";
  if (event.stage.startsWith("candidate") || event.stage.startsWith("baseline")) return "Confirming the candidate baseline";
  if (event.stage === "worktree") return `Preparing the adversarial implementation for ${event.requirementId ?? "the requirement"}`;
  if (event.stage.startsWith("witness")) return `Comparing required and counterfactual behavior for ${event.requirementId ?? "the requirement"}`;
  if (event.stage === "relevant tests") return `Testing whether the original suite catches the ${event.requirementId ?? "requirement"} violation`;
  if (event.stage === "score" || event.stage === "requirement") return `Recording the evidence verdict for ${event.requirementId ?? "the requirement"}`;
  return `Checking ${event.requirementId ? `${event.requirementId} · ` : ""}${event.stage}`;
}
