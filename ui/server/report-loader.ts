import { readFile } from "node:fs/promises";
import path from "node:path";
import { ZodError } from "zod";
import { verificationReportSchema } from "../../lib/nemesis/schemas.js";
import type { VerificationReport } from "../../lib/nemesis/types.js";

export type ReportName = "initial" | "strengthened";
export type ReportLoadResult =
  | { ok: true; report: VerificationReport }
  | { ok: false; kind: "missing" | "invalid"; message: string; details?: string[] };

export async function loadVerificationReport(reportsRoot: string, name: ReportName): Promise<ReportLoadResult> {
  const reportPath = path.join(reportsRoot, `${name}.json`);
  let source: string;
  try {
    source = await readFile(reportPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { ok: false, kind: "missing", message: "No verification reports found. Run npm run demo:all first." };
    }
    return { ok: false, kind: "invalid", message: "Unable to render verification report." };
  }

  try {
    const report = verificationReportSchema.parse(JSON.parse(source)) as VerificationReport;
    return { ok: true, report };
  } catch (error) {
    const details = error instanceof ZodError
      ? error.issues.map((issue) => `${issue.path.join(".") || "report"}: ${issue.message}`)
      : [error instanceof Error ? error.message : "Unknown report validation error"];
    return { ok: false, kind: "invalid", message: "Unable to render verification report.", details };
  }
}
