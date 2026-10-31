import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import authService from "../services/authService";
import loginBg from "../assets/login.jpeg";
import { Alert, Avatar, Icon } from "../components/ui";

const SUPER_ADMIN_EMAIL = "abhisheksah018@gmail.com";
const SUPER_ADMIN_NAME = "Abhishek Kumar";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

const REGISTER_CSS = `
  .axa-panel.is-wide { max-width: 600px; }
  .axa-roles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; min-width: 0; margin: 0; padding: 0; border: 0; }
  @media (min-width: 640px) { .axa-roles { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  .axa-roles legend { padding: 0; margin-bottom: 8px; }
  .axa-role { position: relative; min-width: 0; display: flex; flex-direction: column; gap: 6px; padding: 12px; border-radius: 12px; border: 1px solid var(--ax-border); background: var(--ax-surface); cursor: pointer; transition: border-color .15s ease, box-shadow .15s ease, background-color .15s ease, transform .15s ease; }
  .axa-role:hover { border-color: var(--ax-border-strong); transform: translateY(-1px); }
  .axa-role input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
  .axa-role[data-checked="true"] { border-color: var(--ax-navy); background: var(--ax-surface-2); box-shadow: inset 0 0 0 1px var(--ax-navy); }
  .axa-role:has(input:focus-visible) { box-shadow: inset 0 0 0 1px var(--ax-navy), var(--ax-ring); }
  .axa-role-icon { width: 30px; height: 30px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; background: var(--ax-surface-2); color: var(--ax-muted); border: 1px solid var(--ax-border); transition: all .15s ease; }
  .axa-role[data-checked="true"] .axa-role-icon { background: var(--ax-navy); border-color: var(--ax-navy); color: var(--ax-gold-2); }
  .axa-role-name { font-size: 13.5px; font-weight: 700; color: var(--ax-text); }
  .axa-role-desc { font-size: 11.5px; line-height: 1.35; color: var(--ax-muted); }
  .axa-role-check { position: absolute; top: 10px; right: 10px; color: var(--ax-navy); opacity: 0; transform: scale(.6); transition: opacity .15s ease, transform .15s ease; }
  .axa-role[data-checked="true"] .axa-role-check { opacity: 1; transform: none; }
  .axa-grid2 { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }
  @media (min-width: 560px) { .axa-grid2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .axa-step-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; font-size: 12px; font-weight: 600; color: var(--ax-muted); }
  .axa-group { display: flex; align-items: center; gap: 10px; font-size: 11.5px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--ax-muted); }
  .axa-group::after { content: ""; flex: 1; height: 1px; background: var(--ax-border); }
  .axa-checklist { list-style: none; display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 8px 0 0; padding: 0; font-size: 12.5px; color: var(--ax-muted); }
  .axa-checklist li { display: flex; align-items: center; gap: 6px; transition: color .2s ease; }
  .axa-checklist li[data-ok="true"] { color: var(--ax-success); }
  .axa-check-dot { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid currentColor; display: inline-flex; align-items: center; justify-content: center; }
  .axa-summary { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 12px; border: 1px dashed var(--ax-border-strong); background: var(--ax-surface-2); }
  .axa-summary-text { flex: 1; min-width: 0; }
  .axa-summary-name { font-size: 13.5px; font-weight: 700; color: var(--ax-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .axa-summary-email { font-size: 12.5px; color: var(--ax-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .axa-btn-row { display: flex; gap: 10px; margin-top: 4px; }
  .axa-btn-row .ax-btn-primary { flex: 1; min-width: 0; }
  .axa-optional { font-weight: 500; color: var(--ax-muted); }
  .axa-num { font-size: 14px; font-weight: 800; color: var(--ax-gold-2); }
  .axa-role-note { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; font-size: 13px; color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); max-width: 480px; }
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

const Field = ({ name, label, error, hint, optional, children }) => (
  <div>
    <label htmlFor={`reg-${name}`} className="ax-label">
      {label}
      {optional && <span className="axa-optional"> (optional)</span>}
    </label>
    {children}
    {error ? (
      <p id={`reg-${name}-err`} className="axa-err"><Icon name="alert" size={13} /> {error}</p>
    ) : hint ? (
      <p id={`reg-${name}-hint`} className="ax-help">{hint}</p>
    ) : null}
  </div>
);

const ROLE_OPTIONS = [
  { value: "student", label: "Student", desc: "Track my attendance", icon: "user" },
  { value: "teacher", label: "Teacher", desc: "Apply to teach", icon: "teacher" },
  { value: "admin", label: "Admin", desc: "Request admin access", icon: "briefcase" },
  { value: "superadmin", label: "Super Admin", desc: "Verified sign-in", icon: "shield" },
];

const DETAILS_LABEL = { student: "Student details", teacher: "Teaching profile", admin: "Access request" };

const ACCESS_NOTE = {
  student: "Students can sign in as soon as their email is verified.",
  teacher: "Teacher applications are reviewed by an administrator.",
  admin: "Admin access requests are reviewed before they are enabled.",
  superadmin: "The Super Admin signs in with a one-time code sent by email.",
};

const STEP1_FIELDS = ["name", "email", "password"];
const STEP2_FIELDS = {
  student: ["age", "gender", "parentName", "parentRelation", "parentPhone", "parentEmail"],
  teacher: ["primarySubject", "highestQualification"],
  admin: ["phone", "department", "designation", "adminAccessReason"],
};

// Inline validation — mirrors the checks in handleSubmit so users see problems early.
const getErrors = (form) => {
  const e = {};
  const isSuper = form.role === "superadmin";
  const email = form.email.trim();
  if (!isSuper && !form.name.trim()) e.name = "Full name is required.";
  if (!email) e.email = "Email is required.";
  else if (!EMAIL_RE.test(email)) e.email = "Enter a valid email address.";
  else if (isSuper && email.toLowerCase() !== SUPER_ADMIN_EMAIL) e.email = "Only configured Super Admin email is allowed.";
  if (!isSuper) {
    if (form.password.length < 8) e.password = "Password must be at least 8 characters.";
    else if (!/[A-Z]/.test(form.password)) e.password = "Password must contain at least one uppercase letter.";
  }
  if (form.role === "student") {
    if (!form.age || Number(form.age) < 3 || Number(form.age) > 120) e.age = "Enter a valid student age.";
    if (!form.gender) e.gender = "Please select gender.";
    if (!form.parentName.trim()) e.parentName = "Parent name is required.";
    if (!form.parentRelation.trim()) e.parentRelation = "Parent relation is required.";
    if (!form.parentEmail.trim()) e.parentEmail = "Parent email is required.";
    else if (!EMAIL_RE.test(form.parentEmail.trim())) e.parentEmail = "Enter a valid email address.";
    if (!form.parentPhone.trim()) e.parentPhone = "Parent phone is required.";
  }
  if (form.role === "teacher") {
    if (!form.primarySubject.trim()) e.primarySubject = "Primary subject is required for teacher.";
    if (!form.highestQualification.trim()) e.highestQualification = "Highest qualification is required for teacher.";
  }
  if (form.role === "admin") {
    if (!form.phone.trim()) e.phone = "Phone is required for admin request.";
    if (!form.department.trim()) e.department = "Department is required for admin request.";
    if (!form.designation.trim()) e.designation = "Designation is required for admin request.";
    if (!form.adminAccessReason.trim()) e.adminAccessReason = "Reason is required for admin request.";
  }
  return e;
};

// ─── Page ───────────────────────────────────────────────────────────────────────

const Register = () => {
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
  const [step, setStep] = useState(1);
  const [touched, setTouched] = useState({});
  const [otpTouched, setOtpTouched] = useState(false);
  const { register, login, loading } = useAuth();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const isSuperAdminFlow = form.role === "superadmin";
  const superEmailOk = form.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;

  const errors = getErrors(form);
  const errOf = (name) => (touched[name] ? errors[name] || "" : "");
  const touch = (name) => setTouched((t) => ({ ...t, [name]: true }));
  const set = (name) => (e) => setForm({ ...form, [name]: e.target.value });
  const a11y = (name, hasHint = false) => {
    const err = errOf(name);
    return {
      id: `reg-${name}`,
      onBlur: () => touch(name),
      "aria-invalid": err ? "true" : undefined,
      "aria-describedby": err ? `reg-${name}-err` : hasHint ? `reg-${name}-hint` : undefined,
    };
  };

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
    setTouched({});
    setOtpTouched(false);
    if (role === "superadmin" || form.role === "superadmin") setStep(1);
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

  // Step 1 → Step 2 (account details are checked first)
  const goToDetails = () => {
    setError("");
    setInfo("");
    setTouched((t) => ({ ...t, name: true, email: true, password: true }));
    const first = STEP1_FIELDS.find((f) => errors[f]);
    if (first) {
      document.getElementById(`reg-${first}`)?.focus();
      return;
    }
    setStep(2);
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const firstDetail = STEP2_FIELDS[form.role]?.[0];
    requestAnimationFrame(() => document.getElementById(`reg-${firstDetail}`)?.focus({ preventScroll: true }));
  };

  const goBack = () => {
    setError("");
    setInfo("");
    setStep(1);
  };

  // Enter / main button runs the current step.
  const onFormSubmit = (e) => {
    if (isSuperAdminFlow) {
      if (!otpVerified && superEmailOk) {
        e.preventDefault();
        if (!otpSent) {
          if (!otpLoading) handleSendSuperAdminOtp();
        } else if (superAdminOtp.length === OTP_LEN) {
          if (!otpVerifyLoading) handleVerifySuperAdminOtp();
        } else {
          setOtpTouched(true);
        }
        return;
      }
      handleSubmit(e);
      return;
    }
    if (step === 1) {
      e.preventDefault();
      goToDetails();
      return;
    }
    const fields = STEP2_FIELDS[form.role] || [];
    setTouched((t) => ({ ...t, ...Object.fromEntries(fields.map((f) => [f, true])) }));
    handleSubmit(e);
  };

  // Native "required" bubbles also light up the inline error state.
  const onFormInvalid = (e) => {
    const id = e.target?.id || "";
    if (id.startsWith("reg-")) touch(id.slice(4));
  };

  const saStep = !otpSent ? 1 : !otpVerified ? 2 : 3;
  const otpIncomplete = otpTouched && superAdminOtp.length !== OTP_LEN;
  const pwChecks = [
    { label: "8+ characters", ok: form.password.length >= 8 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(form.password) },
  ];
  const roleMeta = ROLE_OPTIONS.find((r) => r.value === form.role) || ROLE_OPTIONS[0];

  // Main button label per step
  let submitLabel = "Continue";
  let submitIcon = "arrowRight";
  let submitBusy = false;
  let submitBusyLabel = "";
  let submitDisabled = false;
  if (isSuperAdminFlow) {
    if (saStep === 1) {
      submitLabel = "Send OTP"; submitIcon = "send"; submitBusy = otpLoading; submitBusyLabel = "Sending OTP…";
      submitDisabled = otpLoading || !form.email || !superEmailOk;
    } else if (saStep === 2) {
      submitLabel = "Verify OTP"; submitIcon = "shield"; submitBusy = otpVerifyLoading; submitBusyLabel = "Verifying…";
      submitDisabled = otpVerifyLoading || superAdminOtp.length !== OTP_LEN;
    } else {
      submitLabel = "Open Super Admin"; submitBusy = loading; submitBusyLabel = "Processing…"; submitDisabled = loading;
    }
  } else if (step === 2) {
    submitLabel = "Apply Now"; submitBusy = loading; submitBusyLabel = "Processing…"; submitDisabled = loading;
  }

  const passwordField = (
    <Field name="password" label="Password" error={errOf("password")}>
      <div className="axa-iconwrap">
        <Icon name="key" size={17} />
        <input
          {...a11y("password")}
          type={showPw ? "text" : "password"}
          required
          autoComplete="new-password"
          placeholder={isSuperAdminFlow ? "Enter your password" : "Min. 8 chars, 1 uppercase"}
          className="ax-input axa-has-toggle"
          value={form.password}
          onChange={set("password")}
          autoFocus={isSuperAdminFlow && otpVerified}
        />
        <button
          type="button"
          className="axa-pw-toggle"
          onClick={() => setShowPw(!showPw)}
          aria-label={showPw ? "Hide password" : "Show password"}
          aria-pressed={showPw}
          aria-controls="reg-password"
        >
          <Icon name={showPw ? "eyeOff" : "eye"} size={17} />
        </button>
      </div>
      {!isSuperAdminFlow && (
        <ul className="axa-checklist" aria-label="Password requirements">
          {pwChecks.map((c) => (
            <li key={c.label} data-ok={c.ok ? "true" : undefined}>
              <span className="axa-check-dot">{c.ok && <Icon name="check" size={10} strokeWidth={3.5} />}</span>
              {c.label}
              <span className="sr-only">{c.ok ? "(met)" : "(not met)"}</span>
            </li>
          ))}
        </ul>
      )}
    </Field>
  );

  return (
    <div className="axa-shell">
      <style>{AUTH_CSS + REGISTER_CSS}</style>

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
          <span className="axa-eyebrow"><Icon name="userPlus" size={14} /> Join AttendX</span>
          <h2>Set up your portal access in <em>three steps.</em></h2>
          <p className="axa-brand-lead">
            Students, teachers and administrators each have their own form, so you only fill in what applies to you.
          </p>
          <ol className="axa-feature-list">
            {[
              { title: "Choose your role", text: "Tell us who you are and add your account and profile details." },
              { title: "Verify your email", text: "We email a 6-digit code to confirm the address belongs to you." },
              { title: "Get access", text: "Sign in to your dashboard once your account is active." },
            ].map((s, i) => (
              <li key={s.title} className="axa-feature">
                <span className="axa-feature-icon"><span className="axa-num">{i + 1}</span></span>
                <div>
                  <div className="axa-feature-title">{s.title}</div>
                  <div className="axa-feature-text">{s.text}</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="axa-role-note" aria-live="polite">
            <Icon name={roleMeta.icon} size={16} style={{ color: "var(--ax-gold-2)" }} />
            <span>{ACCESS_NOTE[form.role]}</span>
          </div>
        </div>
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
          <div className="axa-panel is-wide ax-fade-up">
            <div className="axa-card" ref={cardRef} style={{ scrollMarginTop: 16 }}>
              <div style={{ marginBottom: 22 }}>
                <h1 className="axa-title">Create your account</h1>
                <p className="axa-sub">Apply for your AttendX portal access and get started.</p>
              </div>

              <form onSubmit={onFormSubmit} onInvalidCapture={onFormInvalid} className="axa-form">
                {/* Honeypot to stop Chrome password breach warnings */}
                <input type="text" style={{ display: "none" }} autoComplete="username" tabIndex={-1} aria-hidden="true" />
                <input type="password" style={{ display: "none" }} autoComplete="new-password" tabIndex={-1} aria-hidden="true" />

                {/* Role */}
                <fieldset className="axa-roles">
                  <legend className="ax-label">I am registering as</legend>
                  {ROLE_OPTIONS.map((r) => {
                    const checked = form.role === r.value;
                    return (
                      <label key={r.value} className="axa-role" data-checked={checked ? "true" : undefined}>
                        <input
                          type="radio"
                          name="role"
                          value={r.value}
                          checked={checked}
                          onChange={(e) => handleRoleChange(e.target.value)}
                        />
                        <span className="axa-role-icon"><Icon name={r.icon} size={16} /></span>
                        <span className="axa-role-name">{r.label}</span>
                        <span className="axa-role-desc">{r.desc}</span>
                        <span className="axa-role-check"><Icon name="checkCircle" size={16} /></span>
                      </label>
                    );
                  })}
                </fieldset>

                {/* ── Super Admin: email → OTP → password ── */}
                {isSuperAdminFlow && (
                  <>
                    <Field name="email" label="Super Admin email" error={errOf("email")}>
                      <div className="axa-iconwrap">
                        <Icon name="mail" size={17} />
                        <input
                          {...a11y("email")}
                          type="email"
                          required
                          autoComplete="off"
                          placeholder="you@college.edu"
                          className="ax-input"
                          value={form.email}
                          onChange={set("email")}
                        />
                      </div>
                    </Field>

                    <div className="axa-verify ax-fade-up">
                      <div className="axa-verify-head">
                        <span className="axa-verify-icon"><Icon name="shield" size={17} /></span>
                        <div style={{ minWidth: 0 }}>
                          <div className="axa-verify-title">Super Admin verification</div>
                          <div className="axa-verify-text">
                            {saStep === 1 && (superEmailOk
                              ? <>We'll email a 6-digit code to <strong>{form.email.trim()}</strong>.</>
                              : <>Enter the configured Super Admin email to receive a code.</>)}
                            {saStep === 2 && <>Enter the code sent to <strong>{form.email.trim()}</strong>.</>}
                            {saStep === 3 && <>Code verified. Enter your password to open the admin portal.</>}
                          </div>
                        </div>
                      </div>

                      <Steps label="Super Admin sign-in steps" steps={["Send code", "Verify code", "Password"]} current={saStep} />

                      {saStep === 2 && (
                        <div className="ax-fade-up">
                          <span id="reg-otp-label" className="ax-label">Verification code</span>
                          <OtpInput
                            value={superAdminOtp}
                            onChange={(v) => { setSuperAdminOtp(v); setOtpTouched(false); }}
                            autoFocus
                            invalid={otpIncomplete}
                            disabled={otpVerifyLoading}
                            labelId="reg-otp-label"
                            describedBy={otpIncomplete ? "reg-otp-err" : undefined}
                          />
                          {otpIncomplete && (
                            <p id="reg-otp-err" className="axa-err"><Icon name="alert" size={13} /> Enter all 6 digits of the code.</p>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 13, color: "var(--ax-muted)", flexWrap: "wrap" }}>
                            Didn't get it?
                            <button
                              type="button"
                              onClick={handleSendSuperAdminOtp}
                              disabled={otpLoading || !form.email || !superEmailOk}
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

                    {otpVerified && <div className="ax-fade-up">{passwordField}</div>}
                  </>
                )}

                {/* ── Student / Teacher / Admin: 2 steps ── */}
                {!isSuperAdminFlow && (
                  <div>
                    <div className="axa-step-meta">
                      <span>Step {step} of 2</span>
                      <span>{step === 1 ? "Account" : DETAILS_LABEL[form.role]}</span>
                    </div>
                    <Steps label="Registration steps" steps={["Account", DETAILS_LABEL[form.role]]} current={step} />
                  </div>
                )}

                {!isSuperAdminFlow && step === 1 && (
                  <div key="step-1" className="axa-form ax-stagger">
                    <Field name="name" label="Full name" error={errOf("name")}>
                      <div className="axa-iconwrap">
                        <Icon name="user" size={17} />
                        <input
                          {...a11y("name")}
                          type="text"
                          required
                          autoComplete="name"
                          placeholder="John Doe"
                          className="ax-input"
                          value={form.name}
                          onChange={set("name")}
                        />
                      </div>
                    </Field>

                    <Field name="email" label="Email address" error={errOf("email")}>
                      <div className="axa-iconwrap">
                        <Icon name="mail" size={17} />
                        <input
                          {...a11y("email")}
                          type="email"
                          required
                          autoComplete="off"
                          placeholder="you@college.edu"
                          className="ax-input"
                          value={form.email}
                          onChange={set("email")}
                        />
                      </div>
                    </Field>

                    {passwordField}
                  </div>
                )}

                {!isSuperAdminFlow && step === 2 && (
                  <div key={`step-2-${form.role}`} className="axa-form ax-stagger">
                    <div className="axa-summary">
                      <Avatar name={form.name} size={36} />
                      <div className="axa-summary-text">
                        <div className="axa-summary-name">{form.name} · {roleMeta.label}</div>
                        <div className="axa-summary-email">{form.email}</div>
                      </div>
                      <button type="button" onClick={goBack} className="ax-btn ax-btn-ghost ax-btn-sm">Edit</button>
                    </div>

                    {form.role === "student" && (
                      <>
                        <div className="axa-grid2">
                          <Field name="age" label="Age" error={errOf("age")}>
                            <input
                              {...a11y("age")}
                              type="number"
                              min="3"
                              max="120"
                              required
                              inputMode="numeric"
                              placeholder="e.g. 19"
                              className="ax-input"
                              value={form.age}
                              onChange={set("age")}
                            />
                          </Field>
                          <Field name="gender" label="Gender" error={errOf("gender")}>
                            <select {...a11y("gender")} required className="ax-input" value={form.gender} onChange={set("gender")}>
                              <option value="">Select gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </Field>
                        </div>

                        <div className="axa-group">Parent / guardian</div>

                        <Field name="parentName" label="Parent/Guardian name" error={errOf("parentName")}>
                          <input
                            {...a11y("parentName")}
                            type="text"
                            required
                            placeholder="Parent full name"
                            className="ax-input"
                            value={form.parentName}
                            onChange={set("parentName")}
                          />
                        </Field>
                        <div className="axa-grid2">
                          <Field name="parentRelation" label="Relation" error={errOf("parentRelation")}>
                            <input
                              {...a11y("parentRelation")}
                              type="text"
                              required
                              placeholder="Father/Mother/Guardian"
                              className="ax-input"
                              value={form.parentRelation}
                              onChange={set("parentRelation")}
                            />
                          </Field>
                          <Field name="parentPhone" label="Parent phone" error={errOf("parentPhone")}>
                            <div className="axa-iconwrap">
                              <Icon name="phone" size={16} />
                              <input
                                {...a11y("parentPhone")}
                                type="tel"
                                required
                                placeholder="10-15 digit phone"
                                className="ax-input"
                                value={form.parentPhone}
                                onChange={set("parentPhone")}
                              />
                            </div>
                          </Field>
                        </div>
                        <Field
                          name="parentEmail"
                          label="Parent email"
                          error={errOf("parentEmail")}
                          hint="Daily absence summaries are sent to this address."
                        >
                          <div className="axa-iconwrap">
                            <Icon name="mail" size={17} />
                            <input
                              {...a11y("parentEmail", true)}
                              type="email"
                              required
                              placeholder="parent@example.com"
                              className="ax-input"
                              value={form.parentEmail}
                              onChange={set("parentEmail")}
                            />
                          </div>
                        </Field>
                      </>
                    )}

                    {form.role === "teacher" && (
                      <>
                        <div className="axa-grid2">
                          <Field name="primarySubject" label="Primary subject" error={errOf("primarySubject")}>
                            <input
                              {...a11y("primarySubject")}
                              type="text"
                              required
                              placeholder="e.g. Mathematics"
                              className="ax-input"
                              value={form.primarySubject}
                              onChange={set("primarySubject")}
                            />
                          </Field>
                          <Field name="secondarySubject" label="Secondary subject" optional>
                            <input
                              id="reg-secondarySubject"
                              type="text"
                              placeholder="e.g. Physics"
                              className="ax-input"
                              value={form.secondarySubject}
                              onChange={set("secondarySubject")}
                            />
                          </Field>
                        </div>
                        <div className="axa-grid2">
                          <Field name="yearsOfExperience" label="Experience (years)">
                            <input
                              id="reg-yearsOfExperience"
                              type="number"
                              min="0"
                              max="60"
                              inputMode="numeric"
                              className="ax-input"
                              value={form.yearsOfExperience}
                              onChange={e => setForm({ ...form, yearsOfExperience: Number(e.target.value || 0), hasExperience: Number(e.target.value || 0) > 0 })}
                            />
                          </Field>
                          <Field name="hasExperience" label="Has experience">
                            <select
                              id="reg-hasExperience"
                              className="ax-input"
                              value={form.hasExperience ? "yes" : "no"}
                              onChange={e => setForm({ ...form, hasExperience: e.target.value === "yes" })}
                            >
                              <option value="no">No</option>
                              <option value="yes">Yes</option>
                            </select>
                          </Field>
                        </div>
                        <Field name="highestQualification" label="Highest qualification" error={errOf("highestQualification")}>
                          <input
                            {...a11y("highestQualification")}
                            type="text"
                            required
                            placeholder="e.g. M.Sc, B.Ed"
                            className="ax-input"
                            value={form.highestQualification}
                            onChange={set("highestQualification")}
                          />
                        </Field>
                        <Field name="educationalBackground" label="Educational background" optional>
                          <textarea
                            id="reg-educationalBackground"
                            placeholder="Brief academic background"
                            className="ax-input"
                            style={{ minHeight: 84 }}
                            value={form.educationalBackground}
                            onChange={set("educationalBackground")}
                          />
                        </Field>
                      </>
                    )}

                    {form.role === "admin" && (
                      <>
                        <div className="axa-grid2">
                          <Field name="phone" label="Phone" error={errOf("phone")}>
                            <div className="axa-iconwrap">
                              <Icon name="phone" size={16} />
                              <input
                                {...a11y("phone")}
                                type="tel"
                                required
                                placeholder="Your contact number"
                                className="ax-input"
                                value={form.phone}
                                onChange={set("phone")}
                              />
                            </div>
                          </Field>
                          <Field name="department" label="Department" error={errOf("department")}>
                            <div className="axa-iconwrap">
                              <Icon name="building" size={16} />
                              <input
                                {...a11y("department")}
                                type="text"
                                required
                                placeholder="e.g. Administration"
                                className="ax-input"
                                value={form.department}
                                onChange={set("department")}
                              />
                            </div>
                          </Field>
                        </div>
                        <Field name="designation" label="Designation" error={errOf("designation")}>
                          <input
                            {...a11y("designation")}
                            type="text"
                            required
                            placeholder="e.g. Assistant Director"
                            className="ax-input"
                            value={form.designation}
                            onChange={set("designation")}
                          />
                        </Field>
                        <Field name="adminAccessReason" label="Why do you need admin access?" error={errOf("adminAccessReason")}>
                          <textarea
                            {...a11y("adminAccessReason")}
                            required
                            placeholder="Explain why admin access is needed"
                            className="ax-input"
                            style={{ minHeight: 84 }}
                            value={form.adminAccessReason}
                            onChange={set("adminAccessReason")}
                          />
                        </Field>
                      </>
                    )}
                  </div>
                )}

                {/* Messages from validation / the API */}
                {(error || info) && (
                  <div className="axa-alerts" style={{ marginBottom: 0 }} aria-live="polite">
                    {error && <Alert tone="danger">{error}</Alert>}
                    {info && <Alert tone="success">{info}</Alert>}
                  </div>
                )}

                {/* Actions */}
                <div className="axa-btn-row">
                  {!isSuperAdminFlow && step === 2 && (
                    <button type="button" onClick={goBack} disabled={loading} className="ax-btn ax-btn-secondary ax-btn-lg">
                      <Icon name="arrowLeft" size={16} /> Back
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitDisabled}
                    aria-busy={submitBusy}
                    className="ax-btn ax-btn-primary ax-btn-lg"
                  >
                    {submitBusy ? (
                      <><span className="ax-spinner" /> {submitBusyLabel}</>
                    ) : (
                      <>{submitLabel} <Icon name={submitIcon} size={16} /></>
                    )}
                  </button>
                </div>
              </form>

              <div className="axa-foot">
                Already have an account?{" "}
                <Link to="/login" className="axa-link">Sign in</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;
