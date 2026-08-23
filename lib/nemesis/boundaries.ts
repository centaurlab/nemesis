import type { Counterfactual } from "./types.js";

export function assertCounterfactualProductionOnly(counterfactual: Counterfactual): void {
  if (counterfactual.files.some((file) => file.path.startsWith("tests/") || file.path.includes(".test.") || file.path.includes(".spec."))) {
    throw new Error("counterfactual-cannot-edit-candidate-tests");
  }
}

export function assertTestOnlyChanges(changedFiles: string[]): void {
  if (changedFiles.some((file) => file.startsWith("src/") || (!file.startsWith("tests/") && !file.startsWith("test/")))) {
    throw new Error("STRENGTHENING_VIOLATED_PRODUCTION_BOUNDARY");
  }
}
