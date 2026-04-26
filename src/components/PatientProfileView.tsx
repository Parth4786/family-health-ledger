import { formatCurrency, formatDate, relativeDayLabel } from "../lib/date";
import { buildTimeline } from "../lib/ledger";
import { useLedger } from "../hooks/useLedger";
import type { DailyLog, DerivedMedicine, Medicine, Patient, Report } from "../types";
import { MedicineTable } from "./MedicineTable";

export function PatientProfileView({
  patient,
  patientSummaries,
  derivedMedicines,
  reports,
  dailyLogs,
  purchases,
  onOpenReport,
  onArchiveLog,
  onToggleMedicine,
  onArchiveMedicine,
}: {
  patient: Patient | undefined;
  patientSummaries: ReturnType<typeof useLedger>["patientSummaries"];
  derivedMedicines: DerivedMedicine[];
  reports: Report[];
  dailyLogs: DailyLog[];
  purchases: ReturnType<typeof useLedger>["snapshot"]["purchases"];
  onOpenReport: (report: Report) => void;
  onArchiveLog: (log: DailyLog) => void;
  onToggleMedicine: (medicine: Medicine) => void;
  onArchiveMedicine: (medicine: Medicine) => void;
}) {
  if (!patient) {
    return <section className="panel"><div className="empty-state">Add a patient to open the profile workspace.</div></section>;
  }

  const summary = patientSummaries.find((entry) => entry.patient.id === patient.id);
  const patientMedicines = derivedMedicines.filter((entry) => entry.medicine.patient_id === patient.id);
  const activeMedicines = patientMedicines.filter((entry) => entry.medicine.is_active);
  const stoppedMedicines = patientMedicines.filter((entry) => !entry.medicine.is_active || entry.medicine.stop_date);
  const patientReports = reports.filter((report) => !report.is_archived && report.patient_id === patient.id);
  const patientLogs = dailyLogs.filter((log) => !log.is_archived && log.patient_id === patient.id);
  const timeline = buildTimeline(patient.id, patientMedicines, purchases, reports, dailyLogs);

  return (
    <div className="stack-lg">
      <section className="profile-hero">
        <div className="profile-hero__banner" style={{ background: `linear-gradient(135deg, ${patient.color_accent}, #0f172a)` }} />
        <div className="profile-hero__body">
          <div className="profile-avatar" style={{ background: patient.color_accent }}>{patient.name.slice(0, 1)}</div>
          <div className="profile-copy">
            <h2>{patient.name}</h2>
            <div className="meta-line">{patient.relationship}{patient.birth_year ? `, born ${patient.birth_year}` : ""}</div>
            <p>{patient.conditions || "No conditions entered yet."}</p>
            <div className="chip-row">
              <span className="chip chip--static">Current meds: {summary?.activeMedicines ?? 0}</span>
              <span className="chip chip--static">Critical refills: {summary?.criticalCount ?? 0}</span>
              <span className="chip chip--static">Reports: {summary?.reportCount ?? 0}</span>
              <span className="chip chip--static">Monthly cost: {formatCurrency(summary?.monthlyCost ?? 0)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <div className="eyebrow">Ongoing medicines</div>
            <h2>Meal-time and day-specific dosage table</h2>
          </div>
        </div>
        <MedicineTable entries={activeMedicines} />
      </section>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel__header">
            <div>
              <div className="eyebrow">Stopped or completed</div>
              <h2>Medicine history</h2>
            </div>
          </div>
          <div className="stack-md">
            {stoppedMedicines.length === 0 && <div className="empty-state">No stopped medicines yet.</div>}
            {stoppedMedicines.map((entry) => (
              <article className="history-card" key={entry.medicine.id}>
                <strong>{entry.medicine.name}</strong>
                <div className="meta-line">
                  Started {formatDate(entry.medicine.start_date)}{entry.medicine.stop_date ? `, stopped ${formatDate(entry.medicine.stop_date)}` : ""}
                </div>
                <p>{entry.activeDaysTaken} days taken</p>
                <button className="text-button" onClick={() => void onArchiveMedicine(entry.medicine)}>Archive</button>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <div className="eyebrow">Daily diary</div>
              <h2>Recent vitals</h2>
            </div>
          </div>
          <div className="stack-md">
            {patientLogs.map((log) => (
              <article className="log-card" key={log.id}>
                <div className="log-card__top">
                  <strong>{formatDate(log.logged_on)}</strong>
                  <button className="text-button" onClick={() => void onArchiveLog(log)}>Archive</button>
                </div>
                <div className="metric-strip">
                  <span>{log.bp_systolic && log.bp_diastolic ? `${log.bp_systolic}/${log.bp_diastolic} BP` : "No BP"}</span>
                  <span>{log.pulse ? `${log.pulse} pulse` : "No pulse"}</span>
                  <span>{log.sugar ? `${log.sugar} sugar` : "No sugar"}</span>
                  <span>{log.temperature ? `${log.temperature} F` : "No temp"}</span>
                </div>
                <p>{log.notes || "No notes."}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel__header">
            <div>
              <div className="eyebrow">Reports</div>
              <h2>Private household archive</h2>
            </div>
          </div>
          <div className="stack-md">
            {patientReports.map((report) => (
              <article className="report-card" key={report.id}>
                <div>
                  <strong>{report.title}</strong>
                  <div className="meta-line">{report.report_type} on {formatDate(report.report_date)}</div>
                </div>
                <button className="button button--ghost" onClick={() => onOpenReport(report)}>Open securely</button>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <div className="eyebrow">Ledger timeline</div>
              <h2>Everything around this patient</h2>
            </div>
          </div>
          <div className="timeline-list">
            {timeline.map((entry) => (
              <article className="timeline-item" key={entry.id}>
                <div className="timeline-date">{formatDate(entry.date)}</div>
                <div>
                  <strong>{entry.title}</strong>
                  <p>{entry.subtitle}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel__header">
          <div>
            <div className="eyebrow">Medicine controls</div>
            <h2>Pause or retire active medicines</h2>
          </div>
        </div>
        <div className="stack-md">
          {activeMedicines.map((entry) => (
            <article className="report-card" key={entry.medicine.id}>
              <div>
                <strong>{entry.medicine.name}</strong>
                <div className="meta-line">{relativeDayLabel(entry.daysLeft)} and {entry.remainingTablets} tablets left</div>
              </div>
              <div className="action-row">
                <button className="button button--ghost" onClick={() => void onToggleMedicine(entry.medicine)}>Stop reminders</button>
                <button className="text-button" onClick={() => void onArchiveMedicine(entry.medicine)}>Archive</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
