import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import { theme } from "../theme";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [deptForm, setDeptForm] = useState({ name: "", code: "" });
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "employee", department_id: "", manager_id: "" });
  const [projectForm, setProjectForm] = useState({ code: "", name: "", client_name: "", start_date: "", end_date: "" });
  const [assignForm, setAssignForm] = useState({ user_id: "", project_id: "" });
  const [message, setMessage] = useState("");

  // password reset mini-form
  const [resetUserId, setResetUserId] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const loadAll = async () => {
    const [s, d, u, p, a] = await Promise.all([
      api.get("/admin/dashboard"),
      api.get("/admin/departments"),
      api.get("/admin/users"),
      api.get("/admin/projects"),
      api.get("/admin/assignments"),
    ]);
    setStats(s.data);
    setDepartments(d.data);
    setUsers(u.data);
    setProjects(p.data);
    setAssignments(a.data);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const showMsg = (text) => { setMessage(text); setTimeout(() => setMessage(""), 3000); };

  const createDepartment = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/departments", deptForm);
      setDeptForm({ name: "", code: "" });
      showMsg("Department created");
      loadAll();
    } catch (err) { showMsg(err.response?.data?.detail || "Error"); }
  };

  const deactivateDepartment = async (id) => {
    try {
      await api.put(`/admin/departments/${id}/deactivate`);
      showMsg("Department deactivated");
      loadAll();
    } catch (err) { showMsg(err.response?.data?.detail || "Error"); }
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/users", {
        ...userForm,
        department_id: userForm.department_id ? Number(userForm.department_id) : null,
        manager_id: userForm.manager_id ? Number(userForm.manager_id) : null,
      });
      setUserForm({ name: "", email: "", password: "", role: "employee", department_id: "", manager_id: "" });
      showMsg("User created");
      loadAll();
    } catch (err) { showMsg(err.response?.data?.detail || "Error"); }
  };

  const toggleUserActive = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}`, { is_active: !user.is_active });
      showMsg(user.is_active ? "User deactivated" : "User activated");
      loadAll();
    } catch (err) { showMsg(err.response?.data?.detail || "Error"); }
  };

  const submitPasswordReset = async (userId) => {
    if (!newPassword.trim()) { showMsg("Enter a new password"); return; }
    try {
      await api.put(`/admin/users/${userId}/reset-password`, { new_password: newPassword });
      showMsg("Password reset");
      setResetUserId(null);
      setNewPassword("");
    } catch (err) { showMsg(err.response?.data?.detail || "Error"); }
  };

  const createProject = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/projects", {
        ...projectForm,
        start_date: projectForm.start_date || null,
        end_date: projectForm.end_date || null,
      });
      setProjectForm({ code: "", name: "", client_name: "", start_date: "", end_date: "" });
      showMsg("Project created");
      loadAll();
    } catch (err) { showMsg(err.response?.data?.detail || "Error"); }
  };

  const deactivateProject = async (id) => {
    try {
      await api.put(`/admin/projects/${id}/deactivate`);
      showMsg("Project deactivated");
      loadAll();
    } catch (err) { showMsg(err.response?.data?.detail || "Error"); }
  };

  const assignProject = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/assignments", {
        user_id: Number(assignForm.user_id),
        project_id: Number(assignForm.project_id),
      });
      showMsg("Assigned");
      setAssignForm({ user_id: "", project_id: "" });
      loadAll();
    } catch (err) { showMsg(err.response?.data?.detail || "Error"); }
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
        <h2 style={styles.heading}>Admin dashboard</h2>
        {message && <p style={styles.message}>{message}</p>}

        {stats && (
          <div style={styles.statsRow}>
            <div style={styles.statBox}><div style={styles.statNum}>{stats.active_users}</div><div style={styles.statLabel}>Active users</div></div>
            <div style={styles.statBox}><div style={styles.statNum}>{stats.active_projects}</div><div style={styles.statLabel}>Active projects</div></div>
            <div style={styles.statBox}><div style={styles.statNum}>{stats.total_hours_this_month}</div><div style={styles.statLabel}>Hours this month</div></div>
            <div style={styles.statBox}><div style={styles.statNum}>{stats.total_departments}</div><div style={styles.statLabel}>Departments</div></div>
          </div>
        )}

        <div style={styles.grid}>
          <section style={styles.card}>
            <h3 style={styles.cardTitle}>Create department</h3>
            <form onSubmit={createDepartment} style={styles.form}>
              <input style={styles.input} placeholder="Department name" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} required />
              <input style={styles.input} placeholder="Code e.g. ENG" value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} />
              <button style={styles.button} type="submit">Add</button>
            </form>
            {departments.length === 0 ? (
              <p style={styles.empty}>No departments yet.</p>
            ) : (
              <ul style={styles.list}>
                {departments.map((d) => (
                  <li key={d.id} style={styles.listItemRow}>
                    <span style={{ opacity: d.is_active ? 1 : 0.5 }}>
                      {d.name}{d.code ? ` (${d.code})` : ""}{!d.is_active && " (inactive)"}
                    </span>
                    {d.is_active && <button style={styles.smallLink} onClick={() => deactivateDepartment(d.id)}>Deactivate</button>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={styles.card}>
            <h3 style={styles.cardTitle}>Create project</h3>
            <form onSubmit={createProject} style={styles.form}>
              <input style={styles.input} placeholder="Code e.g. PRJ-003" value={projectForm.code} onChange={(e) => setProjectForm({ ...projectForm, code: e.target.value })} required />
              <input style={styles.input} placeholder="Project name" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} required />
              <input style={styles.input} placeholder="Client name" value={projectForm.client_name} onChange={(e) => setProjectForm({ ...projectForm, client_name: e.target.value })} />
              <label style={styles.miniLabel}>Start date</label>
              <input style={styles.input} type="date" value={projectForm.start_date} onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })} />
              <label style={styles.miniLabel}>End date</label>
              <input style={styles.input} type="date" value={projectForm.end_date} onChange={(e) => setProjectForm({ ...projectForm, end_date: e.target.value })} />
              <button style={styles.button} type="submit">Add</button>
            </form>
            {projects.length === 0 ? (
              <p style={styles.empty}>No projects yet.</p>
            ) : (
              <ul style={styles.list}>
                {projects.map((p) => (
                  <li key={p.id} style={styles.listItemRow}>
                    <span style={{ opacity: p.is_active ? 1 : 0.5 }}>
                      {p.code} — {p.name}{p.client_name ? ` · ${p.client_name}` : ""}{!p.is_active && " (inactive)"}
                    </span>
                    {p.is_active && <button style={styles.smallLink} onClick={() => deactivateProject(p.id)}>Deactivate</button>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={styles.card}>
            <h3 style={styles.cardTitle}>Create user</h3>
            <form onSubmit={createUser} style={styles.form}>
              <input style={styles.input} placeholder="Name" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} required />
              <input style={styles.input} placeholder="Email" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required />
              <input style={styles.input} placeholder="Password" type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required />
              <select style={styles.input} value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <select style={styles.input} value={userForm.department_id} onChange={(e) => setUserForm({ ...userForm, department_id: e.target.value })}>
                <option value="">No department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select style={styles.input} value={userForm.manager_id} onChange={(e) => setUserForm({ ...userForm, manager_id: e.target.value })}>
                <option value="">No manager</option>
                {users.filter(u => u.role === "manager").map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <button style={styles.button} type="submit">Add</button>
            </form>
          </section>

          <section style={styles.card}>
            <h3 style={styles.cardTitle}>Assign project to user</h3>
            <form onSubmit={assignProject} style={styles.form}>
              <select style={styles.input} value={assignForm.user_id} onChange={(e) => setAssignForm({ ...assignForm, user_id: e.target.value })} required>
                <option value="">Select user</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
              <select style={styles.input} value={assignForm.project_id} onChange={(e) => setAssignForm({ ...assignForm, project_id: e.target.value })} required>
                <option value="">Select project</option>
                {projects.filter(p => p.is_active).map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
              </select>
              <button style={styles.button} type="submit">Assign</button>
            </form>
            {assignments.length === 0 ? (
              <p style={styles.empty}>No assignments yet.</p>
            ) : (
              <ul style={styles.list}>
                {assignments.map((a) => (
                  <li key={a.id} style={styles.listItem}>{a.user_name} → {a.project_code}</li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section style={{ marginTop: "24px" }}>
          <h3 style={styles.cardTitle}>All users</h3>
          {users.length === 0 ? (
            <p style={styles.empty}>No users yet.</p>
          ) : (
            <div style={styles.tableWrap}>
              <table>
                <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Active</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td><td>{u.name}</td><td>{u.email}</td>
                      <td style={{ textTransform: "capitalize" }}>{u.role}</td>
                      <td>{u.is_active ? "Yes" : "No"}</td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <button style={u.is_active ? styles.smallLink : styles.smallLinkGood} onClick={() => toggleUserActive(u)}>
                            {u.is_active ? "Deactivate" : "Activate"}
                          </button>
                          {resetUserId === u.id ? (
                            <>
                              <input
                                style={styles.resetInput}
                                type="password"
                                placeholder="New password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                              />
                              <button style={styles.smallLinkNeutral} onClick={() => submitPasswordReset(u.id)}>Save</button>
                              <button style={styles.smallLinkNeutral} onClick={() => { setResetUserId(null); setNewPassword(""); }}>Cancel</button>
                            </>
                          ) : (
                            <button style={styles.smallLinkNeutral} onClick={() => setResetUserId(u.id)}>Reset password</button>
                          )}
                        </div>
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
  heading: { margin: "0 0 20px", fontSize: "20px", fontWeight: 700, color: theme.colors.textPrimary },
  message: { color: theme.colors.success, fontSize: "14px", marginTop: "-8px" },
  statsRow: { display: "flex", gap: "14px", marginBottom: "24px" },
  statBox: { padding: "14px 20px", background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius, minWidth: "110px" },
  statNum: { fontSize: "22px", fontWeight: 700, color: theme.colors.textPrimary },
  statLabel: { fontSize: "13px", color: theme.colors.textSecondary, marginTop: "2px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  card: { background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius, padding: "20px" },
  cardTitle: { margin: "0 0 14px", fontSize: "15px", fontWeight: 600, color: theme.colors.textPrimary },
  form: { display: "flex", flexDirection: "column", gap: "10px", maxWidth: "320px" },
  miniLabel: { fontSize: "12px", color: theme.colors.textSecondary, marginBottom: "-4px" },
  input: { padding: "9px 11px", border: `1px solid ${theme.colors.border}`, borderRadius: theme.radiusSm, fontFamily: "inherit", fontSize: "14px", color: theme.colors.textPrimary, background: "#fff" },
  button: { padding: "9px 16px", fontSize: "14px", fontWeight: 600, background: theme.colors.accent, color: "#fff", border: "none", borderRadius: theme.radiusSm, alignSelf: "flex-start" },
  list: { listStyle: "none", padding: 0, margin: "14px 0 0", display: "flex", flexDirection: "column", gap: "6px" },
  listItem: { fontSize: "13px", color: theme.colors.textSecondary },
  listItemRow: { fontSize: "13px", color: theme.colors.textSecondary, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" },
  smallLink: { padding: "3px 9px", fontSize: "12px", fontWeight: 500, background: theme.colors.bg, color: theme.colors.danger, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radiusSm },
  smallLinkGood: { padding: "3px 9px", fontSize: "12px", fontWeight: 500, background: theme.colors.bg, color: theme.colors.success, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radiusSm },
  smallLinkNeutral: { padding: "3px 9px", fontSize: "12px", fontWeight: 500, background: theme.colors.bg, color: theme.colors.accent, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radiusSm },
  resetInput: { padding: "4px 8px", fontSize: "12px", border: `1px solid ${theme.colors.border}`, borderRadius: theme.radiusSm, width: "120px" },
  empty: { fontSize: "13px", color: theme.colors.textSecondary, fontStyle: "italic", marginTop: "14px" },
  tableWrap: { background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius, overflow: "hidden" },
};
