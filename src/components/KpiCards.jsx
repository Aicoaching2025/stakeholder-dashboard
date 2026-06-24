// Executive KPI strip — the "three-second read" at the top of the dashboard.
// Each KPI pairs a big number with a plain-language footnote and, where it
// helps, a delta vs the naive baseline so a non-technical reader sees lift.
import { Card } from "./ui.jsx";
import { fmtMetric, fmtInt, metricLabel, fmtPct } from "../lib/format.js";

function Kpi({ label, value, foot, delta }) {
  return (
    <Card className="col-3">
      <div className="kpi">
        <span className="kpi__label">{label}</span>
        <span className="kpi__value tnum">{value}</span>
        <span className="kpi__foot">
          {delta && (
            <span className={`delta delta--${delta.tone}`}>
              {delta.arrow} {delta.text}
            </span>
          )}
          <span>{foot}</span>
        </span>
      </div>
    </Card>
  );
}

export default function KpiCards({ task, best, baseline }) {
  const metric = task.primary_metric;
  const bestVal = best.test_metrics[metric];
  const baseVal = baseline ? baseline.test_metrics[metric] : null;

  // Lift vs baseline, framed in the right direction per metric.
  let liftDelta = null;
  if (baseVal !== null && baseVal !== undefined) {
    if (metric === "rmse" || metric === "mae") {
      const pct = (1 - bestVal / baseVal) * 100;
      liftDelta = { tone: "good", arrow: "▼", text: `${pct.toFixed(0)}% lower error` };
    } else {
      const pts = (bestVal - baseVal) * 100;
      liftDelta = { tone: "good", arrow: "▲", text: `+${pts.toFixed(0)} pts vs baseline` };
    }
  }

  const cards = [];

  // 1. Headline metric
  cards.push(
    <Kpi
      key="metric"
      label={`Best model ${metricLabel(metric)}`}
      value={fmtMetric(metric, bestVal, task.task_type)}
      foot={best.display_name}
      delta={liftDelta}
    />
  );

  // 2. Task-specific business KPI
  if (task.task_type === "classification" && task.class_balance) {
    const pos = task.class_balance["1"];
    const total = task.class_balance["0"] + task.class_balance["1"];
    cards.push(
      <Kpi
        key="rate"
        label="Observed churn rate"
        value={fmtPct(pos / total, 1)}
        foot={`${fmtInt(pos)} of ${fmtInt(total)} customers churned`}
      />
    );
  } else if (task.target_summary) {
    cards.push(
      <Kpi
        key="avg"
        label="Avg. monthly revenue"
        value={"$" + task.target_summary.mean.toFixed(0)}
        foot={`per account · ±$${task.target_summary.std.toFixed(0)} spread`}
      />
    );
  }

  // 3. Data scale
  cards.push(
    <Kpi
      key="rows"
      label="Records analyzed"
      value={fmtInt(task.n_rows)}
      foot={`${task.n_features} features · ${fmtInt(task.rows_dropped)} dropped in cleaning`}
    />
  );

  // 4. Speed
  cards.push(
    <Kpi
      key="latency"
      label="Scoring speed"
      value={best.predict_ms_per_1k.toFixed(0) + " ms"}
      foot="per 1,000 customers scored"
      delta={{ tone: "neutral", arrow: "⚡", text: "real-time ready" }}
    />
  );

  return <div className="grid">{cards}</div>;
}
