import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import attendanceService from "../../services/attendanceService";

// ─── Theme (matches Landing page) ────────────────────────────────────────────
const C = {
  navy: "#0a1628",
  navyMid: "#102040",
  gold: "#c9a84c",
  white: "#ffffff",
  light: "#f4f6fa",
  border: "#dde3ef",
  mid: "#6b7280",
};

// ─── Tiny reusable components ─────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color = C.gold, sub }) => (
  <div style={{
    background: C.white, border: `1px solid ${C.border}`, borderRadius: "14px",
    padding: "24px 22px", boxShadow: "0 2px 12px rgba(10,22,40,0.06)",
    display: "flex", flexDirection: "column", gap: "6px",
  }}>
    <div style={{ fontSize: "28px", lineHeight: 1 }}>{icon}</div>
    <div style={{ fontSize: "28px", fontWeight: 900, color, lineHeight: 1, marginTop: "8px" }}>{value}</div>
    <div style={{ fontSize: "13px", fontWeight: 600, color: C.navy }}>{label}</div>
    {sub && <div style={{ fontSize: "11px", color: C.mid }}>{sub}</div>}
  </div>
);

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState({
    sections: [],
    stats: { totalClassesTaken: 0, averageAttendancePercentage: 0 },
    todayStatus: { classesTaken: 0, totalSections: 0 },
    history: [],
  });

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await attendanceService.getTeacherOverview();
        setOverview(res.data || {});
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const { sections, stats, todayStatus, history } = overview;
  const firstName = user?.name?.split(" ")[0] || "Teacher";

  // ── attendance coverage indicator
  const coverage = todayStatus?.totalSections > 0
    ? Math.round((todayStatus.classesTaken / todayStatus.totalSections) * 100)
    : 0;

  return (
    <div style={{ minHeight: "100vh", background: C.light, fontFamily: "'Segoe UI','Inter',Arial,sans-serif" }}>

      {/* ── TOP HEADER BAR ─────────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`, paddingTop: "80px", paddingBottom: "48px" }}>
        {/* Gold top accent */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: `linear-gradient(to right, ${C.gold}, #e8c96a, ${C.gold})`, zIndex: 1 }} />

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ color: C.gold, fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>
                👨‍🏫 Teacher Dashboard
              </div>
              <h1 style={{ color: C.white, fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, margin: "0 0 8px", lineHeight: 1.1 }}>
                Hello, <span style={{ color: C.gold }}>{firstName}</span>
              </h1>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", margin: 0 }}>{today}</p>
            </div>

            {/* Quick Mark Attendance CTA in header */}
            <Link to="/teacher/mark-attendance" style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: C.gold, color: C.navy, padding: "12px 24px",
              borderRadius: "10px", textDecoration: "none", fontWeight: 800,
              fontSize: "14px", boxShadow: "0 4px 20px rgba(201,168,76,0.35)",
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}>
              ✅ Mark Attendance
            </Link>
          </div>

          {/* Assigned Sections Chips */}
          <div style={{ marginTop: "24px" }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "10px" }}>
              Assigned Sections
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {sections && sections.length > 0 ? (
                sections.map((s) => (
                  <span key={`${s.semester}-${s.section}`} style={{
                    background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.35)",
                    color: C.gold, padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                  }}>
                    Sem {s.semester} · Sec {s.section}
                  </span>
                ))
              ) : (
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px" }}>No sections assigned yet</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 28px 48px" }}>

        {/* ── STAT CARDS ROW ─────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "18px", marginBottom: "28px" }}>
          <StatCard icon="📋" label="Classes Today" value={loading ? "…" : todayStatus?.classesTaken ?? 0} color={C.gold} sub="sessions marked today" />
          <StatCard icon="🏫" label="Assigned Sections" value={loading ? "…" : todayStatus?.totalSections ?? sections?.length ?? 0} color={C.navy} sub="total sections" />
          <StatCard icon="📊" label="Total Classes" value={loading ? "…" : stats?.totalClassesTaken ?? 0} color="#4f46e5" sub="all-time sessions" />
          <StatCard icon="📈" label="Avg Attendance" value={loading ? "…" : `${(stats?.averageAttendancePercentage ?? 0).toFixed(1)}%`} color={coverage >= 80 ? "#16a34a" : coverage >= 60 ? C.gold : "#dc2626"} sub="average across sections" />
        </div>

        {/* ── MAIN TWO-COLUMN ────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "24px", marginBottom: "28px" }}>

          {/* Mark Attendance Card */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "32px 28px", boxShadow: "0 2px 16px rgba(10,22,40,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
              <div style={{ width: "52px", height: "52px", background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 16px rgba(10,22,40,0.25)` }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "17px", color: C.navy }}>Mark Attendance</div>
                <div style={{ fontSize: "12px", color: C.mid }}>Record today's session</div>
              </div>
            </div>
            <p style={{ color: C.mid, fontSize: "14px", lineHeight: 1.7, margin: "0 0 24px" }}>
              Select a semester and section, then mark each student as present or absent. Attendance is locked once submitted for the day.
            </p>
            {/* Today's mini-progress */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: C.mid, marginBottom: "6px" }}>
                <span>Today's coverage</span>
                <span style={{ fontWeight: 700, color: C.navy }}>{coverage}%</span>
              </div>
              <div style={{ background: C.light, borderRadius: "4px", height: "6px" }}>
                <div style={{ background: C.gold, height: "100%", borderRadius: "4px", width: `${coverage}%`, transition: "width 0.5s ease" }} />
              </div>
            </div>
            <Link to="/teacher/mark-attendance" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`,
              color: C.gold, padding: "13px", borderRadius: "10px", textDecoration: "none",
              fontWeight: 800, fontSize: "14px", letterSpacing: "0.3px",
            }}>
              Start Marking →
            </Link>
          </div>

          {/* Today's Summary */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "28px", boxShadow: "0 2px 16px rgba(10,22,40,0.07)" }}>
            <h3 style={{ fontWeight: 800, fontSize: "16px", color: C.navy, margin: "0 0 20px", display: "flex", alignItems: "center", gap: "8px" }}>
              📅 Today's Summary
            </h3>
            {loading ? (
              <div style={{ color: C.mid, fontSize: "14px" }}>Loading…</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {[
                  ["Classes Marked", todayStatus?.classesTaken ?? 0, C.gold],
                  ["Total Sections", todayStatus?.totalSections ?? sections?.length ?? 0, C.navy],
                  ["All-Time Classes", stats?.totalClassesTaken ?? 0, "#4f46e5"],
                  ["Avg Attendance", `${(stats?.averageAttendancePercentage ?? 0).toFixed(1)}%`, "#16a34a"],
                ].map(([label, val, color], i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "13px 0", borderBottom: i < 3 ? `1px solid ${C.light}` : "none",
                  }}>
                    <span style={{ fontSize: "13px", color: C.mid }}>{label}</span>
                    <span style={{ fontSize: "15px", fontWeight: 800, color }}>{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RECENT ATTENDANCE HISTORY ─────────────────────────────────── */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "28px", boxShadow: "0 2px 16px rgba(10,22,40,0.07)" }}>
          <h3 style={{ fontWeight: 800, fontSize: "16px", color: C.navy, margin: "0 0 20px", display: "flex", alignItems: "center", gap: "8px" }}>
            🕒 Recent Attendance History
          </h3>

          {loading ? (
            <p style={{ color: C.mid, fontSize: "14px" }}>Loading…</p>
          ) : history && history.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.light}` }}>
                    {["Date", "Semester · Section", "Present", "Absent", "Total"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: "11px", fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: "0.8px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, i) => (
                    <tr key={item.id || i} style={{ borderBottom: `1px solid ${C.light}` }}
                      onMouseEnter={e => e.currentTarget.style.background = C.light}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "12px 14px", fontSize: "13px", color: C.mid, fontFamily: "monospace" }}>
                        {new Date(item.date).toLocaleDateString("en-IN")}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: "13px", color: C.navy, fontWeight: 600 }}>
                        Sem {item.semester} · Sec {item.section}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: "#dcfce7", color: "#166534", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700 }}>
                          {item.present}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: "#fee2e2", color: "#991b1b", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700 }}>
                          {item.absent}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: "13px", color: C.navy, fontWeight: 700 }}>
                        {item.totalStudents}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
              <p style={{ color: C.mid, fontSize: "14px", fontWeight: 500 }}>No attendance records yet</p>
              <p style={{ color: "#aaa", fontSize: "13px" }}>Records will appear here after your first session</p>
            </div>
          )}
        </div>

        {/* ── ERROR / TIP CARD ─────────────────────────────────────────── */}
        {(error || !loading) && (
          <div style={{
            marginTop: "20px", background: error ? "#fef2f2" : "#fffbeb",
            border: `1px solid ${error ? "#fca5a5" : "#fde68a"}`,
            borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: "12px",
          }}>
            <span style={{ fontSize: "20px" }}>{error ? "⚠️" : "💡"}</span>
            <div>
              <div style={{ fontWeight: 700, color: error ? "#991b1b" : "#92400e", fontSize: "14px", marginBottom: "2px" }}>
                {error ? "Error" : "Pro Tip"}
              </div>
              <div style={{ color: error ? "#b91c1c" : "#78350f", fontSize: "13px", lineHeight: 1.6 }}>
                {error || "Mark attendance within the first 10 minutes of class for accurate records."}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;