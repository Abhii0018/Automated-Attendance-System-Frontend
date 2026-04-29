import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import authService from "../services/authService";
import loginBg from "../assets/login.jpeg";

// ─── Theme (matches Landing page) ────────────────────────────────────────────
const navy = "#0a1628";
const navyMid = "#102040";
const gold = "#c9a84c";
const goldL = "#e8c96a";
const border = "#dde3ef";
const mid = "#6b7280";
const cobalt = "#2563eb";

// ─── Responsive CSS ───────────────────────────────────────────────────────────
const RESP_CSS = `
  .auth-split { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }
  .auth-fade-up { animation: authFadeUp 0.55s ease both; }
  .auth-fade-up-delay { animation: authFadeUp 0.75s ease both; }
  .auth-float-in { animation: authFloatIn 0.8s ease both; }
  .auth-soft-pulse { animation: authSoftPulse 3.2s ease-in-out infinite; }
  .auth-glass { backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
  .auth-alert-sticky { position: sticky; top: 12px; z-index: 3; }
  .auth-left-copy { top: 150px; bottom: auto; }
  .auth-gradient-orb { position: absolute; border-radius: 999px; filter: blur(60px); pointer-events: none; }
  @keyframes authFadeUp { from { opacity: 0; transform: translateY(18px);} to { opacity: 1; transform: translateY(0);} }
  @keyframes authFloatIn { from { opacity: 0; transform: translateY(24px) scale(0.98);} to { opacity: 1; transform: translateY(0) scale(1);} }
  @keyframes authSoftPulse { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-3px);} }
  @media (max-width: 768px) {
    .auth-split { grid-template-columns: 1fr !important; }
    .auth-img-panel { display: none !important; }
    .auth-form-panel { padding: 20px 18px 24px !important; }
  }
  @media (max-height: 820px) {
    .auth-left-copy { top: 120px !important; }
  }
  @media (min-width: 1500px) {
    .auth-form-panel { padding: 28px 90px 34px !important; }
  }
`;

