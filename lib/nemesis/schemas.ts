import { z } from "zod";

const status = z.enum(["RUNNING", "PASS", "FAIL", "INFO"]);
const counterfactual = z.object({
  id: z.string(), description: z.string(), validity: z.enum(["VALID", "INVALID"]),
  invalidReason: z.string().optional(), gapMessage: z.string().optional(), score: z.enum(["KILLED", "SURVIVED", "INVALID"]).optional(),
  witness: z.object({ scenario: z.string(), expectedBehavior: z.string(), counterfactualBehavior: z.string(), confirmed: z.boolean() }).optional(),
  diagnostics: z.object({ witnessFailedOnTrueImplementation: z.boolean().optional(), possibleImplementationViolation: z.boolean().optional() }).optional(),
  killedByTests: z.array(z.string()).optional(), stableRelevantTestsRun: z.array(z.string()).optional(), stableUnrelatedTestsRun: z.array(z.string()).optional()
});
export const verificationReportSchema = z.object({
  schemaVersion: z.string(), id: z.string(), createdAt: z.string(),
  repo: z.object({ path: z.string(), baseRef: z.string(), candidateRef: z.string(), candidateSha: z.string(), productionSourceFingerprint: z.string() }),
  task: z.object({ exactText: z.string() }),
  baseline: z.object({ run1Passed: z.boolean(), run2Passed: z.boolean(), totalTests: z.number(), stableTestCount: z.number(), excludedFlakyTests: z.array(z.string()) }),
  requirements: z.array(z.object({ id: z.string(), text: z.string(), sourceQuote: z.string(), verdict: z.enum(["DEFENDED", "NOT_DEFENDED", "UNVERIFIED"]), counterfactuals: z.array(counterfactual) })),
  summary: z.object({ totalRequirements: z.number(), defended: z.number(), notDefended: z.number(), unverified: z.number(), build: z.enum(["PASS", "FAIL"]), tests: z.enum(["PASS", "FAIL"]), proof: z.enum(["PASS", "FAIL", "UNVERIFIED"]) }),
  executionTrace: z.array(z.object({ timestamp: z.string(), stage: z.string(), requirementId: z.string().optional(), counterfactualId: z.string().optional(), message: z.string(), status })),
  metadata: z.object({ verifierVersion: z.string(), challengeProvider: z.string(), adversaryPromptVersion: z.string(), challengeCacheKey: z.string() })
});
