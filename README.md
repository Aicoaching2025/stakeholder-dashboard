# Interactive Stakeholder Dashboard

> App 3 of a 4-part data science portfolio. A React + Plotly dashboard that turns
> the model outputs from [App 2](../model-comparison-framework) into something a
> **non-technical decision-maker** can read in three seconds and act on.

It answers two business questions over the same customer base — *"Which customers
are likely to cancel?"* (churn, classification) and *"How much revenue will each
account generate?"* (revenue, regression) — and presents model performance,
feature importance, the accuracy/speed trade-off, and a drift-monitoring preview,
each paired with a plain-language takeaway.

![palette](https://img.shields.io/badge/palette-%23003366%20%23006699%20%230099CC%20%23B3C7E6%20%23FFFFFF-006699)

---

## Why it exists (maps to the job)

| Job requirement | How this app demonstrates it |
|---|---|
| Create clear, impactful data visualizations | A coherent Plotly chart system on one design language; every chart answers one question. |
| Communicate technical findings to business stakeholders | Plain-language insight under every chart; KPIs framed as lift vs. a naive baseline. |
| Translate business problems into insights | "Business question" framing, audience + recommended action per task, build-for-action layout. |

## What's on the dashboard

1. **Executive KPI strip** — headline metric with lift vs. baseline, the business
   KPI (churn rate / average revenue), data scale, and scoring speed.
2. **Model leaderboard** — primary-metric bar chart + a full metrics table. The
   best model is highlighted; click any bar or row to drill in. Export to CSV.
3. **What drives the prediction** — permutation feature importance (with error
   bars) for the selected model, every feature given a plain-English label.
4. **Performance detail** — ROC curve + confusion matrix (churn) or
   predicted-vs-actual scatter (revenue), each with a "what this means" reading.
5. **Accuracy vs. speed** — the real deployment trade-off as a bubble chart.
6. **In focus** — cross-validated vs. test scores for the selected model, framed
   as a generalization (over-fitting) check.
7. **Drift detection** — a 12-week monitoring preview: per-feature Population
   Stability Index with watch/alert thresholds and a rolling-metric panel.
   Clearly tagged **simulated** — the live version ships with App 4.

**Interactions:** switch business question · toggle which models appear ·
click-to-drill-down (synced across all panels) · export CSV / JSON · fully
responsive (4-up → 1-up).

## Design system

The whole UI is built on a five-color brief — `#003366 #006699 #0099CC #B3C7E6
#FFFFFF` — documented in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). One cool-blue ramp
carries structure; cyan always means "interactive / selected"; three semantic
colors appear only for KPI deltas and drift status. Tokens live in
[`src/theme.css`](src/theme.css); the Plotly theme in
[`src/lib/plotlyTheme.js`](src/lib/plotlyTheme.js) enforces it on every chart.

## Data pipeline

The dashboard does not retrain anything — it visualizes App 2's reports:

```
model-comparison-framework/reports/*.json   (App 2 output)
        │
        ▼  python scripts/extract_data.py
src/data/dashboardData.json                  (clean, dashboard-shaped)
        │
        ▼  import
React + Plotly UI
```

`scripts/extract_data.py` trims each model result, adds stakeholder-friendly
fields (plain-language labels, business framing), and synthesizes the labeled
drift preview. Re-run it whenever App 2's reports change:

```bash
npm run data      # python scripts/extract_data.py
```

## Run locally

```bash
npm install
npm run dev       # http://localhost:5173
```

## Build & deploy (Vercel)

```bash
npm run build     # -> dist/
npm run preview   # preview the production build locally
```

Deploy to Vercel either way:

- **Dashboard (CLI):** `vercel` then `vercel --prod` from this folder. Settings
  are picked up from [`vercel.json`](vercel.json) (framework `vite`, build
  `npm run build`, output `dist`).
- **Git import:** push this folder to a repo and "Import Project" on Vercel —
  it auto-detects Vite. If the repo root is the portfolio (not this subfolder),
  set the project **Root Directory** to `stakeholder-dashboard`.

The build uses a relative base (`base: "./"` in `vite.config.js`), so the same
`dist/` also works on GitHub Pages or any static host.

## Tech

React 18 · Vite 5 · plotly.js (dist build wrapped in a small React component to
avoid peer-dependency churn) · no CSS framework — just the design tokens.

## Project structure

```
stakeholder-dashboard/
├── DESIGN_SYSTEM.md          # the design language
├── scripts/extract_data.py   # App 2 reports -> dashboard data
├── src/
│   ├── data/dashboardData.json
│   ├── theme.css  styles.css
│   ├── lib/          # theme.js, plotlyTheme.js, format.js
│   ├── components/   # KpiCards, Leaderboard, FeatureImportance,
│   │                 # PerformancePanel, TradeoffChart, DriftPanel, ...
│   └── App.jsx
└── vercel.json
```
