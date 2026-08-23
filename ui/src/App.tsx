import { useEffect, useMemo, useState } from "react";
import type { CounterfactualResult, TraceEvent, VerificationReport } from "../../lib/nemesis/types.js";

type Phase = "comfort" | "initial" | "strengthened";
type LoadedReports = { initial: VerificationReport; strengthened: VerificationReport };
const phasePath: Record<Phase, string> = { comfort: "/", initial: "/initial", strengthened: "/strengthened" };

function phaseFromPath(): Phase {
  if (window.location.pathname === "/initial") return "initial";
  if (window.location.pathname === "/strengthened") return "strengthened";
  return "comfort";
}

async function fetchReport(name: "initial" | "strengthened"): Promise<VerificationReport> {
  const response = await fetch(`/api/reports/${name}?fresh=${Date.now()}`, { cache: "no-store" });
  const result = await response.json() as { ok: boolean; report?: VerificationReport; message?: string; details?: string[] };
  if (!result.ok || !result.report) {
    const error = new Error(result.message ?? "Unable to render verification report.");
    Object.assign(error, { details: result.details });
    throw error;
  }
  return result.report;
}

export function App() {
  const [phase, setPhase] = useState<Phase>(phaseFromPath);
  const [reports, setReports] = useState<LoadedReports | null>(null);
  const [error, setError] = useState<{ message: string; details?: string[] } | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([fetchReport("initial"), fetchReport("strengthened")])
      .then(([initial, strengthened]) => active && setReports({ initial, strengthened }))
      .catch((cause: Error & { details?: string[] }) => active && setError({ message: cause.message, details: cause.details }));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const pop = () => setPhase(phaseFromPath());
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);

  const navigate = (next: Phase) => {
    window.history.pushState({}, "", phasePath[next]);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPhase(next);
  };

  if (error) return <ErrorState {...error} />;
  if (!reports) return <LoadingState />;

  return (
    <div className="app-shell">
      <Header phase={phase} navigate={navigate} />
      {phase === "comfort" && <FalseComfort report={reports.initial} onVerify={() => navigate("initial")} />}
      {phase === "initial" && <ReportView report={reports.initial} kind="initial" onNext={() => navigate("strengthened")} onReset={() => navigate("comfort")} />}
      {phase === "strengthened" && <ReportView report={reports.strengthened} kind="strengthened" initial={reports.initial} onReset={() => navigate("comfort")} />}
      <Footer report={phase === "strengthened" ? reports.strengthened : reports.initial} />
    </div>
  );
}

function Header({ phase, navigate }: { phase: Phase; navigate: (phase: Phase) => void }) {
  return (
    <header className="site-header">
      <button className="wordmark" onClick={() => navigate("comfort")} aria-label="Return to demo start">
        <span className="mark">N</span><span>NEMESIS</span>
      </button>
      <nav aria-label="Verification states">
        <button className={phase === "comfort" ? "active" : ""} onClick={() => navigate("comfort")}>Start</button>
        <button className={phase === "initial" ? "active" : ""} onClick={() => navigate("initial")}>Initial</button>
        <button className={phase === "strengthened" ? "active" : ""} onClick={() => navigate("strengthened")}>Verified</button>
      </nav>
      <div className="independent-pill"><span /> Independent verifier</div>
    </header>
  );
}

function FalseComfort({ report, onVerify }: { report: VerificationReport; onVerify: () => void }) {
  return (
    <main className="comfort-page" data-testid="false-comfort">
      <div className="ambient-grid" />
      <section className="comfort-content">
        <p className="eyebrow">CODEX · TASK COMPLETE</p>
        <div className="completion-icon" aria-hidden="true">✓</div>
        <h1>Team invitations<br />implemented.</h1>
        <p className="comfort-subtitle">The feature is built, typed, and tested. Everything looks ready to ship.</p>
        <div className="completion-panel">
          <CompletionRow title="Build passed" detail="TypeScript · no errors" meta="PASS" />
          <CompletionRow title={`${report.baseline.totalTests} / ${report.baseline.totalTests} tests passing`} detail="Vitest · 0 flaky" meta="PASS" />
          <div className="completion-row muted-row"><span className="status-icon commit">⌁</span><div><strong>Candidate committed</strong><small className="mono">{report.repo.candidateSha.slice(0, 12)}</small></div><span className="row-meta">READY</span></div>
        </div>
        <button className="primary-button" onClick={onVerify}>Verify independently <span>→</span></button>
        <p className="button-note">Coding agents shouldn’t grade their own homework.</p>
      </section>
    </main>
  );
}

