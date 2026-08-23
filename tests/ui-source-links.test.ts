import { describe, expect, it } from "vitest";
import { requirementSourceLinks, sourceCommitUrl } from "../ui/src/source-links.js";

const commit = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("verification source links", () => {
  it("pins every source reference to an immutable repository commit", () => {
    const links = requirementSourceLinks("R1", false, commit);
    expect(links).toHaveLength(5);
    expect(links.every((link) => link.url.startsWith(`https://github.com/centaurlab/nemesis/blob/${commit}/`))).toBe(true);
    expect(sourceCommitUrl(commit)).toBe(`https://github.com/centaurlab/nemesis/commit/${commit}`);
  });

  it("shows strengthened proof only on the strengthened report", () => {
    expect(requirementSourceLinks("R2", false, commit).some((link) => link.label === "Strengthened proof")).toBe(false);
    expect(requirementSourceLinks("R2", true, commit).find((link) => link.label === "Strengthened proof")?.path).toBe("demo/template/strengthened/tests/r2-after-expiry.test.ts");
  });
});
