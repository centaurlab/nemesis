import { promises as fs } from "node:fs";
import path from "node:path";
import { ROOT } from "./config.js";
import type { ChallengeProvider, Counterfactual, Requirement } from "./types.js";

type Fixture = { id: string; targetRequirementId: string; description: string; find: string; replace: string };

const witnessCases: Record<string, Counterfactual["witness"]> = {
  R1: {
    scenario: "A non-admin team member attempts to send an invitation.", expectedBehavior: "FORBIDDEN and no invitation is created.", counterfactualBehavior: "Invitation is successfully created.", testPath: "tests/.nemesis-witness.test.ts",
    testSource: `import { describe, expect, it } from "vitest"; import { setup } from "./helpers.js";
describe("R1 executable witness", () => {
 it("[expected] rejects member", () => { const {service}=setup(); expect(() => service.invite("team-1","member-1","w@x.test")).toThrowError("FORBIDDEN"); expect(service.invitationCount()).toBe(0); });
 it("[counterfactual] permits member", () => { const {service}=setup(); expect(service.invite("team-1","member-1","w@x.test").token).toBeTruthy(); });
});\n`
  },
  R2: {
    scenario: "Create at T0 and accept at T0 + 8 days.", expectedBehavior: "INVITE_EXPIRED", counterfactualBehavior: "INVITE_ACCEPTED", testPath: "tests/.nemesis-witness.test.ts",
    testSource: `import { describe, expect, it } from "vitest"; import { sevenDays } from "../src/app.js"; import { setup } from "./helpers.js";
const act=()=>{const {clock,service}=setup();const x=service.invite("team-1","admin-1","w@x.test");clock.advance(sevenDays+86400000);return ()=>service.accept(x.token,x.email,"u")};
describe("R2 executable witness", () => { it("[expected] expires",()=>expect(act()).toThrowError("INVITE_EXPIRED")); it("[counterfactual] accepts",()=>expect(act()()).toBe("INVITE_ACCEPTED")); });\n`
  },
  R3: {
    scenario: "Create token A, resend for token B, then attempt acceptance with token A.", expectedBehavior: "INVITE_INVALID", counterfactualBehavior: "INVITE_ACCEPTED", testPath: "tests/.nemesis-witness.test.ts",
    testSource: `import { describe, expect, it } from "vitest"; import { setup } from "./helpers.js";
const act=()=>{const {service}=setup();const a=service.invite("team-1","admin-1","w@x.test");service.resend("team-1","admin-1",a.token);return ()=>service.accept(a.token,a.email,"u")};
describe("R3 executable witness", () => { it("[expected] invalidates old",()=>expect(act()).toThrowError("INVITE_INVALID")); it("[counterfactual] accepts old",()=>expect(act()()).toBe("INVITE_ACCEPTED")); });\n`
  },
  R4: {
    scenario: "Create at T0 and resend at T0 + 3 days.", expectedBehavior: "Replacement expires at T0 + 10 days.", counterfactualBehavior: "Replacement expires at T0 + 7 days.", testPath: "tests/.nemesis-witness.test.ts",
    testSource: `import { describe, expect, it } from "vitest"; import { sevenDays } from "../src/app.js"; import { setup } from "./helpers.js";
const expiries=()=>{const {clock,service}=setup();const a=service.invite("team-1","admin-1","w@x.test");clock.advance(3*86400000);const now=clock.now();const b=service.resend("team-1","admin-1",a.token);return {a,b,now}};
describe("R4 executable witness", () => { it("[expected] resets window",()=>{const {b,now}=expiries();expect(b.expiresAt).toBe(now+sevenDays)}); it("[counterfactual] retains original",()=>{const {a,b}=expiries();expect(b.expiresAt).toBe(a.expiresAt)}); });\n`
  }
};

export class FixtureChallengeProvider implements ChallengeProvider {
  async getCounterfactual(requirement: Requirement, productionSource: string): Promise<Counterfactual> {
    const fixtures = JSON.parse(await fs.readFile(path.join(ROOT, "demo/counterfactuals/fixtures.json"), "utf8")) as Fixture[];
    const fixture = fixtures.find((item) => item.targetRequirementId === requirement.id);
    if (!fixture || !productionSource.includes(fixture.find)) throw new Error(`Missing fixture for ${requirement.id}`);
    return { id: fixture.id, targetRequirementId: requirement.id, description: fixture.description, files: [{ path: "src/app.ts", content: productionSource.replace(fixture.find, fixture.replace) }], witness: witnessCases[requirement.id] };
  }
}