function CompletionRow({ title, detail, meta }: { title: string; detail: string; meta: string }) {
  return <div className="completion-row"><span className="status-icon pass">✓</span><div><strong>{title}</strong><small>{detail}</small></div><span className="row-meta">{meta}</span></div>;
}

function ReportView({ report, kind, initial, onNext, onReset }: { report: VerificationReport; kind: "initial" | "strengthened"; initial?: VerificationReport; onNext?: () => void; onReset: () => void }) {
  const verified = kind === "strengthened";
  const unproven = report.summary.notDefended + report.summary.unverified;
  return (
    <main className={`report-page ${verified ? "verified-page" : "contradiction-page"}`} data-testid={verified ? "verified" : "contradiction"}>
      <section className="report-hero">
        <p className="eyebrow">NEMESIS · INDEPENDENT VERIFICATION</p>
        <TrustStrip report={report} />
        {verified ? <><div className="verified-label"><span>✓</span> VERIFIED</div><h1>Every requirement<br />is defended.</h1><p className="hero-summary"><strong>{report.summary.defended} / {report.summary.totalRequirements}</strong> requirements defended by executable evidence.</p></>
          : <><h1>All tests pass.<br /><em>Requirements are still unproven.</em></h1><p className="hero-summary"><strong>{report.baseline.totalTests}/{report.baseline.totalTests}</strong> tests pass. <strong>{unproven}</strong> requirements are still unproven.</p></>}
        <div className="report-meta"><span>Candidate <code>{report.repo.candidateSha.slice(0, 12)}</code></span><span>Schema {report.schemaVersion}</span><span>{new Date(report.createdAt).toLocaleString()}</span></div>
      </section>
      <section className="requirements-section" aria-labelledby="requirements-heading">
        <div className="section-heading"><div><p className="section-kicker">REQUIREMENT-LEVEL PROOF</p><h2 id="requirements-heading">What the tests actually defend</h2></div><span className={`score-badge ${verified ? "all-defended" : "partial"}`}>{report.summary.defended} / {report.summary.totalRequirements}</span></div>
        <div className="requirements-list">{report.requirements.map((requirement) => <RequirementRow key={requirement.id} requirement={requirement} />)}</div>
      </section>
      {verified && initial && <BeforeAfter initial={initial} strengthened={report} />}
      <ExecutionTrace trace={report.executionTrace} />
      <section className="report-actions">{!verified && onNext && <button className="primary-button" onClick={onNext}>View strengthened proof <span>→</span></button>}<button className="secondary-button" onClick={onReset}>Reset demo</button></section>
    </main>
  );
}

function TrustStrip({ report }: { report: VerificationReport }) {
  const states = [{ label: "BUILD", value: report.summary.build }, { label: "TESTS", value: report.summary.tests }, { label: "PROOF", value: report.summary.proof }];
  return <div className="trust-strip" aria-label="Build, tests, and proof status">{states.map((state) => { const pass = state.value === "PASS"; return <div className={pass ? "trust-pass" : "trust-fail"} key={state.label}><span>{pass ? "✓" : "✕"}</span><strong>{state.label}</strong><small>{state.value}</small></div>; })}</div>;
}

function RequirementRow({ requirement }: { requirement: VerificationReport["requirements"][number] }) {
  const defended = requirement.verdict === "DEFENDED";
  const counterfactual = requirement.counterfactuals[0];
  return (
    <details className={`requirement-row ${defended ? "defended" : "not-defended"}`} open={!defended}>
      <summary><span className="requirement-id">{requirement.id}</span><span className="requirement-copy"><strong>{requirement.text}</strong><small>{defended ? "Tests reject the confirmed adversarial implementation." : counterfactual.gapMessage}</small></span><span className="verdict"><i>{defended ? "✓" : "✕"}</i>{requirement.verdict.replace("_", " ")}</span><span className="chevron" aria-hidden="true">⌄</span></summary>
      <EvidenceDrawer counterfactual={counterfactual} requirementText={requirement.text} />
    </details>
  );
}

