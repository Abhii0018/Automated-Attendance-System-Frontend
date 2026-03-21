import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { SEMESTERS } from "../../utils/constants";

const TeachersList = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigning, setAssigning] = useState(null);

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/auth/teachers");
      setTeachers(res.data.data || []);
    } catch (err) {
      setError("Failed to fetch teachers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleAssign = async (teacherId, semester) => {
    if (!semester) return;
    setAssigning(teacherId);
    try {
      await api.post(`/auth/teachers/${teacherId}/assign`, { semester });
      alert(`Successfully assigned Semester ${semester}`);
      fetchTeachers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign semester");
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ color: "#0a1628", fontSize: "28px", margin: 0 }}>Teachers List</h1>
        <Link to="/admin/dashboard" style={{ textDecoration: "none", color: "#6b7280", border: "1px solid #dde3ef", padding: "8px 16px", borderRadius: "8px" }}>Back to Dashboard</Link>
      </div>

      {error && <div style={{ color: "red", marginBottom: "20px" }}>{error}</div>}

      {loading ? (
        <div>Loading teachers...</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #dde3ef", borderRadius: "12px", overflow: "hidden" }}>
          <thead>
            <tr style={{ background: "#f4f6fa", textAlign: "left" }}>
              <th style={{ padding: "16px", borderBottom: "1px solid #dde3ef" }}>Name</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #dde3ef" }}>Email</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #dde3ef" }}>Teacher ID</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #dde3ef" }}>Assign Semester</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t._id} style={{ borderBottom: "1px solid #dde3ef" }}>
                <td style={{ padding: "16px", color: "#0a1628", fontWeight: "bold" }}>{t.name}</td>
                <td style={{ padding: "16px", color: "#6b7280" }}>{t.email}</td>
                <td style={{ padding: "16px", color: "#6b7280" }}>{t.teacherId || "N/A"}</td>
                <td style={{ padding: "16px" }}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <select
                      id={`sem-${t._id}`}
                      defaultValue=""
                      style={{ padding: "6px", borderRadius: "6px", border: "1px solid #dde3ef" }}
                    >
                      <option value="" disabled>Select Sem</option>
                      {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                    <button
                      onClick={() => {
                        const sem = document.getElementById(`sem-${t._id}`).value;
                        handleAssign(t._id, sem);
                      }}
                      disabled={assigning === t._id}
                      style={{ padding: "6px 12px", background: "#c9a84c", color: "#fff", border: "none", borderRadius: "6px", cursor: assigning === t._id ? "not-allowed" : "pointer" }}
                    >
                      {assigning === t._id ? "..." : "Assign"}
                    </button>
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
  );
};

export default TeachersList;
