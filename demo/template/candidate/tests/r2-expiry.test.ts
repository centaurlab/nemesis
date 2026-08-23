import { describe, expect, it } from "vitest";
import { sevenDays } from "../src/app.js";
import { setup } from "./helpers.js";
describe("R2 invitation lifecycle", () => {
  it("sets issuance expiry exactly seven days later", () => { const { clock, service } = setup(); const invite = service.invite("team-1", "admin-1", "a@x.test"); expect(invite.expiresAt).toBe(clock.now() + sevenDays); });
  it("accepts before expiry", () => { const { clock, service } = setup(); const invite = service.invite("team-1", "admin-1", "a@x.test"); clock.advance(sevenDays - 1); expect(service.accept(invite.token, "a@x.test", "new-user")).toBe("INVITE_ACCEPTED"); });
  it("binds the token to its email", () => { const { service } = setup(); const invite = service.invite("team-1", "admin-1", "a@x.test"); expect(() => service.accept(invite.token, "wrong@x.test", "new-user")).toThrowError("INVITE_INVALID"); });
  it("cannot accept the same invitation twice", () => { const { service } = setup(); const invite = service.invite("team-1", "admin-1", "a@x.test"); service.accept(invite.token, "a@x.test", "u1"); expect(() => service.accept(invite.token, "a@x.test", "u2")).toThrowError("INVITE_INVALID"); });
});
