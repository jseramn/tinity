import { FAQ } from "../content/faq";

export function Faq() {
  return (
    <section className="section faq" id="faq" aria-labelledby="faq-title">
      <div className="section-inner">
        <p className="eyebrow" id="faq-title">
          FAQ
        </p>
        <h2 className="section-title">Short answers while we apply to OSS.</h2>
        <div className="faq-list">
          {FAQ.map((item) => (
            <details key={item.id} name="faq" className="faq-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
