import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { SEMESTERS, SECTIONS, SUBJECTS } from "../../utils/constants";

const TeachersList = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigning, setAssigning] = useState(null);
  const [formByTeacher, setFormByTeacher] = useState({});
  const [assignmentsByTeacher, setAssignmentsByTeacher] = useState({});

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/auth/teachers");
      const teachersList = res.data.data || [];
      setTeachers(teachersList);
      const assignmentPromises = teachersList.map((t) =>
        api.get(`/auth/teachers/${t._id}/assignments`).then((r) => [t._id, r.data.data || []]).catch(() => [t._id, []])
      );
      const assignmentEntries = await Promise.all(assignmentPromises);
      setAssignmentsByTeacher(Object.fromEntries(assignmentEntries));
    } catch (err) {
      setError("Failed to fetch teachers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

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
      alert("Teacher assignment updated successfully");
      fetchTeachers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign teacher");
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

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 8% 10%, #c7d2fe 0%, #eaf1ff 30%, #e9eefc 64%, #eef2ff 100%)", fontFamily: "'Segoe UI','Inter',Arial,sans-serif" }}>
      <div style={{ background: "linear-gradient(120deg, #0a1628 0%, #102040 55%, #173465 100%)", paddingTop: "88px", paddingBottom: "42px", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(to right, #c9a84c, #e8c96a, #c9a84c)" }} />
        <div style={{ width: "min(96vw, 1300px)", margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <div>
            <div style={{ color: "#c9a84c", fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Admin Workspace</div>
            <h1 style={{ color: "#fff", fontSize: "clamp(28px,4vw,40px)", margin: 0 }}>Teachers List</h1>
          </div>
          <Link to="/admin/dashboard" style={{ textDecoration: "none", color: "#fff", border: "1px solid rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.08)", padding: "10px 16px", borderRadius: "10px", fontWeight: 600 }}>Back to Dashboard</Link>
        </div>
      </div>
      <div style={{ width: "min(96vw, 1300px)", margin: "0 auto", padding: "30px 24px 48px" }}>

      {error && <div style={{ color: "red", marginBottom: "20px" }}>{error}</div>}

      {loading ? (
        <div>Loading teachers...</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", background: "rgba(255,255,255,0.86)", border: "1px solid rgba(255,255,255,0.72)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 18px 34px rgba(10,22,40,0.12)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
          <thead>
            <tr style={{ background: "#f4f6fa", textAlign: "left" }}>
              <th style={{ padding: "16px", borderBottom: "1px solid #dde3ef" }}>Name</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #dde3ef" }}>Email</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #dde3ef" }}>Teacher ID</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #dde3ef" }}>Assign Section + Subject</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t._id} style={{ borderBottom: "1px solid #dde3ef" }}>
                <td style={{ padding: "16px", color: "#0a1628", fontWeight: "bold" }}>{t.name}</td>
                <td style={{ padding: "16px", color: "#6b7280" }}>{t.email}</td>
                <td style={{ padding: "16px", color: "#6b7280" }}>{t.teacherId || "N/A"}</td>
                <td style={{ padding: "16px" }}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <select
                      value={formByTeacher[t._id]?.semester || ""}
                      onChange={(e) => setTeacherFormValue(t._id, "semester", e.target.value)}
                      style={{ padding: "6px", borderRadius: "6px", border: "1px solid #dde3ef" }}
                    >
                      <option value="" disabled>Select Sem</option>
                      {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                    <select
                      value={formByTeacher[t._id]?.section || ""}
                      onChange={(e) => setTeacherFormValue(t._id, "section", e.target.value)}
                      style={{ padding: "6px", borderRadius: "6px", border: "1px solid #dde3ef" }}
                    >
                      <option value="" disabled>Select Section</option>
                      {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select
                      value={formByTeacher[t._id]?.subject || ""}
                      onChange={(e) => setTeacherFormValue(t._id, "subject", e.target.value)}
                      style={{ padding: "6px", borderRadius: "6px", border: "1px solid #dde3ef" }}
                    >
                      <option value="" disabled>Select Subject</option>
                      {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={() => handleAssign(t._id)}
                      disabled={assigning === t._id}
                      style={{ padding: "6px 12px", background: "linear-gradient(135deg, #0a1628, #102040)", color: "#fff", border: "none", borderRadius: "8px", cursor: assigning === t._id ? "not-allowed" : "pointer", fontWeight: 600 }}
                    >
                      {assigning === t._id ? "..." : "Assign"}
                    </button>
                  </div>
                  <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {(assignmentsByTeacher[t._id] || []).map((a) => (
                      <span key={a._id} style={{ fontSize: "11px", padding: "3px 8px", background: "#f4f6fa", border: "1px solid #dde3ef", borderRadius: "20px", color: "#0a1628" }}>
                        Sem {a.semester} | {a.section} | {a.subject}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>No teachers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      </div>
    </div>
  );
};

export default TeachersList;
