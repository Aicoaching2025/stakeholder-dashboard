// Shared design-system constants for JS (mirrors theme.css). Charts read colors
// from here so the Plotly theme stays in lockstep with the CSS tokens.

export const C = {
  navy: "#003366",
  blue: "#006699",
  cyan: "#0099cc",
  mist: "#b3c7e6",
  white: "#ffffff",
  navy900: "#002347",
  ink: "#0a2540",
  inkMuted: "#5a7390",
  cyan600: "#007fad",
  cyan050: "#e4f4fb",
  good: "#1e8e6a",
  warn: "#c98a1b",
  alert: "#c0392b",
};

// Fixed series ramp: same model -> same color across every chart.
// Best/selected model is always cyan; others recede to navy/blue/mist.
export const SERIES = ["#0099cc", "#003366", "#006699", "#7fb2d9", "#b3c7e6"];

// Stable color per model name, used in tables, chips, and charts alike.
export function modelColor(modelName, allNames) {
  const idx = allNames.indexOf(modelName);
  return SERIES[idx % SERIES.length];
}

export const STATUS_LABEL = {
  stable: "Stable",
  watch: "Watch",
  alert: "Drift alert",
};
