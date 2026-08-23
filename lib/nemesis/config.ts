import path from "node:path";
import type { Requirement } from "./types.js";

export const ROOT = path.resolve(import.meta.dirname, "../..");
export const DEMO_REPO = path.join(ROOT, "demo/.workdir/repo");
export const VERIFICATION_ROOT = path.join(ROOT, "demo/.workdir/verifications");
export const REPORT_ROOT = path.join(ROOT, ".nemesis/reports");
export const CACHE_ROOT = path.join(ROOT, ".nemesis/cache");
export const TASK_TEXT = "Add team invitations. Only admins can send invitations. An invitation expires exactly 7 days after it is issued. Resending an invitation must invalidate the previous token. The replacement invitation gets a new 7-day expiration window beginning at the resend time.";
export const REQUIREMENTS: Requirement[] = [
  { id: "R1", text: "Only admins can send invitations.", sourceQuote: "Only admins can send invitations." },
  { id: "R2", text: "Invitations expire exactly 7 days after issuance.", sourceQuote: "An invitation expires exactly 7 days after it is issued." },
  { id: "R3", text: "Resending invalidates the previous token.", sourceQuote: "Resending an invitation must invalidate the previous token." },
  { id: "R4", text: "The replacement invitation's 7-day expiration begins at resend time.", sourceQuote: "The replacement invitation gets a new 7-day expiration window beginning at the resend time." }
];
export const RELEVANT_FILES: Record<string, string[]> = {
  R1: ["tests/r1-admin.test.ts"],
  R2: ["tests/r2-expiry.test.ts"],
  R3: ["tests/r3-resend.test.ts"],
  R4: ["tests/r4-window.test.ts"]
};
export const ALL_TEST_FILES = [
  "tests/core.test.ts", "tests/r1-admin.test.ts", "tests/r2-expiry.test.ts",
  "tests/r3-resend.test.ts", "tests/r4-window.test.ts", "tests/general.test.ts"
];
