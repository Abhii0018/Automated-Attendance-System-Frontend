import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import attendanceService from "../../services/attendanceService";
import useToast from "../../hooks/useToast";
import { ATTENDANCE_THRESHOLD } from "../../utils/constants";
import { Alert, Avatar, EmptyState, Icon, PageHeader, SkeletonRows } from "../../components/ui";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

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

const STEPS = ["Choose class", "Mark students", "Submitted"];

const Stepper = ({ step }) => (
  <ol aria-label="Progress" style={{ listStyle: "none", margin: "0 0 20px", padding: 0, display: "flex", alignItems: "center", gap: 8 }}>
    {STEPS.map((label, i) => {
      const n = i + 1;
      const done = step > n;
      const active = step === n;
      return (
        <li key={label} aria-current={active ? "step" : undefined} style={{ display: "flex", alignItems: "center", gap: 8, flex: i < STEPS.length - 1 ? 1 : "0 0 auto", minWidth: 0 }}>
          <span
            style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, transition: "all .25s var(--ax-ease)",
              background: done ? "var(--ax-navy)" : active ? "linear-gradient(135deg, var(--ax-gold-2), var(--ax-gold))" : "var(--ax-surface)",
              color: done ? "var(--ax-gold-2)" : active ? "var(--ax-navy)" : "var(--ax-muted)",
              border: done || active ? "none" : "1px solid var(--ax-border-strong)",
              boxShadow: active ? "0 0 0 4px rgba(201,168,76,.18)" : "none",
            }}
          >
            {done ? <Icon name="check" size={14} /> : n}
          </span>
          <span
            className={active ? "" : "hidden sm:inline"}
            style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "var(--ax-text)" : "var(--ax-muted)", whiteSpace: "nowrap" }}
          >
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <span aria-hidden="true" style={{ flex: 1, height: 2, minWidth: 12, borderRadius: 2, background: done ? "var(--ax-navy)" : "var(--ax-border)", transition: "background .25s ease" }} />
          )}
        </li>
      );
    })}
  </ol>
);

// Two-button Present / Absent segmented toggle.
const StatusToggle = ({ value, onChange, name }) => (
  <div role="group" aria-label={`Attendance for ${name}`} className="ma-seg">
    <button
      type="button"
      tabIndex={-1}
      aria-pressed={value === "present"}
      className={`ma-seg-btn ${value === "present" ? "is-present" : ""}`}
      onClick={(e) => { e.stopPropagation(); onChange("present"); }}
    >
      <Icon name="check" size={14} /> <span>Present</span>
    </button>
    <button
      type="button"
      tabIndex={-1}
      aria-pressed={value === "absent"}
      className={`ma-seg-btn ${value === "absent" ? "is-absent" : ""}`}
      onClick={(e) => { e.stopPropagation(); onChange("absent"); }}
    >
      <Icon name="x" size={14} /> <span>Absent</span>
    </button>
  </div>
);

