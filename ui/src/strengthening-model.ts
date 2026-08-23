import type { VerificationReport } from "../../lib/nemesis/types.js";

export type StrengtheningEvidence = {
  id: string;
  requirement: string;
  gap: string;
  addedTests: string[];
};

export function strengtheningEvidence(initial: VerificationReport, strengthened: VerificationReport): StrengtheningEvidence[] {
  return initial.requirements
    .filter((requirement) => requirement.verdict !== "DEFENDED")
    .flatMap((requirement) => {
      const strengthenedRequirement = strengthened.requirements.find((candidate) => candidate.id === requirement.id);
      if (!strengthenedRequirement || strengthenedRequirement.verdict !== "DEFENDED") return [];
      const initialCounterfactual = requirement.counterfactuals[0];
      const strengthenedCounterfactual = strengthenedRequirement.counterfactuals[0];
      const originalTests = new Set(initialCounterfactual?.stableRelevantTestsRun ?? []);
      const addedTests = (strengthenedCounterfactual?.stableRelevantTestsRun ?? []).filter((test) => !originalTests.has(test));
      return [{
        id: requirement.id,
        requirement: requirement.text,
        gap: initialCounterfactual?.gapMessage ?? "Missing requirement-level proof",
        addedTests: addedTests.length > 0 ? addedTests : (strengthenedCounterfactual?.killedByTests ?? [])
      }];
    });
}
