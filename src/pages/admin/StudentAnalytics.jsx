import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import studentService from "../../services/studentService";
import attendanceService from "../../services/attendanceService";
import AttendanceTable from "../../components/AttendanceTable";
import { ATTENDANCE_THRESHOLD } from "../../utils/constants";
import { Alert, Avatar, CountUp, EmptyState, Icon, ProgressBar, Skeleton, StatCard } from "../../components/ui";

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const errorText = (err, fallback) => err?.response?.data?.message || err?.message || fallback;
const normStatus = (s) => {
  const v = String(s || "").trim().toLowerCase();
  return v === "present" || v === "late" ? v : "absent";
};
const dayKey = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const shortDate = (key) => new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
const longDate = (key) => new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
const round1 = (n) => Math.round(n * 10) / 10;

/* ── Small visual helpers ───────────────────────────────────────────────── */

// Ring showing the overall attendance percentage (on the dark hero).
const Ring = ({ value, size = 112 }) => {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value ?? 0));
  const low = value !== null && value < ATTENDANCE_THRESHOLD;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={value === null ? "No attendance data" : `Overall attendance ${round1(value)}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={low ? "#f87171" : "var(--ax-gold-2)"}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1.1s var(--ax-ease)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>
          {value === null ? "—" : <CountUp value={round1(value)} decimals={value % 1 ? 1 : 0} suffix="%" />}
        </div>
        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>overall</div>
      </div>
    </div>
  );
};

const roundedTop = (x, y, w, h, r) => {
  if (h <= 0) return "";
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
};

// Daily attendance bars + running (cumulative) attendance line, plain SVG.
const TrendChart = ({ days }) => {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(260, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = 230;
  const pad = { l: 36, r: 10, t: 12, b: 28 };
  const plotW = width - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const n = days.length;
  const band = plotW / n;
  const barW = Math.max(3, Math.min(22, band * 0.62));
  const y = (p) => pad.t + (1 - p / 100) * plotH;
  const cx = (i) => pad.l + band * i + band / 2;
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 64))));
  const linePath = days.map((d, i) => `${i ? "L" : "M"}${cx(i).toFixed(1)},${y(d.cumulative).toFixed(1)}`).join(" ");
  const h = hover !== null ? days[hover] : null;
  const first = days[0];
  const last = days[n - 1];

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "var(--ax-text-2)", marginBottom: 10 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--ax-blue)" }} /> Daily attendance
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--ax-danger)" }} /> Day below {ATTENDANCE_THRESHOLD}%
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 16, height: 2, background: "var(--ax-navy)", borderRadius: 2 }} /> Running overall
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 16, borderTop: "2px dashed var(--ax-gold)" }} /> {ATTENDANCE_THRESHOLD}% minimum
        </span>
      </div>

      <div ref={wrapRef} style={{ position: "relative", width: "100%" }} onMouseLeave={() => setHover(null)}>
        <svg
          width={width}
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          role="img"
          aria-label={`Attendance over ${n} days from ${longDate(first.key)} to ${longDate(last.key)}. Running overall attendance moved from ${round1(first.cumulative)}% to ${round1(last.cumulative)}%.`}
          style={{ display: "block", overflow: "visible" }}
        >
          {[0, 25, 50, 75, 100].map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="var(--ax-border)" strokeWidth="1" />
              <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--ax-muted)">
                {t}%
              </text>
            </g>
          ))}

          {days.map((d, i) => {
            const top = y(d.pct);
            const low = d.pct < ATTENDANCE_THRESHOLD;
            return (
              <path
                key={d.key}
                d={roundedTop(cx(i) - barW / 2, top, barW, y(0) - top, 4)}
                fill={low ? "var(--ax-danger)" : "var(--ax-blue)"}
                opacity={hover === null || hover === i ? (low ? 0.85 : 0.75) : 0.3}
                style={{ transition: "opacity 0.15s" }}
              />
            );
          })}

          <line x1={pad.l} x2={width - pad.r} y1={y(ATTENDANCE_THRESHOLD)} y2={y(ATTENDANCE_THRESHOLD)} stroke="var(--ax-gold)" strokeWidth="2" strokeDasharray="5 4" />

          <path d={linePath} fill="none" stroke="var(--ax-navy)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {h && (
            <>
              <line x1={cx(hover)} x2={cx(hover)} y1={pad.t} y2={y(0)} stroke="var(--ax-border-strong)" strokeWidth="1" />
              <circle cx={cx(hover)} cy={y(h.cumulative)} r="5" fill="var(--ax-navy)" stroke="var(--ax-surface)" strokeWidth="2" />
            </>
          )}

          {days.map((d, i) =>
            i % labelEvery === 0 ? (
              <text key={`x-${d.key}`} x={cx(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--ax-muted)">
                {shortDate(d.key)}
              </text>
            ) : null
          )}

          {/* Hit targets (wider than the bars) */}
          {days.map((d, i) => (
            <rect key={`hit-${d.key}`} x={pad.l + band * i} y={pad.t} width={band} height={plotH} fill="transparent" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} />
          ))}
        </svg>

        {h && (
          <div
            role="status"
            style={{
              position: "absolute",
              top: 0,
              left: Math.min(Math.max(cx(hover), 90), width - 90),
              transform: "translateX(-50%)",
              background: "var(--ax-navy)",
              color: "#fff",
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: 12,
              lineHeight: 1.5,
              boxShadow: "var(--ax-shadow-lg)",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              zIndex: 2,
            }}
          >
            <div style={{ fontWeight: 700 }}>{longDate(h.key)}</div>
            <div>
              Attended {h.attended} of {h.total} class{h.total !== 1 ? "es" : ""} · <strong>{round1(h.pct)}%</strong>
            </div>
            <div style={{ color: "var(--ax-gold-2)" }}>Running overall {round1(h.cumulative)}%</div>
          </div>
        )}
      </div>
    </div>
  );
};

const Chip = ({ active, onClick, children, count }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 30,
      padding: "0 11px",
      borderRadius: 999,
      fontSize: 12.5,
      fontWeight: 600,
      cursor: "pointer",
      border: `1px solid ${active ? "var(--ax-navy)" : "var(--ax-border)"}`,
      background: active ? "var(--ax-navy)" : "var(--ax-surface)",
      color: active ? "#fff" : "var(--ax-text-2)",
      transition: "all 0.18s ease",
    }}
  >
    {children}
    {count !== undefined && <span style={{ opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>{count}</span>}
  </button>
);

const Fact = ({ icon, label, value, mono }) => (
  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", minWidth: 0 }}>
    <span style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(255,255,255,0.08)", color: "var(--ax-gold-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon name={icon} size={15} />
    </span>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.6 }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, fontFamily: mono ? MONO : undefined, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={String(value)}>
        {value}
      </div>
    </div>
  </div>
);

/* ── Page ───────────────────────────────────────────────────────────────── */

const StudentAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null); // { id, student, records, studentError, recordsError }
  const [refreshing, setRefreshing] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    const [sRes, aRes, listRes] = await Promise.allSettled([
      studentService.getStudentById(id),
      attendanceService.getStudentAttendance(id),
      // The list also carries section / semester / class roll, and lets us confirm the id.
      studentService.getAllStudents(),
    ]);

    let student = null;
    if (sRes.status === "fulfilled") {
      const payload = sRes.value?.data || sRes.value?.student || sRes.value;
      if (payload && String(payload._id) === String(id)) student = payload;
    }
    if (listRes.status === "fulfilled") {
      const list = listRes.value?.data || listRes.value?.students || [];
      const row = Array.isArray(list) ? list.find((s) => String(s._id) === String(id)) : null;
      if (row) student = { ...(student || {}), ...row };
    }
    const studentError = student
      ? ""
      : sRes.status === "rejected"
      ? errorText(sRes.reason, "Failed to load student.")
      : listRes.status === "rejected"
      ? errorText(listRes.reason, "Failed to load student.")
      : "Student not found.";

    let records = [];
    let recordsError = "";
    if (aRes.status === "fulfilled") {
      const p = aRes.value;
      const raw = p?.data?.records || p?.records || (Array.isArray(p?.data) ? p.data : Array.isArray(p) ? p : []);
      records = raw.map((r, i) => ({ ...r, _id: r._id || `rec-${i}`, status: normStatus(r.status) }));
    } else {
      recordsError = errorText(aRes.reason, "Failed to load attendance records.");
    }

    return { id, student, records, studentError, recordsError };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    load().then((r) => {
      if (!cancelled) setResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const retry = async () => {
    setRefreshing(true);
    const r = await load();
    setResult(r);
    setRefreshing(false);
  };

  const loading = !result || result.id !== id || refreshing;
  const student = loading ? null : result.student;
  const records = useMemo(() => (loading || !result ? [] : result.records), [loading, result]);

  const stats = useMemo(() => {
    const total = records.length;
    const present = records.filter((r) => r.status === "present").length;
    const late = records.filter((r) => r.status === "late").length;
    const absent = total - present - late;
    const attended = present + late;

    const bySubject = new Map();
    const byDay = new Map();
    records.forEach((r) => {
      const subj = r.subject || "General";
      const s = bySubject.get(subj) || { subject: subj, total: 0, attended: 0 };
      s.total++;
      if (r.status !== "absent") s.attended++;
      bySubject.set(subj, s);

      const key = dayKey(r.date);
      if (!key) return;
      const d = byDay.get(key) || { key, total: 0, attended: 0 };
      d.total++;
      if (r.status !== "absent") d.attended++;
      byDay.set(key, d);
    });

    const subjects = [...bySubject.values()].map((s) => ({ ...s, pct: (s.attended / s.total) * 100 })).sort((a, b) => a.subject.localeCompare(b.subject));

    const sortedDays = [...byDay.values()].sort((a, b) => a.key.localeCompare(b.key));
    const days = [];
    const run = { total: 0, attended: 0 };
    for (const d of sortedDays) {
      run.total += d.total;
      run.attended += d.attended;
      days.push({ ...d, pct: (d.attended / d.total) * 100, cumulative: (run.attended / run.total) * 100 });
    }

    // Current run of attended classes, newest first
    const newestFirst = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    for (const r of newestFirst) {
      if (r.status === "absent") break;
      streak++;
    }

    const t = ATTENDANCE_THRESHOLD / 100;
    const needed = total && attended / total < t ? Math.ceil((t * total - attended) / (1 - t)) : 0;
    const canMiss = total && attended / total >= t ? Math.floor(attended / t - total) : 0;
    const weakest = subjects.length ? subjects.reduce((a, b) => (b.pct < a.pct ? b : a)) : null;

    return { total, present, late, absent, attended, subjects, days, streak, needed, canMiss, weakest };
  }, [records]);

  const overall = stats.total
    ? (stats.attended / stats.total) * 100
    : typeof student?.attendancePercentage === "number"
    ? student.attendancePercentage
    : null;
  const isLow = overall !== null && overall < ATTENDANCE_THRESHOLD;

  const filteredRecords = useMemo(
    () =>
      records
        .filter((r) => (!subjectFilter || (r.subject || "General") === subjectFilter) && (!statusFilter || r.status === statusFilter))
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [records, subjectFilter, statusFilter]
  );

  const backBar = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, fontSize: 13, flexWrap: "wrap" }}>
      <button type="button" className="ax-btn ax-btn-ghost ax-btn-sm" onClick={() => navigate(-1)}>
        <Icon name="arrowLeft" size={14} /> Back
      </button>
      <span style={{ color: "var(--ax-border-strong)" }}>/</span>
      <Link to="/admin/students" style={{ color: "var(--ax-muted)", textDecoration: "none" }} className="hover:underline">
        Students
      </Link>
      <Icon name="chevronRight" size={13} style={{ color: "var(--ax-muted)" }} />
      <span style={{ color: "var(--ax-text)", fontWeight: 600 }}>{student?.name || "Analytics"}</span>
    </div>
  );

  // ── Loading ──
  if (loading) {
    return (
      <div className="ax-page">
        <div className="ax-container" aria-busy="true">
          {backBar}
          <div className="ax-card ax-card-pad" style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 18 }}>
            <Skeleton width={64} height={64} radius={18} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <Skeleton height={20} width="40%" />
              <Skeleton height={12} width="60%" />
            </div>
            <Skeleton width={96} height={96} radius={48} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 18 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCard key={i} label="Loading" value={0} loading />
            ))}
          </div>
          <div className="ax-card ax-card-pad">
            <Skeleton height={220} />
          </div>
        </div>
      </div>
    );
  }

  // ── Student failed to load ──
  if (!student) {
    return (
      <div className="ax-page">
        <div className="ax-container">
          {backBar}
          <Alert tone="danger" title="Couldn't load this student">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <span>{result.studentError}</span>
              <span style={{ display: "flex", gap: 8 }}>
                <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={retry}>
                  <Icon name="refresh" size={14} /> Retry
                </button>
                <Link to="/admin/students" className="ax-btn ax-btn-ghost ax-btn-sm">
                  All students
                </Link>
              </span>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  const roll = student.classRollNumber ?? student.rollNumber;
  const facts = [
    { icon: "hash", label: "Registration no.", value: student.registrationNumber, mono: true },
    { icon: "layers", label: "Section", value: student.section ? `${student.section}${student.semester != null ? ` · Semester ${student.semester}` : ""}` : "Unassigned" },
    { icon: "user", label: "Class roll", value: roll },
    { icon: "building", label: "Department", value: student.department },
    { icon: "calendar", label: "Batch", value: student.admissionYear },
    { icon: "mail", label: "Parent email", value: student.parentEmail },
    { icon: "phone", label: "Parent phone", value: student.parentPhone },
  ].filter((f) => f.value !== undefined && f.value !== null && f.value !== "");

  const statusOptions = [
    { key: "", label: "All", count: stats.total },
    { key: "present", label: "Present", count: stats.present },
    { key: "absent", label: "Absent", count: stats.absent },
    ...(stats.late ? [{ key: "late", label: "Late", count: stats.late }] : []),
  ];

  return (
    <div className="ax-page">
      <div className="ax-container">
        {backBar}

        {/* Header card */}
        <section className="ax-hero ax-fade-up" style={{ marginBottom: 18 }}>
          <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center", minWidth: 0, flex: "1 1 320px" }}>
              <span style={{ borderRadius: 22, padding: 3, background: "linear-gradient(135deg, var(--ax-gold-2), var(--ax-gold))", display: "inline-flex" }}>
                <Avatar name={student.name} size={64} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ax-gold-2)" }}>Student analytics</div>
                <h1 style={{ margin: "4px 0 8px", fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 800, letterSpacing: "-0.02em", overflowWrap: "anywhere" }}>{student.name}</h1>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {student.userId ? (
                    <span className="ax-badge ax-badge-success">
                      <Icon name="check" size={11} /> Login linked
                    </span>
                  ) : (
                    <span className="ax-badge">No login linked</span>
                  )}
                  {overall !== null && (isLow ? <span className="ax-badge ax-badge-danger">Below {ATTENDANCE_THRESHOLD}%</span> : <span className="ax-badge ax-badge-gold">Good standing</span>)}
                </div>
              </div>
            </div>
            <Ring value={overall} />
          </div>

          {facts.length > 0 && (
            <div
              style={{
                position: "relative",
                zIndex: 1,
                marginTop: 22,
                paddingTop: 18,
                borderTop: "1px solid rgba(255,255,255,0.1)",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 14,
              }}
            >
              {facts.map((f) => (
                <Fact key={f.label} {...f} />
              ))}
            </div>
          )}
        </section>

        {result.recordsError ? (
          <Alert tone="danger" title="Couldn't load attendance records">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <span>{result.recordsError}</span>
              <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={retry}>
                <Icon name="refresh" size={14} /> Retry
              </button>
            </div>
          </Alert>
        ) : stats.total === 0 ? (
          <div className="ax-card">
            <EmptyState icon="calendar" title="No attendance recorded yet" message="Once teachers mark attendance for this student's section, the analytics will appear here." />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="ax-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 18 }}>
              <StatCard label="Classes held" value={stats.total} icon="calendar" tone="navy" hint={`${stats.days.length} school day${stats.days.length !== 1 ? "s" : ""}`} />
              <StatCard label="Attended" value={stats.attended} icon="checkCircle" tone="success" hint={stats.late ? `incl. ${stats.late} late` : `${round1((stats.attended / stats.total) * 100)}% of classes`} />
              <StatCard label="Missed" value={stats.absent} icon="xCircle" tone={stats.absent ? "danger" : "success"} hint={stats.weakest ? `Lowest: ${stats.weakest.subject} (${Math.round(stats.weakest.pct)}%)` : undefined} />
              <StatCard label="Current streak" value={stats.streak} icon="trendUp" tone="gold" hint="Classes attended in a row" />
            </div>

            <div style={{ marginBottom: 18 }}>
              {isLow ? (
                <Alert tone="warning" title={`Below the ${ATTENDANCE_THRESHOLD}% minimum`}>
                  {student.name} needs to attend the next <strong>{stats.needed}</strong> class{stats.needed !== 1 ? "es" : ""} in a row to get back to {ATTENDANCE_THRESHOLD}%.
                </Alert>
              ) : (
                <Alert tone="success" title="Meeting the attendance requirement">
                  {stats.canMiss > 0 ? (
                    <>
                      {student.name} can miss up to <strong>{stats.canMiss}</strong> more class{stats.canMiss !== 1 ? "es" : ""} and still stay at or above {ATTENDANCE_THRESHOLD}%.
                    </>
                  ) : (
                    <>Right at the line — missing the next class would drop attendance below {ATTENDANCE_THRESHOLD}%.</>
                  )}
                </Alert>
              )}
            </div>

            <div className="grid lg:grid-cols-5" style={{ gap: 18, marginBottom: 18 }}>
              {/* Trend */}
              <section className="ax-card ax-card-pad ax-fade-up lg:col-span-3" style={{ minWidth: 0 }}>
                <h2 className="ax-section-title">Attendance over time</h2>
                <p className="ax-section-sub" style={{ marginBottom: 14 }}>
                  Share of classes attended each day, with the running overall percentage. Hover a day for details.
                </p>
                <TrendChart days={stats.days} />
              </section>

              {/* Subjects */}
              <section className="ax-card ax-card-pad ax-fade-up lg:col-span-2" style={{ minWidth: 0 }}>
                <h2 className="ax-section-title">Subject-wise breakdown</h2>
                <p className="ax-section-sub" style={{ marginBottom: 16 }}>
                  Click a subject to filter the records below.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {stats.subjects.map((s) => {
                    const low = s.pct < ATTENDANCE_THRESHOLD;
                    const active = subjectFilter === s.subject;
                    return (
                      <button
                        key={s.subject}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSubjectFilter(active ? "" : s.subject)}
                        style={{
                          all: "unset",
                          cursor: "pointer",
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: `1px solid ${active ? "var(--ax-blue)" : "transparent"}`,
                          background: active ? "var(--ax-blue-soft)" : "transparent",
                          transition: "background-color 0.15s, border-color 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 7 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ax-text)" }}>{s.subject}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                            <span style={{ color: "var(--ax-muted)", fontVariantNumeric: "tabular-nums" }}>
                              {s.attended}/{s.total}
                            </span>
                            <strong style={{ color: low ? "var(--ax-danger)" : "var(--ax-text)", fontVariantNumeric: "tabular-nums", minWidth: 40, textAlign: "right" }}>{Math.round(s.pct)}%</strong>
                          </span>
                        </div>
                        <div style={{ position: "relative" }}>
                          <ProgressBar value={s.pct} threshold={ATTENDANCE_THRESHOLD} />
                          <span
                            aria-hidden="true"
                            title={`${ATTENDANCE_THRESHOLD}% minimum`}
                            style={{ position: "absolute", top: -3, bottom: -3, left: `${ATTENDANCE_THRESHOLD}%`, width: 2, borderRadius: 2, background: "var(--ax-navy)", opacity: 0.35 }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Records */}
            <section className="ax-fade-up">
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                <div>
                  <h2 className="ax-section-title">Attendance records</h2>
                  <p className="ax-section-sub" aria-live="polite">
                    {filteredRecords.length} of {stats.total} class{stats.total !== 1 ? "es" : ""}
                    {subjectFilter && ` in ${subjectFilter}`}
                    {statusFilter && ` · ${statusFilter}`}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <label htmlFor="record-subject" className="sr-only">
                    Filter by subject
                  </label>
                  <select id="record-subject" className="ax-input" style={{ width: "auto", minWidth: 160, height: 34, paddingTop: 0, paddingBottom: 0, fontSize: 13 }} value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                    <option value="">All subjects</option>
                    {stats.subjects.map((s) => (
                      <option key={s.subject} value={s.subject}>
                        {s.subject}
                      </option>
                    ))}
                  </select>
                  <div role="group" aria-label="Filter by status" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {statusOptions.map((o) => (
                      <Chip key={o.key || "all"} active={statusFilter === o.key} onClick={() => setStatusFilter(o.key)} count={o.count}>
                        {o.label}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
              <AttendanceTable
                key={`${subjectFilter}|${statusFilter}`}
                records={filteredRecords}
                pageSize={20}
                emptyTitle="No records match these filters"
                emptyMessage="Try another subject or status."
              />
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentAnalytics;
