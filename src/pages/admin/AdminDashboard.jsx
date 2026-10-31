import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import attendanceService from "../../services/attendanceService";
import authService from "../../services/authService";
import {
  PageHeader,
  StatCard,
  CountUp,
  Skeleton,
  SkeletonRows,
  EmptyState,
  ProgressBar,
  Avatar,
  Alert,
  Icon,
} from "../../components/ui";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pct = (p, t) => (t > 0 ? Math.round((p / t) * 100) : 0);
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
const pctTone = (p) => (p >= 75 ? "success" : p >= 60 ? "warning" : "danger");
const pctLabel = (p) => (p >= 75 ? "Good" : p >= 60 ? "Average" : "Low");
const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : null);
const fmtDuration = (from, to) => {
  if (!from || !to) return null;
  const mins = Math.max(0, Math.round((new Date(to) - new Date(from)) / 60000));
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
};

// Card with a consistent header row.
const Panel = ({ id, title, subtitle, icon, actions, children, flush = false, className = "" }) => (
  <section id={id} className={`ax-card ax-fade-up ${className}`} style={{ overflow: "hidden", scrollMarginTop: 88 }}>
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        padding: "18px 22px",
        borderBottom: "1px solid var(--ax-border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        {icon && (
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--ax-surface-2)",
              border: "1px solid var(--ax-border)",
              color: "var(--ax-navy)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name={icon} size={18} />
          </span>
        )}
        <div style={{ minWidth: 0 }}>
          <h2 className="ax-section-title">{title}</h2>
          {subtitle && <p className="ax-section-sub">{subtitle}</p>}
        </div>
      </div>
      {actions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>{actions}</div>}
    </header>
    <div style={flush ? undefined : { padding: 22 }}>{children}</div>
  </section>
);

