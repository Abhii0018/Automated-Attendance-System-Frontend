import { Link } from "react-router-dom";
import { ATTENDANCE_THRESHOLD } from "../utils/constants";
import { Avatar, Icon, ProgressBar } from "./ui";

/*
  Student tile used by the admin Students list (grid view).
  Attendance is shown only when the API sends it; otherwise "No data".
*/
const StudentCard = ({ student, onDelete, onLinkUser }) => {
  const pct = typeof student.attendancePercentage === "number" ? student.attendancePercentage : null;
  const isLow = pct !== null && pct < ATTENDANCE_THRESHOLD;
  const roll = student.classRollNumber ?? student.rollNumber;

  return (
    <article
      className="ax-card ax-card-hover"
      style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, height: "100%", position: "relative", overflow: "hidden" }}
    >
      {isLow && (
        <span aria-hidden="true" style={{ position: "absolute", inset: "0 0 auto 0", height: 3, background: "var(--ax-danger)" }} />
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Avatar name={student.name} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            title={student.name}
            style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--ax-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {student.name || "Unnamed student"}
          </h3>
          <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12.5, color: "var(--ax-muted)", marginTop: 2 }}>
            {student.registrationNumber || "—"}
          </div>
        </div>
        {student.userId ? (
          <span className="ax-badge ax-badge-success" title="Linked to a student login">
            <Icon name="check" size={11} /> Linked
          </span>
        ) : (
          <span className="ax-badge" title="No student login linked yet">Not linked</span>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {student.section ? (
          <span className="ax-badge ax-badge-info">Section {student.section}</span>
        ) : (
          <span className="ax-badge ax-badge-warning">Unassigned</span>
        )}
        {student.semester != null && <span className="ax-badge">Sem {student.semester}</span>}
        {roll != null && <span className="ax-badge">Roll {roll}</span>}
        {student.department && <span className="ax-badge">{student.department}</span>}
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginBottom: 6 }}>
          <span style={{ color: "var(--ax-muted)", fontWeight: 600 }}>Attendance</span>
          {pct === null ? (
            <span style={{ color: "var(--ax-muted)" }}>No data</span>
          ) : (
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              {isLow && <span className="ax-badge ax-badge-danger">Low</span>}
              <strong style={{ color: isLow ? "var(--ax-danger)" : "var(--ax-text)", fontVariantNumeric: "tabular-nums" }}>{pct}%</strong>
            </span>
          )}
        </div>
        <ProgressBar value={pct ?? 0} threshold={ATTENDANCE_THRESHOLD} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--ax-border)" }}>
        <Link to={`/admin/students/${student._id}/analytics`} className="ax-btn ax-btn-secondary ax-btn-sm" style={{ flex: 1 }}>
          <Icon name="chart" size={14} /> Analytics
        </Link>
        {onLinkUser && !student.userId && (
          <button type="button" className="ax-btn ax-btn-gold ax-btn-sm" onClick={() => onLinkUser(student)}>
            <Icon name="key" size={14} /> Link
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className="ax-btn ax-btn-danger ax-btn-sm"
            onClick={() => onDelete(student._id)}
            aria-label={`Delete ${student.name}`}
            title="Delete student"
          >
            <Icon name="x" size={14} />
          </button>
        )}
      </div>
    </article>
  );
};

export default StudentCard;
