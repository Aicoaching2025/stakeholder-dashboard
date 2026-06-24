"""Extract App 2 (model-comparison-framework) report JSON into a single, clean
data module the React dashboard binds to.

This is the data pipeline that connects App 2 -> App 3:
    App 2 trains models and writes reports/<task>.json
    App 3 reads those reports and renders them for stakeholders.

It also derives a few stakeholder-friendly fields (plain-language verdicts,
business framing) and synthesizes a *monitoring preview* drift series so the
dashboard can demo the drift-detection view before App 4 (the live monitoring
service) exists. The drift series is clearly labeled as simulated everywhere
it surfaces.

Run:
    python scripts/extract_data.py
Writes:
    src/data/dashboardData.json

ASCII-only output (Windows legacy console is cp1252).
"""

import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
DASH_ROOT = os.path.dirname(HERE)
# App 2 lives next to App 3 under Desktop/YouTube30/
APP2_REPORTS = os.path.normpath(
    os.path.join(DASH_ROOT, "..", "model-comparison-framework", "reports")
)
OUT_PATH = os.path.join(DASH_ROOT, "src", "data", "dashboardData.json")

# Deterministic pseudo-random for the simulated drift series (no Math.random in
# the build; keep it reproducible so the demo looks the same every run).
def lcg(seed):
    state = seed
    while True:
        state = (1103515245 * state + 12345) % (2 ** 31)
        yield state / (2 ** 31)


def round_num(x, n=4):
    if x is None:
        return None
    if isinstance(x, float) and (math.isnan(x) or math.isinf(x)):
        return None
    return round(x, n)


def clean_result(r):
    """Trim a single model result to what the dashboard needs."""
    return {
        "name": r["name"],
        "display_name": r["display_name"],
        "cv_metrics": {
            k: {"mean": round_num(v["mean"]), "std": round_num(v["std"])}
            for k, v in r["cv_metrics"].items()
        },
        "test_metrics": {k: round_num(v) for k, v in r["test_metrics"].items()},
        "fit_seconds": round_num(r.get("fit_seconds"), 4),
        "predict_ms_per_1k": round_num(r.get("predict_ms_per_1k"), 2),
        "importances": [
            {
                "feature": i["feature"],
                "importance": round_num(i["importance"], 5),
                "std": round_num(i["std"], 5),
            }
            for i in (r.get("importances") or [])
        ],
        "roc_curve": r.get("roc_curve"),
        "confusion": r.get("confusion"),
        "pred_vs_actual": r.get("pred_vs_actual"),
        "best_params": r.get("best_params") or {},
        "error": r.get("error"),
    }


# Plain-English names for the raw feature columns, for non-technical readers.
FEATURE_LABELS = {
    "tenure_days": "Customer tenure (days)",
    "age": "Customer age",
    "country": "Country",
    "plan": "Subscription plan",
    "contract": "Contract type",
    "num_support_tickets": "Support tickets",
    "last_login_days": "Days since last login",
    "monthly_revenue": "Monthly revenue",
}


def synth_drift(task_key, primary_metric, baseline_value, seed):
    """Synthesize a 12-week monitoring preview for the drift view.

    Returns a population-stability-index (PSI) series per top feature plus a
    rolling primary-metric series, with a clearly-flagged drift event so the
    'alert' state is demonstrable. SIMULATED until App 4 ships live monitoring.
    """
    rng = lcg(seed)
    weeks = [f"W{w:02d}" for w in range(1, 13)]
    # PSI bands: <0.1 stable, 0.1-0.25 watch, >0.25 drift.
    psi_features = {
        "churn": ["contract", "last_login_days", "plan"],
        "revenue": ["plan", "contract", "age"],
    }[task_key]
    psi = {}
    for fi, feat in enumerate(psi_features):
        series = []
        base = 0.02 + fi * 0.01
        for wi in range(12):
            noise = (next(rng) - 0.5) * 0.04
            val = base + noise
            # Inject a drift ramp on the first feature from week 8 onward.
            if fi == 0 and wi >= 7:
                val += (wi - 6) * 0.045
            series.append(round(max(val, 0.0), 4))
        psi[feat] = series
    # Rolling primary metric degrades slightly as drift sets in.
    metric_series = []
    for wi in range(12):
        noise = (next(rng) - 0.5) * 0.01
        decay = 0.0 if wi < 7 else (wi - 6) * 0.012
        metric_series.append(round(baseline_value - decay + noise, 4))
    # Alert if the worst feature crosses 0.25 PSI.
    worst = max(max(v) for v in psi.values())
    status = "alert" if worst > 0.25 else ("watch" if worst > 0.1 else "stable")
    return {
        "weeks": weeks,
        "psi": psi,
        "metric_series": metric_series,
        "primary_metric": primary_metric,
        "baseline_value": round_num(baseline_value),
        "worst_psi": round(worst, 4),
        "status": status,
        "simulated": True,
    }


def build_task(report_path, task_key, business, seed):
    with open(report_path, "r", encoding="utf-8") as f:
        d = json.load(f)

    results = [clean_result(r) for r in d["results"]]
    best_name = d["best_model"]
    best = next(r for r in results if r["name"] == best_name)
    primary = d["primary_metric"]
    higher_is_better = d["higher_is_better"]
    baseline_metric_value = best["test_metrics"].get(primary)

    return {
        "key": task_key,
        "name": d["task"]["name"],
        "task_type": d["task"]["task"],
        "target": d["task"]["target"],
        "primary_metric": primary,
        "higher_is_better": higher_is_better,
        "n_rows": d["n_rows"],
        "n_features": d["n_features"],
        "rows_dropped": d.get("rows_dropped", 0),
        "feature_names": d["feature_names"],
        "feature_labels": {f: FEATURE_LABELS.get(f, f) for f in d["feature_names"]},
        "class_balance": d.get("class_balance"),
        "target_summary": d.get("target_summary"),
        "best_model": best_name,
        "results": results,
        "business": business,
        "drift": synth_drift(task_key, primary, baseline_metric_value, seed),
    }


def main():
    churn = build_task(
        os.path.join(APP2_REPORTS, "customer_churn.json"),
        "churn",
        {
            "question": "Which customers are likely to cancel?",
            "audience": "Retention & Customer Success",
            "metric_label": "ROC-AUC",
            "metric_plain": "How well the model ranks churn risk (0.5 = coin flip, 1.0 = perfect).",
            "action": "Target at-risk accounts with retention offers before they churn.",
        },
        seed=42,
    )
    revenue = build_task(
        os.path.join(APP2_REPORTS, "monthly_revenue.json"),
        "revenue",
        {
            "question": "How much revenue will each account generate?",
            "audience": "Finance & RevOps",
            "metric_label": "RMSE",
            "metric_plain": "Average dollar error of the revenue forecast (lower is better).",
            "action": "Forecast account revenue to prioritize high-value relationships.",
        },
        seed=7,
    )

    payload = {
        "meta": {
            "title": "Model Performance Dashboard",
            "subtitle": "Predictive models for customer churn and revenue, explained for decision-makers",
            "source": "model-comparison-framework (App 2)",
            "generated_note": "Data extracted from App 2 model reports. Drift view is a simulated monitoring preview.",
        },
        "tasks": {"churn": churn, "revenue": revenue},
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print("Wrote", os.path.relpath(OUT_PATH, DASH_ROOT))
    print("  churn:   best =", churn["best_model"], "| models =", len(churn["results"]))
    print("  revenue: best =", revenue["best_model"], "| models =", len(revenue["results"]))


if __name__ == "__main__":
    main()
