import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import { theme } from "../theme";

export default function ManagerDashboard() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [team, setTeam] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState("submitted");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [message, setMessage] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectComment, setRejectComment] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const params = {};
    if (filter) params.status = filter;
    if (employeeFilter) params.employee_id = employeeFilter;
    if (projectFilter) params.project_id = projectFilter;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    const [e, s, t, p] = await Promise.all([
      api.get("/manager/timesheets", { params }),
      api.get("/manager/dashboard"),
      api.get("/manager/team"),
      api.get("/manager/projects"),
    ]);
    setEntries(e.data);
    setStats(s.data);
    setTeam(t.data);
    setProjects(p.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter, employeeFilter, projectFilter, dateFrom, dateTo]);

  const showMsg = (text) => { setMessage(text); setTimeout(() => setMessage(""), 3000); };

  const approve = async (id) => {
    try {
      await api.post(`/manager/timesheets/${id}/approve`);
      showMsg("Approved");
      load();
    } catch (err) { showMsg(err.response?.data?.detail || "Error"); }
  };

  const confirmReject = async (id) => {
    if (!rejectComment.trim()) { showMsg("A comment is required to reject"); return; }
    try {
      await api.post(`/manager/timesheets/${id}/reject`, { comment: rejectComment });
      showMsg("Rejected");
      setRejectingId(null);
      setRejectComment("");
      load();
    } catch (err) { showMsg(err.response?.data?.detail || "Error"); }
  };

  const employeeName = (id) => team.find(t => t.id === id)?.name || id;

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
        <h2 style={styles.heading}>Manager dashboard</h2>
        {message && <p style={styles.message}>{message}</p>}

        {stats && (
          <div style={styles.statsRow}>
            <div style={styles.statBox}><div style={styles.statNum}>{stats.team_size}</div><div style={styles.statLabel}>Team size</div></div>
            <div style={styles.statBox}><div style={styles.statNum}>{stats.pending_review}</div><div style={styles.statLabel}>Pending review</div></div>
            <div style={styles.statBox}><div style={styles.statNum}>{stats.approved}</div><div style={styles.statLabel}>Approved</div></div>
            <div style={styles.statBox}><div style={styles.statNum}>{stats.rejected}</div><div style={styles.statLabel}>Rejected</div></div>
          </div>
        )}

        <div style={styles.filterBar}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Status</label>
            <select style={styles.select} value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="submitted">Submitted (pending)</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="">All</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Employee</label>
            <select style={styles.select} value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
              <option value="">All</option>
              {team.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Project</label>
            <select style={styles.select} value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
              <option value="">All</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>From</label>
            <input style={styles.select} type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>To</label>
            <input style={styles.select} type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>

        {entries.length === 0 ? (
          <p style={styles.empty}>No entries match this filter.</p>
        ) : (
        <div style={styles.tableWrap}>
          <table>
            <thead>
              <tr><th>Employee</th><th>Date</th><th>Project ID</th><th>Hours</th><th>Description</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{employeeName(e.user_id)}</td>
                  <td>{e.work_date}</td>
                  <td>{e.project_id}</td>
                  <td>{e.hours}</td>
                  <td>{e.description || "–"}</td>
                  <td><StatusBadge status={e.status} /></td>
                  <td>
                    {e.status === "submitted" && (
                      rejectingId === e.id ? (
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <input
                            style={styles.rejectInput}
                            placeholder="Rejection reason"
                            value={rejectComment}
                            onChange={(ev) => setRejectComment(ev.target.value)}
                          />
                          <button style={styles.linkButton} onClick={() => confirmReject(e.id)}>Confirm</button>
                          <button style={styles.buttonSecondary} onClick={() => { setRejectingId(null); setRejectComment(""); }}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button style={styles.linkButton} onClick={() => approve(e.id)}>Approve</button>
                          <button style={styles.linkButtonDanger} onClick={() => setRejectingId(e.id)}>Reject</button>
                        </div>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "28px 32px", maxWidth: "1100px", margin: "0 auto" },
  heading: { margin: "0 0 20px", fontSize: "20px", fontWeight: 700, color: theme.colors.textPrimary },
  message: { color: theme.colors.success, fontSize: "14px", marginTop: "-8px" },
  statsRow: { display: "flex", gap: "14px", marginBottom: "24px" },
  statBox: { padding: "14px 20px", background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius, minWidth: "110px" },
  statNum: { fontSize: "22px", fontWeight: 700, color: theme.colors.textPrimary },
  statLabel: { fontSize: "13px", color: theme.colors.textSecondary, marginTop: "2px" },
  filterBar: { display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap", alignItems: "flex-end" },
  filterGroup: { display: "flex", flexDirection: "column", gap: "4px" },
  filterLabel: { fontSize: "12px", color: theme.colors.textSecondary, fontWeight: 500 },
  select: { padding: "7px 10px", border: `1px solid ${theme.colors.border}`, borderRadius: theme.radiusSm, fontFamily: "inherit", fontSize: "13px", background: "#fff", color: theme.colors.textPrimary },
  tableWrap: { background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius, overflow: "hidden" },
  linkButton: { padding: "5px 10px", fontSize: "13px", fontWeight: 500, background: theme.colors.bg, color: theme.colors.accent, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radiusSm },
  linkButtonDanger: { padding: "5px 10px", fontSize: "13px", fontWeight: 500, background: theme.colors.bg, color: theme.colors.danger, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radiusSm },
  buttonSecondary: { padding: "5px 10px", fontSize: "13px", fontWeight: 500, background: "transparent", color: theme.colors.textSecondary, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radiusSm },
  rejectInput: { padding: "6px 9px", border: `1px solid ${theme.colors.border}`, borderRadius: theme.radiusSm, fontFamily: "inherit", fontSize: "13px" },
  empty: { fontSize: "13px", color: theme.colors.textSecondary, fontStyle: "italic" },
};