const Register = () => {
  const SUPER_ADMIN_EMAIL = "abhisheksah018@gmail.com";
  const SUPER_ADMIN_NAME = "Abhishek Kumar";
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    age: "",
    gender: "",
    parentName: "",
    parentRelation: "",
    parentEmail: "",
    parentPhone: "",
    primarySubject: "",
    secondarySubject: "",
    yearsOfExperience: 0,
    highestQualification: "",
    educationalBackground: "",
    hasExperience: false,
    phone: "",
    department: "",
    designation: "",
    adminAccessReason: "",
  });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [superAdminOtp, setSuperAdminOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerifyLoading, setOtpVerifyLoading] = useState(false);
  const { register, login, loading } = useAuth();
  const navigate = useNavigate();
  const isSuperAdminFlow = form.role === "superadmin";

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
    setInfo("");

    if (isSuperAdminFlow) {
      if (form.email.trim().toLowerCase() !== SUPER_ADMIN_EMAIL) {
        setError("Only configured Super Admin email is allowed.");
        return;
      }
      if (!otpVerified) {
        setError("Verify OTP before entering password.");
        return;
      }
      if (!form.password) {
        setError("Password is required.");
        return;
      }
      try {
        const data = await login(form.email, form.password);
        navigate(`/admin/dashboard`, { replace: true, state: { role: data?.user?.role } });
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Super Admin login failed.");
      }
      return;
    }

    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!/[A-Z]/.test(form.password)) { setError("Password must contain at least one uppercase letter."); return; }
    if (form.role === "student") {
      if (!form.age || Number(form.age) < 3 || Number(form.age) > 120) { setError("Enter a valid student age."); return; }
      if (!form.gender) { setError("Please select gender."); return; }
      if (!form.parentName.trim()) { setError("Parent name is required."); return; }
      if (!form.parentRelation.trim()) { setError("Parent relation is required."); return; }
      if (!form.parentEmail.trim()) { setError("Parent email is required."); return; }
      if (!form.parentPhone.trim()) { setError("Parent phone is required."); return; }
    }
    if (form.role === "teacher" && !form.primarySubject.trim()) { setError("Primary subject is required for teacher."); return; }
    if (form.role === "teacher" && !form.highestQualification.trim()) { setError("Highest qualification is required for teacher."); return; }
    if (form.role === "admin") {
      if (!form.phone.trim()) { setError("Phone is required for admin request."); return; }
      if (!form.department.trim()) { setError("Department is required for admin request."); return; }
      if (!form.designation.trim()) { setError("Designation is required for admin request."); return; }
      if (!form.adminAccessReason.trim()) { setError("Reason is required for admin request."); return; }
    }
    try {
      const payload = { ...form };
      if (form.role !== "teacher") {
        delete payload.primarySubject;
        delete payload.secondarySubject;
        delete payload.yearsOfExperience;
        delete payload.highestQualification;
        delete payload.educationalBackground;
        delete payload.hasExperience;
      }
      if (form.role !== "admin") {
        delete payload.phone;
        delete payload.department;
        delete payload.designation;
        delete payload.adminAccessReason;
      }
      if (form.role !== "student") {
        delete payload.age;
        delete payload.gender;
        delete payload.parentName;
        delete payload.parentRelation;
        delete payload.parentEmail;
        delete payload.parentPhone;
      }
      await register(payload);
      navigate("/verify-email", { replace: true, state: { email: form.email } });
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.map(e => e.msg).join(", "));
      } else {
        setError(err.response?.data?.message || err.message || "Registration failed.");
      }
    }
  };

  const handleRoleChange = (role) => {
    setError("");
    setInfo("");
    setOtpSent(false);
    setOtpVerified(false);
    setSuperAdminOtp("");
    if (role === "superadmin") {
      setForm((prev) => ({
        ...prev,
        role,
        name: SUPER_ADMIN_NAME,
        email: "",
        password: "",
      }));
      return;
    }
    setForm((prev) => ({ ...prev, role }));
  };

  const handleSendSuperAdminOtp = async () => {
    setError("");
    setInfo("");
    setOtpLoading(true);
    try {
      const response = await authService.sendSuperAdminLoginOtp(form.email);
      setInfo(response.message || "OTP sent to email.");
      setOtpSent(true);
      setOtpVerified(false);
      setForm((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to send OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifySuperAdminOtp = async () => {
    setError("");
    setInfo("");
    setOtpVerifyLoading(true);
    try {
      const response = await authService.verifySuperAdminLoginOtp(form.email, superAdminOtp);
      setInfo(response.message || "OTP verified.");
      setOtpVerified(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to verify OTP.");
    } finally {
      setOtpVerifyLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "15px 16px", borderRadius: "12px",
    border: `1.5px solid ${border}`, fontSize: "16px", color: navy,
    background: "rgba(255,255,255,0.95)", outline: "none", boxSizing: "border-box", transition: "all 0.2s",
  };

  return (
    <div className="auth-split" style={{ fontFamily: "'Segoe UI','Inter',Arial,sans-serif", background: `radial-gradient(circle at 5% 10%, #dbeafe 0%, #eef3ff 35%, #f6f8ff 100%)` }}>

      {/* ── LEFT: Image Panel ── */}
      <div className="auth-img-panel" style={{ position: "relative", overflow: "hidden" }}>
        <img src={loginBg} alt="University campus" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, rgba(8,20,44,0.84) 0%, rgba(16,32,64,0.58) 62%, rgba(37,99,235,0.35) 100%)` }} />
        {/* Gold accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: `linear-gradient(to right, ${gold}, ${goldL}, ${gold})` }} />
        <div className="auth-gradient-orb" style={{ width: "260px", height: "260px", background: "rgba(37,99,235,0.35)", top: "24%", left: "-40px" }} />
        <div className="auth-gradient-orb" style={{ width: "280px", height: "280px", background: "rgba(201,168,76,0.22)", bottom: "2%", right: "-80px" }} />

        {/* Branding */}
        <div style={{ position: "absolute", top: "40px", left: "40px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "44px", height: "44px", background: `linear-gradient(135deg, ${goldL}, ${gold})`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: navy, fontWeight: 800 }}>AX</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: "18px" }}>AttendX</div>
            <div style={{ color: gold, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase" }}>University Portal</div>
          </div>
        </div>

        {/* Bottom content */}
        <div className="auth-left-copy auth-float-in" style={{ position: "absolute", left: "32px", right: "32px", background: "linear-gradient(145deg, rgba(11,26,56,0.62), rgba(11,26,56,0.38))", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "18px", padding: "24px 24px", boxShadow: "0 20px 34px rgba(10,22,40,0.32)" }}>
          <div style={{ width: "48px", height: "3px", background: gold, borderRadius: "2px", marginBottom: "20px" }} />
          <p style={{ color: "rgba(255,255,255,0.96)", fontSize: "28px", fontWeight: 800, lineHeight: 1.28, margin: "0 0 12px" }}>
            Join thousands of students taking control of their academics.
          </p>
          <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "16px", lineHeight: 1.7 }}>
            Real-time attendance tracking, smart alerts and detailed analytics — all in one portal.
          </p>

          {/* Highlights */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "28px" }}>
            {["✓  Track your attendance in real-time", "✓  Receive automatic low-attendance alerts", "✓  Subject-wise breakdowns at a glance"].map((t) => (
              <div key={t} className="auth-soft-pulse" style={{ color: "rgba(255,255,255,0.92)", fontSize: "15px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>{t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form Panel ── */}
      <div className="auth-form-panel" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(241,245,255,0.55) 100%)", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "18px 70px 28px", overflowY: "auto" }}>

        {/* Logo row */}
        <div className="auth-fade-up" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <div style={{ width: "40px", height: "40px", background: `linear-gradient(135deg, ${goldL}, ${gold})`, borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: navy, fontWeight: 800 }}>AX</div>
          <div>
            <div style={{ color: navy, fontWeight: 900, fontSize: "16px" }}>AttendX</div>
            <div style={{ color: gold, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase" }}>University Portal</div>
          </div>
        </div>

        <h1 className="auth-fade-up" style={{ fontSize: "46px", fontWeight: 900, color: navy, margin: "0 0 8px", lineHeight: 1.08, letterSpacing: "-0.8px" }}>Create Your Account</h1>
        <p className="auth-fade-up" style={{ color: mid, fontSize: "18px", margin: "0 0 14px" }}>Apply for your portal access and get started.</p>

        {/* Error */}
        {error && (
          <div className="auth-alert-sticky" style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "13px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#991b1b", fontSize: "15px", fontWeight: 600 }}>{error}</span>
          </div>
        )}
        {info && (
          <div className="auth-alert-sticky" style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: "10px", padding: "13px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#065f46", fontSize: "15px", fontWeight: 600 }}>{info}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="auth-fade-up-delay auth-glass" style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.92), rgba(246,248,255,0.86))", borderRadius: "24px", padding: "42px", boxShadow: "0 26px 52px rgba(10,22,40,0.17)", border: "1px solid rgba(255,255,255,0.82)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Honeypot to stop Chrome password breach warnings */}
            <input type="text" style={{display: "none"}} autoComplete="username" />
            <input type="password" style={{display: "none"}} autoComplete="new-password" />

            {/* Role row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "15px", fontWeight: 700, color: navy, marginBottom: "8px" }}>Role</label>
                <select value={form.role} onChange={e => handleRoleChange(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin (Access Request)</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
            </div>

            {/* Name */}
            {!isSuperAdminFlow && (
            <div>
              <label style={{ display: "block", fontSize: "15px", fontWeight: 700, color: navy, marginBottom: "8px" }}>Full Name</label>
              <input type="text" required placeholder="John Doe" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = cobalt; e.target.style.boxShadow = "0 0 0 4px rgba(37,99,235,0.12)"; }}
                onBlur={e => { e.target.style.borderColor = border; e.target.style.boxShadow = "none"; }}
              />
            </div>
            )}

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "15px", fontWeight: 700, color: navy, marginBottom: "8px" }}>Email Address</label>
              <input type="email" required autoComplete="off" placeholder="you@university.edu" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = cobalt; e.target.style.boxShadow = "0 0 0 4px rgba(37,99,235,0.12)"; }}
                onBlur={e => { e.target.style.borderColor = border; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {isSuperAdminFlow && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={handleSendSuperAdminOtp}
                  disabled={otpLoading || !form.email || form.email.trim().toLowerCase() !== SUPER_ADMIN_EMAIL}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${border}`, background: "#fff", cursor: otpLoading ? "not-allowed" : "pointer", fontWeight: 600, color: navy }}
                >
                  {otpLoading ? "Sending OTP..." : otpSent ? "Resend OTP" : "Send OTP"}
                </button>
              </div>
            )}

            {isSuperAdminFlow && otpSent && !otpVerified && (
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="6-digit OTP"
                  value={superAdminOtp}
                  onChange={(e) => setSuperAdminOtp(e.target.value)}
                  maxLength={6}
                  style={{ ...inputStyle, letterSpacing: "3px" }}
                />
                <button
                  type="button"
                  onClick={handleVerifySuperAdminOtp}
                  disabled={otpVerifyLoading || superAdminOtp.length !== 6}
                  style={{ padding: "10px 14px", borderRadius: "8px", border: "none", background: navy, color: "#fff", cursor: otpVerifyLoading ? "not-allowed" : "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
                >
                  {otpVerifyLoading ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            )}

            {/* Password */}
            {(!isSuperAdminFlow || otpVerified) && (
            <div>
              <label style={{ display: "block", fontSize: "15px", fontWeight: 700, color: navy, marginBottom: "8px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} required autoComplete="new-password" placeholder="Min. 8 chars, 1 uppercase" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  onFocus={e => { e.target.style.borderColor = cobalt; e.target.style.boxShadow = "0 0 0 4px rgba(37,99,235,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = border; e.target.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: mid, fontSize: "12px", fontWeight: 700 }}>
                  {showPw ? "HIDE" : "SHOW"}
                </button>
              </div>
              <p style={{ color: mid, fontSize: "12px", marginTop: "5px", margin: "5px 0 0" }}>At least 8 characters including one uppercase letter</p>
            </div>
            )}
            {form.role === "student" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: navy, marginBottom: "7px" }}>Age</label>
                    <input
                      type="number"
                      min="3"
                      max="120"
                      required
                      value={form.age}
                      onChange={e => setForm({ ...form, age: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: navy, marginBottom: "7px" }}>Gender</label>
                    <select
                      required
                      value={form.gender}
                      onChange={e => setForm({ ...form, gender: e.target.value })}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Parent/Guardian Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Parent full name"
                    value={form.parentName}
                    onChange={e => setForm({ ...form, parentName: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Relation</label>
                    <input
                      type="text"
                      required
                      placeholder="Father/Mother/Guardian"
                      value={form.parentRelation}
                      onChange={e => setForm({ ...form, parentRelation: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Parent Phone</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-15 digit phone"
                      value={form.parentPhone}
                      onChange={e => setForm({ ...form, parentPhone: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Parent Email</label>
                  <input
                    type="email"
                    required
                    placeholder="parent@example.com"
                    value={form.parentEmail}
                    onChange={e => setForm({ ...form, parentEmail: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </>
            )}
            {form.role === "teacher" && (
              <>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Primary Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics"
                    value={form.primarySubject}
                    onChange={e => setForm({ ...form, primarySubject: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Secondary Subject (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Physics"
                    value={form.secondarySubject}
                    onChange={e => setForm({ ...form, secondarySubject: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Experience (Years)</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={form.yearsOfExperience}
                      onChange={e => setForm({ ...form, yearsOfExperience: Number(e.target.value || 0), hasExperience: Number(e.target.value || 0) > 0 })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Has Experience</label>
                    <select
                      value={form.hasExperience ? "yes" : "no"}
                      onChange={e => setForm({ ...form, hasExperience: e.target.value === "yes" })}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Highest Qualification</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. M.Sc, B.Ed"
                    value={form.highestQualification}
                    onChange={e => setForm({ ...form, highestQualification: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Educational Background</label>
                  <textarea
                    placeholder="Brief academic background"
                    value={form.educationalBackground}
                    onChange={e => setForm({ ...form, educationalBackground: e.target.value })}
                    style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                  />
                </div>
              </>
            )}
            {form.role === "admin" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Phone</label>
                    <input
                      type="tel"
                      required
                      placeholder="Your contact number"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Department</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Administration"
                      value={form.department}
                      onChange={e => setForm({ ...form, department: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Assistant Director"
                    value={form.designation}
                    onChange={e => setForm({ ...form, designation: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Why do you need admin access?</label>
                  <textarea
                    required
                    placeholder="Explain why admin access is needed"
                    value={form.adminAccessReason}
                    onChange={e => setForm({ ...form, adminAccessReason: e.target.value })}
                    style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                  />
                </div>
              </>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "16px", background: loading ? "#c9a84c99" : `linear-gradient(135deg, ${navy} 0%, ${navyMid} 50%, ${cobalt} 100%)`, color: "#fff", border: "none", borderRadius: "12px", fontSize: "17px", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.25s", marginTop: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 16px 28px rgba(37,99,235,0.28)" }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {loading ? (
                <><span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />Processing…</>
              ) : isSuperAdminFlow ? "Open Super Admin →" : "Apply Now →"}
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