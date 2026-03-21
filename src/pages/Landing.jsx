import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROLE_REDIRECTS } from "../utils/constants";

// ─── Assets ───────────────────────────────────────────────────────────────────
import heroBg from "../assets/college1.jpeg";
import campusImg from "../assets/college.jpeg";
import studentsImg from "../assets/students1.jpeg";
import classImg from "../assets/teachers.jpeg";
import gradImg from "../assets/students.jpeg";

// ─── Responsive CSS (injected once into <head>) ────────────────────────────
const RESPONSIVE_CSS = `
  .land-hero      { grid-template-columns: 1fr 1fr; }
  .land-hero-left { padding: 80px 60px 80px 80px; }
  .land-hero-img  { min-height: 500px; }
  .land-hamburger { display: none; flex-direction: column; gap: 5px; }
  .land-nav-links, .land-nav-auth { display: flex; }
  .land-two-col   { grid-template-columns: 1fr 1fr; }
  .land-stats     { grid-template-columns: repeat(4,1fr); }
  .land-features  { grid-template-columns: repeat(3,1fr); }
  .land-roles     { grid-template-columns: repeat(3,1fr); }
  .land-tests     { grid-template-columns: repeat(3,1fr); }
  .land-ftgrid    { grid-template-columns: 2fr 1fr 1fr 1fr; }
  .land-about-badge { display: flex; }
  @media (max-width: 900px) {
    .land-hero      { grid-template-columns: 1fr !important; }
    .land-hero-left { padding: 70px 28px 44px !important; }
    .land-hero-img  { min-height: 260px !important; }
    .land-hamburger { display: flex !important; }
    .land-nav-links, .land-nav-auth { display: none !important; }
    .land-two-col   { grid-template-columns: 1fr !important; gap: 36px !important; }
    .land-stats     { grid-template-columns: repeat(2,1fr) !important; }
    .land-features  { grid-template-columns: 1fr !important; }
    .land-roles     { grid-template-columns: 1fr !important; }
    .land-tests     { grid-template-columns: 1fr !important; }
    .land-ftgrid    { grid-template-columns: 1fr 1fr !important; gap: 28px !important; }
    .land-about-badge { display: none !important; }
    .land-section   { padding: 60px 0 !important; }
  }
  @media (max-width: 480px) {
    .land-stats  { grid-template-columns: 1fr 1fr !important; }
    .land-ftgrid { grid-template-columns: 1fr !important; }
  }
`;

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const C = {
  navy: "#0a1628",
  navyMid: "#102040",
  gold: "#c9a84c",
  goldL: "#e8c96a",
  white: "#ffffff",
  light: "#f4f6fa",
  mid: "#6b7280",
  border: "#dde3ef",
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "About", href: "about" },
  { label: "Features", href: "features" },
  { label: "Portals", href: "programs" },
  { label: "Contact", href: "contact" },
];

const STATS = [
  { value: "10,000+", label: "Students Enrolled" },
  { value: "500+", label: "Faculty Members" },
  { value: "98%", label: "Attendance Accuracy" },
  { value: "50+", label: "Programs Offered" },
];

const FEATURES = [
  { icon: "📊", title: "Real-Time Tracking", desc: "Live dashboards with instant updates across every class and section." },
  { icon: "🎓", title: "Role-Based Access", desc: "Admin, Teacher, and Student portals with tailored tools and permissions." },
  { icon: "🔔", title: "Smart Alerts", desc: "Automatic low-attendance warnings before students cross the 75% threshold." },
  { icon: "📋", title: "Detailed Reports", desc: "Subject-wise, section-wise and date-range reports at a single click." },
  { icon: "🔒", title: "Secure & Reliable", desc: "JWT auth, encrypted data, and 99.9% uptime — nothing is ever lost." },
  { icon: "⚡", title: "Lightning Fast", desc: "Sub-75ms API responses for instant attendance marking, any class size." },
];

