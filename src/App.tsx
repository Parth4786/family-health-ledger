import { FormEvent, useMemo, useState } from "react";
import { formatCurrency, todayIso } from "./lib/date";
import { useLedger } from "./hooks/useLedger";
import { accentColors, emptyTiming, intakeLabels, intakeSlots, statusLabel, tabs, weekdays } from "./constants";
import { DashboardView } from "./components/DashboardView";
import { PatientProfileView } from "./components/PatientProfileView";
import { MedicineTable } from "./components/MedicineTable";
import { Metric, PatientSelect } from "./components/shared";
import type { IntakeSlot, Report, TabKey } from "./types";

export default function App() {
  const ledger = useLedger();
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [selectedPatientId, setSelectedPatientId] = useState("");
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
    tablets_per_strip: "15",
    initial_strips_bought: "1",
    initial_total_cost: "75",
    start_date: todayIso(),
    duration_days: "",
    dosage_notes: "",
    specific_times: "",
    notes: "",
    schedule: "Daily",
    specific_days: [...weekdays],
    timing_slots: emptyTiming(),
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
  const [dailyLogForm, setDailyLogForm] = useState({
    patient_id: "",
    logged_on: todayIso(),
    bp_systolic: "",
    bp_diastolic: "",
    pulse: "",
    sugar: "",
    temperature: "",
    weight: "",
    notes: "",
  });
  const [reportFile, setReportFile] = useState<File | null>(null);

  const activePatients = useMemo(
    () => ledger.snapshot.patients.filter((patient) => !patient.is_archived),
    [ledger.snapshot.patients],
  );
  const selectedPatient = activePatients.find((patient) => patient.id === selectedPatientId) ?? activePatients[0];

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
      timing_slots: medicineForm.timing_slots,
      specific_days: medicineForm.specific_days,
      specific_times: medicineForm.specific_times.split(",").map((entry) => entry.trim()).filter(Boolean),
      duration_days: medicineForm.duration_days ? Number(medicineForm.duration_days) : null,
      dosage_notes: medicineForm.dosage_notes,
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
      tablets_per_strip: "15",
      initial_strips_bought: "1",
      initial_total_cost: "75",
      start_date: todayIso(),
      duration_days: "",
      dosage_notes: "",
      specific_times: "",
      notes: "",
      schedule: "Daily",
      specific_days: [...weekdays],
      timing_slots: emptyTiming(),
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

  async function handleDailyLogSubmit(event: FormEvent) {
    event.preventDefault();
    await ledger.addDailyLog({
      patient_id: dailyLogForm.patient_id,
      logged_on: dailyLogForm.logged_on,
      bp_systolic: dailyLogForm.bp_systolic ? Number(dailyLogForm.bp_systolic) : null,
      bp_diastolic: dailyLogForm.bp_diastolic ? Number(dailyLogForm.bp_diastolic) : null,
      pulse: dailyLogForm.pulse ? Number(dailyLogForm.pulse) : null,
      sugar: dailyLogForm.sugar ? Number(dailyLogForm.sugar) : null,
      temperature: dailyLogForm.temperature ? Number(dailyLogForm.temperature) : null,
      weight: dailyLogForm.weight ? Number(dailyLogForm.weight) : null,
      notes: dailyLogForm.notes,
    });
    setDailyLogForm({
      patient_id: dailyLogForm.patient_id,
      logged_on: todayIso(),
      bp_systolic: "",
      bp_diastolic: "",
      pulse: "",
      sugar: "",
      temperature: "",
      weight: "",
      notes: "",
    });
  }

  async function openReport(report: Report) {
    const url = await ledger.getReportUrl(report);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  function toggleSpecificDay(day: string) {
    const nextDays = medicineForm.specific_days.includes(day)
      ? medicineForm.specific_days.filter((entry) => entry !== day)
      : [...medicineForm.specific_days, day];
    setMedicineForm({ ...medicineForm, specific_days: nextDays });
  }

  function updateTiming(slot: IntakeSlot, value: string) {
    setMedicineForm({
      ...medicineForm,
      timing_slots: {
        ...medicineForm.timing_slots,
        [slot]: value,
      },
    });
  }

  return (
    <div className="shell">
      <header className="masthead">
        <div className="masthead__copy">
          <div className="eyebrow">Family Health Ledger</div>
          <h1>Caregiver-led patient profiles, refill planning, private reports, and daily vitals in one shared place.</h1>
          <p>The current access model uses one shared household sign-in. Report links are generated only on click, so files stay private to signed-in household use.</p>
        </div>
        <div className="masthead__stats">
          <Metric label="Monthly cost" value={formatCurrency(ledger.stats.monthlyCost)} />
          <Metric label="Critical refills" value={String(ledger.stats.criticalCount)} />
          <Metric label="Reports" value={String(ledger.stats.totalReports)} />
          <Metric label="Patients" value={String(ledger.stats.activePatients)} />
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <div className="card card--nav">
            <div className="status-chip">
              <span className={`status-dot status-dot--${ledger.syncStatus}`} />
              {statusLabel(ledger.syncStatus)}
            </div>
            <div className="nav-list">
              {tabs.map((tab) => (
                <button key={tab.key} className={`nav-item ${activeTab === tab.key ? "nav-item--active" : ""}`} onClick={() => setActiveTab(tab.key)}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-label">Household access</div>
            {ledger.session ? (
              <div className="stack-sm">
                <div className="auth-meta">{ledger.session.user.email}</div>
                <button className="button button--ghost button--block" onClick={() => void ledger.signOut()}>Sign out</button>
              </div>
            ) : (
              <form className="stack-sm" onSubmit={(event) => void handleAuthSubmit(event)}>
                <div className="toggle-row">
                  <button type="button" className={`toggle-pill ${authMode === "signup" ? "toggle-pill--active" : ""}`} onClick={() => setAuthMode("signup")}>Create</button>
                  <button type="button" className={`toggle-pill ${authMode === "signin" ? "toggle-pill--active" : ""}`} onClick={() => setAuthMode("signin")}>Sign in</button>
                </div>
                {authMode === "signup" && <label className="field"><span>Household name</span><input value={householdName} onChange={(event) => setHouseholdName(event.target.value)} required /></label>}
                <label className="field"><span>Email</span><input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} required /></label>
                <label className="field"><span>Password</span><input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} required minLength={6} /></label>
                <button className="button button--primary button--block" type="submit">{authMode === "signup" ? "Create account" : "Sign in"}</button>
              </form>
            )}
            {ledger.error && <div className="inline-alert">{ledger.error}</div>}
          </div>

          <div className="card">
            <div className="section-label">Patient directory</div>
            <div className="directory">
              {activePatients.map((patient) => (
                <button
                  key={patient.id}
                  className={`directory-item ${selectedPatient?.id === patient.id ? "directory-item--active" : ""}`}
                  onClick={() => {
                    setSelectedPatientId(patient.id);
                    setActiveTab("patients");
                  }}
                >
                  <span className="accent-dot" style={{ background: patient.color_accent }} />
                  <span>{patient.name}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="workspace">
          {activeTab === "dashboard" && <DashboardView ledger={ledger} onOpenProfile={(patientId) => { setSelectedPatientId(patientId); setActiveTab("patients"); }} />}

          {activeTab === "patients" && (
            <div className="stack-lg">
              <PatientProfileView
                patient={selectedPatient}
                patientSummaries={ledger.patientSummaries}
                derivedMedicines={ledger.derivedMedicines}
                reports={ledger.snapshot.reports}
                dailyLogs={ledger.snapshot.dailyLogs}
                purchases={ledger.snapshot.purchases}
                onOpenReport={openReport}
                onArchiveLog={ledger.archiveDailyLog}
                onToggleMedicine={ledger.toggleMedicineActive}
                onArchiveMedicine={ledger.archiveMedicine}
              />
              <section className="panel">
                <div className="panel__header"><div><div className="eyebrow">Add patient</div><h2>Grow the family directory</h2></div></div>
                <form className="form-grid" onSubmit={(event) => void handlePatientSubmit(event)}>
                  <label className="field"><span>Name</span><input value={patientForm.name} onChange={(event) => setPatientForm({ ...patientForm, name: event.target.value })} required /></label>
                  <label className="field"><span>Relationship</span><input value={patientForm.relationship} onChange={(event) => setPatientForm({ ...patientForm, relationship: event.target.value })} required /></label>
                  <label className="field"><span>Birth year</span><input type="number" value={patientForm.birth_year} onChange={(event) => setPatientForm({ ...patientForm, birth_year: event.target.value })} /></label>
                  <label className="field"><span>Accent</span><select value={patientForm.color_accent} onChange={(event) => setPatientForm({ ...patientForm, color_accent: event.target.value })}>{accentColors.map((color) => <option key={color} value={color}>{color}</option>)}</select></label>
                  <label className="field field--full"><span>Conditions</span><textarea rows={3} value={patientForm.conditions} onChange={(event) => setPatientForm({ ...patientForm, conditions: event.target.value })} /></label>
                  <label className="field field--full"><span>Notes</span><textarea rows={3} value={patientForm.notes} onChange={(event) => setPatientForm({ ...patientForm, notes: event.target.value })} /></label>
                  <button className="button button--primary" type="submit">Save patient</button>
                </form>
              </section>
            </div>
          )}

          {activeTab === "medicines" && (
            <div className="stack-lg">
              <section className="panel panel--wide">
                <div className="panel__header"><div><div className="eyebrow">Medicine planner</div><h2>Capture exact timing and course rules</h2></div></div>
                <form className="form-grid" onSubmit={(event) => void handleMedicineSubmit(event)}>
                  <PatientSelect value={medicineForm.patient_id} onChange={(value) => setMedicineForm({ ...medicineForm, patient_id: value })} patients={activePatients} />
                  <label className="field"><span>Medicine name</span><input value={medicineForm.name} onChange={(event) => setMedicineForm({ ...medicineForm, name: event.target.value })} required /></label>
                  <label className="field"><span>Purpose</span><input value={medicineForm.purpose} onChange={(event) => setMedicineForm({ ...medicineForm, purpose: event.target.value })} required /></label>
                  <label className="field"><span>Dosage per day</span><input type="number" step="0.5" min="0.5" value={medicineForm.dosage_per_day} onChange={(event) => setMedicineForm({ ...medicineForm, dosage_per_day: event.target.value })} required /></label>
                  <label className="field"><span>Schedule label</span><input value={medicineForm.schedule} onChange={(event) => setMedicineForm({ ...medicineForm, schedule: event.target.value })} required /></label>
                  <label className="field"><span>Start date</span><input type="date" value={medicineForm.start_date} onChange={(event) => setMedicineForm({ ...medicineForm, start_date: event.target.value })} required /></label>
                  <label className="field"><span>Course days</span><input type="number" min="1" value={medicineForm.duration_days} onChange={(event) => setMedicineForm({ ...medicineForm, duration_days: event.target.value })} placeholder="Optional" /></label>
                  <label className="field"><span>Tablets per strip</span><input type="number" min="1" value={medicineForm.tablets_per_strip} onChange={(event) => setMedicineForm({ ...medicineForm, tablets_per_strip: event.target.value })} required /></label>
                  <label className="field"><span>Initial strips</span><input type="number" min="1" step="0.5" value={medicineForm.initial_strips_bought} onChange={(event) => setMedicineForm({ ...medicineForm, initial_strips_bought: event.target.value })} required /></label>
                  <label className="field"><span>Initial total cost</span><input type="number" min="0" value={medicineForm.initial_total_cost} onChange={(event) => setMedicineForm({ ...medicineForm, initial_total_cost: event.target.value })} required /></label>
                  <label className="field"><span>Specific times</span><input value={medicineForm.specific_times} onChange={(event) => setMedicineForm({ ...medicineForm, specific_times: event.target.value })} placeholder="08:30, 20:30" /></label>
                  <label className="field field--full"><span>Dosage notes</span><textarea rows={2} value={medicineForm.dosage_notes} onChange={(event) => setMedicineForm({ ...medicineForm, dosage_notes: event.target.value })} /></label>
                  <label className="field field--full"><span>Internal notes</span><textarea rows={2} value={medicineForm.notes} onChange={(event) => setMedicineForm({ ...medicineForm, notes: event.target.value })} /></label>
                  <div className="field field--full"><span>Days of week</span><div className="chip-row">{weekdays.map((day) => <button key={day} type="button" className={`chip ${medicineForm.specific_days.includes(day) ? "chip--active" : ""}`} onClick={() => toggleSpecificDay(day)}>{day}</button>)}</div></div>
                  <div className="field field--full"><span>Meal-time table</span><div className="timing-grid">{intakeSlots.map((slot) => <label className="field" key={slot}><span>{intakeLabels[slot]}</span><input value={medicineForm.timing_slots[slot] ?? ""} onChange={(event) => updateTiming(slot, event.target.value)} placeholder="1 tablet" /></label>)}</div></div>
                  <button className="button button--primary" type="submit">Save medicine plan</button>
                </form>
              </section>
              <section className="panel"><div className="panel__header"><div><div className="eyebrow">Current medicines</div><h2>Active stock and timing table</h2></div></div><MedicineTable entries={ledger.derivedMedicines.filter((entry) => entry.medicine.is_active)} /></section>
            </div>
          )}

          {activeTab === "purchases" && (
            <div className="panel-grid">
              <section className="panel">
                <div className="panel__header"><div><div className="eyebrow">Refill ledger</div><h2>Track stock cost changes over time</h2></div></div>
                <form className="form-grid" onSubmit={(event) => void handlePurchaseSubmit(event)}>
                  <PatientSelect value={purchaseForm.patient_id} onChange={(value) => setPurchaseForm({ ...purchaseForm, patient_id: value })} patients={activePatients} />
                  <label className="field"><span>Medicine</span><select value={purchaseForm.medicine_id} onChange={(event) => setPurchaseForm({ ...purchaseForm, medicine_id: event.target.value })}><option value="">General purchase</option>{ledger.snapshot.medicines.filter((medicine) => !medicine.is_archived && (!purchaseForm.patient_id || medicine.patient_id === purchaseForm.patient_id)).map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.name}</option>)}</select></label>
                  <label className="field"><span>Label</span><input value={purchaseForm.label} onChange={(event) => setPurchaseForm({ ...purchaseForm, label: event.target.value })} required /></label>
                  <label className="field"><span>Purchase date</span><input type="date" value={purchaseForm.purchased_on} onChange={(event) => setPurchaseForm({ ...purchaseForm, purchased_on: event.target.value })} required /></label>
                  <label className="field"><span>Strips bought</span><input type="number" step="0.5" min="0.5" value={purchaseForm.strips_bought} onChange={(event) => setPurchaseForm({ ...purchaseForm, strips_bought: event.target.value })} required /></label>
                  <label className="field"><span>Tablets per strip</span><input type="number" min="1" value={purchaseForm.tablets_per_strip} onChange={(event) => setPurchaseForm({ ...purchaseForm, tablets_per_strip: event.target.value })} required /></label>
                  <label className="field"><span>Total cost</span><input type="number" min="0" value={purchaseForm.total_cost} onChange={(event) => setPurchaseForm({ ...purchaseForm, total_cost: event.target.value })} required /></label>
                  <label className="field"><span>Pharmacy</span><input value={purchaseForm.pharmacy} onChange={(event) => setPurchaseForm({ ...purchaseForm, pharmacy: event.target.value })} /></label>
                  <label className="field field--full"><span>Notes</span><textarea rows={2} value={purchaseForm.notes} onChange={(event) => setPurchaseForm({ ...purchaseForm, notes: event.target.value })} /></label>
                  <button className="button button--primary" type="submit">Save purchase</button>
                </form>
              </section>
              <section className="panel"><div className="panel__header"><div><div className="eyebrow">Purchase history</div><h2>Ledger timeline</h2></div></div><div className="timeline-list">{ledger.snapshot.purchases.filter((purchase) => !purchase.is_archived).map((purchase) => <article className="timeline-item" key={purchase.id}><div className="timeline-date">{purchase.purchased_on}</div><div><strong>{purchase.label}</strong><p>{purchase.strips_bought} strips, {purchase.tablets_per_strip} tablets per strip</p></div></article>)}</div></section>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="panel-grid">
              <section className="panel">
                <div className="panel__header"><div><div className="eyebrow">Private report archive</div><h2>Upload once, open later inside the household</h2></div></div>
                <form className="form-grid" onSubmit={(event) => void handleReportSubmit(event)}>
                  <PatientSelect value={reportForm.patient_id} onChange={(value) => setReportForm({ ...reportForm, patient_id: value })} patients={activePatients} />
                  <label className="field"><span>Title</span><input value={reportForm.title} onChange={(event) => setReportForm({ ...reportForm, title: event.target.value })} required /></label>
                  <label className="field"><span>Report type</span><input value={reportForm.report_type} onChange={(event) => setReportForm({ ...reportForm, report_type: event.target.value })} required /></label>
                  <label className="field"><span>Report date</span><input type="date" value={reportForm.report_date} onChange={(event) => setReportForm({ ...reportForm, report_date: event.target.value })} required /></label>
                  <label className="field"><span>Upload file</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => setReportFile(event.target.files?.[0] ?? null)} /></label>
                  <label className="field"><span>Fallback external URL</span><input value={reportForm.file_path} onChange={(event) => setReportForm({ ...reportForm, file_path: event.target.value })} /></label>
                  <label className="field field--full"><span>Summary</span><textarea rows={3} value={reportForm.summary} onChange={(event) => setReportForm({ ...reportForm, summary: event.target.value })} required /></label>
                  <button className="button button--primary" type="submit">Save report</button>
                </form>
              </section>
              <section className="panel"><div className="panel__header"><div><div className="eyebrow">Reports</div><h2>Household-only download access</h2></div></div><div className="stack-md">{ledger.snapshot.reports.filter((report) => !report.is_archived).map((report) => <article className="report-card" key={report.id}><div><strong>{report.title}</strong><div className="meta-line">{report.report_type}</div><p>{report.summary}</p></div><div className="action-row"><button className="button button--ghost" onClick={() => void openReport(report)}>Open securely</button><button className="text-button" onClick={() => void ledger.archiveReport(report)}>Archive</button></div></article>)}</div></section>
            </div>
          )}

          {activeTab === "setup" && (
            <div className="panel-grid">
              <section className="panel"><div className="panel__header"><div><div className="eyebrow">Setup</div><h2>Schema and privacy notes</h2></div><span className={`chip chip--static ${ledger.isConfigured ? "chip--success" : ""}`}>{ledger.isConfigured ? "Connected" : "Needs schema rerun"}</span></div><ol className="ordered"><li>Rerun `supabase/schema.sql` to add `daily_logs` and richer medicine timing columns.</li><li>Reports stay private in the `reports` bucket and open with short-lived signed URLs only when clicked.</li><li>Current privacy model is one shared family login. Separate-member invites would be a later backend step.</li></ol></section>
              <section className="panel"><div className="panel__header"><div><div className="eyebrow">Quick diary entry</div><h2>Test the new vitals log</h2></div></div><form className="form-grid" onSubmit={(event) => void handleDailyLogSubmit(event)}><PatientSelect value={dailyLogForm.patient_id} onChange={(value) => setDailyLogForm({ ...dailyLogForm, patient_id: value })} patients={activePatients} /><label className="field"><span>Date</span><input type="date" value={dailyLogForm.logged_on} onChange={(event) => setDailyLogForm({ ...dailyLogForm, logged_on: event.target.value })} required /></label><label className="field"><span>BP systolic</span><input value={dailyLogForm.bp_systolic} onChange={(event) => setDailyLogForm({ ...dailyLogForm, bp_systolic: event.target.value })} /></label><label className="field"><span>Pulse</span><input value={dailyLogForm.pulse} onChange={(event) => setDailyLogForm({ ...dailyLogForm, pulse: event.target.value })} /></label><label className="field field--full"><span>Notes</span><textarea rows={2} value={dailyLogForm.notes} onChange={(event) => setDailyLogForm({ ...dailyLogForm, notes: event.target.value })} /></label><button className="button button--primary" type="submit">Save sample log</button></form></section>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
