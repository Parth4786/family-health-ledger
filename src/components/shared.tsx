import { formatCurrency } from "../lib/date";
import type { Patient } from "../types";

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <div className="metric__label">{label}</div>
      <div className="metric__value">{value}</div>
    </div>
  );
}

export function PatientSelect({
  value,
  onChange,
  patients,
}: {
  value: string;
  onChange: (value: string) => void;
  patients: Patient[];
}) {
  return (
    <label className="field">
      <span>Patient</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} required>
        <option value="">Select patient</option>
        {patients.map((patient) => (
          <option key={patient.id} value={patient.id}>
            {patient.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CostPill({ value }: { value: number }) {
  return <span className="chip chip--static">Monthly cost: {formatCurrency(value)}</span>;
}
