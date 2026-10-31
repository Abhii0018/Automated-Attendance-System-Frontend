import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import attendanceService from "../../services/attendanceService";
import { ATTENDANCE_THRESHOLD } from "../../utils/constants";
import { Alert, EmptyState, Icon, ProgressBar, Skeleton, SkeletonRows, StatCard } from "../../components/ui";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const errMsg = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
};

const slotKey = (s) => `${s.semester}|${String(s.section || "").toUpperCase()}|${String(s.subject || "").toLowerCase()}`;

/*
  Which of today's timetable slots already have attendance.
  Exact match: a history item from today with the same semester, section,
  subject and periodNumber. Fallback for older backends whose history items
  have no periodNumber: count today's submissions per semester/section/subject
  and mark that many of the remaining slots, earliest period first.
*/
const getMarkedSlotIds = (slots, history) => {
  const today = dayKey(new Date());
  const todays = (history || []).filter((h) => dayKey(h.date) === today);
  const hasPeriod = (h) => h.periodNumber !== undefined && h.periodNumber !== null && h.periodNumber !== "";
  const exact = new Set(todays.filter(hasPeriod).map((h) => `${slotKey(h)}|${Number(h.periodNumber)}`));
  const counts = {};
  todays.filter((h) => !hasPeriod(h)).forEach((h) => {
    const k = slotKey(h);
    counts[k] = (counts[k] || 0) + 1;
  });
  const done = new Set();
  [...slots]
    .sort((a, b) => a.periodNumber - b.periodNumber)
    .forEach((s) => {
      const k = slotKey(s);
      if (exact.has(`${k}|${Number(s.periodNumber)}`)) {
        done.add(s._id);
      } else if (counts[k] > 0) {
        done.add(s._id);
        counts[k] -= 1;
      }
    });
  return done;
};

const markLink = (slot) => {
  const params = new URLSearchParams({
    slot: slot._id,
    semester: String(slot.semester),
    section: slot.section,
    subject: slot.subject,
    period: String(slot.periodNumber),
  });
  return `/teacher/mark-attendance?${params.toString()}`;
};

const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—");

const fmtDuration = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
};

