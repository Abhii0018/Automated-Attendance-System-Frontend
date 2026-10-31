import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import { ROLE_REDIRECTS, ATTENDANCE_THRESHOLD } from "../utils/constants";
import attendanceService from "../services/attendanceService";
import { Icon, StatCard } from "../components/ui";

import campusImg from "../assets/college1.jpeg";
import teachersImg from "../assets/teachers.jpeg";
import studentsImg from "../assets/students1.jpeg";
import adminImg from "../assets/college.jpeg";

/* ─────────────────────────────────────────────────────────────────────────────
   Landing page — public marketing page for AttendX.
   Everything described here is a real feature of the app. The only numbers
   shown are live ones from GET /attendance/public/stats.
   ──────────────────────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How it works" },
  { id: "roles", label: "Portals" },
  { id: "alerts", label: "AI & alerts" },
];

const FEATURES = [
  { icon: "clipboard", title: "Period-wise attendance", text: "Teachers mark each period for a section and subject — every student is simply Present or Absent." },
  { icon: "calendar", title: "Timetable-based classes", text: "Classes come from the section timetable, so a teacher sees exactly which periods they have today." },
  { icon: "clock", title: "Teacher check-in / check-out", text: "Faculty record their own day with a one-tap check-in and check-out from the teacher dashboard." },
  { icon: "userPlus", title: "Admissions & student records", text: "Admins take admissions, create student records and assign each student to a semester and section." },
  { icon: "bar", title: "Section reports & analytics", text: "Section-wise attendance reports plus per-student analytics broken down by subject." },
  { icon: "alert", title: "75% threshold warnings", text: "Anyone under 75% attendance is flagged, both for the student and in the admin's low-attendance list." },
  { icon: "mail", title: "Daily parent emails", text: "At 6 PM, parents of absent students automatically get a summary of missed periods and overall %." },
  { icon: "sparkles", title: "AI attendance tips", text: "Claude gives each student a personal tip, including exactly how many classes they need to reach 75%." },
];

const STEPS = [
  { icon: "building", title: "Admin sets up the college", text: "Admissions, student records, sections and the timetable. The super admin approves teacher applications." },
  { icon: "login", title: "Teacher checks in", text: "An approved teacher signs in, checks in for the day and opens today's timetable classes." },
  { icon: "clipboard", title: "Attendance is marked", text: "For each period, the teacher marks the section Present / Absent and submits — records update instantly." },
  { icon: "bell", title: "Everyone stays informed", text: "Students see their % and AI tips, admins see reports, and parents get a daily email at 6 PM." },
];

const ROLES = [
  {
    id: "admin",
    label: "Admin / Super Admin",
    plural: "admins",
    icon: "shield",
    image: adminImg,
    alt: "College campus building",
    summary: "Runs the institution's records and keeps an eye on attendance across every section.",
    points: [
      "Take admissions and create student records",
      "Assign students to semesters and sections",
      "Manage teachers and timetable slots",
      "Super admin approves or rejects teacher applications",
      "Section-wise attendance reports by date and subject",
      "Per-student analytics and the below-75% list",
    ],
  },
  {
    id: "teacher",
    label: "Teacher",
    plural: "teachers",
    icon: "teacher",
    image: teachersImg,
    alt: "Teachers at the college",
    summary: "Gets a focused workspace for the day's classes — no paper registers.",
    points: [
      "Apply through registration, then get approved",
      "Check in and check out each working day",
      "See today's classes from the timetable",
      "Mark attendance period-by-period, per section and subject",
      "Present / Absent for every student in one screen",
      "Review an overview of classes already recorded",
    ],
  },
  {
    id: "student",
    label: "Student",
    plural: "students",
    icon: "user",
    image: studentsImg,
    alt: "Students on campus",
    summary: "Always knows where they stand, and what to do about it.",
    points: [
      "Overall and subject-wise attendance percentage",
      "Clear warning when attendance falls below 75%",
      "AI tip with the exact number of classes needed to reach 75%",
      "Attendance history for each subject",
      "Personal profile with section and semester details",
      "Email OTP verification when creating an account",
    ],
  },
];

const SAMPLE_STUDENTS = [
  { roll: "PA-01", name: "Aarav Kumar" },
  { roll: "PA-02", name: "Diya Patel" },
  { roll: "PA-03", name: "Kabir Singh" },
  { roll: "PA-04", name: "Meera Iyer" },
  { roll: "PA-05", name: "Rohan Das" },
];

const PAGE_CSS = `
.lp { background: var(--ax-bg); color: var(--ax-text); overflow-x: clip; }
.lp section[id] { scroll-margin-top: 72px; }
.lp-wrap { width: min(1200px, 100%); margin: 0 auto; padding: 0 24px; }
@media (max-width: 640px) { .lp-wrap { padding: 0 16px; } }

/* top bar */
.lp-bar { position: fixed; inset: 0 0 auto 0; z-index: 60; height: var(--ax-nav-h);
  transition: background-color .25s ease, box-shadow .25s ease, border-color .25s ease;
  border-bottom: 1px solid transparent; }
.lp-bar.is-solid { background: rgba(255,255,255,0.88); backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px); border-bottom-color: var(--ax-border);
  box-shadow: 0 4px 20px rgba(15,23,42,0.06); }
.lp-bar-inner { height: 100%; display: flex; align-items: center; gap: 16px; }
.lp-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; flex-shrink: 0; border-radius: 10px; }
.lp-logo { width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, var(--ax-gold-2), var(--ax-gold));
  color: var(--ax-navy); font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(201,168,76,0.35); }
