// Small presentational primitives shared across the dashboard.

export function Card({ title, subtitle, right, children, className = "", id }) {
  return (
    <section className={`card ${className}`} id={id}>
      {(title || right) && (
        <div className="card__head">
          <div>
            {title && <h2 className="card__title">{title}</h2>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {right && <div>{right}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Insight({ children }) {
  return (
    <div className="insight">
      <Icon name="bulb" className="insight__icon" />
      <div>{children}</div>
    </div>
  );
}

export function Segment({ options, value, onChange, ariaLabel }) {
  return (
    <div className="segment" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="segment__btn"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function StatusPill({ status, label }) {
  return (
    <span className={`status status--${status}`}>
      <span className="status__dot" />
      {label}
    </span>
  );
}

// Minimal inline icon set (no icon-font dependency).
export function Icon({ name, className, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };
  switch (name) {
    case "bulb":
      return (
        <svg {...common}>
          <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z" />
        </svg>
      );
    case "download":
      return (
        <svg {...common}>
          <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path d="M3 3v18h18M8 14v4M13 9v9M18 6v12" />
        </svg>
      );
    case "alert":
      return (
        <svg {...common}>
          <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      );
    default:
      return null;
  }
}
