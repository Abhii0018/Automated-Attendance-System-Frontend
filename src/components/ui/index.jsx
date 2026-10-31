import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

export { Icon };

/*
  Shared UI building blocks. Styles live in src/index.css (ax-* classes).
*/

// Animated number: counts up from 0 to `value` once it changes.
export const CountUp = ({ value, decimals = 0, suffix = "", duration = 900 }) => {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (target - from) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return (
    <>
      {display.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </>
  );
};

// Top-of-page header: eyebrow, title, subtitle and optional actions on the right.
export const PageHeader = ({ eyebrow, title, subtitle, actions, children }) => (
  <div className="ax-fade-up" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
    <div style={{ minWidth: 0 }}>
      {eyebrow && (
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ax-blue)", marginBottom: 6 }}>
          {eyebrow}
        </div>
      )}
      <h1 style={{ fontSize: "clamp(24px, 3vw, 30px)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ax-text)", margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ margin: "6px 0 0", color: "var(--ax-muted)", fontSize: 14 }}>{subtitle}</p>}
      {children}
    </div>
    {actions && <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{actions}</div>}
  </div>
);

const TONES = {
  navy: { fg: "var(--ax-navy)", bg: "#e8ecf6" },
  blue: { fg: "var(--ax-blue)", bg: "var(--ax-blue-soft)" },
  gold: { fg: "#9a7420", bg: "var(--ax-gold-soft)" },
  success: { fg: "var(--ax-success)", bg: "var(--ax-success-soft)" },
  danger: { fg: "var(--ax-danger)", bg: "var(--ax-danger-soft)" },
  warning: { fg: "var(--ax-warning)", bg: "var(--ax-warning-soft)" },
};

// KPI tile. Numeric values count up; strings are shown as-is.
export const StatCard = ({ label, value, icon, tone = "navy", hint, suffix = "", decimals = 0, loading = false }) => {
  const t = TONES[tone] || TONES.navy;
  return (
    <div className="ax-card ax-card-hover ax-card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ax-muted)" }}>{label}</span>
        {icon && (
          <span style={{ width: 34, height: 34, borderRadius: 10, background: t.bg, color: t.fg, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={icon} size={17} />
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton height={30} width="55%" />
      ) : (
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: tone === "danger" ? t.fg : "var(--ax-text)", lineHeight: 1.1 }}>
          {typeof value === "number" ? <CountUp value={value} suffix={suffix} decimals={decimals} /> : value}
        </div>
      )}
      {hint && <div style={{ fontSize: 12, color: "var(--ax-muted)" }}>{hint}</div>}
    </div>
  );
};

export const Skeleton = ({ height = 16, width = "100%", radius, style }) => (
  <div className="ax-skeleton" style={{ height, width, borderRadius: radius, ...style }} />
);

// Placeholder rows while a list/table loads.
export const SkeletonRows = ({ rows = 5, height = 44, gap = 10 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap }}>
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} height={height} />
    ))}
  </div>
);

export const EmptyState = ({ icon = "info", title, message, action }) => (
  <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--ax-muted)" }}>
    <div style={{ width: 48, height: 48, margin: "0 auto 14px", borderRadius: 14, background: "var(--ax-surface-2)", border: "1px solid var(--ax-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ax-muted)" }}>
      <Icon name={icon} size={22} />
    </div>
    {title && <div style={{ fontWeight: 700, color: "var(--ax-text)", fontSize: 15 }}>{title}</div>}
    {message && <div style={{ fontSize: 13, marginTop: 4, maxWidth: 380, marginInline: "auto" }}>{message}</div>}
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);

// Attendance bar: red below threshold, gold at/above.
export const ProgressBar = ({ value = 0, threshold = 75, color }) => {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const fill = color || (pct < threshold ? "var(--ax-danger)" : "linear-gradient(90deg, var(--ax-gold-2), var(--ax-gold))");
  return (
    <div className="ax-progress">
      <span style={{ width: `${pct}%`, background: fill }} />
    </div>
  );
};

export const Avatar = ({ name = "", size = 36 }) => {
  const initials = String(name).trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        background: "linear-gradient(135deg, var(--ax-navy), var(--ax-navy-2))",
        color: "var(--ax-gold-2)",
        fontWeight: 700,
        fontSize: Math.round(size * 0.38),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
};

// Inline alert box for errors / info / success messages.
export const Alert = ({ tone = "info", title, children, onClose }) => {
  const map = {
    info: { bg: "var(--ax-blue-soft)", border: "#c7d6fe", fg: "#1e3a8a", icon: "info" },
    success: { bg: "var(--ax-success-soft)", border: "#bbf7d0", fg: "#166534", icon: "checkCircle" },
    warning: { bg: "var(--ax-warning-soft)", border: "#fde68a", fg: "#92400e", icon: "alert" },
    danger: { bg: "var(--ax-danger-soft)", border: "#fecaca", fg: "#991b1b", icon: "alert" },
  };
  const s = map[tone] || map.info;
  return (
    <div role={tone === "danger" ? "alert" : "status"} className="ax-fade-up" style={{ display: "flex", gap: 12, alignItems: "flex-start", background: s.bg, border: `1px solid ${s.border}`, color: s.fg, borderRadius: 12, padding: "12px 14px", fontSize: 14 }}>
      <Icon name={s.icon} size={18} style={{ marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={{ fontWeight: 700, marginBottom: children ? 2 : 0 }}>{title}</div>}
        {children}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="ax-btn ax-btn-ghost ax-btn-sm" style={{ height: 24, padding: "0 6px", color: s.fg }}>
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  );
};
