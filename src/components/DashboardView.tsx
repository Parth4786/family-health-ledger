import { formatCurrency, formatDate, relativeDayLabel } from "../lib/date";
import { Metric } from "./shared";
import { useLedger } from "../hooks/useLedger";

export function DashboardView({
  ledger,
  onOpenProfile,
}: {
  ledger: ReturnType<typeof useLedger>;
  onOpenProfile: (patientId: string) => void;
}) {
  return (
    <div className="stack-lg">
      <section className="panel panel--wide">
        <div className="panel__header">
          <div>
            <div className="eyebrow">Urgent board</div>
            <h2>What the family should act on next</h2>
          </div>
        </div>
        <div className="urgent-grid">
          {ledger.reminders.length === 0 && <div className="empty-state">No immediate refill risk. Active medicine plans will appear here automatically.</div>}
          {ledger.reminders.map((item) => (
            <button className={`urgent-card urgent-card--${item.status}`} key={item.medicine.id} onClick={() => onOpenProfile(item.patient.id)}>
              <div className="eyebrow">{item.patient.name}</div>
              <h3>{item.medicine.name}</h3>
              <p>{relativeDayLabel(item.daysLeft)}</p>
              <div className="meta-line">{item.remainingTablets} tablets left</div>
            </button>
          ))}
        </div>
      </section>

      <section className="profile-grid">
        {ledger.patientSummaries.map((summary) => (
          <button className="patient-summary" key={summary.patient.id} onClick={() => onOpenProfile(summary.patient.id)}>
            <div className="patient-summary__top">
              <span className="accent-pill" style={{ background: summary.patient.color_accent }} />
              <div>
                <strong>{summary.patient.name}</strong>
                <div className="meta-line">{summary.patient.relationship}</div>
              </div>
            </div>
            <div className="summary-stats">
              <Metric label="Active medicines" value={String(summary.activeMedicines)} />
              <Metric label="Critical" value={String(summary.criticalCount)} />
              <Metric label="Monthly cost" value={formatCurrency(summary.monthlyCost)} />
              <Metric label="Latest diary" value={summary.latestLog ? formatDate(summary.latestLog.logged_on) : "No logs"} />
            </div>
          </button>
        ))}
      </section>
    </div>
  );
}
