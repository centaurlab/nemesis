import { useEffect, useMemo, useState } from "react";
import type { VerificationReport } from "../../lib/nemesis/types.js";
import { strengtheningEvidence } from "./strengthening-model.js";

const finalStep = 5;

export function StrengtheningReplay({ initial, strengthened, onComplete }: { initial: VerificationReport; strengthened: VerificationReport; onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const evidence = useMemo(() => strengtheningEvidence(initial, strengthened), [initial, strengthened]);
  const complete = step === finalStep;

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (step < finalStep) {
      const timer = window.setTimeout(() => setStep((current) => Math.min(current + 1, finalStep)), reducedMotion ? 50 : 620);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(onComplete, reducedMotion ? 350 : 1050);
    return () => window.clearTimeout(timer);
  }, [onComplete, step]);

  const activity = step === 1 ? "Preparing the strengthened proof artifact"
    : step === 2 ? `Addressing ${evidence.length} missing proof gaps`
      : step === 3 ? `Running the recorded ${strengthened.baseline.totalTests}-test suite`
        : step === 4 ? "Re-running independent verification"
          : `${strengthened.summary.defended} of ${strengthened.summary.totalRequirements} requirements defended`;

  return (
    <main className={`strengthening-page ${complete ? "strengthening-complete" : ""}`} data-testid="strengthening">
      <div className="strengthening-grid" />
      <section className="strengthening-console" aria-labelledby="strengthening-heading">
        <p className="eyebrow">NEMESIS · PROOF REPAIR LOOP</p>
        <div className="strengthening-mark" aria-hidden="true"><span>+</span><i /></div>
        <p className="strengthening-state"><i />{complete ? "VERIFICATION STRENGTHENED" : "STRENGTHENING VERIFICATION"}</p>
        <h1 id="strengthening-heading">{complete ? "Verification strengthened." : "Adding missing proof."}</h1>
        <p className="strengthening-activity" aria-live="polite">{complete ? "Opening the verified proof…" : activity}</p>

        <div className="strengthening-progress" role="progressbar" aria-label="Strengthening replay progress" aria-valuemin={1} aria-valuemax={finalStep} aria-valuenow={step}><i style={{ width: `${step / finalStep * 100}%` }} /></div>

        <section className={`proof-additions ${step >= 2 ? "is-visible" : ""}`} aria-label="Missing proof addressed">
          <div className="proof-additions-heading"><span>ADDING MISSING EVIDENCE</span><small>{evidence.length} proof gaps from the Initial report</small></div>
          <div className="proof-additions-grid">
            {evidence.map((item) => <article key={item.id}><span>{item.id}</span><div><strong>{item.requirement}</strong><p>{item.gap}</p><ul>{item.addedTests.map((test) => <li key={test}><i>+</i>{test}</li>)}</ul></div></article>)}
          </div>
        </section>

        <ol className="strengthening-stages">
          <StrengtheningStage visible={step >= 3} complete={step > 3} active={step === 3} title="Run strengthened test suite" detail={`${strengthened.baseline.totalTests} / ${strengthened.baseline.totalTests} tests passing`} status={strengthened.summary.tests} />
          <StrengtheningStage visible={step >= 4} complete={step > 4} active={step === 4} title="Re-run independent verification" detail={`${evidence.length} previously unproven requirements challenged again`} status={step > 4 ? strengthened.summary.proof : "RUNNING"} />
          <StrengtheningStage visible={step >= 5} complete={complete} active={false} title="Open verified proof" detail={`${strengthened.summary.defended} / ${strengthened.summary.totalRequirements} requirements defended`} status={complete ? "READY" : "PENDING"} />
        </ol>
        <p className="strengthening-disclosure">Deterministic replay of the Strengthened report. Evidence and results come from the existing artifact; pauses are visual only.</p>
      </section>
    </main>
  );
}

function StrengtheningStage({ visible, complete, active, title, detail, status }: { visible: boolean; complete: boolean; active: boolean; title: string; detail: string; status: string }) {
  return <li className={`${visible ? "is-visible" : ""} ${complete ? "is-complete" : ""} ${active ? "is-active" : ""}`}><span className="strengthening-stage-marker">{complete ? "✓" : ""}</span><div><strong>{title}</strong><small>{detail}</small></div><em>{status}</em></li>;
}
