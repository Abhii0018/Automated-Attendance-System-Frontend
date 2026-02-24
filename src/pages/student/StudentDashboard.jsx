import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import attendanceService from "../../services/attendanceService";
import { ATTENDANCE_THRESHOLD } from "../../utils/constants";

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = { navy: "#0a1628", navyMid: "#102040", gold: "#c9a84c", white: "#ffffff", light: "#f4f6fa", border: "#dde3ef", mid: "#6b7280" };

// ─── Mock fallback ────────────────────────────────────────────────────────────
const MOCK_SUBJECTS = [
  { subject: "Mathematics", present: 14, total: 18, percentage: 78 },
  { subject: "Physics", present: 10, total: 16, percentage: 63 },
  { subject: "Chemistry", present: 15, total: 18, percentage: 83 },
  { subject: "Computer Science", present: 16, total: 18, percentage: 89 },
  { subject: "English", present: 13, total: 16, percentage: 81 },
];
const MOCK_RECORDS = [
  { _id: "1", date: "2024-03-10", subject: "Mathematics", status: "Present" },
  { _id: "2", date: "2024-03-09", subject: "Physics", status: "Absent" },
  { _id: "3", date: "2024-03-08", subject: "Chemistry", status: "Present" },
  { _id: "4", date: "2024-03-07", subject: "Computer Science", status: "Present" },
  { _id: "5", date: "2024-03-06", subject: "English", status: "Absent" },
];

