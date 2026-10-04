import { theme } from "../theme";

// Small colored pill that shows a timesheet entry's status at a glance.
export default function StatusBadge({ status }) {
  const color = theme.colors[status] || theme.colors.textSecondary;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "999px",
        fontSize: "13px",
        fontWeight: 500,
        color: "#fff",
        background: color,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}
