import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import authService from "../services/authService";

const navy = "#0a1628";
const navyMid = "#102040";
const gold = "#c9a84c";
const border = "#dde3ef";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await authService.verifyEmail(email, otp);
      setMessage(response.message || "Email verified successfully.");
      setTimeout(() => navigate("/login", { replace: true, state: { registered: true, email } }), 1000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Enter email first.");
      return;
    }
    setError("");
    setMessage("");
    setResending(true);
    try {
      const response = await authService.resendVerification(email);
      setMessage(response.message || "OTP sent.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at 15% 20%, #dbeafe 0%, #f4f6fa 35%, #eef2ff 100%)", padding: "24px", fontFamily: "'Segoe UI','Inter',Arial,sans-serif" }}>
      <div style={{ maxWidth: "480px", width: "100%", background: "rgba(255,255,255,0.78)", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 14px 40px rgba(10,22,40,0.12)", padding: "30px", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", animation: "authFadeUp 0.6s ease both" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "12px" }}>
          <div style={{ width: "36px", height: "36px", background: `linear-gradient(135deg, #e8c96a, ${gold})`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: navy, fontWeight: 800 }}>AX</div>
          <div style={{ color: navy, fontWeight: 800, fontSize: "16px" }}>AttendX</div>
        </div>
        <h1 style={{ margin: "0 0 10px", color: navy, fontSize: "24px", textAlign: "center" }}>Verify Email with OTP</h1>
        <p style={{ margin: "0 0 18px", color: "#6b7280", fontSize: "14px", textAlign: "center" }}>Enter the OTP sent to your email to activate your account.</p>

        <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: "12px 13px", borderRadius: "9px", border: `1.5px solid ${border}`, fontSize: "14px", outline: "none" }}
          />
          <input
            type="text"
            placeholder="6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
            style={{ padding: "12px 13px", borderRadius: "9px", border: `1.5px solid ${border}`, fontSize: "14px", letterSpacing: "3px", outline: "none" }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: "13px", borderRadius: "10px", border: "none", background: loading ? "#c9a84c99" : `linear-gradient(135deg, ${navy} 0%, ${navyMid} 55%, #1d4ed8 100%)`, color: "#fff", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 10px 22px rgba(16,32,64,0.22)" }}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        {error && <p style={{ margin: "12px 0 0", color: "#991b1b", fontSize: "13px", textAlign: "center" }}>{error}</p>}
        {message && <p style={{ margin: "12px 0 0", color: "#065f46", fontSize: "13px", textAlign: "center" }}>{message}</p>}

        <div style={{ marginTop: "14px", textAlign: "center" }}>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={{ border: "none", background: "transparent", color: navy, cursor: resending ? "not-allowed" : "pointer", borderBottom: `1px solid ${gold}`, paddingBottom: "2px", fontWeight: 600 }}
          >
            {resending ? "Sending OTP..." : "Resend OTP"}
          </button>
        </div>

        <div style={{ marginTop: "14px", textAlign: "center" }}>
          <Link to="/login" style={{ color: navy, textDecoration: "none", fontWeight: 600 }}>Back to Login</Link>
        </div>
      </div>
      <style>{`@keyframes authFadeUp { from { opacity: 0; transform: translateY(18px);} to { opacity: 1; transform: translateY(0);} }`}</style>
    </div>
  );
};

export default VerifyEmail;
