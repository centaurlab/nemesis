import { describe, expect, it } from "vitest";
import type { VerificationReport } from "../lib/nemesis/types.js";
import { strengtheningEvidence } from "../ui/src/strengthening-model.js";

function report(verdict: "NOT_DEFENDED" | "DEFENDED", tests: string[], killedByTests: string[] = []): VerificationReport {
  return {
    requirements: [{ id: "R2", text: "Invitations expire after seven days.", verdict, counterfactuals: [{ id: "R2-C1", description: "Expired invitations remain acceptable.", validity: "VALID", score: verdict === "DEFENDED" ? "KILLED" : "SURVIVED", gapMessage: verdict === "NOT_DEFENDED" ? "Missing expiry boundary proof" : undefined, stableRelevantTestsRun: tests, killedByTests }], sourceQuote: "expiry" }]
  } as unknown as VerificationReport;
}

describe("strengthening replay evidence", () => {
  it("derives newly added proof from the report delta", () => {
    const items = strengtheningEvidence(report("NOT_DEFENDED", ["original test"]), report("DEFENDED", ["new boundary test", "original test"], ["new boundary test"]));
    expect(items).toEqual([{ id: "R2", requirement: "Invitations expire after seven days.", gap: "Missing expiry boundary proof", addedTests: ["new boundary test"] }]);
  });

  it("does not claim strengthening for requirements that remain unproven", () => {
    expect(strengtheningEvidence(report("NOT_DEFENDED", ["original test"]), report("NOT_DEFENDED", ["original test"]))).toEqual([]);
  });
});
