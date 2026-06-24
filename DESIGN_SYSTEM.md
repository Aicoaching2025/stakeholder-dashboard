# Design System — Stakeholder Dashboard

A small, opinionated design system for an executive-facing analytics dashboard.
The goal is **clarity for non-technical decision-makers**: calm surfaces, one
accent color that always means "interactive," and charts that read in three
seconds.

---

## 1. Color

The palette is a single cool-blue ramp from deep navy to white. Using one hue
keeps the dashboard feeling like a unified product rather than a chart dump, and
reserves saturation for the things that matter (alerts, the selected model).

| Token | Hex | Role |
|-------|-----|------|
| `--navy` | `#003366` | Primary. Headers, top bar, primary text on light, primary buttons. |
| `--blue` | `#006699` | Secondary. Section headings, secondary series, hovered nav. |
| `--cyan` | `#0099CC` | Accent / interactive. Selected state, links, primary data series, focus rings. |
| `--mist` | `#B3C7E6` | Light structural. Card borders, gridlines, muted fills, table stripes. |
| `--white` | `#FFFFFF` | Surface. Card and page background. |

### Derived tokens

Tints/shades and semantic colors are derived from the five base colors so the
whole system traces back to the brief.

```
--navy-900: #002347   (darker navy, top-bar gradient end)
--ink:      #0A2540   (body text — navy-leaning near-black, softer than #000)
--ink-muted:#5A7390   (secondary text, axis labels)
--bg-app:   #EEF3FA   (app background — mist mixed toward white)
--bg-subtle:#F6F9FD   (zebra rows, inset panels)

--cyan-600: #007FAD   (cyan pressed/hover)
--cyan-050: #E4F4FB   (cyan tint — selected row, active chip background)

Semantic (for KPI direction + drift status only — used sparingly):
--good:  #1E8E6A      (positive delta, "stable")
--warn:  #C98A1B      (watch / caution)
--alert: #C0392B      (drift alert, negative delta)
```

**Rule:** color is information. Greys and the blue ramp carry structure; `--cyan`
means "you can act on this / this is selected"; the three semantic colors appear
**only** for KPI deltas and drift status, never as decoration.

### Chart series order

For multi-series charts, use this fixed order so the same model keeps the same
color across every chart:

`['#0099CC', '#003366', '#006699', '#7FB2D9', '#B3C7E6']`

The **best / selected** model is always `--cyan`; everything else recedes into
navy/mist.

---

## 2. Typography

System font stack — fast, native, no webfont flash, reads as "tool" not "brand."

```
font-family: "Segoe UI", system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif;
```

| Token | Size / line | Weight | Use |
|-------|-------------|--------|-----|
| `--fs-display` | 28 / 1.2 | 700 | Dashboard title |
| `--fs-h2` | 19 / 1.3 | 650 | Card / section titles |
| `--fs-h3` | 15 / 1.3 | 600 | Sub-headings, chart titles |
| `--fs-body` | 14 / 1.5 | 400 | Body, table cells |
| `--fs-small` | 12.5 / 1.4 | 400 | Captions, axis labels, footnotes |
| `--fs-kpi` | 34 / 1.1 | 700 | KPI numbers (tabular figures) |

Numbers in KPIs and tables use `font-variant-numeric: tabular-nums` so digits
align in columns.

---

## 3. Spacing & layout

4-px base grid. Tokens: `--sp-1: 4px` … `--sp-8: 48px` (4, 8, 12, 16, 24, 32, 40, 48).

- **Page gutter:** 24px (mobile) → 32px (desktop), max content width `1280px`.
- **Card padding:** 20px.
- **Grid gap:** 16px.
- **Cards** snap to a 12-column grid; KPI row is 4-up on desktop, 2-up tablet, 1-up mobile.

---

## 4. Elevation, radius, borders

```
--radius:    12px   (cards)
--radius-sm: 8px    (chips, buttons, inputs)
--border:    1px solid var(--mist)
--shadow:    0 1px 2px rgba(0,51,102,.06), 0 8px 24px rgba(0,51,102,.06)
--shadow-sm: 0 1px 2px rgba(0,51,102,.08)
```

Shadows are tinted navy (not neutral black) so elevation stays in the palette.
One elevation level only — cards lift off the app background; nothing floats
above cards except menus/tooltips.

---

## 5. Components

- **Card** — white surface, `--border`, `--radius`, `--shadow`. Title (`--fs-h2`)
  + optional one-line plain-language subtitle in `--ink-muted`.
- **KPI card** — label (small, muted, uppercase tracking) · big number (`--fs-kpi`,
  navy) · delta chip (semantic color + ▲/▼).
- **Segmented control** (task switch, metric switch) — pill group; selected
  segment is `--cyan` fill + white text, rest are transparent with `--ink` text.
- **Chip / toggle** (model filter) — `--radius-sm`, mist border; active =
  `--cyan-050` bg + `--cyan` border + navy text. Color swatch dot shows the
  model's series color.
- **Button** — primary = navy fill/white text; ghost = transparent + mist border.
  Hover darkens one step; focus shows a 2px `--cyan` ring.
- **Table** — zebra rows (`--bg-subtle`), mist row borders, navy header text;
  the best-model row is tinted `--cyan-050` with a left `--cyan` accent bar.
- **Status pill** (drift) — stable/watch/alert map to good/warn/alert with a
  matching tinted background.

---

## 6. Charts (Plotly)

A shared theme (`src/lib/plotlyTheme.js`) enforces the system on every chart:

- Transparent paper/plot background (cards provide the surface).
- Gridlines `--mist` at low opacity; zero-lines slightly stronger; no chart borders.
- Axis text `--ink-muted`, `--fs-small`; titles `--ink`, `--fs-h3`.
- Series colors from the fixed ramp above; selected/best = `--cyan`.
- Unified hover with a white card, navy text, mist border.
- Generous margins; legends horizontal under the title; mode-bar trimmed to the
  useful buttons and shown on hover only.

**Principle — built for action, not art:** every chart answers one question and
carries a one-line plain-language takeaway. No 3D, no dual axes, no more than
five series, no chartjunk.

---

## 7. Accessibility

- Body text (`--ink` on white) and navy-on-white exceed WCAG AA.
- State is never color-only: selected items also carry a border/weight change;
  drift status pairs color with a text label and icon; KPI deltas pair color with
  ▲/▼ and a sign.
- Focus is always visible (2px `--cyan` ring). Targets ≥ 36px tall.
- Charts have text takeaways so the insight survives even if color is missed.
