import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import attendanceService from "../../services/attendanceService";
import { ATTENDANCE_THRESHOLD } from "../../utils/constants";
import {
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
const lc = (v) => String(v || "").toLowerCase();
const isPresentStatus = (s) => lc(s) === "present";
const statusBadge = (s) => (isPresentStatus(s) ? "ax-badge-success" : lc(s) === "absent" ? "ax-badge-danger" : "ax-badge-warning");
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const fmtShort = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const fmtPct = (v) => `${Number.isInteger(v) ? v : Number(v).toFixed(1)}%`;
const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
};

// Classes needed to reach the threshold / classes that can be missed while staying above it.
const attendanceMath = (present, total) => ({
  needed: Math.max(0, 3 * total - 4 * present),
  canSkip: Math.max(0, Math.floor((4 * present - 3 * total) / 3)),
});

const greetingFor = (h) => (h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");

// ─── Ring gauge (SVG) ─────────────────────────────────────────────────────────
const RingGauge = ({ value = 0, size = 176, stroke = 14, low, label }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const offset = circ * (1 - pct / 100);
  const gradId = low ? "sd-ring-low" : "sd-ring-ok";
  // Tick that marks the threshold on the ring
  const tAngle = (ATTENDANCE_THRESHOLD / 100) * 2 * Math.PI - Math.PI / 2;
  const tx1 = size / 2 + (r - stroke / 2 - 3) * Math.cos(tAngle);
  const ty1 = size / 2 + (r - stroke / 2 - 3) * Math.sin(tAngle);
  const tx2 = size / 2 + (r + stroke / 2 + 3) * Math.cos(tAngle);
  const ty2 = size / 2 + (r + stroke / 2 + 3) * Math.sin(tAngle);

  return (
    <div style={{ position: "relative", width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id="sd-ring-ok" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--ax-gold-2)" }} />
            <stop offset="100%" style={{ stopColor: "var(--ax-gold)" }} />
          </linearGradient>
          <linearGradient id="sd-ring-low" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "#f87171" }} />
            <stop offset="100%" style={{ stopColor: "var(--ax-danger)" }} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#edf1f7" strokeWidth={stroke} />
        <circle
          className="sd-ring-arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ strokeDashoffset: offset, "--sd-ring-from": circ }}
        />
        <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke="var(--ax-navy)" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.19, fontWeight: 800, letterSpacing: "-0.03em", color: low ? "var(--ax-danger)" : "var(--ax-text)", lineHeight: 1 }}>
          <CountUp value={pct} decimals={Number.isInteger(pct) ? 0 : 1} suffix="%" />
        </span>
        <span style={{ fontSize: 12, color: "var(--ax-muted)", marginTop: 6, fontWeight: 600 }}>overall</span>
      </div>
    </div>
  );
};

// ─── AI tip card ──────────────────────────────────────────────────────────────
const TipCard = ({ tip, loading }) => {
  if (!loading && !tip?.tip) return null;
  const isAi = tip?.source === "ai";
  return (
    <section className="sd-tip ax-fade-up" aria-live="polite" aria-busy={loading}>
      <div className="sd-tip-icon">
        <Icon name="sparkles" size={22} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
          <h2 className="ax-section-title" style={{ fontSize: 15 }}>
            {isAi ? "Your AI Attendance Tip" : "Your Attendance Tip"}
          </h2>
          {!loading && (
            <span className={`ax-badge ${isAi ? "ax-badge-gold" : "ax-badge-info"}`} style={{ height: 22, fontSize: 11 }}>
              {isAi ? "AI generated" : "Smart summary"}
            </span>
          )}
        </div>
        {loading ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ax-muted)", fontSize: 13, marginBottom: 10 }}>
              <span className="ax-spinner" style={{ width: 13, height: 13, color: "var(--ax-gold)" }} aria-hidden="true" />
              Analysing your attendance…
            </div>
            <Skeleton height={12} width="92%" style={{ marginBottom: 8 }} />
            <Skeleton height={12} width="68%" />
          </div>
        ) : (
          <p style={{ margin: 0, color: "var(--ax-text-2)", fontSize: 14, lineHeight: 1.65 }}>{tip.tip}</p>
        )}
      </div>
    </section>
  );
};

