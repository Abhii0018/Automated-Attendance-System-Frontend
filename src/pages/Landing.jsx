import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
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
  .land-two-col-rev { grid-template-columns: 1fr 1fr; }
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
    .land-two-col-rev { grid-template-columns: 1fr !important; gap: 36px !important; }
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
  { value: "10,000+", label: "Active Student Records" },
  { value: "500+", label: "Faculty Members Onboarded" },
  { value: "98%", label: "Attendance Data Accuracy" },
  { value: "50+", label: "Departments and Programs" },
];

const FEATURES = [
  { icon: "RT", title: "Live Attendance Monitoring", tag: "Real-time Data", desc: "Track each lecture and section instantly with no manual sync delays." },
  { icon: "RB", title: "Role-Specific Workspaces", tag: "Focused Experience", desc: "Admins, teachers, and students each get a clean workflow built for their daily tasks." },
  { icon: "AL", title: "Early Attendance Alerts", tag: "Risk Prevention", desc: "Warn students and mentors early before attendance crosses critical thresholds." },
  { icon: "RP", title: "Actionable Academic Reports", tag: "Insights", desc: "Generate subject-wise and section-wise reports quickly with date-range filters." },
  { icon: "SC", title: "Secure By Design", tag: "Protected Records", desc: "Use trusted access control and secure architecture for reliable academic data." },
  { icon: "SP", title: "Fast Daily Workflow", tag: "High Productivity", desc: "Mark and verify attendance within seconds, even for large classrooms." },
];

const ROLES = [
  {
    role: "Administrator", icon: "AD",
    perks: ["Manage all student accounts", "Institution-wide analytics", "Monitor low-attendance students", "Section & subject reports"],
  },
  {
    role: "Teacher", icon: "TC",
    perks: ["Mark attendance by section & subject", "Track present / absent / late", "View class-level summaries", "Filter by date range"],
  },
  {
    role: "Student", icon: "ST",
    perks: ["Check personal attendance %", "Subject-wise breakdowns", "Receive low-attendance warnings", "Manage personal profile"],
  },
];

const TESTIMONIALS = [
  { name: "Dr. Priya Sharma", role: "Head of Computer Science", quote: "Attendance audits and departmental reports are now available instantly, which has improved our planning cycle." },
  { name: "Rahul Mehta", role: "Student, B.Tech CSE", quote: "I always know my subject-wise attendance and receive alerts early, so I can improve before it becomes risky." },
  { name: "Prof. Anjali Singh", role: "Senior Faculty", quote: "The workflow is quick and reliable. I spend less time on registers and more time with students." },
];