.lp-brand-name { font-weight: 800; font-size: 17px; letter-spacing: -0.02em; color: #fff; transition: color .2s; }
.lp-bar.is-solid .lp-brand-name { color: var(--ax-navy); }
.lp-links { display: none; align-items: center; gap: 2px; margin-left: 16px; flex: 1; }
.lp-link { padding: 8px 12px; border-radius: 9px; font-size: 14px; font-weight: 600; text-decoration: none;
  color: rgba(255,255,255,0.78); transition: color .18s, background-color .18s; }
.lp-link:hover { color: #fff; background: rgba(255,255,255,0.08); }
.lp-link.is-active { color: var(--ax-gold-2); }
.lp-bar.is-solid .lp-link { color: var(--ax-muted); }
.lp-bar.is-solid .lp-link:hover { color: var(--ax-navy); background: #eef1f8; }
.lp-bar.is-solid .lp-link.is-active { color: var(--ax-navy); background: #eef1f8; }
.lp-actions { display: none; align-items: center; gap: 8px; margin-left: auto; }
.lp-ghost-dark { color: rgba(255,255,255,0.9); }
.lp-ghost-dark:hover:not(:disabled) { background: rgba(255,255,255,0.1); }
.lp-bar.is-solid .lp-ghost-dark { color: var(--ax-text-2); }
.lp-bar.is-solid .lp-ghost-dark:hover:not(:disabled) { background: rgba(15,23,42,0.05); }
.lp-burger { margin-left: auto; width: 40px; height: 40px; padding: 0; color: #fff; }
.lp-bar.is-solid .lp-burger, .lp-bar.is-open .lp-burger { color: var(--ax-navy); }
.lp-bar.is-open { background: #fff; border-bottom-color: var(--ax-border); }
.lp-bar.is-open .lp-brand-name { color: var(--ax-navy); }
.lp-mobile { position: fixed; top: var(--ax-nav-h); left: 0; right: 0; z-index: 59; background: #fff;
  border-bottom: 1px solid var(--ax-border); box-shadow: var(--ax-shadow-lg); padding: 12px 16px 18px; }
.lp-mobile a.lp-mlink { display: block; padding: 12px; border-radius: 10px; font-weight: 600; color: var(--ax-text-2); text-decoration: none; }
.lp-mobile a.lp-mlink:hover { background: var(--ax-surface-2); }
@media (min-width: 900px) {
  .lp-links, .lp-actions { display: flex; }
  .lp-burger, .lp-mobile { display: none !important; }
}

/* hero */
.lp-hero { position: relative; overflow: hidden; color: #fff; padding: calc(var(--ax-nav-h) + 56px) 0 88px;
  background: linear-gradient(125deg, var(--ax-navy) 0%, var(--ax-navy-2) 55%, #1b3170 100%); }
.lp-hero::before { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .5;
  background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 44px 44px; mask-image: radial-gradient(ellipse at 30% 30%, #000 20%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at 30% 30%, #000 20%, transparent 70%); }
.lp-glow { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(10px); animation: lp-drift 12s ease-in-out infinite; }
.lp-hero-grid { position: relative; display: grid; gap: 48px; align-items: center; }
@media (min-width: 980px) { .lp-hero-grid { grid-template-columns: 1.05fr 1fr; gap: 56px; } }
.lp-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 999px;
  background: rgba(201,168,76,0.14); border: 1px solid rgba(201,168,76,0.35); color: var(--ax-gold-2);
  font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.lp-h1 { font-size: clamp(34px, 5.4vw, 58px); line-height: 1.06; letter-spacing: -0.035em; font-weight: 800; margin: 22px 0 18px; }
.lp-h1 em { font-style: normal; background: linear-gradient(90deg, var(--ax-gold-2), var(--ax-gold));
  -webkit-background-clip: text; background-clip: text; color: transparent; }
.lp-lead { font-size: clamp(16px, 1.6vw, 18px); line-height: 1.7; color: rgba(255,255,255,0.74); max-width: 560px; margin: 0; }
.lp-cta-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
.lp-btn-outline-dark { background: rgba(255,255,255,0.06); color: #fff; border-color: rgba(255,255,255,0.22); }
.lp-btn-outline-dark:hover:not(:disabled) { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.35); }
.lp-checks { display: flex; flex-wrap: wrap; gap: 10px 20px; margin: 30px 0 0; padding: 0; list-style: none;
  font-size: 13px; color: rgba(255,255,255,0.7); }
.lp-checks li { display: inline-flex; align-items: center; gap: 7px; }
.lp-checks svg { color: var(--ax-gold-2); }

/* demo card */
.lp-demo { position: relative; color: var(--ax-text); padding: 18px; border-radius: 18px; min-width: 0;
  box-shadow: 0 30px 80px rgba(3,8,24,0.45); animation: lp-float 7s ease-in-out infinite; }
.lp-demo-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.lp-demo-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.lp-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 12px;
  border: 1px solid var(--ax-border); background: var(--ax-surface); transition: border-color .2s, background-color .2s; }
.lp-row.is-absent { background: #fff8f8; border-color: #fbd5d5; }
.lp-row-name { flex: 1; min-width: 0; font-weight: 600; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lp-row-roll { font-size: 12px; color: var(--ax-muted); font-weight: 500; }
.lp-seg { display: inline-flex; padding: 3px; border-radius: 10px; background: var(--ax-surface-2); border: 1px solid var(--ax-border); flex-shrink: 0; }
.lp-seg button { border: 0; background: transparent; font: inherit; font-size: 12px; font-weight: 700; height: 28px; min-width: 34px;
  padding: 0 10px; border-radius: 7px; cursor: pointer; color: var(--ax-muted); transition: background-color .18s, color .18s, box-shadow .18s; }
.lp-seg button[aria-pressed="true"].p { background: var(--ax-success); color: #fff; box-shadow: 0 2px 6px rgba(22,163,74,.3); }
.lp-seg button[aria-pressed="true"].a { background: var(--ax-danger); color: #fff; box-shadow: 0 2px 6px rgba(220,38,38,.3); }
.lp-seg button:focus-visible { box-shadow: var(--ax-ring); }
@media (max-width: 420px) { .lp-seg-label { display: none; } }
.lp-sticker { position: absolute; top: -14px; right: 18px; }

/* sections */
.lp-section { padding: 96px 0; }
@media (max-width: 640px) { .lp-section { padding: 64px 0; } }
.lp-kicker { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--ax-blue); }
.lp-h2 { font-size: clamp(26px, 3.4vw, 38px); line-height: 1.15; letter-spacing: -0.03em; font-weight: 800; margin: 10px 0 12px; color: var(--ax-text); }
.lp-sub { font-size: 16px; line-height: 1.7; color: var(--ax-muted); margin: 0; max-width: 640px; }
.lp-head-center { text-align: center; margin: 0 auto 48px; max-width: 680px; }
.lp-head-center .lp-sub { margin: 0 auto; }

.lp-stats { display: grid; gap: 14px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
@media (min-width: 720px) { .lp-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (min-width: 1080px) { .lp-stats { grid-template-columns: repeat(5, minmax(0, 1fr)); } }
@media (max-width: 420px) { .lp-stats > :last-child { grid-column: 1 / -1; } }

.lp-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); }
.lp-feature { padding: 22px; height: 100%; }
.lp-feature:hover .lp-ficon { background: var(--ax-navy); color: var(--ax-gold-2); transform: rotate(-6deg) scale(1.05); }
.lp-ficon { width: 44px; height: 44px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;
  background: var(--ax-blue-soft); color: var(--ax-blue); transition: background-color .25s, color .25s, transform .3s var(--ax-ease); }
.lp-feature h3 { font-size: 16px; font-weight: 700; margin: 16px 0 6px; letter-spacing: -0.01em; }
.lp-feature p { font-size: 14px; line-height: 1.65; color: var(--ax-muted); margin: 0; }

.lp-steps { display: grid; gap: 16px; grid-template-columns: 1fr; counter-reset: step; list-style: none; padding: 0; margin: 0; }
@media (min-width: 720px) { .lp-steps { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1080px) { .lp-steps { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.lp-step { position: relative; padding: 24px 22px; }
.lp-step-num { font-size: 12px; font-weight: 800; letter-spacing: .08em; color: var(--ax-gold); }
.lp-step h3 { font-size: 16px; font-weight: 700; margin: 14px 0 6px; }
.lp-step p { font-size: 14px; line-height: 1.65; color: var(--ax-muted); margin: 0; }
.lp-step-arrow { display: none; position: absolute; top: 34px; right: -14px; z-index: 1; width: 26px; height: 26px; border-radius: 50%;
  background: var(--ax-surface); border: 1px solid var(--ax-border); color: var(--ax-gold); align-items: center; justify-content: center; }
@media (min-width: 1080px) { .lp-step:not(:last-child) .lp-step-arrow { display: inline-flex; } }

.lp-tabs { display: flex; gap: 6px; padding: 5px; border-radius: 14px; background: var(--ax-surface); border: 1px solid var(--ax-border);
  width: fit-content; max-width: 100%; margin: 0 auto 28px; overflow-x: auto; }
.lp-tab { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 16px; border-radius: 10px; border: 0; cursor: pointer;
  font: inherit; font-size: 14px; font-weight: 600; color: var(--ax-muted); background: transparent; white-space: nowrap;
  transition: background-color .2s, color .2s; }
.lp-tab:hover { color: var(--ax-navy); }
.lp-tab[aria-selected="true"] { background: var(--ax-navy); color: #fff; }
@media (max-width: 480px) { .lp-tab { padding: 0 12px; font-size: 13px; } .lp-tab .lp-tab-long { display: none; } }
.lp-role { display: grid; gap: 0; overflow: hidden; }
@media (min-width: 900px) { .lp-role { grid-template-columns: 1fr 1.15fr; } }
.lp-role-img { position: relative; min-height: 240px; }
.lp-role-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.lp-role-img::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, rgba(11,21,48,0.75)); }
.lp-role-cap { position: absolute; left: 20px; bottom: 18px; right: 20px; z-index: 1; color: #fff; font-weight: 700; font-size: 18px; display: flex; align-items: center; gap: 10px; }
.lp-role-body { padding: 28px; }
@media (max-width: 640px) { .lp-role-body { padding: 22px 18px; } }
.lp-points { list-style: none; padding: 0; margin: 20px 0 0; display: grid; gap: 12px; }
@media (min-width: 560px) { .lp-points { grid-template-columns: 1fr 1fr; } }
.lp-points li { display: flex; gap: 10px; font-size: 14px; line-height: 1.55; color: var(--ax-text-2); }
.lp-points li svg { color: var(--ax-success); margin-top: 2px; }

.lp-split { display: grid; gap: 20px; }
@media (min-width: 960px) { .lp-split { grid-template-columns: 1fr 1fr; } }
.lp-panel { padding: 26px; display: flex; flex-direction: column; gap: 18px; }
@media (max-width: 640px) { .lp-panel { padding: 20px 16px; } }
.lp-panel-icon { width: 42px; height: 42px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.lp-calc { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.lp-result { border-radius: 12px; padding: 14px 16px; font-size: 14px; line-height: 1.6; border: 1px solid; }
.lp-email { border: 1px solid var(--ax-border); border-radius: 14px; overflow: hidden; font-size: 14px; }
.lp-email-head { padding: 12px 16px; background: var(--ax-surface-2); border-bottom: 1px solid var(--ax-border); display: grid; gap: 4px; font-size: 13px; color: var(--ax-muted); }
.lp-email-head b { color: var(--ax-text-2); font-weight: 600; }
.lp-email-body { padding: 16px; color: var(--ax-text-2); line-height: 1.65; }
.lp-email-body ul { margin: 8px 0 12px; padding-left: 18px; }

.lp-sec-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); margin-top: 40px; }
.lp-sec { display: flex; gap: 14px; align-items: flex-start; padding: 18px; }
.lp-sec h3 { margin: 0 0 4px; font-size: 15px; font-weight: 700; }
.lp-sec p { margin: 0; font-size: 13px; color: var(--ax-muted); line-height: 1.6; }

.lp-cta { position: relative; overflow: hidden; border-radius: 22px; color: #fff; padding: 56px 32px; text-align: center; isolation: isolate; }
@media (max-width: 640px) { .lp-cta { padding: 44px 20px; border-radius: 18px; } }
.lp-cta img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -2; }
.lp-cta::before { content: ""; position: absolute; inset: 0; z-index: -1;
  background: linear-gradient(120deg, rgba(11,21,48,0.94), rgba(20,34,74,0.88) 55%, rgba(27,49,112,0.82)); }

.lp-footer { background: var(--ax-navy); color: rgba(255,255,255,0.6); padding: 48px 0 28px; margin-top: 96px; font-size: 14px; }
.lp-footer-grid { display: grid; gap: 32px; grid-template-columns: 1fr; padding-bottom: 32px; border-bottom: 1px solid rgba(255,255,255,0.08); }
@media (min-width: 720px) { .lp-footer-grid { grid-template-columns: 1.6fr 1fr 1fr; } }
.lp-footer h4 { color: var(--ax-gold-2); font-size: 12px; letter-spacing: .08em; text-transform: uppercase; margin: 0 0 14px; }
.lp-footer a { color: rgba(255,255,255,0.68); text-decoration: none; display: inline-block; padding: 4px 0; border-radius: 6px; }
.lp-footer a:hover { color: #fff; }

/* scroll reveal */
.lp-reveal { opacity: 0; transform: translateY(18px); transition: opacity .7s var(--ax-ease), transform .7s var(--ax-ease); }
.lp-reveal.is-in { opacity: 1; transform: none; }
.lp-reveal-group.is-in > * { animation: ax-fade-up .6s var(--ax-ease) both; }
.lp-reveal-group > * { opacity: 0; }
.lp-reveal-group.is-in > * { opacity: 1; }
.lp-reveal-group.is-in > *:nth-child(2) { animation-delay: .06s; }
.lp-reveal-group.is-in > *:nth-child(3) { animation-delay: .12s; }
.lp-reveal-group.is-in > *:nth-child(4) { animation-delay: .18s; }
.lp-reveal-group.is-in > *:nth-child(5) { animation-delay: .24s; }
.lp-reveal-group.is-in > *:nth-child(6) { animation-delay: .3s; }
.lp-reveal-group.is-in > *:nth-child(n + 7) { animation-delay: .36s; }

@keyframes lp-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes lp-drift { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(24px, -18px); } }
@media (prefers-reduced-motion: reduce) {
  .lp-reveal, .lp-reveal-group > * { opacity: 1 !important; transform: none !important; }
  .lp-demo, .lp-glow { animation: none !important; }
}
`;

// Reveal-on-scroll wrapper. `group` staggers direct children instead of the box itself.
const Reveal = ({ as = "div", group = false, className = "", children, ...rest }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -60px 0px", threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  const base = group ? "lp-reveal-group" : "lp-reveal";
  const cls = `${base}${visible ? " is-in" : ""} ${className}`.trim();
  if (as === "ol") {
    return <ol ref={ref} className={cls} {...rest}>{children}</ol>;
  }
  return <div ref={ref} className={cls} {...rest}>{children}</div>;
};

const SectionHead = ({ kicker, title, sub }) => (
  <Reveal className="lp-head-center">
    <div className="lp-kicker">{kicker}</div>
    <h2 className="lp-h2">{title}</h2>
    {sub && <p className="lp-sub">{sub}</p>}
  </Reveal>
);

// Classes a student must attend in a row to reach the threshold, or may skip while staying above it.
const thresholdMath = (attended, held, threshold = ATTENDANCE_THRESHOLD) => {
  const t = threshold / 100;
  const pct = held > 0 ? (attended / held) * 100 : 0;
  const need = Math.max(0, Math.ceil((t * held - attended) / (1 - t) - 1e-9));
  const canSkip = Math.max(0, Math.floor(attended / t - held + 1e-9));
  return { pct, need, canSkip };
};

// ── Interactive preview of the teacher's "Mark attendance" screen ───────────
const AttendanceDemo = () => {
  const toast = useToast();
  const [present, setPresent] = useState(() => SAMPLE_STUDENTS.map((_, i) => i !== 2));
  const count = present.filter(Boolean).length;
  const pct = Math.round((count / SAMPLE_STUDENTS.length) * 100);

  const setOne = (i, value) => setPresent((prev) => prev.map((v, j) => (j === i ? value : v)));

  return (
    <div className="ax-card lp-demo" role="group" aria-label="Interactive preview of the mark attendance screen">
      <span className="ax-badge ax-badge-gold lp-sticker">
        <Icon name="sparkles" size={13} /> Try it — sample data
      </span>
      <div className="lp-demo-head">
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ax-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
            Mark attendance
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 2 }}>Period 3 · DBMS</div>
          <div className="lp-demo-meta">
            <span className="ax-badge ax-badge-info">Semester 1</span>
            <span className="ax-badge">Section PA</span>
            <span className="ax-badge">
              <Icon name="clock" size={12} /> 11:00 – 11:50
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: pct < ATTENDANCE_THRESHOLD ? "var(--ax-danger)" : "var(--ax-success)" }} aria-live="polite">
            {pct}%
          </div>
          <div style={{ fontSize: 12, color: "var(--ax-muted)" }}>
            {count}/{SAMPLE_STUDENTS.length} present
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        {SAMPLE_STUDENTS.map((s, i) => (
          <div key={s.roll} className={`lp-row${present[i] ? "" : " is-absent"}`}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="lp-row-name">{s.name}</div>
              <div className="lp-row-roll">{s.roll}</div>
            </div>
            <div className="lp-seg" role="group" aria-label={`Attendance for ${s.name}`}>
              <button type="button" className="p" aria-pressed={present[i]} onClick={() => setOne(i, true)}>
                P<span className="lp-seg-label">resent</span>
              </button>
              <button type="button" className="a" aria-pressed={!present[i]} onClick={() => setOne(i, false)}>
                A<span className="lp-seg-label">bsent</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={() => setPresent(SAMPLE_STUDENTS.map(() => true))}>
          <Icon name="checkCircle" size={14} /> Mark all present
        </button>
        <button
          type="button"
          className="ax-btn ax-btn-primary ax-btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={() => toast.info("This is just a preview. Sign in as a teacher to record real attendance.")}
        >
          Submit attendance <Icon name="arrowRight" size={14} />
        </button>
      </div>
    </div>
  );
};

// ── 75% calculator (same idea the AI tip is built around) ──────────────────
const ThresholdCalculator = () => {
  const [attended, setAttended] = useState("28");
  const [held, setHeld] = useState("40");
  const a = Math.max(0, Math.floor(Number(attended) || 0));
  const h = Math.max(0, Math.floor(Number(held) || 0));
  const invalid = a > h;
  const { pct, need, canSkip } = thresholdMath(a, h);
  const below = pct < ATTENDANCE_THRESHOLD;

  let tone;
  let message;
  if (h === 0) {
    tone = "info";
    message = "Enter the number of classes held so far.";
  } else if (invalid) {
    tone = "warning";
    message = "Classes attended can't be more than classes held.";
  } else if (below) {
    tone = "danger";
    message = (
      <>
        You're at <b>{pct.toFixed(1)}%</b>. Attend the next <b>{need}</b> class{need === 1 ? "" : "es"} in a row to get back to {ATTENDANCE_THRESHOLD}%.
      </>
    );
  } else {
    tone = "success";
    message = (
      <>
        You're at <b>{pct.toFixed(1)}%</b> — above {ATTENDANCE_THRESHOLD}%.{" "}
        {canSkip > 0 ? (
          <>You could miss up to <b>{canSkip}</b> class{canSkip === 1 ? "" : "es"} and still stay at or above it.</>
        ) : (
          <>Missing even one more class would drop you below it.</>
        )}
      </>
    );
  }

  const toneStyle = {
    info: { background: "var(--ax-blue-soft)", borderColor: "#c7d6fe", color: "#1e3a8a" },
    warning: { background: "var(--ax-warning-soft)", borderColor: "#fde68a", color: "#92400e" },
    danger: { background: "var(--ax-danger-soft)", borderColor: "#fecaca", color: "#991b1b" },
    success: { background: "var(--ax-success-soft)", borderColor: "#bbf7d0", color: "#166534" },
  }[tone];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="lp-calc">
        <div>
          <label className="ax-label" htmlFor="lp-attended">Classes attended</label>
          <input id="lp-attended" className="ax-input" type="number" inputMode="numeric" min="0" value={attended}
            onChange={(e) => setAttended(e.target.value)} aria-invalid={invalid} />
        </div>
        <div>
          <label className="ax-label" htmlFor="lp-held">Classes held</label>
          <input id="lp-held" className="ax-input" type="number" inputMode="numeric" min="0" value={held}
            onChange={(e) => setHeld(e.target.value)} aria-invalid={invalid} />
        </div>
      </div>
      <div className="lp-result" style={toneStyle} aria-live="polite">{message}</div>
    </div>
  );
};

// ── Live numbers from the backend (hidden if the request fails) ────────────
const LiveStats = () => {
  const [state, setState] = useState({ loading: true, data: null, failed: false });

  useEffect(() => {
    let alive = true;
    attendanceService
      .getPublicStats()
      .then((res) => {
        if (!alive) return;
        if (res?.success && res.data) setState({ loading: false, data: res.data, failed: false });
        else setState({ loading: false, data: null, failed: true });
      })
      .catch(() => alive && setState({ loading: false, data: null, failed: true }));
    return () => {
      alive = false;
    };
  }, []);

  if (state.failed) return null;
  const d = state.data || {};
  const items = [
    { label: "Students", value: d.students, icon: "users", tone: "blue" },
    { label: "Teachers", value: d.teachers, icon: "teacher", tone: "gold" },
    { label: "Sections", value: d.sections, icon: "layers", tone: "navy" },
    { label: "Classes recorded", value: d.classesRecorded, icon: "clipboard", tone: "success" },
    { label: "Average attendance", value: d.averageAttendance, icon: "chart", tone: "warning", suffix: "%", decimals: 1 },
  ];

  return (
    <section aria-labelledby="lp-live-title" style={{ position: "relative", marginTop: -40, zIndex: 2 }}>
      <div className="lp-wrap">
        <div className="ax-card" style={{ padding: 18, boxShadow: "var(--ax-shadow-lg)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", padding: "2px 4px 14px" }}>
            <h2 id="lp-live-title" className="ax-section-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="ax-badge ax-badge-success" style={{ height: 22 }}>
                <span className="ax-dot" /> Live
              </span>
              Numbers from this AttendX deployment
            </h2>
            <span className="ax-section-sub" style={{ margin: 0 }}>Pulled straight from the database</span>
          </div>
          <div className="lp-stats ax-stagger">
            {items.map((it) => (
              <StatCard
                key={it.label}
                label={it.label}
                value={Number(it.value) || 0}
                icon={it.icon}
                tone={it.tone}
                suffix={it.suffix}
                decimals={it.decimals}
                loading={state.loading}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const Landing = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [roleTab, setRoleTab] = useState(ROLES[0].id);
  const tabRefs = useRef({});

  const dashboardPath = ROLE_REDIRECTS[user?.role] || "/login";

  // Signed-in users go straight to their dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role) navigate(ROLE_REDIRECTS[user.role] || "/login", { replace: true });
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the nav link of the section currently in view
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveId(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    NAV_LINKS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  // Close the mobile menu with Escape / when resizing to desktop
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    const onResize = () => window.innerWidth >= 900 && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  const goTo = (e, id) => {
    e.preventDefault();
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  };

  const scrollTop = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onTabKey = (e, idx) => {
    let next = null;
    if (e.key === "ArrowRight") next = (idx + 1) % ROLES.length;
    if (e.key === "ArrowLeft") next = (idx - 1 + ROLES.length) % ROLES.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = ROLES.length - 1;
    if (next === null) return;
    e.preventDefault();
    setRoleTab(ROLES[next].id);
    tabRefs.current[ROLES[next].id]?.focus();
  };

  const role = useMemo(() => ROLES.find((r) => r.id === roleTab) || ROLES[0], [roleTab]);
  const barClass = `lp-bar${scrolled ? " is-solid" : ""}${menuOpen ? " is-open" : ""}`;

  const authButtons = (size = "", dark = false) =>
    isAuthenticated ? (
      <Link to={dashboardPath} className={`ax-btn ax-btn-gold ${size}`}>
        Go to dashboard <Icon name="arrowRight" size={16} />
      </Link>
    ) : (
      <>
        <Link to="/login" className={`ax-btn ${dark ? "lp-btn-outline-dark" : "ax-btn-secondary"} ${size}`}>
          <Icon name="login" size={16} /> Sign in
        </Link>
        <Link to="/register" className={`ax-btn ax-btn-gold ${size}`}>
          Create account <Icon name="arrowRight" size={16} />
        </Link>
      </>
    );

  return (
    <div className="lp">
      <style>{PAGE_CSS}</style>

      {/* ════════════ TOP BAR ════════════ */}
      <header className={barClass}>
        <div className="lp-wrap lp-bar-inner">
          <a href="#top" className="lp-brand" onClick={scrollTop} aria-label="AttendX — back to top">
            <span className="lp-logo">AX</span>
            <span className="lp-brand-name">AttendX</span>
          </a>

          <nav className="lp-links" aria-label="Page sections">
            {NAV_LINKS.map((l) => (
              <a key={l.id} href={`#${l.id}`} onClick={(e) => goTo(e, l.id)}
                className={`lp-link${activeId === l.id ? " is-active" : ""}`}
                aria-current={activeId === l.id ? "true" : undefined}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className="lp-actions">
            {isAuthenticated ? (
              <Link to={dashboardPath} className="ax-btn ax-btn-gold">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="ax-btn ax-btn-ghost lp-ghost-dark">Sign in</Link>
                <Link to="/register" className="ax-btn ax-btn-gold">Create account</Link>
              </>
            )}
          </div>

          <button type="button" className="ax-btn ax-btn-ghost lp-burger" aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen} aria-controls="lp-mobile-menu" onClick={() => setMenuOpen((o) => !o)}>
            <Icon name={menuOpen ? "x" : "menu"} size={22} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div id="lp-mobile-menu" className="lp-mobile ax-fade-up">
          <nav aria-label="Page sections (mobile)">
            {NAV_LINKS.map((l) => (
              <a key={l.id} href={`#${l.id}`} className="lp-mlink" onClick={(e) => goTo(e, l.id)}>{l.label}</a>
            ))}
          </nav>
          <div style={{ display: "grid", gridTemplateColumns: isAuthenticated ? "1fr" : "1fr 1fr", gap: 8, marginTop: 10 }}>
            {authButtons()}
          </div>
        </div>
      )}

      <main id="top">
        {/* ════════════ HERO ════════════ */}
        <section className="lp-hero" aria-labelledby="lp-hero-title">
          <span className="lp-glow" aria-hidden="true" style={{ width: 420, height: 420, right: -120, top: -80, background: "radial-gradient(circle, rgba(201,168,76,0.28), transparent 65%)" }} />
          <span className="lp-glow" aria-hidden="true" style={{ width: 360, height: 360, left: -140, bottom: -160, background: "radial-gradient(circle, rgba(47,85,212,0.35), transparent 65%)", animationDelay: "-6s" }} />

          <div className="lp-wrap lp-hero-grid">
            <div className="ax-stagger" style={{ minWidth: 0 }}>
              <span className="lp-eyebrow">
                <Icon name="sparkles" size={14} /> College attendance, done right
              </span>
              <h1 id="lp-hero-title" className="lp-h1">
                Period-by-period attendance, <em>without the paperwork.</em>
              </h1>
              <p className="lp-lead">
                AttendX gives admins, teachers and students their own portal. Teachers mark each timetable period in seconds,
                students see exactly where they stand against the 75% rule, and parents get an email the same evening.
              </p>
              <div className="lp-cta-row">{authButtons("ax-btn-lg", true)}</div>
              <ul className="lp-checks">
                <li><Icon name="check" size={15} /> Role-based portals</li>
                <li><Icon name="check" size={15} /> Daily parent emails at 6 PM</li>
                <li><Icon name="check" size={15} /> AI attendance tips</li>
              </ul>
            </div>

            <div className="ax-fade-up" style={{ animationDelay: ".15s", minWidth: 0 }}>
              <AttendanceDemo />
            </div>
          </div>
        </section>

        {/* ════════════ LIVE STATS ════════════ */}
        <LiveStats />

        {/* ════════════ FEATURES ════════════ */}
        <section id="features" className="lp-section" aria-labelledby="lp-features-title">
          <div className="lp-wrap">
            <SectionHead
              kicker="Features"
              title={<span id="lp-features-title">Everything a college needs to run attendance</span>}
              sub="From admission to the parent's inbox — every step of the attendance cycle lives in one place."
            />
            <Reveal group className="lp-grid">
              {FEATURES.map((f) => (
                <article key={f.title} className="ax-card ax-card-hover lp-feature">
                  <span className="lp-ficon"><Icon name={f.icon} size={21} /></span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </article>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ════════════ HOW IT WORKS ════════════ */}
        <section id="how-it-works" className="lp-section" aria-labelledby="lp-how-title"
          style={{ background: "linear-gradient(180deg, var(--ax-surface) 0%, var(--ax-bg) 100%)", borderBlock: "1px solid var(--ax-border)" }}>
          <div className="lp-wrap">
            <SectionHead
              kicker="How it works"
              title={<span id="lp-how-title">From timetable to parent email in four steps</span>}
              sub="A simple daily loop that keeps records accurate and everyone in the loop."
            />
            <Reveal as="ol" group className="lp-steps">
              {STEPS.map((s, i) => (
                <li key={s.title} className="ax-card ax-card-hover lp-step">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="lp-ficon" style={{ background: "var(--ax-navy)", color: "var(--ax-gold-2)" }}>
                      <Icon name={s.icon} size={20} />
                    </span>
                    <span className="lp-step-num">STEP {String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                  <span className="lp-step-arrow" aria-hidden="true"><Icon name="chevronRight" size={14} /></span>
                </li>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ════════════ ROLES ════════════ */}
        <section id="roles" className="lp-section" aria-labelledby="lp-roles-title">
          <div className="lp-wrap">
            <SectionHead
              kicker="Portals"
              title={<span id="lp-roles-title">One app, three focused portals</span>}
              sub="Each role signs in to a workspace that only shows what it needs."
            />
            <Reveal>
              <div className="lp-tabs" role="tablist" aria-label="Choose a role">
                {ROLES.map((r, idx) => (
                  <button
                    key={r.id}
                    ref={(el) => { tabRefs.current[r.id] = el; }}
                    type="button"
                    role="tab"
                    id={`lp-tab-${r.id}`}
                    aria-selected={roleTab === r.id}
                    aria-controls={`lp-panel-${r.id}`}
                    tabIndex={roleTab === r.id ? 0 : -1}
                    className="lp-tab"
                    onClick={() => setRoleTab(r.id)}
                    onKeyDown={(e) => onTabKey(e, idx)}
                  >
                    <Icon name={r.icon} size={16} />
                    {r.id === "admin" ? (<>Admin<span className="lp-tab-long"> / Super Admin</span></>) : r.label}
                  </button>
                ))}
              </div>

              <div key={role.id} id={`lp-panel-${role.id}`} role="tabpanel" aria-labelledby={`lp-tab-${role.id}`}
                className="ax-card lp-role ax-fade-up" tabIndex={0}>
                <div className="lp-role-img">
                  <img src={role.image} alt={role.alt} loading="lazy" />
                  <div className="lp-role-cap">
                    <span className="lp-ficon" style={{ width: 36, height: 36, background: "rgba(255,255,255,0.16)", color: "#fff" }}>
                      <Icon name={role.icon} size={18} />
                    </span>
                    {role.label} portal
                  </div>
                </div>
                <div className="lp-role-body">
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>What {role.plural} can do</h3>
                  <p className="lp-sub" style={{ fontSize: 15, marginTop: 6 }}>{role.summary}</p>
                  <ul className="lp-points ax-stagger">
                    {role.points.map((p) => (
                      <li key={p}><Icon name="checkCircle" size={16} /> {p}</li>
                    ))}
                  </ul>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
                    {isAuthenticated ? (
                      <Link to={dashboardPath} className="ax-btn ax-btn-primary">Go to dashboard <Icon name="arrowRight" size={16} /></Link>
                    ) : (
                      <>
                        <Link to="/login" className="ax-btn ax-btn-primary">Sign in as {role.id === "admin" ? "admin" : role.label.toLowerCase()} <Icon name="arrowRight" size={16} /></Link>
                        {role.id !== "admin" && (
                          <Link to="/register" className="ax-btn ax-btn-secondary">
                            {role.id === "teacher" ? "Apply as a teacher" : "Create student account"}
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ════════════ AI TIPS + PARENT EMAILS ════════════ */}
        <section id="alerts" className="lp-section" aria-labelledby="lp-alerts-title"
          style={{ background: "linear-gradient(180deg, var(--ax-bg) 0%, var(--ax-surface) 100%)", borderTop: "1px solid var(--ax-border)" }}>
          <div className="lp-wrap">
            <SectionHead
              kicker="AI tips & parent alerts"
              title={<span id="lp-alerts-title">Nobody finds out about low attendance too late</span>}
              sub="Students get a personal plan to stay above 75%, and parents hear about absences the same day."
            />

            <Reveal group className="lp-split">
              {/* AI tips */}
              <article className="ax-card ax-card-hover lp-panel">
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span className="lp-panel-icon" style={{ background: "var(--ax-gold-soft)", color: "#9a7420" }}><Icon name="sparkles" size={20} /></span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>AI attendance tips, powered by Claude</h3>
                    <p className="lp-sub" style={{ fontSize: 14, marginTop: 4 }}>
                      On the student dashboard, Claude looks at the student's real attendance and writes a short, personal tip —
                      including how many classes they need to attend to reach {ATTENDANCE_THRESHOLD}%.
                    </p>
                  </div>
                </div>
                <div style={{ borderTop: "1px dashed var(--ax-border-strong)", paddingTop: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Try the {ATTENDANCE_THRESHOLD}% maths yourself</span>
                    <span className="ax-badge ax-badge-info">Interactive</span>
                  </div>
                  <ThresholdCalculator />
                </div>
              </article>

              {/* Parent emails */}
              <article className="ax-card ax-card-hover lp-panel">
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span className="lp-panel-icon" style={{ background: "var(--ax-blue-soft)", color: "var(--ax-blue)" }}><Icon name="mail" size={20} /></span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Automatic daily emails to parents</h3>
                    <p className="lp-sub" style={{ fontSize: 14, marginTop: 4 }}>
                      Every day at 6 PM, AttendX emails the parents of students who missed a class: which periods were missed
                      and the student's overall attendance %.
                    </p>
                  </div>
                </div>
                <div className="lp-email" aria-label="Example parent email">
                  <div className="lp-email-head">
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <span><b>From:</b> AttendX</span>
                      <span className="ax-badge ax-badge-gold" style={{ height: 22 }}><Icon name="clock" size={12} /> Sent 6:00 PM</span>
                    </div>
                    <span><b>Subject:</b> Daily Absence Summary: Kabir Singh</span>
                  </div>
                  <div className="lp-email-body">
                    Dear Parent,
                    <br />
                    <b>Kabir Singh</b> was absent in the following classes today:
                    <ul>
                      <li>DBMS — Period 3, Section PA</li>
                      <li>Networking — Period 5, Section PA</li>
                    </ul>
                    Overall attendance: <b style={{ color: "var(--ax-danger)" }}>72.4%</b> — below the required {ATTENDANCE_THRESHOLD}%.
                  </div>
                </div>
                <p className="ax-help" style={{ margin: 0 }}>Example email with sample data. Admins can also send the day's summaries manually.</p>
              </article>
            </Reveal>

            {/* Security */}
            <Reveal group className="lp-sec-grid">
              {[
                { icon: "mail", title: "Email OTP verification", text: "New accounts confirm their email with a one-time code." },
                { icon: "key", title: "JWT authentication", text: "Every API request is signed; sessions expire automatically." },
                { icon: "shield", title: "Role-based access", text: "Admins, teachers and students only reach their own routes." },
                { icon: "briefcase", title: "Approved teachers only", text: "Teacher accounts stay pending until a super admin approves them." },
              ].map((s) => (
                <div key={s.title} className="ax-card ax-card-hover lp-sec">
                  <span className="lp-panel-icon" style={{ width: 38, height: 38, background: "#e8ecf6", color: "var(--ax-navy)" }}><Icon name={s.icon} size={18} /></span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ════════════ FINAL CTA ════════════ */}
        <section aria-labelledby="lp-cta-title" style={{ paddingTop: 8 }}>
          <div className="lp-wrap">
            <Reveal className="lp-cta">
              <img src={campusImg} alt="" loading="lazy" />
              <span className="lp-eyebrow"><Icon name="clipboard" size={14} /> Ready when you are</span>
              <h2 id="lp-cta-title" className="lp-h2" style={{ color: "#fff", margin: "18px auto 12px", maxWidth: 640 }}>
                Take today's attendance in AttendX
              </h2>
              <p className="lp-lead" style={{ margin: "0 auto", fontSize: 16 }}>
                Students and teachers can create an account now. Teacher accounts go live once a super admin approves them.
              </p>
              <div className="lp-cta-row" style={{ justifyContent: "center" }}>{authButtons("ax-btn-lg", true)}</div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ════════════ FOOTER ════════════ */}
      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-footer-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span className="lp-logo">AX</span>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em" }}>AttendX</span>
              </div>
              <p style={{ margin: 0, maxWidth: 340, lineHeight: 1.7 }}>
                A college attendance system with role-based portals, period-wise marking, AI attendance tips and daily parent emails.
              </p>
            </div>
            <div>
              <h4>On this page</h4>
              {NAV_LINKS.map((l) => (
                <div key={l.id}><a href={`#${l.id}`} onClick={(e) => goTo(e, l.id)}>{l.label}</a></div>
              ))}
            </div>
            <div>
              <h4>Get started</h4>
              <div><Link to="/login">Sign in</Link></div>
              <div><Link to="/register">Create account</Link></div>
              <div><Link to="/register">Apply as a teacher</Link></div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, paddingTop: 20, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
            <span>© {new Date().getFullYear()} AttendX</span>
            <span>Built with React, Node.js &amp; MongoDB</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
