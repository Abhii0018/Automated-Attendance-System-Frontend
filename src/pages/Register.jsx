import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { SECTIONS } from "../utils/constants";
import loginBg from "../assets/login.jpeg";

// ─── Theme (matches Landing page) ────────────────────────────────────────────
const navy = "#0a1628";
const navyMid = "#102040";
const gold = "#c9a84c";
const goldL = "#e8c96a";
const light = "#f4f6fa";
const border = "#dde3ef";
const mid = "#6b7280";

// ─── Responsive CSS ───────────────────────────────────────────────────────────
const RESP_CSS = `
  .auth-split { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }
  @media (max-width: 768px) {
    .auth-split { grid-template-columns: 1fr !important; }
    .auth-img-panel { display: none !important; }
    .auth-form-panel { padding: 40px 24px !important; }
  }
`;

const Register = () => {
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "student", section: "",
  });
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  // Inject responsive CSS
  useEffect(() => {
    const id = "auth-resp-css";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id; el.textContent = RESP_CSS;
      document.head.appendChild(el);
    }
    return () => document.getElementById(id)?.remove();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!/[A-Z]/.test(form.password)) { setError("Password must contain at least one uppercase letter."); return; }
    if (form.role === "student" && !form.section) { setError("Please select a section."); return; }

    try {
      const payload = { ...form };
      if (form.role !== "student") delete payload.section;
      await register(payload);
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.map(e => e.msg).join(", "));
      } else {
        setError(err.response?.data?.message || err.message || "Registration failed.");
      }
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: "8px",
    border: `1.5px solid ${border}`, fontSize: "14px", color: navy,
    background: "#fff", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
  };

  return (
    <div className="auth-split" style={{ fontFamily: "'Segoe UI','Inter',Arial,sans-serif" }}>

      {/* ── LEFT: Image Panel ── */}
      <div className="auth-img-panel" style={{ position: "relative", overflow: "hidden" }}>
        <img src={loginBg} alt="University campus" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
        {/* Dark overlay */}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${navy}ee 0%, rgba(10,22,40,0.55) 100%)` }} />
        {/* Gold accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: `linear-gradient(to right, ${gold}, ${goldL}, ${gold})` }} />

        {/* Branding */}
        <div style={{ position: "absolute", top: "40px", left: "40px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "44px", height: "44px", background: gold, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>🎓</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: "18px" }}>AttendX</div>
            <div style={{ color: gold, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase" }}>University Portal</div>
          </div>
        </div>

        {/* Bottom content */}
        <div style={{ position: "absolute", bottom: "48px", left: "40px", right: "40px" }}>
          <div style={{ width: "48px", height: "3px", background: gold, borderRadius: "2px", marginBottom: "20px" }} />
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "22px", fontWeight: 700, lineHeight: 1.4, margin: "0 0 12px" }}>
            Join thousands of students taking control of their academics.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: 1.7 }}>
            Real-time attendance tracking, smart alerts and detailed analytics — all in one portal.
          </p>

          {/* Highlights */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "28px" }}>
            {["✓  Track your attendance in real-time", "✓  Receive automatic low-attendance alerts", "✓  Subject-wise breakdowns at a glance"].map((t) => (
              <div key={t} style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>{t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form Panel ── */}
      <div className="auth-form-panel" style={{ background: light, display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 56px", overflowY: "auto" }}>

        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
          <div style={{ width: "40px", height: "40px", background: gold, borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🎓</div>
          <div>
            <div style={{ color: navy, fontWeight: 900, fontSize: "16px" }}>AttendX</div>
            <div style={{ color: gold, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase" }}>University Portal</div>
          </div>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 900, color: navy, margin: "0 0 6px" }}>Create Your Account</h1>
        <p style={{ color: mid, fontSize: "14px", margin: "0 0 28px" }}>Join the AttendX portal today</p>

        {/* Error */}
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "16px" }}>⚠️</span>
            <span style={{ color: "#991b1b", fontSize: "14px" }}>{error}</span>
          </div>
        )}

        {/* Form Card */}
        <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 30px rgba(10,22,40,0.08)", border: `1px solid ${border}` }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Honeypot to stop Chrome password breach warnings */}
            <input type="text" style={{display: "none"}} autoComplete="username" />
            <input type="password" style={{display: "none"}} autoComplete="new-password" />

            {/* Name */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Full Name</label>
              <input type="text" required placeholder="John Doe" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = gold}
                onBlur={e => e.target.style.borderColor = border}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Email Address</label>
              <input type="email" required autoComplete="off" placeholder="you@university.edu" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = gold}
                onBlur={e => e.target.style.borderColor = border}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} required autoComplete="new-password" placeholder="Min. 8 chars, 1 uppercase" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  onFocus={e => e.target.style.borderColor = gold}
                  onBlur={e => e.target.style.borderColor = border}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: mid, fontSize: "16px" }}>
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
              <p style={{ color: mid, fontSize: "11px", marginTop: "5px", margin: "5px 0 0" }}>At least 8 characters including one uppercase letter</p>
            </div>

            {/* Role + Section row */}
            <div style={{ display: "grid", gridTemplateColumns: form.role === "student" ? "1fr 1fr" : "1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value, section: "" })}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {form.role === "student" && (
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Section</label>
                  <select value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} required
                    style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                    <option value="">Select section</option>
                    {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "14px", background: loading ? "#c9a84c99" : `linear-gradient(135deg, ${navy} 0%, ${navyMid} 100%)`, color: "#fff", border: "none", borderRadius: "9px", fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {loading ? (
                <><span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />Creating Account…</>
              ) : "Create Account →"}
            </button>
          </form>

          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: `1px solid ${border}`, textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: mid }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: navy, fontWeight: 700, textDecoration: "none", borderBottom: `2px solid ${gold}`, paddingBottom: "1px" }}>Sign In →</Link>
            </p>
          </div>
        </div>

        {/* Back */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <Link to="/" style={{ color: mid, fontSize: "13px", textDecoration: "none" }}>← Back to Homepage</Link>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Register;