// Plotly layout/config factory enforcing the design system on every chart.
// See DESIGN_SYSTEM.md section 6.
import { C } from "./theme.js";

const FONT = '"Segoe UI", system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif';

export function baseLayout(overrides = {}) {
  const layout = {
    font: { family: FONT, size: 12.5, color: C.ink },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    margin: { l: 56, r: 18, t: 12, b: 44 },
    colorway: ["#0099cc", "#003366", "#006699", "#7fb2d9", "#b3c7e6"],
    hoverlabel: {
      bgcolor: C.white,
      bordercolor: C.mist,
      font: { family: FONT, size: 12.5, color: C.ink },
      align: "left",
    },
    hovermode: "closest",
    legend: {
      orientation: "h",
      x: 0,
      y: 1.12,
      font: { size: 12, color: C.inkMuted },
      bgcolor: "rgba(0,0,0,0)",
    },
    xaxis: axis(),
    yaxis: axis(),
    ...overrides,
  };
  // deep-merge axis overrides if caller passed partial axes
  if (overrides.xaxis) layout.xaxis = { ...axis(), ...overrides.xaxis };
  if (overrides.yaxis) layout.yaxis = { ...axis(), ...overrides.yaxis };
  return layout;
}

export function axis(extra = {}) {
  return {
    gridcolor: "rgba(179,199,230,0.5)",
    zerolinecolor: "rgba(179,199,230,0.9)",
    linecolor: C.mist,
    tickfont: { size: 11.5, color: C.inkMuted },
    titlefont: { size: 13, color: C.ink },
    automargin: true,
    ...extra,
  };
}

export const baseConfig = {
  displaylogo: false,
  responsive: true,
  modeBarButtonsToRemove: [
    "lasso2d",
    "select2d",
    "autoScale2d",
    "toggleSpikelines",
    "hoverClosestCartesian",
    "hoverCompareCartesian",
  ],
  toImageButtonOptions: { format: "png", scale: 2 },
};
