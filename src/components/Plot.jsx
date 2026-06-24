// Thin React wrapper around plotly.js-dist-min. Using the dist build directly
// (instead of react-plotly.js) sidesteps peer-dependency version conflicts and
// keeps the bundle under our control. Calls Plotly.react on data/layout change
// and purges on unmount.
import { useEffect, useRef } from "react";
import Plotly from "plotly.js-dist-min";
import { baseConfig } from "../lib/plotlyTheme.js";

export default function Plot({ data, layout, config, height = 320, style, onClick }) {
  const hostRef = useRef(null);
  const boundRef = useRef(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    Plotly.react(el, data, layout, { ...baseConfig, ...config });

    if (onClick && !boundRef.current) {
      el.on("plotly_click", onClick);
      boundRef.current = true;
    }
  }, [data, layout, config, onClick]);

  // Keep Plotly sized to its container on window/layout resize.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      Plotly.Plots.resize(el);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = hostRef.current;
    return () => {
      if (el) Plotly.purge(el);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="plot-host"
      style={{ height, ...style }}
      role="img"
    />
  );
}
