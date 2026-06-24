// Formatting + small data helpers shared across components.

export const fmtNum = (x, d = 3) =>
  x === null || x === undefined || Number.isNaN(x) ? "--" : Number(x).toFixed(d);

export const fmtPct = (x, d = 1) =>
  x === null || x === undefined || Number.isNaN(x) ? "--" : (x * 100).toFixed(d) + "%";

export const fmtInt = (x) =>
  x === null || x === undefined ? "--" : Number(x).toLocaleString("en-US");

export const fmtUsd = (x, d = 0) =>
  x === null || x === undefined || Number.isNaN(x)
    ? "--"
    : "$" + Number(x).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export const fmtMs = (x) =>
  x === null || x === undefined ? "--" : Number(x).toFixed(1) + " ms";

// Is metric m "better" when higher? rmse/mae lower-is-better, everything else higher.
export const higherBetter = (metric) => !["rmse", "mae"].includes(metric);

// Pretty label for a metric key.
export const METRIC_LABEL = {
  roc_auc: "ROC-AUC",
  accuracy: "Accuracy",
  precision: "Precision",
  recall: "Recall",
  f1: "F1 score",
  rmse: "RMSE",
  mae: "MAE",
  r2: "R²",
};
export const metricLabel = (m) => METRIC_LABEL[m] || m;

// Format a metric value appropriately (auc/r2/etc as decimal, rmse/mae as $).
export function fmtMetric(metric, value, taskType) {
  if (value === null || value === undefined) return "--";
  if (metric === "rmse" || metric === "mae") {
    return taskType === "regression" ? fmtUsd(value, 2) : fmtNum(value, 3);
  }
  return fmtNum(value, 3);
}

// Sort models by a metric, best first. Baseline always sinks to the bottom.
export function rankByMetric(results, metric, higherIsBetter) {
  const real = results.filter((r) => r.name !== "baseline" && !r.error);
  const base = results.filter((r) => r.name === "baseline");
  const sorted = [...real].sort((a, b) => {
    const av = a.test_metrics[metric];
    const bv = b.test_metrics[metric];
    return higherIsBetter ? bv - av : av - bv;
  });
  return [...sorted, ...base];
}

// Build a CSV string from an array of row objects.
export function toCsv(rows) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const head = cols.join(",");
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(",")).join("\n");
  return head + "\n" + body;
}

export function downloadText(filename, text, type = "text/csv;charset=utf-8") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
