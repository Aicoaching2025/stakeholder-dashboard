import { useMemo, useState } from "react";
import dashboardData from "./data/dashboardData.json";
import { Segment, Icon } from "./components/ui.jsx";
import KpiCards from "./components/KpiCards.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import FeatureImportance from "./components/FeatureImportance.jsx";
import PerformancePanel from "./components/PerformancePanel.jsx";
import TradeoffChart from "./components/TradeoffChart.jsx";
import DriftPanel from "./components/DriftPanel.jsx";
import ModelFilter from "./components/ModelFilter.jsx";
import { downloadText } from "./lib/format.js";

const TASK_OPTIONS = [
  { value: "churn", label: "Customer Churn" },
  { value: "revenue", label: "Monthly Revenue" },
];

export default function App() {
  const [taskKey, setTaskKey] = useState("churn");
  const task = dashboardData.tasks[taskKey];

  // Which models are visible in the charts (default: all).
  const [visibleByTask, setVisibleByTask] = useState({});
  const visibleModels = useMemo(() => {
    const saved = visibleByTask[taskKey];
    if (saved) return saved;
    return new Set(task.results.map((r) => r.name));
  }, [visibleByTask, taskKey, task]);

  const toggleModel = (name) => {
    const next = new Set(visibleModels);
    if (next.has(name)) {
      if (next.size > 1) next.delete(name); // never hide all
    } else {
      next.add(name);
    }
    setVisibleByTask((s) => ({ ...s, [taskKey]: next }));
  };

  // Drill-down: selected model for the detail panels. Defaults to the best.
  const [selectedByTask, setSelectedByTask] = useState({});
  const selectedName = selectedByTask[taskKey] ?? null;
  const detailModel =
    task.results.find((r) => r.name === (selectedName || task.best_model)) ||
    task.results.find((r) => r.name === task.best_model);
  const baseline = task.results.find((r) => r.name === "baseline");

  const setSelectedModel = (name) =>
    setSelectedByTask((s) => ({ ...s, [taskKey]: name }));

  const exportAll = () => {
    downloadText(
      `${task.key}_dashboard_data.json`,
      JSON.stringify(task, null, 2),
      "application/json"
    );
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__inner">
          <div className="brand">
            <div className="brand__mark">
              <Icon name="chart" size={22} />
            </div>
            <div>
              <div className="brand__title">Model Performance Dashboard</div>
              <div className="brand__subtitle">{dashboardData.meta.subtitle}</div>
            </div>
          </div>
          <div className="topbar__meta">
            <div>
              Source: <b>{dashboardData.meta.source}</b>
            </div>
            <div>
              {task.n_rows.toLocaleString("en-US")} records · {task.results.length} models
              compared
            </div>
          </div>
        </div>
      </header>

      <main className="shell">
        {/* business framing for the active task */}
        <div className="insight" style={{ marginBottom: 0 }}>
          <Icon name="bulb" className="insight__icon" />
          <div>
            <b>{task.business.question}</b> &nbsp;For {task.business.audience}.{" "}
            {task.business.action}
          </div>
        </div>

        {/* controls */}
        <div className="controls">
          <div className="controls__group">
            <span className="controls__label">Business question</span>
            <Segment
              options={TASK_OPTIONS}
              value={taskKey}
              onChange={(v) => setTaskKey(v)}
              ariaLabel="Choose business question"
            />
          </div>
          <div className="controls__group">
            <ModelFilter task={task} visibleModels={visibleModels} onToggle={toggleModel} />
            <button className="btn btn--primary" onClick={exportAll}>
              <Icon name="download" size={16} /> Export data
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <KpiCards task={task} best={detailModel} baseline={baseline} />

        {/* leaderboard */}
        <div className="grid section-gap">
          <Leaderboard
            task={task}
            visibleModels={visibleModels}
            selectedModel={selectedName}
            onSelectModel={setSelectedModel}
          />
        </div>

        {/* drill-down detail row */}
        <div className="grid section-gap">
          <FeatureImportance task={task} model={detailModel} />
          <PerformancePanel task={task} model={detailModel} />
        </div>

        {/* tradeoff + drift */}
        <div className="grid section-gap">
          <TradeoffChart
            task={task}
            visibleModels={visibleModels}
            selectedModel={selectedName}
            onSelectModel={setSelectedModel}
          />
          <FocusCard task={task} model={detailModel} selectedName={selectedName} onClear={() => setSelectedModel(null)} />
        </div>

        <div className="grid section-gap">
          <DriftPanel task={task} />
        </div>
      </main>

      <footer className="footer">
        <span>
          {dashboardData.meta.generated_note}
        </span>
        <span>
          App 3 of 4 · Data Science Portfolio · React + Plotly
        </span>
      </footer>
    </div>
  );
}

// A small contextual card that reflects the current drill-down selection and
// explains the interaction model to the stakeholder.
function FocusCard({ task, model, selectedName, onClear }) {
  const metric = task.primary_metric;
  return (
    <section className="card col-6">
      <div className="card__head">
        <div>
          <h2 className="card__title">In focus: {model.display_name}</h2>
          <p className="card__subtitle">
            {selectedName
              ? "You selected this model — the panels above reflect it."
              : "Showing the best model by default. Click any bar, point, or row to drill into another."}
          </p>
        </div>
        {selectedName && (
          <button className="btn btn--ghost" onClick={onClear}>
            Reset to best
          </button>
        )}
      </div>
      <div className="stat-row">
        <div className="stat">
          <span className="stat__k">Cross-validated {metric}</span>
          <span className="stat__v tnum">
            {model.cv_metrics[metric]
              ? `${model.cv_metrics[metric].mean.toFixed(3)} ± ${model.cv_metrics[metric].std.toFixed(3)}`
              : "--"}
          </span>
        </div>
        <div className="stat">
          <span className="stat__k">Test {metric}</span>
          <span className="stat__v tnum">{(model.test_metrics[metric] ?? 0).toFixed(3)}</span>
        </div>
        <div className="stat">
          <span className="stat__k">Scoring speed</span>
          <span className="stat__v tnum">{model.predict_ms_per_1k.toFixed(0)} ms</span>
        </div>
        <div className="stat">
          <span className="stat__k">Fit time</span>
          <span className="stat__v tnum">{(model.fit_seconds ?? 0).toFixed(2)} s</span>
        </div>
      </div>
      <p className="note">
        The gap between cross-validated and test scores is small here, which means the
        model generalizes — it is not memorizing the training data.
      </p>
    </section>
  );
}
