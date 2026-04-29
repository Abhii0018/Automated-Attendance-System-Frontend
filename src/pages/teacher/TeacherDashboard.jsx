import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
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
const PAGE_W = "min(96vw, 1480px)";

const AnimatedValue = ({ value, decimals = 0, suffix = "" }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const obj = { v: 0 };
    const tween = gsap.to(obj, {
      v: target,
      duration: 0.9,
      ease: "power2.out",
      onUpdate: () => setDisplay(obj.v),
    });
    return () => tween.kill();
  }, [value]);

  return `${display.toFixed(decimals)}${suffix}`;
};

// ─── Tiny reusable components ─────────────────────────────────────────────────
const StatCard = ({ label, value, color = C.gold, sub, badge }) => (
  <div style={{
    background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px",
    padding: "28px 24px", boxShadow: "0 12px 26px rgba(10,22,40,0.09)",
    display: "flex", flexDirection: "column", gap: "6px",
  }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
      <div style={{ fontSize: "14px", lineHeight: 1, fontWeight: 700, color: C.navy, opacity: 0.82 }}>{label}</div>
      {badge ? <span style={{ padding: "3px 10px", borderRadius: "999px", background: "#fee2e2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: "11px", fontWeight: 800 }}>{badge}</span> : null}
    </div>
    <div style={{ fontSize: "34px", fontWeight: 900, color, lineHeight: 1, marginTop: "10px" }}>{value}</div>
    {sub && <div style={{ fontSize: "12px", color: C.mid }}>{sub}</div>}
  </div>
);

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [punch, setPunch] = useState({ checkInAt: null, checkOutAt: null });
  const [punchLoading, setPunchLoading] = useState(false);
  const [overview, setOverview] = useState({
    sections: [],
    stats: { totalClassesTaken: 0, averageAttendancePercentage: 0 },
    todayStatus: { classesTaken: 0, totalSections: 0 },
    history: [],
  });

  const fetchOverview = async () => {
    try {
      const res = await attendanceService.getTeacherOverview();
      setOverview(res.data || {});
      const punchRes = await attendanceService.getTeacherPunchToday();
      setPunch(punchRes.data || { checkInAt: null, checkOutAt: null });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const timer = setInterval(() => {
      fetchOverview();
      gsap.fromTo(
        ".teacher-today-pulse",
        { opacity: 0.65, scale: 0.995 },
        { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" }
      );
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!loading) {
      gsap.fromTo(
        ".teacher-anim",
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.55, ease: "power3.out" }
      );
    }
  }, [loading]);

  const refreshPunch = async () => {
    const punchRes = await attendanceService.getTeacherPunchToday();
    setPunch(punchRes.data || { checkInAt: null, checkOutAt: null });
  };

  const onCheckIn = async () => {
    setPunchLoading(true);
    try {
      await attendanceService.teacherCheckIn();
      await refreshPunch();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Check-in failed.");
    } finally {
      setPunchLoading(false);
    }
  };

  const onCheckOut = async () => {
    setPunchLoading(true);
    try {
      await attendanceService.teacherCheckOut();
      await refreshPunch();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Check-out failed.");
    } finally {
      setPunchLoading(false);
    }
  };

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
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 10% 10%, #dbeafe 0%, #f4f6fa 40%, #eef2ff 100%)", fontFamily: "'Segoe UI','Inter',Arial,sans-serif" }}>

      {/* ── TOP HEADER BAR ─────────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(120deg, ${C.navy} 0%, ${C.navyMid} 50%, #173465 100%)`, paddingTop: "88px", paddingBottom: "54px", position: "relative" }}>
        {/* Gold top accent */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: `linear-gradient(to right, ${C.gold}, #e8c96a, ${C.gold})`, zIndex: 1 }} />

        <div style={{ width: PAGE_W, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ color: C.gold, fontSize: "12px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>
                Teacher Dashboard
              </div>
              <h1 style={{ color: C.white, fontSize: "clamp(30px,4vw,44px)", fontWeight: 900, margin: "0 0 8px", lineHeight: 1.1 }}>
                Hello, <span style={{ color: C.gold }}>{firstName}</span>
              </h1>
              <p style={{ color: "rgba(255,255,255,0.62)", fontSize: "16px", margin: 0 }}>{today}</p>
            </div>

            {/* Quick Mark Attendance CTA in header */}
            <Link to="/teacher/mark-attendance" style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: C.gold, color: C.navy, padding: "12px 24px",
              borderRadius: "10px", textDecoration: "none", fontWeight: 800,
              fontSize: "14px", boxShadow: "0 4px 20px rgba(201,168,76,0.35)",
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}>
              Mark Attendance
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
                  <span key={`${s.semester}-${s.section}-${s.subject}`} style={{
                    background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.35)",
                    color: C.gold, padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                  }}>
                    Sem {s.semester} · Sec {s.section} · {s.subject}
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
      <div style={{ width: PAGE_W, margin: "0 auto", padding: "36px 24px 52px" }}>

        {/* ── STAT CARDS ROW ─────────────────────────────────────────────── */}
        <div className="teacher-anim" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          <StatCard label="Classes Today" value={loading ? "…" : <AnimatedValue value={todayStatus?.classesTaken ?? 0} />} color={C.gold} sub="sessions marked today" badge={`${loading ? "..." : todayStatus?.classesTaken ?? 0} done`} />
          <StatCard label="Assigned Sections" value={loading ? "…" : <AnimatedValue value={todayStatus?.totalSections ?? sections?.length ?? 0} />} color={C.navy} sub="total sections" badge={`${loading ? "..." : todayStatus?.totalSections ?? sections?.length ?? 0} active`} />
          <StatCard label="Total Classes" value={loading ? "…" : <AnimatedValue value={stats?.totalClassesTaken ?? 0} />} color="#4f46e5" sub="all-time sessions" badge="All time" />
          <StatCard label="Avg Attendance" value={loading ? "…" : <AnimatedValue value={stats?.averageAttendancePercentage ?? 0} decimals={1} suffix="%" />} color={coverage >= 80 ? "#16a34a" : coverage >= 60 ? C.gold : "#dc2626"} sub="average across sections" badge={`${loading ? "..." : coverage}% coverage`} />
        </div>

        <div className="teacher-anim teacher-hover-card teacher-today-pulse" style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "18px", marginBottom: "24px", boxShadow: "0 2px 12px rgba(10,22,40,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: C.navy }}>Today Attendance Punch</div>
              <div style={{ fontSize: "12px", color: C.mid }}>
                Check-in: {punch.checkInAt ? new Date(punch.checkInAt).toLocaleTimeString("en-IN") : "Not done"} | Check-out: {punch.checkOutAt ? new Date(punch.checkOutAt).toLocaleTimeString("en-IN") : "Not done"}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={onCheckIn}
                disabled={punchLoading || !!punch.checkInAt}
                style={{ border: "none", background: "#16a34a", color: "#fff", borderRadius: "8px", padding: "8px 12px", cursor: punchLoading || punch.checkInAt ? "not-allowed" : "pointer" }}
              >
                Check In
              </button>
              <button
                onClick={onCheckOut}
                disabled={punchLoading || !punch.checkInAt || !!punch.checkOutAt}
                style={{ border: "none", background: "#0a1628", color: "#fff", borderRadius: "8px", padding: "8px 12px", cursor: punchLoading || !punch.checkInAt || punch.checkOutAt ? "not-allowed" : "pointer" }}
              >
                Check Out
              </button>
            </div>
          </div>
        </div>

        {/* ── MAIN TWO-COLUMN ────────────────────────────────────────────── */}
        <div className="teacher-anim teacher-today-pulse teacher-main-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "24px", marginBottom: "30px" }}>

          {/* Mark Attendance Card */}
          <div className="teacher-hover-card" style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "32px 28px", boxShadow: "0 2px 16px rgba(10,22,40,0.07)" }}>
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

          {/* Quick Actions + Today's Summary */}
          <div className="teacher-hover-card" style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "28px", boxShadow: "0 2px 16px rgba(10,22,40,0.07)" }}>
            <h3 style={{ fontWeight: 800, fontSize: "18px", color: C.navy, margin: "0 0 14px", display: "flex", alignItems: "center", gap: "8px" }}>
              Quick Actions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
              <Link
                to="/teacher/mark-attendance"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "10px", textDecoration: "none", border: `1px solid ${C.border}`, background: "rgba(244,246,250,0.9)" }}
              >
                <span style={{ color: C.navy, fontSize: "13px", fontWeight: 700 }}>Mark Attendance</span>
                <span style={{ padding: "2px 10px", borderRadius: "999px", background: "#fee2e2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: "11px", fontWeight: 800 }}>
                  {loading ? "..." : `${todayStatus?.classesTaken ?? 0}/${todayStatus?.totalSections ?? sections?.length ?? 0}`}
                </span>
              </Link>
              <button
                type="button"
                onClick={fetchOverview}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "10px", border: `1px solid ${C.border}`, background: "rgba(244,246,250,0.9)", cursor: "pointer" }}
              >
                <span style={{ color: C.navy, fontSize: "13px", fontWeight: 700 }}>Refresh Overview</span>
                <span style={{ padding: "2px 10px", borderRadius: "999px", background: "#fee2e2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: "11px", fontWeight: 800 }}>
                  Live
                </span>
              </button>
            </div>
            <h3 style={{ fontWeight: 800, fontSize: "18px", color: C.navy, margin: "0 0 20px", display: "flex", alignItems: "center", gap: "8px" }}>
              Today's Summary
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
        <div className="teacher-anim teacher-hover-card" style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "28px", boxShadow: "0 2px 16px rgba(10,22,40,0.07)" }}>
          <h3 style={{ fontWeight: 800, fontSize: "18px", color: C.navy, margin: "0 0 20px", display: "flex", alignItems: "center", gap: "8px" }}>
            Recent Attendance History
          </h3>

          {loading ? (
            <p style={{ color: C.mid, fontSize: "14px" }}>Loading…</p>
          ) : history && history.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.light}` }}>
                    {["Date", "Semester · Section · Subject", "Present", "Absent", "Total"].map((h) => (
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
                        Sem {item.semester} · Sec {item.section} · {item.subject || "N/A"}
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
      <style>{`
        .teacher-hover-card { transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
        .teacher-hover-card:hover { transform: translateY(-4px); box-shadow: 0 20px 34px rgba(10,22,40,.15); border-color: #93c5fd; }
        @media (max-width: 1080px) {
          .teacher-main-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default TeacherDashboard;