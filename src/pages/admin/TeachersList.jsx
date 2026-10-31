import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import useToast from "../../hooks/useToast";
import { SEMESTERS, SECTIONS, SUBJECTS } from "../../utils/constants";
import { PageHeader, StatCard, Skeleton, EmptyState, Avatar, Alert, Icon } from "../../components/ui";

const TeacherCardSkeleton = () => (
  <div className="ax-card ax-card-pad" style={{ display: "grid", gap: 14 }}>
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Skeleton width={44} height={44} radius={12} />
      <div style={{ flex: 1, display: "grid", gap: 8 }}>
        <Skeleton height={14} width="50%" />
        <Skeleton height={12} width="70%" />
      </div>
    </div>
    <Skeleton height={24} width="60%" radius={999} />
    <Skeleton height={40} />
  </div>
);

const TeachersList = () => {
  const toast = useToast();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigning, setAssigning] = useState(null);
  const [formByTeacher, setFormByTeacher] = useState({});
  const [assignmentsByTeacher, setAssignmentsByTeacher] = useState({});
  const [search, setSearch] = useState("");

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await api.get("/auth/teachers");
      const teachersList = res.data.data || [];
      setTeachers(teachersList);
      const assignmentPromises = teachersList.map((t) =>
        api.get(`/auth/teachers/${t._id}/assignments`).then((r) => [t._id, r.data.data || []]).catch(() => [t._id, []])
      );
      const assignmentEntries = await Promise.all(assignmentPromises);
      setAssignmentsByTeacher(Object.fromEntries(assignmentEntries));
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch teachers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const retry = () => {
    setLoading(true);
    setError("");
    fetchTeachers();
  };

  const handleAssign = async (teacherId) => {
    const payload = formByTeacher[teacherId] || {};
    if (!payload.semester || !payload.section || !payload.subject) return;
    setAssigning(teacherId);
    try {
      await api.post(`/auth/teachers/${teacherId}/assign`, {
        semester: Number(payload.semester),
        section: payload.section,
        subject: payload.subject,
      });
      toast.success(`Assigned ${payload.subject} · Section ${payload.section} · Sem ${payload.semester}`);
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign teacher");
    } finally {
      setAssigning(null);
    }
  };

  const setTeacherFormValue = (teacherId, key, value) => {
    setFormByTeacher((prev) => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        [key]: value,
      },
    }));
  };

  const summary = useMemo(() => {
    const all = Object.values(assignmentsByTeacher).flat();
    return {
      assignments: all.length,
      subjects: new Set(all.map((a) => a.subject)).size,
      unassigned: teachers.filter((t) => !(assignmentsByTeacher[t._id] || []).length).length,
    };
  }, [assignmentsByTeacher, teachers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.teacherId?.toLowerCase().includes(q) ||
        t.primarySubject?.toLowerCase().includes(q)
    );
  }, [teachers, search]);

  return (
    <div className="ax-page">
      <div className="ax-container">
        <PageHeader
          eyebrow="Admin workspace · Faculty"
          title="Teachers"
          subtitle="Faculty directory and section / subject assignments"
          actions={
            <>
              <Link to="/admin/dashboard" className="ax-btn ax-btn-secondary">
                <Icon name="arrowLeft" size={16} /> Dashboard
              </Link>
              <Link to="/admin/teacher-applications" className="ax-btn ax-btn-primary">
                <Icon name="briefcase" size={16} /> Applications
              </Link>
            </>
          }
        />

        <div className="ax-stagger grid gap-4 grid-cols-2 xl:grid-cols-4" style={{ marginBottom: 24 }}>
          <StatCard label="Teachers" value={teachers.length} icon="teacher" tone="navy" hint="Approved faculty" loading={loading} />
          <StatCard label="Assignments" value={summary.assignments} icon="clipboard" tone="blue" hint="Section + subject pairs" loading={loading} />
          <StatCard label="Subjects covered" value={summary.subjects} icon="book" tone="gold" hint={`of ${SUBJECTS.length} offered`} loading={loading} />
          <StatCard
            label="Unassigned"
            value={summary.unassigned}
            icon="alert"
            tone={summary.unassigned > 0 ? "warning" : "success"}
            hint={summary.unassigned > 0 ? "Teachers without a class" : "Everyone has a class"}
            loading={loading}
          />
        </div>

        {error && (
          <div style={{ marginBottom: 20 }}>
            <Alert tone="danger" title="Couldn't load teachers">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <span>{error}</span>
                <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={retry}>
                  <Icon name="refresh" size={14} /> Retry
                </button>
              </div>
            </Alert>
          </div>
        )}

        {!loading && teachers.length > 0 && (
          <div className="ax-card ax-fade-up" style={{ padding: 14, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
            <div style={{ position: "relative", flex: "1 1 260px", minWidth: 0 }}>
              <label htmlFor="tl-search" className="sr-only">
                Search teachers
              </label>
              <Icon name="search" size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ax-muted)" }} />
              <input
                id="tl-search"
                type="search"
                className="ax-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, teacher ID or subject"
                style={{ paddingLeft: 38 }}
              />
            </div>
            <span style={{ fontSize: 13, color: "var(--ax-muted)" }}>
              {filtered.length} of {teachers.length} teacher{teachers.length === 1 ? "" : "s"}
            </span>
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <TeacherCardSkeleton key={i} />
            ))}
          </div>
        ) : teachers.length === 0 ? (
          !error && (
            <div className="ax-card">
              <EmptyState
                icon="teacher"
                title="No teachers found"
                message="Approved teachers will appear here. Review pending sign-ups on the applications page."
                action={
                  <Link to="/admin/teacher-applications" className="ax-btn ax-btn-primary ax-btn-sm">
                    Open applications
                  </Link>
                }
              />
            </div>
          )
        ) : filtered.length === 0 ? (
          <div className="ax-card">
            <EmptyState
              icon="search"
              title="No matching teachers"
              message={`Nothing matches "${search}".`}
              action={
                <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={() => setSearch("")}>
                  Clear search
                </button>
              }
            />
          </div>
        ) : (
          <div className="ax-stagger grid gap-5 md:grid-cols-2">
            {filtered.map((t) => {
              const form = formByTeacher[t._id] || {};
              const assignments = assignmentsByTeacher[t._id] || [];
              const ready = Boolean(form.semester && form.section && form.subject);
              const busy = assigning === t._id;
              return (
                <article key={t._id} className="ax-card ax-card-hover" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ padding: "20px 20px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <Avatar name={t.name} size={46} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ax-text)" }}>{t.name}</h2>
                        <span className="ax-badge" style={{ fontVariantNumeric: "tabular-nums" }}>
                          <Icon name="hash" size={12} /> {t.teacherId || "N/A"}
                        </span>
                      </div>
                      <a href={`mailto:${t.email}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: 13, color: "var(--ax-muted)", textDecoration: "none", overflowWrap: "anywhere" }}>
                        <Icon name="mail" size={13} /> {t.email}
                      </a>
                      {t.primarySubject && (
                        <div style={{ marginTop: 4, fontSize: 13, color: "var(--ax-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                          <Icon name="book" size={13} /> Specialises in {t.primarySubject}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: "0 20px 16px", flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ax-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                      Current assignments ({assignments.length})
                    </div>
                    {assignments.length === 0 ? (
                      <span className="ax-badge ax-badge-warning">
                        <span className="ax-dot" /> Not assigned yet
                      </span>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {assignments.map((a) => (
                          <span key={a._id} className="ax-badge ax-badge-gold">
                            Sem {a.semester} · {a.section} · {a.subject}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAssign(t._id);
                    }}
                    style={{ padding: 16, borderTop: "1px solid var(--ax-border)", background: "var(--ax-surface-2)" }}
                    aria-label={`Assign a class to ${t.name}`}
                  >
                    <div className="grid gap-2 grid-cols-2 sm:grid-cols-[0.8fr_0.8fr_1.2fr_auto]">
                      <div>
                        <label htmlFor={`sem-${t._id}`} className="sr-only">
                          Semester
                        </label>
                        <select id={`sem-${t._id}`} className="ax-input" value={form.semester || ""} onChange={(e) => setTeacherFormValue(t._id, "semester", e.target.value)} style={{ height: 38 }}>
                          <option value="" disabled>
                            Semester
                          </option>
                          {SEMESTERS.map((s) => (
                            <option key={s} value={s}>
                              Semester {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`sec-${t._id}`} className="sr-only">
                          Section
                        </label>
                        <select id={`sec-${t._id}`} className="ax-input" value={form.section || ""} onChange={(e) => setTeacherFormValue(t._id, "section", e.target.value)} style={{ height: 38 }}>
                          <option value="" disabled>
                            Section
                          </option>
                          {SECTIONS.map((s) => (
                            <option key={s} value={s}>
                              Section {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label htmlFor={`sub-${t._id}`} className="sr-only">
                          Subject
                        </label>
                        <select id={`sub-${t._id}`} className="ax-input" value={form.subject || ""} onChange={(e) => setTeacherFormValue(t._id, "subject", e.target.value)} style={{ height: 38 }}>
                          <option value="" disabled>
                            Subject
                          </option>
                          {SUBJECTS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="ax-btn ax-btn-primary col-span-2 sm:col-span-1"
                        disabled={busy || !ready}
                        title={ready ? undefined : "Choose semester, section and subject"}
                        style={{ height: 38 }}
                      >
                        {busy ? <span className="ax-spinner" aria-hidden="true" /> : <Icon name="plus" size={16} />}
                        {busy ? "Assigning…" : "Assign"}
                      </button>
                    </div>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeachersList;
