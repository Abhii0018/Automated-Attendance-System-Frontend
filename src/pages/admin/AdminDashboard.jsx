import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import useAuth from "../../hooks/useAuth";
import attendanceService from "../../services/attendanceService";
import authService from "../../services/authService";

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = { navy: "#0a1628", navyMid: "#102040", gold: "#c9a84c", white: "#ffffff", light: "#f4f6fa", border: "#dde3ef", mid: "#6b7280" };
const PAGE_W = "min(96vw, 1520px)";

const pct = (p, t) => t > 0 ? Math.round((p / t) * 100) : 0;
const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

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

// ─── Mini components ──────────────────────────────────────────────────────────
const StatCard = ({ label, value, color = C.gold, sub, badge }) => (
  <div style={{ background: "rgba(255,255,255,0.86)", border: "1px solid rgba(255,255,255,0.7)", borderRadius: "18px", padding: "26px", boxShadow: "0 18px 34px rgba(10,22,40,0.12)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
      <div style={{ fontWeight: 700, fontSize: "16px", color: C.navy, opacity: 0.8 }}>{label}</div>
      {badge ? <span style={{ padding: "3px 10px", borderRadius: "999px", background: "#fee2e2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: "11px", fontWeight: 800 }}>{badge}</span> : null}
    </div>
    <div style={{ fontSize: "38px", fontWeight: 900, color, margin: "10px 0 6px", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: "13px", color: C.mid, marginTop: "4px" }}>{sub}</div>}
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
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [teacherPunches, setTeacherPunches] = useState([]);
  const [pendingAdminRequests, setPendingAdminRequests] = useState([]);
  const [reviewedAdminRequests, setReviewedAdminRequests] = useState([]);
  const [reviewingAdminId, setReviewingAdminId] = useState("");
  const isFetchingRef = useRef(false);
  const rateLimitedUntilRef = useRef(0);

  const fetchOverview = useCallback(async () => {
    if (isFetchingRef.current) return;
    if (Date.now() < rateLimitedUntilRef.current) return;
    isFetchingRef.current = true;

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
      setTeacherPunches(data.teacherPunches || []);

      const pendingRes = await authService.getPendingTeacherApplications();
      setPendingTeachers(pendingRes.data || []);

      if (user?.isSuperAdmin) {
        const [pendingAdminsRes, reviewedAdminsRes] = await Promise.all([
          authService.getPendingAdminRequests(),
          authService.getReviewedAdminRequests(),
        ]);
        setPendingAdminRequests(pendingAdminsRes.data || []);
        setReviewedAdminRequests(reviewedAdminsRes.data || []);
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 429) {
        const retryAfterHeader = Number(err?.response?.headers?.["retry-after"] || 60);
        const retryMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0 ? retryAfterHeader * 1000 : 60000;
        rateLimitedUntilRef.current = Date.now() + retryMs;
        setError("Too many requests. Dashboard will retry automatically in about a minute.");
      } else {
        setError(err.response?.data?.message || err.message || "Failed to load dashboard data.");
      }
    } finally {
      setLoad(false);
      isFetchingRef.current = false;
    }
  }, [user?.isSuperAdmin]);

  useEffect(() => {
    fetchOverview();
    const timer = setInterval(() => {
      if (document.hidden) return;
      fetchOverview();
      gsap.fromTo(
        ".today-status-pulse",
        { opacity: 0.65, scale: 0.995 },
        { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" }
      );
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchOverview]);

  useEffect(() => {
    if (!loading) {
      gsap.fromTo(
        ".admin-anim",
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.55, ease: "power3.out" }
      );
    }
  }, [loading]);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const totalToday = stats ? stats.todayPresent + stats.todayAbsent : 0;
  const presentPct = stats ? pct(stats.todayPresent, totalToday) : 0;
  const absentPct = stats ? pct(stats.todayAbsent, totalToday) : 0;

  const QUICK = [
    { label: "Take Admission", to: "/admin/take-admission", sub: "Admit new student" },
    { label: "View All Students", to: "/admin/students", sub: "Browse student records", badge: stats?.totalStudents ?? 0 },
    { label: "View All Teachers", to: "/admin/teachers", sub: "Faculty directory", badge: stats?.totalTeachers ?? 0 },
    { label: "Teacher Applications", to: "/admin/teacher-applications", sub: "Super Admin approval queue", badge: pendingTeachers.length },
    ...(user?.isSuperAdmin
      ? [{ label: "Admin Requests", to: "/admin/teacher-applications#pending-admin-requests", sub: "Review pending admin access", badge: pendingAdminRequests.length }]
      : []),
    { label: "Manage Sections", to: "/admin/section-attendance", sub: "Section-wise attendance" },
  ];

  const reviewAdminAccess = async (adminId, action) => {
    setError("");
    setReviewingAdminId(adminId);
    try {
      let reason = "";
      if (action === "reject") {
        reason = window.prompt("Enter rejection reason (optional):") || "";
      }
      await authService.reviewAdminRequest(adminId, action, reason);
      await fetchOverview();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to review admin request.");
    } finally {
      setReviewingAdminId("");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 8% 10%, #c7d2fe 0%, #eaf1ff 30%, #e9eefc 64%, #eef2ff 100%)", fontFamily: "'Segoe UI','Inter',Arial,sans-serif" }}>

      {/* ── NAVY HEADER ─────────────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(120deg, ${C.navy} 0%, ${C.navyMid} 55%, #173465 100%)`, paddingTop: "88px", paddingBottom: "52px", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: `linear-gradient(to right, ${C.gold}, #e8c96a, ${C.gold})` }} />
        <div style={{ width: PAGE_W, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ color: C.gold, fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>Admin Workspace</div>
            <h1 style={{ color: C.white, fontSize: "clamp(30px,4vw,46px)", fontWeight: 900, margin: "0 0 8px" }}>
              {greeting()}, <span style={{ color: C.gold }}>{user?.name?.split(" ")[0] ?? "Admin"}</span>

            </h1>
            <p style={{ color: "rgba(255,255,255,0.62)", fontSize: "16px", margin: 0 }}>{today}</p>
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
      <div style={{ width: PAGE_W, margin: "0 auto", padding: "36px 24px 54px" }}>

        {/* Error */}
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", color: "#b91c1c", fontSize: "13px" }}>
            {error}
          </div>
        )}

        {/* STAT CARDS */}
        <div className="admin-anim" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "20px", marginBottom: "30px" }}>
          <StatCard label="Total Students" value={loading ? "…" : <AnimatedValue value={stats?.totalStudents ?? 0} />} color={C.navy} sub="Enrolled in system" badge="Live" />
          <StatCard label="Total Teachers" value={loading ? "…" : <AnimatedValue value={stats?.totalTeachers ?? 0} />} color="#4f46e5" sub="Active faculty" badge={`${loading ? "..." : pendingTeachers.length} pending`} />
          <StatCard label="Total Sections" value={loading ? "…" : <AnimatedValue value={stats?.totalSections ?? 0} />} color={C.gold} sub="Across all semesters" badge="Sem 1" />
          <StatCard label="Today's Attendance" value={loading ? "…" : totalToday > 0 ? <AnimatedValue value={presentPct} suffix="%" /> : "—"} color={presentPct >= 75 ? "#16a34a" : presentPct >= 60 ? "#d97706" : totalToday === 0 ? C.mid : "#dc2626"} sub={stats ? totalToday > 0 ? `${stats.todayPresent} present · ${stats.todayAbsent} absent` : "No attendance marked today" : "…"} badge={`${loading ? "..." : totalToday} today`} />
        </div>

        {/* MIDDLE ROW */}
        <div className="admin-anim today-status-pulse admin-main-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "24px", marginBottom: "30px" }}>

          {/* Today's Breakdown */}
          <div className="admin-hover-card" style={{ background: "rgba(255,255,255,0.86)", border: "1px solid rgba(255,255,255,0.7)", borderRadius: "18px", padding: "32px", boxShadow: "0 18px 34px rgba(10,22,40,0.12)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontWeight: 800, fontSize: "20px", color: C.navy, margin: 0 }}>Today's Attendance Breakdown</h2>
              {totalToday > 0 && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a", display: "inline-block", boxShadow: "0 0 0 4px rgba(22,163,74,0.12)" }} />}
            </div>

            {loading ? <div style={{ color: C.mid }}>Loading…</div> : totalToday === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: C.mid }}>
                  <div style={{ width: "42px", height: "42px", margin: "0 auto 10px", borderRadius: "11px", background: "#eef2ff", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "11px" }}>N/A</div>
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
          <div className="admin-hover-card" style={{ background: "rgba(255,255,255,0.86)", border: "1px solid rgba(255,255,255,0.7)", borderRadius: "18px", padding: "32px", boxShadow: "0 18px 34px rgba(10,22,40,0.12)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
            <h2 style={{ fontWeight: 800, fontSize: "20px", color: C.navy, margin: "0 0 20px" }}>Quick Actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {QUICK.map(a => (
                <Link key={a.to} to={a.to} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 18px", borderRadius: "12px", background: "rgba(244,246,250,0.9)", border: `1px solid ${C.border}`, textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(244,246,250,0.9)"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: C.navy }}>{a.label}</div>
                    <div style={{ fontSize: "12px", color: C.mid, marginTop: "2px" }}>{a.sub}</div>
                  </div>
                  {typeof a.badge === "number" && (
                    <span style={{ minWidth: "28px", height: "24px", padding: "0 8px", borderRadius: "999px", background: "#fee2e2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: "12px", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      {loading ? "…" : a.badge}
                    </span>
                  )}
                  <span style={{ color: C.mid, fontSize: "13px" }}>→</span>
                </Link>
              ))}
            </div>
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: `1px solid ${C.border}`, fontSize: "12px", color: C.mid }}>
              System time: <strong>{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</strong>
            </div>
          </div>
        </div>

        <div className="admin-anim admin-hover-card" style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 12px 28px rgba(10,22,40,0.1)", marginBottom: "28px", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
          <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: C.navy, fontWeight: 700 }}>Pending Teacher Applications (Super Admin): {loading ? "..." : pendingTeachers.length}</div>
            <Link to="/admin/teacher-applications" style={{ color: C.navy, textDecoration: "none", fontSize: "13px", borderBottom: `2px solid ${C.gold}` }}>
              Open Applications Page
            </Link>
          </div>
        </div>

        <div className="admin-anim admin-hover-card" style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 12px 28px rgba(10,22,40,0.1)", marginBottom: "28px", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
          <div style={{ padding: "22px 28px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "16px", color: C.navy, margin: 0 }}>Admin Access Management</h2>
              <p style={{ color: C.mid, fontSize: "13px", margin: "4px 0 0" }}>Super Admin approval required for all admin accounts</p>
            </div>
            <div style={{ background: "#e0e7ff", color: "#1e40af", border: "1px solid #c7d2fe", borderRadius: "999px", padding: "5px 12px", fontSize: "11px", fontWeight: 700 }}>
              Director: Abhishek Kumar
            </div>
          </div>
          {!user?.isSuperAdmin ? (
            <div style={{ padding: "16px 28px", color: C.mid, fontSize: "13px" }}>
              Only Super Admin can approve or reject admin requests.
            </div>
          ) : (
            <div style={{ padding: "16px 28px" }}>
              <div style={{ marginBottom: "14px", fontSize: "14px", fontWeight: 700, color: C.navy }}>
                Pending Requests: {pendingAdminRequests.length}
              </div>
              {pendingAdminRequests.length === 0 ? (
                <div style={{ color: C.mid, fontSize: "13px", marginBottom: "18px" }}>No pending admin requests.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
                  {pendingAdminRequests.map((admin) => (
                    <div key={admin._id} style={{ border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px", background: "rgba(244,246,250,0.9)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: C.navy }}>{admin.name}</div>
                          <div style={{ fontSize: "12px", color: C.mid }}>{admin.email}</div>
                          <div style={{ fontSize: "12px", color: C.mid, marginTop: "4px" }}>
                            {admin.designation || "-"} | {admin.department || "-"} | {admin.phone || "-"}
                          </div>
                          <div style={{ fontSize: "12px", color: C.navy, marginTop: "6px" }}>
                            Reason: {admin.adminAccessReason || "-"}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                          <button
                            type="button"
                            disabled={reviewingAdminId === admin._id}
                            onClick={() => reviewAdminAccess(admin._id, "approve")}
                            style={{ border: "none", background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", borderRadius: "8px", padding: "7px 12px", cursor: reviewingAdminId === admin._id ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: 700 }}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={reviewingAdminId === admin._id}
                            onClick={() => reviewAdminAccess(admin._id, "reject")}
                            style={{ border: "none", background: "linear-gradient(135deg, #dc2626, #b91c1c)", color: "#fff", borderRadius: "8px", padding: "7px 12px", cursor: reviewingAdminId === admin._id ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: 700 }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "12px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: C.navy, marginBottom: "8px" }}>Recently Reviewed</div>
                {reviewedAdminRequests.length === 0 ? (
                  <div style={{ color: C.mid, fontSize: "12px" }}>No reviewed admin requests yet.</div>
                ) : (
                  <div style={{ display: "grid", gap: "6px" }}>
                    {reviewedAdminRequests.slice(0, 5).map((admin) => (
                      <div key={admin._id} style={{ fontSize: "12px", color: C.mid, display: "flex", justifyContent: "space-between", gap: "12px" }}>
                        <span>{admin.name} ({admin.email})</span>
                        <span style={{ color: admin.adminAccessStatus === "approved" ? "#166534" : "#991b1b", fontWeight: 700 }}>
                          {admin.adminAccessStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="admin-anim admin-hover-card" style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 12px 28px rgba(10,22,40,0.1)", marginBottom: "28px", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
          <div style={{ padding: "22px 28px", borderBottom: `1px solid ${C.border}` }}>
            <h2 style={{ fontWeight: 800, fontSize: "16px", color: C.navy, margin: 0 }}>Teacher Punch Today</h2>
            <p style={{ color: C.mid, fontSize: "13px", margin: "4px 0 0" }}>Daily check-in/check-out timing of teachers</p>
          </div>
          {loading ? (
            <div style={{ padding: "24px 28px", color: C.mid }}>Loading...</div>
          ) : teacherPunches.length === 0 ? (
            <div style={{ padding: "24px 28px", color: C.mid }}>No teacher records found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.light}` }}>
                    {["Teacher", "Email", "Check In", "Check Out", "Status"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "11px 18px", fontSize: "11px", fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: "0.8px", background: C.light }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teacherPunches.map((row) => {
                    const status = row.checkOutAt ? "Checked Out" : row.checkInAt ? "Checked In" : "Pending";
                    const statusBg = row.checkOutAt ? "#dbeafe" : row.checkInAt ? "#dcfce7" : "#fef3c7";
                    const statusColor = row.checkOutAt ? "#1d4ed8" : row.checkInAt ? "#166534" : "#92400e";
                    return (
                      <tr key={row.teacherId} style={{ borderBottom: `1px solid ${C.light}` }}>
                        <td style={{ padding: "12px 18px", fontSize: "13px", fontWeight: 600, color: C.navy }}>{row.teacherName}</td>
                        <td style={{ padding: "12px 18px", fontSize: "13px", color: C.mid }}>{row.teacherEmail || "-"}</td>
                        <td style={{ padding: "12px 18px", fontSize: "13px", color: C.navy, fontFamily: "monospace" }}>
                          {row.checkInAt ? new Date(row.checkInAt).toLocaleTimeString("en-IN") : "-"}
                        </td>
                        <td style={{ padding: "12px 18px", fontSize: "13px", color: C.navy, fontFamily: "monospace" }}>
                          {row.checkOutAt ? new Date(row.checkOutAt).toLocaleTimeString("en-IN") : "-"}
                        </td>
                        <td style={{ padding: "12px 18px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, background: statusBg, color: statusColor }}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SUBMISSIONS TABLE */}
        <div className="admin-anim admin-hover-card" style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 12px 28px rgba(10,22,40,0.1)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
          <div style={{ padding: "22px 28px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "16px", color: C.navy, margin: 0 }}>Recent Attendance Submissions</h2>
              <p style={{ color: C.mid, fontSize: "13px", margin: "4px 0 0" }}>Latest records submitted by teachers</p>
            </div>
            <Link to="/admin/section-attendance" style={{ color: C.navy, fontWeight: 700, fontSize: "13px", textDecoration: "none", borderBottom: `2px solid ${C.gold}`, paddingBottom: "1px" }}>View Full Report →</Link>
          </div>

          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: C.mid }}>Loading…</div>
          ) : subs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", color: C.mid }}>
              <div style={{ width: "42px", height: "42px", margin: "0 auto 12px", borderRadius: "11px", background: "#eef2ff", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "11px" }}>N/A</div>
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
      <style>{`
        .admin-hover-card { transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
        .admin-hover-card:hover { transform: translateY(-4px); box-shadow: 0 22px 40px rgba(10,22,40,.16); border-color: #93c5fd; }
        @media (max-width: 1080px) {
          .admin-main-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;