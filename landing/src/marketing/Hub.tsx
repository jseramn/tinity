import { HARNESSES } from "../content/harnesses";
import { markSrcFor } from "../experience/AgentMark";
import { usePrefersReducedMotion } from "../experience/motion";
import { MarkSvg } from "./Lockup";
import { HUB_CX, HUB_CY, hubLayout, spokePath } from "./hubLayout";

const SIZE = 800;
const DOT_INDEXES = [0, 4, 8, 12];

export function Hub() {
  const reduced = usePrefersReducedMotion();
  const nodes = hubLayout(HARNESSES.map((h) => h.id));
  return (
    <section className="section hub" id="hub" aria-labelledby="hub-title">
      <div className="section-inner">
        <p className="eyebrow" id="hub-title">
          HUB
        </p>
        <h2 className="section-title">Tinity is the node between the harnesses.</h2>
        <p className="section-dek">
          Seventeen spokes in. Policy out, later. Today every rim node is idle.
        </p>
        <figure
          className="hub-figure"
          role="img"
          aria-labelledby="hub-title"
          aria-describedby="hub-desc"
        >
          <svg
            className="hub-ring"
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            aria-hidden="true"
          >
            <g fill="none" stroke="var(--hairline)" strokeWidth="1">
              {nodes.map((node) => (
                <path
                  key={node.id}
                  className="hub-spoke"
                  d={spokePath(node, HUB_CX, HUB_CY, SIZE)}
                />
              ))}
            </g>
            {!reduced
              ? DOT_INDEXES.map((index) => {
                  const node = nodes[index];
                  if (!node) return null;
                  return (
                    <circle
                      key={`dot-${node.id}`}
                      r="3"
                      className="hub-dot"
                      fill="#1fdb12"
                    >
                      <animateMotion
                        dur="2.4s"
                        begin={`${index * 0.35}s`}
                        repeatCount="indefinite"
                        path={spokePath(node, HUB_CX, HUB_CY, SIZE)}
                      />
                    </circle>
                  );
                })
              : null}
            <g
              transform={`translate(${HUB_CX * SIZE} ${HUB_CY * SIZE}) scale(28)`}
            >
              <MarkSvg size={3.47} />
            </g>
            {nodes.map((node) => {
              const harness = HARNESSES[node.index]!;
              return (
                <g
                  key={`node-${node.id}`}
                  className="hub-node"
                  data-status={harness.status}
                  transform={`translate(${node.x * SIZE} ${node.y * SIZE})`}
                >
                  <circle r="18" fill="#111111" stroke="#262626" />
                  <image
                    href={markSrcFor(harness.id)}
                    x="-10"
                    y="-10"
                    width="20"
                    height="20"
                  />
                </g>
              );
            })}
          </svg>
          <ul className="hub-stack">
            {HARNESSES.map((harness) => (
              <li key={harness.id} data-status={harness.status}>
                <img src={markSrcFor(harness.id)} alt="" width={20} height={20} />
                <span>{harness.label}</span>
              </li>
            ))}
          </ul>
          <figcaption id="hub-desc" className="sr-only">
            Tinity sits at the center. {HARNESSES.length} harnesses sit on the
            ring. All nodes are idle.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