// ─── Component ────────────────────────────────────────────────────────────────
const Landing = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef(null);

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

  useEffect(() => {
    if (!rootRef.current) return undefined;

    const root = rootRef.current;
    const navBtns = root.querySelectorAll(".land-nav-btn");
    const actionBtns = root.querySelectorAll(".land-cta-btn");
    const sectionStaggerTargets = [
      { section: ".land-features-wrap", items: ".land-features .land-reveal-card" },
      { section: ".land-roles-wrap", items: ".land-roles .land-reveal-card" },
      { section: ".land-tests-wrap", items: ".land-tests .land-reveal-card" },
    ];

    gsap.fromTo(
      ".land-hero-anim",
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.75, stagger: 0.1, ease: "power3.out" }
    );
    gsap.to(".land-float-card", {
      y: -8,
      duration: 2.4,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const selector = entry.target.getAttribute("data-stagger-items");
          if (selector) {
            const items = entry.target.querySelectorAll(selector);
            if (items.length) {
              gsap.fromTo(
                items,
                { opacity: 0, y: 28, scale: 0.98 },
                { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.1, ease: "power3.out", clearProps: "all" }
              );
            }
          }
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2 }
    );

    sectionStaggerTargets.forEach(({ section, items }) => {
      const el = root.querySelector(section);
      if (!el) return;
      el.setAttribute("data-stagger-items", items);
      observer.observe(el);
    });

    const navEnter = (event) => gsap.to(event.currentTarget, { y: -3, color: C.gold, duration: 0.2, ease: "power2.out" });
    const navLeave = (event) => gsap.to(event.currentTarget, { y: 0, color: "rgba(255,255,255,0.88)", duration: 0.2, ease: "power2.out" });
    const btnEnter = (event) => gsap.to(event.currentTarget, { y: -4, scale: 1.02, duration: 0.2, ease: "power2.out" });
    const btnLeave = (event) => gsap.to(event.currentTarget, { y: 0, scale: 1, duration: 0.2, ease: "power2.out" });

    navBtns.forEach((btn) => {
      btn.addEventListener("mouseenter", navEnter);
      btn.addEventListener("mouseleave", navLeave);
    });
    actionBtns.forEach((btn) => {
      btn.addEventListener("mouseenter", btnEnter);
      btn.addEventListener("mouseleave", btnLeave);
    });

    return () => {
      observer.disconnect();
      navBtns.forEach((btn) => {
        btn.removeEventListener("mouseenter", navEnter);
        btn.removeEventListener("mouseleave", navLeave);
      });
      actionBtns.forEach((btn) => {
        btn.removeEventListener("mouseenter", btnEnter);
        btn.removeEventListener("mouseleave", btnLeave);
      });
    };
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div ref={rootRef} style={{ fontFamily: "'Segoe UI', 'Inter', Arial, sans-serif", color: C.navy, overflowX: "hidden" }}>

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
          <div className="land-hero-anim" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 900, color: C.navy }}>AX</div>
            <div>
              <div style={{ color: C.white, fontWeight: 900, fontSize: "18px", letterSpacing: "0.5px" }}>AttendX</div>
              <div style={{ color: C.gold, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase" }}>ATTENDANCE OS</div>
            </div>
          </div>

          {/* Desktop Links */}
          <div className="land-nav-links" style={{ gap: "4px" }}>
            {NAV_LINKS.map((l) => (
              <button className="land-nav-btn" key={l.label} onClick={() => scrollTo(l.href)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.88)", fontSize: "14px", padding: "8px 16px", cursor: "pointer", borderRadius: "6px", fontWeight: 500, transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = C.gold}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.88)"}
              >{l.label}</button>
            ))}
          </div>

          {/* Auth (Desktop) */}
          <div className="land-nav-auth" style={{ gap: "10px", alignItems: "center" }}>
            {isAuthenticated ? (
              <Link className="land-cta-btn land-hero-anim" to={ROLE_REDIRECTS[user?.role] || "/"} style={S.btnGold}>Dashboard →</Link>
            ) : (
              <>
                <Link className="land-cta-btn land-hero-anim" to="/login" style={S.btnGhost}>Sign In</Link>
                <Link className="land-cta-btn land-hero-anim" to="/register" style={S.btnGold}>Register Now</Link>
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

          <div className="land-hero-anim" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(201,168,76,0.15)", border: `1px solid rgba(201,168,76,0.35)`, borderRadius: "30px", padding: "7px 18px", marginBottom: "28px", width: "fit-content" }}>
            <span style={{ color: C.gold, fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}>Smart Campus Operations</span>
          </div>

          <h1 className="land-hero-anim" style={{ color: C.white, fontSize: "clamp(32px, 4vw, 58px)", fontWeight: 900, lineHeight: 1.12, margin: "0 0 12px", letterSpacing: "-1px" }}>
            Smarter Campus
          </h1>
          <h1 className="land-hero-anim" style={{ color: C.gold, fontSize: "clamp(32px, 4vw, 58px)", fontWeight: 900, lineHeight: 1.12, margin: "0 0 24px", letterSpacing: "-1px" }}>
            Management Platform
          </h1>

          <p className="land-hero-anim" style={{ color: "rgba(255,255,255,0.74)", fontSize: "17px", lineHeight: 1.9, margin: "0 0 36px", maxWidth: "520px" }}>
            AttendX helps institutions track attendance, improve accountability, and make faster academic decisions with clean dashboards and role-based tools.
          </p>

          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "44px" }}>
            {isAuthenticated ? (
              <Link className="land-cta-btn land-hero-anim" to={ROLE_REDIRECTS[user?.role] || "/"} style={S.btnHeroGold}>Go to Dashboard →</Link>
            ) : (
              <>
                <Link className="land-cta-btn land-hero-anim" to="/register" style={S.btnHeroGold}>Get Started →</Link>
                <Link className="land-cta-btn land-hero-anim" to="/login" style={S.btnHeroGhost}>Sign In</Link>
              </>
            )}
          </div>

          {/* Quick program badges */}
          <div className="land-quick-links" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "4px" }}>Platform Modules</div>
            {["System Administration", "Faculty Analytics Setup", "Student Access Layer"].map((t) => (
              <button className="land-cta-btn land-hero-anim" key={t} onClick={() => scrollTo("programs")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.78)", padding: "9px 18px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", textAlign: "left", width: "fit-content", transition: "all 0.2s", fontWeight: 500 }}
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
          <div className="land-hero-anim land-float-card" style={{ position: "absolute", bottom: "40px", right: "32px", background: "rgba(10,22,40,0.92)", backdropFilter: "blur(16px)", border: `1px solid rgba(201,168,76,0.4)`, borderRadius: "14px", padding: "20px 26px", display: "flex", gap: "24px" }}>
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
          &nbsp;&nbsp;AttendX v2.0 is live with upgraded dashboard experiences.&nbsp;&nbsp;|&nbsp;&nbsp;
          Automated low-attendance notifications are fully integrated.&nbsp;&nbsp;|&nbsp;&nbsp;
          JWT-based security keeps academic records protected.
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
                <span style={{ fontSize: "14px", fontWeight: 900, color: C.navy, background: "#eef2fb", borderRadius: "8px", padding: "6px 10px" }}>EST</span>
                <div>
                  <div style={{ fontWeight: 800, color: C.navy, fontSize: "18px" }}>Est. 1998</div>
                  <div style={{ color: C.mid, fontSize: "12px" }}>Excellence in Education</div>
                </div>
              </div>
            </div>
            <div style={{ paddingLeft: "8px" }}>
              <span style={S.badge}>About AttendX</span>
              <h2 style={S.h2}>Built to Make Attendance Operations Clear, Fast, and Reliable</h2>
              <p style={S.para}>AttendX helps institutions simplify daily attendance operations with fast marking workflows, live records, and clear visibility for every department.</p>
              <p style={S.para}>From administrators to teachers to students, each role gets a focused workspace that keeps data accurate, secure, and easy to act on.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", margin: "24px 0 32px" }}>
                {["NAAC A+ Accredited", "ISO Certified", "100% Digital Campus"].map((h) => (
                  <span key={h} style={{ background: "#eef2fb", color: C.navy, padding: "7px 16px", borderRadius: "30px", fontSize: "13px", fontWeight: 600, border: `1px solid ${C.border}` }}>✓ {h}</span>
                ))}
              </div>
              <Link className="land-cta-btn" to="/register" style={S.btnNavy}>Explore Programs →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ FEATURES ════════════ */}
      <section id="features" className="land-section land-features-wrap" style={{ padding: "100px 0", background: `linear-gradient(135deg, ${C.light} 0%, #f9fbff 100%)` }}>
        <div style={S.container}>
          <div style={S.sectionHeader}>
            <span style={S.badge}>Platform Features</span>
            <h2 style={{ ...S.h2, background: "linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Core Capabilities for Daily Academic Operations</h2>
            <p style={{ color: C.mid, fontSize: "16px", maxWidth: "650px", margin: "0 auto", lineHeight: 1.8, fontWeight: "500" }}>Designed to reduce manual effort for staff, provide transparency to students, and keep attendance records accurate across the institution.</p>
          </div>
          <div className="land-features" style={{ display: "grid", gap: "36px" }}>
            {FEATURES.map((f, i) => {
              const gradients = [
                "linear-gradient(135deg, #f0f4ff 0%, #e8f0ff 100%)",
                "linear-gradient(135deg, #fff5f0 0%, #ffe8e0 100%)",
                "linear-gradient(135deg, #f0fff4 0%, #e8fff0 100%)",
              ];
              const borderColors = ["#93c5fd", "#fed7aa", "#86efac"];
              const iconGrads = [
                "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              ];
              return (
                <div className="land-reveal-card land-feature-card" key={i}
                  onMouseEnter={e => { 
                    e.currentTarget.style.transform = "translateY(-14px) scale(1.02)"; 
                    e.currentTarget.style.boxShadow = `0 32px 72px rgba(10,22,40,0.22), 0 0 60px ${borderColors[i % 3]}40`; 
                    e.currentTarget.style.borderColor = borderColors[i % 3];
                    e.currentTarget.querySelector(".feature-icon-bg").style.transform = "scale(1.12) rotate(8deg)";
                    e.currentTarget.querySelector(".feature-icon-bg").style.boxShadow = `0 8px 24px ${iconGrads[i % 3].split(",")[0].match(/#[\da-f]{6}|rgb\([^)]*\)/i)[0]}40`;
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.transform = "translateY(0) scale(1)"; 
                    e.currentTarget.style.boxShadow = "0 16px 40px rgba(10,22,40,0.1), 0 0 30px rgba(147,197,253,0.15)"; 
                    e.currentTarget.style.borderColor = borderColors[i % 3];
                    e.currentTarget.querySelector(".feature-icon-bg").style.transform = "scale(1) rotate(0deg)";
                    e.currentTarget.querySelector(".feature-icon-bg").style.boxShadow = "0 4px 12px rgba(10,22,40,0.08)";
                  }}
                  style={{
                    background: gradients[i % 3],
                    border: `2px solid ${borderColors[i % 3]}60`,
                    borderRadius: "18px",
                    padding: "42px 36px",
                    boxShadow: "0 16px 40px rgba(10,22,40,0.1), 0 0 30px rgba(147,197,253,0.15)",
                    transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Animated background elements */}
                  <div style={{
                    position: "absolute",
                    top: "-50%",
                    right: "-20%",
                    width: "300px",
                    height: "300px",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${borderColors[i % 3]}20 0%, transparent 70%)`,
                    pointerEvents: "none",
                    animation: "float 6s ease-in-out infinite",
                  }} />
                  <div style={{
                    position: "absolute",
                    bottom: "-40%",
                    left: "-10%",
                    width: "250px",
                    height: "250px",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${borderColors[i % 3]}10 0%, transparent 70%)`,
                    pointerEvents: "none",
                    animation: "float 8s ease-in-out infinite reverse",
                  }} />

                  <div style={{ position: "relative", zIndex: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px", gap: "12px" }}>
                      <div 
                        className="feature-icon-bg"
                        style={{ 
                          display: "inline-flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          minWidth: "60px", 
                          height: "60px", 
                          borderRadius: "14px", 
                          background: iconGrads[i % 3], 
                          color: "white", 
                          fontSize: "20px", 
                          fontWeight: 900, 
                          letterSpacing: "0.5px", 
                          border: `2px solid ${borderColors[i % 3]}40`,
                          boxShadow: "0 4px 12px rgba(10,22,40,0.08)",
                          transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        }}
                      >
                        {f.icon}
                      </div>
                      <span style={{ 
                        fontSize: "12px", 
                        fontWeight: 700, 
                        color: borderColors[i % 3], 
                        background: "rgba(255,255,255,0.8)", 
                        border: `1.5px solid ${borderColors[i % 3]}40`, 
                        borderRadius: "999px", 
                        padding: "6px 14px", 
                        letterSpacing: "0.6px",
                        textTransform: "uppercase",
                        boxShadow: `0 2px 8px ${borderColors[i % 3]}20`,
                      }}>
                        {f.tag}
                      </span>
                    </div>
                    <h3 style={{ 
                      fontSize: "22px", 
                      fontWeight: 800, 
                      color: C.navy, 
                      margin: "0 0 14px", 
                      lineHeight: 1.4,
                      letterSpacing: "-0.5px",
                    }}>
                      {f.title}
                    </h3>
                    <p style={{ 
                      color: "#4b5563", 
                      fontSize: "15px", 
                      lineHeight: 1.85, 
                      margin: 0,
                      fontWeight: "500",
                    }}>
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════ ROLES / PORTALS ════════════ */}
      <section id="programs" className="land-section land-roles-wrap" style={{ padding: "100px 0", background: C.white }}>
        <div style={S.container}>
          <div style={S.sectionHeader}>
            <span style={S.badge}>Who Uses AttendX?</span>
            <h2 style={S.h2}>Three Portals, One Connected Attendance Workflow</h2>
            <p style={{ color: C.mid, fontSize: "16px", maxWidth: "700px", margin: "0 auto", lineHeight: 1.8 }}>Every user sees what they need: administrators oversee performance, teachers manage daily classes, and students track their own progress.</p>
          </div>
          <div className="land-roles" style={{ display: "grid", gap: "30px" }}>
            {ROLES.map((r, i) => (
              <div className="land-reveal-card land-role-card" key={i} style={{ background: "linear-gradient(180deg, #ffffff 0%, #f8faff 100%)", border: `1px solid #dbe5f2`, borderRadius: "16px", padding: "38px 30px", boxShadow: "0 10px 28px rgba(10,22,40,0.09)", transition: "all 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(10,22,40,0.13)"; e.currentTarget.style.transform = "translateY(-6px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#dbe5f2"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(10,22,40,0.09)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px", paddingBottom: "20px", borderBottom: `1px solid ${C.light}` }}>
                <span style={{ fontSize: "12px", fontWeight: 900, color: C.navy, background: "linear-gradient(135deg, #e0e7ff, #dbeafe)", borderRadius: "8px", padding: "6px 10px", border: "1px solid #c7d2fe" }}>{r.icon}</span>
                  <h3 style={{ fontSize: "20px", fontWeight: 800, color: C.navy, margin: 0 }}>{r.role}</h3>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {r.perks.map((p, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "center", gap: "10px", color: "#444", fontSize: "14px" }}>
                      <span style={{ color: C.gold, fontWeight: 800, fontSize: "16px", flexShrink: 0 }}>✓</span>{p}
                    </li>
                  ))}
                </ul>
                <Link className="land-cta-btn" to="/register" style={{ display: "block", textAlign: "center", padding: "12px", border: `2px solid ${C.navy}`, borderRadius: "8px", color: C.navy, textDecoration: "none", fontSize: "13px", fontWeight: 700, transition: "all 0.2s" }}
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
      <section style={{ position: "relative", minHeight: "440px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "48px 0" }}>
        <img src={gradImg} alt="Graduates" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(10,22,40,0.88) 0%, rgba(10,22,40,0.6) 100%)" }} />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 24px" }}>
          <h2 style={{ color: C.white, fontSize: "clamp(26px,4vw,46px)", fontWeight: 900, margin: "0 0 16px", textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>Built for Better Academic Outcomes</h2>
          <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "17px", maxWidth: "540px", margin: "0 auto 32px", lineHeight: 1.7 }}>
            Join institutions that use AttendX to reduce manual work, improve accountability, and keep students on track throughout the semester.
          </p>
          <Link className="land-cta-btn" to="/register" style={S.btnGold}>Join Us Today →</Link>
        </div>
      </section>

      {/* ════════════ STUDENTS SECTION ════════════ */}
      <section className="land-section" style={{ padding: "100px 0", background: C.light }}>
        <div style={S.container}>
          <div className="land-two-col" style={{ display: "grid", gap: "64px", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <span style={S.badge}>Student Experience</span>
              <h2 style={{ ...S.h2, marginTop: "14px" }}>Student Visibility That Drives Better Attendance</h2>
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
              <h2 style={{ ...S.h2, marginTop: "14px" }}>Built for Fast and Accurate Teaching Workflows</h2>
              <p style={S.para}>Faculty members can mark attendance in seconds, review class trends, and focus more on teaching instead of repetitive admin tasks.</p>
              <Link className="land-cta-btn" to="/login" style={{ ...S.btnNavy, marginTop: "24px", display: "inline-block" }}>Access Teacher Portal →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ TESTIMONIALS ════════════ */}
      <section className="land-section land-tests-wrap" style={{ padding: "100px 0", background: C.navyMid }}>
        <div style={S.container}>
          <div style={{ ...S.sectionHeader, marginBottom: "48px" }}>
            <h2 style={{ ...S.h2, color: C.white }}>Trusted by Administrators, Teachers, and Students</h2>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "16px" }}>Feedback from real users across daily campus operations.</p>
          </div>
          <div className="land-tests" style={{ display: "grid", gap: "30px" }}>
            {TESTIMONIALS.map((t, i) => (
              <div className="land-reveal-card land-test-card" key={i} style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.11), rgba(255,255,255,0.05))", border: "1px solid rgba(255,255,255,0.16)", borderRadius: "16px", padding: "32px 28px", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", transition: "all .28s ease" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.45)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)"; }}
              >
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
            <span style={{ display: "inline-flex", width: "56px", height: "56px", alignItems: "center", justifyContent: "center", borderRadius: "12px", background: C.gold, color: C.navy, fontWeight: 900 }}>AX</span>
            <h2 style={{ color: C.white, fontSize: "clamp(26px,3vw,40px)", fontWeight: 900, margin: "16px 0 14px" }}>Ready to Transform Your Campus?</h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", maxWidth: "500px", margin: "0 auto 36px", lineHeight: 1.75 }}>
              Start with AttendX to centralize attendance data, improve institutional visibility, and deliver a smoother day-to-day experience for staff and students.
            </p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
              {isAuthenticated ? (
                <Link className="land-cta-btn" to={ROLE_REDIRECTS[user?.role] || "/"} style={S.btnGold}>Go to Dashboard →</Link>
              ) : (
                <>
                  <Link className="land-cta-btn" to="/register" style={S.btnGold}>Create Account →</Link>
                  <Link className="land-cta-btn" to="/login" style={{ ...S.btnGhost, borderColor: "rgba(255,255,255,0.4)" }}>Sign In</Link>
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
                <div style={{ width: "40px", height: "40px", background: C.gold, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: C.navy, fontWeight: 900 }}>AX</div>
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
              {["University Campus, Main Road", "+91 98765 43210", "admin@attendx.edu"].map((l) => (
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

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          33% {
            transform: translateY(-20px) translateX(10px);
          }
          66% {
            transform: translateY(10px) translateX(-10px);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(147, 197, 253, 0.5);
          }
          50% {
            box-shadow: 0 0 40px rgba(147, 197, 253, 0.8);
          }
        }

        .land-feature-card {
          min-height: 250px;
          position: relative;
          overflow: hidden;
        }
        
        .land-feature-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1), rgba(255,255,255,0));
          pointer-events: none;
        }

        .land-role-card, .land-test-card {
          min-height: 250px;
          position: relative;
          overflow: hidden;
        }
        
        .land-role-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, rgba(191,219,254,0.18), rgba(255,255,255,0));
          pointer-events: none;
        }
        
        .land-test-card::before {
          content: "";
          position: absolute;
          top: -30%;
          right: -20%;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201,168,76,0.22) 0%, rgba(201,168,76,0) 70%);
          pointer-events: none;
        }

        /* Feature card hover effects */
        .land-feature-card:hover {
          animation: none;
        }

        /* Reveal animation for cards */
        .land-reveal-card {
          animation: cardReveal 0.7s ease-out;
        }

        @keyframes cardReveal {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
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