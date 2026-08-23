import { promises as fs } from "node:fs";
import path from "node:path";
import { verificationReportSchema } from "./schemas.js";
import type { VerificationReport } from "./types.js";

export async function writeReport(file: string, report: VerificationReport): Promise<void> {
  verificationReportSchema.parse(report);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(report, null, 2) + "\n");
}
