import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import authService from "../../services/authService";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import { PageHeader, StatCard, SkeletonRows, EmptyState, Avatar, Alert, Icon } from "../../components/ui";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : null);
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-");

// Card with a consistent header row.
const Panel = ({ id, title, subtitle, icon, count, actions, children, flush = false }) => (
  <section id={id} className="ax-card ax-fade-up" style={{ overflow: "hidden", scrollMarginTop: 88 }}>
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "18px 22px", borderBottom: "1px solid var(--ax-border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        {icon && (
          <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--ax-surface-2)", border: "1px solid var(--ax-border)", color: "var(--ax-navy)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name={icon} size={18} />
          </span>
        )}
        <div style={{ minWidth: 0 }}>
          <h2 className="ax-section-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {title}
            {typeof count === "number" && <span className={`ax-badge ${count > 0 ? "ax-badge-warning" : ""}`}>{count}</span>}
          </h2>
          {subtitle && <p className="ax-section-sub">{subtitle}</p>}
        </div>
      </div>
      {actions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>{actions}</div>}
    </header>
    <div style={flush ? undefined : { padding: 22 }}>{children}</div>
  </section>
);

// Smoothly expanding region (animates height via grid rows).
const Collapse = ({ open, id, children }) => (
  <div id={id} aria-hidden={!open} style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows .3s var(--ax-ease)" }}>
    <div style={{ overflow: "hidden", minHeight: 0 }} inert={open ? undefined : true}>
      {children}
    </div>
  </div>
);

const DetailTile = ({ label, value, icon }) => (
  <div style={{ background: "var(--ax-surface)", border: "1px solid var(--ax-border)", borderRadius: 10, padding: "10px 12px", minWidth: 0 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ax-muted)", marginBottom: 4 }}>
      {icon && <Icon name={icon} size={13} />}
      {label}
    </div>
    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ax-text)", overflowWrap: "anywhere" }}>{value}</div>
  </div>
);

const StatusBadge = ({ status }) => (
  <span className={`ax-badge ${status === "approved" ? "ax-badge-success" : status === "rejected" ? "ax-badge-danger" : "ax-badge-warning"}`} style={{ textTransform: "capitalize" }}>
    <span className="ax-dot" /> {status || "-"}
  </span>
);

