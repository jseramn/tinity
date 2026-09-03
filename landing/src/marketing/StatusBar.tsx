import { HARNESSES } from "../content/harnesses";
import { VERSION, VERSION_TAG_HREF } from "../content/version";
import { markSrcFor } from "../experience/AgentMark";

export function StatusBar() {
  return (
    <section className="section status" id="status" aria-labelledby="status-title">
      <div className="section-inner">
        <p className="eyebrow" id="status-title">
          STATUS
        </p>
        <a className="status-version" href={VERSION_TAG_HREF}>
          RUNS ON v{VERSION}
        </a>
        <ul className="status-pips">
          {HARNESSES.map((harness) => (
            <li
              key={harness.id}
              className="status-pip"
              data-status={harness.status}
              data-harness={harness.id}
            >
              <img
                className="status-pip-mark"
                src={markSrcFor(harness.id)}
                alt=""
                width={20}
                height={20}
              />
              <span className="status-pip-label">{harness.label}</span>
              <span className="sr-only">{harness.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
