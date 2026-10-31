import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import studentService from "../../services/studentService";
import StudentCard from "../../components/StudentCard";
import useToast from "../../hooks/useToast";
import { ATTENDANCE_THRESHOLD, SECTIONS } from "../../utils/constants";
import { Alert, Avatar, EmptyState, Icon, PageHeader, ProgressBar, Skeleton, StatCard } from "../../components/ui";

const UNASSIGNED = "UNASSIGNED";
const PAGE_SIZE = { table: 15, grid: 12 };
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

const sectionOf = (s) => String(s.section || "").trim().toUpperCase() || UNASSIGNED;
const rollOf = (s) => s.classRollNumber ?? s.rollNumber ?? null;
const pctOf = (s) => (typeof s.attendancePercentage === "number" ? s.attendancePercentage : null);

const SORTERS = {
  name: (s) => String(s.name || "").toLowerCase(),
  registrationNumber: (s) => String(s.registrationNumber || "").toLowerCase(),
  section: (s) => sectionOf(s),
  roll: (s) => rollOf(s) ?? Number.MAX_SAFE_INTEGER,
  attendance: (s) => pctOf(s) ?? -1,
};

// Highlights the part of `text` that matches the search query.
const Highlight = ({ text, query }) => {
  const value = String(text ?? "");
  const q = query.trim();
  if (!q) return value;
  const i = value.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return value;
  return (
    <>
      {value.slice(0, i)}
      <mark style={{ background: "var(--ax-gold-soft)", color: "inherit", borderRadius: 3, padding: "0 1px" }}>
        {value.slice(i, i + q.length)}
      </mark>
      {value.slice(i + q.length)}
    </>
  );
};

// Minimal accessible modal dialog.
const Dialog = ({ title, children, onClose, footer }) => {
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    const first = panelRef.current?.querySelector("input, button:not([data-close])");
    first?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(11, 21, 48, 0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="students-dialog-title"
        className="ax-card ax-fade-up"
        style={{ width: "min(440px, 100%)", padding: 22, boxShadow: "var(--ax-shadow-lg)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <h2 id="students-dialog-title" style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--ax-text)" }}>
            {title}
          </h2>
          <button type="button" data-close className="ax-btn ax-btn-ghost ax-btn-sm" onClick={onClose} aria-label="Close dialog">
            <Icon name="x" size={16} />
          </button>
        </div>
        {children}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, flexWrap: "wrap" }}>{footer}</div>
      </div>
    </div>
  );
};

const SortHeader = ({ label, sortKey, sort, onSort, style }) => {
  const active = sort.key === sortKey;
  return (
    <th scope="col" aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} style={style}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, color: active ? "var(--ax-text)" : "inherit" }}
      >
        {label}
        <span aria-hidden="true" style={{ display: "inline-flex", opacity: active ? 1 : 0.35, transform: active && sort.dir === "asc" ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <Icon name="chevronDown" size={13} />
        </span>
      </button>
    </th>
  );
};

