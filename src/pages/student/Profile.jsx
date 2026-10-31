import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import studentService from "../../services/studentService";
import { ATTENDANCE_THRESHOLD } from "../../utils/constants";
import { PageHeader, CountUp, Skeleton, ProgressBar, Avatar, Alert, Icon } from "../../components/ui";

const fmtPct = (v) => `${Number.isInteger(v) ? v : Number(v).toFixed(1)}%`;

// Small attendance ring for the summary card.
const Ring = ({ value, low, size = 132, stroke = 12 }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }} role="img" aria-label={`Attendance ${fmtPct(pct)}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id="pf-ring-ok" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--ax-gold-2)" }} />
            <stop offset="100%" style={{ stopColor: "var(--ax-gold)" }} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#edf1f7" strokeWidth={stroke} />
        <circle
          className="pf-ring-arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={low ? "var(--ax-danger)" : "url(#pf-ring-ok)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ strokeDashoffset: circ * (1 - pct / 100), "--pf-ring-from": circ }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: low ? "var(--ax-danger)" : "var(--ax-text)" }}>
          <CountUp value={pct} decimals={Number.isInteger(pct) ? 0 : 1} suffix="%" />
        </span>
      </div>
    </div>
  );
};

// One tile in the info grid, with optional copy-to-clipboard.
const InfoTile = ({ icon, label, value, mono, copyable }) => {
  const [copied, setCopied] = useState(false);
  const empty = value === undefined || value === null || value === "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard not available – ignore */
    }
  };
  return (
    <div className="pf-tile">
      <span className="pf-tile-icon"><Icon name={icon} size={16} /></span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12, color: "var(--ax-muted)", fontWeight: 600 }}>{label}</div>
        <div
          style={{
            marginTop: 3,
            fontSize: 14,
            fontWeight: mono ? 700 : 600,
            color: empty ? "var(--ax-muted)" : mono ? "var(--ax-blue)" : "var(--ax-text)",
            fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "inherit",
            overflowWrap: "anywhere",
          }}
        >
          {empty ? "—" : value}
        </div>
      </div>
      {copyable && !empty && (
        <button type="button" className="ax-btn ax-btn-ghost ax-btn-sm pf-copy" onClick={copy} aria-label={copied ? `${label} copied` : `Copy ${label}`} title={copied ? "Copied" : "Copy"}>
          <Icon name={copied ? "check" : "clipboard"} size={14} style={copied ? { color: "var(--ax-success)" } : undefined} />
        </button>
      )}
    </div>
  );
};

const ProfileSkeleton = () => (
  <>
    <Skeleton height={150} radius={16} />
    <div className="pf-grid">
      <div className="ax-card ax-card-pad" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={62} radius={12} />)}
      </div>
      <div className="ax-card ax-card-pad" style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
        <Skeleton width={132} height={132} radius="50%" />
        <Skeleton height={10} />
        <Skeleton height={40} />
      </div>
    </div>
  </>
);

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await studentService.getMyProfile();
        setProfile(res.data || res.student || res);
        setLoadError("");
      } catch (err) {
        setLoadError(err?.response?.data?.message || "Could not load your full profile.");
        setProfile({
          name: user?.name || "Student",
          email: user?.email || "",
          rollNumber: "",
          section: "",
          phone: "",
          attendancePercentage: 0,
          joinedAt: null,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const info = profile || {};
  const pct = info.attendancePercentage ?? 0;
  const isLow = pct < ATTENDANCE_THRESHOLD;
  const gap = Math.max(0, ATTENDANCE_THRESHOLD - pct);

  const fields = [
    { label: "Full Name", value: info.name, icon: "user" },
    { label: "Email", value: info.email, icon: "mail", copyable: true },
    { label: "Registration No.", value: info.registrationNumber, icon: "key", mono: true, copyable: true },
    { label: "Roll Number", value: info.rollNumber, icon: "hash", mono: true },
    { label: "Semester", value: info.semester ? `Semester ${info.semester}` : "", icon: "layers" },
    { label: "Section", value: info.section ? `Section ${info.section}` : "", icon: "building" },
    { label: "Parent Contact", value: info.phone || "Not provided", icon: "phone", copyable: Boolean(info.phone) },
    {
      label: "Member Since",
      value: info.joinedAt
        ? new Date(info.joinedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
        : "",
      icon: "calendar",
    },
  ];

  return (
    <div className="ax-page">
      <div className="ax-container" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <PageHeader
          eyebrow="Student"
          title="My Profile"
          subtitle="Your academic details and attendance standing."
          actions={
            <Link to="/student/dashboard" className="ax-btn ax-btn-secondary">
              <Icon name="dashboard" size={16} /> Dashboard
            </Link>
          }
        />

        {loading ? (
          <ProfileSkeleton />
        ) : (
          <div className="ax-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {loadError && (
              <Alert tone="warning" title="Showing basic account details">
                {loadError}
              </Alert>
            )}

            {/* Header card */}
            <section className="ax-hero pf-hero" aria-label="Profile summary">
              <div className="pf-avatar-ring">
                <Avatar name={info.name} size={76} />
              </div>
              <div style={{ minWidth: 0, flex: 1, position: "relative", zIndex: 1 }}>
                <h2 style={{ margin: 0, fontSize: "clamp(22px, 3.4vw, 28px)", fontWeight: 800, letterSpacing: "-0.02em", overflowWrap: "anywhere" }}>
                  {info.name || "Student"}
                </h2>
                {info.email && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, color: "rgba(255,255,255,0.72)", fontSize: 14, minWidth: 0 }}>
                    <Icon name="mail" size={14} />
                    <span style={{ overflowWrap: "anywhere" }}>{info.email}</span>
                  </div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                  <span className="pf-pill"><Icon name="teacher" size={13} /> Student</span>
                  {info.semester && <span className="pf-pill">Semester {info.semester}</span>}
                  {info.section && <span className="pf-pill">Section {info.section}</span>}
                  <span className={`pf-pill ${isLow ? "is-low" : "is-ok"}`}>
                    <span className="ax-dot" aria-hidden="true" /> {fmtPct(pct)} Attendance
                  </span>
                </div>
              </div>
            </section>

            <div className="pf-grid">
              {/* Info grid */}
              <section className="ax-card ax-card-pad" aria-labelledby="pf-info-title">
                <h3 id="pf-info-title" className="ax-section-title">Personal Information</h3>
                <p className="ax-section-sub" style={{ marginBottom: 16 }}>Details on record with the college office.</p>
                <div className="pf-tiles">
                  {fields.map((f) => <InfoTile key={f.label} {...f} />)}
                </div>
              </section>

              {/* Attendance summary */}
              <section className="ax-card ax-card-pad pf-att" aria-labelledby="pf-att-title">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, alignSelf: "stretch" }}>
                  <h3 id="pf-att-title" className="ax-section-title">Attendance</h3>
                  <span className={`ax-badge ${isLow ? "ax-badge-danger" : "ax-badge-success"}`}>
                    <Icon name={isLow ? "alert" : "checkCircle"} size={12} />
                    {isLow ? "Below threshold" : "Good standing"}
                  </span>
                </div>

                <Ring value={pct} low={isLow} />

                <div style={{ alignSelf: "stretch" }}>
                  <div style={{ position: "relative" }}>
                    <ProgressBar value={pct} threshold={ATTENDANCE_THRESHOLD} />
                    <span className="pf-marker" style={{ left: `${ATTENDANCE_THRESHOLD}%` }} aria-hidden="true" />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--ax-muted)", fontVariantNumeric: "tabular-nums" }}>
                    <span>0%</span>
                    <span style={{ color: "var(--ax-text-2)", fontWeight: 600 }}>Required: {ATTENDANCE_THRESHOLD}%</span>
                    <span>100%</span>
                  </div>
                </div>

                {isLow ? (
                  <Alert tone="danger">
                    Your attendance is below {ATTENDANCE_THRESHOLD}%. Attend more classes to avoid exam restrictions.
                    {gap > 0 && <> You're <strong>{fmtPct(Number(gap.toFixed(2)))}</strong> short.</>}
                  </Alert>
                ) : (
                  <Alert tone="success">
                    You're <strong>{fmtPct(Number((pct - ATTENDANCE_THRESHOLD).toFixed(2)))}</strong> above the requirement. Keep it up!
                  </Alert>
                )}

                <Link to="/student/dashboard" className="ax-btn ax-btn-primary" style={{ alignSelf: "stretch" }}>
                  View detailed attendance <Icon name="arrowRight" size={15} />
                </Link>
              </section>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .pf-hero { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .pf-avatar-ring { position: relative; z-index: 1; padding: 4px; border-radius: 26px; background: linear-gradient(135deg, var(--ax-gold-2), rgba(201,168,76,0.25)); box-shadow: 0 8px 24px rgba(0,0,0,0.25); line-height: 0; }
        .pf-pill { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.16); color: rgba(255,255,255,0.9); }
        .pf-pill.is-ok { color: #86efac; }
        .pf-pill.is-low { color: #fca5a5; }

        .pf-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 360px); gap: 20px; align-items: start; }
        .pf-tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
        .pf-tile { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--ax-border); background: var(--ax-surface-2); transition: border-color .2s ease, background .2s ease, transform .2s var(--ax-ease); min-width: 0; }
        .pf-tile:hover { border-color: var(--ax-border-strong); background: var(--ax-surface); transform: translateY(-1px); }
        .pf-tile-icon { flex: none; width: 34px; height: 34px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; background: var(--ax-blue-soft); color: var(--ax-blue); }
        .pf-copy { opacity: 0; transition: opacity .18s ease, background-color .18s ease; padding: 0 8px; flex: none; }
        .pf-tile:hover .pf-copy, .pf-copy:focus-visible { opacity: 1; }
        @media (hover: none) { .pf-copy { opacity: 1; } }

        .pf-att { display: flex; flex-direction: column; align-items: center; gap: 18px; }
        .pf-marker { position: absolute; top: -3px; width: 2px; height: 14px; border-radius: 2px; background: var(--ax-navy); opacity: .55; transform: translateX(-1px); }
        .pf-ring-arc { animation: pf-ring 1.3s var(--ax-ease) both; }
        @keyframes pf-ring { from { stroke-dashoffset: var(--pf-ring-from); } }

        @media (max-width: 900px) {
          .pf-grid { grid-template-columns: minmax(0, 1fr); }
        }
        @media (max-width: 640px) {
          .pf-hero { padding: 22px; }
          .pf-tiles { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </div>
  );
};

export default Profile;
