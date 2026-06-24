// Accuracy vs. speed: a scatter that frames the real deployment decision —
// "is the most accurate model fast enough to run?" Bubble per model; the best
// model is cyan. Helps a stakeholder see when a simpler/faster model is good
// enough.
import Plot from "./Plot.jsx";
import { Card, Insight } from "./ui.jsx";
import { baseLayout, axis } from "../lib/plotlyTheme.js";
import { modelColor, C } from "../lib/theme.js";
import { metricLabel, fmtMetric } from "../lib/format.js";

export default function TradeoffChart({ task, visibleModels, selectedModel, onSelectModel }) {
  const metric = task.primary_metric;
  const allNames = task.results.map((r) => r.name);
  const models = task.results.filter(
    (r) => r.name !== "baseline" && !r.error && visibleModels.has(r.name)
  );

  const traces = models.map((r) => {
    const isHi = !selectedModel || r.name === selectedModel;
    return {
      x: [r.predict_ms_per_1k],
      y: [r.test_metrics[metric]],
      mode: "markers+text",
      type: "scatter",
      text: [r.display_name],
      textposition: "top center",
      textfont: { size: 11, color: C.inkMuted },
      marker: {
        size: r.name === task.best_model ? 20 : 15,
        color: r.name === task.best_model ? C.cyan : modelColor(r.name, allNames),
        opacity: isHi ? 0.95 : 0.4,
        line: { color: r.name === selectedModel ? C.navy : C.white, width: r.name === selectedModel ? 2.5 : 1.5 },
      },
      name: r.display_name,
      customdata: [r.name],
      hovertemplate: `<b>%{text}</b><br>${metricLabel(metric)}: %{y:.3f}<br>Speed: %{x:.0f} ms / 1k<extra></extra>`,
      showlegend: false,
    };
  });

  const layout = baseLayout({
    height: 340,
    margin: { l: 58, r: 24, t: 16, b: 48 },
    xaxis: {
      ...axis(),
      title: { text: "Scoring time — ms per 1,000 customers (lower = faster)", font: { size: 12, color: C.inkMuted } },
    },
    yaxis: {
      ...axis(),
      title: { text: `${metricLabel(metric)} (higher = better)`, font: { size: 12, color: C.inkMuted } },
    },
  });

  const onClick = (e) => {
    const name = e.points?.[0]?.customdata;
    if (name) onSelectModel(name === selectedModel ? null : name);
  };

  return (
    <Card
      className="col-6"
      title="Accuracy vs. speed"
      subtitle="The deployment trade-off: is the best model also fast enough?"
    >
      <Plot data={traces} layout={layout} height={340} onClick={onClick} />
      <Insight>{tradeoffSentence(task)}</Insight>
    </Card>
  );
}

function tradeoffSentence(task) {
  const metric = task.primary_metric;
  const real = task.results.filter((r) => r.name !== "baseline" && !r.error);
  const best = real.find((r) => r.name === task.best_model);
  const fastest = [...real].sort((a, b) => a.predict_ms_per_1k - b.predict_ms_per_1k)[0];
  const slowest = [...real].sort((a, b) => b.predict_ms_per_1k - a.predict_ms_per_1k)[0];
  const sameWinnerFast = best && fastest && best.name === fastest.name;
  if (sameWinnerFast) {
    return (
      <>
        The best model (<b>{best.display_name}</b>) is also among the fastest — no
        trade-off to make here. The slowest option ({slowest.display_name}) is{" "}
        <b>{(slowest.predict_ms_per_1k / fastest.predict_ms_per_1k).toFixed(0)}×</b> slower
        for no accuracy gain.
      </>
    );
  }
  return (
    <>
      Top-left is ideal: accurate <i>and</i> fast. <b>{best.display_name}</b> wins on{" "}
      {metricLabel(metric)}; weigh that against its scoring cost before deploying.
    </>
  );
}
