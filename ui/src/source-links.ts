export type SourceLink = { label: string; file: string; path: string; lines: string };

type RequirementSource = {
  implementation: SourceLink;
  counterfactual: SourceLink;
  witness: SourceLink;
  originalTest: SourceLink;
  strengthenedTest?: SourceLink;
};

const sources: Record<string, RequirementSource> = {
  R1: {
    implementation: { label: "Candidate implementation", file: "app.ts", path: "demo/template/candidate/src/app.ts", lines: "L28-L35" },
    counterfactual: { label: "Adversarial change", file: "fixtures.json", path: "demo/counterfactuals/fixtures.json", lines: "L2" },
    witness: { label: "Executable witness", file: "provider.ts", path: "lib/nemesis/provider.ts", lines: "L8-L16" },
    originalTest: { label: "Tests evaluated", file: "r1-admin.test.ts", path: "demo/template/candidate/tests/r1-admin.test.ts", lines: "L1-L8" }
  },
  R2: {
    implementation: { label: "Candidate implementation", file: "app.ts", path: "demo/template/candidate/src/app.ts", lines: "L46-L52" },
    counterfactual: { label: "Adversarial change", file: "fixtures.json", path: "demo/counterfactuals/fixtures.json", lines: "L3" },
    witness: { label: "Executable witness", file: "provider.ts", path: "lib/nemesis/provider.ts", lines: "L17-L22" },
    originalTest: { label: "Original tests evaluated", file: "r2-expiry.test.ts", path: "demo/template/candidate/tests/r2-expiry.test.ts", lines: "L1-L9" },
    strengthenedTest: { label: "Strengthened proof", file: "r2-after-expiry.test.ts", path: "demo/template/strengthened/tests/r2-after-expiry.test.ts", lines: "L1-L6" }
  },
  R3: {
    implementation: { label: "Candidate implementation", file: "app.ts", path: "demo/template/candidate/src/app.ts", lines: "L36-L45" },
    counterfactual: { label: "Adversarial change", file: "fixtures.json", path: "demo/counterfactuals/fixtures.json", lines: "L4" },
    witness: { label: "Executable witness", file: "provider.ts", path: "lib/nemesis/provider.ts", lines: "L23-L28" },
    originalTest: { label: "Original tests evaluated", file: "r3-resend.test.ts", path: "demo/template/candidate/tests/r3-resend.test.ts", lines: "L1-L7" },
    strengthenedTest: { label: "Strengthened proof", file: "r3-old-token.test.ts", path: "demo/template/strengthened/tests/r3-old-token.test.ts", lines: "L1-L5" }
  },
  R4: {
    implementation: { label: "Candidate implementation", file: "app.ts", path: "demo/template/candidate/src/app.ts", lines: "L36-L45" },
    counterfactual: { label: "Adversarial change", file: "fixtures.json", path: "demo/counterfactuals/fixtures.json", lines: "L5" },
    witness: { label: "Executable witness", file: "provider.ts", path: "lib/nemesis/provider.ts", lines: "L29-L34" },
    originalTest: { label: "Tests evaluated", file: "r4-window.test.ts", path: "demo/template/candidate/tests/r4-window.test.ts", lines: "L1-L7" }
  }
};

const verifier: SourceLink = { label: "Verification engine", file: "verifier.ts", path: "lib/nemesis/verifier.ts", lines: "L39-L135" };
const repository = "https://github.com/centaurlab/nemesis";

export function requirementSourceLinks(requirementId: string, strengthened: boolean, commit: string): Array<SourceLink & { url: string }> {
  const source = sources[requirementId];
  if (!source) return [];
  const selected = [source.implementation, source.counterfactual, source.witness, source.originalTest];
  if (strengthened && source.strengthenedTest) selected.push(source.strengthenedTest);
  selected.push(verifier);
  return selected.map((item) => ({ ...item, url: `${repository}/blob/${commit}/${item.path}#${item.lines}` }));
}

export function sourceCommitUrl(commit: string): string { return `${repository}/commit/${commit}`; }
