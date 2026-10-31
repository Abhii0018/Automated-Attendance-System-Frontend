import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import { ROLE_REDIRECTS } from "../utils/constants";
import loginBg from "../assets/login.jpeg";
import authService from "../services/authService";
import attendanceService from "../services/attendanceService";
import { Alert, CountUp, Icon } from "../components/ui";

const SUPER_ADMIN_EMAIL = "abhisheksah018@gmail.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_LEN = 6;

// ─── Page styles (scoped with the axa- prefix, built on the ax-* design tokens) ─
const AUTH_CSS = `
  .axa-shell { min-height: 100vh; min-height: 100dvh; display: grid; grid-template-columns: minmax(0, 1fr); background: var(--ax-bg); }
  @media (min-width: 1024px) { .axa-shell { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
  @media (min-width: 1440px) { .axa-shell { grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); } }

  .axa-brand { display: none; }
  @media (min-width: 1024px) {
    .axa-brand { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; gap: 28px; padding: 40px 48px; overflow: hidden; color: #fff; background-color: var(--ax-navy); background-size: cover; background-position: center; }
  }
  .axa-brand-glow { position: absolute; width: 440px; height: 440px; right: -150px; bottom: -170px; border-radius: 50%; background: radial-gradient(circle, rgba(201,168,76,0.30), transparent 65%); pointer-events: none; }
  .axa-brand-glow.is-blue { right: auto; bottom: auto; left: -170px; top: -190px; background: radial-gradient(circle, rgba(47,85,212,0.38), transparent 65%); }
  .axa-brand-grid { position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px); background-size: 22px 22px; -webkit-mask-image: linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent); mask-image: linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent); }
  .axa-brand-top, .axa-brand-foot { position: relative; z-index: 1; }
  .axa-brand-body { position: relative; z-index: 1; flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: center; gap: 26px; }
  .axa-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ax-gold-2); }
  .axa-brand h2 { margin: 0; font-size: clamp(28px, 2.6vw, 38px); line-height: 1.15; font-weight: 800; letter-spacing: -0.02em; max-width: 520px; }
  .axa-brand h2 em { font-style: normal; color: var(--ax-gold-2); }
  .axa-brand-lead { margin: 0; color: rgba(255,255,255,0.72); font-size: 15px; line-height: 1.65; max-width: 480px; }
  .axa-feature-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; max-width: 480px; }
  .axa-feature { display: flex; gap: 14px; align-items: flex-start; }
  .axa-feature-icon { width: 38px; height: 38px; flex-shrink: 0; border-radius: 11px; display: inline-flex; align-items: center; justify-content: center; color: var(--ax-gold-2); background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); }
  .axa-feature-title { font-size: 14.5px; font-weight: 700; color: #fff; }
  .axa-feature-text { font-size: 13px; line-height: 1.55; color: rgba(255,255,255,0.64); margin-top: 2px; }

  .axa-stats { max-width: 520px; padding: 18px 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }
  .axa-stats-head { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; font-size: 12px; font-weight: 600; letter-spacing: 0.02em; color: rgba(255,255,255,0.72); }
  .axa-live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ax-success); animation: axa-pulse 2s infinite; }
  @keyframes axa-pulse { 0% { box-shadow: 0 0 0 0 rgba(22,163,74,0.55); } 70% { box-shadow: 0 0 0 8px rgba(22,163,74,0); } 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); } }
  .axa-stats-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 12px; }
  @media (min-width: 1280px) { .axa-stats-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  .axa-stat-value { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; color: #fff; font-variant-numeric: tabular-nums; }
  .axa-stat-label { margin-top: 4px; font-size: 12px; color: rgba(255,255,255,0.6); }
  .axa-skel-dark { display: block; height: 26px; width: 70%; border-radius: 6px; background: linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.18), rgba(255,255,255,0.08)); background-size: 200% 100%; animation: ax-shimmer 1.3s ease-in-out infinite; }

  .axa-logo { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; border-radius: 10px; }
  .axa-logo-mark { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--ax-gold-2), var(--ax-gold)); color: var(--ax-navy); font-weight: 800; font-size: 13px; box-shadow: 0 4px 12px rgba(201,168,76,0.35); }
  .axa-logo-text { font-weight: 800; font-size: 17px; letter-spacing: -0.02em; color: var(--ax-navy); }
  .axa-brand .axa-logo-text { color: #fff; }

  .axa-main { position: relative; min-width: 0; min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; padding: 16px 16px 24px; background: radial-gradient(900px 420px at 100% -10%, rgba(47,85,212,0.08), transparent 60%), radial-gradient(700px 360px at -10% 110%, rgba(201,168,76,0.10), transparent 60%), var(--ax-bg); }
  @media (min-width: 640px) { .axa-main { padding: 24px 32px 32px; } }
  @media (min-width: 1024px) { .axa-main { padding: 28px 48px 32px; } .axa-topbar .axa-logo { display: none; } }
  .axa-topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 40px; }
  .axa-content { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px 0 8px; }
  .axa-panel { width: 100%; max-width: 440px; }
  .axa-card { background: var(--ax-surface); border: 1px solid var(--ax-border); border-radius: 20px; box-shadow: var(--ax-shadow-lg); padding: 24px 20px; }
  @media (min-width: 640px) { .axa-card { padding: 32px; } }
  .axa-title { margin: 0; font-size: clamp(24px, 4vw, 30px); font-weight: 800; letter-spacing: -0.02em; color: var(--ax-text); }
  .axa-sub { margin: 6px 0 0; color: var(--ax-muted); font-size: 14.5px; line-height: 1.55; }
  .axa-link { color: var(--ax-blue); font-weight: 600; text-decoration: none; border-radius: 4px; }
  .axa-link:hover { text-decoration: underline; text-underline-offset: 3px; }
  .axa-back { display: inline-flex; align-items: center; gap: 6px; margin-left: -8px; padding: 6px 8px; border-radius: 8px; font-size: 13px; font-weight: 600; color: var(--ax-muted); text-decoration: none; transition: color .15s ease, background-color .15s ease; }
  .axa-back:hover { color: var(--ax-text); background: rgba(15,23,42,0.05); }
  .axa-form { display: flex; flex-direction: column; gap: 18px; }
  .axa-alerts { display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px; }
  .axa-iconwrap { position: relative; }
  .axa-iconwrap > svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--ax-muted); pointer-events: none; }
  .axa-iconwrap > .ax-input { padding-left: 38px; }
  .axa-iconwrap > .ax-input.axa-has-toggle { padding-right: 44px; }
  .axa-pw-toggle { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); width: 36px; height: 34px; border: 0; border-radius: 8px; background: transparent; color: var(--ax-muted); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: color .15s ease, background-color .15s ease; }
  .axa-pw-toggle:hover { color: var(--ax-text); background: rgba(15,23,42,0.05); }
  .axa-err { display: flex; align-items: flex-start; gap: 6px; margin: 6px 0 0; font-size: 12.5px; font-weight: 500; color: var(--ax-danger); }
  .axa-err svg { margin-top: 1px; }
  .axa-btn-block { width: 100%; }
  .axa-foot { margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--ax-border); text-align: center; font-size: 13.5px; color: var(--ax-muted); }
  .axa-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }

  .axa-verify { display: flex; flex-direction: column; gap: 16px; padding: 16px; border-radius: 14px; border: 1px solid var(--ax-border); background: var(--ax-surface-2); }
  .axa-verify-head { display: flex; align-items: center; gap: 10px; }
  .axa-verify-icon { width: 34px; height: 34px; flex-shrink: 0; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; background: var(--ax-gold-soft); color: #9a7420; }
  .axa-verify-title { font-size: 14px; font-weight: 700; color: var(--ax-text); }
  .axa-verify-text { font-size: 12.5px; color: var(--ax-muted); margin-top: 1px; overflow-wrap: anywhere; }
  .axa-verified { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--ax-success); }

  .axa-steps { display: flex; align-items: center; gap: 8px; list-style: none; margin: 0; padding: 0; }
  .axa-step { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1 1 0; font-size: 12.5px; font-weight: 600; color: var(--ax-muted); }
  .axa-step:last-child { flex: 0 1 auto; }
  .axa-step:not(:last-child)::after { content: ""; flex: 1; min-width: 10px; height: 2px; border-radius: 2px; background: var(--ax-border); transition: background-color .3s ease; }
  .axa-step[data-state="done"]::after { background: var(--ax-gold); }
  .axa-step-dot { width: 24px; height: 24px; flex-shrink: 0; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; border: 2px solid var(--ax-border-strong); background: var(--ax-surface); color: var(--ax-muted); transition: all .25s ease; }
  .axa-step[data-state="current"] { color: var(--ax-text); }
  .axa-step[data-state="current"] .axa-step-dot { border-color: var(--ax-navy); background: var(--ax-navy); color: #fff; box-shadow: 0 0 0 4px rgba(11,21,48,0.10); }
  .axa-step[data-state="done"] .axa-step-dot { border-color: var(--ax-gold); background: var(--ax-gold); color: var(--ax-navy); }
  .axa-step-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  @media (max-width: 480px) { .axa-steps[data-count="3"] .axa-step:not([data-state="current"]) .axa-step-label { display: none; } }

  .axa-otp { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; max-width: 360px; }
  .axa-otp input { width: 100%; min-width: 0; height: 54px; padding: 0; text-align: center; font: inherit; font-size: 22px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--ax-text); caret-color: var(--ax-blue); background: var(--ax-surface); border: 1px solid var(--ax-border-strong); border-radius: 12px; outline: none; transition: border-color .15s ease, box-shadow .15s ease, background-color .15s ease, transform .15s ease; }
  .axa-otp input:hover { border-color: var(--ax-muted); }
  .axa-otp input:focus { border-color: var(--ax-blue); box-shadow: var(--ax-ring); transform: translateY(-1px); }
  .axa-otp input[data-filled="true"] { border-color: var(--ax-navy-2); background: var(--ax-blue-soft); }
  .axa-otp input[aria-invalid="true"] { border-color: var(--ax-danger); }
  .axa-otp input:disabled { opacity: .6; cursor: not-allowed; }
  @media (max-width: 380px) { .axa-otp { gap: 6px; } .axa-otp input { height: 48px; font-size: 19px; } }

  @media (max-width: 640px) { .axa-main .ax-input { font-size: 16px; } }
`;

