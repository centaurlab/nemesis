import { describe, expect, it } from "vitest";
import { sevenDays } from "../src/app.js";
import { setup } from "./helpers.js";
describe("R2 strengthened proof", () => {
  it("rejects acceptance after day seven", () => { const { clock, service } = setup(); const invitation = service.invite("team-1", "admin-1", "a@x.test"); clock.advance(sevenDays + 24 * 60 * 60 * 1000); expect(() => service.accept(invitation.token, invitation.email, "u")).toThrowError("INVITE_EXPIRED"); });
});
