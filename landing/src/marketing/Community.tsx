import { COMMUNITY } from "../content/community";
import { REPO_ISSUES_HREF } from "../content/version";

export function Community() {
  return (
    <section
      className="section community"
      id="community"
      aria-labelledby="community-title"
    >
      <div className="section-inner">
        <p className="eyebrow" id="community-title">
          COMMUNITY
        </p>
        <h2 className="section-title">We are still building this.</h2>
        <p className="section-dek">
          Channels are reserved. The public trail is GitHub.
        </p>
        <ul className="community-grid">
          {COMMUNITY.map((item) => (
            <li key={item.id} data-status={item.status}>
              <a href={item.href} target="_blank" rel="noopener noreferrer">
                {item.label}
              </a>
              <p>{item.dek}</p>
            </li>
          ))}
        </ul>
        <a
          className="btn-ghost"
          href={REPO_ISSUES_HREF}
          target="_blank"
          rel="noopener noreferrer"
        >
          Contribute
        </a>
      </div>
    </section>
  );
}
