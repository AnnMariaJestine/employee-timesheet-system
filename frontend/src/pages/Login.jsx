import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { theme } from "../theme";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      const { access_token, role, name, user_id } = res.data;

      // Save login info so we stay logged in on refresh
      localStorage.setItem("token", access_token);
      localStorage.setItem("role", role);
      localStorage.setItem("name", name);
      localStorage.setItem("user_id", user_id);

      // Send each role to its own dashboard
      if (role === "admin") navigate("/admin");
      else if (role === "manager") navigate("/manager");
      else navigate("/employee");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Timesheet</h1>
        <p style={styles.subtitle}>Sign in to log and review hours</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <p style={styles.error}>{error}</p>}
          <label style={styles.label}>
            Email
            <input
              style={styles.input}
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label style={styles.label}>
            Password
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button style={styles.button} type="submit">Log in</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: theme.colors.bg,
  },
  card: {
    width: "360px", background: theme.colors.surface, border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius, padding: "36px 32px",
  },
  title: { margin: 0, fontSize: "22px", fontWeight: 700, color: theme.colors.textPrimary },
  subtitle: { margin: "6px 0 24px", fontSize: "14px", color: theme.colors.textSecondary },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  label: { display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500, color: theme.colors.textSecondary },
  input: {
    padding: "10px 12px", fontSize: "14px", border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radiusSm, outline: "none", color: theme.colors.textPrimary,
  },
  button: {
    marginTop: "4px", padding: "11px", fontSize: "14px", fontWeight: 600,
    background: theme.colors.accent, color: "#fff", border: "none", borderRadius: theme.radiusSm,
  },
  error: { margin: 0, color: theme.colors.danger, fontSize: "13px" },
};