const Counter = ({ label, value, color }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ax-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>{value}</div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const MarkAttendance = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Prefill from the dashboard link: ?slot=&semester=&section=&subject=&period=
  const [prefill] = useState(() => {
    const p = {
      slot: searchParams.get("slot") || "",
      semester: searchParams.get("semester") || "",
      section: searchParams.get("section") || "",
      subject: searchParams.get("subject") || "",
      period: searchParams.get("period") || "",
    };
    p.complete = !!(p.semester && p.section && p.subject && p.period);
    return p;
  });

  const [step, setStep] = useState(1);
  const [semester, setSemester] = useState(prefill.semester);
  const [section, setSection] = useState(prefill.section);
  const [subject, setSubject] = useState(prefill.subject);
  const [periodNumber, setPeriodNumber] = useState(prefill.period);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [scheduleSlots, setScheduleSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(prefill.slot);
  const [allowedSections, setAllowedSections] = useState([]);
  const [history, setHistory] = useState([]);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(prefill.complete);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const rowRefs = useRef({});
  const confirmBtnRef = useRef(null);

  const [todayFmt] = useState(() =>
    new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  );

  // Assigned sections + today's timetable (+ history, to show which slots are already marked).
  const loadContext = useCallback(async () => {
    try {
      const res = await attendanceService.getTeacherOverview();
      const data = res.data || res;
      setAllowedSections(data.sections || []);
      setHistory(data.history || []);
      const scheduleRes = await attendanceService.getTodayTeacherSchedule();
      setScheduleSlots(scheduleRes.data || []);
      setContextError("");
    } catch (err) {
      console.error("Failed to load assigned sections", err);
      setContextError(errMsg(err, "Failed to load your classes and timetable."));
    } finally {
      setContextLoading(false);
    }
  }, []);

  // Fetch the roster; everyone starts as present.
  const fetchRoster = useCallback(async (sem, sec, subj) => {
    try {
      const res = await attendanceService.getSectionStudents(sem, sec, subj);
      const data = [...(res.data || [])].sort((a, b) =>
        String(a.rollNumber ?? a.registrationNumber ?? "").localeCompare(String(b.rollNumber ?? b.registrationNumber ?? ""), undefined, { numeric: true })
      );
      setStudents(data);
      const init = {};
      data.forEach((s) => { init[s.studentId] = "present"; });
      setAttendance(init);
      setQuery("");
      setFilter("all");
      setStep(2);
    } catch (err) {
      setError(errMsg(err, "Failed to load students."));
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  // Opened from a "Mark" link on the dashboard → go straight to the roster.
  useEffect(() => {
    if (prefill.complete) fetchRoster(prefill.semester, prefill.section, prefill.subject);
  }, [prefill, fetchRoster]);

  const availableSemesters = [...new Set(allowedSections.map((s) => s.semester))];
  const availableSections = [...new Set(allowedSections.filter((s) => s.semester === Number(semester)).map((s) => s.section))];
  const availableSubjects = allowedSections
    .filter((s) => s.semester === Number(semester) && s.section === section)
    .map((s) => s.subject);

  const sortedSlots = useMemo(() => [...scheduleSlots].sort((a, b) => a.periodNumber - b.periodNumber), [scheduleSlots]);
  const markedIds = useMemo(() => getMarkedSlotIds(scheduleSlots, history), [scheduleSlots, history]);

  const canLoad = !!(semester && section && subject && periodNumber);

  const handleLoadStudents = (e) => {
    e?.preventDefault();
    setError(""); setAlreadySubmitted(false);
    if (!canLoad) return;
    setLoadingStudents(true);
    fetchRoster(semester, section, subject);
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((s) => { updated[s.studentId] = status; });
    setAttendance(updated);
  };

  const setStatus = (id, status) => setAttendance((prev) => ({ ...prev, [id]: status }));
  const toggle = (id) => setAttendance((prev) => ({ ...prev, [id]: prev[id] === "present" ? "absent" : "present" }));

  const onSlotChange = (value) => {
    setSelectedSlot(value);
    const slot = scheduleSlots.find((s) => s._id === value);
    if (!slot) return;
    setSemester(String(slot.semester));
    setSection(slot.section);
    setSubject(slot.subject);
    setPeriodNumber(String(slot.periodNumber));
    setError(""); setAlreadySubmitted(false);
  };

  // Manual edits detach the highlighted timetable slot.
  const manual = (setter) => (e) => { setter(e.target.value); setSelectedSlot(""); };

  const handleSubmit = async () => {
    setSubmitting(true); setError(""); setAlreadySubmitted(false);
    try {
      const attendanceList = students.map((s) => ({ studentId: s.studentId, status: attendance[s.studentId] === "present" ? "Present" : "Absent" }));
      const res = await attendanceService.markAttendance({ semester: Number(semester), section, subject, periodNumber: Number(periodNumber), attendanceList });
      const data = res?.data || {};
      const absent = attendanceList.filter((a) => a.status === "Absent").length;
      const summary = {
        totalStudents: data.totalStudents ?? attendanceList.length,
        totalPresent: data.totalPresent ?? attendanceList.length - absent,
        totalAbsent: data.totalAbsent ?? absent,
      };
      setResult(summary);
      setConfirmOpen(false);
      setSuccess(true);
      setStep(3);
      toast.success(`Attendance saved · ${subject}, Sec ${section}, Period ${periodNumber}`);
    } catch (err) {
      const msg = errMsg(err, "");
      if (msg.toLowerCase().includes("already submitted")) setAlreadySubmitted(true);
      setError(msg || "Failed to submit attendance.");
      setConfirmOpen(false);
      toast.error(msg || "Failed to submit attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccess(false); setResult(null); setStep(1); setStudents([]); setAttendance({});
    setSemester(""); setSection(""); setSubject(""); setPeriodNumber(""); setSelectedSlot("");
    setAlreadySubmitted(false); setError(""); setQuery(""); setFilter("all");
    if ([...searchParams.keys()].length) setSearchParams({}, { replace: true });
    loadContext();
  };

  const backToSetup = () => { setStep(1); setError(""); setAlreadySubmitted(false); setConfirmOpen(false); };

  const presentCount = Object.values(attendance).filter((v) => v === "present").length;
  const absentCount = Object.values(attendance).filter((v) => v === "absent").length;
  const pct = students.length ? (presentCount / students.length) * 100 : 0;

  const visibleStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      if (filter !== "all" && attendance[s.studentId] !== filter) return false;
      if (!q) return true;
      return [s.name, s.rollNumber, s.registrationNumber].some((v) => String(v ?? "").toLowerCase().includes(q));
    });
  }, [students, attendance, query, filter]);

  const absentees = students.filter((s) => attendance[s.studentId] === "absent");

  // Keyboard on a focused roster row: P / A mark (and move on), Space / Enter toggle, ↑ ↓ move.
  const focusRow = (idx) => {
    const s = visibleStudents[idx];
    if (s) rowRefs.current[s.studentId]?.focus();
  };

  const onRowKeyDown = (e, idx, id) => {
    const key = e.key.toLowerCase();
    if (key === "p" || key === "a") {
      e.preventDefault();
      setStatus(id, key === "p" ? "present" : "absent");
      focusRow(idx + 1);
    } else if (key === " " || key === "enter") {
      e.preventDefault();
      toggle(id);
    } else if (key === "arrowdown" || key === "j") {
      e.preventDefault();
      focusRow(idx + 1);
    } else if (key === "arrowup" || key === "k") {
      e.preventDefault();
      focusRow(idx - 1);
    } else if (key === "home") {
      e.preventDefault();
      focusRow(0);
    } else if (key === "end") {
      e.preventDefault();
      focusRow(visibleStudents.length - 1);
    }
  };

  // Confirm dialog: focus the confirm button, Esc closes.
  useEffect(() => {
    if (!confirmOpen) return undefined;
    confirmBtnRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape" && !submitting) setConfirmOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen, submitting]);

  const classLabel = `${subject} · Sec ${section} · Period ${periodNumber}`;

  // ── Success (step 3) ────────────────────────────────────────────────────────
  if (success) {
    const r = result || { totalStudents: students.length, totalPresent: presentCount, totalAbsent: absentCount };
    const rate = r.totalStudents ? (r.totalPresent / r.totalStudents) * 100 : 0;
    return (
      <div className="ax-page">
        <div className="ax-container" style={{ maxWidth: 760 }}>
          <Stepper step={3} />
          <div className="ax-card ax-fade-up" style={{ padding: "36px 24px", textAlign: "center" }}>
            <div className="ma-pop" style={{ width: 72, height: 72, margin: "0 auto 18px", borderRadius: "50%", background: "var(--ax-success-soft)", color: "var(--ax-success)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 8px rgba(22,163,74,.08)" }}>
              <Icon name="check" size={36} strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 6px", color: "var(--ax-text)" }}>Attendance submitted</h1>
            <p style={{ margin: 0, color: "var(--ax-muted)", fontSize: 14 }}>
              Semester {semester} · Section {section} · {subject} · Period {periodNumber}
            </p>
            <p style={{ margin: "4px 0 24px", color: "var(--ax-muted)", fontSize: 13 }}>{todayFmt}</p>

            <div className="grid grid-cols-3 gap-3" style={{ maxWidth: 460, margin: "0 auto 20px" }}>
              {[
                ["Students", r.totalStudents, "var(--ax-text)", "var(--ax-surface-2)"],
                ["Present", r.totalPresent, "var(--ax-success)", "var(--ax-success-soft)"],
                ["Absent", r.totalAbsent, "var(--ax-danger)", "var(--ax-danger-soft)"],
              ].map(([label, val, fg, bg]) => (
                <div key={label} style={{ background: bg, borderRadius: 12, padding: "14px 8px" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: fg, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{val}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: fg, opacity: 0.85 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ maxWidth: 460, margin: "0 auto 28px", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: "var(--ax-muted)" }}>Class attendance</span>
                <strong style={{ color: rate >= ATTENDANCE_THRESHOLD ? "var(--ax-success)" : "var(--ax-danger)" }}>{rate.toFixed(1)}%</strong>
              </div>
              <div className="ax-progress">
                <span style={{ width: `${rate}%`, background: rate >= ATTENDANCE_THRESHOLD ? "var(--ax-success)" : "var(--ax-danger)" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button type="button" onClick={handleReset} className="ax-btn ax-btn-primary ax-btn-lg">
                <Icon name="plus" size={16} /> Mark another class
              </button>
              <Link to="/teacher/dashboard" className="ax-btn ax-btn-secondary ax-btn-lg">
                <Icon name="dashboard" size={16} /> Back to dashboard
              </Link>
            </div>
          </div>
        </div>
        <style>{PAGE_CSS}</style>
      </div>
    );
  }

  return (
    <div className="ax-page">
      <div className="ax-container">
        <PageHeader
          eyebrow="Mark attendance"
          title={step === 1 ? "Choose a class" : classLabel}
          subtitle={step === 1 ? `${todayFmt} · pick one of today's periods or choose manually` : `Semester ${semester} · ${todayFmt}`}
          actions={
            step === 2 ? (
              <button type="button" onClick={backToSetup} className="ax-btn ax-btn-secondary">
                <Icon name="arrowLeft" size={16} /> Change class
              </button>
            ) : (
              <Link to="/teacher/dashboard" className="ax-btn ax-btn-ghost">
                <Icon name="arrowLeft" size={16} /> Dashboard
              </Link>
            )
          }
        />

        <Stepper step={step} />

        {/* ── STEP 1: choose class ─────────────────────────────────────── */}
        {step === 1 && (
          <div className="grid gap-5 lg:grid-cols-[3fr_2fr] ax-fade-up">
            <section className="ax-card ax-card-pad" aria-labelledby="slots-title">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                <div>
                  <h2 id="slots-title" className="ax-section-title">Today's timetable</h2>
                  <p className="ax-section-sub">Select a period to fill in the details</p>
                </div>
                {!contextLoading && sortedSlots.length > 0 && (
                  <span className="ax-badge ax-badge-gold">{sortedSlots.length} periods</span>
                )}
              </div>

              {contextLoading ? (
                <SkeletonRows rows={5} height={64} />
              ) : contextError ? (
                <Alert tone="danger" title="Couldn't load your timetable">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <span>{contextError}</span>
                    <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={() => { setContextLoading(true); setContextError(""); loadContext(); }}>
                      <Icon name="refresh" size={14} /> Retry
                    </button>
                  </div>
                </Alert>
              ) : sortedSlots.length === 0 ? (
                <EmptyState icon="calendar" title="No periods scheduled today" message="You have no timetable slots today. You can still choose a class manually." />
              ) : (
                <div role="radiogroup" aria-labelledby="slots-title" className="grid gap-2 sm:grid-cols-2 ax-stagger">
                  {sortedSlots.map((slot) => {
                    const active = selectedSlot === slot._id;
                    const done = markedIds.has(slot._id);
                    return (
                      <button
                        key={slot._id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onSlotChange(slot._id)}
                        className={`ma-slot ${active ? "is-active" : ""}`}
                      >
                        <span className="ma-slot-period">P{slot.periodNumber}</span>
                        <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                          <span style={{ display: "block", fontWeight: 700, color: "var(--ax-text)", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{slot.subject}</span>
                          <span style={{ display: "block", fontSize: 12, color: "var(--ax-muted)" }}>Sem {slot.semester} · Sec {slot.section}</span>
                        </span>
                        {done ? (
                          <span className="ax-badge ax-badge-success" style={{ height: 22, fontSize: 11 }}>Marked</span>
                        ) : active ? (
                          <Icon name="checkCircle" size={18} style={{ color: "var(--ax-gold)" }} />
                        ) : (
                          <span className="ax-badge ax-badge-warning" style={{ height: 22, fontSize: 11 }}>Pending</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="ax-card ax-card-pad" aria-labelledby="details-title">
              <h2 id="details-title" className="ax-section-title">Session details</h2>
              <p className="ax-section-sub" style={{ marginBottom: 16 }}>Filled from the timetable, or choose manually</p>

              <form onSubmit={handleLoadStudents} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="ax-label" htmlFor="ma-semester">Semester <span style={{ color: "var(--ax-danger)" }}>*</span></label>
                    <select id="ma-semester" className="ax-input" value={semester} onChange={manual(setSemester)} required disabled={contextLoading}>
                      <option value="">Select</option>
                      {availableSemesters.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="ax-label" htmlFor="ma-section">Section <span style={{ color: "var(--ax-danger)" }}>*</span></label>
                    <select id="ma-section" className="ax-input" value={section} onChange={manual(setSection)} required disabled={contextLoading}>
                      <option value="">Select</option>
                      {availableSections.map((s) => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="ax-label" htmlFor="ma-subject">Subject <span style={{ color: "var(--ax-danger)" }}>*</span></label>
                    <select id="ma-subject" className="ax-input" value={subject} onChange={manual(setSubject)} required disabled={contextLoading}>
                      <option value="">Select</option>
                      {availableSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="ax-label" htmlFor="ma-period">Period <span style={{ color: "var(--ax-danger)" }}>*</span></label>
                    <select id="ma-period" className="ax-input" value={periodNumber} onChange={manual(setPeriodNumber)} required>
                      <option value="">Select</option>
                      {PERIODS.map((p) => <option key={p} value={p}>Period {p}</option>)}
                    </select>
                  </div>
                </div>

                {!contextLoading && !contextError && allowedSections.length === 0 && (
                  <Alert tone="warning">You have no classes assigned yet. Ask your admin to assign a semester, section and subject.</Alert>
                )}

                {error && <Alert tone="danger" title="Couldn't load students">{error}</Alert>}

                <button type="submit" className="ax-btn ax-btn-primary ax-btn-lg" disabled={loadingStudents || !canLoad} style={{ width: "100%" }}>
                  {loadingStudents ? (<><span className="ax-spinner" aria-hidden="true" /> Loading students…</>) : (<>Load students <Icon name="arrowRight" size={16} /></>)}
                </button>
              </form>
            </section>
          </div>
        )}

        {/* ── STEP 2: mark students ────────────────────────────────────── */}
        {step === 2 && (
          <div className="ax-fade-up">
            {/* Sticky live summary */}
            <div className="ax-card ma-sticky" style={{ padding: "12px 16px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 22, alignItems: "flex-end" }} aria-live="polite">
                  <Counter label="Present" value={presentCount} color="var(--ax-success)" />
                  <Counter label="Absent" value={absentCount} color="var(--ax-danger)" />
                  <Counter label="Rate" value={`${pct.toFixed(0)}%`} color={pct >= ATTENDANCE_THRESHOLD ? "var(--ax-text)" : "var(--ax-warning)"} />
                  <Counter label="Total" value={students.length} color="var(--ax-text)" />
                </div>
                <button
                  type="button"
                  className="ax-btn ax-btn-gold ma-submit"
                  onClick={() => { setError(""); setConfirmOpen(true); }}
                  disabled={submitting || alreadySubmitted || students.length === 0}
                >
                  {alreadySubmitted ? "Already submitted" : (<>Review &amp; submit <Icon name="arrowRight" size={16} /></>)}
                </button>
              </div>
              <div style={{ display: "flex", height: 6, borderRadius: 999, overflow: "hidden", background: "#edf1f7", marginTop: 10 }} aria-hidden="true">
                <span style={{ width: `${pct}%`, background: "var(--ax-success)", transition: "width .35s var(--ax-ease)" }} />
                <span style={{ width: `${students.length ? 100 - pct : 0}%`, background: "var(--ax-danger)", opacity: 0.8, transition: "width .35s var(--ax-ease)" }} />
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: 14 }}>
                {alreadySubmitted ? (
                  <Alert tone="warning" title="Attendance already submitted">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <span>{error}. Attendance for this period is locked once saved.</span>
                      <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={backToSetup}>Choose another class</button>
                    </div>
                  </Alert>
                ) : (
                  <Alert tone="danger" title="Couldn't submit attendance" onClose={() => setError("")}>{error}</Alert>
                )}
              </div>
            )}

            <section className="ax-card" aria-labelledby="roster-title" style={{ overflow: "hidden" }}>
              {/* Toolbar */}
              <div style={{ padding: 16, borderBottom: "1px solid var(--ax-border)", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <h2 id="roster-title" className="ax-section-title">Student roster</h2>
                    <p className="ax-section-sub">Everyone starts as present. Tap a student to toggle.</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={() => markAll("present")}>
                      <Icon name="checkCircle" size={14} style={{ color: "var(--ax-success)" }} /> All present
                    </button>
                    <button type="button" className="ax-btn ax-btn-danger ax-btn-sm" onClick={() => markAll("absent")}>
                      <Icon name="xCircle" size={14} /> All absent
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ position: "relative", flex: "1 1 220px", minWidth: 0 }}>
                    <Icon name="search" size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ax-muted)", pointerEvents: "none" }} />
                    <label htmlFor="ma-search" className="sr-only">Search students</label>
                    <input
                      id="ma-search"
                      type="search"
                      className="ax-input"
                      placeholder="Search name or roll no."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); focusRow(0); } }}
                      style={{ paddingLeft: 36 }}
                    />
                  </div>
                  <div role="group" aria-label="Filter students" className="ma-filter">
                    {[["all", `All ${students.length}`], ["present", `Present ${presentCount}`], ["absent", `Absent ${absentCount}`]].map(([val, label]) => (
                      <button key={val} type="button" aria-pressed={filter === val} className={filter === val ? "is-on" : ""} onClick={() => setFilter(val)}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="hidden md:flex" style={{ gap: 14, fontSize: 12, color: "var(--ax-muted)", alignItems: "center", flexWrap: "wrap" }}>
                  <Icon name="info" size={14} />
                  <span>Keyboard: focus a row, then <kbd className="ma-kbd">P</kbd> present · <kbd className="ma-kbd">A</kbd> absent · <kbd className="ma-kbd">Space</kbd> toggle · <kbd className="ma-kbd">↑</kbd><kbd className="ma-kbd">↓</kbd> move</span>
                </div>
              </div>

              {/* Rows */}
              {students.length === 0 ? (
                <EmptyState icon="users" title="No students in this section" message="There are no students enrolled for this semester and section." />
              ) : visibleStudents.length === 0 ? (
                <EmptyState
                  icon="search"
                  title="No students match"
                  message={query ? `Nothing found for “${query}”.` : "No students in this filter."}
                  action={<button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={() => { setQuery(""); setFilter("all"); }}>Clear filters</button>}
                />
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }} aria-label="Students">
                  {visibleStudents.map((student, idx) => {
                    const id = student.studentId;
                    const status = attendance[id];
                    const roll = student.rollNumber ?? student.registrationNumber ?? "—";
                    return (
                      <li
                        key={id || student._id}
                        ref={(el) => { if (el) rowRefs.current[id] = el; else delete rowRefs.current[id]; }}
                        tabIndex={0}
                        aria-label={`${student.name}, roll ${roll}, ${status === "present" ? "present" : "absent"}`}
                        onClick={() => toggle(id)}
                        onKeyDown={(e) => { if (e.target === e.currentTarget) onRowKeyDown(e, idx, id); }}
                        className={`ma-row ${status === "absent" ? "is-absent" : ""}`}
                      >
                        <span className="ma-row-idx hidden sm:inline">{idx + 1}</span>
                        <Avatar name={student.name} size={40} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ax-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{student.name}</div>
                          <div style={{ fontSize: 12, color: "var(--ax-muted)", fontVariantNumeric: "tabular-nums", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            Roll {roll}
                            {student.registrationNumber && student.rollNumber != null ? <span className="hidden sm:inline"> · {student.registrationNumber}</span> : null}
                          </div>
                        </div>
                        <StatusToggle value={status} name={student.name} onChange={(v) => setStatus(id, v)} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>

      {/* ── Confirm dialog ─────────────────────────────────────────────── */}
      {confirmOpen && (
        <div className="ma-backdrop" onClick={() => { if (!submitting) setConfirmOpen(false); }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
            className="ax-card ma-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--ax-gold-soft)", color: "#7a5c12", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="clipboard" size={20} />
              </span>
              <div style={{ minWidth: 0 }}>
                <h2 id="confirm-title" style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--ax-text)" }}>Submit attendance?</h2>
                <p id="confirm-desc" style={{ margin: "2px 0 0", fontSize: 13, color: "var(--ax-muted)" }}>
                  {classLabel} · Semester {semester}. This can't be changed after submitting.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2" style={{ marginBottom: 14 }}>
              {[
                ["Present", presentCount, "var(--ax-success)", "var(--ax-success-soft)"],
                ["Absent", absentCount, "var(--ax-danger)", "var(--ax-danger-soft)"],
                ["Rate", `${pct.toFixed(0)}%`, "var(--ax-text)", "var(--ax-surface-2)"],
              ].map(([label, val, fg, bg]) => (
                <div key={label} style={{ background: bg, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: fg, fontVariantNumeric: "tabular-nums" }}>{val}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: fg, opacity: 0.85 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ax-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                Absent students ({absentees.length})
              </div>
              {absentees.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--ax-success)", fontWeight: 600 }}>Full house — everyone is present.</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 140, overflowY: "auto" }}>
                  {absentees.map((s) => (
                    <span key={s.studentId} className="ax-badge ax-badge-danger">{s.name}{s.rollNumber != null ? ` · ${s.rollNumber}` : ""}</span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button type="button" className="ax-btn ax-btn-secondary" onClick={() => setConfirmOpen(false)} disabled={submitting}>
                Keep editing
              </button>
              <button ref={confirmBtnRef} type="button" className="ax-btn ax-btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? (<><span className="ax-spinner" aria-hidden="true" /> Saving…</>) : (<><Icon name="send" size={15} /> Confirm &amp; submit</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{PAGE_CSS}</style>
    </div>
  );
};

const PAGE_CSS = `
  .ma-sticky { position: sticky; top: calc(var(--ax-nav-h) + 10px); z-index: 20; box-shadow: var(--ax-shadow); backdrop-filter: saturate(1.4) blur(6px); background: rgba(255,255,255,.94); }
  @media (max-width: 640px) { .ma-submit { width: 100%; } }

  .ma-slot { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px; border-radius: 12px; border: 1px solid var(--ax-border); background: var(--ax-surface); font: inherit; cursor: pointer; text-align: left; transition: border-color .18s ease, box-shadow .18s ease, background .18s ease, transform .12s ease; }
  .ma-slot:hover { border-color: var(--ax-border-strong); box-shadow: var(--ax-shadow-sm); }
  .ma-slot:active { transform: scale(.99); }
  .ma-slot.is-active { border-color: var(--ax-gold); background: linear-gradient(90deg, var(--ax-gold-soft), var(--ax-surface)); box-shadow: 0 0 0 3px rgba(201,168,76,.18); }
  .ma-slot-period { width: 40px; height: 40px; flex-shrink: 0; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; background: var(--ax-navy); color: var(--ax-gold-2); }

  .ma-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--ax-border); border-left: 3px solid transparent; cursor: pointer; outline: none; transition: background .15s ease, border-color .15s ease; -webkit-tap-highlight-color: transparent; user-select: none; }
  .ma-row:last-child { border-bottom: none; }
  .ma-row:hover { background: #f8faff; }
  .ma-row:focus-visible { background: var(--ax-blue-soft); box-shadow: inset 0 0 0 2px var(--ax-blue); }
  .ma-row.is-absent { background: #fff7f7; border-left-color: var(--ax-danger); }
  .ma-row.is-absent:hover { background: #fff0f0; }
  .ma-row-idx { width: 22px; flex-shrink: 0; font-size: 12px; color: var(--ax-muted); text-align: right; font-variant-numeric: tabular-nums; }

  .ma-seg { display: inline-flex; flex-shrink: 0; padding: 3px; border-radius: 10px; background: var(--ax-surface-2); border: 1px solid var(--ax-border); }
  .ma-seg-btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px; border: 0; border-radius: 8px; background: transparent; color: var(--ax-muted); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transition: background .15s ease, color .15s ease, box-shadow .15s ease; }
  .ma-seg-btn:hover { color: var(--ax-text); }
  .ma-seg-btn.is-present { background: var(--ax-success); color: #fff; box-shadow: 0 2px 6px rgba(22,163,74,.3); }
  .ma-seg-btn.is-absent { background: var(--ax-danger); color: #fff; box-shadow: 0 2px 6px rgba(220,38,38,.3); }
  @media (max-width: 480px) {
    .ma-seg-btn { padding: 0 10px; }
    .ma-seg-btn span { display: none; }
    .ma-row { padding: 12px; gap: 10px; }
  }

  .ma-filter { display: inline-flex; padding: 3px; border-radius: 10px; background: var(--ax-surface-2); border: 1px solid var(--ax-border); max-width: 100%; overflow-x: auto; }
  .ma-filter button { height: 34px; padding: 0 12px; border: 0; border-radius: 8px; background: transparent; color: var(--ax-muted); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }
  .ma-filter button.is-on { background: var(--ax-surface); color: var(--ax-text); box-shadow: var(--ax-shadow-sm); }

  .ma-kbd { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 5px; margin: 0 2px; border-radius: 5px; border: 1px solid var(--ax-border-strong); border-bottom-width: 2px; background: var(--ax-surface); font: inherit; font-size: 11px; font-weight: 600; color: var(--ax-text-2); }

  .ma-backdrop { position: fixed; inset: 0; z-index: 90; background: rgba(11,21,48,.45); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; padding: 16px; animation: ma-fade .2s ease both; }
  .ma-dialog { width: min(520px, 100%); max-height: calc(100vh - 32px); overflow-y: auto; padding: 22px; box-shadow: var(--ax-shadow-lg); animation: ax-fade-up .3s var(--ax-ease) both; }
  @keyframes ma-fade { from { opacity: 0; } to { opacity: 1; } }

  .ma-pop { animation: ma-pop .5s var(--ax-ease) both; }
  @keyframes ma-pop { 0% { transform: scale(.6); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
`;

export default MarkAttendance;
