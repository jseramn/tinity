import { VERSION } from "../content/version";
import { Credits } from "../experience/Credits";

const LINKS = [
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Privacy", "/privacy"],
  ["Developers", "/developers"],
] as const;

export function Footer() {
  return (
    <footer className="site-footer">
      <Credits />
      <nav className="site-footer-links" aria-label="Site">
        {LINKS.map(([label, href]) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
      </nav>
      <p className="site-footer-meta">MIT · v{VERSION}</p>
    </footer>
  );
}
