import { CHANGELOG, datedChangelog } from "../content/changelog";
import { useWindow } from "./shell";

export function Changelog() {
  const { open } = useWindow();
  const cards = datedChangelog(CHANGELOG).slice(0, 3);
  return (
    <section
      className="section changelog"
      id="changelog"
      aria-labelledby="changelog-title"
    >
      <div className="section-inner">
        <p className="eyebrow" id="changelog-title">
          CHANGELOG
        </p>
        <h2 className="section-title">What landed.</h2>
        <ul className="change-grid">
          {cards.map((entry) => (
            <li key={`${entry.version}-${entry.date}`} className="change-card">
              <p className="eyebrow">{entry.date}</p>
              <h3 className="change-title">v{entry.version}</h3>
              <ul>
                {entry.highlights.slice(0, 3).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => open("changelog")}
        >
          Full changelog
        </button>
      </div>
    </section>
  );
}
