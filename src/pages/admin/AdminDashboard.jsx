import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import attendanceService from "../../services/attendanceService";

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = { navy: "#0a1628", navyMid: "#102040", gold: "#c9a84c", white: "#ffffff", light: "#f4f6fa", border: "#dde3ef", mid: "#6b7280" };

const pct = (p, t) => t > 0 ? Math.round((p / t) * 100) : 0;
const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

// ─── Mini components ──────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color = C.gold, sub }) => (
  <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "22px", boxShadow: "0 2px 12px rgba(10,22,40,0.06)" }}>
    <div style={{ fontSize: "28px" }}>{icon}</div>
    <div style={{ fontSize: "32px", fontWeight: 900, color, margin: "10px 0 4px", lineHeight: 1 }}>{value}</div>
    <div style={{ fontWeight: 700, fontSize: "14px", color: C.navy }}>{label}</div>
    {sub && <div style={{ fontSize: "12px", color: C.mid, marginTop: "3px" }}>{sub}</div>}
  </div>
);

const PctBadge = ({ p }) => {
  const color = p >= 75 ? "#16a34a" : p >= 60 ? "#d97706" : "#dc2626";
  const bg = p >= 75 ? "#dcfce7" : p >= 60 ? "#fef3c7" : "#fee2e2";
  return <span style={{ background: bg, color, padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700 }}>{p}%</span>;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [subs, setSubs] = useState([]);
  const [loading, setLoad] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await attendanceService.getAdminOverview();
        const data = res.data || res;
        setStats({
          totalStudents: data.totalStudents || 0,
          totalTeachers: data.totalTeachers || 0,
          totalSections: data.totalSections || 0,
          todayPresent: data.todayPresent || 0,
          todayAbsent: data.todayAbsent || 0,
        });
        setSubs(data.submissions || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load dashboard data.");
      } finally {
        setLoad(false);
      }
    };
    fetchOverview();
  }, []);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const totalToday = stats ? stats.todayPresent + stats.todayAbsent : 0;
  const presentPct = stats ? pct(stats.todayPresent, totalToday) : 0;
  const absentPct = stats ? pct(stats.todayAbsent, totalToday) : 0;

  const QUICK = [
    { label: "Take Admission", to: "/admin/take-admission", emoji: "🎓" },
    { label: "View All Students", to: "/admin/students", emoji: "📋" },
    { label: "View All Teachers", to: "/admin/teachers", emoji: "👨‍🏫" },
    { label: "Manage Sections", to: "/admin/section-attendance", emoji: "🏫" },
  ];


  return (
    <div style={{ minHeight: "100vh", background: C.light, fontFamily: "'Segoe UI','Inter',Arial,sans-serif" }}>

      {/* ── NAVY HEADER ─────────────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`, paddingTop: "80px", paddingBottom: "44px", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: `linear-gradient(to right, ${C.gold}, #e8c96a, ${C.gold})` }} />
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ color: C.gold, fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>🏛️ Admin Dashboard</div>
            <h1 style={{ color: C.white, fontSize: "clamp(24px,4vw,36px)", fontWeight: 900, margin: "0 0 8px" }}>
              {greeting()}, <span style={{ color: C.gold }}>{user?.name?.split(" ")[0] ?? "Admin"}</span>

            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>{today}</p>
          </div>
          {/* Admin badge */}
          <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", padding: "12px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", background: C.gold, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: C.navy, fontSize: "18px" }}>
              {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
            </div>
            <div>
              <div style={{ color: C.white, fontWeight: 700, fontSize: "14px" }}>{user?.name ?? "Administrator"}</div>
              <div style={{ color: C.gold, fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase" }}>Administrator</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 28px 48px" }}>

        {/* Error */}
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", color: "#b91c1c", fontSize: "13px" }}>
            ⚠️ {error}
          </div>
        )}

        {/* STAT CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "18px", marginBottom: "28px" }}>
          <StatCard icon="👥" label="Total Students" value={loading ? "…" : stats.totalStudents} color={C.navy} sub="Enrolled in system" />
          <StatCard icon="👨‍🏫" label="Total Teachers" value={loading ? "…" : stats.totalTeachers} color="#4f46e5" sub="Active faculty" />
          <StatCard icon="🏫" label="Total Sections" value={loading ? "…" : stats.totalSections} color={C.gold} sub="Across all semesters" />
          <StatCard icon="📈" label="Today's Attendance" value={loading ? "…" : totalToday > 0 ? `${presentPct}%` : "—"} color={presentPct >= 75 ? "#16a34a" : presentPct >= 60 ? "#d97706" : totalToday === 0 ? C.mid : "#dc2626"} sub={stats ? totalToday > 0 ? `${stats.todayPresent} present · ${stats.todayAbsent} absent` : "No attendance marked today" : "…"} />
        </div>

        {/* MIDDLE ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "24px", marginBottom: "28px" }}>

          {/* Today's Breakdown */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "28px", boxShadow: "0 2px 16px rgba(10,22,40,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontWeight: 800, fontSize: "16px", color: C.navy, margin: 0 }}>📊 Today's Attendance Breakdown</h2>
              {totalToday > 0 && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a", display: "inline-block", boxShadow: "0 0 0 4px rgba(22,163,74,0.12)" }} />}
            </div>

            {loading ? <div style={{ color: C.mid }}>Loading…</div> : totalToday === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: C.mid }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
                <p style={{ fontWeight: 600, margin: 0 }}>No attendance has been marked today yet.</p>
                <p style={{ fontSize: "13px", marginTop: "4px" }}>Sections will appear here once teachers submit attendance.</p>
              </div>
            ) : (
              <>
                {/* Segmented bar */}
                <div style={{ height: "10px", borderRadius: "6px", background: C.light, display: "flex", overflow: "hidden", marginBottom: "20px" }}>
                  <div style={{ background: "#16a34a", width: `${presentPct}%`, transition: "width 1s ease" }} />
                  <div style={{ background: "#dc2626", width: `${absentPct}%`, transition: "width 1s ease" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px" }}>
                  {[
                    { label: "Present", count: stats.todayPresent, pct: presentPct, color: "#16a34a", bg: "#dcfce7" },
                    { label: "Absent", count: stats.todayAbsent, pct: absentPct, color: "#dc2626", bg: "#fee2e2" },
                  ].map(item => (
                    <div key={item.label} style={{ background: item.bg, borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                      <div style={{ fontSize: "24px", fontWeight: 900, color: item.color }}>{item.count}</div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: item.color, marginTop: "2px" }}>{item.label}</div>
                      <div style={{ fontSize: "11px", color: item.color, opacity: 0.7, marginTop: "2px" }}>{item.pct}%</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "28px", boxShadow: "0 2px 16px rgba(10,22,40,0.07)" }}>
            <h2 style={{ fontWeight: 800, fontSize: "16px", color: C.navy, margin: "0 0 20px" }}>⚡ Quick Actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {QUICK.map(a => (
                <Link key={a.to} to={a.to} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderRadius: "10px", background: C.light, border: `1px solid ${C.border}`, textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = `rgba(201,168,76,0.1)`; e.currentTarget.style.borderColor = C.gold; }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.light; e.currentTarget.style.borderColor = C.border; }}
                >
                  <span style={{ fontSize: "20px" }}>{a.emoji}</span>
                  <span style={{ fontWeight: 600, fontSize: "14px", color: C.navy, flex: 1 }}>{a.label}</span>
                  <span style={{ color: C.mid, fontSize: "13px" }}>→</span>
                </Link>
              ))}
            </div>
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: `1px solid ${C.border}`, fontSize: "12px", color: C.mid }}>
              System time: <strong>{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</strong>
            </div>
          </div>
        </div>

        {/* SUBMISSIONS TABLE */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 16px rgba(10,22,40,0.07)" }}>
          <div style={{ padding: "22px 28px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "16px", color: C.navy, margin: 0 }}>🕒 Recent Attendance Submissions</h2>
              <p style={{ color: C.mid, fontSize: "13px", margin: "4px 0 0" }}>Latest records submitted by teachers</p>
            </div>
            <Link to="/admin/section-attendance" style={{ color: C.navy, fontWeight: 700, fontSize: "13px", textDecoration: "none", borderBottom: `2px solid ${C.gold}`, paddingBottom: "1px" }}>View Full Report →</Link>
          </div>

          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: C.mid }}>Loading…</div>
          ) : subs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", color: C.mid }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
              <p style={{ fontWeight: 600 }}>No attendance submissions yet.</p>
              <p style={{ fontSize: "13px", color: C.mid }}>Submissions will appear here once teachers mark attendance.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.light}` }}>
                    {["Teacher", "Section", "Semester", "Date", "Present/Total", "Attendance", "Status"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "11px 18px", fontSize: "11px", fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: "0.8px", background: C.light }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subs.map((row) => {
                    const p = pct(row.present, row.total);
                    const initials = row.teacherName?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "??";
                    return (
                      <tr key={row.id} style={{ borderBottom: `1px solid ${C.light}` }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f8faff"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "13px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "34px", height: "34px", background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: C.gold, fontWeight: 800, fontSize: "11px" }}>{initials}</div>
                            <span style={{ fontWeight: 600, fontSize: "13px", color: C.navy }}>{row.teacherName}</span>
                          </div>
                        </td>
                        <td style={{ padding: "13px 18px" }}><span style={{ background: "rgba(201,168,76,0.12)", color: C.navy, border: `1px solid rgba(201,168,76,0.3)`, padding: "3px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>{row.section}</span></td>
                        <td style={{ padding: "13px 18px", fontSize: "13px", color: C.mid, fontWeight: 600 }}>Sem {row.semester}</td>
                        <td style={{ padding: "13px 18px" }}>
                          <div style={{ fontSize: "13px", color: C.navy, fontFamily: "monospace" }}>{new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                        </td>
                        <td style={{ padding: "13px 18px", fontSize: "13px", color: C.navy, fontWeight: 700 }}>{row.present}<span style={{ color: C.mid, fontWeight: 400 }}>/{row.total}</span></td>
                        <td style={{ padding: "13px 18px" }}><PctBadge p={p} /></td>
                        <td style={{ padding: "13px 18px" }}>
                          <span style={{
                            padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 700,
                            background: p >= 75 ? "#dcfce7" : p >= 60 ? "#fef3c7" : "#fee2e2",
                            color: p >= 75 ? "#166534" : p >= 60 ? "#92400e" : "#991b1b"
                          }}>{p >= 75 ? "Good" : p >= 60 ? "Average" : "Low"}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;