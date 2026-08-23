import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { loadVerificationReport, type ReportName } from "./server/report-loader.js";

const projectRoot = path.resolve(import.meta.dirname, "..");
const reportsRoot = path.join(projectRoot, ".nemesis/reports");

function reportApi(): Plugin {
  const middleware = async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    const match = request.url?.match(/^\/api\/reports\/(initial|strengthened)(?:\?.*)?$/);
    if (!match) return next();
    const result = await loadVerificationReport(reportsRoot, match[1] as ReportName);
    response.statusCode = result.ok ? 200 : result.kind === "missing" ? 404 : 422;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store, max-age=0");
    response.end(JSON.stringify(result));
  };
  return {
    name: "nemesis-dynamic-report-api",
    configureServer: (server) => { server.middlewares.use(middleware); },
    configurePreviewServer: (server) => { server.middlewares.use(middleware); }
  };
}

export default defineConfig({
  root: import.meta.dirname,
  plugins: [react(), reportApi()],
  build: { outDir: path.join(projectRoot, "dist/ui"), emptyOutDir: true },
  server: { host: "127.0.0.1", port: 4173, strictPort: true, fs: { allow: [projectRoot] } },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true }
});
