import { useState } from "react";
import { Link } from "react-router-dom";
import { ATTENDANCE_THRESHOLD } from "../utils/constants";
import { Avatar, EmptyState, Icon, ProgressBar, Skeleton } from "./ui";

/*
  Attendance records table, shared by Student Analytics and Section Attendance.
  Backend statuses come as "Present" / "Absent"; older code used lowercase and "late",
  so statuses are normalised here.
*/

const STATUS = {
  present: { label: "Present", badge: "ax-badge-success", icon: "check" },
  absent: { label: "Absent", badge: "ax-badge-danger", icon: "x" },
  late: { label: "Late", badge: "ax-badge-warning", icon: "clock" },
};

const normalizeStatus = (status) => {
  const s = String(status || "").trim().toLowerCase();
  return STATUS[s] ? s : "absent";
};

export const StatusBadge = ({ status }) => {
  const s = STATUS[normalizeStatus(status)];
  return (
    <span className={`ax-badge ${s.badge}`}>
      <Icon name={s.icon} size={12} />
      {s.label}
    </span>
  );
};

const formatDate = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const weekday = (date) => {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { weekday: "short" });
};

const AttendanceTable = ({
  records = [],
  showStudent = false,
  showDate = true,
  showSubject = true,
  showRegistration = false,
  showPeriod = false,
  loading = false,
  pageSize = 25,
  emptyTitle = "No attendance records found",
  emptyMessage,
}) => {
  const [visible, setVisible] = useState(pageSize);

  if (loading) {
    return (
      <div className="ax-card ax-card-pad" aria-busy="true" aria-label="Loading records">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Skeleton height={32} width={32} radius={10} />
              <Skeleton height={14} width="30%" />
              <Skeleton height={14} width="20%" style={{ marginLeft: "auto" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="ax-card">
        <EmptyState icon="clipboard" title={emptyTitle} message={emptyMessage} />
      </div>
    );
  }

  const showPct = records[0]?.percentage !== undefined;
  const shown = records.slice(0, visible);

  return (
    <div className="ax-card" style={{ overflow: "hidden" }}>
      <div className="ax-table-wrap">
        <table className="ax-table">
          <thead>
            <tr>
              {showStudent && <th scope="col">Student</th>}
              {showRegistration && <th scope="col">Registration no.</th>}
              {showDate && <th scope="col">Date</th>}
              {showPeriod && <th scope="col">Period</th>}
              {showSubject && <th scope="col">Subject</th>}
              <th scope="col">Status</th>
              {showPct && <th scope="col">Attendance %</th>}
            </tr>
          </thead>
          <tbody>
            {shown.map((record, idx) => {
              const name = record.studentName || record.student?.name || "—";
              const studentId = record.studentId || record.student?._id;
              return (
                <tr key={record._id || idx}>
                  {showStudent && (
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 160 }}>
                        <Avatar name={name} size={30} />
                        {studentId ? (
                          <Link
                            to={`/admin/students/${studentId}/analytics`}
                            style={{ fontWeight: 600, color: "var(--ax-text)", textDecoration: "none" }}
                            className="hover:underline"
                          >
                            {name}
                          </Link>
                        ) : (
                          <span style={{ fontWeight: 600, color: "var(--ax-text)" }}>{name}</span>
                        )}
                      </div>
                    </td>
                  )}
                  {showRegistration && (
                    <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, whiteSpace: "nowrap" }}>
                      {record.registrationNumber || "—"}
                    </td>
                  )}
                  {showDate && (
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div style={{ color: "var(--ax-text)", fontWeight: 500 }}>{formatDate(record.date)}</div>
                      <div style={{ fontSize: 12, color: "var(--ax-muted)" }}>{weekday(record.date)}</div>
                    </td>
                  )}
                  {showPeriod && (
                    <td style={{ whiteSpace: "nowrap" }}>
                      {record.period ? <span className="ax-badge">P{record.period}</span> : "—"}
                    </td>
                  )}
                  {showSubject && <td style={{ whiteSpace: "nowrap" }}>{record.subject || "—"}</td>}
                  <td>
                    <StatusBadge status={record.status} />
                  </td>
                  {showPct && (
                    <td style={{ minWidth: 150 }}>
                      {record.percentage !== undefined && record.percentage !== null ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ flex: 1 }}>
                            <ProgressBar value={record.percentage} threshold={ATTENDANCE_THRESHOLD} />
                          </div>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              fontVariantNumeric: "tabular-nums",
                              color: record.percentage >= ATTENDANCE_THRESHOLD ? "var(--ax-text)" : "var(--ax-danger)",
                            }}
                          >
                            {record.percentage}%
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          padding: "12px 16px",
          borderTop: "1px solid var(--ax-border)",
          background: "var(--ax-surface-2)",
          fontSize: 13,
          color: "var(--ax-muted)",
        }}
      >
        <span>
          Showing <strong style={{ color: "var(--ax-text)" }}>{shown.length}</strong> of {records.length} record
          {records.length !== 1 ? "s" : ""}
        </span>
        {records.length > visible && (
          <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={() => setVisible((v) => v + pageSize)}>
            Show {Math.min(pageSize, records.length - visible)} more
            <Icon name="chevronDown" size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default AttendanceTable;
