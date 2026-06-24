// Drift detection — a monitoring preview. Shows per-feature Population Stability
// Index (PSI) over 12 weeks and the rolling primary metric, with thresholds and
// a status pill. Clearly tagged SIMULATED: the live version arrives with App 4
// (the production monitoring service).
import Plot from "./Plot.jsx";
import { Card, Insight, StatusPill, Icon } from "./ui.jsx";
import { baseLayout, axis } from "../lib/plotlyTheme.js";
import { C, STATUS_LABEL } from "../lib/theme.js";
import { metricLabel } from "../lib/format.js";

const PSI_WATCH = 0.1;
const PSI_ALERT = 0.25;

export default function DriftPanel({ task }) {
  const drift = task.drift;
  const weeks = drift.weeks;
  const featNames = Object.keys(drift.psi);
  const colors = [C.cyan, C.navy, C.blue];

  // PSI lines per feature + threshold bands.
  const psiTraces = featNames.map((f, i) => ({
    x: weeks,
    y: drift.psi[f],
    mode: "lines+markers",
    name: task.feature_labels[f] || f,
    line: { color: colors[i % colors.length], width: 2.4 },
    marker: { size: 5 },
    hovertemplate: `${task.feature_labels[f] || f}<br>%{x}: PSI %{y:.3f}<extra></extra>`,
  }));

  const psiLayout = baseLayout({
    height: 300,
    margin: { l: 50, r: 16, t: 28, b: 36 },
    legend: { orientation: "h", x: 0, y: 1.18, font: { size: 11.5, color: C.inkMuted } },
    xaxis: { ...axis(), title: { text: "", font: { size: 12 } } },
    yaxis: { ...axis(), title: { text: "Population Stability Index", font: { size: 12, color: C.inkMuted } }, rangemode: "tozero" },
    shapes: [
      band(PSI_WATCH, PSI_ALERT, "rgba(201,138,27,0.07)"),
      band(PSI_ALERT, 1, "rgba(192,57,43,0.07)"),
      line(PSI_WATCH, C.warn, "watch 0.10"),
      line(PSI_ALERT, C.alert, "alert 0.25"),
    ],
    annotations: [
      thresholdLabel(PSI_WATCH, "Watch", C.warn),
      thresholdLabel(PSI_ALERT, "Alert", C.alert),
    ],
  });

  // Rolling primary metric.
  const metricLayout = baseLayout({
    height: 300,
    margin: { l: 56, r: 16, t: 28, b: 36 },
    xaxis: { ...axis() },
    yaxis: { ...axis(), title: { text: metricLabel(drift.primary_metric), font: { size: 12, color: C.inkMuted } } },
    shapes: [
      {
        type: "line",
        xref: "paper",
        x0: 0,
        x1: 1,
        y0: drift.baseline_value,
        y1: drift.baseline_value,
        line: { color: C.mist, width: 1.5, dash: "dash" },
      },
    ],
  });
  const metricTrace = [
    {
      x: weeks,
      y: drift.metric_series,
      mode: "lines+markers",
      line: { color: C.cyan, width: 2.6 },
      marker: { size: 5 },
      fill: "tozeroy",
      fillcolor: "rgba(0,153,204,0.08)",
      hovertemplate: `%{x}: %{y:.3f}<extra></extra>`,
      showlegend: false,
    },
  ];

  return (
    <Card
      className="col-12"
      title="Drift detection"
      subtitle="Is the live data still like the data the model was trained on?"
      right={
        <span className="sim-tag">
          <Icon name="alert" size={13} /> Simulated · live in App 4
        </span>
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <StatusPill status={drift.status} label={STATUS_LABEL[drift.status]} />
        <span className="muted" style={{ fontSize: 13 }}>
          Worst feature PSI this period: <b className="tnum" style={{ color: "var(--ink)" }}>{drift.worst_psi.toFixed(3)}</b>{" "}
          (PSI &gt; 0.25 means the input distribution has shifted enough to retrain).
        </span>
      </div>
      <div className="two-col">
        <div>
          <h3 style={{ fontSize: "var(--fs-h3)", color: "var(--blue)", margin: "0 0 6px" }}>
            Input drift by feature (PSI)
          </h3>
          <Plot data={psiTraces} layout={psiLayout} height={300} />
        </div>
        <div>
          <h3 style={{ fontSize: "var(--fs-h3)", color: "var(--blue)", margin: "0 0 6px" }}>
            Rolling {metricLabel(drift.primary_metric)} (dashed = launch baseline)
          </h3>
          <Plot data={metricTrace} layout={metricLayout} height={300} />
        </div>
      </div>
      <Insight>{driftSentence(task, drift)}</Insight>
    </Card>
  );
}

function driftSentence(task, drift) {
  const worstFeat = Object.entries(drift.psi).sort(
    (a, b) => Math.max(...b[1]) - Math.max(...a[1])
  )[0][0];
  const label = task.feature_labels[worstFeat] || worstFeat;
  if (drift.status === "alert") {
    return (
      <>
        <b>Action needed:</b> <b>{label}</b> has drifted past the 0.25 alert line in recent
        weeks, and the rolling {metricLabel(drift.primary_metric)} is sliding below its launch
        baseline. This is the trigger to retrain the model on fresh data. (Demo data — the
        live monitor ships with App 4.)
      </>
    );
  }
  return (
    <>
      Inputs are stable: every feature stays under the 0.10 watch line and performance holds
      near baseline. No retraining needed this period. (Demo data — the live monitor ships
      with App 4.)
    </>
  );
}

/* plotly shape helpers */
function band(y0, y1, color) {
  return { type: "rect", xref: "paper", x0: 0, x1: 1, y0, y1, fillcolor: color, line: { width: 0 }, layer: "below" };
}
function line(y, color) {
  return { type: "line", xref: "paper", x0: 0, x1: 1, y0: y, y1: y, line: { color, width: 1, dash: "dot" } };
}
function thresholdLabel(y, text, color) {
  return {
    xref: "paper",
    x: 1,
    y,
    xanchor: "right",
    yanchor: "bottom",
    text,
    showarrow: false,
    font: { size: 10.5, color },
  };
}