const ROLES = [
  {
    role: "Administrator", icon: "🏛️",
    perks: ["Manage all student accounts", "Institution-wide analytics", "Monitor low-attendance students", "Section & subject reports"],
  },
  {
    role: "Teacher", icon: "👨‍🏫",
    perks: ["Mark attendance by section & subject", "Track present / absent / late", "View class-level summaries", "Filter by date range"],
  },
  {
    role: "Student", icon: "👩‍🎓",
    perks: ["Check personal attendance %", "Subject-wise breakdowns", "Receive low-attendance warnings", "Manage personal profile"],
  },
];

const TESTIMONIALS = [
  { name: "Dr. Priya Sharma", role: "Head of Computer Science", quote: "AttendX transformed our department. Reports that used to take hours are now instant." },
  { name: "Rahul Mehta", role: "Student, B.Tech CSE", quote: "I can track my attendance anytime. The alerts help me plan leave without crossing 75%." },
  { name: "Prof. Anjali Singh", role: "Senior Faculty", quote: "Marking attendance in seconds means I can focus entirely on teaching." },
];

// ─── Component ────────────────────────────────────────────────────────────────
const Landing = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role)
      navigate(ROLE_REDIRECTS[user.role] || "/login", { replace: true });
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Inject responsive CSS
  useEffect(() => {
    const styleId = "land-responsive-css";
    if (!document.getElementById(styleId)) {
      const el = document.createElement("style");
      el.id = styleId;
      el.textContent = RESPONSIVE_CSS;
      document.head.appendChild(el);
    }
    return () => document.getElementById(styleId)?.remove();
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', 'Inter', Arial, sans-serif", color: C.navy, overflowX: "hidden" }}>

      {/* ══════════════════════════════ NAVBAR ══════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? "rgba(10,22,40,0.96)" : "rgba(10,22,40,0.30)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: scrolled ? `2px solid ${C.gold}` : "2px solid rgba(201,168,76,0.15)",
        transition: "all 0.4s ease",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 28px", height: "70px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>🎓</div>
            <div>
              <div style={{ color: C.white, fontWeight: 900, fontSize: "18px", letterSpacing: "0.5px" }}>AttendX</div>
              <div style={{ color: C.gold, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase" }}>ATTENDANCE OS</div>
            </div>
          </div>

          {/* Desktop Links */}
          <div className="land-nav-links" style={{ gap: "4px" }}>
            {NAV_LINKS.map((l) => (
              <button key={l.label} onClick={() => scrollTo(l.href)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.88)", fontSize: "14px", padding: "8px 16px", cursor: "pointer", borderRadius: "6px", fontWeight: 500, transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = C.gold}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.88)"}
              >{l.label}</button>
            ))}
          </div>

          {/* Auth (Desktop) */}
          <div className="land-nav-auth" style={{ gap: "10px", alignItems: "center" }}>
            {isAuthenticated ? (
              <Link to={ROLE_REDIRECTS[user?.role] || "/"} style={S.btnGold}>Dashboard →</Link>
            ) : (
              <>
                <Link to="/login" style={S.btnGhost}>Sign In</Link>
                <Link to="/register" style={S.btnGold}>Register Now</Link>
              </>
            )}
          </div>

          {/* Hamburger (Mobile) */}
          <button
            className="land-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "6px" }}
            aria-label="Toggle menu"
          >
            <span style={{ display: "block", width: "23px", height: "2px", background: "#fff", borderRadius: "2px", transition: "all 0.3s", transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
            <span style={{ display: "block", width: "23px", height: "2px", background: "#fff", borderRadius: "2px", transition: "all 0.3s", opacity: menuOpen ? 0 : 1, margin: "4px 0" }} />
            <span style={{ display: "block", width: "23px", height: "2px", background: "#fff", borderRadius: "2px", transition: "all 0.3s", transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
          </button>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div style={{ background: "rgba(10,22,40,0.97)", backdropFilter: "blur(16px)", borderTop: `1px solid rgba(201,168,76,0.2)`, padding: "16px 28px 22px", display: "flex", flexDirection: "column", gap: "2px" }}>
            {NAV_LINKS.map((l) => (
              <button key={l.label} onClick={() => scrollTo(l.href)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.85)", fontSize: "15px", padding: "12px 0", cursor: "pointer", textAlign: "left", fontWeight: 500, borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >{l.label}</button>
            ))}
            <div style={{ display: "flex", gap: "10px", paddingTop: "14px" }}>
              <Link to="/login" style={{ ...S.btnGhost, flex: 1, textAlign: "center", padding: "10px", fontSize: "13px" }} onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/register" style={{ ...S.btnGold, flex: 1, textAlign: "center", padding: "10px", fontSize: "13px" }} onClick={() => setMenuOpen(false)}>Register</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════ HERO ════════════════════════════════ */}
      {/* Split layout: transparent nav floats over hero; left is navy, right is clear image */}
      <section className="land-hero" style={{ display: "grid", minHeight: "100vh", paddingTop: "70px" }}>

        {/* LEFT – solid navy panel, perfectly crisp */}
        <div className="land-hero-left" style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {/* Decorative accent */}
          <div style={{ position: "absolute", top: "0", left: "0", right: "0", height: "4px", background: `linear-gradient(to right, ${C.gold}, ${C.goldL}, ${C.gold})` }} />
          <div style={{ position: "absolute", bottom: "-60px", right: "-60px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(201,168,76,0.07)", pointerEvents: "none" }} />

          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(201,168,76,0.15)", border: `1px solid rgba(201,168,76,0.35)`, borderRadius: "30px", padding: "7px 18px", marginBottom: "28px", width: "fit-content" }}>
            <span style={{ color: C.gold, fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}>⚡ Smart Campus Operations</span>
          </div>

          <h1 style={{ color: C.white, fontSize: "clamp(32px, 4vw, 58px)", fontWeight: 900, lineHeight: 1.1, margin: "0 0 12px", letterSpacing: "-1px" }}>
            The Modern
          </h1>
          <h1 style={{ color: C.gold, fontSize: "clamp(32px, 4vw, 58px)", fontWeight: 900, lineHeight: 1.1, margin: "0 0 24px", letterSpacing: "-1px" }}>
            Attendance OS
          </h1>

          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "16px", lineHeight: 1.8, margin: "0 0 36px", maxWidth: "440px" }}>
            A unified digital platform empowering modern institutions to automate tracking, scale academic analytics, and eliminate administrative overhead.
          </p>

          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "44px" }}>
            {isAuthenticated ? (
              <Link to={ROLE_REDIRECTS[user?.role] || "/"} style={S.btnHeroGold}>Go to Dashboard →</Link>
            ) : (
              <>
                <Link to="/register" style={S.btnHeroGold}>Get Started →</Link>
                <Link to="/login" style={S.btnHeroGhost}>Sign In</Link>
              </>
            )}
          </div>

          {/* Quick program badges */}
          <div className="land-quick-links" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "4px" }}>Platform Modules</div>
            {["System Administration", "Faculty Analytics Setup", "Student Access Layer"].map((t) => (
              <button key={t} onClick={() => scrollTo("programs")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.78)", padding: "9px 18px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", textAlign: "left", width: "fit-content", transition: "all 0.2s", fontWeight: 500 }}
                onMouseEnter={e => { e.target.style.background = "rgba(201,168,76,0.15)"; e.target.style.borderColor = "rgba(201,168,76,0.4)"; e.target.style.color = C.gold; }}
                onMouseLeave={e => { e.target.style.background = "rgba(255,255,255,0.06)"; e.target.style.borderColor = "rgba(255,255,255,0.14)"; e.target.style.color = "rgba(255,255,255,0.78)"; }}
              >
                {t} ›
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT – clear, full visible campus image */}
        <div className="land-hero-img" style={{ position: "relative", overflow: "hidden" }}>
          <img src={heroBg} alt="University Campus" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", display: "block" }} />
          {/* Just a subtle left-edge fade to blend panels */}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${C.navyMid} 0%, transparent 18%)` }} />
          {/* Floating info card */}
          <div style={{ position: "absolute", bottom: "40px", right: "32px", background: "rgba(10,22,40,0.92)", backdropFilter: "blur(16px)", border: `1px solid rgba(201,168,76,0.4)`, borderRadius: "14px", padding: "20px 26px", display: "flex", gap: "24px" }}>
            {[["150+", "Years Est."], ["A+", "NAAC Grade"], ["500+", "Faculty"]].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ color: C.gold, fontWeight: 900, fontSize: "22px" }}>{v}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", marginTop: "2px" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ ANNOUNCEMENT TICKER ════════════ */}
      <div style={{ background: C.gold, padding: "10px 28px", display: "flex", alignItems: "center", gap: "14px" }}>
        <span style={{ background: C.navy, color: C.gold, padding: "3px 12px", borderRadius: "4px", fontSize: "11px", fontWeight: 800, letterSpacing: "1.5px", whiteSpace: "nowrap" }}>NEW</span>
        <marquee style={{ color: C.navy, fontSize: "13px", fontWeight: 600 }}>
          &nbsp;&nbsp;🚀 AttendX v2.0 is live! Explore the drastically redesigned UI templates.&nbsp;&nbsp;|&nbsp;&nbsp;
          📩 Automated low-attendance SMS functionality is now fully integrated.&nbsp;&nbsp;|&nbsp;&nbsp;
          🔒 World-class JWT Auth ensures your academic data is safer than ever.
        </marquee>
      </div>

      {/* ════════════ STATS BAR ════════════ */}
      <section style={{ background: C.navyMid }}>
        <div className="land-stats" style={{ maxWidth: "1200px", margin: "0 auto", display: "grid" }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ padding: "36px 24px", textAlign: "center", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
              <div style={{ color: C.gold, fontSize: "clamp(26px,3vw,42px)", fontWeight: 900, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════ ABOUT ════════════ */}
      <section id="about" className="land-section" style={{ padding: "100px 0", background: C.white }}>
        <div style={S.container}>
          <div className="land-two-col" style={{ display: "grid", gap: "64px", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <img src={campusImg} alt="Campus" style={{ width: "100%", height: "400px", objectFit: "cover", borderRadius: "12px", display: "block", boxShadow: "0 24px 64px rgba(10,22,40,0.18)" }} />
              <div className="land-about-badge" style={{ position: "absolute", bottom: "-28px", right: "-28px", background: C.white, borderRadius: "14px", padding: "20px 24px", boxShadow: "0 10px 40px rgba(0,0,0,0.14)", display: "flex", alignItems: "center", gap: "14px", border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: "32px" }}>🏆</span>
                <div>
                  <div style={{ fontWeight: 800, color: C.navy, fontSize: "18px" }}>Est. 1998</div>
                  <div style={{ color: C.mid, fontSize: "12px" }}>Excellence in Education</div>
                </div>
              </div>
            </div>
            <div style={{ paddingLeft: "8px" }}>
              <span style={S.badge}>About AttendX</span>
              <h2 style={S.h2}>Empowering Institutions with Precision & Accountability</h2>
              <p style={S.para}>AttendX provides world-class educational organizations with cutting-edge academic administration software. Our proprietary tech guarantees every lecture is effortlessly logged, every student is accounted for, and your entire faculty is empowered.</p>
              <p style={S.para}>With three secure, dedicated workspaces seamlessly connecting Administrators, Faculty, and Students — we deliver unparalleled operational clarity directly to the heart of your campus.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", margin: "24px 0 32px" }}>
                {["NAAC A+ Accredited", "ISO Certified", "100% Digital Campus"].map((h) => (
                  <span key={h} style={{ background: "#eef2fb", color: C.navy, padding: "7px 16px", borderRadius: "30px", fontSize: "13px", fontWeight: 600, border: `1px solid ${C.border}` }}>✓ {h}</span>
                ))}
              </div>
              <Link to="/register" style={S.btnNavy}>Explore Programs →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ FEATURES ════════════ */}
      <section id="features" className="land-section" style={{ padding: "100px 0", background: C.light }}>
        <div style={S.container}>
          <div style={S.sectionHeader}>
            <span style={S.badge}>Platform Features</span>
            <h2 style={S.h2}>Everything Your Institution Needs</h2>
            <p style={{ color: C.mid, fontSize: "16px", maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>Built specifically for universities and colleges that take attendance seriously.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "24px" }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "36px 28px", boxShadow: "0 4px 20px rgba(10,22,40,0.06)", transition: "all 0.3s ease", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(10,22,40,0.14)"; e.currentTarget.style.borderColor = C.gold; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(10,22,40,0.06)"; e.currentTarget.style.borderColor = C.border; }}
              >
                <div style={{ fontSize: "40px", marginBottom: "18px" }}>{f.icon}</div>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: C.navy, marginBottom: "10px", margin: "0 0 10px" }}>{f.title}</h3>
                <p style={{ color: C.mid, fontSize: "14px", lineHeight: 1.75, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ ROLES / PORTALS ════════════ */}
      <section id="programs" className="land-section" style={{ padding: "100px 0", background: C.white }}>
        <div style={S.container}>
          <div style={S.sectionHeader}>
            <span style={S.badge}>Who Uses AttendX?</span>
            <h2 style={S.h2}>One Platform, Three Perspectives</h2>
            <p style={{ color: C.mid, fontSize: "16px" }}>Tailored dashboards and tools designed for every role in your institution.</p>
          </div>
          <div className="land-roles" style={{ display: "grid", gap: "28px" }}>
            {ROLES.map((r, i) => (
              <div key={i} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: "14px", padding: "38px 30px", boxShadow: "0 4px 24px rgba(10,22,40,0.06)", transition: "all 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.boxShadow = "0 16px 48px rgba(10,22,40,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "0 4px 24px rgba(10,22,40,0.06)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px", paddingBottom: "20px", borderBottom: `1px solid ${C.light}` }}>
                  <span style={{ fontSize: "34px" }}>{r.icon}</span>
                  <h3 style={{ fontSize: "20px", fontWeight: 800, color: C.navy, margin: 0 }}>{r.role}</h3>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {r.perks.map((p, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "center", gap: "10px", color: "#444", fontSize: "14px" }}>
                      <span style={{ color: C.gold, fontWeight: 800, fontSize: "16px", flexShrink: 0 }}>✓</span>{p}
                    </li>
                  ))}
                </ul>
                <Link to="/register" style={{ display: "block", textAlign: "center", padding: "12px", border: `2px solid ${C.navy}`, borderRadius: "8px", color: C.navy, textDecoration: "none", fontSize: "13px", fontWeight: 700, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.target.style.background = C.navy; e.target.style.color = C.gold; }}
                  onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = C.navy; }}
                >
                  Get Started as {r.role} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ CAMPUS LIFE BANNER ════════════ */}
      <section style={{ position: "relative", height: "440px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <img src={gradImg} alt="Graduates" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(10,22,40,0.88) 0%, rgba(10,22,40,0.6) 100%)" }} />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 24px" }}>
          <h2 style={{ color: C.white, fontSize: "clamp(26px,4vw,46px)", fontWeight: 900, margin: "0 0 16px", textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>Engineered for Deep Academic Excellence</h2>
          <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "17px", maxWidth: "540px", margin: "0 auto 32px", lineHeight: 1.7 }}>
            Join forward-thinking, technically driven institutions who trust the AttendX architecture to scale their student engagement to unprecedented heights.
          </p>
          <Link to="/register" style={S.btnGold}>Join Us Today →</Link>
        </div>
      </section>

      {/* ════════════ STUDENTS SECTION ════════════ */}
      <section className="land-section" style={{ padding: "100px 0", background: C.light }}>
        <div style={S.container}>
          <div className="land-two-col" style={{ display: "grid", gap: "64px", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <span style={S.badge}>Student Experience</span>
              <h2 style={{ ...S.h2, marginTop: "14px" }}>Empowering Every Student</h2>
              <p style={S.para}>Students get their own dedicated portal to track attendance percentages, view subject-wise breakdowns, and receive proactive alerts before attendance becomes a concern.</p>
              <div style={{ display: "flex", gap: "36px", marginTop: "28px", flexWrap: "wrap" }}>
                {[["Live %", "Real-time attendance"], ["Alerts", "Auto 75% warnings"], ["History", "Full record access"]].map(([v, l]) => (
                  <div key={v}>
                    <div style={{ fontWeight: 900, fontSize: "24px", color: C.navy }}>{v}</div>
                    <div style={{ fontSize: "13px", color: C.mid, marginTop: "4px" }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <img src={studentsImg} alt="Students" style={{ width: "100%", height: "360px", objectFit: "cover", borderRadius: "12px", boxShadow: "0 24px 64px rgba(10,22,40,0.15)" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ CLASSROOM SECTION ════════════ */}
      <section className="land-section" style={{ padding: "100px 0", background: C.white }}>
        <div style={S.container}>
          <div className="land-two-col-rev" style={{ display: "grid", gap: "64px", alignItems: "center" }}>
            <div>
              <img src={classImg} alt="Classroom" style={{ width: "100%", height: "360px", objectFit: "cover", borderRadius: "12px", boxShadow: "0 24px 64px rgba(10,22,40,0.15)" }} />
            </div>
            <div>
              <span style={S.badge}>Faculty Experience</span>
              <h2 style={{ ...S.h2, marginTop: "14px" }}>Let Educators Focus on Education</h2>
              <p style={S.para}>Faculty members get a highly-optimized interface allowing them to reliably mark entire classrooms in mere seconds. Surface subject-level insights and drop the chaotic organizational paperwork.</p>
              <Link to="/login" style={{ ...S.btnNavy, marginTop: "24px", display: "inline-block" }}>Access Teacher Portal →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ TESTIMONIALS ════════════ */}
      <section className="land-section" style={{ padding: "100px 0", background: C.navyMid }}>
        <div style={S.container}>
          <div style={{ ...S.sectionHeader, marginBottom: "48px" }}>
            <h2 style={{ ...S.h2, color: C.white }}>What Our Community Says</h2>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "16px" }}>Hear from the people who use AttendX every day.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "24px" }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "32px 28px" }}>
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "15px", lineHeight: 1.8, marginBottom: "24px", fontStyle: "italic", margin: "0 0 24px" }}>"{t.quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: C.gold, color: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "18px", flexShrink: 0 }}>{t.name.charAt(0)}</div>
                  <div>
                    <div style={{ color: C.white, fontWeight: 700, fontSize: "14px" }}>{t.name}</div>
                    <div style={{ color: C.gold, fontSize: "12px", marginTop: "2px" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ CTA ════════════ */}
      <section id="contact" style={{ padding: "100px 0", background: C.light }}>
        <div style={S.container}>
          <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`, borderRadius: "20px", padding: "70px 48px", textAlign: "center", boxShadow: "0 20px 60px rgba(10,22,40,0.2)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: `linear-gradient(to right, ${C.gold}, ${C.goldL}, ${C.gold})` }} />
            <span style={{ fontSize: "52px" }}>🎓</span>
            <h2 style={{ color: C.white, fontSize: "clamp(26px,3vw,40px)", fontWeight: 900, margin: "16px 0 14px" }}>Ready to Transform Your Campus?</h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", maxWidth: "500px", margin: "0 auto 36px", lineHeight: 1.75 }}>
              Launch your digital attendance revolution with the AttendX ecosystem. Dramatically streamline operations, automate faculty workflows, and boost your university's trajectory.
            </p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
              {isAuthenticated ? (
                <Link to={ROLE_REDIRECTS[user?.role] || "/"} style={S.btnGold}>Go to Dashboard →</Link>
              ) : (
                <>
                  <Link to="/register" style={S.btnGold}>Create Account →</Link>
                  <Link to="/login" style={{ ...S.btnGhost, borderColor: "rgba(255,255,255,0.4)" }}>Sign In</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer style={{ background: C.navy, padding: "64px 0 0" }}>
        <div style={S.container}>
          <div className="land-ftgrid" style={{ display: "grid", gap: "48px", paddingBottom: "48px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div style={{ width: "40px", height: "40px", background: C.gold, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🎓</div>
                <div>
                  <div style={{ color: C.white, fontWeight: 900, fontSize: "16px" }}>AttendX</div>
                  <div style={{ color: C.gold, fontSize: "10px", letterSpacing: "2px" }}>ATTENDANCE OS</div>
                </div>
              </div>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", lineHeight: 1.75, maxWidth: "240px" }}>Smart Attendance Management System for modern educational institutions.</p>
            </div>
            <div>
              <h4 style={{ color: C.gold, fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "18px", marginTop: 0 }}>Quick Links</h4>
              {["About Us", "Admissions", "Academic Programs", "Faculty", "Contact"].map((l) => (
                <div key={l} style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", marginBottom: "10px", cursor: "pointer" }}>{l}</div>
              ))}
            </div>
            <div>
              <h4 style={{ color: C.gold, fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "18px", marginTop: 0 }}>Portals</h4>
              {[["Admin Portal", "/login"], ["Teacher Portal", "/login"], ["Student Portal", "/login"], ["Register Now", "/register"]].map(([l, h]) => (
                <div key={l}><Link to={h} style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", marginBottom: "10px", textDecoration: "none", display: "block" }}>{l}</Link></div>
              ))}
            </div>
            <div>
              <h4 style={{ color: C.gold, fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "18px", marginTop: 0 }}>Contact</h4>
              {["📍 University Campus, Main Road", "📞 +91 98765 43210", "📧 admin@attendx.edu"].map((l) => (
                <div key={l} style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", marginBottom: "10px" }}>{l}</div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "20px 0", color: "rgba(255,255,255,0.25)", fontSize: "12px", flexWrap: "wrap", gap: "8px" }}>
            <span>© {new Date().getFullYear()} AttendX Software Inc. All rights reserved.</span>
            <span>Enterprise Attendance Engineering</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

// ─── Shared Styles ────────────────────────────────────────────────────────────
const S = {
  container: { maxWidth: "1200px", margin: "0 auto", padding: "0 28px" },
  sectionHeader: { textAlign: "center", marginBottom: "60px" },
  badge: { display: "inline-block", background: "#eef2fb", color: C.navy, padding: "6px 18px", borderRadius: "30px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", border: `1px solid ${C.border}` },
  h2: { fontSize: "clamp(24px,3vw,36px)", fontWeight: 900, color: C.navy, margin: "14px 0 16px", lineHeight: 1.2 },
  para: { color: C.mid, fontSize: "15px", lineHeight: 1.8, marginBottom: "14px" },
  // Buttons
  btnGold: { background: C.gold, color: C.navy, padding: "11px 26px", borderRadius: "7px", fontSize: "14px", fontWeight: 800, textDecoration: "none", display: "inline-block", border: `2px solid ${C.gold}`, transition: "all 0.2s" },
  btnGhost: { background: "transparent", color: C.white, border: "2px solid rgba(255,255,255,0.45)", padding: "11px 26px", borderRadius: "7px", fontSize: "14px", fontWeight: 600, textDecoration: "none", display: "inline-block" },
  btnNavy: { background: C.navy, color: C.white, padding: "13px 32px", borderRadius: "7px", fontSize: "14px", fontWeight: 700, textDecoration: "none", display: "inline-block", border: `2px solid ${C.navy}` },
  btnHeroGold: { background: C.gold, color: C.navy, padding: "14px 36px", borderRadius: "8px", fontSize: "15px", fontWeight: 800, textDecoration: "none", display: "inline-block", border: `2px solid ${C.gold}`, boxShadow: "0 4px 20px rgba(201,168,76,0.35)" },
  btnHeroGhost: { background: "transparent", color: C.white, border: "2px solid rgba(255,255,255,0.45)", padding: "14px 36px", borderRadius: "8px", fontSize: "15px", fontWeight: 600, textDecoration: "none", display: "inline-block" },
};

export default Landing;