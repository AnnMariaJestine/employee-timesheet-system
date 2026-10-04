// Central design tokens. Import this wherever you need a color so the
// whole app stays visually consistent instead of each page picking its own.
export const theme = {
  colors: {
    bg: "#F6F1E7",          // warm beige page background
    surface: "#FFFFFF",      // card/panel background
    border: "#E1D6C2",       // soft border on cards/inputs/tables
    textPrimary: "#352B1E",  // main text (warm near-black)
    textSecondary: "#83765F",// muted secondary text / labels
    accent: "#6B4F3B",       // primary buttons, links, active states
    accentHover: "#59402E",
    danger: "#A1473B",
    success: "#4F7942",

    // status badge colors (timesheet entry states)
    draft: "#A39987",
    submitted: "#B98900",
    approved: "#4F7942",
    rejected: "#A1473B",
  },
  radius: "10px",
  radiusSm: "6px",
};
