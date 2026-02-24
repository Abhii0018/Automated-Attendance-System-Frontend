import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import useAuth from "../../hooks/useAuth";

/* ─────────────────────────────────────────────────────────────
   DUMMY API CALLS  (replace with real service calls later)
───────────────────────────────────────────────────────────── */
const fetchDashboardStats = async () => {
  await new Promise((r) => setTimeout(r, 850));
  return {
    totalStudents: 247,
    totalTeachers: 18,
    totalSections: 6,
    todayPresent: 189,
    todayAbsent: 34,
    todayNotMarked: 24,
  };
};

const fetchRecentSubmissions = async () => {
  await new Promise((r) => setTimeout(r, 650));
  return [
    { id: "s1", teacher: "Dr. Meera Nair", avatar: "MN", section: "CS-A", subject: "Data Structures", date: "2026-02-23", time: "09:15 AM", present: 38, absent: 4, total: 42 },
    { id: "s2", teacher: "Prof. Rahul Verma", avatar: "RV", section: "CS-B", subject: "Operating Systems", date: "2026-02-23", time: "10:30 AM", present: 35, absent: 7, total: 42 },
    { id: "s3", teacher: "Dr. Anita Kulkarni", avatar: "AK", section: "CS-C", subject: "Computer Networks", date: "2026-02-23", time: "11:45 AM", present: 40, absent: 2, total: 42 },
    { id: "s4", teacher: "Prof. Sanjay Bose", avatar: "SB", section: "CS-D", subject: "DBMS", date: "2026-02-23", time: "01:00 PM", present: 29, absent: 11, total: 40 },
    { id: "s5", teacher: "Dr. Priya Iyer", avatar: "PI", section: "CS-E", subject: "Machine Learning", date: "2026-02-23", time: "02:15 PM", present: 22, absent: 18, total: 40 },
    { id: "s6", teacher: "Prof. Arjun Das", avatar: "AD", section: "CS-F", subject: "Software Engg.", date: "2026-02-22", time: "09:00 AM", present: 41, absent: 1, total: 42 },
  ];
};

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
const getPct = (present, total) =>
  total > 0 ? Math.round((present / total) * 100) : 0;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────── */

/** Pulsing skeleton placeholder */
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-xl bg-white/[0.04] ${className}`} />
);

/** Attendance % badge with colour-coded text */
const PctBadge = ({ pct }) => {
  const cls =
    pct >= 75
      ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
      : pct >= 60
        ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
        : "text-rose-400 bg-rose-400/10 border-rose-400/20";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${cls}`}>
      {pct}%
    </span>
  );
};

/** Dot + label status pill */
const StatusPill = ({ pct }) => {
  if (pct >= 75)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Good
      </span>
    );
  if (pct >= 60)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Average
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
      Low
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────
   SUMMARY CARD  (value animated via GSAP counter in parent)