// ─── Small local helpers ────────────────────────────────────────────────────────

const Logo = () => (
  <Link to="/" className="axa-logo" aria-label="AttendX home">
    <span className="axa-logo-mark">AX</span>
    <span className="axa-logo-text">AttendX</span>
  </Link>
);

const Steps = ({ steps, current, label }) => (
  <ol className="axa-steps" aria-label={label} data-count={steps.length}>
    {steps.map((s, i) => {
      const n = i + 1;
      const state = n < current ? "done" : n === current ? "current" : "todo";
      return (
        <li key={s} className="axa-step" data-state={state} aria-current={state === "current" ? "step" : undefined}>
          <span className="axa-step-dot">{state === "done" ? <Icon name="check" size={13} strokeWidth={3} /> : n}</span>
          <span className="axa-step-label">{s}</span>
        </li>
      );
    })}
  </ol>
);

// 6 boxes, auto-advance, backspace, arrow keys and paste. `value` is a plain digit string.
const OtpInput = ({ value, onChange, autoFocus, invalid, disabled, labelId, describedBy }) => {
  const refs = useRef([]);
  // True while we move focus ourselves (auto-advance), so onFocus doesn't redirect.
  const movingRef = useRef(false);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const focusBox = (i) => {
    const el = refs.current[Math.max(0, Math.min(OTP_LEN - 1, i))];
    if (!el) return;
    movingRef.current = true;
    el.focus();
    el.select();
    movingRef.current = false;
  };

  const write = (start, digits) => {
    const next = (value.slice(0, start) + digits + value.slice(start + digits.length)).slice(0, OTP_LEN);
    onChange(next);
    focusBox(Math.min(start + digits.length, OTP_LEN - 1));
  };

  const removeAt = (i) => onChange(value.slice(0, i) + value.slice(i + 1));

  const handleChange = (i, e) => {
    let digits = e.target.value.replace(/\D/g, "");
    if (!e.target.value) { if (value[i]) removeAt(i); return; }
    if (!digits) return;
    if (value[i] && digits.length === 2) digits = digits.startsWith(value[i]) ? digits.slice(1) : digits.slice(0, 1);
    write(Math.min(i, value.length), digits);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[i]) removeAt(i);
      else if (i > 0) { onChange(value.slice(0, i - 1) + value.slice(i)); focusBox(i - 1); }
    } else if (e.key === "Delete") {
      e.preventDefault();
      if (value[i]) removeAt(i);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusBox(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusBox(Math.min(i + 1, value.length));
    }
  };

  const handlePaste = (e) => {
    const digits = (e.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, OTP_LEN);
    if (!digits) return;
    e.preventDefault();
    onChange(digits);
    focusBox(Math.min(digits.length, OTP_LEN - 1));
  };

  return (
    <div className="axa-otp" role="group" aria-labelledby={labelId} aria-describedby={describedBy}>
      {Array.from({ length: OTP_LEN }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1} of ${OTP_LEN}`}
          aria-invalid={invalid ? "true" : undefined}
          data-filled={value[i] ? "true" : undefined}
          value={value[i] || ""}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => {
            // A click on an empty box further right jumps to the next empty one.
            if (!movingRef.current && i > value.length) { focusBox(value.length); return; }
            e.target.select();
          }}
        />
      ))}
    </div>
  );
};

const FEATURES = [
  { icon: "clipboard", title: "Period-wise marking", text: "Teachers record attendance for their section, period by period." },
  { icon: "chart", title: "Subject-wise tracking", text: "Students see every subject against the 75% attendance requirement." },
  { icon: "mail", title: "Parents kept in the loop", text: "A daily absence summary is emailed to parents automatically." },
];

const STAT_ITEMS = [
  { key: "students", label: "Students" },
  { key: "teachers", label: "Teachers" },
  { key: "classesRecorded", label: "Classes recorded" },
  { key: "averageAttendance", label: "Avg. attendance", suffix: "%", decimals: 1 },
];

// ─── Page ───────────────────────────────────────────────────────────────────────

const Login = () => {
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
  const [emailTouched, setEmailTouched] = useState(false);
  const [otpTouched, setOtpTouched] = useState(false);
  // undefined = loading, false = unavailable (hidden), object = real stats
  const [stats, setStats] = useState(undefined);
  const { login, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = location.state?.registered === true;
  const registeredEmail = location.state?.email || "";
  const sessionExpired = new URLSearchParams(location.search).get("expired") === "true";
  const isSuperAdminEmail = form.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;

  const emailInvalid = emailTouched && form.email.trim() !== "" && !EMAIL_RE.test(form.email.trim());
  const otpIncomplete = otpTouched && superAdminOtp.length !== OTP_LEN;
  // Super Admin step: 1 = send code, 2 = verify code, 3 = password
  const saStep = !otpSent ? 1 : !otpVerified ? 2 : 3;
  const showPassword = !isSuperAdminEmail || otpVerified;

  // Real platform numbers for the brand panel (public endpoint). Hidden if it fails.
  useEffect(() => {
    let active = true;
    attendanceService
      .getPublicStats()
      .then((res) => {
        if (active) setStats(res?.success && res.data ? res.data : false);
      })
      .catch(() => {
        if (active) setStats(false);
      });
    return () => { active = false; };
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
      const firstName = data?.user?.name?.split(" ")[0];
      toast.success(firstName ? `Welcome back, ${firstName}!` : "Signed in successfully.");
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
      setOtpTouched(false);
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

  // Enter / main button runs the current step: Send OTP → Verify OTP → Sign In.
  const onFormSubmit = (e) => {
    if (isSuperAdminEmail && !otpVerified) {
      e.preventDefault();
      if (!otpSent) {
        if (!otpLoading && form.email) handleSendSuperAdminOtp();
      } else if (superAdminOtp.length === OTP_LEN) {
        if (!otpVerifyLoading) handleVerifySuperAdminOtp();
      } else {
        setOtpTouched(true);
      }
      return;
    }
    handleSubmit(e);
  };

  const showVerifyHelp =
    error.toLowerCase().includes("verify your email") || error.toLowerCase().includes("verify otp");

  let submitLabel = "Sign In";
  let submitIcon = "arrowRight";
  let submitBusy = loading;
  let submitBusyLabel = "Signing in…";
  let submitDisabled = loading;
  if (isSuperAdminEmail && saStep === 1) {
    submitLabel = "Send OTP";
    submitIcon = "send";
    submitBusy = otpLoading;
    submitBusyLabel = "Sending OTP…";
    submitDisabled = otpLoading || !form.email;
  } else if (isSuperAdminEmail && saStep === 2) {
    submitLabel = "Verify OTP";
    submitIcon = "shield";
    submitBusy = otpVerifyLoading;
    submitBusyLabel = "Verifying…";
    submitDisabled = otpVerifyLoading || superAdminOtp.length !== OTP_LEN;
  }

  return (
    <div className="axa-shell">
      <style>{AUTH_CSS}</style>

      {/* ── Brand panel (desktop) ── */}
      <aside
        className="axa-brand"
        style={{ backgroundImage: `linear-gradient(155deg, rgba(11,21,48,0.95) 0%, rgba(20,34,74,0.9) 55%, rgba(27,49,112,0.86) 100%), url(${loginBg})` }}
      >
        <div className="axa-brand-grid" aria-hidden="true" />
        <div className="axa-brand-glow" aria-hidden="true" />
        <div className="axa-brand-glow is-blue" aria-hidden="true" />

        <div className="axa-brand-top">
          <Logo />
        </div>

        <div className="axa-brand-body ax-stagger">
          <span className="axa-eyebrow"><Icon name="sparkles" size={14} /> College attendance portal</span>
          <h2>Every period, every subject — <em>one clear record.</em></h2>
          <p className="axa-brand-lead">
            AttendX connects teachers, students and parents. Attendance is marked once and everyone sees the same, up-to-date picture.
          </p>
          <ul className="axa-feature-list">
            {FEATURES.map((f) => (
              <li key={f.title} className="axa-feature">
                <span className="axa-feature-icon"><Icon name={f.icon} size={18} /></span>
                <div>
                  <div className="axa-feature-title">{f.title}</div>
                  <div className="axa-feature-text">{f.text}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {stats !== false && (
          <div className="axa-brand-foot ax-fade-up">
            <div className="axa-stats" aria-busy={stats === undefined}>
              <div className="axa-stats-head">
                <span className="axa-live-dot" aria-hidden="true" />
                Live numbers from this AttendX instance
              </div>
              <div className="axa-stats-grid">
                {STAT_ITEMS.map((s) => (
                  <div key={s.key}>
                    <div className="axa-stat-value">
                      {stats ? (
                        <CountUp value={stats[s.key]} suffix={s.suffix || ""} decimals={s.decimals || 0} />
                      ) : (
                        <span className="axa-skel-dark" />
                      )}
                    </div>
                    <div className="axa-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ── Form side ── */}
      <main className="axa-main">
        <div className="axa-topbar">
          <Logo />
          <Link to="/" className="axa-back">
            <Icon name="arrowLeft" size={15} /> <span>Back to home</span>
          </Link>
        </div>

        <div className="axa-content">
          <div className="axa-panel ax-fade-up">
            <div className="axa-card">
              <div style={{ marginBottom: 22 }}>
                <h1 className="axa-title">Welcome back</h1>
                <p className="axa-sub">Sign in to your AttendX portal to continue.</p>
              </div>

              {(justRegistered || sessionExpired || error || info) && (
                <div className="axa-alerts" aria-live="polite">
                  {justRegistered && (
                    <Alert tone="success">Account created. Verify your email first, then sign in.</Alert>
                  )}
                  {sessionExpired && !justRegistered && (
                    <Alert tone="warning">Your session expired. Please sign in again.</Alert>
                  )}
                  {error && (
                    <Alert tone="danger">
                      {error}
                      {showVerifyHelp && (
                        <div className="axa-actions">
                          <button
                            type="button"
                            onClick={handleResendVerification}
                            disabled={resendLoading}
                            className="ax-btn ax-btn-secondary ax-btn-sm"
                          >
                            {resendLoading ? <><span className="ax-spinner" /> Sending…</> : <><Icon name="mail" size={14} /> Resend verification email</>}
                          </button>
                          <Link
                            to="/verify-email"
                            state={{ email: form.email || registeredEmail }}
                            className="ax-btn ax-btn-ghost ax-btn-sm"
                          >
                            <Icon name="key" size={14} /> Enter code
                          </Link>
                        </div>
                      )}
                    </Alert>
                  )}
                  {info && <Alert tone="success">{info}</Alert>}
                </div>
              )}

              <form onSubmit={onFormSubmit} className="axa-form">
                {/* Honeypot to stop Chrome password breach warnings */}
                <input type="text" style={{ display: "none" }} autoComplete="username" tabIndex={-1} aria-hidden="true" />
                <input type="password" style={{ display: "none" }} autoComplete="current-password" tabIndex={-1} aria-hidden="true" />

                {/* Email */}
                <div>
                  <label htmlFor="login-email" className="ax-label">Email address</label>
                  <div className="axa-iconwrap">
                    <Icon name="mail" size={17} />
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="off"
                      placeholder="you@college.edu"
                      className="ax-input"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      onBlur={() => setEmailTouched(true)}
                      aria-invalid={emailInvalid ? "true" : undefined}
                      aria-describedby={emailInvalid ? "login-email-err" : undefined}
                    />
                  </div>
                  {emailInvalid && (
                    <p id="login-email-err" className="axa-err"><Icon name="alert" size={13} /> Enter a valid email address.</p>
                  )}
                </div>

                {/* Super Admin OTP verification */}
                {isSuperAdminEmail && (
                  <div className="axa-verify ax-fade-up">
                    <div className="axa-verify-head">
                      <span className="axa-verify-icon"><Icon name="shield" size={17} /></span>
                      <div style={{ minWidth: 0 }}>
                        <div className="axa-verify-title">Super Admin verification</div>
                        <div className="axa-verify-text">
                          {saStep === 1 && <>We'll email a 6-digit code to <strong>{form.email.trim()}</strong>.</>}
                          {saStep === 2 && <>Enter the code sent to <strong>{form.email.trim()}</strong>.</>}
                          {saStep === 3 && <>Code verified. Enter your password to finish.</>}
                        </div>
                      </div>
                    </div>

                    <Steps label="Super Admin sign-in steps" steps={["Send code", "Verify code", "Password"]} current={saStep} />

                    {saStep === 2 && (
                      <div className="ax-fade-up">
                        <span id="login-otp-label" className="ax-label">Verification code</span>
                        <OtpInput
                          value={superAdminOtp}
                          onChange={(v) => { setSuperAdminOtp(v); setOtpTouched(false); }}
                          autoFocus
                          invalid={otpIncomplete}
                          disabled={otpVerifyLoading}
                          labelId="login-otp-label"
                          describedBy={otpIncomplete ? "login-otp-err" : undefined}
                        />
                        {otpIncomplete && (
                          <p id="login-otp-err" className="axa-err"><Icon name="alert" size={13} /> Enter all 6 digits of the code.</p>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 13, color: "var(--ax-muted)", flexWrap: "wrap" }}>
                          Didn't get it?
                          <button
                            type="button"
                            onClick={handleSendSuperAdminOtp}
                            disabled={otpLoading || !form.email}
                            className="ax-btn ax-btn-ghost ax-btn-sm"
                            style={{ color: "var(--ax-blue)", padding: "0 8px" }}
                          >
                            {otpLoading ? <><span className="ax-spinner" /> Sending OTP…</> : <><Icon name="refresh" size={13} /> Resend OTP</>}
                          </button>
                        </div>
                      </div>
                    )}

                    {saStep === 3 && (
                      <div className="axa-verified ax-fade-up">
                        <Icon name="checkCircle" size={16} /> Identity verified
                      </div>
                    )}
                  </div>
                )}

                {/* Password */}
                {showPassword && (
                  <div className="ax-fade-up">
                    <label htmlFor="login-password" className="ax-label">Password</label>
                    <div className="axa-iconwrap">
                      <Icon name="key" size={17} />
                      <input
                        id="login-password"
                        type={showPw ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        placeholder="Enter your password"
                        className="ax-input axa-has-toggle"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        autoFocus={isSuperAdminEmail && otpVerified}
                      />
                      <button
                        type="button"
                        className="axa-pw-toggle"
                        onClick={() => setShowPw(!showPw)}
                        aria-label={showPw ? "Hide password" : "Show password"}
                        aria-pressed={showPw}
                        aria-controls="login-password"
                      >
                        <Icon name={showPw ? "eyeOff" : "eye"} size={17} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Main action (changes with the Super Admin step) */}
                <button
                  type="submit"
                  disabled={submitDisabled}
                  aria-busy={submitBusy}
                  className="ax-btn ax-btn-primary ax-btn-lg axa-btn-block"
                  style={{ marginTop: 4 }}
                >
                  {submitBusy ? (
                    <><span className="ax-spinner" /> {submitBusyLabel}</>
                  ) : (
                    <>{submitLabel} <Icon name={submitIcon} size={16} /></>
                  )}
                </button>
              </form>

              <div className="axa-foot">
                Don't have an account?{" "}
                <Link to="/register" className="axa-link">Create one</Link>
              </div>
            </div>

            <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--ax-muted)", marginTop: 18 }}>
              Got a verification code?{" "}
              <Link to="/verify-email" state={{ email: form.email || registeredEmail }} className="axa-link">Verify your email</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