// Present/absent ring. Animates in from 0 on mount.
const Donut = ({ value, size = 148, stroke = 16 }) => {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(frame);
  }, [value]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${value}% present, ${100 - value}% absent`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ax-danger)" strokeOpacity="0.85" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ax-success)"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1s var(--ax-ease)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ax-text)", lineHeight: 1 }}>
          <CountUp value={value} suffix="%" />
        </div>
        <div style={{ fontSize: 12, color: "var(--ax-muted)", marginTop: 4, fontWeight: 600 }}>present</div>
      </div>
    </div>
  );
};

// Confirmation dialog for rejecting a request, with an optional reason.
const RejectDialog = ({ target, busy, onCancel, onConfirm }) => {
  const [reason, setReason] = useState("");
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div
      onClick={() => !busy && onCancel()}
      style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(11,21,48,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="adm-reject-title"
        className="ax-card ax-card-pad ax-fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 440, boxShadow: "var(--ax-shadow-lg)" }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--ax-danger-soft)", color: "var(--ax-danger)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="alert" size={20} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h3 id="adm-reject-title" style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--ax-text)" }}>
              Reject {target.kind}?
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--ax-muted)" }}>
              <strong style={{ color: "var(--ax-text-2)" }}>{target.name}</strong> will be notified that their request was rejected.
            </p>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(reason.trim());
          }}
          style={{ marginTop: 18 }}
        >
          <label htmlFor="adm-reject-reason" className="ax-label">
            Reason <span style={{ fontWeight: 400, color: "var(--ax-muted)" }}>(optional)</span>
          </label>
          <textarea
            id="adm-reject-reason"
            className="ax-input"
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Incomplete credentials"
            maxLength={300}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <button type="button" className="ax-btn ax-btn-secondary" onClick={onCancel} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="ax-btn ax-btn-danger" disabled={busy} style={{ borderColor: "var(--ax-danger)" }}>
              {busy ? <span className="ax-spinner" aria-hidden="true" /> : <Icon name="xCircle" size={16} />}
              {busy ? "Rejecting…" : "Reject request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PUNCH_STATUS = {
  out: { label: "Checked out", badge: "ax-badge-info" },
  in: { label: "On duty", badge: "ax-badge-success" },
  none: { label: "Not checked in", badge: "ax-badge-warning" },
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [subs, setSubs] = useState([]);
  const [loading, setLoad] = useState(true);
  const [error, setError] = useState("");
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [teacherPunches, setTeacherPunches] = useState([]);
  const [pendingAdminRequests, setPendingAdminRequests] = useState([]);
  const [reviewedAdminRequests, setReviewedAdminRequests] = useState([]);
  const [reviewingAdminId, setReviewingAdminId] = useState("");
  const [sendingParentEmails, setSendingParentEmails] = useState(false);
  const [parentEmailResult, setParentEmailResult] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [subSection, setSubSection] = useState("all");
  const [subSearch, setSubSearch] = useState("");
  const isFetchingRef = useRef(false);
  const rateLimitedUntilRef = useRef(0);

  const sendParentEmails = async () => {
    setSendingParentEmails(true);
    setParentEmailResult(null);
    try {
      const res = await attendanceService.sendDailyParentSummaries();
      const { sent = 0, skipped = 0, failed = 0 } = res.data || {};
      setParentEmailResult({
        ok: failed === 0,
        sent,
        skipped,
        failed,
        text: `Sent: ${sent} · Already sent / no email: ${skipped}${failed ? ` · Failed: ${failed}` : ""}`,
      });
      if (failed === 0) toast.success(`Parent summaries sent: ${sent} (skipped ${skipped})`);
      else toast.error(`${failed} parent email${failed === 1 ? "" : "s"} failed to send`);
    } catch (err) {
      const text = err.response?.data?.message || "Could not send parent emails.";
      setParentEmailResult({ ok: false, text });
      toast.error(text);
    } finally {
      setSendingParentEmails(false);
    }
  };

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
      setError("");
      setLastUpdated(new Date());
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
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchOverview]);

  const manualRefresh = async () => {
    if (Date.now() < rateLimitedUntilRef.current) {
      toast.info("Rate limit reached. Please wait a moment before refreshing.");
      return;
    }
    setRefreshing(true);
    await fetchOverview();
    setRefreshing(false);
  };

  const reviewAdminAccess = async (adminId, action, reason = "") => {
    const admin = pendingAdminRequests.find((a) => a._id === adminId);
    setReviewingAdminId(adminId);
    try {
      await authService.reviewAdminRequest(adminId, action, reason);
      toast.success(`${admin?.name || "Admin request"} ${action === "approve" ? "approved" : "rejected"}`);
      setRejectTarget(null);
      await fetchOverview();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to review admin request.");
    } finally {
      setReviewingAdminId("");
    }
  };

  const closeReject = useCallback(() => setRejectTarget(null), []);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const firstName = user?.name?.split(" ")[0] ?? "Admin";

  const totalToday = stats ? stats.todayPresent + stats.todayAbsent : 0;
  const presentPct = stats ? pct(stats.todayPresent, totalToday) : 0;
  const absentPct = stats ? pct(stats.todayAbsent, totalToday) : 0;

  const punchSummary = useMemo(() => {
    const out = teacherPunches.filter((r) => r.checkOutAt).length;
    const inNow = teacherPunches.filter((r) => r.checkInAt && !r.checkOutAt).length;
    return { out, inNow, none: teacherPunches.length - out - inNow };
  }, [teacherPunches]);

  const subSections = useMemo(() => [...new Set(subs.map((s) => s.section).filter(Boolean))].sort(), [subs]);
  const filteredSubs = useMemo(() => {
    const q = subSearch.trim().toLowerCase();
    return subs.filter(
      (s) =>
        (subSection === "all" || s.section === subSection) &&
        (!q || s.teacherName?.toLowerCase().includes(q) || s.section?.toLowerCase().includes(q))
    );
  }, [subs, subSection, subSearch]);

  const QUICK = [
    { label: "Take Admission", to: "/admin/take-admission", sub: "Admit new student", icon: "userPlus" },
    { label: "View All Students", to: "/admin/students", sub: "Browse student records", icon: "users", count: stats?.totalStudents ?? 0 },
    { label: "View All Teachers", to: "/admin/teachers", sub: "Faculty directory", icon: "teacher", count: stats?.totalTeachers ?? 0 },
    { label: "Teacher Applications", to: "/admin/teacher-applications", sub: "Super Admin approval queue", icon: "briefcase", count: pendingTeachers.length, alert: true },
    ...(user?.isSuperAdmin
      ? [{ label: "Admin Requests", to: "/admin/teacher-applications#pending-admin-requests", sub: "Review pending admin access", icon: "shield", count: pendingAdminRequests.length, alert: true }]
      : []),
    { label: "Manage Sections", to: "/admin/section-attendance", sub: "Section-wise attendance", icon: "layers" },
  ];

  return (
    <div className="ax-page">
      <div className="ax-container">
        <PageHeader
          eyebrow={`Admin workspace · ${today}`}
          title={
            <>
              {greeting()}, <span style={{ color: "var(--ax-blue)" }}>{firstName}</span>
            </>
          }
          subtitle={
            lastUpdated
              ? `Live overview · auto-refreshes every 30s · updated ${fmtTime(lastUpdated)}`
              : "Live overview of attendance, faculty and approvals"
          }
          actions={
            <>
              <button type="button" className="ax-btn ax-btn-secondary" onClick={manualRefresh} disabled={refreshing || loading}>
                {refreshing ? <span className="ax-spinner" aria-hidden="true" /> : <Icon name="refresh" size={16} />}
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
              <Link to="/admin/take-admission" className="ax-btn ax-btn-primary">
                <Icon name="userPlus" size={16} /> Take Admission
              </Link>
            </>
          }
        />

        {error && (
          <div style={{ marginBottom: 20 }}>
            <Alert tone={stats ? "warning" : "danger"} title={stats ? "Showing last loaded data" : "Couldn't load the dashboard"}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <span>{error}</span>
                <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={manualRefresh} disabled={refreshing}>
                  <Icon name="refresh" size={14} /> Retry
                </button>
              </div>
            </Alert>
          </div>
        )}

        {/* KPI row */}
        <div className="ax-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4" style={{ marginBottom: 24 }}>
          <StatCard label="Total Students" value={stats?.totalStudents ?? 0} icon="users" tone="navy" hint="Enrolled in system" loading={loading} />
          <StatCard
            label="Total Teachers"
            value={stats?.totalTeachers ?? 0}
            icon="teacher"
            tone="blue"
            hint={loading ? "Active faculty" : `Active faculty · ${pendingTeachers.length} pending application${pendingTeachers.length === 1 ? "" : "s"}`}
            loading={loading}
          />
          <StatCard label="Sections" value={stats?.totalSections ?? 0} icon="layers" tone="gold" hint="With attendance records" loading={loading} />
          <StatCard
            label="Today's Attendance"
            value={totalToday > 0 ? presentPct : "—"}
            suffix="%"
            icon="checkCircle"
            tone={totalToday > 0 ? pctTone(presentPct) : "navy"}
            hint={totalToday > 0 ? `${stats.todayPresent} present · ${stats.todayAbsent} absent` : "No attendance marked today"}
            loading={loading}
          />
        </div>

        {/* Pending applications callout */}
        {!loading && pendingTeachers.length > 0 && (
          <div
            className="ax-card ax-fade-up"
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", marginBottom: 24, borderColor: "#ecdcae", background: "linear-gradient(90deg, var(--ax-gold-soft), var(--ax-surface) 70%)", flexWrap: "wrap" }}
          >
            <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--ax-surface)", border: "1px solid #ecdcae", color: "#9a7420", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="bell" size={18} />
            </span>
            <div style={{ flex: "1 1 220px", minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: "var(--ax-text)", fontSize: 14 }}>
                {pendingTeachers.length} teacher application{pendingTeachers.length === 1 ? "" : "s"} awaiting review
              </div>
              <div style={{ fontSize: 13, color: "var(--ax-muted)" }}>
                Latest: {pendingTeachers.slice(0, 3).map((t) => t.name).filter(Boolean).join(", ")}
                {pendingTeachers.length > 3 ? ` and ${pendingTeachers.length - 3} more` : ""}
              </div>
            </div>
            <Link to="/admin/teacher-applications" className="ax-btn ax-btn-gold ax-btn-sm">
              Open Applications <Icon name="arrowRight" size={14} />
            </Link>
          </div>
        )}

        {/* Today + quick actions */}
        <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]" style={{ marginBottom: 24, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 24, minWidth: 0 }}>
            <Panel
              title="Today's attendance"
              subtitle="Across all sections that have submitted today"
              icon="chart"
              actions={
                totalToday > 0 ? (
                  <span className="ax-badge ax-badge-success">
                    <span className="ax-dot" /> Live
                  </span>
                ) : null
              }
            >
              {loading ? (
                <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
                  <Skeleton width={148} height={148} radius="50%" />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <SkeletonRows rows={3} height={36} />
                  </div>
                </div>
              ) : totalToday === 0 ? (
                <EmptyState
                  icon="calendar"
                  title="No attendance marked today yet"
                  message="Sections will appear here once teachers submit attendance."
                  action={
                    <Link to="/admin/section-attendance" className="ax-btn ax-btn-secondary ax-btn-sm">
                      View section reports
                    </Link>
                  }
                />
              ) : (
                <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
                  <Donut value={presentPct} />
                  <div style={{ flex: "1 1 240px", minWidth: 0, display: "grid", gap: 14 }}>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Present", count: stats.todayPresent, p: presentPct, fg: "var(--ax-success)", bg: "var(--ax-success-soft)" },
                        { label: "Absent", count: stats.todayAbsent, p: absentPct, fg: "var(--ax-danger)", bg: "var(--ax-danger-soft)" },
                      ].map((item) => (
                        <div key={item.label} style={{ background: item.bg, borderRadius: 12, padding: "14px 16px" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: item.fg, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</div>
                          <div style={{ fontSize: 26, fontWeight: 800, color: item.fg, lineHeight: 1.15, marginTop: 4 }}>
                            <CountUp value={item.count} />
                          </div>
                          <div style={{ fontSize: 12, color: item.fg, opacity: 0.8 }}>{item.p}% of marked</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", background: "#edf1f7" }} aria-hidden="true">
                        <span style={{ width: `${presentPct}%`, background: "var(--ax-success)", transition: "width 1s var(--ax-ease)" }} />
                        <span style={{ width: `${absentPct}%`, background: "var(--ax-danger)", transition: "width 1s var(--ax-ease)" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "var(--ax-muted)" }}>
                        <span>{totalToday} attendance marks today</span>
                        <span>Target 75%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Panel>

            {/* Teacher check-ins */}
            <Panel
              title="Teacher check-ins today"
              subtitle="Daily check-in / check-out timing of teachers"
              icon="clock"
              flush
              actions={
                !loading && teacherPunches.length > 0 ? (
                  <>
                    <span className="ax-badge ax-badge-success">{punchSummary.inNow} on duty</span>
                    <span className="ax-badge ax-badge-info">{punchSummary.out} out</span>
                    <span className="ax-badge ax-badge-warning">{punchSummary.none} pending</span>
                  </>
                ) : null
              }
            >
              {loading ? (
                <div style={{ padding: 22 }}>
                  <SkeletonRows rows={4} />
                </div>
              ) : teacherPunches.length === 0 ? (
                <EmptyState icon="teacher" title="No teacher records found" message="Approved teachers will be listed here with their check-in times." />
              ) : (
                <div className="ax-table-wrap">
                  <table className="ax-table">
                    <thead>
                      <tr>
                        <th scope="col">Teacher</th>
                        <th scope="col">Check in</th>
                        <th scope="col">Check out</th>
                        <th scope="col">Duration</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherPunches.map((row) => {
                        const s = row.checkOutAt ? PUNCH_STATUS.out : row.checkInAt ? PUNCH_STATUS.in : PUNCH_STATUS.none;
                        return (
                          <tr key={row.teacherId}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 180 }}>
                                <Avatar name={row.teacherName} size={34} />
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, color: "var(--ax-text)" }}>{row.teacherName}</div>
                                  <div style={{ fontSize: 12, color: "var(--ax-muted)" }}>{row.teacherEmail || "-"}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontVariantNumeric: "tabular-nums" }}>{fmtTime(row.checkInAt) || <span style={{ color: "var(--ax-muted)" }}>—</span>}</td>
                            <td style={{ fontVariantNumeric: "tabular-nums" }}>{fmtTime(row.checkOutAt) || <span style={{ color: "var(--ax-muted)" }}>—</span>}</td>
                            <td style={{ fontVariantNumeric: "tabular-nums" }}>{fmtDuration(row.checkInAt, row.checkOutAt) || <span style={{ color: "var(--ax-muted)" }}>—</span>}</td>
                            <td>
                              <span className={`ax-badge ${s.badge}`}>
                                <span className="ax-dot" /> {s.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>

          {/* Right column */}
          <div style={{ display: "grid", gap: 24, minWidth: 0 }}>
            <Panel title="Quick actions" subtitle="Jump to common admin tasks" icon="sparkles">
              <nav aria-label="Quick actions" style={{ display: "grid", gap: 10 }}>
                {QUICK.map((a) => (
                  <Link key={a.to} to={a.to} className="adm-quick ax-card-hover">
                    <span className="adm-quick-icon">
                      <Icon name={a.icon} size={17} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontWeight: 600, fontSize: 14, color: "var(--ax-text)" }}>{a.label}</span>
                      <span style={{ display: "block", fontSize: 12, color: "var(--ax-muted)", marginTop: 2 }}>{a.sub}</span>
                    </span>
                    {typeof a.count === "number" &&
                      (loading ? (
                        <Skeleton width={28} height={22} radius={999} />
                      ) : (
                        <span className={`ax-badge ${a.alert && a.count > 0 ? "ax-badge-danger" : ""}`}>{a.count}</span>
                      ))}
                    <Icon name="chevronRight" size={16} style={{ color: "var(--ax-muted)" }} />
                  </Link>
                ))}
              </nav>
            </Panel>

            <section className="ax-hero ax-fade-up" aria-labelledby="adm-parent-title">
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(201,168,76,0.18)", color: "var(--ax-gold-2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="mail" size={18} />
                  </span>
                  <h2 id="adm-parent-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                    Parent notifications
                  </h2>
                </div>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                  Send today's absence summary to parents now. It is also sent automatically at 6 PM.
                </p>
                <button type="button" className="ax-btn ax-btn-gold" onClick={sendParentEmails} disabled={sendingParentEmails} style={{ width: "100%" }}>
                  {sendingParentEmails ? <span className="ax-spinner" aria-hidden="true" /> : <Icon name="send" size={16} />}
                  {sendingParentEmails ? "Sending parent emails…" : "Email Parents Now"}
                </button>
                {parentEmailResult && (
                  <div aria-live="polite" style={{ marginTop: 14 }}>
                    {"sent" in parentEmailResult ? (
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Sent", v: parentEmailResult.sent, c: "#86efac" },
                          { label: "Skipped", v: parentEmailResult.skipped, c: "rgba(255,255,255,0.85)" },
                          { label: "Failed", v: parentEmailResult.failed, c: parentEmailResult.failed ? "#fca5a5" : "rgba(255,255,255,0.85)" },
                        ].map((m) => (
                          <div key={m.label} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: m.c }}>{m.v}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{m.label}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: parentEmailResult.ok ? "#bbf7d0" : "#fecaca" }}>{parentEmailResult.text}</div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Admin access management */}
        <div style={{ marginBottom: 24 }}>
          <Panel
            id="admin-access"
            title="Admin access management"
            subtitle="Super Admin approval required for all admin accounts"
            icon="shield"
            actions={<span className="ax-badge ax-badge-info">Director: Abhishek Kumar</span>}
          >
            {!user?.isSuperAdmin ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--ax-muted)" }}>
                <Icon name="info" size={16} /> Only Super Admin can approve or reject admin requests.
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ax-text)" }}>Pending requests</h3>
                    {!loading && <span className={`ax-badge ${pendingAdminRequests.length ? "ax-badge-warning" : ""}`}>{pendingAdminRequests.length}</span>}
                  </div>
                  {loading ? (
                    <SkeletonRows rows={2} height={72} />
                  ) : pendingAdminRequests.length === 0 ? (
                    <div style={{ border: "1px dashed var(--ax-border-strong)", borderRadius: 12 }}>
                      <EmptyState icon="checkCircle" title="All caught up" message="No pending admin requests." />
                    </div>
                  ) : (
                    <div className="ax-stagger" style={{ display: "grid", gap: 10 }}>
                      {pendingAdminRequests.map((admin) => {
                        const busy = reviewingAdminId === admin._id;
                        return (
                          <div key={admin._id} style={{ border: "1px solid var(--ax-border)", borderRadius: 12, padding: 14, background: "var(--ax-surface-2)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                              <div style={{ display: "flex", gap: 12, minWidth: 0, flex: "1 1 240px" }}>
                                <Avatar name={admin.name} size={40} />
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ax-text)" }}>{admin.name}</div>
                                  <div style={{ fontSize: 12, color: "var(--ax-muted)", wordBreak: "break-all" }}>{admin.email}</div>
                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                                    <span className="ax-badge">{admin.designation || "-"}</span>
                                    <span className="ax-badge">{admin.department || "-"}</span>
                                    {admin.phone && (
                                      <span className="ax-badge">
                                        <Icon name="phone" size={12} /> {admin.phone}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: 13, color: "var(--ax-text-2)", marginTop: 8 }}>
                                    <span style={{ color: "var(--ax-muted)" }}>Reason: </span>
                                    {admin.adminAccessReason || "-"}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                                <button type="button" className="ax-btn ax-btn-success ax-btn-sm" disabled={busy} onClick={() => reviewAdminAccess(admin._id, "approve")}>
                                  {busy && !rejectTarget ? <span className="ax-spinner" aria-hidden="true" /> : <Icon name="check" size={14} />}
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  className="ax-btn ax-btn-danger ax-btn-sm"
                                  disabled={busy}
                                  onClick={() => setRejectTarget({ id: admin._id, name: admin.name, kind: "admin request" })}
                                >
                                  <Icon name="x" size={14} /> Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "var(--ax-text)" }}>Recently reviewed</h3>
                  {loading ? (
                    <SkeletonRows rows={3} height={40} />
                  ) : reviewedAdminRequests.length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--ax-muted)" }}>No reviewed admin requests yet.</div>
                  ) : (
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
                      {reviewedAdminRequests.slice(0, 5).map((admin) => (
                        <li key={admin._id} className="adm-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 10px", borderRadius: 10 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                            <Avatar name={admin.name} size={30} />
                            <span style={{ minWidth: 0 }}>
                              <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--ax-text)" }}>{admin.name}</span>
                              <span style={{ display: "block", fontSize: 12, color: "var(--ax-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{admin.email}</span>
                            </span>
                          </span>
                          <span className={`ax-badge ${admin.adminAccessStatus === "approved" ? "ax-badge-success" : "ax-badge-danger"}`} style={{ textTransform: "capitalize" }}>
                            {admin.adminAccessStatus}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* Recent submissions */}
        <Panel
          title="Recent attendance submissions"
          subtitle="Latest records submitted by teachers"
          icon="clipboard"
          flush
          actions={
            <Link to="/admin/section-attendance" className="ax-btn ax-btn-ghost ax-btn-sm">
              View full report <Icon name="arrowRight" size={14} />
            </Link>
          }
        >
          {!loading && subs.length > 0 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", padding: "14px 22px", borderBottom: "1px solid var(--ax-border)" }}>
              <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 320 }}>
                <Icon name="search" size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ax-muted)" }} />
                <input
                  type="search"
                  className="ax-input"
                  aria-label="Search submissions by teacher or section"
                  placeholder="Search teacher or section"
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  style={{ paddingLeft: 36, height: 36 }}
                />
              </div>
              <div role="group" aria-label="Filter by section" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["all", ...subSections].map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={subSection === s}
                    onClick={() => setSubSection(s)}
                    className={`ax-btn ax-btn-sm ${subSection === s ? "ax-btn-primary" : "ax-btn-secondary"}`}
                  >
                    {s === "all" ? "All sections" : s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {loading ? (
            <div style={{ padding: 22 }}>
              <SkeletonRows rows={5} />
            </div>
          ) : subs.length === 0 ? (
            <EmptyState icon="clipboard" title="No attendance submissions yet" message="Submissions will appear here once teachers mark attendance." />
          ) : filteredSubs.length === 0 ? (
            <EmptyState
              icon="search"
              title="No matching submissions"
              message="Try a different search or section."
              action={
                <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={() => { setSubSearch(""); setSubSection("all"); }}>
                  Clear filters
                </button>
              }
            />
          ) : (
            <div className="ax-table-wrap">
              <table className="ax-table">
                <thead>
                  <tr>
                    <th scope="col">Teacher</th>
                    <th scope="col">Section</th>
                    <th scope="col">Date</th>
                    <th scope="col">Present / Total</th>
                    <th scope="col">Attendance</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.map((row) => {
                    const p = pct(row.present, row.total);
                    const tone = pctTone(p);
                    return (
                      <tr key={row.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 160 }}>
                            <Avatar name={row.teacherName} size={32} />
                            <span style={{ fontWeight: 600, color: "var(--ax-text)" }}>{row.teacherName}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span className="ax-badge ax-badge-gold">{row.section}</span>
                            <span style={{ fontSize: 12, color: "var(--ax-muted)", whiteSpace: "nowrap" }}>Sem {row.semester}</span>
                          </div>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <div style={{ color: "var(--ax-text)", fontWeight: 500 }}>
                            {new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </div>
                          {row.createdAt && <div style={{ fontSize: 12, color: "var(--ax-muted)" }}>Submitted {fmtTime(row.createdAt)}</div>}
                        </td>
                        <td style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                          <strong style={{ color: "var(--ax-text)" }}>{row.present}</strong>
                          <span style={{ color: "var(--ax-muted)" }}> / {row.total}</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 140 }}>
                            <div style={{ flex: 1 }}>
                              <ProgressBar value={p} threshold={75} color={`var(--ax-${tone})`} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: `var(--ax-${tone})`, minWidth: 38, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{p}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`ax-badge ax-badge-${tone}`}>{pctLabel(p)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {rejectTarget && (
        <RejectDialog
          key={rejectTarget.id}
          target={rejectTarget}
          busy={reviewingAdminId === rejectTarget.id}
          onCancel={closeReject}
          onConfirm={(reason) => reviewAdminAccess(rejectTarget.id, "reject", reason)}
        />
      )}

      <style>{`
        .adm-quick {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; border-radius: 12px;
          background: var(--ax-surface); border: 1px solid var(--ax-border);
          text-decoration: none; color: inherit;
        }
        .adm-quick:hover { background: var(--ax-surface-2); }
        .adm-quick-icon {
          width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--ax-blue-soft); color: var(--ax-blue);
          transition: background-color .2s ease, color .2s ease;
        }
        .adm-quick:hover .adm-quick-icon { background: var(--ax-navy); color: var(--ax-gold-2); }
        .adm-row { transition: background-color .15s ease; }
        .adm-row:hover { background: var(--ax-surface-2); }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