const StudentDashboard = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [subjectStats, setSubjectStats] = useState([]);
  const [overallPct, setOverallPct] = useState(0);
  const [loading, setLoading] = useState(true);
  const circleRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await attendanceService.getMyAttendance();
        setRecords(res.records || []);
        setSubjectStats(res.subjectStats || MOCK_SUBJECTS);
        setOverallPct(res.overallPercentage || 72);
      } catch {
        setRecords(MOCK_RECORDS);
        setSubjectStats(MOCK_SUBJECTS);
        setOverallPct(72);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const isLow = overallPct < ATTENDANCE_THRESHOLD;
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const dashArr = (overallPct / 100) * circ;
  const firstName = user?.name?.split(" ")[0] || "Student";

  const present = records.filter(r => r.status?.toLowerCase() === "present").length;
  const absent = records.filter(r => r.status?.toLowerCase() === "absent").length;

  return (
    <div style={{ minHeight: "100vh", background: C.light, fontFamily: "'Segoe UI','Inter',Arial,sans-serif" }}>

      {/* ── NAVY HEADER ─────────────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`, paddingTop: "80px", paddingBottom: "44px", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: `linear-gradient(to right, ${C.gold}, #e8c96a, ${C.gold})` }} />
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ color: C.gold, fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>👩‍🎓 Student Dashboard</div>
            <h1 style={{ color: C.white, fontSize: "clamp(24px,4vw,36px)", fontWeight: 900, margin: "0 0 8px" }}>
              Hey, <span style={{ color: C.gold }}>{firstName}</span>!
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>{today}</p>
          </div>
          <Link to="/student/profile" style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", padding: "12px 20px", textDecoration: "none" }}>
            <div style={{ width: "40px", height: "40px", background: C.gold, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: C.navy, fontSize: "16px" }}>
              {firstName.charAt(0)}
            </div>
            <div>
              <div style={{ color: C.white, fontWeight: 700, fontSize: "14px" }}>{user?.name}</div>
              <div style={{ color: C.gold, fontSize: "11px" }}>View Profile →</div>
            </div>
          </Link>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 28px 48px" }}>

        {/* Low attendance warning */}
        {!loading && isLow && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "12px", padding: "14px 20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "22px" }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: "#b91c1c", fontSize: "14px" }}>Low Attendance Warning</div>
              <div style={{ color: "#dc2626", fontSize: "13px", marginTop: "2px" }}>
                Your attendance is <strong>{overallPct}%</strong> — below the required {ATTENDANCE_THRESHOLD}%. You may be barred from exams.
              </div>
            </div>
          </div>
        )}

        {/* TOP ROW — gauge + subjects */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "24px", marginBottom: "24px" }}>

          {/* Circular gauge */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "32px 24px", boxShadow: "0 2px 16px rgba(10,22,40,0.07)", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ color: C.mid, fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "20px" }}>Overall Attendance</div>
            <div style={{ position: "relative", width: "140px", height: "140px" }}>
              <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="70" cy="70" r={radius} fill="none" stroke={C.light} strokeWidth="10" />
                <circle cx="70" cy="70" r={radius} fill="none"
                  stroke={isLow ? "#ef4444" : C.gold} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${dashArr} ${circ}`}
                  style={{ transition: "stroke-dasharray 1.4s ease" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span ref={circleRef} style={{ fontSize: "26px", fontWeight: 900, color: isLow ? "#ef4444" : C.navy }}>{overallPct}%</span>
              </div>
            </div>
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: "14px", color: isLow ? "#ef4444" : "#16a34a" }}>
                {isLow ? "Below Threshold" : "Good Standing"}
              </div>
              <div style={{ color: C.mid, fontSize: "12px", marginTop: "4px" }}>Required: {ATTENDANCE_THRESHOLD}%</div>
            </div>
          </div>

          {/* Subject stats */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "28px", boxShadow: "0 2px 16px rgba(10,22,40,0.07)" }}>
            <h2 style={{ fontWeight: 800, fontSize: "16px", color: C.navy, margin: "0 0 20px", display: "flex", alignItems: "center", gap: "8px" }}>📚 Subject Summary</h2>
            {loading ? <div style={{ color: C.mid }}>Loading…</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {subjectStats.map((s, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: C.navy }}>{s.subject}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "12px", color: C.mid }}>{s.present}/{s.total}</span>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: s.percentage >= 75 ? "#16a34a" : "#dc2626" }}>{s.percentage}%</span>
                      </div>
                    </div>
                    <div style={{ height: "7px", background: C.light, borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${s.percentage}%`, background: s.percentage >= 75 ? C.gold : "#ef4444", borderRadius: "4px", transition: `width 0.8s ease ${i * 0.1}s` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* QUICK STAT CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "18px", marginBottom: "24px" }}>
          {[
            { icon: "✅", label: "Classes Attended", value: present, color: "#16a34a", bg: "#dcfce7" },
            { icon: "❌", label: "Classes Missed", value: absent, color: "#dc2626", bg: "#fee2e2" },
            { icon: "📊", label: "Overall Attendance", value: `${overallPct}%`, color: isLow ? "#dc2626" : C.navy, bg: isLow ? "#fee2e2" : C.light },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: "14px", padding: "22px", textAlign: "center", border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{s.icon}</div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: s.color, lineHeight: 1 }}>{loading ? "…" : s.value}</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: C.navy, marginTop: "6px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* RECENT ATTENDANCE TABLE */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 16px rgba(10,22,40,0.07)" }}>
          <div style={{ padding: "22px 28px", borderBottom: `1px solid ${C.border}` }}>
            <h2 style={{ fontWeight: 800, fontSize: "16px", color: C.navy, margin: 0 }}>🕒 Recent Attendance Records</h2>
          </div>
          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: C.mid }}>Loading…</div>
          ) : records.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.light}` }}>
                    {["Date", "Subject", "Status"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "11px 20px", fontSize: "11px", fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: "0.8px", background: C.light }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 10).map(r => {
                    const isPresent = r.status?.toLowerCase() === "present";
                    return (
                      <tr key={r._id} style={{ borderBottom: `1px solid ${C.light}` }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f8faff"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "12px 20px", fontSize: "13px", color: C.mid, fontFamily: "monospace" }}>
                          {new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td style={{ padding: "12px 20px", fontSize: "13px", fontWeight: 600, color: C.navy }}>{r.subject}</td>
                        <td style={{ padding: "12px 20px" }}>
                          <span style={{
                            padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 700,
                            background: isPresent ? "#dcfce7" : "#fee2e2",
                            color: isPresent ? "#166534" : "#991b1b"
                          }}>{r.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px", color: C.mid }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
              <p style={{ fontWeight: 600 }}>No attendance records yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;