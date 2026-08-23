import { DEMO_REPO } from "../lib/nemesis/config.js";
import { formatSummary, verify } from "../lib/nemesis/verifier.js";
const report = await verify("initial", DEMO_REPO);
console.log(formatSummary("INITIAL", report));
if (report.summary.defended !== 2 || report.summary.totalRequirements !== 4) process.exitCode = 1;
