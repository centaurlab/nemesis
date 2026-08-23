import { describe, expect, it } from "vitest";
import { setup } from "./helpers.js";
describe("R3 resend mechanics", () => {
  it("produces a new token", () => { const { service } = setup(); const a = service.invite("team-1", "admin-1", "a@x.test"); const b = service.resend("team-1", "admin-1", a.token); expect(b.token).not.toBe(a.token); });
  it("preserves the recipient", () => { const { service } = setup(); const a = service.invite("team-1", "admin-1", "a@x.test"); expect(service.resend("team-1", "admin-1", a.token).email).toBe(a.email); });
  it("rejects resend of an unknown token", () => expect(() => setup().service.resend("team-1", "admin-1", "missing")).toThrowError("INVITE_INVALID"));
});
