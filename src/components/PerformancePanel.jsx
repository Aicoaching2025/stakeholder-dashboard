// Performance detail for the selected model.
//  - Classification: ROC curve + confusion matrix (with plain-language reading).
//  - Regression: predicted vs actual scatter against the perfect-prediction line.
import Plot from "./Plot.jsx";
import { Card, Insight } from "./ui.jsx";
import { baseLayout, axis } from "../lib/plotlyTheme.js";
import { C } from "../lib/theme.js";
import { fmtMetric, fmtPct } from "../lib/format.js";

export default function PerformancePanel({ task, model }) {
  if (task.task_type === "classification") {
    return <ClassificationDetail task={task} model={model} />;
  }
  return <RegressionDetail task={task} model={model} />;
}

/* ----------------------------------------------------------- classification */
function ClassificationDetail({ task, model }) {
  const roc = model.roc_curve;
  const hasRoc = roc && roc.fpr && roc.fpr.length > 2;

  const rocData = hasRoc
    ? [
        {
          x: [0, 1],
          y: [0, 1],
          mode: "lines",
          line: { dash: "dash", color: C.mist, width: 1.5 },
          hoverinfo: "skip",
          name: "Random",
          showlegend: false,
        },
        {
          x: roc.fpr,
          y: roc.tpr,
          mode: "lines",
          fill: "tozeroy",
          fillcolor: "rgba(0,153,204,0.10)",
          line: { color: C.cyan, width: 2.5 },
          name: "Model",
          hovertemplate: "True positive: %{y:.2f}<br>False positive: %{x:.2f}<extra></extra>",
          showlegend: false,
        },
      ]
    : [];

  const rocLayout = baseLayout({
    height: 300,
    margin: { l: 52, r: 16, t: 8, b: 44 },
    xaxis: { ...axis(), title: { text: "False positive rate", font: { size: 12, color: C.inkMuted } }, range: [0, 1] },
    yaxis: { ...axis(), title: { text: "True positive rate", font: { size: 12, color: C.inkMuted } }, range: [0, 1] },
  });

  const auc = model.test_metrics.roc_auc;

  return (
    <Card
      className="col-6"
      title="How well does it separate churners?"
      subtitle={`ROC curve & confusion matrix — ${model.display_name}`}
    >
      <div className="two-col">
        <div>
          {hasRoc ? (
            <Plot data={rocData} layout={rocLayout} height={300} />
          ) : (
            <p className="muted" style={{ paddingTop: 24 }}>
              The baseline predicts a single class, so its ROC curve is just the diagonal
              (no separating power). Pick a real model.
            </p>
          )}
          <p className="note">
            The further the curve bows toward the top-left, the better. Area under it
            (ROC-AUC) = <b>{fmtMetric("roc_auc", auc, task.task_type)}</b>.
          </p>
        </div>
        <ConfusionMatrix model={model} />
      </div>
      <Insight>{confusionSentence(model)}</Insight>
    </Card>
  );
}

function ConfusionMatrix({ model }) {
  const cm = model.confusion; // [[TN, FP],[FN, TP]]
  if (!cm) return null;
  const [[tn, fp], [fn, tp]] = cm;
  const total = tn + fp + fn + tp;
  const cells = [
    { label: "True negatives", v: tn, good: true, sub: "active, called active" },
    { label: "False positives", v: fp, good: false, sub: "active, flagged churn" },
    { label: "False negatives", v: fn, good: false, sub: "churned, missed" },
    { label: "True positives", v: tp, good: true, sub: "churned, caught" },
  ];
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        {cells.map((c) => (
          <div
            key={c.label}
            style={{
              background: c.good ? "var(--good-bg)" : "var(--warn-bg)",
              border: `1px solid ${c.good ? "rgba(30,142,106,.3)" : "rgba(201,138,27,.3)"}`,
              borderRadius: 10,
              padding: "12px 12px",
            }}
          >
            <div
              className="tnum"
              style={{ fontSize: 24, fontWeight: 700, color: c.good ? "var(--good)" : "var(--warn)" }}
            >
              {c.v}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{c.label}</div>
            <div className="muted" style={{ fontSize: 11.5 }}>
              {c.sub}
            </div>
          </div>
        ))}
      </div>
      <p className="note">Confusion matrix on {total} held-out customers.</p>
    </div>
  );
}

function confusionSentence(model) {
  const cm = model.confusion;
  if (!cm) return "";
  const [[, fp], [fn, tp]] = cm;
  const caught = tp + fn > 0 ? tp / (tp + fn) : 0;
  return (
    <>
      Of customers who actually churned, the model catches <b>{fmtPct(caught, 0)}</b> of
      them ({tp} of {tp + fn}). It raises {fp} false alarms — the cost of casting a wider
      retention net. Tune the threshold to trade misses against false alarms.
    </>
  );
}

/* --------------------------------------------------------------- regression */
function RegressionDetail({ task, model }) {
  const pva = model.pred_vs_actual;
  const has = pva && pva.y_true && pva.y_true.length > 0;

  let lo = 0,
    hi = 1;
  if (has) {
    lo = Math.min(...pva.y_true, ...pva.y_pred);
    hi = Math.max(...pva.y_true, ...pva.y_pred);
  }

  const data = has
    ? [
        {
          x: [lo, hi],
          y: [lo, hi],
          mode: "lines",
          line: { dash: "dash", color: C.mist, width: 1.5 },
          name: "Perfect",
          hoverinfo: "skip",
          showlegend: false,
        },
        {
          x: pva.y_true,
          y: pva.y_pred,
          mode: "markers",
          marker: { color: C.cyan, size: 6, opacity: 0.55, line: { color: C.white, width: 0.5 } },
          name: "Predictions",
          hovertemplate: "Actual: $%{x:.0f}<br>Predicted: $%{y:.0f}<extra></extra>",
          showlegend: false,
        },
      ]
    : [];

  const layout = baseLayout({
    height: 320,
    margin: { l: 60, r: 16, t: 8, b: 46 },
    xaxis: { ...axis(), title: { text: "Actual revenue ($)", font: { size: 12, color: C.inkMuted } } },
    yaxis: { ...axis(), title: { text: "Predicted revenue ($)", font: { size: 12, color: C.inkMuted } } },
  });

  return (
    <Card
      className="col-6"
      title="How close are the forecasts?"
      subtitle={`Predicted vs. actual revenue — ${model.display_name}`}
    >
      {has ? (
        <Plot data={data} layout={layout} height={320} />
      ) : (
        <p className="muted" style={{ paddingTop: 24 }}>
          No prediction scatter available for this model.
        </p>
      )}
      <Insight>
        Each dot is one account. Points hugging the dashed line are accurate forecasts.{" "}
        This model explains <b>{fmtMetric("r2", model.test_metrics.r2, task.task_type)}</b> of
        the variation in revenue, with a typical error of{" "}
        <b>{fmtMetric("rmse", model.test_metrics.rmse, task.task_type)}</b> per account.
      </Insight>
    </Card>
  );
}
