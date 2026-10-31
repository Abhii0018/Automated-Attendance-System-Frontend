import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import useToast from "../hooks/useToast";
import loginBg from "../assets/login.jpeg";
import { Alert, Icon } from "../components/ui";

const OTP_LEN = 6;

// ─── Page styles (shared auth look, scoped with the axa- prefix) ──────────────
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

const VERIFY_CSS = `
  .axa-mail-badge { width: 52px; height: 52px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; background: var(--ax-blue-soft); color: var(--ax-blue); border: 1px solid #c7d6fe; }
  .axa-mail-badge.is-done { background: var(--ax-success-soft); color: var(--ax-success); border-color: #bbf7d0; animation: axa-pop .45s var(--ax-ease) both; }
  @keyframes axa-pop { from { transform: scale(.6); opacity: 0; } to { transform: none; opacity: 1; } }
  .axa-email-chip { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--ax-border); background: var(--ax-surface-2); }
  .axa-email-chip-text { flex: 1; min-width: 0; font-size: 14px; font-weight: 600; color: var(--ax-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .axa-tip { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.55; max-width: 460px; }
  .axa-tip svg { color: var(--ax-gold-2); margin-top: 2px; }
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

// ─── Page ───────────────────────────────────────────────────────────────────────

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [editingEmail, setEditingEmail] = useState(!location.state?.email);
  const [otpTouched, setOtpTouched] = useState(false);
  const [verified, setVerified] = useState(false);
  const emailRef = useRef(null);

  useEffect(() => {
    if (editingEmail) emailRef.current?.focus();
  }, [editingEmail]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await authService.verifyEmail(email, otp);
      setMessage(response.message || "Email verified successfully.");
      setVerified(true);
      toast.success("Email verified. You can sign in now.");
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
      setOtp("");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not resend OTP.");
    } finally {
      setResending(false);
    }
  };

  // The code must be complete before we call the API.
  const onFormSubmit = (e) => {
    if (otp.length !== OTP_LEN) {
      e.preventDefault();
      setOtpTouched(true);
      return;
    }
    handleVerify(e);
  };

  const otpIncomplete = otpTouched && otp.length !== OTP_LEN;

  return (
    <div className="axa-shell">
      <style>{AUTH_CSS + VERIFY_CSS}</style>

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
          <span className="axa-eyebrow"><Icon name="mail" size={14} /> Email verification</span>
          <h2>One last step to <em>activate your account.</em></h2>
          <p className="axa-brand-lead">
            We sent a 6-digit code to the email address you registered with. Enter it here to confirm the address belongs to you.
          </p>
          <ul className="axa-feature-list">
            <li className="axa-tip"><Icon name="info" size={16} /> Can't find it? Check your spam or promotions folder.</li>
            <li className="axa-tip"><Icon name="refresh" size={16} /> Codes expire — request a new one with "Resend OTP" if needed.</li>
            <li className="axa-tip"><Icon name="login" size={16} /> Once verified you'll be taken straight to the sign-in page.</li>
          </ul>
        </div>
      </aside>

      {/* ── Form side ── */}
      <main className="axa-main">
        <div className="axa-topbar">
          <Logo />
          <Link to="/login" className="axa-back">
            <Icon name="arrowLeft" size={15} /> <span>Back to login</span>
          </Link>
        </div>

        <div className="axa-content">
          <div className="axa-panel ax-fade-up">
            <div className="axa-card">
              <div style={{ marginBottom: 20 }}>
                <span className={`axa-mail-badge${verified ? " is-done" : ""}`}>
                  <Icon name={verified ? "checkCircle" : "mail"} size={24} />
                </span>
                <h1 className="axa-title">{verified ? "Email verified" : "Verify your email"}</h1>
                <p className="axa-sub">
                  {verified
                    ? "Redirecting you to sign in…"
                    : "Enter the 6-digit OTP sent to your email to activate your account."}
                </p>
              </div>

              <div style={{ marginBottom: 22 }}>
                <Steps label="Account setup steps" steps={["Account", "Verify email", "Sign in"]} current={verified ? 3 : 2} />
              </div>

              <form onSubmit={onFormSubmit} className="axa-form">
                {/* Email */}
                {editingEmail ? (
                  <div>
                    <label htmlFor="verify-email" className="ax-label">Email address</label>
                    <div className="axa-iconwrap">
                      <Icon name="mail" size={17} />
                      <input
                        ref={emailRef}
                        id="verify-email"
                        type="email"
                        placeholder="you@college.edu"
                        autoComplete="email"
                        className="ax-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={verified}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="ax-label">Code sent to</span>
                    <div className="axa-email-chip">
                      <Icon name="mail" size={16} style={{ color: "var(--ax-muted)" }} />
                      <span className="axa-email-chip-text">{email}</span>
                      <button
                        type="button"
                        onClick={() => setEditingEmail(true)}
                        disabled={verified}
                        className="ax-btn ax-btn-ghost ax-btn-sm"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}

                {/* OTP */}
                <div>
                  <span id="verify-otp-label" className="ax-label">Verification code</span>
                  <OtpInput
                    value={otp}
                    onChange={(v) => { setOtp(v); setOtpTouched(false); }}
                    autoFocus={!editingEmail}
                    invalid={otpIncomplete}
                    disabled={loading || verified}
                    labelId="verify-otp-label"
                    describedBy={otpIncomplete ? "verify-otp-err" : undefined}
                  />
                  {otpIncomplete && (
                    <p id="verify-otp-err" className="axa-err"><Icon name="alert" size={13} /> Enter all 6 digits of the code.</p>
                  )}
                </div>

                {(error || message) && (
                  <div className="axa-alerts" style={{ marginBottom: 0 }} aria-live="polite">
                    {error && <Alert tone="danger">{error}</Alert>}
                    {message && <Alert tone="success">{message}</Alert>}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || verified}
                  aria-busy={loading}
                  className={`ax-btn ax-btn-lg axa-btn-block ${verified ? "ax-btn-success" : "ax-btn-primary"}`}
                >
                  {loading ? (
                    <><span className="ax-spinner" /> Verifying…</>
                  ) : verified ? (
                    <><Icon name="checkCircle" size={16} /> Verified</>
                  ) : (
                    <>Verify OTP <Icon name="shield" size={16} /></>
                  )}
                </button>
              </form>

              <div className="axa-foot" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
                Didn't receive the code?
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || verified}
                  className="ax-btn ax-btn-ghost ax-btn-sm"
                  style={{ color: "var(--ax-blue)", padding: "0 8px" }}
                >
                  {resending ? <><span className="ax-spinner" /> Sending OTP…</> : <><Icon name="refresh" size={13} /> Resend OTP</>}
                </button>
              </div>
            </div>

            <p style={{ textAlign: "center", fontSize: 13, color: "var(--ax-muted)", marginTop: 18 }}>
              Already verified? <Link to="/login" className="axa-link">Back to Login</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VerifyEmail;
