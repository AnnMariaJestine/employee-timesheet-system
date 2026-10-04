import { useNavigate } from "react-router-dom";
import { theme } from "../theme";

export default function Navbar() {
  const navigate = useNavigate();
  const name = localStorage.getItem("name");
  const role = localStorage.getItem("role");

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div style={styles.bar}>
      <span style={styles.brand}>Timesheet</span>
      <div style={styles.right}>
        <span style={styles.who}>{name} · {role}</span>
        <button onClick={logout} style={styles.button}>Log out</button>
      </div>
    </div>
  );
}

const styles = {
  bar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 24px", background: theme.colors.accent, color: "#fff",
  },
  brand: { fontWeight: 600, fontSize: "16px", letterSpacing: "0.2px" },
  right: { display: "flex", alignItems: "center", gap: "16px" },
  who: { fontSize: "14px", opacity: 0.9 },
  button: {
    padding: "7px 14px", fontSize: "13px", fontWeight: 500,
    background: "rgba(255,255,255,0.15)", color: "#fff",
    border: "1px solid rgba(255,255,255,0.35)", borderRadius: theme.radiusSm,
  },
};
