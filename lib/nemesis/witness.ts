export type WitnessObservation = "EXPECTED" | "COUNTERFACTUAL" | "HARNESS_FAILURE";
export function confirmWitness(trueObservation: WitnessObservation, counterfactualObservation: WitnessObservation) {
  if (trueObservation !== "EXPECTED") return { confirmed: false, diagnostic: "witness-failed-on-true-implementation" as const, possibleImplementationViolation: true };
  return { confirmed: counterfactualObservation === "COUNTERFACTUAL", diagnostic: counterfactualObservation === "COUNTERFACTUAL" ? undefined : "witness-not-confirmed" as const, possibleImplementationViolation: false };
}
