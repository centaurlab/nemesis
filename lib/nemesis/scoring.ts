import type { ChallengeScore, RequirementVerdict } from "./types.js";

export function scoreRequirement(scores: ChallengeScore[]): RequirementVerdict {
  const valid = scores.filter((score) => score !== "INVALID");
  if (valid.length === 0) return "UNVERIFIED";
  if (valid.includes("SURVIVED")) return "NOT_DEFENDED";
  return "DEFENDED";
}
