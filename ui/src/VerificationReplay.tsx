import { useEffect, useRef, useState } from "react";
import type { VerificationReport } from "../../lib/nemesis/types.js";
import { replayActivity, replayDelayAfter, requirementReplayState, traceOffset } from "./replay-model.js";

export function VerificationReplay({ report, onComplete }: { report: VerificationReport; onComplete: () => void }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [complete, setComplete] = useState(false);
  const traceViewport = useRef<HTMLOListElement>(null);
  const trace = report.executionTrace;
  const visibleTrace = trace.slice(0, visibleCount);
  const activeEvent = visibleTrace.at(-1);
  const progress = trace.length === 0 ? 100 : Math.round((visibleCount / trace.length) * 100);

  useEffect(() => {
    if (complete) return;
    if (visibleCount >= trace.length) {
      setComplete(true);
      return;
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = visibleCount === 0 ? (reducedMotion ? 24 : 360) : replayDelayAfter(trace[visibleCount - 1], reducedMotion);
    const timer = window.setTimeout(() => setVisibleCount((current) => Math.min(current + 1, trace.length)), delay);
    return () => window.clearTimeout(timer);
  }, [complete, trace, visibleCount]);

  useEffect(() => {
    if (!traceViewport.current) return;
    traceViewport.current.scrollTop = traceViewport.current.scrollHeight;
  }, [visibleCount]);

  useEffect(() => {
    if (!complete) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(onComplete, reducedMotion ? 350 : 1050);
    return () => window.clearTimeout(timer);
  }, [complete, onComplete]);

  return (
    <main className={`verification-page ${complete ? "replay-complete" : ""}`} data-testid="verifying">
      <div className="verification-grid" />
      <section className="verification-console" aria-labelledby="verification-heading">
        <p className="eyebrow">NEMESIS · INDEPENDENT VERIFICATION</p>
        <div className="verifier-orbit" aria-hidden="true"><span>N</span><i /></div>
        <p className="verification-state"><i />{complete ? "VERIFICATION COMPLETE" : "VERIFICATION RUNNING"}</p>
        <h1 id="verification-heading">{complete ? "Proof gaps found." : "Testing the tests."}</h1>
        <p className="verification-summary" aria-live="polite">
          {complete
            ? `${report.summary.defended} of ${report.summary.totalRequirements} requirements are defended. Opening the evidence report…`
            : replayActivity(activeEvent)}
        </p>

        <div className="replay-progress" role="progressbar" aria-label="Verification replay progress" aria-valuemin={0} aria-valuemax={trace.length} aria-valuenow={visibleCount}>
          <div><span>{complete ? "Evidence replay complete" : "Replaying recorded evidence"}</span><strong>{visibleCount} / {trace.length} events</strong></div>
          <i><b style={{ width: `${progress}%` }} /></i>
        </div>

        <div className="requirement-replay" aria-label="Requirement verification progress">
          {report.requirements.map((requirement) => {
            const state = requirementReplayState(trace, visibleCount, requirement.id);
            return <div className={state.toLowerCase().replace("_", "-")} key={requirement.id}><span>{requirement.id}</span><p>{requirement.text}</p><strong>{state.replace("_", " ")}</strong></div>;
          })}
        </div>

        <div className="live-trace">
          <div className="live-trace-heading"><span><i /> ACTUAL EXECUTION TRACE</span><small>Original event order preserved</small></div>
          <ol ref={traceViewport} aria-label="Recorded verification events">
            {visibleTrace.map((event, index) => (
              <li className={event.status.toLowerCase()} key={`${index}-${event.timestamp}`}>
                <time>{traceOffset(trace, index)}</time>
                <span className="live-trace-marker" />
                <div><strong>{event.requirementId && <b>{event.requirementId} · </b>}{event.stage}</strong><p>{event.message}</p></div>
                <em>{event.status}</em>
              </li>
            ))}
            {visibleCount === 0 && <li className="trace-pending"><span>Waiting for first recorded event…</span></li>}
          </ol>
        </div>
        <p className="replay-disclosure">Replay of evidence captured in the Initial report. Event order and content are unchanged; pauses are visual only.</p>
      </section>
    </main>
  );
}
