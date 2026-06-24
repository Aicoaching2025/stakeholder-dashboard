// Feature importance for the selected (or best) model. Horizontal bars with
// error bars (permutation std). Plain-language labels for every feature and a
// takeaway naming the top driver of the prediction.
import Plot from "./Plot.jsx";
import { Card, Insight } from "./ui.jsx";
import { baseLayout } from "../lib/plotlyTheme.js";
import { C } from "../lib/theme.js";

export default function FeatureImportance({ task, model }) {
  if (!model || !model.importances || model.importances.length === 0) {
    return (
      <Card
        className="col-6"
        title="What drives the prediction"
        subtitle="Feature importance"
      >
        <p className="muted">
          The baseline model has no learned drivers. Select a real model to see what
          moves the prediction.
        </p>
      </Card>
    );
  }

  // Sort ascending so the biggest driver lands at the top of a reversed axis.
  const sorted = [...model.importances].sort((a, b) => a.importance - b.importance);
  const labels = sorted.map((i) => task.feature_labels[i.feature] || i.feature);
  const vals = sorted.map((i) => i.importance);
  const stds = sorted.map((i) => i.std || 0);
  const maxAbs = Math.max(...vals.map(Math.abs), 0.0001);

  const trace = {
    type: "bar",
    orientation: "h",
    x: vals,
    y: labels,
    error_x: {
      type: "data",
      array: stds,
      color: "rgba(0,51,102,0.35)",
      thickness: 1.4,
      width: 4,
    },
    marker: {
      color: vals.map((v) => (v >= 0 ? C.cyan : C.mist)),
      line: { color: C.white, width: 1 },
    },
    hovertemplate: "%{y}<br>Importance: %{x:.3f}<extra></extra>",
  };

  const layout = baseLayout({
    height: Math.max(180, labels.length * 34 + 30),
    margin: { l: 8, r: 18, t: 8, b: 36 },
    xaxis: {
      title: { text: "Permutation importance (drop in score when shuffled)", font: { size: 12, color: C.inkMuted } },
      zeroline: true,
      range: [Math.min(0, ...vals) - maxAbs * 0.1, maxAbs * 1.15],
    },
    yaxis: { automargin: true },
  });

  const top = [...model.importances].sort((a, b) => b.importance - a.importance)[0];
  const topLabel = task.feature_labels[top.feature] || top.feature;

  return (
    <Card
      className="col-6"
      title="What drives the prediction"
      subtitle={`Permutation importance for ${model.display_name}`}
    >
      <Plot data={[trace]} layout={layout} height={layout.height} />
      <Insight>
        <b>{topLabel}</b> is the strongest driver of{" "}
        {task.task_type === "classification" ? "churn risk" : "the revenue forecast"}.{" "}
        {driverHint(task, top.feature)}
      </Insight>
    </Card>
  );
}

function driverHint(task, feature) {
  const hints = {
    contract: "Contract type matters most — month-to-month customers behave very differently from annual ones.",
    last_login_days: "Recency of activity is an early-warning signal worth monitoring weekly.",
    plan: "The subscription plan separates customers more than any demographic detail.",
    tenure_days: "How long someone has been a customer shapes their behaviour.",
    age: "Age contributes modestly to the forecast.",
  };
  return hints[feature] || "Bars near zero contribute little and could be dropped to simplify the model.";
}