const greetingFor = (date) => {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

// ─── Small pieces ─────────────────────────────────────────────────────────────

const SplitBar = ({ present = 0, absent = 0 }) => {
  const total = present + absent;
  const p = total ? (present / total) * 100 : 0;
  return (
    <div
      role="img"
      aria-label={`${present} present, ${absent} absent`}
      style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", background: "#edf1f7", minWidth: 90 }}
    >
      <span style={{ width: `${p}%`, background: "var(--ax-success)", transition: "width .9s var(--ax-ease)" }} />
      <span style={{ width: `${total ? 100 - p : 0}%`, background: "var(--ax-danger)", opacity: 0.8 }} />
    </div>
  );
};

// Check-in / check-out card with its own ticking clock (so the rest of the page doesn't re-render every second).
const PunchCard = ({ punch, loading, busy, error, onCheckIn, onCheckOut }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const checkedIn = !!punch.checkInAt;
  const checkedOut = !!punch.checkOutAt;
  const onDuty = checkedIn && !checkedOut;

  const durationMs = checkedIn
    ? (checkedOut ? new Date(punch.checkOutAt) : now) - new Date(punch.checkInAt)
    : 0;

  const status = !checkedIn
    ? { label: "Not checked in", cls: "ax-badge-warning" }
    : onDuty
      ? { label: "On duty", cls: "ax-badge-success" }
      : { label: "Checked out", cls: "ax-badge-info" };

  return (
    <section className="ax-card ax-card-pad" aria-labelledby="punch-title" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 id="punch-title" className="ax-section-title">Today's attendance</h2>
          <p className="ax-section-sub">Your own check-in for the day</p>
        </div>
        {loading ? (
          <Skeleton height={24} width={96} radius={999} />
        ) : (
          <span className={`ax-badge ${status.cls}`}>
            <span className={`ax-dot ${onDuty ? "td-pulse" : ""}`} />
            {status.label}
          </span>
        )}
      </div>

      <div style={{ textAlign: "center", padding: "6px 0 2px" }}>
        <div
          aria-live="off"
          style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--ax-text)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}
        >
          {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
        <div style={{ fontSize: 12, color: "var(--ax-muted)", marginTop: 6 }}>
          {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2" style={{ background: "var(--ax-surface-2)", border: "1px solid var(--ax-border)", borderRadius: 12, padding: "12px 8px" }}>
        {[
          ["Check-in", loading ? null : fmtTime(punch.checkInAt)],
          ["Check-out", loading ? null : fmtTime(punch.checkOutAt)],
          [onDuty ? "On duty" : "Duration", loading ? null : checkedIn ? fmtDuration(durationMs) : "—"],
        ].map(([label, val]) => (
          <div key={label} style={{ textAlign: "center", minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ax-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
            {val === null ? (
              <Skeleton height={18} width="70%" style={{ margin: "6px auto 0" }} />
            ) : (
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ax-text)", marginTop: 4, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{val}</div>
            )}
          </div>
        ))}
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="ax-btn ax-btn-success"
          onClick={onCheckIn}
          disabled={loading || busy || checkedIn}
        >
          {busy && !checkedIn ? <span className="ax-spinner" aria-hidden="true" /> : <Icon name="login" size={16} />}
          {checkedIn ? "Checked in" : "Check in"}
        </button>
        <button
          type="button"
          className="ax-btn ax-btn-primary"
          onClick={onCheckOut}
          disabled={loading || busy || !checkedIn || checkedOut}
        >
          {busy && checkedIn ? <span className="ax-spinner" aria-hidden="true" /> : <Icon name="logout" size={16} />}
          {checkedOut ? "Checked out" : "Check out"}
        </button>
      </div>
    </section>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const EMPTY_OVERVIEW = {
  sections: [],
  stats: { totalClassesTaken: 0, averageAttendancePercentage: 0 },
  todayStatus: { classesTaken: 0, totalSections: 0 },
  history: [],
};

const TeacherDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(EMPTY_OVERVIEW);
  const [punch, setPunch] = useState({ checkInAt: null, checkOutAt: null });
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchError, setPunchError] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [scheduleError, setScheduleError] = useState("");

  // Loads overview + punch + today's timetable. `silent` = background refresh (keeps old data on failure).
  const fetchOverview = useCallback(async (silent = false) => {
    const [ov, pu, sc] = await Promise.allSettled([
      attendanceService.getTeacherOverview(),
      attendanceService.getTeacherPunchToday(),
      attendanceService.getTodayTeacherSchedule(),
    ]);

    if (ov.status === "fulfilled") {
      setOverview({ ...EMPTY_OVERVIEW, ...(ov.value?.data || {}) });
      setError("");
    } else if (!silent) {
      setError(errMsg(ov.reason, "Failed to load dashboard data."));
    }

    if (pu.status === "fulfilled") {
      setPunch(pu.value?.data || { checkInAt: null, checkOutAt: null });
    } else if (!silent && ov.status === "fulfilled") {
      setError(errMsg(pu.reason, "Failed to load check-in status."));
    }

    if (sc.status === "fulfilled") {
      setSchedule(Array.isArray(sc.value?.data) ? sc.value.data : []);
      setScheduleError("");
    } else if (!silent) {
      setScheduleError(errMsg(sc.reason, "Failed to load today's schedule."));
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchOverview();
    const timer = setInterval(() => fetchOverview(true), 30000);
    return () => clearInterval(timer);
  }, [fetchOverview]);

  const retry = () => {
    setLoading(true);
    setError("");
    setScheduleError("");
    fetchOverview();
  };

  const refresh = () => {
    setRefreshing(true);
    fetchOverview();
  };

  const refreshPunch = async () => {
    const punchRes = await attendanceService.getTeacherPunchToday();
    const next = punchRes.data || { checkInAt: null, checkOutAt: null };
    setPunch(next);
    return next;
  };

  const onCheckIn = async () => {
    setPunchLoading(true);
    setPunchError("");
    try {
      await attendanceService.teacherCheckIn();
      const next = await refreshPunch();
      toast.success(`Checked in at ${fmtTime(next.checkInAt)}`);
    } catch (err) {
      const msg = errMsg(err, "Check-in failed.");
      setPunchError(msg);
      toast.error(msg);
    } finally {
      setPunchLoading(false);
    }
  };

  const onCheckOut = async () => {
    setPunchLoading(true);
    setPunchError("");
    try {
      await attendanceService.teacherCheckOut();
      const next = await refreshPunch();
      toast.success(`Checked out at ${fmtTime(next.checkOutAt)}`);
    } catch (err) {
      const msg = errMsg(err, "Check-out failed.");
      setPunchError(msg);
      toast.error(msg);
    } finally {
      setPunchLoading(false);
    }
  };

  const { sections = [], stats = {}, todayStatus = {}, history = [] } = overview;
  const firstName = user?.name?.split(" ")[0] || "Teacher";
  const [today] = useState(() => new Date());
  const todayLabel = today.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const sortedSchedule = useMemo(() => [...schedule].sort((a, b) => a.periodNumber - b.periodNumber), [schedule]);
  const markedIds = useMemo(() => getMarkedSlotIds(schedule, history), [schedule, history]);
  const markedCount = sortedSchedule.filter((s) => markedIds.has(s._id)).length;
  const nextSlot = sortedSchedule.find((s) => !markedIds.has(s._id));
  const avg = Number(stats?.averageAttendancePercentage) || 0;

  return (
    <div className="ax-page">
      <div className="ax-container">
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="ax-hero ax-fade-up" style={{ marginBottom: 20 }}>
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "var(--ax-gold-2)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                Teacher dashboard
              </div>
              <h1 style={{ margin: 0, fontSize: "clamp(24px, 3.4vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                {greetingFor(today)}, <span style={{ color: "var(--ax-gold-2)" }}>{firstName}</span>
              </h1>
              <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.68)", fontSize: 14 }}>{todayLabel}</p>

              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
                {loading ? (
                  <Skeleton height={20} width={240} style={{ opacity: 0.25 }} />
                ) : sortedSchedule.length === 0 ? (
                  <span>No classes on your timetable today.</span>
                ) : nextSlot ? (
                  <>
                    <Icon name="clock" size={16} />
                    <span>
                      Up next: <strong style={{ color: "#fff" }}>Period {nextSlot.periodNumber}</strong> · {nextSlot.subject} · Sec {nextSlot.section}
                    </span>
                  </>
                ) : (
                  <>
                    <Icon name="checkCircle" size={16} />
                    <span>All {sortedSchedule.length} classes marked for today. Nice work!</span>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={refresh}
                disabled={loading || refreshing}
                className="ax-btn"
                style={{ background: "rgba(255,255,255,0.1)", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}
                aria-label="Refresh dashboard"
              >
                {refreshing ? <span className="ax-spinner" aria-hidden="true" /> : <Icon name="refresh" size={16} />}
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <Link to={nextSlot ? markLink(nextSlot) : "/teacher/mark-attendance"} className="ax-btn ax-btn-gold">
                <Icon name="clipboard" size={16} />
                {nextSlot ? `Mark Period ${nextSlot.periodNumber}` : "Mark attendance"}
              </Link>
            </div>
          </div>
        </section>

        {error && (
          <div style={{ marginBottom: 20 }}>
            <Alert tone="danger" title="Couldn't load your dashboard">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <span>{error}</span>
                <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={retry}>
                  <Icon name="refresh" size={14} /> Retry
                </button>
              </div>
            </Alert>
          </div>
        )}

        {/* ── Punch + KPIs ───────────────────────────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-[minmax(300px,1fr)_2fr]" style={{ marginBottom: 20 }}>
          <div className="ax-fade-up">
            <PunchCard
              punch={punch}
              loading={loading}
              busy={punchLoading}
              error={punchError}
              onCheckIn={onCheckIn}
              onCheckOut={onCheckOut}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 ax-stagger">
            <StatCard
              label="Classes marked today"
              value={todayStatus?.classesTaken ?? 0}
              icon="checkCircle"
              tone="success"
              loading={loading}
              hint={sortedSchedule.length ? `of ${sortedSchedule.length} on today's timetable` : "No timetable slots today"}
            />
            <StatCard
              label="Assigned classes"
              value={todayStatus?.totalSections ?? sections.length}
              icon="layers"
              tone="blue"
              loading={loading}
              hint="Semester · section · subject"
            />
            <StatCard
              label="Classes taken"
              value={stats?.totalClassesTaken ?? 0}
              icon="calendar"
              tone="navy"
              loading={loading}
              hint="All classes you have marked"
            />
            <StatCard
              label="Average attendance"
              value={avg}
              decimals={1}
              suffix="%"
              icon="trendUp"
              tone={avg >= ATTENDANCE_THRESHOLD ? "gold" : "danger"}
              loading={loading}
              hint={`All classes · target ${ATTENDANCE_THRESHOLD}%`}
            />
          </div>
        </div>

        {/* ── Schedule + classes ─────────────────────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]" style={{ marginBottom: 20 }}>
          <section className="ax-card ax-card-pad ax-fade-up" aria-labelledby="schedule-title">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <h2 id="schedule-title" className="ax-section-title">Today's schedule</h2>
                <p className="ax-section-sub">Tap a pending class to open its roster</p>
              </div>
              {!loading && sortedSchedule.length > 0 && (
                <span className={`ax-badge ${markedCount === sortedSchedule.length ? "ax-badge-success" : "ax-badge-gold"}`}>
                  {markedCount}/{sortedSchedule.length} marked
                </span>
              )}
            </div>

            {!loading && sortedSchedule.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <ProgressBar value={(markedCount / sortedSchedule.length) * 100} threshold={0} />
              </div>
            )}

            {loading ? (
              <SkeletonRows rows={5} height={58} />
            ) : scheduleError ? (
              <Alert tone="danger" title="Schedule unavailable">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <span>{scheduleError}</span>
                  <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={retry}>Retry</button>
                </div>
              </Alert>
            ) : sortedSchedule.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="No classes scheduled today"
                message="Your timetable has no periods for today. You can still open Mark Attendance if needed."
              />
            ) : (
              <ol style={{ listStyle: "none", margin: 0, padding: 0, position: "relative" }} className="ax-stagger">
                {sortedSchedule.map((slot, i) => {
                  const done = markedIds.has(slot._id);
                  const isNext = nextSlot && nextSlot._id === slot._id;
                  const last = i === sortedSchedule.length - 1;
                  return (
                    <li key={slot._id} style={{ display: "flex", gap: 14, position: "relative", paddingBottom: last ? 0 : 12 }}>
                      {/* timeline rail */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <span
                          aria-hidden="true"
                          style={{
                            width: 34, height: 34, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
                            fontSize: 13, fontWeight: 800,
                            background: done ? "var(--ax-success-soft)" : isNext ? "var(--ax-gold-soft)" : "var(--ax-surface-2)",
                            color: done ? "var(--ax-success)" : isNext ? "#7a5c12" : "var(--ax-muted)",
                            border: `2px solid ${done ? "#bbf7d0" : isNext ? "var(--ax-gold)" : "var(--ax-border)"}`,
                          }}
                        >
                          {done ? <Icon name="check" size={15} /> : `P${slot.periodNumber}`}
                        </span>
                        {!last && <span style={{ flex: 1, width: 2, marginTop: 4, background: done ? "#bbf7d0" : "var(--ax-border)", borderRadius: 2 }} />}
                      </div>

                      <div
                        className="td-slot"
                        style={{
                          flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
                          padding: "10px 14px", borderRadius: 12,
                          border: `1px solid ${isNext ? "var(--ax-gold)" : "var(--ax-border)"}`,
                          background: isNext ? "linear-gradient(90deg, var(--ax-gold-soft), var(--ax-surface))" : "var(--ax-surface)",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: "var(--ax-text)", fontSize: 14 }}>
                            {slot.subject}
                            {isNext && <span className="ax-badge ax-badge-gold" style={{ marginLeft: 8, height: 20, fontSize: 11 }}>Up next</span>}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--ax-muted)", marginTop: 2 }}>
                            Period {slot.periodNumber} · Semester {slot.semester} · Section {slot.section}
                          </div>
                        </div>
                        {done ? (
                          <span className="ax-badge ax-badge-success"><Icon name="checkCircle" size={13} /> Marked</span>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span className="ax-badge ax-badge-warning"><span className="ax-dot" /> Pending</span>
                            <Link
                              to={markLink(slot)}
                              className={`ax-btn ax-btn-sm ${isNext ? "ax-btn-primary" : "ax-btn-secondary"}`}
                              aria-label={`Mark attendance for period ${slot.periodNumber}, ${slot.subject}, section ${slot.section}`}
                            >
                              Mark <Icon name="arrowRight" size={14} />
                            </Link>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="ax-card ax-card-pad ax-fade-up" aria-labelledby="classes-title">
            <h2 id="classes-title" className="ax-section-title">Your classes</h2>
            <p className="ax-section-sub" style={{ marginBottom: 14 }}>Assigned by the admin</p>
            {loading ? (
              <SkeletonRows rows={4} height={48} />
            ) : sections.length === 0 ? (
              <EmptyState icon="layers" title="No classes assigned yet" message="Ask your admin to assign you a semester, section and subject." />
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {sections.map((s) => {
                  const sessions = history.filter((h) => slotKey(h) === slotKey(s)).length;
                  return (
                    <li
                      key={`${s.semester}-${s.section}-${s.subject}`}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", border: "1px solid var(--ax-border)", borderRadius: 12, background: "var(--ax-surface-2)" }}
                    >
                      <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--ax-blue-soft)", color: "var(--ax-blue)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name="book" size={16} />
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ax-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.subject}</div>
                        <div style={{ fontSize: 12, color: "var(--ax-muted)" }}>Sem {s.semester} · Sec {s.section}</div>
                      </div>
                      {sessions > 0 && <span className="ax-badge" title="Sessions in your recent history">{sessions} recent</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* ── Recent classes ─────────────────────────────────────────────── */}
        <section className="ax-card ax-fade-up" aria-labelledby="history-title" style={{ overflow: "hidden" }}>
          <div className="ax-card-pad" style={{ paddingBottom: 14, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h2 id="history-title" className="ax-section-title">Recent classes</h2>
              <p className="ax-section-sub">Your latest attendance submissions</p>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--ax-muted)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--ax-success)" }} /> Present</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--ax-danger)", opacity: 0.8 }} /> Absent</span>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "0 22px 22px" }}><SkeletonRows rows={5} height={40} /></div>
          ) : history.length === 0 ? (
            <EmptyState
              icon="clipboard"
              title="No attendance records yet"
              message="Records will appear here after your first session."
              action={<Link to="/teacher/mark-attendance" className="ax-btn ax-btn-primary ax-btn-sm">Mark attendance</Link>}
            />
          ) : (
            <div className="ax-table-wrap">
              <table className="ax-table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Class</th>
                    <th scope="col" style={{ width: "34%" }}>Present / Absent</th>
                    <th scope="col">Rate</th>
                    <th scope="col" className="hidden sm:table-cell">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, i) => {
                    const present = Number(item.present) || 0;
                    const absent = Number(item.absent) || 0;
                    const total = Number(item.totalStudents) || present + absent;
                    const rate = total ? (present / total) * 100 : 0;
                    const isToday = dayKey(item.date) === dayKey(today);
                    return (
                      <tr key={item.id || i}>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <div style={{ fontWeight: 600, color: "var(--ax-text)" }}>
                            {new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--ax-muted)" }}>
                            {isToday ? "Today" : new Date(item.date).toLocaleDateString("en-IN", { weekday: "short" })}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--ax-text)", whiteSpace: "nowrap" }}>{item.subject || "N/A"}</div>
                          <div style={{ fontSize: 12, color: "var(--ax-muted)", whiteSpace: "nowrap" }}>Sem {item.semester} · Sec {item.section}{item.periodNumber ? ` · Period ${item.periodNumber}` : ""}</div>
                        </td>
                        <td>
                          <SplitBar present={present} absent={absent} />
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 6, gap: 8, whiteSpace: "nowrap" }}>
                            <span style={{ color: "#166534", fontWeight: 600 }}>{present} present</span>
                            <span style={{ color: "#991b1b", fontWeight: 600 }}>{absent} absent</span>
                          </div>
                        </td>
                        <td>
                          <span className={`ax-badge ${rate >= ATTENDANCE_THRESHOLD ? "ax-badge-success" : "ax-badge-danger"}`}>
                            {rate.toFixed(0)}%
                          </span>
                        </td>
                        <td className="hidden sm:table-cell" style={{ fontWeight: 700, color: "var(--ax-text)" }}>{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <style>{`
        @keyframes td-pulse { 0% { box-shadow: 0 0 0 0 rgba(22,163,74,.55); } 70% { box-shadow: 0 0 0 6px rgba(22,163,74,0); } 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); } }
        .td-pulse { animation: td-pulse 1.8s infinite; }
        .td-slot { transition: border-color .2s ease, box-shadow .2s ease, transform .2s var(--ax-ease); }
        .td-slot:hover { border-color: var(--ax-border-strong); box-shadow: var(--ax-shadow); }
      `}</style>
    </div>
  );
};

export default TeacherDashboard;
