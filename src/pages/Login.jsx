import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROLE_REDIRECTS } from "../utils/constants";
import loginBg from "../assets/login.jpeg";
import authService from "../services/authService";

// ─── Theme (matches Landing page) ────────────────────────────────────────────
const navy = "#0a1628";
const navyMid = "#102040";
const gold = "#c9a84c";
const goldL = "#e8c96a";
const border = "#dde3ef";
const mid = "#6b7280";

// ─── Responsive CSS ───────────────────────────────────────────────────────────
const RESP_CSS = `
  .auth-split { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }
  .auth-fade-up { animation: authFadeUp 0.55s ease both; }
  .auth-fade-up-delay { animation: authFadeUp 0.75s ease both; }
  .auth-glass { backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
  @keyframes authFadeUp { from { opacity: 0; transform: translateY(18px);} to { opacity: 1; transform: translateY(0);} }
  @media (max-width: 768px) {
    .auth-split { grid-template-columns: 1fr !important; }
    .auth-img-panel { display: none !important; }
    .auth-form-panel { padding: 40px 24px !important; }
  }
  @media (min-width: 1500px) {
    .auth-form-panel { padding: 80px 92px !important; }
  }
`;

const Login = () => {
  const SUPER_ADMIN_EMAIL = "abhisheksah018@gmail.com";
  const [form, setForm] = useState({ email: "", password: "" });
  const [superAdminOtp, setSuperAdminOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerifyLoading, setOtpVerifyLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = location.state?.registered === true;
  const registeredEmail = location.state?.email || "";
  const isSuperAdminEmail = form.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;

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
    try {
      if (isSuperAdminEmail && !otpVerified) {
        setError("Verify Super Admin OTP before entering password.");
        return;
      }
      const data = await login(form.email, form.password);
      const role = data?.user?.role?.toLowerCase();
      navigate(ROLE_REDIRECTS[role] || "/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please check your credentials."
      );
    }
  };

  const handleSendSuperAdminOtp = async () => {
    setError("");
    setInfo("");
    setOtpLoading(true);
    try {
      const response = await authService.sendSuperAdminLoginOtp(form.email);
      setInfo(response.message || "OTP sent to your email.");
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

  const handleResendVerification = async () => {
    const email = form.email || registeredEmail;
    if (!email) {
      setError("Enter your email, then resend verification.");
      return;
    }
    setInfo("");
    setResendLoading(true);
    try {
      const response = await authService.resendVerification(email);
      setInfo(response.message || "Verification email sent.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not resend verification email.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-split" style={{ fontFamily: "'Segoe UI','Inter',Arial,sans-serif", background: `radial-gradient(circle at 15% 20%, #dbeafe 0%, #f4f6fa 35%, #eef2ff 100%)` }}>

      {/* ── LEFT: Image Panel ── */}
      <div className="auth-img-panel" style={{ position: "relative", overflow: "hidden" }}>
        <img src={loginBg} alt="University" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
        {/* Dark gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${navy}ee 0%, rgba(10,22,40,0.55) 100%)` }} />
        {/* Gold top accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: `linear-gradient(to right, ${gold}, ${goldL}, ${gold})` }} />

        {/* Branding */}
        <div style={{ position: "absolute", top: "40px", left: "40px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "44px", height: "44px", background: `linear-gradient(135deg, ${goldL}, ${gold})`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: navy, fontWeight: 800 }}>AX</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: "18px" }}>AttendX</div>
            <div style={{ color: gold, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase" }}>University Portal</div>
          </div>
        </div>

        {/* Bottom quote */}
        <div style={{ position: "absolute", bottom: "48px", left: "40px", right: "40px" }}>
          <div style={{ width: "48px", height: "3px", background: gold, borderRadius: "2px", marginBottom: "20px" }} />
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "22px", fontWeight: 700, lineHeight: 1.4, margin: "0 0 12px" }}>
            "Education is the most powerful weapon you can use to change the world."
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>— Nelson Mandela</p>

          {/* Mini stats */}
          <div style={{ display: "flex", gap: "28px", marginTop: "32px" }}>
            {[["10K+", "Students"], ["500+", "Faculty"], ["98%", "Accuracy"]].map(([v, l]) => (
              <div key={l}>
                <div style={{ color: gold, fontWeight: 900, fontSize: "22px" }}>{v}</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "2px" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form Panel ── */}
      <div className="auth-form-panel" style={{ background: "transparent", display: "flex", flexDirection: "column", justifyContent: "center", padding: "70px 70px", overflowY: "auto" }}>

        {/* Mobile logo (hidden on desktop via CSS) */}
        <div className="auth-fade-up" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
          <div style={{ width: "40px", height: "40px", background: `linear-gradient(135deg, ${goldL}, ${gold})`, borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: navy, fontWeight: 800 }}>AX</div>
          <div>
            <div style={{ color: navy, fontWeight: 900, fontSize: "16px" }}>AttendX</div>
            <div style={{ color: gold, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase" }}>University Portal</div>
          </div>
        </div>

        <h1 className="auth-fade-up" style={{ fontSize: "38px", fontWeight: 900, color: navy, margin: "0 0 8px", lineHeight: 1.2 }}>Welcome Back</h1>
        <p className="auth-fade-up" style={{ color: mid, fontSize: "17px", margin: "0 0 36px" }}>Sign in to your portal to continue</p>

        {/* Success banner */}
        {justRegistered && (
          <div style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#065f46", fontSize: "14px", fontWeight: 500 }}>Account created. Verify your email first, then sign in.</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#991b1b", fontSize: "14px" }}>{error}</span>
          </div>
        )}
        {info && (
          <div style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#065f46", fontSize: "14px" }}>{info}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="auth-fade-up-delay auth-glass" style={{ background: "rgba(255,255,255,0.84)", borderRadius: "20px", padding: "42px", boxShadow: "0 18px 44px rgba(10,22,40,0.14)", border: "1px solid rgba(255,255,255,0.7)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Honeypot to stop Chrome password breach warnings */}
            <input type="text" style={{display: "none"}} autoComplete="username" />
            <input type="password" style={{display: "none"}} autoComplete="current-password" />

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "7px" }}>Email Address</label>
              <input
                type="email" required
                autoComplete="off"
                placeholder="you@university.edu"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: `1.5px solid ${border}`, fontSize: "14px", color: navy, background: "#fff", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = gold}
                onBlur={e => e.target.style.borderColor = border}
              />
            </div>

            {isSuperAdminEmail && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={handleSendSuperAdminOtp}
                  disabled={otpLoading || !form.email}
                  style={{ flex: 1, padding: "10px 12px", borderRadius: "8px", border: `1px solid ${border}`, background: "#fff", cursor: otpLoading ? "not-allowed" : "pointer", fontWeight: 600, color: navy }}
                >
                  {otpLoading ? "Sending OTP..." : otpSent ? "Resend OTP" : "Send OTP"}
                </button>
              </div>
            )}

            {isSuperAdminEmail && otpSent && !otpVerified && (
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="6-digit OTP"
                  value={superAdminOtp}
                  onChange={(e) => setSuperAdminOtp(e.target.value)}
                  maxLength={6}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: `1.5px solid ${border}`, fontSize: "14px", color: navy, background: "#fff", outline: "none", boxSizing: "border-box" }}
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
            {(!isSuperAdminEmail || otpVerified) && (
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "7px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"} required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ width: "100%", padding: "12px 44px 12px 14px", borderRadius: "8px", border: `1.5px solid ${border}`, fontSize: "14px", color: navy, background: "#fff", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                  onFocus={e => e.target.style.borderColor = gold}
                  onBlur={e => e.target.style.borderColor = border}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: mid, fontSize: "12px", fontWeight: 700 }}>
                  {showPw ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "14px", background: loading ? "#c9a84c99" : `linear-gradient(135deg, ${navy} 0%, ${navyMid} 55%, #1d4ed8 100%)`, color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", letterSpacing: "0.3px", marginTop: "4px", boxShadow: "0 10px 22px rgba(16,32,64,0.22)" }}>
              {loading ? "Signing In…" : "Sign In →"}
            </button>
          </form>
          {(error.toLowerCase().includes("verify your email") || error.toLowerCase().includes("verify otp")) && (
            <div style={{ marginTop: "14px", textAlign: "center" }}>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                style={{ background: "transparent", color: navy, border: "none", borderBottom: `1px solid ${gold}`, cursor: resendLoading ? "not-allowed" : "pointer", fontSize: "13px", padding: "0 0 2px" }}
              >
                {resendLoading ? "Sending..." : "Resend verification email"}
              </button>
            </div>
          )}

          <div style={{ marginTop: "22px", paddingTop: "18px", borderTop: `1px solid ${border}`, textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: mid }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: navy, fontWeight: 700, textDecoration: "none", borderBottom: `2px solid ${gold}`, paddingBottom: "1px" }}>Create one →</Link>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <Link to="/" style={{ color: mid, fontSize: "13px", textDecoration: "none" }}>← Back to Homepage</Link>
        </div>
      </div>

    </div>
  );
};

export default Login;