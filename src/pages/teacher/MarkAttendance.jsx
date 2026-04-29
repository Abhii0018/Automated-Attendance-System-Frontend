import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import attendanceService from "../../services/attendanceService";
import { SECTIONS, SEMESTERS } from "../../utils/constants";

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = { navy: "#0a1628", navyMid: "#102040", gold: "#c9a84c", goldL: "#e8c96a", white: "#ffffff", light: "#f4f6fa", border: "#dde3ef", mid: "#6b7280" };
const PAGE_W = "min(96vw, 1240px)";

const MarkAttendance = () => {
  const [step, setStep] = useState(1);
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [periodNumber, setPeriodNumber] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [scheduleSlots, setScheduleSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [allowedSections, setAllowedSections] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [error, setError] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const todayFmt = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    const fetchAllowedSections = async () => {
      try {
        const res = await attendanceService.getTeacherOverview();
        const data = res.data || res;
        setAllowedSections(data.sections || []);
        const scheduleRes = await attendanceService.getTodayTeacherSchedule();
        setScheduleSlots(scheduleRes.data || []);
      } catch (err) {
        console.error("Failed to load assigned sections", err);
      }
    };
    fetchAllowedSections();
  }, []);

  const availableSemesters = [...new Set(allowedSections.map(s => s.semester))];
  const availableSections = [...new Set(allowedSections.filter(s => s.semester === Number(semester)).map(s => s.section))];
  const availableSubjects = allowedSections
    .filter((s) => s.semester === Number(semester) && s.section === section)
    .map((s) => s.subject);

  const handleLoadStudents = async (e) => {
    e.preventDefault();
    setError(""); setAlreadySubmitted(false);
    if (!semester || !section || !subject || !periodNumber) return;
    setLoadingStudents(true);
    try {
      const res = await attendanceService.getSectionStudents(semester, section, subject);
      const data = res.data || [];
      setStudents(data);
      const init = {};
      data.forEach(s => { init[s.studentId] = "present"; });
      setAttendance(init);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load students.");
    } finally {
      setLoadingStudents(false);
    }
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach(s => { updated[s.studentId] = status; });
    setAttendance(updated);
  };

  const toggle = (id) => setAttendance(prev => ({ ...prev, [id]: prev[id] === "present" ? "absent" : "present" }));

  const onSlotChange = (value) => {
    setSelectedSlot(value);
    const slot = scheduleSlots.find((s) => s._id === value);
    if (!slot) return;
    setSemester(String(slot.semester));
    setSection(slot.section);
    setSubject(slot.subject);
    setPeriodNumber(String(slot.periodNumber));
  };

  const handleSubmit = async () => {
    setSubmitting(true); setError(""); setAlreadySubmitted(false);
    try {
      const attendanceList = students.map(s => ({ studentId: s.studentId, status: attendance[s.studentId] === "present" ? "Present" : "Absent" }));
      await attendanceService.markAttendance({ semester: Number(semester), section, subject, periodNumber: Number(periodNumber), attendanceList });
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "";
      if (msg.toLowerCase().includes("already submitted")) setAlreadySubmitted(true);
      setError(msg || "Failed to submit attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => { setSuccess(false); setStep(1); setStudents([]); setAttendance({}); setSemester(""); setSection(""); setSubject(""); setPeriodNumber(""); setAlreadySubmitted(false); setError(""); };

  const presentCount = Object.values(attendance).filter(v => v === "present").length;
  const absentCount = Object.values(attendance).filter(v => v === "absent").length;

  const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: "8px", border: `1.5px solid ${C.border}`, fontSize: "14px", color: C.navy, background: C.white, outline: "none", boxSizing: "border-box", appearance: "none", transition: "border-color 0.2s", cursor: "pointer" };

  // ── Success screen
  if (success) return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 8% 10%, #c7d2fe 0%, #eaf1ff 30%, #e9eefc 64%, #eef2ff 100%)", fontFamily: "'Segoe UI','Inter',Arial,sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "20px", padding: "52px 44px", textAlign: "center", maxWidth: "420px", width: "100%", boxShadow: "0 8px 40px rgba(10,22,40,0.12)" }}>
        <div style={{ width: "72px", height: "72px", background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }} />
        <h2 style={{ fontSize: "26px", fontWeight: 900, color: C.navy, margin: "0 0 8px" }}>Attendance Submitted!</h2>
        <p style={{ color: C.mid, fontSize: "14px", margin: "0 0 4px" }}>Semester {semester} · Section {section} · {subject} · Period {periodNumber}</p>
        <p style={{ color: C.mid, fontSize: "13px", fontFamily: "monospace", marginBottom: "28px" }}>{todayStr}</p>

        <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginBottom: "32px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#16a34a" }}>{presentCount}</div>
            <div style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>Present</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#dc2626" }}>{absentCount}</div>
            <div style={{ fontSize: "12px", color: "#dc2626", fontWeight: 600 }}>Absent</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button onClick={handleReset} style={{ width: "100%", padding: "14px", background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`, color: C.gold, border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "14px", cursor: "pointer" }}>
            Mark Another Session →
          </button>
          <Link to="/teacher/dashboard" style={{ padding: "12px", border: `1.5px solid ${C.border}`, borderRadius: "10px", color: C.navy, textDecoration: "none", fontWeight: 600, fontSize: "14px", display: "block" }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 8% 10%, #c7d2fe 0%, #eaf1ff 30%, #e9eefc 64%, #eef2ff 100%)", fontFamily: "'Segoe UI','Inter',Arial,sans-serif" }}>

      {/* ── NAVY HEADER ─────────────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(120deg, ${C.navy} 0%, ${C.navyMid} 55%, #173465 100%)`, paddingTop: "88px", paddingBottom: "44px", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: `linear-gradient(to right, ${C.gold}, ${C.goldL}, ${C.gold})` }} />
        <div style={{ width: PAGE_W, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ color: C.gold, fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>Teacher Workspace</div>
          <h1 style={{ color: C.white, fontSize: "clamp(24px,4vw,34px)", fontWeight: 900, margin: "0 0 8px" }}>
            {step === 1 ? "Select Session" : `Semester ${semester} · Section ${section} · ${subject} · P${periodNumber}`}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>{todayFmt}</p>

          {/* Step breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "20px" }}>
            {["Session Setup", "Mark Students"].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, background: step > i ? C.gold : step === i + 1 ? C.gold : "rgba(255,255,255,0.2)", color: step > i || step === i + 1 ? C.navy : "rgba(255,255,255,0.5)" }}>{i + 1}</div>
                <span style={{ fontSize: "13px", color: step === i + 1 ? C.white : "rgba(255,255,255,0.4)", fontWeight: step === i + 1 ? 700 : 400 }}>{s}</span>
                {i === 0 && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>›</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div style={{ width: PAGE_W, margin: "0 auto", padding: "36px 24px 52px" }}>

        {/* STEP 1 — session config */}
        {step === 1 && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "36px", boxShadow: "0 2px 16px rgba(10,22,40,0.07)" }}>
            <h2 style={{ fontWeight: 800, fontSize: "18px", color: C.navy, margin: "0 0 6px" }}>Session Details</h2>
            <p style={{ color: C.mid, fontSize: "14px", margin: "0 0 28px" }}>Select the semester and section to fetch the student list.</p>

            <form onSubmit={handleLoadStudents}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: C.navy, marginBottom: "7px" }}>Today's Slot</label>
                  <select value={selectedSlot} onChange={e => onSlotChange(e.target.value)} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border}>
                    <option value="">Select scheduled slot</option>
                    {scheduleSlots.map((slot) => (
                      <option key={slot._id} value={slot._id}>
                        Sem {slot.semester} | {slot.section} | {slot.subject} | P{slot.periodNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: C.navy, marginBottom: "7px" }}>Semester <span style={{ color: "#dc2626" }}>*</span></label>
                  <select value={semester} onChange={e => setSemester(e.target.value)} required style={inputStyle}
                    onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border}>
                    <option value="">Select semester</option>
                    {availableSemesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: C.navy, marginBottom: "7px" }}>Section <span style={{ color: "#dc2626" }}>*</span></label>
                  <select value={section} onChange={e => setSection(e.target.value)} required style={inputStyle}
                    onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border}>
                    <option value="">Select section</option>
                    {availableSections.map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: C.navy, marginBottom: "7px" }}>Subject <span style={{ color: "#dc2626" }}>*</span></label>
                  <select value={subject} onChange={e => setSubject(e.target.value)} required style={inputStyle}
                    onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border}>
                    <option value="">Select subject</option>
                    {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: C.navy, marginBottom: "7px" }}>Period <span style={{ color: "#dc2626" }}>*</span></label>
                  <select value={periodNumber} onChange={e => setPeriodNumber(e.target.value)} required style={inputStyle}
                    onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border}>
                    <option value="">Select period</option>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(p => <option key={p} value={p}>Period {p}</option>)}
                  </select>
                </div>
              </div>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", color: "#b91c1c", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center" }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loadingStudents || !semester || !section || !subject || !periodNumber} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "14px 32px", background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`, color: C.gold, border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "15px", cursor: loadingStudents ? "not-allowed" : "pointer", opacity: (!semester || !section || !subject || !periodNumber) ? 0.6 : 1, transition: "all 0.2s" }}>
                {loadingStudents ? (<><span style={{ width: "16px", height: "16px", border: "2px solid rgba(201,168,76,0.3)", borderTop: `2px solid ${C.gold}`, borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> Loading Students…</>) : "Load Students →"}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2 — mark students */}
        {step === 2 && (
          <>
            {/* Session info bar */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "14px 20px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(10,22,40,0.05)" }}>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {[`Semester ${semester}`, `Section ${section}`, subject, `Period ${periodNumber}`, todayStr].map(t => (
                  <span key={t} style={{ background: C.light, border: `1px solid ${C.border}`, color: C.navy, padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, fontFamily: "monospace" }}>{t}</span>
                ))}
              </div>
              <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: C.mid, fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>← Change</button>
            </div>

            {/* Bulk actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", color: C.mid, fontWeight: 600 }}>Mark all:</span>
              <button onClick={() => markAll("present")} style={{ padding: "7px 16px", borderRadius: "8px", border: "1.5px solid #16a34a", background: "#dcfce7", color: "#166534", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Present</button>
              <button onClick={() => markAll("absent")} style={{ padding: "7px 16px", borderRadius: "8px", border: "1.5px solid #dc2626", background: "#fee2e2", color: "#991b1b", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Absent</button>
            </div>

            {/* Student table */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden", marginBottom: "20px", boxShadow: "0 2px 16px rgba(10,22,40,0.07)" }}>
              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 160px", padding: "12px 20px", background: C.light, borderBottom: `2px solid ${C.border}` }}>
                {["#", "Name", "Roll Number", "Attendance"].map(h => (
                  <div key={h} style={{ fontSize: "11px", fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: "0.8px" }}>{h}</div>
                ))}
              </div>

              <div>
                {students.map((student, idx) => {
                  const isPresent = attendance[student.studentId] === "present";
                  return (
                    <div key={student.studentId || student._id}
                      style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 160px", padding: "14px 20px", borderBottom: `1px solid ${C.light}`, alignItems: "center", transition: "background 0.15s", cursor: "default" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8faff"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ fontSize: "13px", color: C.mid, fontFamily: "monospace" }}>{idx + 1}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "36px", height: "36px", background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`, borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", color: C.gold, fontWeight: 900, fontSize: "14px" }}>
                          {student.name?.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: "14px", color: C.navy }}>{student.name}</span>
                      </div>
                      <div style={{ fontSize: "13px", color: C.mid, fontFamily: "monospace" }}>
                        {student.registrationNumber ?? student.rollNumber ?? "—"}
                      </div>
                      <div>
                        <button onClick={() => toggle(student.studentId)} style={{
                          display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "13px", transition: "all 0.2s",
                          background: isPresent ? "#dcfce7" : "#fee2e2",
                          color: isPresent ? "#166534" : "#991b1b",
                        }}>
                          {isPresent ? "Present" : "Absent"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit bar */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 12px rgba(10,22,40,0.07)" }}>
              <div style={{ display: "flex", gap: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                  <span style={{ fontSize: "13px", color: C.mid }}>Present: <strong style={{ color: C.navy }}>{presentCount}</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#dc2626", display: "inline-block" }} />
                  <span style={{ fontSize: "13px", color: C.mid }}>Absent: <strong style={{ color: C.navy }}>{absentCount}</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: C.gold, display: "inline-block" }} />
                  <span style={{ fontSize: "13px", color: C.mid }}>Total: <strong style={{ color: C.navy }}>{students.length}</strong></span>
                </div>
              </div>
              <button onClick={handleSubmit} disabled={submitting || alreadySubmitted} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "13px 28px", background: alreadySubmitted ? C.light : `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`, color: alreadySubmitted ? C.mid : C.gold, border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "14px", cursor: (submitting || alreadySubmitted) ? "not-allowed" : "pointer", opacity: alreadySubmitted ? 0.7 : 1, transition: "all 0.2s" }}>
                {submitting ? (<><span style={{ width: "16px", height: "16px", border: `2px solid rgba(201,168,76,0.3)`, borderTop: `2px solid ${C.gold}`, borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> Saving…</>) : alreadySubmitted ? "Already Submitted Today" : "Submit Attendance"}
              </button>
            </div>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "12px 16px", marginTop: "12px", color: "#b91c1c", fontSize: "13px", display: "flex", gap: "8px" }}>
                {error}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default MarkAttendance;