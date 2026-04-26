import { intakeLabels, intakeSlots } from "../constants";
import type { DerivedMedicine } from "../types";

export function MedicineTable({ entries }: { entries: DerivedMedicine[] }) {
  return (
    <div className="table-shell">
      <table className="medicine-table">
        <thead>
          <tr>
            <th>Medicine</th>
            {intakeSlots.map((slot) => (
              <th key={slot}>{intakeLabels[slot]}</th>
            ))}
            <th>Times</th>
            <th>Days</th>
            <th>Days taken</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.medicine.id}>
              <td>
                <strong>{entry.medicine.name}</strong>
                <div className="table-sub">{entry.medicine.purpose}</div>
              </td>
              {intakeSlots.map((slot) => (
                <td key={slot}>{entry.medicine.timing_slots?.[slot] || "-"}</td>
              ))}
              <td>{entry.medicine.specific_times.join(", ") || "-"}</td>
              <td>{entry.medicine.specific_days.join(", ") || "Daily"}</td>
              <td>{entry.activeDaysTaken}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