// ─── Last-4-weeks trend + daily heat strip ────────────────────────────────────
const HEAT_LEGEND = [
  { key: "good", label: `≥${ATTENDANCE_THRESHOLD}% present` },
  { key: "low", label: `Below ${ATTENDANCE_THRESHOLD}%` },
  { key: "zero", label: "All missed" },
  { key: "none", label: "No classes" },
];
const heatLevel = (d) => (d.total === 0 ? "none" : d.present === 0 ? "zero" : (d.present / d.total) * 100 >= ATTENDANCE_THRESHOLD ? "good" : "low");

const TrendCard = ({ records, loading }) => {
  const [hover, setHover] = useState(null);

  const data = useMemo(() => {
    if (!records.length) return null;
    const latest = records.reduce((m, r) => Math.max(m, new Date(r.date).getTime()), 0);
    const a = new Date(latest);
    const map = new Map();
    records.forEach((r) => {
      const k = dayKey(r.date);
      const cur = map.get(k) || { present: 0, total: 0 };
      cur.total += 1;
      if (isPresentStatus(r.status)) cur.present += 1;
      map.set(k, cur);
    });
    const days = Array.from({ length: 28 }, (_, i) => {
      const date = new Date(a.getFullYear(), a.getMonth(), a.getDate() - (27 - i));
      return { date, ...(map.get(dayKey(date)) || { present: 0, total: 0 }) };
    });
    const weeks = [0, 1, 2, 3].map((w) => {
      const slice = days.slice(w * 7, w * 7 + 7);
      const present = slice.reduce((s, d) => s + d.present, 0);
      const total = slice.reduce((s, d) => s + d.total, 0);
      return { start: slice[0].date, end: slice[6].date, days: slice, present, total, pct: total ? Math.round((present / total) * 100) : null };
    });
    return { weeks, end: a };
  }, [records]);

  const readout = (() => {
    if (!hover) return "Hover or focus a week to see details.";
    if (hover.type === "week") {
      const w = hover.item;
      return w.total
        ? `${fmtShort(w.start)} – ${fmtShort(w.end)}: attended ${w.present} of ${w.total} classes (${w.pct}%)`
        : `${fmtShort(w.start)} – ${fmtShort(w.end)}: no classes recorded`;
    }
    const d = hover.item;
    const day = d.date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    return d.total ? `${day}: ${d.present} of ${d.total} classes attended` : `${day}: no classes`;
  })();

  return (
    <div className="ax-card ax-card-pad" style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 className="ax-section-title">Last 4 weeks</h2>
          <p className="ax-section-sub">
            {data ? `Weekly attendance up to ${fmtShort(data.end)}` : "Weekly attendance trend"}
          </p>
        </div>
        {data && (
          <span className="ax-badge" style={{ fontSize: 11 }}>
            <span style={{ width: 14, borderTop: "2px dashed var(--ax-navy)", opacity: 0.5 }} aria-hidden="true" />
            {ATTENDANCE_THRESHOLD}% target
          </span>
        )}
      </div>

      {loading ? (
        <Skeleton height={190} />
      ) : !data ? (
        <EmptyState icon="chart" title="No trend yet" message="Your weekly trend appears once attendance is recorded." />
      ) : (
        <>
          <div className="sd-trend">
            <div className="sd-trend-plot" role="group" aria-label="Weekly attendance percentage, last 4 weeks">
              <div className="sd-trend-target" style={{ bottom: `${ATTENDANCE_THRESHOLD}%` }} aria-hidden="true" />
              {data.weeks.map((w, i) => {
                const low = w.pct !== null && w.pct < ATTENDANCE_THRESHOLD;
                const active = hover?.type === "week" && hover.item === w;
                return (
                  <button
                    key={i}
                    type="button"
                    className={`sd-trend-col${active ? " is-active" : ""}`}
                    onMouseEnter={() => setHover({ type: "week", item: w })}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover({ type: "week", item: w })}
                    onBlur={() => setHover(null)}
                    aria-label={w.total ? `Week of ${fmtShort(w.start)}: ${w.pct}%, ${w.present} of ${w.total} classes` : `Week of ${fmtShort(w.start)}: no classes`}
                  >
                    <span className="sd-trend-track">
                      <span
                        className="sd-trend-bar"
                        style={{
                          height: `${w.pct ?? 0}%`,
                          animationDelay: `${i * 0.08}s`,
                          background: low ? "var(--ax-danger)" : "linear-gradient(180deg, var(--ax-gold-2), var(--ax-gold))",
                        }}
                      />
                      <span className="sd-trend-val" style={{ bottom: `calc(${w.pct ?? 0}% + 4px)` }}>{w.pct === null ? "–" : `${w.pct}%`}</span>
                    </span>
                    <span className="sd-trend-label">{fmtShort(w.start)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily heat strip: one row per week, aligned with the bars above */}
          <div>
            <div className="sd-heat" role="img" aria-label="Daily attendance for the last 28 days">
              {data.weeks.map((w, wi) => (
                <div key={wi} className="sd-heat-row">
                  {w.days.map((d, di) => (
                    <span
                      key={di}
                      className={`sd-heat-cell lvl-${heatLevel(d)}`}
                      title={d.total ? `${fmtShort(d.date)}: ${d.present}/${d.total} attended` : `${fmtShort(d.date)}: no classes`}
                      onMouseEnter={() => setHover({ type: "day", item: d })}
                      onMouseLeave={() => setHover(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 10 }}>
              {HEAT_LEGEND.map((l) => (
                <span key={l.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--ax-muted)" }}>
                  <span className={`sd-heat-cell lvl-${l.key}`} style={{ width: 10, height: 10, flex: "none" }} aria-hidden="true" />
                  {l.label}
                </span>
              ))}
            </div>
          </div>

          <div aria-live="polite" style={{ fontSize: 12, color: hover ? "var(--ax-text-2)" : "var(--ax-muted)", minHeight: 18 }}>
            {readout}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

const StudentDashboard = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [subjectStats, setSubjectStats] = useState([]);
  const [overallPct, setOverallPct] = useState(0);
  const [totals, setTotals] = useState({ total: null, present: null });
  const [regNo, setRegNo] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectStatusFilter, setSubjectStatusFilter] = useState("all");
  const [tableSubject, setTableSubject] = useState("all");
  const [tableStatus, setTableStatus] = useState("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [tip, setTip] = useState(null);
  const [tipLoading, setTipLoading] = useState(true);
  const drillRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await attendanceService.getMyAttendance();
        const payload = res.data || {};
        setRecords(payload.records || []);
        setSubjectStats(payload.subjectStats || []);
        setOverallPct(payload.overallPercentage || 0);
        setTotals({
          total: typeof payload.totalClasses === "number" ? payload.totalClasses : null,
          present: typeof payload.totalPresent === "number" ? payload.totalPresent : null,
        });
        setRegNo(payload.registrationNumber || "");
        setStudentName(payload.studentName || "");
      } catch (err) {
        setError(err.response?.data?.message || "Could not load attendance data.");
        setRecords([]);
        setSubjectStats([]);
        setOverallPct(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // AI tip loads separately so a slow AI reply never blocks the dashboard
  useEffect(() => {
    attendanceService.getMyAttendanceTip()
      .then((res) => setTip(res.data || null))
      .catch(() => setTip(null))
      .finally(() => setTipLoading(false));
  }, []);

  const now = new Date();
  const today = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const fullName = user?.name || studentName || "Student";
  const firstName = fullName.split(" ")[0];

  const present = records.filter((r) => isPresentStatus(r.status)).length;
  const absent = records.filter((r) => lc(r.status) === "absent").length;
  const totalClasses = totals.total ?? records.length;
  const totalPresent = totals.present ?? present;
  const hasData = totalClasses > 0;
  const isLow = overallPct < ATTENDANCE_THRESHOLD;
  const { needed, canSkip } = attendanceMath(totalPresent, totalClasses);

  // Subject drill-down
  const selectedSubjectStat = subjectStats.find((s) => lc(s.subject) === lc(selectedSubject));
  const selectedSubjectRecords = selectedSubject ? records.filter((r) => lc(r.subject) === lc(selectedSubject)) : [];
  const filteredSubjectRecords = selectedSubjectRecords.filter((r) => subjectStatusFilter === "all" || lc(r.status) === subjectStatusFilter);
  const subjectPresentCount = selectedSubjectRecords.filter((r) => isPresentStatus(r.status)).length;

  const selectSubject = (subject) => {
    setSelectedSubject(subject);
    setSubjectStatusFilter("all");
    if (subject && drillRef.current) {
      requestAnimationFrame(() => drillRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    }
  };

  // Recent records table
  const tableRecords = records.filter(
    (r) => (tableSubject === "all" || lc(r.subject) === lc(tableSubject)) && (tableStatus === "all" || lc(r.status) === tableStatus)
  );

  const sortedSubjects = [...subjectStats].sort((a, b) => a.percentage - b.percentage);
  const atRiskCount = subjectStats.filter((s) => s.percentage < ATTENDANCE_THRESHOLD).length;

  return (
    <div className="ax-page">
      <div className="ax-container ax-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <header className="ax-hero sd-hero">
          <div style={{ position: "relative", zIndex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ax-gold-2)", marginBottom: 8 }}>
              Student Dashboard
            </div>
            <h1 style={{ margin: 0, fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
              {greetingFor(now.getHours())}, <span style={{ color: "var(--ax-gold-2)" }}>{firstName}</span>
            </h1>
            <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.72)", fontSize: 14 }}>{today}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              {regNo && (
                <span className="sd-hero-pill">
                  <Icon name="hash" size={13} /> {regNo}
                </span>
              )}
              {!loading && !error && hasData && (
                <span className={`sd-hero-pill ${isLow ? "is-low" : "is-ok"}`}>
                  <span className="ax-dot" aria-hidden="true" />
                  {isLow ? "Below threshold" : "Good standing"}
                </span>
              )}
              {!loading && subjectStats.length > 0 && (
                <span className="sd-hero-pill">
                  <Icon name="book" size={13} /> {subjectStats.length} subjects
                </span>
              )}
            </div>
          </div>
          <Link to="/student/profile" className="sd-hero-profile">
            <Avatar name={fullName} size={42} />
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontWeight: 700, fontSize: 14, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fullName}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--ax-gold-2)", fontWeight: 600 }}>
                View profile <Icon name="arrowRight" size={12} />
              </span>
            </span>
          </Link>
        </header>

        {/* ── Alerts ───────────────────────────────────────────────────── */}
        {!loading && error && <Alert tone="danger" title="Couldn't load your attendance">{error}</Alert>}
        {!loading && !error && hasData && isLow && (
          <Alert tone="danger" title="Low Attendance Warning">
            Your attendance is <strong>{fmtPct(overallPct)}</strong> — below the required {ATTENDANCE_THRESHOLD}%. You may be barred from exams.
          </Alert>
        )}

        {/* ── AI tip ───────────────────────────────────────────────────── */}
        <TipCard tip={tip} loading={tipLoading} />

        {/* ── Overview: gauge + KPIs + trend ───────────────────────────── */}
        <div className="sd-overview">
          <section className="ax-card ax-card-pad sd-gauge-card" aria-labelledby="sd-gauge-title">
            <div style={{ alignSelf: "stretch", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <h2 id="sd-gauge-title" className="ax-section-title">Overall attendance</h2>
              <span className="ax-badge" style={{ fontSize: 11 }}>Required {ATTENDANCE_THRESHOLD}%</span>
            </div>

            {loading ? (
              <Skeleton width={176} height={176} radius="50%" style={{ margin: "8px auto" }} />
            ) : (
              <RingGauge
                value={overallPct}
                low={isLow}
                label={`Overall attendance ${fmtPct(overallPct)}, required ${ATTENDANCE_THRESHOLD}%`}
              />
            )}

            {loading ? (
              <Skeleton height={64} />
            ) : !hasData ? (
              <div className="sd-forecast">
                <Icon name="info" size={18} />
                <span>No classes recorded yet. Your standing appears after your first class.</span>
              </div>
            ) : isLow ? (
              <div className="sd-forecast is-low">
                <Icon name="trendUp" size={18} />
                <span>
                  Attend the next <strong style={{ fontSize: 16 }}>{needed}</strong> class{needed === 1 ? "" : "es"} in a row to reach {ATTENDANCE_THRESHOLD}%.
                </span>
              </div>
            ) : (
              <div className="sd-forecast is-ok">
                <Icon name="shield" size={18} />
                <span>
                  {canSkip > 0 ? (
                    <>You can safely miss <strong style={{ fontSize: 16 }}>{canSkip}</strong> class{canSkip === 1 ? "" : "es"} and stay above {ATTENDANCE_THRESHOLD}%.</>
                  ) : (
                    <>You're right at the line — don't miss the next class.</>
                  )}
                </span>
              </div>
            )}
          </section>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
            <div className="sd-kpis">
              <StatCard label="Classes attended" value={present} icon="checkCircle" tone="success" loading={loading} hint={hasData ? `${Math.round((present / Math.max(records.length, 1)) * 100)}% of all classes` : "No classes yet"} />
              <StatCard label="Classes missed" value={absent} icon="xCircle" tone={absent > 0 && isLow ? "danger" : "warning"} loading={loading} hint={atRiskCount ? `${atRiskCount} subject${atRiskCount === 1 ? "" : "s"} below ${ATTENDANCE_THRESHOLD}%` : "All subjects on track"} />
              <StatCard label="Total classes" value={records.length} icon="calendar" tone="navy" loading={loading} hint={subjectStats.length ? `Across ${subjectStats.length} subjects` : "—"} />
            </div>
            <TrendCard records={records} loading={loading} />
          </div>
        </div>

        {/* ── Subjects ─────────────────────────────────────────────────── */}
        <section className="ax-card ax-card-pad" aria-labelledby="sd-subjects-title">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <div>
              <h2 id="sd-subjects-title" className="ax-section-title">Subject-wise Attendance</h2>
              <p className="ax-section-sub">Sorted by lowest attendance first. Click a subject to see every class.</p>
            </div>
          </div>

          {loading ? (
            <div className="sd-subjects">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={128} radius={14} />)}
            </div>
          ) : subjectStats.length === 0 ? (
            <EmptyState icon="book" title="No subject attendance data yet" message="Subjects show up here once your teachers start marking attendance." />
          ) : (
            <div className="sd-subjects">
              {sortedSubjects.map((s) => {
                const low = s.percentage < ATTENDANCE_THRESHOLD;
                const active = lc(selectedSubject) === lc(s.subject);
                const m = attendanceMath(s.present, s.total);
                return (
                  <button
                    key={s.subject}
                    type="button"
                    className={`sd-subject${active ? " is-active" : ""}`}
                    onClick={() => selectSubject(active ? "" : s.subject)}
                    aria-pressed={active}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ax-text)", textAlign: "left", lineHeight: 1.3 }}>{s.subject}</span>
                      <span className={`ax-badge ${low ? "ax-badge-danger" : "ax-badge-success"}`} style={{ height: 22, fontSize: 11, flex: "none" }}>
                        {low ? "At risk" : "Safe"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: low ? "var(--ax-danger)" : "var(--ax-text)" }}>{fmtPct(s.percentage)}</span>
                      <span style={{ fontSize: 12, color: "var(--ax-muted)" }}>{s.present}/{s.total} classes</span>
                    </div>
                    <ProgressBar value={s.percentage} threshold={ATTENDANCE_THRESHOLD} />
                    <span style={{ fontSize: 12, color: "var(--ax-muted)", textAlign: "left" }}>
                      {low ? `Needs ${m.needed} more in a row` : m.canSkip > 0 ? `Can miss ${m.canSkip}` : "No classes to spare"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Drill-down panel */}
          {!loading && subjectStats.length > 0 && (
            <div ref={drillRef} className="sd-drill">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <label htmlFor="sd-subject-select" className="ax-label" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="filter" size={14} /> Subject details
                </label>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flex: "1 1 220px", justifyContent: "flex-end" }}>
                  <select
                    id="sd-subject-select"
                    className="ax-input"
                    value={selectedSubject}
                    onChange={(e) => selectSubject(e.target.value)}
                    style={{ maxWidth: 280, flex: "1 1 200px" }}
                  >
                    <option value="">Select subject</option>
                    {subjectStats.map((s) => (
                      <option key={s.subject} value={s.subject}>{s.subject}</option>
                    ))}
                  </select>
                  {selectedSubject && (
                    <button type="button" className="ax-btn ax-btn-ghost ax-btn-sm" onClick={() => selectSubject("")} aria-label="Clear subject selection">
                      <Icon name="x" size={14} /> Clear
                    </button>
                  )}
                </div>
              </div>

              {!selectedSubject ? (
                <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--ax-muted)" }}>Choose any subject to view its detailed attendance.</p>
              ) : !selectedSubjectStat ? (
                <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--ax-muted)" }}>No attendance data found for this subject.</p>
              ) : (
                <div key={selectedSubjectStat.subject} className="ax-fade-up" style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="sd-mini-grid">
                    <div className="sd-mini">
                      <span>Subject</span>
                      <strong style={{ fontSize: 15 }}>{selectedSubjectStat.subject}</strong>
                    </div>
                    <div className="sd-mini" style={{ background: "var(--ax-success-soft)" }}>
                      <span style={{ color: "#166534" }}>Present</span>
                      <strong style={{ color: "#166534" }}>{selectedSubjectStat.present}</strong>
                    </div>
                    <div className="sd-mini" style={{ background: "var(--ax-danger-soft)" }}>
                      <span style={{ color: "#991b1b" }}>Absent</span>
                      <strong style={{ color: "#991b1b" }}>{Math.max(selectedSubjectStat.total - selectedSubjectStat.present, 0)}</strong>
                    </div>
                    <div className="sd-mini">
                      <span>Percentage</span>
                      <strong style={{ color: selectedSubjectStat.percentage >= ATTENDANCE_THRESHOLD ? "var(--ax-success)" : "var(--ax-danger)" }}>
                        {fmtPct(selectedSubjectStat.percentage)}
                      </strong>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ax-muted)", marginBottom: 6 }}>
                      <span>Subject progress</span>
                      <span style={{ fontWeight: 700, color: "var(--ax-text)" }}>{fmtPct(selectedSubjectStat.percentage)}</span>
                    </div>
                    <ProgressBar value={selectedSubjectStat.percentage} threshold={ATTENDANCE_THRESHOLD} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div className="sd-seg" role="group" aria-label="Filter subject records by status">
                      {[
                        { key: "all", label: `All (${selectedSubjectRecords.length})` },
                        { key: "present", label: `Present (${subjectPresentCount})` },
                        { key: "absent", label: `Absent (${selectedSubjectRecords.length - subjectPresentCount})` },
                      ].map((f) => (
                        <button key={f.key} type="button" aria-pressed={subjectStatusFilter === f.key} className={subjectStatusFilter === f.key ? "is-active" : ""} onClick={() => setSubjectStatusFilter(f.key)}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <span style={{ fontSize: 12, color: "var(--ax-muted)" }}>
                      Records in selected subject: <strong style={{ color: "var(--ax-text)" }}>{filteredSubjectRecords.length}</strong>
                    </span>
                  </div>

                  <div className="sd-drill-list">
                    {filteredSubjectRecords.length === 0 ? (
                      <div style={{ padding: 14, fontSize: 13, color: "var(--ax-muted)" }}>No records in this filter.</div>
                    ) : (
                      filteredSubjectRecords.map((r) => (
                        <div key={r._id} className="sd-drill-row">
                          <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--ax-text-2)" }}>
                            <Icon name="calendar" size={14} style={{ color: "var(--ax-muted)" }} />
                            {new Date(r.date).toLocaleDateString("en-IN", { weekday: "short" })}, {fmtDate(r.date)}
                          </span>
                          <span className={`ax-badge ${statusBadge(r.status)}`} style={{ height: 22, fontSize: 11 }}>{r.status}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Recent records ───────────────────────────────────────────── */}
        <section className="ax-card" style={{ overflow: "hidden" }} aria-labelledby="sd-recent-title">
          <div style={{ padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", borderBottom: "1px solid var(--ax-border)" }}>
            <div>
              <h2 id="sd-recent-title" className="ax-section-title">Recent Attendance Records</h2>
              <p className="ax-section-sub">Newest first{!loading && records.length ? ` · ${tableRecords.length} matching` : ""}</p>
            </div>
            {!loading && records.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <select
                  aria-label="Filter records by subject"
                  className="ax-input"
                  value={tableSubject}
                  onChange={(e) => { setTableSubject(e.target.value); setVisible(PAGE_SIZE); }}
                  style={{ height: 36, width: "auto", maxWidth: "100%", fontSize: 13 }}
                >
                  <option value="all">All subjects</option>
                  {subjectStats.map((s) => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
                </select>
                <div className="sd-seg" role="group" aria-label="Filter records by status">
                  {["all", "present", "absent"].map((k) => (
                    <button key={k} type="button" aria-pressed={tableStatus === k} className={tableStatus === k ? "is-active" : ""} onClick={() => { setTableStatus(k); setVisible(PAGE_SIZE); }}>
                      {k === "all" ? "All" : k === "present" ? "Present" : "Absent"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 22 }}><SkeletonRows rows={6} height={38} /></div>
          ) : records.length === 0 ? (
            <EmptyState icon="clipboard" title="No attendance records yet." message="Records will appear here after your first class is marked." />
          ) : tableRecords.length === 0 ? (
            <EmptyState icon="filter" title="No records match these filters" action={<button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={() => { setTableSubject("all"); setTableStatus("all"); }}>Reset filters</button>} />
          ) : (
            <>
              <div className="ax-table-wrap">
                <table className="ax-table">
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Subject</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRecords.slice(0, visible).map((r) => (
                      <tr key={r._id}>
                        <td style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                          <span style={{ color: "var(--ax-text)", fontWeight: 600 }}>{fmtDate(r.date)}</span>
                          <span className="sd-weekday"> · {new Date(r.date).toLocaleDateString("en-IN", { weekday: "short" })}</span>
                        </td>
                        <td style={{ color: "var(--ax-text)", fontWeight: 500 }}>{r.subject}</td>
                        <td>
                          <span className={`ax-badge ${statusBadge(r.status)}`}>
                            <Icon name={isPresentStatus(r.status) ? "check" : "x"} size={12} strokeWidth={3} />
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {tableRecords.length > visible && (
                <div style={{ padding: 14, display: "flex", justifyContent: "center", borderTop: "1px solid var(--ax-border)" }}>
                  <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    Show more <span style={{ color: "var(--ax-muted)", fontWeight: 500 }}>({tableRecords.length - visible} left)</span>
                    <Icon name="chevronDown" size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <style>{`
        .sd-hero { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; flex-wrap: wrap; }
        .sd-hero-pill { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.16); color: rgba(255,255,255,0.88); max-width: 100%; }
        .sd-hero-pill.is-ok { color: #86efac; }
        .sd-hero-pill.is-low { color: #fca5a5; }
        .sd-hero-profile { position: relative; z-index: 1; display: flex; align-items: center; gap: 12px; padding: 10px 16px 10px 10px; border-radius: 14px; text-decoration: none; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.16); transition: background .2s ease, transform .2s var(--ax-ease), border-color .2s ease; max-width: 100%; min-width: 0; }
        .sd-hero-profile:hover { background: rgba(255,255,255,0.14); border-color: rgba(227,197,109,0.5); transform: translateY(-1px); }

        .sd-tip { display: flex; gap: 16px; align-items: flex-start; padding: 20px 22px; border-radius: var(--ax-radius-lg); border: 1px solid transparent;
          background: linear-gradient(135deg, #fffdf6, var(--ax-surface) 55%, #f6f8ff) padding-box, linear-gradient(135deg, var(--ax-gold-2), var(--ax-gold) 35%, rgba(47,85,212,0.45)) border-box;
          box-shadow: 0 8px 28px rgba(201,168,76,0.14); position: relative; overflow: hidden; }
        .sd-tip::after { content: ""; position: absolute; right: -60px; top: -60px; width: 180px; height: 180px; border-radius: 50%; background: radial-gradient(circle, rgba(201,168,76,0.16), transparent 70%); pointer-events: none; }
        .sd-tip-icon { flex: none; width: 46px; height: 46px; border-radius: 13px; display: flex; align-items: center; justify-content: center; color: var(--ax-gold-2); background: linear-gradient(135deg, var(--ax-navy), var(--ax-navy-2)); box-shadow: 0 6px 16px rgba(11,21,48,0.25); }

        .sd-overview { display: grid; grid-template-columns: minmax(280px, 340px) minmax(0, 1fr); gap: 20px; align-items: stretch; }
        .sd-gauge-card { display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .sd-ring-arc { animation: sd-ring 1.3s var(--ax-ease) both; transition: stroke-dashoffset .8s var(--ax-ease); }
        @keyframes sd-ring { from { stroke-dashoffset: var(--sd-ring-from); } }
        .sd-forecast { align-self: stretch; display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: var(--ax-radius); font-size: 13px; line-height: 1.5; background: var(--ax-surface-2); border: 1px solid var(--ax-border); color: var(--ax-text-2); }
        .sd-forecast.is-ok { background: var(--ax-success-soft); border-color: #bbf7d0; color: #166534; }
        .sd-forecast.is-low { background: var(--ax-danger-soft); border-color: #fecaca; color: #991b1b; }
        .sd-forecast svg { margin-top: 1px; }
        .sd-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 16px; }

        .sd-trend { height: 200px; padding: 22px 0 24px; }
        .sd-trend-plot { position: relative; height: 100%; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; border-bottom: 1px solid var(--ax-border); }
        .sd-trend-target { position: absolute; left: 0; right: 0; border-top: 2px dashed rgba(11,21,48,0.28); pointer-events: none; z-index: 1; }
        .sd-trend-col { position: relative; display: flex; justify-content: center; height: 100%; padding: 0; background: none; border: 0; cursor: default; font: inherit; border-radius: 8px 8px 0 0; }
        .sd-trend-track { position: relative; width: min(46px, 72%); height: 100%; display: flex; align-items: flex-end; border-radius: 8px 8px 0 0; background: linear-gradient(180deg, transparent, rgba(237,241,247,0.8)); transition: box-shadow .2s ease; }
        .sd-trend-bar { display: block; width: 100%; border-radius: 6px 6px 0 0; transform-origin: bottom; animation: sd-grow .9s var(--ax-ease) both; transition: filter .2s ease, height .6s var(--ax-ease); }
        .sd-trend-col:hover .sd-trend-bar, .sd-trend-col.is-active .sd-trend-bar { filter: brightness(1.08) saturate(1.1); }
        .sd-trend-col.is-active .sd-trend-track { box-shadow: 0 0 0 2px var(--ax-border-strong); }
        .sd-trend-val { position: absolute; left: 50%; transform: translateX(-50%); font-size: 12px; font-weight: 700; color: var(--ax-text); font-variant-numeric: tabular-nums; white-space: nowrap; }
        .sd-trend-label { position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%); font-size: 11px; color: var(--ax-muted); white-space: nowrap; }
        @keyframes sd-grow { from { transform: scaleY(0); } }

        .sd-heat { display: flex; flex-direction: column; gap: 4px; }
        .sd-heat-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .sd-heat-cell { display: block; height: 16px; border-radius: 4px; transition: transform .15s ease, box-shadow .15s ease; }
        .sd-heat-row .sd-heat-cell:hover { transform: scale(1.12); box-shadow: 0 0 0 2px var(--ax-surface), 0 0 0 3px var(--ax-border-strong); }
        .sd-heat-cell.lvl-good { background: var(--ax-success); opacity: .85; }
        .sd-heat-cell.lvl-low { background: var(--ax-warning); opacity: .85; }
        .sd-heat-cell.lvl-zero { background: var(--ax-danger); opacity: .85; }
        .sd-heat-cell.lvl-none { background: #edf1f7; }

        .sd-subjects { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
        .sd-subject { display: flex; flex-direction: column; gap: 10px; text-align: left; padding: 16px; border-radius: 14px; background: var(--ax-surface); border: 1px solid var(--ax-border); cursor: pointer; font: inherit; transition: transform .22s var(--ax-ease), box-shadow .22s var(--ax-ease), border-color .2s ease, background .2s ease; }
        .sd-subject:hover { transform: translateY(-2px); box-shadow: var(--ax-shadow); border-color: var(--ax-border-strong); }
        .sd-subject.is-active { border-color: var(--ax-blue); background: #fbfcff; box-shadow: var(--ax-ring); }

        .sd-drill { margin-top: 18px; padding: 16px; border-radius: 14px; background: var(--ax-surface-2); border: 1px solid var(--ax-border); scroll-margin-top: calc(var(--ax-nav-h) + 16px); }
        .sd-mini-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
        .sd-mini { display: flex; flex-direction: column; gap: 4px; padding: 12px; border-radius: 10px; background: var(--ax-surface); border: 1px solid var(--ax-border); min-width: 0; }
        .sd-mini span { font-size: 12px; color: var(--ax-muted); }
        .sd-mini strong { font-size: 20px; font-weight: 800; color: var(--ax-text); overflow-wrap: anywhere; }
        .sd-drill-list { max-height: 260px; overflow-y: auto; border: 1px solid var(--ax-border); border-radius: 10px; background: var(--ax-surface); }
        .sd-drill-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--ax-border); transition: background .15s ease; }
        .sd-drill-row:last-child { border-bottom: none; }
        .sd-drill-row:hover { background: #f8faff; }

        .sd-seg { display: inline-flex; flex-wrap: wrap; gap: 2px; padding: 3px; border-radius: 10px; background: #edf1f7; }
        .sd-seg button { height: 30px; padding: 0 12px; border: 0; border-radius: 8px; background: transparent; font: inherit; font-size: 12px; font-weight: 600; color: var(--ax-text-2); cursor: pointer; transition: background .18s ease, color .18s ease, box-shadow .18s ease; }
        .sd-seg button:hover { color: var(--ax-text); }
        .sd-seg button.is-active { background: var(--ax-surface); color: var(--ax-navy); box-shadow: var(--ax-shadow-sm); }

        .sd-weekday { color: var(--ax-muted); font-size: 12px; }

        @media (max-width: 960px) {
          .sd-overview { grid-template-columns: minmax(0, 1fr); }
        }
        @media (max-width: 640px) {
          .sd-hero { padding: 22px; }
          .sd-hero-profile { flex: 1 1 100%; }
          .sd-tip { padding: 16px; gap: 12px; }
          .sd-tip-icon { width: 38px; height: 38px; }
          .sd-trend-plot { gap: 8px; }
          .sd-weekday { display: none; }
          .sd-subjects { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
