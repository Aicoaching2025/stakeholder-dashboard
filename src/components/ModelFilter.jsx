// Toggle which models appear across the charts. Each chip carries the model's
// series-color swatch so the legend reads consistently with every chart.
import { modelColor } from "../lib/theme.js";

export default function ModelFilter({ task, visibleModels, onToggle }) {
  const allNames = task.results.map((r) => r.name);
  return (
    <div className="controls__group">
      <span className="controls__label">Models</span>
      <div className="chips">
        {task.results.map((r) => {
          const on = visibleModels.has(r.name);
          return (
            <button
              key={r.name}
              type="button"
              className="chip"
              aria-pressed={on}
              onClick={() => onToggle(r.name)}
              title={on ? "Click to hide" : "Click to show"}
            >
              <span className="chip__dot" style={{ background: modelColor(r.name, allNames) }} />
              {r.display_name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