// Confirmation dialog for rejecting a request, with an optional reason.
const RejectDialog = ({ target, busy, onCancel, onConfirm }) => {
  const [reason, setReason] = useState("");
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div
      onClick={() => !busy && onCancel()}
      style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(11,21,48,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ta-reject-title"
        className="ax-card ax-card-pad ax-fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 440, boxShadow: "var(--ax-shadow-lg)" }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--ax-danger-soft)", color: "var(--ax-danger)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="alert" size={20} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h3 id="ta-reject-title" style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--ax-text)" }}>
              Reject {target.kind}?
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--ax-muted)" }}>
              <strong style={{ color: "var(--ax-text-2)" }}>{target.name}</strong> will not be able to sign in with this role.
            </p>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(reason.trim());
          }}
          style={{ marginTop: 18 }}
        >
          <label htmlFor="ta-reject-reason" className="ax-label">
            Rejection reason <span style={{ fontWeight: 400, color: "var(--ax-muted)" }}>(optional)</span>
          </label>
          <textarea
            id="ta-reject-reason"
            className="ax-input"
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Qualification documents missing"
            maxLength={300}
          />
          <div className="ax-help">Shown in the review history.</div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <button type="button" className="ax-btn ax-btn-secondary" onClick={onCancel} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="ax-btn ax-btn-danger" disabled={busy} style={{ borderColor: "var(--ax-danger)" }}>
              {busy ? <span className="ax-spinner" aria-hidden="true" /> : <Icon name="xCircle" size={16} />}
              {busy ? "Rejecting…" : "Reject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HISTORY_FILTERS = [
  { value: "all", label: "All history" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const TeacherApplications = () => {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const isSuperAdmin = Boolean(user?.isSuperAdmin);
  const [pending, setPending] = useState([]);
  const [reviewed, setReviewed] = useState([]);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [reviewedAdmins, setReviewedAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingId, setReviewingId] = useState("");
  const [reviewingAdminId, setReviewingAdminId] = useState("");
  const [expandedTeacherId, setExpandedTeacherId] = useState("");
  const [expandedAdminId, setExpandedAdminId] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);

  const [search, setSearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // `silent` refreshes data in place (after an approve/reject) without showing skeletons.
  const fetchData = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
        setError("");
      }
      try {
        const requests = [authService.getPendingTeacherApplications(), authService.getReviewedTeacherApplications()];
        if (isSuperAdmin) {
          requests.push(authService.getPendingAdminRequests(), authService.getReviewedAdminRequests());
        }

        const responses = await Promise.all(requests);
        const [pendingRes, reviewedRes, pendingAdminRes, reviewedAdminRes] = responses;
        setPending(pendingRes.data || []);
        setReviewed(reviewedRes.data || []);
        setPendingAdmins(pendingAdminRes?.data || []);
        setReviewedAdmins(reviewedAdminRes?.data || []);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load teacher applications.");
      } finally {
        setLoading(false);
      }
    },
    [isSuperAdmin]
  );

  useEffect(() => {
    fetchData({ silent: true });
  }, [fetchData]);

  // Support deep links such as /admin/teacher-applications#pending-admin-requests
  useEffect(() => {
    if (loading || !location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading, location.hash]);

  const onReview = async (teacherId, action, reason = "") => {
    const t = pending.find((p) => p._id === teacherId);
    setReviewingId(teacherId);
    try {
      await authService.reviewTeacherApplication(teacherId, action, reason);
      toast.success(`${t?.name || "Application"} ${action === "approve" ? "approved — they can now sign in" : "rejected"}`);
      setRejectTarget(null);
      await fetchData({ silent: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to review application.");
    } finally {
      setReviewingId("");
    }
  };

  const onReviewAdmin = async (adminId, action, reason = "") => {
    const a = pendingAdmins.find((p) => p._id === adminId);
    setReviewingAdminId(adminId);
    try {
      await authService.reviewAdminRequest(adminId, action, reason);
      toast.success(`${a?.name || "Admin request"} ${action === "approve" ? "approved" : "rejected"}`);
      setRejectTarget(null);
      await fetchData({ silent: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to review admin request.");
    } finally {
      setReviewingAdminId("");
    }
  };

  const closeReject = useCallback(() => setRejectTarget(null), []);

  const filteredPending = useMemo(() => {
    const q = search.toLowerCase();
    return pending.filter(
      (t) => t.name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q) || t.primarySubject?.toLowerCase().includes(q)
    );
  }, [pending, search]);

  const filteredReviewed = useMemo(() => {
    const q = search.toLowerCase();
    return reviewed
      .filter((t) => (historyFilter === "all" ? true : t.approvalStatus === historyFilter))
      .filter((t) => t.name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q) || t.primarySubject?.toLowerCase().includes(q));
  }, [reviewed, search, historyFilter]);

  const updateSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };
  const updateHistoryFilter = (value) => {
    setHistoryFilter(value);
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredReviewed.length / rowsPerPage));
  const paginatedReviewed = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredReviewed.slice(start, start + rowsPerPage);
  }, [filteredReviewed, currentPage]);

  const approvedCount = reviewed.filter((t) => t.approvalStatus === "approved").length;
  const rejectedCount = reviewed.filter((t) => t.approvalStatus === "rejected").length;

  const exportReviewedCsv = () => {
    if (!filteredReviewed.length) return;

    const escape = (value) => {
      const str = String(value ?? "");
      return `"${str.replace(/"/g, '""')}"`;
    };

    const header = [
      "Name",
      "Email",
      "Primary Subject",
      "Secondary Subject",
      "Years Of Experience",
      "Highest Qualification",
      "Status",
      "Reviewed At",
      "Rejection Reason",
    ];

    const rows = filteredReviewed.map((t) => [
      t.name || "",
      t.email || "",
      t.primarySubject || "",
      t.secondarySubject || "",
      t.yearsOfExperience ?? 0,
      t.highestQualification || "",
      t.approvalStatus || "",
      t.approvedAt ? new Date(t.approvedAt).toISOString() : "",
      t.rejectionReason || "",
    ]);

    const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teacher_review_history_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredReviewed.length} record${filteredReviewed.length === 1 ? "" : "s"} to CSV`);
  };

  const rejectBusy = rejectTarget ? (rejectTarget.type === "teacher" ? reviewingId : reviewingAdminId) === rejectTarget.id : false;

  return (
    <div className="ax-page">
      <div className="ax-container">
        <PageHeader
          eyebrow="Admin workspace · Approvals"
          title="Teacher Applications"
          subtitle="Super Admin approval queue and review history"
          actions={
            <>
              <Link to="/admin/dashboard" className="ax-btn ax-btn-secondary">
                <Icon name="arrowLeft" size={16} /> Dashboard
              </Link>
              <button type="button" className="ax-btn ax-btn-primary" onClick={() => fetchData()} disabled={loading}>
                {loading ? <span className="ax-spinner" aria-hidden="true" /> : <Icon name="refresh" size={16} />}
                Refresh
              </button>
            </>
          }
        />

        <div className="ax-stagger grid gap-4 grid-cols-2 xl:grid-cols-4" style={{ marginBottom: 24 }}>
          <StatCard label="Pending applications" value={pending.length} icon="clock" tone="warning" hint="Awaiting decision" loading={loading} />
          <StatCard label="Approved" value={approvedCount} icon="checkCircle" tone="success" hint="Teachers onboarded" loading={loading} />
          <StatCard label="Rejected" value={rejectedCount} icon="xCircle" tone="danger" hint="Applications declined" loading={loading} />
          {isSuperAdmin ? (
            <StatCard label="Admin requests" value={pendingAdmins.length} icon="shield" tone="blue" hint={`${reviewedAdmins.length} reviewed so far`} loading={loading} />
          ) : (
            <StatCard label="Total reviewed" value={reviewed.length} icon="layers" tone="blue" hint="Approved + rejected" loading={loading} />
          )}
        </div>

        <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
          {!isSuperAdmin && (
            <Alert tone="warning" title="View only">
              Teacher and admin requests can be approved only by Super Admin.
            </Alert>
          )}
          {error && (
            <Alert tone="danger" title="Couldn't load applications">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <span>{error}</span>
                <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={() => fetchData()}>
                  <Icon name="refresh" size={14} /> Retry
                </button>
              </div>
            </Alert>
          )}

          {/* Toolbar */}
          <div className="ax-card ax-fade-up" style={{ padding: 14, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1 1 260px", minWidth: 0 }}>
              <label htmlFor="ta-search" className="sr-only">
                Search applications
              </label>
              <Icon name="search" size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ax-muted)" }} />
              <input
                id="ta-search"
                type="search"
                className="ax-input"
                value={search}
                onChange={(e) => updateSearch(e.target.value)}
                placeholder="Search by name, email, or subject"
                style={{ paddingLeft: 38 }}
              />
            </div>
            <div role="group" aria-label="Filter review history" style={{ display: "inline-flex", padding: 4, gap: 4, borderRadius: 12, background: "var(--ax-surface-2)", border: "1px solid var(--ax-border)", flexWrap: "wrap" }}>
              {HISTORY_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={historyFilter === f.value}
                  onClick={() => updateHistoryFilter(f.value)}
                  className={`ax-btn ax-btn-sm ${historyFilter === f.value ? "ax-btn-primary" : "ax-btn-ghost"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 24 }}>
          {/* Pending teacher applications */}
          <Panel
            title="Pending applications"
            subtitle="Super Admin approval required before a teacher can sign in"
            icon="briefcase"
            count={loading ? undefined : filteredPending.length}
          >
            {loading ? (
              <SkeletonRows rows={3} height={76} />
            ) : filteredPending.length === 0 ? (
              <EmptyState
                icon={search ? "search" : "checkCircle"}
                title={search ? "No matching applications" : "No pending applications"}
                message={search ? `Nothing matches "${search}".` : "New teacher sign-ups will appear here for review."}
              />
            ) : (
              <div className="ax-stagger" style={{ display: "grid", gap: 12 }}>
                {filteredPending.map((t) => {
                  const open = expandedTeacherId === t._id;
                  const busy = reviewingId === t._id;
                  const detailsId = `ta-details-${t._id}`;
                  return (
                    <article key={t._id} className="ta-item" data-open={open || undefined}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="ta-toggle"
                          aria-expanded={open}
                          aria-controls={detailsId}
                          onClick={() => setExpandedTeacherId(open ? "" : t._id)}
                        >
                          <Avatar name={t.name || "T"} size={44} />
                          <span style={{ minWidth: 0, textAlign: "left" }}>
                            <span style={{ display: "block", fontWeight: 700, color: "var(--ax-text)", fontSize: 15 }}>{t.name}</span>
                            <span style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 4, fontSize: 13, color: "var(--ax-muted)" }}>
                              <span className="ax-badge ax-badge-info">{t.primarySubject || "N/A"}</span>
                              {t.createdAt && <span>Applied {fmtDate(t.createdAt)}</span>}
                            </span>
                          </span>
                          <Icon name="chevronDown" size={18} className="ta-chevron" style={{ color: "var(--ax-muted)", marginLeft: "auto" }} />
                        </button>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <StatusBadge status="pending" />
                          <button
                            type="button"
                            className="ax-btn ax-btn-success ax-btn-sm"
                            onClick={() => onReview(t._id, "approve")}
                            disabled={!isSuperAdmin || busy}
                          >
                            {busy && !rejectTarget ? <span className="ax-spinner" aria-hidden="true" /> : <Icon name="check" size={14} />}
                            Approve
                          </button>
                          <button
                            type="button"
                            className="ax-btn ax-btn-danger ax-btn-sm"
                            onClick={() => setRejectTarget({ type: "teacher", id: t._id, name: t.name, kind: "teacher application" })}
                            disabled={!isSuperAdmin || busy}
                          >
                            <Icon name="x" size={14} /> Reject
                          </button>
                        </div>
                      </div>
                      <Collapse open={open} id={detailsId}>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--ax-border)" }}>
                          <DetailTile label="Email" icon="mail" value={t.email || "N/A"} />
                          {t.phone && <DetailTile label="Phone" icon="phone" value={t.phone} />}
                          <DetailTile label="Experience" icon="briefcase" value={`${t.yearsOfExperience || 0} years`} />
                          <DetailTile label="Qualification" icon="teacher" value={t.highestQualification || "N/A"} />
                          {t.secondarySubject && <DetailTile label="Secondary subject" icon="book" value={t.secondarySubject} />}
                          <DetailTile label="Background" icon="building" value={t.educationalBackground || "N/A"} />
                        </div>
                      </Collapse>
                    </article>
                  );
                })}
              </div>
            )}
          </Panel>

          {/* Pending admin requests */}
          {isSuperAdmin && (
            <Panel
              id="pending-admin-requests"
              title="Pending admin requests"
              subtitle="People asking for admin access to AttendX"
              icon="shield"
              count={loading ? undefined : pendingAdmins.length}
            >
              {loading ? (
                <SkeletonRows rows={2} height={76} />
              ) : pendingAdmins.length === 0 ? (
                <EmptyState icon="checkCircle" title="No pending admin requests" message="You're all caught up." />
              ) : (
                <div className="ax-stagger" style={{ display: "grid", gap: 12 }}>
                  {pendingAdmins.map((a) => {
                    const open = expandedAdminId === a._id;
                    const busy = reviewingAdminId === a._id;
                    const detailsId = `ta-admin-details-${a._id}`;
                    return (
                      <article key={a._id} className="ta-item" data-open={open || undefined}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="ta-toggle"
                            aria-expanded={open}
                            aria-controls={detailsId}
                            onClick={() => setExpandedAdminId(open ? "" : a._id)}
                          >
                            <Avatar name={a.name} size={44} />
                            <span style={{ minWidth: 0, textAlign: "left" }}>
                              <span style={{ display: "block", fontWeight: 700, color: "var(--ax-text)", fontSize: 15 }}>{a.name}</span>
                              <span style={{ display: "block", fontSize: 13, color: "var(--ax-muted)", marginTop: 2 }}>
                                {a.department || "N/A"} · {a.designation || "N/A"}
                              </span>
                            </span>
                            <Icon name="chevronDown" size={18} className="ta-chevron" style={{ color: "var(--ax-muted)", marginLeft: "auto" }} />
                          </button>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button type="button" className="ax-btn ax-btn-success ax-btn-sm" onClick={() => onReviewAdmin(a._id, "approve")} disabled={busy}>
                              {busy && !rejectTarget ? <span className="ax-spinner" aria-hidden="true" /> : <Icon name="check" size={14} />}
                              Approve
                            </button>
                            <button
                              type="button"
                              className="ax-btn ax-btn-danger ax-btn-sm"
                              onClick={() => setRejectTarget({ type: "admin", id: a._id, name: a.name, kind: "admin request" })}
                              disabled={busy}
                            >
                              <Icon name="x" size={14} /> Reject
                            </button>
                          </div>
                        </div>
                        <Collapse open={open} id={detailsId}>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--ax-border)" }}>
                            <DetailTile label="Email" icon="mail" value={a.email || "N/A"} />
                            <DetailTile label="Phone" icon="phone" value={a.phone || "N/A"} />
                            <DetailTile label="Reason" icon="info" value={a.adminAccessReason || "N/A"} />
                          </div>
                        </Collapse>
                      </article>
                    );
                  })}
                </div>
              )}
            </Panel>
          )}

          {/* Teacher review history */}
          <Panel
            title="Review history"
            subtitle={loading ? "Approved and rejected teacher applications" : `${filteredReviewed.length} record${filteredReviewed.length === 1 ? "" : "s"}${historyFilter !== "all" ? ` · ${historyFilter}` : ""}`}
            icon="clipboard"
            flush
            actions={
              <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={exportReviewedCsv} disabled={!filteredReviewed.length}>
                <Icon name="arrowRight" size={14} style={{ transform: "rotate(90deg)" }} /> Export CSV
              </button>
            }
          >
            {loading ? (
              <div style={{ padding: 22 }}>
                <SkeletonRows rows={5} />
              </div>
            ) : filteredReviewed.length === 0 ? (
              <EmptyState icon="clipboard" title="No reviewed applications found" message={search || historyFilter !== "all" ? "Try clearing the search or filter." : "Decisions you make will be recorded here."} />
            ) : (
              <>
                <div className="ax-table-wrap">
                  <table className="ax-table">
                    <thead>
                      <tr>
                        <th scope="col">Teacher</th>
                        <th scope="col">Subject</th>
                        <th scope="col">Status</th>
                        <th scope="col">Reviewed at</th>
                        <th scope="col">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedReviewed.map((t) => (
                        <tr key={t._id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200 }}>
                              <Avatar name={t.name} size={32} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 600, color: "var(--ax-text)" }}>{t.name}</div>
                                <div style={{ fontSize: 12, color: "var(--ax-muted)" }}>{t.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>{t.primarySubject || "N/A"}</td>
                          <td>
                            <StatusBadge status={t.approvalStatus} />
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(t.approvedAt)}</td>
                          <td style={{ maxWidth: 280, color: t.rejectionReason ? "var(--ax-text-2)" : "var(--ax-muted)" }}>{t.rejectionReason || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: "12px 22px", borderTop: "1px solid var(--ax-border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 13, color: "var(--ax-muted)" }}>
                    Showing {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filteredReviewed.length)} of {filteredReviewed.length}
                  </div>
                  <nav aria-label="Review history pages" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} aria-label="Previous page">
                      <Icon name="arrowLeft" size={14} /> Prev
                    </button>
                    <span style={{ fontSize: 13, color: "var(--ax-text-2)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      {currentPage} / {totalPages}
                    </span>
                    <button type="button" className="ax-btn ax-btn-secondary ax-btn-sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} aria-label="Next page">
                      Next <Icon name="arrowRight" size={14} />
                    </button>
                  </nav>
                </div>
              </>
            )}
          </Panel>

          {/* Admin review history */}
          {isSuperAdmin && (
            <Panel title="Admin review history" subtitle="Decisions on admin access requests" icon="shield" flush>
              {loading ? (
                <div style={{ padding: 22 }}>
                  <SkeletonRows rows={3} />
                </div>
              ) : reviewedAdmins.length === 0 ? (
                <EmptyState icon="shield" title="No reviewed admin requests found" />
              ) : (
                <div className="ax-table-wrap">
                  <table className="ax-table">
                    <thead>
                      <tr>
                        <th scope="col">Admin</th>
                        <th scope="col">Department</th>
                        <th scope="col">Status</th>
                        <th scope="col">Reviewed at</th>
                        <th scope="col">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewedAdmins.map((a) => (
                        <tr key={a._id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200 }}>
                              <Avatar name={a.name} size={32} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 600, color: "var(--ax-text)" }}>{a.name}</div>
                                <div style={{ fontSize: 12, color: "var(--ax-muted)" }}>{a.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>{a.department || "N/A"}</td>
                          <td>
                            <StatusBadge status={a.adminAccessStatus} />
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(a.adminApprovedAt)}</td>
                          <td style={{ maxWidth: 280, color: a.adminRejectionReason ? "var(--ax-text-2)" : "var(--ax-muted)" }}>{a.adminRejectionReason || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          )}
        </div>
      </div>

      {rejectTarget && (
        <RejectDialog
          key={rejectTarget.id}
          target={rejectTarget}
          busy={rejectBusy}
          onCancel={closeReject}
          onConfirm={(reason) =>
            rejectTarget.type === "teacher" ? onReview(rejectTarget.id, "reject", reason) : onReviewAdmin(rejectTarget.id, "reject", reason)
          }
        />
      )}

      <style>{`
        .ta-item {
          border: 1px solid var(--ax-border); background: var(--ax-surface-2);
          border-radius: 14px; padding: 14px 16px;
          transition: border-color .2s ease, box-shadow .2s ease, background-color .2s ease;
        }
        .ta-item:hover { border-color: var(--ax-border-strong); background: var(--ax-surface); box-shadow: var(--ax-shadow); }
        .ta-item[data-open] { background: var(--ax-surface); border-color: var(--ax-border-strong); }
        .ta-toggle {
          display: flex; align-items: center; gap: 12px; flex: 1 1 260px; min-width: 0;
          background: none; border: 0; padding: 4px; margin: -4px; border-radius: 10px;
          font: inherit; color: inherit; cursor: pointer;
        }
        .ta-chevron { transition: transform .25s var(--ax-ease); }
        .ta-toggle[aria-expanded="true"] .ta-chevron { transform: rotate(180deg); }
      `}</style>
    </div>
  );
};

export default TeacherApplications;
