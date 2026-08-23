import { describe, expect, it } from "vitest";
import { sevenDays } from "../src/app.js";
import { setup } from "./helpers.js";
describe("R4 replacement expiration window", () => {
  it("starts a fresh seven-day window at resend", () => { const { clock, service } = setup(); const a = service.invite("team-1", "admin-1", "a@x.test"); clock.advance(3 * 24 * 60 * 60 * 1000); const b = service.resend("team-1", "admin-1", a.token); expect(b.expiresAt).toBe(clock.now() + sevenDays); });
  it("accepts replacement after the original window would end", () => { const { clock, service } = setup(); const a = service.invite("team-1", "admin-1", "a@x.test"); clock.advance(3 * 24 * 60 * 60 * 1000); const b = service.resend("team-1", "admin-1", a.token); clock.advance(5 * 24 * 60 * 60 * 1000); expect(service.accept(b.token, "a@x.test", "u")).toBe("INVITE_ACCEPTED"); });
});
