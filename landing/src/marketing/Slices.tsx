import { SLICES, SLICE_BADGE } from "../content/slices";

export function Slices() {
  return (
    <section className="section slices" id="slices" aria-labelledby="slices-title">
      <div className="section-inner">
        <p className="eyebrow" id="slices-title">
          SLICES
        </p>
        <h2 className="section-title">What Tinity is building.</h2>
        <p className="section-dek">
          Shipped means in the repo. Next and later are not present tense.
        </p>
        <ul className="slice-grid">
          {SLICES.map((slice) => (
            <li key={slice.id} className="slice-card" data-status={slice.status}>
              <p className="eyebrow">{slice.eyebrow}</p>
              <h3 className="slice-title">{slice.title}</h3>
              <p className="slice-dek">{slice.dek}</p>
              <span className={`badge badge--${slice.status}`}>
                {SLICE_BADGE[slice.status]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