const StudentsList = () => {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [view, setView] = useState(() => {
    try {
      return window.matchMedia("(max-width: 640px)").matches ? "grid" : "table";
    } catch {
      return "table";
    }
  });
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null); // { type: "delete" | "link", student }
  const [linkEmail, setLinkEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchStudents = async () => {
    try {
      const res = await studentService.getAllStudents();
      setStudents(res.data || res.students || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load students.");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const retry = () => {
    setLoading(true);
    setError("");
    fetchStudents();
  };

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleDelete = (id) => {
    const student = students.find((s) => s._id === id);
    if (student) setDialog({ type: "delete", student });
  };

  const confirmDelete = async () => {
    const { student } = dialog;
    setBusy(true);
    try {
      await studentService.deleteStudent(student._id);
      setStudents((prev) => prev.filter((s) => s._id !== student._id));
      toast.success(`${student.name} was deleted.`);
      setDialog(null);
    } catch {
      toast.error("Failed to delete student.");
    } finally {
      setBusy(false);
    }
  };

  const handleLinkUser = (student) => {
    setLinkEmail("");
    setDialog({ type: "link", student });
  };

  const confirmLink = async (e) => {
    e.preventDefault();
    const email = linkEmail.trim();
    if (!email) return;
    setBusy(true);
    try {
      await studentService.linkStudentUser(dialog.student._id, email);
      const res = await studentService.getAllStudents();
      setStudents(res.data || res.students || []);
      toast.success("Student linked successfully.");
      setDialog(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to link student.");
    } finally {
      setBusy(false);
    }
  };

  const closeDialog = () => {
    if (!busy) setDialog(null);
  };

  // ── Derived data ────────────────────────────────────────────────────────
  const sectionCounts = useMemo(() => {
    const map = {};
    SECTIONS.forEach((s) => (map[s] = 0));
    students.forEach((s) => {
      const key = sectionOf(s);
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .map(([section, count]) => ({ section, count }))
      .sort((a, b) => (a.section === UNASSIGNED ? 1 : b.section === UNASSIGNED ? -1 : a.section.localeCompare(b.section)));
  }, [students]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = students.filter((s) => {
      if (selectedSection && sectionOf(s) !== selectedSection) return false;
      if (!q) return true;
      return [s.name, s.registrationNumber, rollOf(s)].some((v) => String(v ?? "").toLowerCase().includes(q));
    });
    const get = SORTERS[sort.key];
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [students, query, selectedSection, sort]);

  const pageSize = PAGE_SIZE[view];
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const linkedCount = students.filter((s) => s.userId).length;
  const unassignedCount = students.filter((s) => sectionOf(s) === UNASSIGNED).length;
  const activeSections = sectionCounts.filter((s) => s.section !== UNASSIGNED && s.count > 0).length;

  const onSort = (key) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "attendance" ? "desc" : "asc" }));
    setPage(1);
  };

  const pickSection = (section) => {
    setSelectedSection(section);
    setPage(1);
  };

  const sectionLabel = (s) => (s === UNASSIGNED ? "Unassigned" : s);

  return (
    <div className="ax-page">
      <div className="ax-container">
        <PageHeader
          eyebrow="Admin · Students"
          title="Students"
          subtitle="Search, filter and manage every enrolled student."
          actions={
            <Link to="/admin/create-student" className="ax-btn ax-btn-primary">
              <Icon name="userPlus" size={16} /> Add student
            </Link>
          }
        />

        {/* KPIs */}
        <div className="ax-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 22 }}>
          <StatCard label="Total students" value={students.length} icon="users" tone="navy" loading={loading} />
          <StatCard label="Active sections" value={activeSections} icon="layers" tone="blue" loading={loading} />
          <StatCard
            label="Linked logins"
            value={linkedCount}
            icon="key"
            tone="gold"
            loading={loading}
            hint={!loading && students.length ? `${Math.round((linkedCount / students.length) * 100)}% have a student account` : undefined}
          />
          <StatCard label="Unassigned" value={unassignedCount} icon="alert" tone={unassignedCount ? "warning" : "success"} loading={loading} hint="Students without a section" />
        </div>

        {error && (
          <div style={{ marginBottom: 18 }}>
            <Alert tone="danger" title="Couldn't load students">
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "space-between" }}>
                <span>{error}</span>
                <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={retry}>
                  <Icon name="refresh" size={14} /> Retry
                </button>
              </div>
            </Alert>
          </div>
        )}

        {/* Toolbar */}
        <div className="ax-card ax-fade-up" style={{ padding: 16, marginBottom: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1 1 260px", minWidth: 0 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ax-muted)", display: "flex" }}>
                <Icon name="search" size={16} />
              </span>
              <label htmlFor="student-search" className="sr-only">
                Search students
              </label>
              <input
                id="student-search"
                type="search"
                className="ax-input"
                style={{ paddingLeft: 38, paddingRight: query ? 38 : undefined }}
                placeholder="Search by name, registration or roll number…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className="ax-btn ax-btn-ghost ax-btn-sm"
                  onClick={() => {
                    setQuery("");
                    setPage(1);
                  }}
                  aria-label="Clear search"
                  style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", height: 30, padding: "0 8px" }}
                >
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>

            <div role="group" aria-label="View" style={{ display: "inline-flex", padding: 3, borderRadius: 10, background: "var(--ax-surface-2)", border: "1px solid var(--ax-border)" }}>
              {[
                { key: "table", label: "Table", icon: "menu" },
                { key: "grid", label: "Cards", icon: "dashboard" },
              ].map((v) => (
                <button
                  key={v.key}
                  type="button"
                  aria-pressed={view === v.key}
                  onClick={() => {
                    setView(v.key);
                    setPage(1);
                  }}
                  className="ax-btn ax-btn-sm"
                  style={{
                    height: 30,
                    background: view === v.key ? "var(--ax-surface)" : "transparent",
                    boxShadow: view === v.key ? "var(--ax-shadow-sm)" : "none",
                    borderColor: view === v.key ? "var(--ax-border)" : "transparent",
                    color: view === v.key ? "var(--ax-text)" : "var(--ax-muted)",
                  }}
                >
                  <Icon name={v.icon} size={14} /> {v.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }} role="group" aria-label="Filter by section">
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ax-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 4 }}>Section</span>
            {[{ section: "", count: students.length }, ...sectionCounts].map((item) => {
              const active = selectedSection === item.section;
              return (
                <button
                  key={item.section || "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => pickSection(item.section)}
                  disabled={loading}
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
                  {item.section ? sectionLabel(item.section) : "All"}
                  <span
                    style={{
                      fontSize: 11,
                      padding: "1px 7px",
                      borderRadius: 999,
                      background: active ? "rgba(255,255,255,0.16)" : "var(--ax-surface-2)",
                      color: active ? "var(--ax-gold-2)" : "var(--ax-muted)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {loading ? "…" : item.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", fontSize: 13, color: "var(--ax-muted)" }}>
            <span aria-live="polite">
              {loading ? (
                "Loading students…"
              ) : (
                <>
                  <strong style={{ color: "var(--ax-text)" }}>{filtered.length}</strong> of {students.length} student{students.length !== 1 ? "s" : ""}
                  {selectedSection && ` in ${selectedSection === UNASSIGNED ? "no section" : `section ${selectedSection}`}`}
                  {query.trim() && ` matching “${query.trim()}”`}
                </>
              )}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="info" size={13} /> Auto policy: first 20 students go to PA, then new admissions are balanced between PA and PB.
            </span>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="ax-card" style={{ padding: 16 }} aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 7 ? "1px solid var(--ax-border)" : "none" }}>
                <Skeleton width={36} height={36} radius={11} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <Skeleton height={12} width="35%" />
                  <Skeleton height={10} width="20%" />
                </div>
                <Skeleton height={10} width="18%" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="ax-card">
            <EmptyState
              icon={students.length ? "search" : "users"}
              title={students.length ? "No students match your filters" : "No students yet"}
              message={
                students.length
                  ? "Try a different name, registration number or section."
                  : error
                  ? "The student list could not be loaded."
                  : "Add your first student to get started."
              }
              action={
                students.length ? (
                  <button
                    type="button"
                    className="ax-btn ax-btn-secondary ax-btn-sm"
                    onClick={() => {
                      setQuery("");
                      pickSection("");
                    }}
                  >
                    Clear filters
                  </button>
                ) : (
                  !error && (
                    <Link to="/admin/create-student" className="ax-btn ax-btn-primary ax-btn-sm">
                      <Icon name="userPlus" size={14} /> Add student
                    </Link>
                  )
                )
              }
            />
          </div>
        ) : view === "grid" ? (
          <div key={`grid-${currentPage}-${selectedSection}`} className="ax-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {pageRows.map((student) => (
              <StudentCard key={student._id} student={student} onDelete={handleDelete} onLinkUser={handleLinkUser} />
            ))}
          </div>
        ) : (
          <div className="ax-card ax-fade-up" style={{ overflow: "hidden" }}>
            <div className="ax-table-wrap">
              <table className="ax-table">
                <thead>
                  <tr>
                    <SortHeader label="Student" sortKey="name" sort={sort} onSort={onSort} />
                    <SortHeader label="Registration no." sortKey="registrationNumber" sort={sort} onSort={onSort} />
                    <SortHeader label="Section" sortKey="section" sort={sort} onSort={onSort} />
                    <SortHeader label="Roll" sortKey="roll" sort={sort} onSort={onSort} />
                    <SortHeader label="Attendance" sortKey="attendance" sort={sort} onSort={onSort} />
                    <th scope="col">Login</th>
                    <th scope="col" style={{ textAlign: "right" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((s) => {
                    const pct = pctOf(s);
                    const low = pct !== null && pct < ATTENDANCE_THRESHOLD;
                    const section = sectionOf(s);
                    return (
                      <tr key={s._id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 190 }}>
                            <Avatar name={s.name} size={34} />
                            <div style={{ minWidth: 0 }}>
                              <Link
                                to={`/admin/students/${s._id}/analytics`}
                                className="hover:underline"
                                style={{ fontWeight: 600, color: "var(--ax-text)", textDecoration: "none" }}
                              >
                                <Highlight text={s.name} query={query} />
                              </Link>
                              <div style={{ fontSize: 12, color: "var(--ax-muted)" }}>
                                {[s.department, s.admissionYear && `Batch ${s.admissionYear}`].filter(Boolean).join(" · ") || "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontFamily: MONO, fontSize: 13, whiteSpace: "nowrap" }}>
                          <Highlight text={s.registrationNumber || "—"} query={query} />
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {section === UNASSIGNED ? (
                            <span className="ax-badge ax-badge-warning">Unassigned</span>
                          ) : (
                            <span className="ax-badge ax-badge-info">
                              {section}
                              {s.semester != null && <span style={{ opacity: 0.7 }}>· S{s.semester}</span>}
                            </span>
                          )}
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>{rollOf(s) != null ? <Highlight text={rollOf(s)} query={query} /> : "—"}</td>
                        <td style={{ minWidth: 150 }}>
                          {pct === null ? (
                            <span style={{ fontSize: 12, color: "var(--ax-muted)" }}>No data</span>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ flex: 1 }}>
                                <ProgressBar value={pct} threshold={ATTENDANCE_THRESHOLD} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: low ? "var(--ax-danger)" : "var(--ax-text)" }}>{pct}%</span>
                              {low && <span className="ax-badge ax-badge-danger">Low</span>}
                            </div>
                          )}
                        </td>
                        <td>
                          {s.userId ? (
                            <span className="ax-badge ax-badge-success">
                              <Icon name="check" size={11} /> Linked
                            </span>
                          ) : (
                            <button type="button" className="ax-btn ax-btn-ghost ax-btn-sm" onClick={() => handleLinkUser(s)} style={{ color: "var(--ax-blue)" }}>
                              <Icon name="key" size={13} /> Link
                            </button>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                            <Link to={`/admin/students/${s._id}/analytics`} className="ax-btn ax-btn-secondary ax-btn-sm" aria-label={`View analytics for ${s.name}`}>
                              <Icon name="chart" size={14} />
                              <span className="hidden lg:inline">Analytics</span>
                            </Link>
                            <button type="button" className="ax-btn ax-btn-danger ax-btn-sm" onClick={() => handleDelete(s._id)} aria-label={`Delete ${s.name}`} title="Delete student">
                              <Icon name="x" size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > pageSize && (
          <nav aria-label="Pagination" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
            <span style={{ fontSize: 13, color: "var(--ax-muted)" }}>
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page">
                <Icon name="arrowLeft" size={14} />
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pageCount || Math.abs(p - currentPage) <= 1)
                .map((p, i, arr) => (
                  <span key={p} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                    {i > 0 && p - arr[i - 1] > 1 && <span style={{ color: "var(--ax-muted)" }}>…</span>}
                    <button
                      type="button"
                      aria-current={p === currentPage ? "page" : undefined}
                      onClick={() => setPage(p)}
                      className={`ax-btn ax-btn-sm ${p === currentPage ? "ax-btn-primary" : "ax-btn-ghost"}`}
                      style={{ minWidth: 32, padding: "0 8px" }}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Next page">
                <Icon name="arrowRight" size={14} />
              </button>
            </div>
          </nav>
        )}
      </div>

      {dialog?.type === "delete" && (
        <Dialog
          title="Delete student?"
          onClose={closeDialog}
          footer={
            <>
              <button type="button" className="ax-btn ax-btn-secondary" onClick={closeDialog} disabled={busy}>
                Cancel
              </button>
              <button type="button" className="ax-btn ax-btn-danger" onClick={confirmDelete} disabled={busy} style={{ borderColor: "var(--ax-danger)" }}>
                {busy ? <span className="ax-spinner" /> : <Icon name="x" size={14} />} Delete
              </button>
            </>
          }
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, borderRadius: 12, background: "var(--ax-surface-2)", border: "1px solid var(--ax-border)" }}>
            <Avatar name={dialog.student.name} size={40} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: "var(--ax-text)" }}>{dialog.student.name}</div>
              <div style={{ fontSize: 12.5, color: "var(--ax-muted)", fontFamily: MONO }}>{dialog.student.registrationNumber}</div>
            </div>
          </div>
          <p style={{ fontSize: 14, color: "var(--ax-text-2)", margin: "14px 0 0" }}>Are you sure you want to delete this student? This cannot be undone.</p>
        </Dialog>
      )}

      {dialog?.type === "link" && (
        <Dialog
          title="Link student login"
          onClose={closeDialog}
          footer={
            <>
              <button type="button" className="ax-btn ax-btn-secondary" onClick={closeDialog} disabled={busy}>
                Cancel
              </button>
              <button type="submit" form="link-user-form" className="ax-btn ax-btn-primary" disabled={busy || !linkEmail.trim()}>
                {busy ? <span className="ax-spinner" /> : <Icon name="key" size={14} />} Link account
              </button>
            </>
          }
        >
          <form id="link-user-form" onSubmit={confirmLink}>
            <label htmlFor="link-email" className="ax-label">
              Verified student account email for {dialog.student.name}
            </label>
            <input
              id="link-email"
              type="email"
              className="ax-input"
              placeholder="student@example.com"
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              required
              autoComplete="off"
            />
            <p className="ax-help" style={{ marginTop: 8 }}>
              The account must already be registered and verified as a student.
            </p>
          </form>
        </Dialog>
      )}
    </div>
  );
};

export default StudentsList;
