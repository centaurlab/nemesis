export type RequirementVerdict = "DEFENDED" | "NOT_DEFENDED" | "UNVERIFIED";
export type ChallengeScore = "KILLED" | "SURVIVED" | "INVALID";

export type Requirement = { id: string; text: string; sourceQuote: string };
export type Counterfactual = {
  id: string;
  targetRequirementId: string;
  description: string;
  files: Array<{ path: string; content: string }>;
  witness: {
    scenario: string;
    expectedBehavior: string;
    counterfactualBehavior: string;
    testPath: string;
    testSource: string;
  };
};

export type TestOutcome = { id: string; status: "passed" | "failed" | "skipped" };
export type TestRun = { passed: boolean; tests: TestOutcome[]; stdout: string; stderr: string };
export type BaselineResult = {
  run1Passed: boolean;
  run2Passed: boolean;
  totalTests: number;
  stableTestCount: number;
  stableTests: string[];
  excludedFlakyTests: string[];
};

export type CounterfactualResult = {
  id: string;
  description: string;
  validity: "VALID" | "INVALID";
  invalidReason?: string;
  gapMessage?: string;
  score?: ChallengeScore;
  witness?: {
    scenario: string;
    expectedBehavior: string;
    counterfactualBehavior: string;
    confirmed: boolean;
  };
  diagnostics?: {
    witnessFailedOnTrueImplementation?: boolean;
    possibleImplementationViolation?: boolean;
  };
  killedByTests?: string[];
  stableRelevantTestsRun?: string[];
  stableUnrelatedTestsRun?: string[];
};

export type TraceEvent = {
  timestamp: string;
  stage: string;
  requirementId?: string;
  counterfactualId?: string;
  message: string;
  status: "RUNNING" | "PASS" | "FAIL" | "INFO";
};

export type VerificationReport = {
  schemaVersion: string;
  id: string;
  createdAt: string;
  repo: {
    path: string;
    baseRef: string;
    candidateRef: string;
    candidateSha: string;
    productionSourceFingerprint: string;
  };
  task: { exactText: string };
  baseline: Omit<BaselineResult, "stableTests">;
  requirements: Array<Requirement & { verdict: RequirementVerdict; counterfactuals: CounterfactualResult[] }>;
  summary: {
    totalRequirements: number;
    defended: number;
    notDefended: number;
    unverified: number;
    build: "PASS" | "FAIL";
    tests: "PASS" | "FAIL";
    proof: "PASS" | "FAIL" | "UNVERIFIED";
  };
  executionTrace: TraceEvent[];
  metadata: {
    verifierVersion: string;
    challengeProvider: string;
    adversaryPromptVersion: string;
    challengeCacheKey: string;
  };
};

export interface ChallengeProvider {
  getCounterfactual(requirement: Requirement, productionSource: string): Promise<Counterfactual>;
}
