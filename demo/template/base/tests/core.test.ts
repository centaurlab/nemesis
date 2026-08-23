import { describe, expect, it } from "vitest";
import { membershipKey } from "../src/core.js";
describe("existing team behavior", () => {
  it("creates stable membership keys", () => expect(membershipKey("team-1", "user-1")).toBe("team-1:user-1"));
});
