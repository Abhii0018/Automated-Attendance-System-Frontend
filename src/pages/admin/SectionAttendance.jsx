import { useMemo, useState } from "react";
import api from "../../services/api";
import AttendanceTable from "../../components/AttendanceTable";
import { ATTENDANCE_THRESHOLD, SECTIONS, SEMESTERS, SUBJECTS } from "../../utils/constants";
import { Alert, EmptyState, Icon, PageHeader, StatCard } from "../../components/ui";

const PERIODS = Array.from({ length: 12 }, (_, i) => i + 1);

const toInputDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayStr = () => toInputDate(new Date());
const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toInputDate(d);
};
const prettyDate = (s) => new Date(`${s}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short", year: "numeric" });
const errorText = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

/*
  GET /attendance/section needs semester, section, subject, periodNumber and date.
  attendanceService.getAttendanceBySection does not forward periodNumber, so this page
  calls the same endpoint through the shared api client with the period included.
*/
const fetchSession = async ({ section, date, subject, semester }, periodNumber) => {
  const res = await api.get("/attendance/section", { params: { section, date, subject, semester, periodNumber } });
  const data = res.data?.data ?? res.data;
  return data && data.totalStudents !== undefined ? { ...data, periodNumber: data.periodNumber ?? periodNumber } : null;
};

const Chip = ({ active, onClick, children, count }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 32,
      padding: "0 12px",
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      border: `1px solid ${active ? "var(--ax-navy)" : "var(--ax-border)"}`,
      background: active ? "var(--ax-navy)" : "var(--ax-surface)",
      color: active ? "#fff" : "var(--ax-text-2)",
      transition: "all 0.18s ease",
    }}
  >
    {children}
    {count !== undefined && <span style={{ opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>{count}</span>}
  </button>
);

const SectionAttendance = () => {
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState(String(SEMESTERS[0] ?? 1));
  const [period, setPeriod] = useState("");
  const [date, setDate] = useState(todayStr);
  const [sessions, setSessions] = useState([]);
  const [lastQuery, setLastQuery] = useState(null);
  const [notFoundMsg, setNotFoundMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [activePeriod, setActivePeriod] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!section || !subject || !date) return;
    const query = { section, date, subject, semester };
    setLoading(true);
    setSearched(true);
    setError("");
    setNotFoundMsg("");
    setActivePeriod("");
    setSearch("");
    setStatusFilter("");
    setLastQuery({ ...query, period });

    const periods = period ? [Number(period)] : PERIODS;
    const results = await Promise.allSettled(periods.map((p) => fetchSession(query, p)));
    const found = results.filter((r) => r.status === "fulfilled" && r.value).map((r) => r.value);
    const failed = results.find((r) => r.status === "rejected");

    if (!found.length && failed) {
      setError(errorText(failed.reason, "Failed to load attendance."));
      setSessions([]);
    } else {
      setSessions(found.sort((a, b) => a.periodNumber - b.periodNumber));
      if (!found.length) setNotFoundMsg("Attendance not submitted yet for this date");
    }
    setLoading(false);
  };

  // Rows for the table (one per student per period)
  const records = useMemo(
    () =>
      sessions.flatMap((s) => {
        const row = (st, status) => ({
          _id: `${s.periodNumber}-${st._id}`,
          studentId: st._id,
          studentName: st.name,
          registrationNumber: st.registrationNumber,
          date: s.date,
          subject: s.subject,
          period: s.periodNumber,
          status,
        });
        return [
          ...(s.presentStudents || []).filter(Boolean).map((st) => row(st, "present")),
          ...(s.absentStudents || []).filter(Boolean).map((st) => row(st, "absent")),
        ].sort((a, b) => String(a.registrationNumber || a.studentName).localeCompare(String(b.registrationNumber || b.studentName), undefined, { numeric: true }));
      }),
    [sessions]
  );

  const scoped = activePeriod ? sessions.filter((s) => String(s.periodNumber) === activePeriod) : sessions;
  const summary = scoped.length
    ? scoped.reduce((acc, s) => ({ total: acc.total + (s.totalStudents || 0), present: acc.present + (s.totalPresent || 0), absent: acc.absent + (s.totalAbsent || 0) }), { total: 0, present: 0, absent: 0 })
    : null;
  const rate = summary && summary.total ? (summary.present / summary.total) * 100 : 0;
  const rateLow = rate < ATTENDANCE_THRESHOLD;

  const scopedRecords = activePeriod ? records.filter((r) => String(r.period) === activePeriod) : records;
  const q = search.trim().toLowerCase();
  const visibleRecords = scopedRecords.filter(
    (r) => (!statusFilter || r.status === statusFilter) && (!q || [r.studentName, r.registrationNumber].some((v) => String(v || "").toLowerCase().includes(q)))
  );
  const countBy = (status) => scopedRecords.filter((r) => r.status === status).length;

  const resetResults = () => {
    setSearched(false);
    setSessions([]);
    setError("");
    setNotFoundMsg("");
    setLastQuery(null);
  };

  return (
    <div className="ax-page">
      <div className="ax-container">
        <PageHeader eyebrow="Admin · Attendance" title="Section attendance" subtitle="Look up who was present or absent in any class session." />

        {/* Filter bar */}
        <form onSubmit={handleSearch} className="ax-card ax-fade-up" style={{ padding: 18, marginBottom: 18 }}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-6" style={{ gap: 14, alignItems: "end" }}>
            <div>
              <label htmlFor="sa-section" className="ax-label">
                Section <span style={{ color: "var(--ax-danger)" }}>*</span>
              </label>
              <select id="sa-section" className="ax-input" value={section} onChange={(e) => setSection(e.target.value)} required>
                <option value="">Select section</option>
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    Section {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sa-semester" className="ax-label">
                Semester
              </label>
              <select id="sa-semester" className="ax-input" value={semester} onChange={(e) => setSemester(e.target.value)}>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sa-subject" className="ax-label">
                Subject <span style={{ color: "var(--ax-danger)" }}>*</span>
              </label>
              <select id="sa-subject" className="ax-input" value={subject} onChange={(e) => setSubject(e.target.value)} required>
                <option value="">Select subject</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sa-date" className="ax-label">
                Date
              </label>
              <input id="sa-date" className="ax-input" type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="sa-period" className="ax-label">
                Period
              </label>
              <select id="sa-period" className="ax-input" value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="">All periods</option>
                {PERIODS.map((p) => (
                  <option key={p} value={p}>
                    Period {p}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="ax-btn ax-btn-primary" disabled={loading || !section || !subject} style={{ width: "100%", height: 42 }}>
              {loading ? <span className="ax-spinner" /> : <Icon name="search" size={16} />}
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 12, fontSize: 12, color: "var(--ax-muted)" }}>
            <span>Quick date:</span>
            {[
              { label: "Today", value: todayStr() },
              { label: "Yesterday", value: yesterdayStr() },
            ].map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => setDate(d.value)}
                className="ax-badge"
                style={{ cursor: "pointer", ...(date === d.value ? { background: "var(--ax-blue-soft)", color: "var(--ax-blue)", borderColor: "#c7d6fe" } : {}) }}
                aria-pressed={date === d.value}
              >
                {d.label}
              </button>
            ))}
            {searched && !loading && (
              <button type="button" className="ax-btn ax-btn-ghost ax-btn-sm" onClick={resetResults} style={{ marginLeft: "auto" }}>
                <Icon name="x" size={13} /> Clear results
              </button>
            )}
          </div>
        </form>

        {error && (
          <div style={{ marginBottom: 18 }}>
            <Alert tone="danger" title="Couldn't load attendance" onClose={() => setError("")}>
              {error}
            </Alert>
          </div>
        )}

        {/* Context line */}
        {searched && lastQuery && !error && (
          <div className="ax-fade-up" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
            <span className="ax-badge ax-badge-info">Section {lastQuery.section}</span>
            <span className="ax-badge">Semester {lastQuery.semester}</span>
            <span className="ax-badge ax-badge-gold">{lastQuery.subject}</span>
            <span className="ax-badge">
              <Icon name="calendar" size={12} /> {prettyDate(lastQuery.date)}
            </span>
            {!loading && sessions.length > 0 && (
              <span style={{ fontSize: 13, color: "var(--ax-muted)" }}>
                · {sessions.length} session{sessions.length !== 1 ? "s" : ""} found
              </span>
            )}
          </div>
        )}

        {/* Period tabs */}
        {!loading && sessions.length > 1 && (
          <div role="group" aria-label="Filter by period" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <Chip active={activePeriod === ""} onClick={() => setActivePeriod("")}>
              All periods
            </Chip>
            {sessions.map((s) => (
              <Chip key={s.periodNumber} active={activePeriod === String(s.periodNumber)} onClick={() => setActivePeriod(String(s.periodNumber))}>
                Period {s.periodNumber}
                <span style={{ opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>
                  {s.totalPresent}/{s.totalStudents}
                </span>
              </Chip>
            ))}
          </div>
        )}

        {/* Summary */}
        {(loading || summary) && (
          <div className="grid lg:grid-cols-5" style={{ gap: 14, marginBottom: 18 }}>
            <div className="ax-stagger lg:col-span-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
              <StatCard label="Marked" value={summary?.total ?? 0} icon="users" tone="navy" loading={loading} />
              <StatCard label="Present" value={summary?.present ?? 0} icon="checkCircle" tone="success" loading={loading} />
              <StatCard label="Absent" value={summary?.absent ?? 0} icon="xCircle" tone="danger" loading={loading} />
            </div>
            <div className="ax-card ax-card-pad ax-fade-up lg:col-span-2" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ax-muted)" }}>Attendance rate</span>
                {!loading && summary?.total > 0 && (rateLow ? <span className="ax-badge ax-badge-danger">Below {ATTENDANCE_THRESHOLD}%</span> : <span className="ax-badge ax-badge-success">On track</span>)}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: !loading && rateLow && summary?.total ? "var(--ax-danger)" : "var(--ax-text)" }}>
                {loading || !summary?.total ? "—" : `${Math.round(rate)}%`}
              </div>
              <div
                role="img"
                aria-label={summary?.total ? `${summary.present} present, ${summary.absent} absent` : "No data"}
                style={{ display: "flex", gap: summary?.present && summary?.absent ? 2 : 0, height: 12, borderRadius: 999, overflow: "hidden", background: "#edf1f7" }}
              >
                {!loading && summary?.total > 0 && (
                  <>
                    <span style={{ width: `${(summary.present / summary.total) * 100}%`, background: "var(--ax-success)", transition: "width 0.9s var(--ax-ease)" }} />
                    <span style={{ width: `${(summary.absent / summary.total) * 100}%`, background: "var(--ax-danger)", transition: "width 0.9s var(--ax-ease)" }} />
                  </>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ax-text-2)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--ax-success)" }} /> Present {summary?.present ?? 0}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--ax-danger)" }} /> Absent {summary?.absent ?? 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {searched && !error && (loading || sessions.length > 0) && (
          <section>
            {!loading && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 380 }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ax-muted)", display: "flex" }}>
                    <Icon name="search" size={15} />
                  </span>
                  <label htmlFor="sa-student-search" className="sr-only">
                    Search students in results
                  </label>
                  <input
                    id="sa-student-search"
                    type="search"
                    className="ax-input"
                    style={{ paddingLeft: 36, height: 36 }}
                    placeholder="Search name or registration no."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div role="group" aria-label="Filter by status" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Chip active={statusFilter === ""} onClick={() => setStatusFilter("")} count={scopedRecords.length}>
                    All
                  </Chip>
                  <Chip active={statusFilter === "present"} onClick={() => setStatusFilter("present")} count={countBy("present")}>
                    Present
                  </Chip>
                  <Chip active={statusFilter === "absent"} onClick={() => setStatusFilter("absent")} count={countBy("absent")}>
                    Absent
                  </Chip>
                </div>
              </div>
            )}
            <AttendanceTable
              key={`${activePeriod}|${statusFilter}|${q}`}
              records={visibleRecords}
              showStudent
              showRegistration
              showPeriod={sessions.length > 1 && !activePeriod}
              showDate={false}
              showSubject={false}
              loading={loading}
              pageSize={30}
              emptyTitle="No students match"
              emptyMessage="Try a different name, registration number or status."
            />
          </section>
        )}

        {/* No session found */}
        {searched && !loading && !error && sessions.length === 0 && (
          <div className="ax-card ax-fade-up">
            <EmptyState
              icon="calendar"
              title={notFoundMsg || "No attendance found"}
              message={`No ${lastQuery?.subject || ""} class was marked for Section ${lastQuery?.section || ""}${lastQuery?.period ? ` in period ${lastQuery.period}` : ""} on ${lastQuery ? prettyDate(lastQuery.date) : "this date"}. Try another date or period.`}
              action={
                <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={() => setDate(yesterdayStr())}>
                  <Icon name="calendar" size={14} /> Set date to yesterday
                </button>
              }
            />
          </div>
        )}

        {/* Before search */}
        {!searched && (
          <div className="ax-card ax-fade-up">
            <EmptyState
              icon="clipboard"
              title="Pick a class session"
              message="Choose a section, subject and date, then press Search to see who was present or absent. Leave the period on “All periods” to check the whole day."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionAttendance;
