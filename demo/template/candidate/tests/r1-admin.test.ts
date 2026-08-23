import { describe, expect, it } from "vitest";
import { DomainError } from "../src/app.js";
import { setup } from "./helpers.js";
describe("R1 admin authorization", () => {
  it("allows an admin to invite", () => expect(setup().service.invite("team-1", "admin-1", "a@x.test").token).toBeTruthy());
  it("rejects a normal member and creates nothing", () => { const { service } = setup(); expect(() => service.invite("team-1", "member-1", "a@x.test")).toThrowError(new DomainError("FORBIDDEN")); expect(service.invitationCount()).toBe(0); });
  it("rejects a user outside the team", () => expect(() => setup().service.invite("team-1", "stranger", "a@x.test")).toThrowError(new DomainError("FORBIDDEN")));
});