function EvidenceDrawer({ counterfactual, requirementText }: { counterfactual: CounterfactualResult; requirementText: string }) {
  return (
    <div className="evidence-drawer">
      {counterfactual.gapMessage && <blockquote>{counterfactual.gapMessage}</blockquote>}
      <div className="evidence-grid"><Evidence label="Requirement" value={requirementText} /><Evidence label="Adversarial implementation" value={counterfactual.description} /><Evidence label="Executable witness" value={counterfactual.witness?.scenario ?? "Witness unavailable"} /><Evidence label="Required behavior" value={counterfactual.witness?.expectedBehavior ?? "Not recorded"} tone="expected" /><Evidence label="Counterfactual behavior" value={counterfactual.witness?.counterfactualBehavior ?? "Not recorded"} tone="counter" /><Evidence label="Validity" value={`${counterfactual.validity} · Witness ${counterfactual.witness?.confirmed ? "confirmed" : "not confirmed"}`} tone="valid" /></div>
      <div className="test-evidence"><div><span>RESULT</span><strong className={counterfactual.score === "SURVIVED" ? "survived" : "killed"}>{counterfactual.score}</strong></div><div><span>STABLE RELEVANT TESTS RUN</span><strong>{counterfactual.stableRelevantTestsRun?.length ?? 0}</strong></div><div><span>STABLE UNRELATED TESTS RUN</span><strong>{counterfactual.stableUnrelatedTestsRun?.length ?? 0}</strong></div></div>
    </div>
  );
}

function Evidence({ label, value, tone }: { label: string; value: string; tone?: string }) { return <div className={`evidence-item ${tone ?? ""}`}><span>{label}</span><p>{value}</p></div>; }

function BeforeAfter({ initial, strengthened }: { initial: VerificationReport; strengthened: VerificationReport }) {
  return <section className="before-after"><div><span>BEFORE · ORIGINAL TESTS</span><strong>{initial.summary.defended} / {initial.summary.totalRequirements}</strong><small>requirements defended</small></div><div className="transition-line"><i /><span>Tests strengthened only</span><i /></div><div><span>AFTER · STRENGTHENED</span><strong>{strengthened.summary.defended} / {strengthened.summary.totalRequirements}</strong><small>requirements defended</small></div></section>;
}

function ExecutionTrace({ trace }: { trace: TraceEvent[] }) {
  const [visible, setVisible] = useState(trace.length);
  const [playing, setPlaying] = useState(false);
  const shown = useMemo(() => trace.slice(0, visible), [trace, visible]);
  useEffect(() => { if (!playing || visible >= trace.length) { if (visible >= trace.length) setPlaying(false); return; } const timer = window.setTimeout(() => setVisible((current) => Math.min(current + 1, trace.length)), 75); return () => window.clearTimeout(timer); }, [playing, visible, trace.length]);
  const replay = () => { setVisible(1); setPlaying(true); };
  return <details className="trace-panel"><summary><span><i className="pulse-dot" /> EXECUTION TRACE</span><span>{trace.length} actual events <b>⌄</b></span></summary><div className="trace-toolbar"><p>Original event order preserved. Animation delay is visual only.</p><button onClick={replay}>{playing ? "Replaying…" : "Replay verification"}</button></div><ol className="trace-list">{shown.map((event, index) => <li key={`${index}-${event.timestamp}`} className={event.status.toLowerCase()}><time>{new Date(event.timestamp).toLocaleTimeString([], { hour12: false })}</time><span className="trace-marker" /><div><strong>{event.stage}</strong><p>{event.requirementId && <b>{event.requirementId} · </b>}{event.message}</p></div><em>{event.status}</em></li>)}</ol></details>;
}

function Footer({ report }: { report: VerificationReport }) { return <footer><span>NEMESIS · verifier {report.metadata.verifierVersion}</span><span>Coding agents shouldn’t grade their own homework.</span><code>{report.repo.productionSourceFingerprint.slice(0, 16)}</code></footer>; }
function LoadingState() { return <main className="system-state"><div className="loading-mark">N</div><p>Loading verified artifacts…</p></main>; }
function ErrorState({ message, details }: { message: string; details?: string[] }) { return <main className="system-state error-state"><div className="error-mark">!</div><h1>{message}</h1>{details?.length ? <pre>{details.join("\n")}</pre> : null}<p>Nemesis will never silently substitute sample data.</p></main>; }
