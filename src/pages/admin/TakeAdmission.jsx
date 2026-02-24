import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import studentService from "../../services/studentService";
import { SECTIONS, SEMESTERS } from "../../utils/constants";

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = { navy: "#0a1628", navyMid: "#102040", gold: "#c9a84c", goldL: "#e8c96a", white: "#ffffff", light: "#f4f6fa", border: "#dde3ef", mid: "#6b7280", red: "#dc2626", redBg: "#fee2e2" };

const Field = ({ label, required, children }) => (
    <div>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: C.navy, marginBottom: "7px" }}>
            {label} {required && <span style={{ color: C.red }}>*</span>}
        </label>
        {children}
    </div>
);

const inputSty = (focus) => ({
    width: "100%", padding: "12px 14px", borderRadius: "8px",
    border: `1.5px solid ${focus ? C.gold : C.border}`,
    fontSize: "14px", color: C.navy, background: C.white, outline: "none",
    boxSizing: "border-box", transition: "border-color 0.2s",
});

const TakeAdmission = () => {
    const navigate = useNavigate();
    const [focus, setFocus] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null); // holds result object
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        name: "",
        department: "Computer Science",
        parentEmail: "",
        parentPhone: "",
        semester: "",
        section: "",
    });

    const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); setSubmitting(true);

        try {
            // Step 1 — Create student record
            const createRes = await studentService.createStudent({
                name: form.name.trim(),
                department: form.department.trim(),
                parentEmail: form.parentEmail.trim(),
                parentPhone: form.parentPhone.trim(),
            });

            const student = createRes.data;

            // Step 2 — Assign to section
            const assignRes = await studentService.assignSection(
                student._id,
                Number(form.semester),
                form.section
            );

            setSuccess({
                name: student.name,
                registrationNumber: student.registrationNumber,
                section: form.section,
                semester: form.semester,
                rollNumber: assignRes.data?.rollNumber,
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Something went wrong.");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Success screen ──────────────────────────────────────────────────────────
    if (success) return (
        <div style={{ minHeight: "100vh", background: C.light, fontFamily: "'Segoe UI','Inter',Arial,sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "20px", padding: "52px 44px", textAlign: "center", maxWidth: "460px", width: "100%", boxShadow: "0 8px 40px rgba(10,22,40,0.12)" }}>
                {/* Gold accent */}
                <div style={{ width: "70px", height: "70px", background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`, borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                </div>
                <h2 style={{ fontSize: "24px", fontWeight: 900, color: C.navy, margin: "0 0 8px" }}>Admission Successful!</h2>
                <p style={{ color: C.mid, fontSize: "14px", marginBottom: "28px" }}>Student has been admitted and assigned to their section.</p>

                {/* Details card */}
                <div style={{ background: C.light, borderRadius: "12px", padding: "20px", textAlign: "left", marginBottom: "28px" }}>
                    {[
                        ["Student Name", success.name],
                        ["Registration No.", success.registrationNumber],
                        ["Semester", `Semester ${success.semester}`],
                        ["Section", success.section],
                        ["Roll Number", success.rollNumber ?? "—"],
                    ].map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: "14px" }}>
                            <span style={{ color: C.mid, fontWeight: 500 }}>{k}</span>
                            <span style={{ color: C.navy, fontWeight: 800, letterSpacing: k === "Registration No." ? "1.5px" : 0 }}>{v}</span>
                        </div>
                    ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button onClick={() => { setSuccess(null); setForm({ name: "", department: "Computer Science", parentEmail: "", parentPhone: "", semester: "", section: "" }); }}
                        style={{ padding: "13px", background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`, color: C.gold, border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "14px", cursor: "pointer" }}>
                        Admit Another Student →
                    </button>
                    <Link to="/admin/dashboard" style={{ padding: "12px", border: `1.5px solid ${C.border}`, borderRadius: "10px", color: C.navy, textDecoration: "none", fontWeight: 600, fontSize: "14px", display: "block" }}>
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );

    // ── Main form ───────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: "100vh", background: C.light, fontFamily: "'Segoe UI','Inter',Arial,sans-serif" }}>

            {/* Navy header */}
            <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`, paddingTop: "80px", paddingBottom: "40px", position: "relative" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: `linear-gradient(to right, ${C.gold}, ${C.goldL}, ${C.gold})` }} />
                <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 28px" }}>
                    <Link to="/admin/dashboard" style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", textDecoration: "none", marginBottom: "12px", display: "inline-block" }}>← Back to Dashboard</Link>
                    <div style={{ color: C.gold, fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>🎓 Admin — Take Admission</div>
                    <h1 style={{ color: C.white, fontSize: "clamp(22px,4vw,32px)", fontWeight: 900, margin: "0 0 6px" }}>Student Admission</h1>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>Fill in details below. A unique registration number will be auto-generated.</p>
                </div>
            </div>

            {/* Form body */}
            <div style={{ maxWidth: "760px", margin: "0 auto", padding: "32px 28px 48px" }}>

                {/* Error banner */}
                {error && (
                    <div style={{ background: C.redBg, border: `1px solid #fca5a5`, borderRadius: "10px", padding: "14px 18px", marginBottom: "20px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "18px" }}>⚠️</span>
                        <div style={{ color: C.red, fontSize: "13px", fontWeight: 600 }}>{error}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    {/* ── PERSONAL DETAILS ─────────────────────────────────── */}
                    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "28px 28px 20px", boxShadow: "0 2px 16px rgba(10,22,40,0.07)", marginBottom: "20px" }}>
                        <h2 style={{ fontWeight: 800, fontSize: "15px", color: C.navy, margin: "0 0 20px", display: "flex", alignItems: "center", gap: "8px" }}>👤 Personal Details</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
                            <Field label="Full Name" required>
                                <input type="text" placeholder="e.g. Arjun Sharma" required value={form.name}
                                    onChange={set("name")} onFocus={() => setFocus("name")} onBlur={() => setFocus("")}
                                    style={inputSty(focus === "name")} />
                            </Field>
                            <Field label="Department" required>
                                <input type="text" placeholder="e.g. Computer Science" required value={form.department}
                                    onChange={set("department")} onFocus={() => setFocus("dept")} onBlur={() => setFocus("")}
                                    style={inputSty(focus === "dept")} />
                            </Field>
                        </div>
                    </div>

                    {/* ── PARENT CONTACT ───────────────────────────────────── */}
                    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "28px 28px 20px", boxShadow: "0 2px 16px rgba(10,22,40,0.07)", marginBottom: "20px" }}>
                        <h2 style={{ fontWeight: 800, fontSize: "15px", color: C.navy, margin: "0 0 20px", display: "flex", alignItems: "center", gap: "8px" }}>👪 Parent / Guardian Contact</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
                            <Field label="Parent Email" required>
                                <input type="email" placeholder="parent@example.com" required value={form.parentEmail}
                                    onChange={set("parentEmail")} onFocus={() => setFocus("pe")} onBlur={() => setFocus("")}
                                    style={inputSty(focus === "pe")} />
                            </Field>
                            <Field label="Parent Phone" required>
                                <input type="tel" placeholder="9876543210" required minLength={10} value={form.parentPhone}
                                    onChange={set("parentPhone")} onFocus={() => setFocus("pp")} onBlur={() => setFocus("")}
                                    style={inputSty(focus === "pp")} />
                            </Field>
                        </div>
                    </div>

                    {/* ── SECTION ASSIGNMENT ───────────────────────────────── */}
                    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "28px 28px 20px", boxShadow: "0 2px 16px rgba(10,22,40,0.07)", marginBottom: "24px" }}>
                        <h2 style={{ fontWeight: 800, fontSize: "15px", color: C.navy, margin: "0 0 6px", display: "flex", alignItems: "center", gap: "8px" }}>🏫 Section Assignment</h2>
                        <p style={{ color: C.mid, fontSize: "13px", margin: "0 0 20px" }}>The system will auto-assign the next available roll number within the selected section (max 50 students).</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
                            <Field label="Semester" required>
                                <select required value={form.semester} onChange={set("semester")} onFocus={() => setFocus("sem")} onBlur={() => setFocus("")}
                                    style={{ ...inputSty(focus === "sem"), appearance: "none", cursor: "pointer" }}>
                                    <option value="">Select semester</option>
                                    {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                                </select>
                            </Field>
                            <Field label="Section" required>
                                <select required value={form.section} onChange={set("section")} onFocus={() => setFocus("sec")} onBlur={() => setFocus("")}
                                    style={{ ...inputSty(focus === "sec"), appearance: "none", cursor: "pointer" }}>
                                    <option value="">Select section</option>
                                    {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                                </select>
                            </Field>
                        </div>
                        {/* Capacity note */}
                        <div style={{ marginTop: "16px", padding: "12px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", fontSize: "12px", color: "#92400e", display: "flex", gap: "8px" }}>
                            💡 <span>Each section holds a maximum of <strong>50 students</strong>. If a section is full you will be notified.</span>
                        </div>
                    </div>

                    {/* Submit */}
                    <button type="submit" disabled={submitting}
                        style={{ width: "100%", padding: "16px", background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`, color: C.gold, border: "none", borderRadius: "12px", fontWeight: 900, fontSize: "16px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.75 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", boxShadow: "0 4px 20px rgba(10,22,40,0.2)", transition: "all 0.2s" }}>
                        {submitting ? (
                            <><span style={{ width: "18px", height: "18px", border: `2px solid rgba(201,168,76,0.3)`, borderTop: `2px solid ${C.gold}`, borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> Processing…</>
                        ) : "Admit Student & Assign Section →"}
                    </button>
                </form>
            </div>

            <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
        </div>
    );
};

export default TakeAdmission;
