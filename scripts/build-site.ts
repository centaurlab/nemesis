import { promises as fs } from "node:fs";
import path from "node:path";
import { ROOT, REPORT_ROOT } from "../lib/nemesis/config.js";
import { verificationReportSchema } from "../lib/nemesis/schemas.js";
import type { VerificationReport } from "../lib/nemesis/types.js";

async function readReport(name: "initial" | "strengthened"): Promise<VerificationReport> {
  const source = await fs.readFile(path.join(REPORT_ROOT, `${name}.json`), "utf8");
  return verificationReportSchema.parse(JSON.parse(source)) as VerificationReport;
}

export async function stageSiteBuild(): Promise<void> {
  const initial = await readReport("initial");
  const strengthened = await readReport("strengthened");
  const dist = path.join(ROOT, "dist");
  const uiBuild = path.join(dist, "ui");
  const client = path.join(dist, "client");
  const server = path.join(dist, "server");

  await fs.rm(client, { recursive: true, force: true });
  await fs.rm(server, { recursive: true, force: true });
  await fs.mkdir(client, { recursive: true });
  await fs.mkdir(server, { recursive: true });
  await fs.cp(uiBuild, client, { recursive: true });

  const embedded = JSON.stringify({ initial, strengthened });
  const worker = `const reports = ${embedded};

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store, max-age=0"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const reportMatch = url.pathname.match(/^\\/api\\/reports\\/(initial|strengthened)$/);
    if (reportMatch) {
      return new Response(JSON.stringify({ ok: true, report: reports[reportMatch[1]] }), { headers: jsonHeaders });
    }

    if (url.pathname === "/" || url.pathname === "/initial" || url.pathname === "/strengthened") {
      const indexUrl = new URL("/index.html", url);
      return env.ASSETS.fetch(new Request(indexUrl, request));
    }

    return env.ASSETS.fetch(request);
  }
};
`;
  await fs.writeFile(path.join(server, "index.js"), worker);
  console.log(`Sites build staged with initial ${initial.repo.candidateSha.slice(0, 12)} and strengthened ${strengthened.repo.candidateSha.slice(0, 12)}.`);
}

if (process.argv[1]?.endsWith("build-site.ts")) await stageSiteBuild();
