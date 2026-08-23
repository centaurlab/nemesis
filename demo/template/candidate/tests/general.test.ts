import { describe, expect, it } from "vitest";
import { Clock, TeamService } from "../src/app.js";
import { setup } from "./helpers.js";
describe("general team and invitation behavior", () => {
  it("returns stored roles", () => expect(setup().service.role("team-1", "member-1")).toBe("member"));
  it("acceptance adds team membership", () => { const { service } = setup(); const a = service.invite("team-1", "admin-1", "a@x.test"); service.accept(a.token, a.email, "new-user"); expect(service.role("team-1", "new-user")).toBe("member"); });
  it("rejects an unknown token", () => expect(() => setup().service.accept("missing", "a@x.test", "u")).toThrowError("INVITE_INVALID"));
  it("keeps teams isolated", () => { const s = new TeamService(new Clock(0)); s.addMember("a", "admin", "admin"); expect(s.role("b", "admin")).toBeUndefined(); });
  it("uses deterministic sequential tokens", () => { const { service } = setup(); expect(service.invite("team-1", "admin-1", "a@x.test").token).toBe("token-1"); expect(service.invite("team-1", "admin-1", "b@x.test").token).toBe("token-2"); });
});
