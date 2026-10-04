import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import { theme } from "../theme";

export default function EmployeeDashboard() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ project_id: "", work_date: "", hours: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [e, s, p] = await Promise.all([
      api.get("/employee/timesheets"),
      api.get("/employee/dashboard"),
      api.get("/employee/projects"),
    ]);
    setEntries(e.data);
    setStats(s.data);
    setProjects(p.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showMsg = (text) => { setMessage(text); setTimeout(() => setMessage(""), 3000); };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/employee/timesheets/${editingId}`, {
          project_id: Number(form.project_id),
          work_date: form.work_date,
          hours: Number(form.hours),
          description: form.description,
        });
        showMsg("Entry updated");
        setEditingId(null);
      } else {
        await api.post("/employee/timesheets", {
          project_id: Number(form.project_id),
          work_date: form.work_date,
          hours: Number(form.hours),
          description: form.description,
        });
        showMsg("Entry created as draft");
      }
      setForm({ project_id: "", work_date: "", hours: "", description: "" });
      load();
    } catch (err) {
      showMsg(err.response?.data?.detail || "Error");
    }
  };

  const editEntry = (entry) => {
    setEditingId(entry.id);
    setForm({ project_id: entry.project_id, work_date: entry.work_date, hours: entry.hours, description: entry.description || "" });
  };

  const submitEntry = async (id) => {
    try {
      await api.post(`/employee/timesheets/${id}/submit`);
      showMsg("Submitted for approval");
      load();
    } catch (err) {
      showMsg(err.response?.data?.detail || "Error");
    }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Delete this draft entry?")) return;
    try {
      await api.delete(`/employee/timesheets/${id}`);
      showMsg("Entry deleted");
      load();
    } catch (err) {
      showMsg(err.response?.data?.detail || "Error");
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={styles.page}><p style={{ color: theme.colors.textSecondary }}>Loading…</p></div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div style={styles.page}>
        <h2 style={styles.heading}>Employee dashboard</h2>
        {message && <p style={styles.message}>{message}</p>}

        {stats && (
          <div style={styles.statsRow}>
            <div style={styles.statBox}><div style={styles.statNum}>{stats.hours_this_week}</div><div style={styles.statLabel}>Hours this week</div></div>
            <div style={styles.statBox}><div style={styles.statNum}>{stats.draft}</div><div style={styles.statLabel}>Draft</div></div>
            <div style={styles.statBox}><div style={styles.statNum}>{stats.submitted}</div><div style={styles.statLabel}>Submitted</div></div>
            <div style={styles.statBox}><div style={styles.statNum}>{stats.approved}</div><div style={styles.statLabel}>Approved</div></div>
            <div style={styles.statBox}><div style={styles.statNum}>{stats.rejected}</div><div style={styles.statLabel}>Rejected</div></div>
          </div>
        )}

        <section style={styles.card}>
          <h3 style={styles.cardTitle}>{editingId ? "Edit entry" : "New timesheet entry"}</h3>
          <form onSubmit={handleSubmitForm} style={styles.form}>
            <select style={styles.input} value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} required>
              <option value="">Select project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
            </select>
            <input style={styles.input} type="date" value={form.work_date} onChange={(e) => setForm({ ...form, work_date: e.target.value })} required />
            <input style={styles.input} type="number" step="0.5" min="0.5" max="12" placeholder="Hours" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} required />
            <textarea style={{ ...styles.input, resize: "vertical" }} placeholder="What did you work on? (optional)" rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div style={{ display: "flex", gap: "10px" }}>
              <button style={styles.button} type="submit">{editingId ? "Save changes" : "Create draft"}</button>
              {editingId && <button style={styles.buttonSecondary} type="button" onClick={() => { setEditingId(null); setForm({ project_id: "", work_date: "", hours: "", description: "" }); }}>Cancel</button>}
            </div>
          </form>
        </section>

        <section style={{ marginTop: "24px" }}>
          <h3 style={styles.cardTitle}>My entries</h3>
          {entries.length === 0 ? (
            <p style={styles.empty}>No entries yet — create your first one above.</p>
          ) : (
          <div style={styles.tableWrap}>
            <table>
              <thead>
                <tr><th>Date</th><th>Project</th><th>Hours</th><th>Description</th><th>Status</th><th>Reject reason</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td>{e.work_date}</td>
                    <td>{projects.find(p => p.id === e.project_id)?.code || e.project_id}</td>
                    <td>{e.hours}</td>
                    <td>{e.description || "–"}</td>
                    <td><StatusBadge status={e.status} /></td>
                    <td>{e.reject_comment || "–"}</td>
                    <td>
                      {(e.status === "draft" || e.status === "rejected") && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button style={styles.linkButton} onClick={() => editEntry(e)}>Edit</button>
                          <button style={styles.linkButton} onClick={() => submitEntry(e.id)}>Submit</button>
                          {e.status === "draft" && (
                            <button style={styles.linkButtonDanger} onClick={() => deleteEntry(e.id)}>Delete</button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "28px 32px", maxWidth: "1100px", margin: "0 auto" },
  empty: { fontSize: "13px", color: theme.colors.textSecondary, fontStyle: "italic" },
  heading: { margin: "0 0 20px", fontSize: "20px", fontWeight: 700, color: theme.colors.textPrimary },
  message: { color: theme.colors.success, fontSize: "14px", marginTop: "-8px" },
  statsRow: { display: "flex", gap: "14px", marginBottom: "24px" },
  statBox: { padding: "14px 20px", background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius, minWidth: "100px" },
  statNum: { fontSize: "22px", fontWeight: 700, color: theme.colors.textPrimary },
  statLabel: { fontSize: "13px", color: theme.colors.textSecondary, marginTop: "2px" },
  card: { background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius, padding: "20px", maxWidth: "420px" },
  cardTitle: { margin: "0 0 14px", fontSize: "15px", fontWeight: 600, color: theme.colors.textPrimary },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  input: { padding: "9px 11px", border: `1px solid ${theme.colors.border}`, borderRadius: theme.radiusSm, fontFamily: "inherit", fontSize: "14px", color: theme.colors.textPrimary, background: "#fff" },
  button: { padding: "9px 16px", fontSize: "14px", fontWeight: 600, background: theme.colors.accent, color: "#fff", border: "none", borderRadius: theme.radiusSm },
  buttonSecondary: { padding: "9px 16px", fontSize: "14px", fontWeight: 500, background: "transparent", color: theme.colors.textSecondary, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radiusSm },
  linkButton: { padding: "5px 10px", fontSize: "13px", fontWeight: 500, background: theme.colors.bg, color: theme.colors.accent, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radiusSm },
  linkButtonDanger: { padding: "5px 10px", fontSize: "13px", fontWeight: 500, background: theme.colors.bg, color: theme.colors.danger, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radiusSm },
  tableWrap: { background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius, overflow: "hidden" },
};
