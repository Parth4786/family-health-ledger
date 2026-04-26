import { FormEvent, useMemo, useState } from "react";
import { formatCurrency, formatDate, relativeDayLabel, todayIso } from "./lib/date";
import { useLedger } from "./hooks/useLedger";
import type { Patient, TabKey } from "./types";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "dashboard", label: "Overview" },
  { key: "patients", label: "Patients" },
  { key: "medicines", label: "Medicines" },
  { key: "purchases", label: "Purchases" },
  { key: "reports", label: "Reports" },
  { key: "setup", label: "Setup" },
];

const accentColors = ["#f97316", "#14b8a6", "#38bdf8", "#f43f5e", "#facc15"];

function statusLabel(status: string) {
  if (status === "syncing") return "Syncing";
  if (status === "offline") return "Offline queue";
  if (status === "error") return "Setup needed";
  if (status === "loading") return "Loading";
  return "Ready";
}

export default function App() {
  const ledger = useLedger();
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [householdName, setHouseholdName] = useState("Parth Family Ledger");
  const [patientForm, setPatientForm] = useState({
    name: "",
    relationship: "Grandfather",
    birth_year: "",
    conditions: "",
    notes: "",
    color_accent: accentColors[0],
  });
  const [medicineForm, setMedicineForm] = useState({
    patient_id: "",
    name: "",
    purpose: "",
    dosage_per_day: "2",
    schedule: "Morning, Evening",
    tablets_per_strip: "15",
    initial_strips_bought: "1",
    initial_total_cost: "75",
    start_date: todayIso(),
    notes: "",
  });
  const [purchaseForm, setPurchaseForm] = useState({
    patient_id: "",
    medicine_id: "",
    label: "",
    purchased_on: todayIso(),
    strips_bought: "1",
    tablets_per_strip: "15",
    total_cost: "75",
    pharmacy: "",
    notes: "",
  });
  const [reportForm, setReportForm] = useState({
    patient_id: "",
    title: "",
    report_type: "Lab report",
    report_date: todayIso(),
    summary: "",
    file_path: "",
  });
  const [reportFile, setReportFile] = useState<File | null>(null);

  const activePatients = useMemo(
    () => ledger.snapshot.patients.filter((patient) => !patient.is_archived),
    [ledger.snapshot.patients],
  );

  async function handleAuthSubmit(event: FormEvent) {
    event.preventDefault();
    if (authMode === "signup") {
      await ledger.signUp(authEmail, authPassword, householdName);
      return;
    }
    await ledger.signIn(authEmail, authPassword);
  }

  async function handlePatientSubmit(event: FormEvent) {
    event.preventDefault();
    await ledger.addPatient({
      name: patientForm.name,
      relationship: patientForm.relationship,
      birth_year: patientForm.birth_year ? Number(patientForm.birth_year) : null,
      conditions: patientForm.conditions,
      notes: patientForm.notes,
      color_accent: patientForm.color_accent,
      is_active: true,
    });
    setPatientForm({
      name: "",
      relationship: "Grandfather",
      birth_year: "",
      conditions: "",
      notes: "",
      color_accent: accentColors[Math.floor(Math.random() * accentColors.length)],
    });
  }

  async function handleMedicineSubmit(event: FormEvent) {
    event.preventDefault();
    await ledger.addMedicine({
      patient_id: medicineForm.patient_id,
      name: medicineForm.name,
      purpose: medicineForm.purpose,
      dosage_per_day: Number(medicineForm.dosage_per_day),
      schedule: medicineForm.schedule.split(",").map((entry) => entry.trim()).filter(Boolean),
      tablets_per_strip: Number(medicineForm.tablets_per_strip),
      initial_strips_bought: Number(medicineForm.initial_strips_bought),
      initial_total_cost: Number(medicineForm.initial_total_cost),
      start_date: medicineForm.start_date,
      stop_date: null,
      notes: medicineForm.notes,
      is_active: true,
    });
    setMedicineForm({
      patient_id: medicineForm.patient_id,
      name: "",
      purpose: "",
      dosage_per_day: "2",
      schedule: "Morning, Evening",
      tablets_per_strip: "15",
      initial_strips_bought: "1",
      initial_total_cost: "75",
      start_date: todayIso(),
      notes: "",
    });
  }

  async function handlePurchaseSubmit(event: FormEvent) {
    event.preventDefault();
    await ledger.addPurchase({
      patient_id: purchaseForm.patient_id,
      medicine_id: purchaseForm.medicine_id || null,
      label: purchaseForm.label,
      purchased_on: purchaseForm.purchased_on,
      strips_bought: Number(purchaseForm.strips_bought),
      tablets_per_strip: Number(purchaseForm.tablets_per_strip),
      total_cost: Number(purchaseForm.total_cost),
      pharmacy: purchaseForm.pharmacy,
      notes: purchaseForm.notes,
    });
    setPurchaseForm({
      patient_id: purchaseForm.patient_id,
      medicine_id: purchaseForm.medicine_id,
      label: "",
      purchased_on: todayIso(),
      strips_bought: "1",
      tablets_per_strip: "15",
      total_cost: "75",
      pharmacy: "",
      notes: "",
    });
  }

  async function handleReportSubmit(event: FormEvent) {
    event.preventDefault();
    await ledger.addReport(
      {
        patient_id: reportForm.patient_id,
        title: reportForm.title,
        report_type: reportForm.report_type,
        report_date: reportForm.report_date,
        summary: reportForm.summary,
        file_path: reportForm.file_path,
      },
      reportFile,
    );
    setReportForm({
      patient_id: reportForm.patient_id,
      title: "",
      report_type: "Lab report",
      report_date: todayIso(),
      summary: "",
      file_path: "",
    });
    setReportFile(null);
  }

  return (
    <div className="shell">
      <header className="hero">
        <div className="hero__copy">
          <div className="eyebrow">Family Health Ledger</div>
          <h1>One calm place for medicines, refills, reports, and family visibility.</h1>
          <p>Static GitHub Pages app, shared Supabase storage, offline cache, and refill reminders built for elder care.</p>
          <div className="hero__actions">
            <button className="button button--primary" onClick={() => setActiveTab("dashboard")}>Open ledger</button>
            <button className="button button--ghost" onClick={() => setActiveTab("setup")}>Supabase setup</button>
          </div>
        </div>
        <div className="hero__panel">
          <div className="status-chip">
            <span className={`status-dot status-dot--${ledger.syncStatus}`} />
            {statusLabel(ledger.syncStatus)}
          </div>
          <div className="hero__metrics">
            <Metric label="Monthly medicine cost" value={formatCurrency(ledger.stats.monthlyCost)} />
            <Metric label="Critical refills" value={String(ledger.stats.criticalCount)} />
            <Metric label="Reports saved" value={String(ledger.stats.totalReports)} />
            <Metric label="Active patients" value={String(ledger.stats.activePatients)} />
          </div>
        </div>
      </header>

      <main className="workspace">
        <aside className="nav">
          <div className="nav__group">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`nav__item ${activeTab === tab.key ? "nav__item--active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="auth-card">
            <div className="auth-card__title">{ledger.session ? "Shared household account" : "Connect Supabase"}</div>
            {ledger.session ? (
              <>
                <div className="auth-card__meta">{ledger.session.user.email}</div>
                <button className="button button--ghost button--full" onClick={() => void ledger.signOut()}>Sign out</button>
              </>
            ) : (
              <form className="stack-sm" onSubmit={(event) => void handleAuthSubmit(event)}>
                <div className="toggle-row">
                  <button type="button" className={`toggle-pill ${authMode === "signup" ? "toggle-pill--active" : ""}`} onClick={() => setAuthMode("signup")}>Create</button>
                  <button type="button" className={`toggle-pill ${authMode === "signin" ? "toggle-pill--active" : ""}`} onClick={() => setAuthMode("signin")}>Sign in</button>
                </div>
                {authMode === "signup" && (
                  <label className="field">
                    <span>Household name</span>
                    <input value={householdName} onChange={(event) => setHouseholdName(event.target.value)} required />
                  </label>
                )}
                <label className="field">
                  <span>Email</span>
                  <input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} required />
                </label>
                <label className="field">
                  <span>Password</span>
                  <input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} minLength={6} required />
                </label>
                <button className="button button--primary button--full" type="submit">{authMode === "signup" ? "Create account" : "Sign in"}</button>
              </form>
            )}
            {ledger.error && <div className="inline-alert">{ledger.error}</div>}
          </div>
        </aside>

        <section className="content">
          {ledger.error && <div className="inline-alert">{ledger.error}</div>}

          {activeTab === "dashboard" && <DashboardView ledger={ledger} onOpenTab={setActiveTab} />}

          {activeTab === "patients" && (
            <section className="panel-grid">
              <div className="panel">
                <div className="panel__header"><div><div className="eyebrow">Add patient</div><h2>Track each elder separately</h2></div></div>
                <form className="form-grid" onSubmit={(event) => void handlePatientSubmit(event)}>
                  <label className="field"><span>Name</span><input value={patientForm.name} onChange={(event) => setPatientForm({ ...patientForm, name: event.target.value })} required /></label>
                  <label className="field"><span>Relationship</span><input value={patientForm.relationship} onChange={(event) => setPatientForm({ ...patientForm, relationship: event.target.value })} required /></label>
                  <label className="field"><span>Birth year</span><input type="number" value={patientForm.birth_year} onChange={(event) => setPatientForm({ ...patientForm, birth_year: event.target.value })} /></label>
                  <label className="field">
                    <span>Accent</span>
                    <select value={patientForm.color_accent} onChange={(event) => setPatientForm({ ...patientForm, color_accent: event.target.value })}>
                      {accentColors.map((color) => <option key={color} value={color}>{color}</option>)}
                    </select>
                  </label>
                  <label className="field field--full"><span>Conditions</span><textarea rows={3} value={patientForm.conditions} onChange={(event) => setPatientForm({ ...patientForm, conditions: event.target.value })} /></label>
                  <label className="field field--full"><span>Notes</span><textarea rows={3} value={patientForm.notes} onChange={(event) => setPatientForm({ ...patientForm, notes: event.target.value })} /></label>
                  <button className="button button--primary" type="submit">Save patient</button>
                </form>
              </div>

              <div className="panel">
                <div className="panel__header"><div><div className="eyebrow">Patient directory</div><h2>Shared family view</h2></div></div>
                <div className="list">
                  {activePatients.map((patient) => (
                    <article className="list-card" key={patient.id}>
                      <div className="list-card__title"><span className="accent-dot" style={{ background: patient.color_accent }} />{patient.name}</div>
                      <div className="meta-line">{patient.relationship} {patient.birth_year ? `• ${patient.birth_year}` : ""}</div>
                      <p>{patient.conditions || "No conditions entered yet."}</p>
                      <div className="action-row">
                        <span className={`badge ${patient.is_active ? "badge--good" : "badge--muted"}`}>{patient.is_active ? "Active" : "Paused"}</span>
                        <button className="text-button" onClick={() => void ledger.archivePatient(patient)}>Archive</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeTab === "medicines" && (
            <section className="panel-grid">
              <div className="panel">
                <div className="panel__header"><div><div className="eyebrow">Add medicine</div><h2>Inventory-aware medicine entry</h2></div></div>
                <form className="form-grid" onSubmit={(event) => void handleMedicineSubmit(event)}>
                  <PatientSelect value={medicineForm.patient_id} onChange={(value) => setMedicineForm({ ...medicineForm, patient_id: value })} patients={activePatients} />
                  <label className="field"><span>Medicine name</span><input value={medicineForm.name} onChange={(event) => setMedicineForm({ ...medicineForm, name: event.target.value })} required /></label>
                  <label className="field"><span>Purpose</span><input value={medicineForm.purpose} onChange={(event) => setMedicineForm({ ...medicineForm, purpose: event.target.value })} required /></label>
                  <label className="field"><span>Dosage per day</span><input type="number" step="0.5" min="0.5" value={medicineForm.dosage_per_day} onChange={(event) => setMedicineForm({ ...medicineForm, dosage_per_day: event.target.value })} required /></label>
                  <label className="field"><span>Schedule</span><input value={medicineForm.schedule} onChange={(event) => setMedicineForm({ ...medicineForm, schedule: event.target.value })} required /></label>
                  <label className="field"><span>Tablets per strip</span><input type="number" min="1" value={medicineForm.tablets_per_strip} onChange={(event) => setMedicineForm({ ...medicineForm, tablets_per_strip: event.target.value })} required /></label>
                  <label className="field"><span>Initial strips</span><input type="number" step="0.5" min="0.5" value={medicineForm.initial_strips_bought} onChange={(event) => setMedicineForm({ ...medicineForm, initial_strips_bought: event.target.value })} required /></label>
                  <label className="field"><span>Initial total cost</span><input type="number" min="0" value={medicineForm.initial_total_cost} onChange={(event) => setMedicineForm({ ...medicineForm, initial_total_cost: event.target.value })} required /></label>
                  <label className="field"><span>Start date</span><input type="date" value={medicineForm.start_date} onChange={(event) => setMedicineForm({ ...medicineForm, start_date: event.target.value })} required /></label>
                  <label className="field field--full"><span>Notes</span><textarea rows={3} value={medicineForm.notes} onChange={(event) => setMedicineForm({ ...medicineForm, notes: event.target.value })} /></label>
                  <button className="button button--primary" type="submit">Save medicine</button>
                </form>
              </div>

              <div className="panel">
                <div className="panel__header"><div><div className="eyebrow">Active inventory</div><h2>Refill and cost visibility</h2></div></div>
                <div className="list">
                  {ledger.derivedMedicines.map((entry) => (
                    <article className="list-card" key={entry.medicine.id}>
                      <div className="list-card__title">{entry.medicine.name}</div>
                      <div className="meta-line">{entry.patient?.name ?? "Unknown patient"} • {entry.medicine.schedule.join(" + ")}</div>
                      <div className="metric-grid">
                        <Metric label="Remaining" value={`${entry.remainingTablets} tabs`} />
                        <Metric label="Refill window" value={relativeDayLabel(entry.daysLeft)} />
                        <Metric label="Daily cost" value={formatCurrency(entry.dailyCost)} />
                        <Metric label="Stock value" value={formatCurrency(entry.remainingValue)} />
                      </div>
                      <div className="action-row">
                        <span className={`badge ${entry.daysLeft <= 2 ? "badge--danger" : entry.daysLeft <= 5 ? "badge--warn" : "badge--good"}`}>{entry.daysLeft <= 2 ? "Critical" : entry.daysLeft <= 5 ? "Watch" : "Stable"}</span>
                        <button className="text-button" onClick={() => void ledger.toggleMedicineActive(entry.medicine)}>{entry.medicine.is_active ? "Stop reminders" : "Restart"}</button>
                        <button className="text-button" onClick={() => void ledger.archiveMedicine(entry.medicine)}>Archive</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeTab === "purchases" && (
            <section className="panel-grid">
              <div className="panel">
                <div className="panel__header"><div><div className="eyebrow">Log purchase</div><h2>Track refill spend</h2></div></div>
                <form className="form-grid" onSubmit={(event) => void handlePurchaseSubmit(event)}>
                  <PatientSelect value={purchaseForm.patient_id} onChange={(value) => setPurchaseForm({ ...purchaseForm, patient_id: value })} patients={activePatients} />
                  <label className="field">
                    <span>Medicine</span>
                    <select value={purchaseForm.medicine_id} onChange={(event) => setPurchaseForm({ ...purchaseForm, medicine_id: event.target.value })}>
                      <option value="">General purchase</option>
                      {ledger.snapshot.medicines.filter((medicine) => !medicine.is_archived && (!purchaseForm.patient_id || medicine.patient_id === purchaseForm.patient_id)).map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.name}</option>)}
                    </select>
                  </label>
                  <label className="field"><span>Label</span><input value={purchaseForm.label} onChange={(event) => setPurchaseForm({ ...purchaseForm, label: event.target.value })} required /></label>
                  <label className="field"><span>Purchase date</span><input type="date" value={purchaseForm.purchased_on} onChange={(event) => setPurchaseForm({ ...purchaseForm, purchased_on: event.target.value })} required /></label>
                  <label className="field"><span>Strips bought</span><input type="number" step="0.5" min="0.5" value={purchaseForm.strips_bought} onChange={(event) => setPurchaseForm({ ...purchaseForm, strips_bought: event.target.value })} required /></label>
                  <label className="field"><span>Tablets per strip</span><input type="number" min="1" value={purchaseForm.tablets_per_strip} onChange={(event) => setPurchaseForm({ ...purchaseForm, tablets_per_strip: event.target.value })} required /></label>
                  <label className="field"><span>Total cost</span><input type="number" min="0" value={purchaseForm.total_cost} onChange={(event) => setPurchaseForm({ ...purchaseForm, total_cost: event.target.value })} required /></label>
                  <label className="field"><span>Pharmacy</span><input value={purchaseForm.pharmacy} onChange={(event) => setPurchaseForm({ ...purchaseForm, pharmacy: event.target.value })} /></label>
                  <label className="field field--full"><span>Notes</span><textarea rows={3} value={purchaseForm.notes} onChange={(event) => setPurchaseForm({ ...purchaseForm, notes: event.target.value })} /></label>
                  <button className="button button--primary" type="submit">Save purchase</button>
                </form>
              </div>

              <div className="panel">
                <div className="panel__header"><div><div className="eyebrow">Purchase timeline</div><h2>Cost history</h2></div></div>
                <div className="list">
                  {ledger.snapshot.purchases.filter((purchase) => !purchase.is_archived).map((purchase) => (
                    <article className="list-card" key={purchase.id}>
                      <div className="list-card__title">{purchase.label}</div>
                      <div className="meta-line">{formatDate(purchase.purchased_on)} • {formatCurrency(purchase.total_cost)}</div>
                      <p>{purchase.strips_bought} strip(s) × {purchase.tablets_per_strip} tablets{purchase.pharmacy ? ` • ${purchase.pharmacy}` : ""}</p>
                      <div className="action-row">
                        <span className="badge badge--muted">{ledger.snapshot.patients.find((patient) => patient.id === purchase.patient_id)?.name ?? "Unknown patient"}</span>
                        <button className="text-button" onClick={() => void ledger.archivePurchase(purchase)}>Archive</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeTab === "reports" && (
            <section className="panel-grid">
              <div className="panel">
                <div className="panel__header"><div><div className="eyebrow">Add report</div><h2>Store scans, PDFs, and summaries</h2></div></div>
                <form className="form-grid" onSubmit={(event) => void handleReportSubmit(event)}>
                  <PatientSelect value={reportForm.patient_id} onChange={(value) => setReportForm({ ...reportForm, patient_id: value })} patients={activePatients} />
                  <label className="field"><span>Title</span><input value={reportForm.title} onChange={(event) => setReportForm({ ...reportForm, title: event.target.value })} required /></label>
                  <label className="field"><span>Report type</span><input value={reportForm.report_type} onChange={(event) => setReportForm({ ...reportForm, report_type: event.target.value })} required /></label>
                  <label className="field"><span>Report date</span><input type="date" value={reportForm.report_date} onChange={(event) => setReportForm({ ...reportForm, report_date: event.target.value })} required /></label>
                  <label className="field"><span>File upload</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setReportFile(event.target.files?.[0] ?? null)} /></label>
                  <label className="field"><span>Fallback file path or URL</span><input value={reportForm.file_path} onChange={(event) => setReportForm({ ...reportForm, file_path: event.target.value })} /></label>
                  <label className="field field--full"><span>Summary</span><textarea rows={4} value={reportForm.summary} onChange={(event) => setReportForm({ ...reportForm, summary: event.target.value })} required /></label>
                  <button className="button button--primary" type="submit">Save report</button>
                </form>
              </div>

              <div className="panel">
                <div className="panel__header"><div><div className="eyebrow">Report archive</div><h2>Chronological history</h2></div></div>
                <div className="list">
                  {ledger.snapshot.reports.filter((report) => !report.is_archived).map((report) => (
                    <article className="list-card" key={report.id}>
                      <div className="list-card__title">{report.title}</div>
                      <div className="meta-line">{report.report_type} • {formatDate(report.report_date)}</div>
                      <p>{report.summary}</p>
                      <div className="action-row">
                        {report.file_url ? <a className="text-button" href={report.file_url} target="_blank" rel="noreferrer">Open file</a> : report.file_path ? <a className="text-button" href={report.file_path} target="_blank" rel="noreferrer">Open link</a> : <span className="badge badge--muted">Summary only</span>}
                        <button className="text-button" onClick={() => void ledger.archiveReport(report)}>Archive</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeTab === "setup" && <SetupView isConfigured={ledger.isConfigured} />}
        </section>
      </main>
    </div>
  );
}

function DashboardView({ ledger, onOpenTab }: { ledger: ReturnType<typeof useLedger>; onOpenTab: (tab: TabKey) => void }) {
  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="panel__header">
          <div><div className="eyebrow">Critical reminders</div><h2>Refills that need attention first</h2></div>
          <button className="button button--ghost" onClick={() => onOpenTab("medicines")}>Review all medicines</button>
        </div>
        <div className="reminder-grid">
          {ledger.reminders.length === 0 && <div className="empty-state">No immediate refill risk. Add medicines and purchases to start predictions.</div>}
          {ledger.reminders.map((item) => (
            <article className={`reminder-card reminder-card--${item.status}`} key={item.medicine.id}>
              <div className="eyebrow">{item.patient.name}</div>
              <h3>{item.medicine.name}</h3>
              <p>{relativeDayLabel(item.daysLeft)}</p>
              <div className="meta-line">{item.remainingTablets} tablets left • {formatCurrency(item.remainingValue)} remaining</div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel-grid panel-grid--overview">
        <div className="panel">
          <div className="panel__header"><div><div className="eyebrow">Family summary</div><h2>Patient-level operational view</h2></div></div>
          <div className="list">
            {ledger.patientSummaries.map((summary) => (
              <article className="list-card" key={summary.patient.id}>
                <div className="list-card__title"><span className="accent-dot" style={{ background: summary.patient.color_accent }} />{summary.patient.name}</div>
                <div className="metric-grid">
                  <Metric label="Active medicines" value={String(summary.activeMedicines)} />
                  <Metric label="Critical refills" value={String(summary.criticalCount)} />
                  <Metric label="Monthly cost" value={formatCurrency(summary.monthlyCost)} />
                  <Metric label="Reports" value={String(summary.reportCount)} />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel__header"><div><div className="eyebrow">What to do next</div><h2>Practical usage flow</h2></div></div>
          <div className="steps">
            <div className="step"><span>1</span>Create a household Supabase account from the left rail.</div>
            <div className="step"><span>2</span>Add each elder as a patient, then enter active medicines with starting stock.</div>
            <div className="step"><span>3</span>Log each refill purchase so cost and stock forecasts stay accurate.</div>
            <div className="step"><span>4</span>Upload reports or paste report links to keep doctor visits contextual.</div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SetupView({ isConfigured }: { isConfigured: boolean }) {
  return (
    <section className="panel stack-md">
      <div className="panel__header">
        <div><div className="eyebrow">Configuration</div><h2>Supabase and GitHub Pages checklist</h2></div>
        <span className={`badge ${isConfigured ? "badge--good" : "badge--warn"}`}>{isConfigured ? "Connected" : "Needs SQL + bucket setup"}</span>
      </div>
      <div className="setup-grid">
        <div>
          <h3>Supabase</h3>
          <ol className="ordered">
            <li>Open the SQL editor and run the schema from <code>supabase/schema.sql</code>.</li>
            <li>Create a storage bucket named <code>reports</code>.</li>
            <li>Enable email/password auth in Supabase Authentication.</li>
            <li>Optional: replace the fallback URL/key via <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.</li>
          </ol>
        </div>
        <div>
          <h3>GitHub Pages</h3>
          <ol className="ordered">
            <li>Push this repo to GitHub.</li>
            <li>In repository settings, enable GitHub Pages using GitHub Actions.</li>
            <li>The included workflow builds and deploys on every push to <code>main</code>.</li>
            <li>After first deploy, install the PWA from mobile browser if desired.</li>
          </ol>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><div className="metric__label">{label}</div><div className="metric__value">{value}</div></div>;
}

function PatientSelect({ value, onChange, patients }: { value: string; onChange: (value: string) => void; patients: Patient[] }) {
  return (
    <label className="field">
      <span>Patient</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} required>
        <option value="">Select patient</option>
        {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
      </select>
    </label>
  );
}
