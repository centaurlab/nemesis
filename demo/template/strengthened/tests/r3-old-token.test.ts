import { describe, expect, it } from "vitest";
import { setup } from "./helpers.js";
describe("R3 strengthened proof", () => {
  it("rejects the original token after resend", () => { const { service } = setup(); const original = service.invite("team-1", "admin-1", "a@x.test"); service.resend("team-1", "admin-1", original.token); expect(() => service.accept(original.token, original.email, "u")).toThrowError("INVITE_INVALID"); });
});