───────────────────────────────────────────────────────────── */
const SummaryCard = ({ icon, label, sub, accentColor, counterRef }) => (
  <div
    className={`
      stat-card relative overflow-hidden rounded-2xl border bg-[#0f1117]
      transition-colors duration-300 p-6 flex flex-col gap-4
      ${accentColor.border} hover:${accentColor.borderHover}
    `}
  >
    {/* Background glow */}
    <div
      className={`pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20 ${accentColor.glow}`}
    />

    {/* Icon */}
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentColor.iconBg}`}>
      {icon}
    </div>

    {/* Animated number */}
    <div>
      <div ref={counterRef} className={`text-4xl font-extrabold tracking-tight ${accentColor.text}`}>
        0
      </div>
      <div className="text-sm font-semibold text-white mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-600 font-mono mt-0.5">{sub}</div>}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [submissions, setSubs] = useState([]);
  const [loadingStats, setLdSt] = useState(true);
  const [loadingSubs, setLdSb] = useState(true);

  /* Refs for GSAP targets */
  const pageRef = useRef(null);
  const barPresentRef = useRef(null);
  const barAbsentRef = useRef(null);
  const barNotMarkedRef = useRef(null);
  const tableBodyRef = useRef(null);

  /* Individual counter refs */
  const cntStudents = useRef(null);
  const cntTeachers = useRef(null);
  const cntSections = useRef(null);
  const cntAttPct = useRef(null);

  /* ── Fetch data ── */
  useEffect(() => {
    fetchDashboardStats().then(setStats).finally(() => setLdSt(false));
    fetchRecentSubmissions().then(setSubs).finally(() => setLdSb(false));
  }, []);

  /* ── GSAP: page entrance — runs once on mount ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      /* Header slides in from top */
      tl.fromTo(
        ".dash-header",
        { y: -32, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 }
      );

      /* Stat cards stagger up */
      tl.fromTo(
        ".stat-card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.55 },
        "-=0.3"
      );

      /* Middle row panels */
      tl.fromTo(
        ".mid-panel",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.12, duration: 0.5 },
        "-=0.2"
      );

      /* Table card */
      tl.fromTo(
        ".table-card",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.1"
      );
    }, pageRef);

    return () => ctx.revert();
  }, []);

  /* ── GSAP: counter + bar animations after stats load ── */
  useEffect(() => {
    if (!stats) return;

    const total = stats.todayPresent + stats.todayAbsent + stats.todayNotMarked;
    const presentPct = getPct(stats.todayPresent, total);
    const absentPct = getPct(stats.todayAbsent, total);
    const notMarkedPct = 100 - presentPct - absentPct;
    const overallAttPct = getPct(stats.todayPresent, stats.todayPresent + stats.todayAbsent + stats.todayNotMarked);

    const ctx = gsap.context(() => {
      /* Number counters */
      const counters = [
        { ref: cntStudents, target: stats.totalStudents, suffix: "" },
        { ref: cntTeachers, target: stats.totalTeachers, suffix: "" },
        { ref: cntSections, target: stats.totalSections, suffix: "" },
        { ref: cntAttPct, target: overallAttPct, suffix: "%" },
      ];

      counters.forEach(({ ref, target, suffix }) => {
        if (!ref.current) return;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.6,
          ease: "power2.out",
          delay: 0.3,
          onUpdate() {
            ref.current.textContent = Math.round(obj.val) + suffix;
          },
        });
      });

      /* Attendance progress bars — GSAP width tween from 0% */
      const barDelay = 0.5;
      if (barPresentRef.current) {
        gsap.fromTo(
          barPresentRef.current,
          { width: "0%" },
          { width: `${presentPct}%`, duration: 1.2, ease: "power2.out", delay: barDelay }
        );
      }
      if (barAbsentRef.current) {
        gsap.fromTo(
          barAbsentRef.current,
          { width: "0%" },
          { width: `${absentPct}%`, duration: 1.2, ease: "power2.out", delay: barDelay + 0.1 }
        );
      }
      if (barNotMarkedRef.current) {
        gsap.fromTo(
          barNotMarkedRef.current,
          { width: "0%" },
          { width: `${notMarkedPct}%`, duration: 1.2, ease: "power2.out", delay: barDelay + 0.2 }
        );
      }
    });

    return () => ctx.revert();
  }, [stats]);

  /* ── GSAP: table rows stagger after submissions load ── */
  useEffect(() => {
    if (submissions.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".tbl-row",
        { x: -16, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.07, duration: 0.45, ease: "power2.out", delay: 0.2 }
      );

      /* Mini progress bars inside table */
      gsap.fromTo(
        ".mini-bar",
        { scaleX: 0 },
        { scaleX: 1, stagger: 0.07, duration: 0.8, ease: "power2.out", delay: 0.4, transformOrigin: "left center" }
      );
    }, tableBodyRef);

    return () => ctx.revert();
  }, [submissions]);

  /* ── Derived values for today's breakdown ── */
  const total = stats ? stats.todayPresent + stats.todayAbsent + stats.todayNotMarked : 1;
  const presentPct = stats ? getPct(stats.todayPresent, total) : 0;
  const absentPct = stats ? getPct(stats.todayAbsent, total) : 0;
  const notMarkedPct = stats ? 100 - presentPct - absentPct : 0;

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  /* ── Card config ── */
  const cardConfig = [
    {
      label: "Total Students",
      sub: "Enrolled this semester",
      counterRef: cntStudents,
      accentColor: {
        border: "border-blue-500/10", borderHover: "border-blue-500/25",
        glow: "bg-blue-500", iconBg: "bg-blue-500/10", text: "text-blue-400",
      },
      icon: (
        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      label: "Total Teachers",
      sub: "Active faculty members",
      counterRef: cntTeachers,
      accentColor: {
        border: "border-violet-500/10", borderHover: "border-violet-500/25",
        glow: "bg-violet-500", iconBg: "bg-violet-500/10", text: "text-violet-400",
      },
      icon: (
        <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      label: "Total Sections",
      sub: "Across all departments",
      counterRef: cntSections,
      accentColor: {
        border: "border-amber-500/10", borderHover: "border-amber-500/25",
        glow: "bg-amber-500", iconBg: "bg-amber-500/10", text: "text-amber-400",
      },
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    },
    {
      label: "Today's Attendance",
      sub: stats
        ? `${stats.todayPresent} present · ${stats.todayAbsent} absent`
        : "Loading…",
      counterRef: cntAttPct,
      accentColor: {
        border: "border-emerald-500/10", borderHover: "border-emerald-500/25",
        glow: "bg-emerald-500", iconBg: "bg-emerald-500/10", text: "text-emerald-400",
      },
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
    },
  ];

  const quickLinks = [
    { label: "Create Student", to: "/admin/create-student", emoji: "👤", cls: "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 text-blue-400" },
    { label: "View All Students", to: "/admin/students", emoji: "📋", cls: "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400" },
    { label: "Section Attendance", to: "/admin/section-attendance", emoji: "📊", cls: "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 text-amber-400" },
  ];

  /* ─────────────────────────────────────── RENDER */
  return (
    <div className="min-h-screen bg-[#06070a] pt-16">
      <div ref={pageRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ══ HEADER ══════════════════════════════════════════════════ */}
        <div className="dash-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-1">
              Admin Dashboard
            </p>
            <h1 className="text-3xl font-extrabold text-white leading-tight">
              {getGreeting()},{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-indigo-400">
                {user?.name?.split(" ")[0] ?? "Admin"}
              </span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">{today}</p>
          </div>

          {/* Right side: admin chip + logout */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Admin identity chip */}
            <div className="flex items-center gap-3 bg-[#0f1117] border border-white/5 rounded-2xl px-4 py-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-tight">{user?.name ?? "Administrator"}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-400/20 font-medium">
                  Administrator
                </span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={() => { logout(); navigate("/login", { replace: true }); }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#0f1117] border border-white/5 hover:border-rose-500/30 hover:bg-rose-500/5 text-slate-400 hover:text-rose-400 transition-all duration-200 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>

        {/* ══ SUMMARY CARDS ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cardConfig.map((cfg, i) =>
            loadingStats ? (
              <div key={i} className="stat-card rounded-2xl border border-white/5 bg-[#0f1117] p-6 space-y-4">
                <Skeleton className="w-10 h-10" />
                <Skeleton className="w-20 h-9" />
                <Skeleton className="w-36 h-3" />
              </div>
            ) : (
              <SummaryCard key={i} {...cfg} />
            )
          )}
        </div>

        {/* ══ MIDDLE ROW ═══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Today's attendance breakdown */}
          <div className="mid-panel lg:col-span-2 bg-[#0f1117] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-base text-white">Today's Attendance Breakdown</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/10" />
            </div>

            {loadingStats ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <div className="grid grid-cols-3 gap-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              </div>
            ) : (
              <>
                {/* Segmented bar — widths driven by GSAP */}
                <div className="h-2.5 rounded-full bg-[#06070a] flex overflow-hidden mb-5">
                  <div ref={barPresentRef} className="h-full bg-emerald-500 rounded-l-full" style={{ width: 0 }} />
                  <div ref={barAbsentRef} className="h-full bg-rose-500" style={{ width: 0 }} />
                  <div ref={barNotMarkedRef} className="h-full bg-slate-700 rounded-r-full" style={{ width: 0 }} />
                </div>

                {/* Count boxes */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Present", count: stats.todayPresent, pct: presentPct, color: "text-emerald-400", ring: "ring-emerald-500/15", bar: "bg-emerald-500" },
                    { label: "Absent", count: stats.todayAbsent, pct: absentPct, color: "text-rose-400", ring: "ring-rose-500/15", bar: "bg-rose-500" },
                    { label: "Not Marked", count: stats.todayNotMarked, pct: notMarkedPct, color: "text-slate-400", ring: "ring-slate-700", bar: "bg-slate-600" },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-xl bg-white/[0.025] ring-1 ${item.ring} p-4`}>
                      <div className={`text-2xl font-extrabold ${item.color}`}>{item.count}</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">{item.label}</div>
                      <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                        <div className={`h-full ${item.bar}`} style={{ width: `${item.pct}%` }} />
                      </div>
                      <div className="text-slate-600 text-xs font-mono mt-1">{item.pct}%</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mid-panel bg-[#0f1117] border border-white/5 hover:border-white/10 rounded-2xl p-6 flex flex-col gap-4 transition-colors duration-300">
            <h2 className="font-bold text-base text-white">Quick Actions</h2>
            <div className="flex flex-col gap-2.5 flex-1">
              {quickLinks.map((a, i) => (
                <Link
                  key={i}
                  to={a.to}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 group ${a.cls}`}
                >
                  <span className="text-lg">{a.emoji}</span>
                  <span className="font-medium text-sm flex-1">{a.label}</span>
                  <svg className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
            <div className="pt-3 border-t border-white/5">
              <p className="text-xs text-slate-600">
                System time{" "}
                <span className="text-slate-400 font-mono">
                  {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ══ RECENT SUBMISSIONS TABLE ═════════════════════════════ */}
        <div className="table-card bg-[#0f1117] border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden transition-colors duration-300">

          {/* Table header bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 border-b border-white/5">
            <div>
              <h2 className="font-bold text-base text-white">Recent Attendance Submissions</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest records submitted by teachers across all sections
              </p>
            </div>
            <Link
              to="/admin/section-attendance"
              className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors self-start sm:self-auto"
            >
              View full report
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Table body */}
          {loadingSubs ? (
            <div className="px-6 py-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <div ref={tableBodyRef} className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    {["Teacher", "Section", "Subject", "Date & Time", "Present / Total", "Attendance", "Status"].map((h) => (
                      <th
                        key={h}
                        className={`text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white/[0.015] whitespace-nowrap
                          ${h === "Subject" ? "hidden md:table-cell" : ""}
                          ${h === "Date & Time" ? "hidden lg:table-cell" : ""}
                          ${["Present / Total", "Attendance", "Status"].includes(h) ? "text-center" : ""}
                        `}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {submissions.map((row) => {
                    const pct = getPct(row.present, row.total);
                    return (
                      <tr key={row.id} className="tbl-row hover:bg-white/[0.025] transition-colors group">

                        {/* Teacher */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
                              <span className="text-violet-400 font-bold text-xs">{row.avatar}</span>
                            </div>
                            <span className="font-medium text-white text-sm whitespace-nowrap">{row.teacher}</span>
                          </div>
                        </td>

                        {/* Section */}
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-semibold">
                            {row.section}
                          </span>
                        </td>

                        {/* Subject */}
                        <td className="px-5 py-4 hidden md:table-cell">
                          <span className="text-slate-400 text-sm">{row.subject}</span>
                        </td>

                        {/* Date & Time */}
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <div className="text-slate-300 text-xs font-mono">
                            {new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          </div>
                          <div className="text-slate-600 text-xs font-mono">{row.time}</div>
                        </td>

                        {/* Present / Total */}
                        <td className="px-5 py-4 text-center">
                          <span className="text-white font-mono font-semibold">{row.present}</span>
                          <span className="text-slate-600 font-mono">/{row.total}</span>
                        </td>

                        {/* Attendance % with GSAP mini-bar */}
                        <td className="px-5 py-4 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <PctBadge pct={pct} />
                            <div className="w-16 h-1 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className={`mini-bar h-full rounded-full ${pct >= 75 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-rose-500"
                                  }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 text-center">
                          <StatusPill pct={pct} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {submissions.length === 0 && (
                <div className="text-center py-16 text-slate-600">
                  <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="text-sm">No submissions recorded yet today.</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          {!loadingSubs && submissions.length > 0 && (
            <div className="px-6 py-3 border-t border-white/[0.04] flex items-center justify-between">
              <span className="text-xs text-slate-600">
                Showing <span className="text-slate-400 font-medium">{submissions.length}</span> recent submissions
              </span>
              <Link to="/admin/section-attendance" className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                See full history →
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;