import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import authService from "../../services/authService";
import useAuth from "../../hooks/useAuth";

const C = {
  navy: "#0a1628",
  navyMid: "#102040",
  gold: "#c9a84c",
  white: "#ffffff",
  light: "#f4f6fa",
  border: "#dde3ef",
  mid: "#6b7280",
};
const PAGE_W = "min(97vw, 1640px)";

const TeacherApplications = () => {
  const { user } = useAuth();
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

  const [search, setSearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const requests = [
        authService.getPendingTeacherApplications(),
        authService.getReviewedTeacherApplications(),
      ];
      if (isSuperAdmin) {
        requests.push(authService.getPendingAdminRequests(), authService.getReviewedAdminRequests());
      }

      const responses = await Promise.all(requests);
      const [pendingRes, reviewedRes, pendingAdminRes, reviewedAdminRes] = responses;
      setPending(pendingRes.data || []);
      setReviewed(reviewedRes.data || []);
      setPendingAdmins(pendingAdminRes?.data || []);
      setReviewedAdmins(reviewedAdminRes?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load teacher applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      gsap.fromTo(
        ".ta-anim",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, stagger: 0.07, duration: 0.5, ease: "power3.out" }
      );
    }
  }, [loading, currentPage, search, historyFilter]);

  const onReview = async (teacherId, action) => {
    setReviewingId(teacherId);
    try {
      let reason = "";
      if (action === "reject") {
        reason = window.prompt("Enter rejection reason (optional):") || "";
      }
      await authService.reviewTeacherApplication(teacherId, action, reason);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to review application.");
    } finally {
      setReviewingId("");
    }
  };

  const onReviewAdmin = async (adminId, action) => {
    setReviewingAdminId(adminId);
    try {
      let reason = "";
      if (action === "reject") {
        reason = window.prompt("Enter rejection reason (optional):") || "";
      }
      await authService.reviewAdminRequest(adminId, action, reason);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to review admin request.");
    } finally {
      setReviewingAdminId("");
    }
  };

  const filteredPending = useMemo(() => {
    const q = search.toLowerCase();
    return pending.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.primarySubject?.toLowerCase().includes(q)
    );
  }, [pending, search]);

  const filteredReviewed = useMemo(() => {
    const q = search.toLowerCase();
    return reviewed
      .filter((t) => (historyFilter === "all" ? true : t.approvalStatus === historyFilter))
      .filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.email?.toLowerCase().includes(q) ||
          t.primarySubject?.toLowerCase().includes(q)
      );
  }, [reviewed, search, historyFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, historyFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReviewed.length / rowsPerPage));
  const paginatedReviewed = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredReviewed.slice(start, start + rowsPerPage);
  }, [filteredReviewed, currentPage]);

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
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 8% 10%, #c7d2fe 0%, #eaf1ff 30%, #e9eefc 64%, #eef2ff 100%)", fontFamily: "'Segoe UI','Inter',Arial,sans-serif" }}>
      <div style={{ background: `linear-gradient(120deg, ${C.navy} 0%, ${C.navyMid} 55%, #173465 100%)`, paddingTop: "88px", paddingBottom: "48px", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: `linear-gradient(to right, ${C.gold}, #e8c96a, ${C.gold})` }} />
        <div style={{ width: PAGE_W, margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ color: C.white, margin: 0, fontSize: "44px", fontWeight: 900 }}>Teacher Applications</h1>
            <p style={{ color: "rgba(255,255,255,0.65)", marginTop: "8px", fontSize: "17px" }}>Super Admin approval queue and review history</p>
          </div>
          <Link to="/admin/dashboard" style={{ color: C.white, textDecoration: "none", border: "1px solid rgba(255,255,255,0.3)", padding: "8px 14px", borderRadius: "8px", fontSize: "13px" }}>
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div style={{ width: PAGE_W, margin: "0 auto", padding: "34px 24px 54px" }}>
        <div className="ta-anim ta-search-row" style={{ display: "flex", gap: "14px", marginBottom: "24px" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or subject"
            style={{ flex: 1, padding: "16px 16px", border: `1px solid ${C.border}`, borderRadius: "14px", fontSize: "16px", background: "rgba(255,255,255,0.9)", boxShadow: "0 12px 24px rgba(10,22,40,0.1)", outline: "none" }}
          />
          <select
            value={historyFilter}
            onChange={(e) => setHistoryFilter(e.target.value)}
            style={{ padding: "16px 16px", border: `1px solid ${C.border}`, borderRadius: "14px", fontSize: "16px", background: "rgba(255,255,255,0.9)", boxShadow: "0 12px 24px rgba(10,22,40,0.1)", outline: "none" }}
          >
            <option value="all">All History</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {error && (
          <div style={{ marginBottom: "14px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "10px 12px", color: "#b91c1c", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <div className="ta-anim ta-hover-card" style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: "16px", padding: "22px", marginBottom: "24px", boxShadow: "0 12px 28px rgba(10,22,40,0.1)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "20px", color: C.navy }}>Pending Applications (Super Admin Approval)</h2>
          {!isSuperAdmin && (
            <div style={{ marginBottom: "12px", background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", borderRadius: "8px", padding: "8px 10px", fontSize: "12px" }}>
              Teacher and admin requests can be approved only by Super Admin.
            </div>
          )}
          {loading ? (
            <div style={{ color: C.mid }}>Loading...</div>
          ) : filteredPending.length === 0 ? (
            <div style={{ color: C.mid, fontSize: "13px" }}>No pending applications found.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {filteredPending.map((t) => (
                <div key={t._id} style={{ border: `1px solid ${C.border}`, background: "rgba(244,246,250,0.96)", borderRadius: "14px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "280px" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #0a1628, #102040)", color: "#c9a84c", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "13px" }}>
                        {(t.name || "T").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: C.navy, fontSize: "17px" }}>{t.name}</div>
                        <div style={{ fontSize: "14px", color: C.mid }}>Subject: {t.primarySubject || "N/A"}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ padding: "3px 10px", borderRadius: "999px", background: "#fee2e2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: "11px", fontWeight: 700 }}>
                        Pending
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedTeacherId(expandedTeacherId === t._id ? "" : t._id)}
                        style={{ border: `1px solid ${C.border}`, background: "#fff", color: C.navy, borderRadius: "9px", padding: "8px 12px", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}
                      >
                        {expandedTeacherId === t._id ? "Hide Details" : "View Details"}
                      </button>
                      <button
                        onClick={() => onReview(t._id, "approve")}
                        disabled={!isSuperAdmin || reviewingId === t._id}
                        style={{ border: "none", background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", borderRadius: "9px", padding: "8px 14px", cursor: !isSuperAdmin || reviewingId === t._id ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "13px" }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onReview(t._id, "reject")}
                        disabled={!isSuperAdmin || reviewingId === t._id}
                        style={{ border: "none", background: "linear-gradient(135deg, #dc2626, #b91c1c)", color: "#fff", borderRadius: "9px", padding: "8px 14px", cursor: !isSuperAdmin || reviewingId === t._id ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "13px" }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: expandedTeacherId === t._id ? "12px" : 0,
                      paddingTop: expandedTeacherId === t._id ? "12px" : 0,
                      borderTop: expandedTeacherId === t._id ? `1px solid ${C.border}` : "none",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
                      gap: "12px",
                      maxHeight: expandedTeacherId === t._id ? "340px" : "0px",
                      opacity: expandedTeacherId === t._id ? 1 : 0,
                      overflow: "hidden",
                      transition: "max-height .35s ease, opacity .25s ease, margin .25s ease, padding .25s ease",
                    }}
                  >
                      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "10px", padding: "10px" }}>
                        <div style={{ fontSize: "11px", color: C.mid, marginBottom: "4px" }}>Email</div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: C.navy }}>{t.email || "N/A"}</div>
                      </div>
                      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "10px", padding: "10px" }}>
                        <div style={{ fontSize: "11px", color: C.mid, marginBottom: "4px" }}>Experience</div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: C.navy }}>{t.yearsOfExperience || 0} years</div>
                      </div>
                      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "10px", padding: "10px" }}>
                        <div style={{ fontSize: "11px", color: C.mid, marginBottom: "4px" }}>Qualification</div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: C.navy }}>{t.highestQualification || "N/A"}</div>
                      </div>
                      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "10px", padding: "10px" }}>
                        <div style={{ fontSize: "11px", color: C.mid, marginBottom: "4px" }}>Background</div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: C.navy }}>{t.educationalBackground || "N/A"}</div>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isSuperAdmin && (
          <div id="pending-admin-requests" className="ta-anim ta-hover-card" style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: "14px", padding: "16px", marginBottom: "20px", boxShadow: "0 12px 28px rgba(10,22,40,0.1)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", scrollMarginTop: "110px" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: "17px", color: C.navy }}>Pending Admin Requests</h2>
            {loading ? (
              <div style={{ color: C.mid }}>Loading...</div>
            ) : pendingAdmins.length === 0 ? (
              <div style={{ color: C.mid, fontSize: "13px" }}>No pending admin requests found.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {pendingAdmins.map((a) => (
                  <div key={a._id} style={{ border: `1px solid ${C.border}`, background: "rgba(244,246,250,0.9)", borderRadius: "12px", padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 700, color: C.navy }}>{a.name}</div>
                        <div style={{ fontSize: "13px", color: C.mid, marginTop: "2px" }}>{a.department || "N/A"} · {a.designation || "N/A"}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedAdminId(expandedAdminId === a._id ? "" : a._id)}
                        style={{ border: `1px solid ${C.border}`, background: "#fff", color: C.navy, borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontWeight: 700, fontSize: "12px" }}
                      >
                        {expandedAdminId === a._id ? "Hide Details" : "View Details"}
                      </button>
                    </div>
                    {expandedAdminId === a._id && (
                      <div style={{ marginTop: "10px", fontSize: "13px", color: C.mid, display: "grid", gap: "4px" }}>
                        <div>Email: {a.email || "N/A"}</div>
                        <div>Phone: {a.phone || "N/A"}</div>
                        <div>Reason: {a.adminAccessReason || "N/A"}</div>
                      </div>
                    )}
                    <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => onReviewAdmin(a._id, "approve")}
                        disabled={reviewingAdminId === a._id}
                        style={{ border: "none", background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", borderRadius: "8px", padding: "7px 12px", cursor: reviewingAdminId === a._id ? "not-allowed" : "pointer", fontWeight: 600 }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onReviewAdmin(a._id, "reject")}
                        disabled={reviewingAdminId === a._id}
                        style={{ border: "none", background: "linear-gradient(135deg, #dc2626, #b91c1c)", color: "#fff", borderRadius: "8px", padding: "7px 12px", cursor: reviewingAdminId === a._id ? "not-allowed" : "pointer", fontWeight: 600 }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="ta-anim ta-hover-card" style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: "16px", padding: "20px", boxShadow: "0 12px 28px rgba(10,22,40,0.1)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 style={{ margin: 0, fontSize: "17px", color: C.navy }}>Review History (Super Admin)</h2>
            <button
              onClick={exportReviewedCsv}
              disabled={!filteredReviewed.length}
              style={{
                border: "none",
                background: filteredReviewed.length ? C.navy : C.mid,
                color: C.white,
                borderRadius: "7px",
                padding: "7px 12px",
                cursor: filteredReviewed.length ? "pointer" : "not-allowed",
                fontSize: "12px",
              }}
            >
              Export CSV
            </button>
          </div>
          {loading ? (
            <div style={{ color: C.mid }}>Loading...</div>
          ) : filteredReviewed.length === 0 ? (
            <div style={{ color: C.mid, fontSize: "13px" }}>No reviewed applications found.</div>
          ) : (
            <div>
              <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.light }}>
                    {["Name", "Email", "Subject", "Status", "Reviewed At", "Reason"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px", fontSize: "13px", color: C.mid }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedReviewed.map((t) => (
                    <tr key={t._id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "12px", fontSize: "14px", color: C.navy }}>{t.name}</td>
                      <td style={{ padding: "12px", fontSize: "14px", color: C.mid }}>{t.email}</td>
                      <td style={{ padding: "12px", fontSize: "14px", color: C.mid }}>{t.primarySubject || "N/A"}</td>
                      <td style={{ padding: "12px", fontSize: "14px", color: t.approvalStatus === "approved" ? "#166534" : "#991b1b", fontWeight: 700 }}>{t.approvalStatus}</td>
                      <td style={{ padding: "12px", fontSize: "14px", color: C.mid }}>
                        {t.approvedAt ? new Date(t.approvedAt).toLocaleString("en-IN") : "-"}
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px", color: C.mid }}>{t.rejectionReason || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "12px", color: C.mid }}>
                  Showing {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filteredReviewed.length)} of {filteredReviewed.length}
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ border: `1px solid ${C.border}`, background: C.white, borderRadius: "6px", padding: "5px 10px", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: "12px" }}
                  >
                    Prev
                  </button>
                  <span style={{ fontSize: "12px", color: C.navy }}>
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{ border: `1px solid ${C.border}`, background: C.white, borderRadius: "6px", padding: "5px 10px", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: "12px" }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {isSuperAdmin && (
          <div className="ta-anim ta-hover-card" style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: "14px", padding: "16px", marginTop: "20px", boxShadow: "0 12px 28px rgba(10,22,40,0.1)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: "17px", color: C.navy }}>Admin Review History (Super Admin)</h2>
            {loading ? (
              <div style={{ color: C.mid }}>Loading...</div>
            ) : reviewedAdmins.length === 0 ? (
              <div style={{ color: C.mid, fontSize: "13px" }}>No reviewed admin requests found.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: C.light }}>
                      {["Name", "Email", "Department", "Status", "Reviewed At", "Reason"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "10px", fontSize: "12px", color: C.mid }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reviewedAdmins.map((a) => (
                      <tr key={a._id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "10px", fontSize: "13px", color: C.navy }}>{a.name}</td>
                        <td style={{ padding: "10px", fontSize: "13px", color: C.mid }}>{a.email}</td>
                        <td style={{ padding: "10px", fontSize: "13px", color: C.mid }}>{a.department || "N/A"}</td>
                        <td style={{ padding: "10px", fontSize: "13px", color: a.adminAccessStatus === "approved" ? "#166534" : "#991b1b", fontWeight: 700 }}>
                          {a.adminAccessStatus}
                        </td>
                        <td style={{ padding: "10px", fontSize: "13px", color: C.mid }}>
                          {a.adminApprovedAt ? new Date(a.adminApprovedAt).toLocaleString("en-IN") : "-"}
                        </td>
                        <td style={{ padding: "10px", fontSize: "13px", color: C.mid }}>{a.adminRejectionReason || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        .ta-hover-card { transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
        .ta-hover-card:hover { transform: translateY(-4px); box-shadow: 0 22px 38px rgba(10,22,40,.16); border-color: #93c5fd; }
        @media (max-width: 900px) {
          .ta-search-row { flex-direction: column; }
        }
      `}</style>
    </div>
  );
};

export default TeacherApplications;
