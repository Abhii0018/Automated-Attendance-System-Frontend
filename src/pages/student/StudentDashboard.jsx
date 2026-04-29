import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import useAuth from "../../hooks/useAuth";
import attendanceService from "../../services/attendanceService";
import { ATTENDANCE_THRESHOLD } from "../../utils/constants";

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = { navy: "#0a1628", navyMid: "#102040", gold: "#c9a84c", white: "#ffffff", light: "#f4f6fa", border: "#dde3ef", mid: "#6b7280" };
const PAGE_W = "min(96vw, 1480px)";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [subjectStats, setSubjectStats] = useState([]);
  const [overallPct, setOverallPct] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectStatusFilter, setSubjectStatusFilter] = useState("all");
  const circleRef = useRef(null);
  const pageRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await attendanceService.getMyAttendance();
        const payload = res.data || {};
        setRecords(payload.records || []);
        setSubjectStats(payload.subjectStats || []);
        setOverallPct(payload.overallPercentage || 0);
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

  useEffect(() => {
    if (!loading && pageRef.current) {
      gsap.fromTo(
        ".sd-anim",
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.55, ease: "power3.out" }
      );
    }
  }, [loading]);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const isLow = overallPct < ATTENDANCE_THRESHOLD;
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const dashArr = (overallPct / 100) * circ;
  const firstName = user?.name?.split(" ")[0] || "Student";

  const present = records.filter(r => r.status?.toLowerCase() === "present").length;
  const absent = records.filter(r => r.status?.toLowerCase() === "absent").length;
  const selectedSubjectStat = subjectStats.find(
    (s) => String(s.subject || "").toLowerCase() === String(selectedSubject || "").toLowerCase()
  );
  const selectedSubjectRecords = selectedSubject
    ? records.filter((r) => String(r.subject || "").toLowerCase() === String(selectedSubject).toLowerCase())
    : [];
  const filteredSubjectRecords = selectedSubjectRecords.filter((r) => {
    if (subjectStatusFilter === "all") return true;
    return String(r.status || "").toLowerCase() === subjectStatusFilter;
  });

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 8% 10%, #c7d2fe 0%, #eaf1ff 30%, #e9eefc 64%, #eef2ff 100%)", fontFamily: "'Segoe UI','Inter',Arial,sans-serif" }}>

      {/* ── NAVY HEADER ─────────────────────────────────────────────────── */}
      <div className="sd-anim" style={{ background: "linear-gradient(135deg, #f8fbff 0%, #eef4ff 55%, #e8f0ff 100%)", paddingTop: "80px", paddingBottom: "44px", position: "relative", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: `linear-gradient(to right, ${C.gold}, #e8c96a, ${C.gold})` }} />
        <div style={{ width: PAGE_W, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ color: "#1d4ed8", fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>Student Dashboard</div>
            <h1 style={{ color: C.navy, fontSize: "clamp(30px,4vw,44px)", fontWeight: 900, margin: "0 0 8px" }}>
              Hey, <span style={{ color: C.gold }}>{firstName}</span>!
            </h1>
            <p style={{ color: C.mid, fontSize: "16px", margin: 0 }}>{today}</p>
          </div>
          <Link to="/student/profile" style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: "12px", padding: "12px 20px", textDecoration: "none", boxShadow: "0 10px 24px rgba(10,22,40,0.08)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
            <div style={{ width: "40px", height: "40px", background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: C.gold, fontSize: "16px" }}>
              {firstName.charAt(0)}
            </div>
            <div>
              <div style={{ color: C.navy, fontWeight: 700, fontSize: "14px" }}>{user?.name}</div>
              <div style={{ color: "#1d4ed8", fontSize: "11px", fontWeight: 600 }}>View Profile →</div>
            </div>
          </Link>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div ref={pageRef} style={{ width: PAGE_W, margin: "0 auto", padding: "36px 24px 52px" }}>

        {/* Low attendance warning */}
        {!loading && isLow && (
          <div className="sd-anim" style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "12px", padding: "14px 20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ width: "22px", height: "22px", borderRadius: "7px", background: "#fee2e2", border: "1px solid #fecaca", color: "#b91c1c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>!</span>
            <div>
              <div style={{ fontWeight: 700, color: "#b91c1c", fontSize: "14px" }}>Low Attendance Warning</div>
              <div style={{ color: "#dc2626", fontSize: "13px", marginTop: "2px" }}>
                Your attendance is <strong>{overallPct}%</strong> — below the required {ATTENDANCE_THRESHOLD}%. You may be barred from exams.
              </div>
            </div>
          </div>
        )}
        {!loading && error && (
          <div className="sd-anim" style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "12px", padding: "14px 20px", marginBottom: "24px", color: "#b91c1c", fontSize: "14px" }}>
            {error}
          </div>
        )}

        {/* TOP ROW — gauge + subjects */}
        <div className="sd-anim sd-main-grid" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px", marginBottom: "24px" }}>

          {/* Circular gauge */}
          <div className="sd-hover-card" style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: "16px", padding: "32px 24px", boxShadow: "0 12px 28px rgba(10,22,40,0.1)", display: "flex", flexDirection: "column", alignItems: "center", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
            <div style={{ color: C.mid, fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "20px" }}>Overall Attendance</div>
            <div style={{ position: "relative", width: "140px", height: "140px" }}>
              <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="70" cy="70" r={radius} fill="none" stroke={C.light} strokeWidth="10" />
                <circle cx="70" cy="70" r={radius} fill="none"
                  stroke={isLow ? "#ef4444" : C.gold} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${dashArr} ${circ}`}
                  style={{ transition: "stroke-dasharray 1.4s ease" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span ref={circleRef} style={{ fontSize: "26px", fontWeight: 900, color: isLow ? "#ef4444" : C.navy }}>{overallPct}%</span>
              </div>
            </div>
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: "14px", color: isLow ? "#ef4444" : "#16a34a" }}>
                {isLow ? "Below Threshold" : "Good Standing"}
              </div>
              <div style={{ color: C.mid, fontSize: "12px", marginTop: "4px" }}>Required: {ATTENDANCE_THRESHOLD}%</div>
            </div>
          </div>

          {/* Subject stats */}
          <div className="sd-hover-card" style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: "16px", padding: "28px", boxShadow: "0 12px 28px rgba(10,22,40,0.1)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
            <h2 style={{ fontWeight: 800, fontSize: "16px", color: C.navy, margin: "0 0 20px", display: "flex", alignItems: "center", gap: "8px" }}>Subject Summary</h2>
            {loading ? <div style={{ color: C.mid }}>Loading…</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {subjectStats.map((s, i) => (
                  <div key={i} className="sd-subject-row">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: C.navy }}>{s.subject}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "12px", color: C.mid }}>{s.present}/{s.total}</span>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: s.percentage >= 75 ? "#16a34a" : "#dc2626" }}>{s.percentage}%</span>
                      </div>
                    </div>
                    <div style={{ height: "7px", background: C.light, borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${s.percentage}%`, background: s.percentage >= 75 ? C.gold : "#ef4444", borderRadius: "4px", transition: `width 0.8s ease ${i * 0.1}s` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && subjectStats.length === 0 && (
              <div style={{ color: C.mid, fontSize: "13px" }}>No subject attendance data yet.</div>
            )}
          </div>
        </div>

        {/* QUICK STAT CARDS */}
        <div className="sd-anim sd-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "18px", marginBottom: "24px" }}>
          {[
            { icon: "P", label: "Classes Attended", value: present, color: "#16a34a", bg: "#dcfce7", badge: `${present} done` },
            { icon: "A", label: "Classes Missed", value: absent, color: "#dc2626", bg: "#fee2e2", badge: `${absent} missed` },
            { icon: "O", label: "Overall Attendance", value: `${overallPct}%`, color: isLow ? "#dc2626" : C.navy, bg: isLow ? "#fee2e2" : C.light, badge: `${records.length} total` },
          ].map((s, i) => (
            <div key={i} className="sd-hover-card" style={{ background: s.bg, borderRadius: "14px", padding: "22px", textAlign: "center", border: `1px solid ${C.border}`, boxShadow: "0 8px 18px rgba(10,22,40,0.06)", position: "relative" }}>
              <span style={{ position: "absolute", top: "10px", right: "10px", padding: "2px 8px", borderRadius: "999px", background: "#fee2e2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: "10px", fontWeight: 800 }}>
                {loading ? "..." : s.badge}
              </span>
              <div style={{ width: "32px", height: "32px", margin: "0 auto 8px", borderRadius: "8px", background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`, color: C.gold, fontSize: "13px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: s.color, lineHeight: 1 }}>{loading ? "…" : s.value}</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: C.navy, marginTop: "6px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* SUBJECT-WISE DETAIL */}
        <div className="sd-anim sd-hover-card" style={{ background: "rgba(255,255,255,0.86)", border: "1px solid rgba(255,255,255,0.7)", borderRadius: "16px", padding: "24px", boxShadow: "0 12px 28px rgba(10,22,40,0.1)", marginBottom: "24px", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
            <h2 style={{ fontWeight: 800, fontSize: "18px", color: C.navy, margin: 0 }}>Subject-wise Attendance</h2>
            <select
              value={selectedSubject}
              onChange={(e) => { setSelectedSubject(e.target.value); setSubjectStatusFilter("all"); }}
              style={{ minWidth: "220px", padding: "10px 12px", borderRadius: "10px", border: `1px solid ${C.border}`, fontSize: "14px", color: C.navy, background: "#fff", outline: "none" }}
            >
              <option value="">Select subject</option>
              {subjectStats.map((s) => (
                <option key={s.subject} value={s.subject}>{s.subject}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
            {subjectStats.map((s) => {
              const active = selectedSubject === s.subject;
              return (
                <button
                  key={s.subject}
                  type="button"
                  onClick={() => { setSelectedSubject(s.subject); setSubjectStatusFilter("all"); }}
                  style={{
                    border: `1px solid ${active ? "#2563eb" : C.border}`,
                    background: active ? "#dbeafe" : "#fff",
                    color: active ? "#1e3a8a" : C.navy,
                    padding: "6px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all .2s",
                  }}
                >
                  {s.subject}
                </button>
              );
            })}
          </div>

          {!selectedSubject ? (
            <p style={{ margin: 0, fontSize: "13px", color: C.mid }}>Choose any subject to view its detailed attendance.</p>
          ) : !selectedSubjectStat ? (
            <p style={{ margin: 0, fontSize: "13px", color: C.mid }}>No attendance data found for this subject.</p>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "12px", marginBottom: "14px" }}>
                <div style={{ background: "#eef2ff", borderRadius: "10px", padding: "12px" }}>
                  <div style={{ fontSize: "12px", color: C.mid }}>Subject</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: C.navy }}>{selectedSubjectStat.subject}</div>
                </div>
                <div style={{ background: "#ecfdf5", borderRadius: "10px", padding: "12px" }}>
                  <div style={{ fontSize: "12px", color: "#166534" }}>Present</div>
                  <div style={{ fontSize: "20px", fontWeight: 900, color: "#166534" }}>{selectedSubjectStat.present}</div>
                </div>
                <div style={{ background: "#fee2e2", borderRadius: "10px", padding: "12px" }}>
                  <div style={{ fontSize: "12px", color: "#991b1b" }}>Absent</div>
                  <div style={{ fontSize: "20px", fontWeight: 900, color: "#991b1b" }}>{Math.max(selectedSubjectStat.total - selectedSubjectStat.present, 0)}</div>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px" }}>
                  <div style={{ fontSize: "12px", color: C.mid }}>Percentage</div>
                  <div style={{ fontSize: "20px", fontWeight: 900, color: selectedSubjectStat.percentage >= ATTENDANCE_THRESHOLD ? "#166534" : "#991b1b" }}>
                    {selectedSubjectStat.percentage}%
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: C.mid, marginBottom: "6px" }}>
                  <span>Subject Progress</span>
                  <span style={{ fontWeight: 700, color: C.navy }}>{selectedSubjectStat.percentage}%</span>
                </div>
                <div style={{ height: "8px", borderRadius: "999px", background: "#e2e8f0", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${selectedSubjectStat.percentage}%`, transition: "width .5s ease", background: selectedSubjectStat.percentage >= ATTENDANCE_THRESHOLD ? "#16a34a" : "#dc2626" }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                {[
                  { key: "all", label: `All (${selectedSubjectRecords.length})` },
                  { key: "present", label: "Present" },
                  { key: "absent", label: "Absent" },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setSubjectStatusFilter(f.key)}
                    style={{
                      border: `1px solid ${subjectStatusFilter === f.key ? "#2563eb" : C.border}`,
                      background: subjectStatusFilter === f.key ? "#eff6ff" : "#fff",
                      color: subjectStatusFilter === f.key ? "#1e40af" : C.navy,
                      padding: "5px 10px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: "12px", color: C.mid }}>
                Records in selected subject: <strong>{filteredSubjectRecords.length}</strong>
              </div>

              <div style={{ marginTop: "10px", maxHeight: "180px", overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: "10px", background: "#fff" }}>
                {filteredSubjectRecords.length === 0 ? (
                  <div style={{ padding: "12px", fontSize: "12px", color: C.mid }}>No records in this filter.</div>
                ) : (
                  filteredSubjectRecords.slice(0, 20).map((r) => {
                    const presentStatus = String(r.status || "").toLowerCase() === "present";
                    return (
                      <div key={r._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: `1px solid ${C.light}` }}>
                        <span style={{ fontSize: "12px", color: C.navy }}>
                          {new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 700, borderRadius: "999px", padding: "3px 8px", background: presentStatus ? "#dcfce7" : "#fee2e2", color: presentStatus ? "#166534" : "#991b1b" }}>
                          {r.status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* RECENT ATTENDANCE TABLE */}
        <div className="sd-anim sd-hover-card" style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 12px 28px rgba(10,22,40,0.1)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
          <div style={{ padding: "22px 28px", borderBottom: `1px solid ${C.border}` }}>
            <h2 style={{ fontWeight: 800, fontSize: "16px", color: C.navy, margin: 0 }}>Recent Attendance Records</h2>
          </div>
          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: C.mid }}>Loading…</div>
          ) : records.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.light}` }}>
                    {["Date", "Subject", "Status"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "11px 20px", fontSize: "11px", fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: "0.8px", background: C.light }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 10).map(r => {
                    const isPresent = r.status?.toLowerCase() === "present";
                    return (
                      <tr key={r._id} style={{ borderBottom: `1px solid ${C.light}` }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f8faff"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "12px 20px", fontSize: "13px", color: C.mid, fontFamily: "monospace" }}>
                          {new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td style={{ padding: "12px 20px", fontSize: "13px", fontWeight: 600, color: C.navy }}>{r.subject}</td>
                        <td style={{ padding: "12px 20px" }}>
                          <span style={{
                            padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 700,
                            background: isPresent ? "#dcfce7" : "#fee2e2",
                            color: isPresent ? "#166534" : "#991b1b"
                          }}>{r.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px", color: C.mid }}>
              <div style={{ width: "42px", height: "42px", margin: "0 auto 12px", borderRadius: "11px", background: "#eef2ff", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "11px" }}>N/A</div>
              <p style={{ fontWeight: 600 }}>No attendance records yet.</p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .sd-hover-card { transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
        .sd-hover-card:hover { transform: translateY(-4px); box-shadow: 0 20px 36px rgba(10,22,40,.16); border-color: #93c5fd; }
        .sd-subject-row { transition: transform .2s ease; }
        .sd-subject-row:hover { transform: translateX(2px); }
        @media (max-width: 1080px) {
          .sd-main-grid { grid-template-columns: 1fr !important; }
          .sd-stat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;