// Model leaderboard: a primary-metric bar chart + a detailed, sortable table.
// The best model is highlighted everywhere; clicking a bar/row selects that
// model for the detail panels below (drill-down). Includes CSV export.
import { useMemo } from "react";
import Plot from "./Plot.jsx";
import { Card, Insight, Icon } from "./ui.jsx";
import { baseLayout } from "../lib/plotlyTheme.js";
import { modelColor, C } from "../lib/theme.js";
import {
  fmtMetric,
  fmtMs,
  metricLabel,
  rankByMetric,
  toCsv,
  downloadText,
} from "../lib/format.js";

export default function Leaderboard({ task, visibleModels, selectedModel, onSelectModel }) {
  const metric = task.primary_metric;
  const higherIsBetter = task.higher_is_better;
  const allNames = task.results.map((r) => r.name);

  const ranked = useMemo(
    () => rankByMetric(task.results, metric, higherIsBetter).filter((r) => visibleModels.has(r.name)),
    [task, metric, higherIsBetter, visibleModels]
  );

  // Bar chart data (exclude baseline from the bar chart for a cleaner read;
  // baseline still appears in the table as the reference line).
  const barModels = ranked.filter((r) => r.name !== "baseline");
  const x = barModels.map((r) => r.test_metrics[metric]);
  const y = barModels.map((r) => r.display_name);
  const colors = barModels.map((r) =>
    r.name === selectedModel ? C.cyan : r.name === task.best_model ? C.cyan : modelColor(r.name, allNames)
  );
  const opacities = barModels.map((r) =>
    selectedModel && r.name !== selectedModel ? 0.55 : 1
  );

  const data = [
    {
      type: "bar",
      orientation: "h",
      x,
      y,
      marker: {
        color: colors,
        opacity: opacities,
        line: { color: C.white, width: 1 },
      },
      text: x.map((v) => fmtMetric(metric, v, task.task_type)),
      textposition: "auto",
      textfont: { color: C.white, size: 12.5 },
      hovertemplate: `%{y}<br>${metricLabel(metric)}: %{x:.3f}<extra></extra>`,
      customdata: barModels.map((r) => r.name),
    },
  ];

  const layout = baseLayout({
    height: Math.max(150, barModels.length * 46 + 40),
    margin: { l: 8, r: 24, t: 8, b: 36 },
    xaxis: {
      title: { text: metricLabel(metric), font: { size: 12.5, color: C.ink } },
      range: metric === "roc_auc" ? [0.5, Math.max(...x) * 1.04] : undefined,
    },
    yaxis: { autorange: "reversed", automargin: true },
  });

  const onBarClick = (e) => {
    const name = e.points?.[0]?.customdata;
    if (name) onSelectModel(name === selectedModel ? null : name);
  };

  const exportCsv = () => {
    const rows = rankByMetric(task.results, metric, higherIsBetter).map((r) => ({
      model: r.display_name,
      is_best: r.name === task.best_model ? "yes" : "",
      [metric]: r.test_metrics[metric],
      accuracy: r.test_metrics.accuracy ?? "",
      precision: r.test_metrics.precision ?? "",
      recall: r.test_metrics.recall ?? "",
      f1: r.test_metrics.f1 ?? "",
      rmse: r.test_metrics.rmse ?? "",
      mae: r.test_metrics.mae ?? "",
      r2: r.test_metrics.r2 ?? "",
      cv_mean: r.cv_metrics[metric]?.mean ?? "",
      cv_std: r.cv_metrics[metric]?.std ?? "",
      predict_ms_per_1k: r.predict_ms_per_1k,
    }));
    downloadText(`${task.key}_model_leaderboard.csv`, toCsv(rows));
  };

  // Table columns depend on task type.
  const cols =
    task.task_type === "classification"
      ? [
          { k: "roc_auc", label: "ROC-AUC" },
          { k: "accuracy", label: "Accuracy" },
          { k: "precision", label: "Precision" },
          { k: "recall", label: "Recall" },
          { k: "f1", label: "F1" },
        ]
      : [
          { k: "rmse", label: "RMSE" },
          { k: "mae", label: "MAE" },
          { k: "r2", label: "R²" },
        ];

  return (
    <Card
      className="col-12"
      title="Model leaderboard"
      subtitle={`Ranked by ${metricLabel(metric)} on held-out test data. Click a model to drill in.`}
      right={
        <button className="btn btn--ghost" onClick={exportCsv}>
          <Icon name="download" size={16} /> Export CSV
        </button>
      }
    >
      <div className="two-col">
        <div>
          <Plot data={data} layout={layout} height={layout.height} onClick={onBarClick} />
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Model</th>
                {cols.map((c) => (
                  <th key={c.k}>{c.label}</th>
                ))}
                <th>Speed</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r) => {
                const isBest = r.name === task.best_model;
                const isSel = r.name === selectedModel;
                return (
                  <tr
                    key={r.name}
                    className={isBest ? "is-best" : ""}
                    style={{
                      cursor: "pointer",
                      outline: isSel ? `2px solid ${C.cyan}` : "none",
                      outlineOffset: "-2px",
                    }}
                    onClick={() => onSelectModel(isSel ? null : r.name)}
                  >
                    <td>
                      <span className="model-cell">
                        <span
                          className="swatch"
                          style={{ background: modelColor(r.name, allNames) }}
                        />
                        {r.display_name}
                        {isBest && <span className="badge-best">Best</span>}
                      </span>
                    </td>
                    {cols.map((c) => (
                      <td key={c.k} className="tnum">
                        {r.test_metrics[c.k] === undefined
                          ? "--"
                          : fmtMetric(c.k, r.test_metrics[c.k], task.task_type)}
                      </td>
                    ))}
                    <td className="tnum muted">{fmtMs(r.predict_ms_per_1k)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Insight>
        <b>{bestSentence(task)}</b>
      </Insight>
    </Card>
  );
}

function bestSentence(task) {
  const best = task.results.find((r) => r.name === task.best_model);
  const metric = task.primary_metric;
  const val = fmtMetric(metric, best.test_metrics[metric], task.task_type);
  if (task.task_type === "classification") {
    return `${best.display_name} ranks churn risk best (${metricLabel(metric)} ${val}) — and it is also among the fastest to score. The simplest model wins here, which keeps it cheap to run and easy to explain.`;
  }
  return `${best.display_name} forecasts revenue with an R² of ${fmtMetric(
    "r2",
    best.test_metrics.r2,
    task.task_type
  )} (typical error ${val}). A linear model captures almost all the signal — no complex model is needed.`;
}
