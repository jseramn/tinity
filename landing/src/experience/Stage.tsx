import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { ForceFieldAdapter, type ForceFieldHandle } from "./adapters/forceField";
import {
  RIPPLE_SPEED,
  ctaOrigin,
  flipAxis,
  flipTargets,
  flipTilt,
  scheduledFlipDelay,
} from "./delays";
import { reduce, type Phase } from "./machine";
import { usePrefersReducedMotion } from "./motion";
import { layoutTiles, type Tile } from "./tiles";

type CubeProps = {
  tile: Tile;
  flipped: boolean;
  onCta?: () => void;
  flipX?: number;
  flipY?: number;
  flipTilt?: number;
};

function cubeBox(
  tile: Tile,
  axis?: { x: number; y: number },
  tilt?: number,
): CSSProperties {
  return {
    left: tile.x,
    top: tile.y,
    width: tile.size,
    height: tile.size,
    ["--cell-css"]: `${tile.size}px`,
    ...(axis
      ? {
          ["--flip-x"]: String(axis.x),
          ["--flip-y"]: String(axis.y),
          ["--flip-twist"]: Math.abs(axis.x) >= Math.abs(axis.y) ? "90deg" : "0deg",
          ...(tilt != null ? { ["--flip-tilt"]: String(tilt) } : {}),
        }
      : {}),
  } as CSSProperties;
}

const Cube = memo(function Cube({
  tile,
  flipped,
  onCta,
  flipX,
  flipY,
  flipTilt: tilt,
}: CubeProps) {
  const box =
    tile.role === "number" && flipX != null && flipY != null
      ? cubeBox(tile, { x: flipX, y: flipY }, tilt)
      : cubeBox(tile);
  if (tile.role === "cta") {
    return (
      <button
        type="button"
        className="cube cube--cta"
        style={box}
        onPointerUp={onCta}
      >
        tinity me
      </button>
    );
  }
  if (tile.role === "occupancy") {
    return (
      <div className="cube cube--occupancy" style={box}>
        <div className="cube-face" />
      </div>
    );
  }
  return (
    <div
      className={flipped ? "cube cube--number is-flipped" : "cube cube--number"}
      style={box}
    >
      <div className="cube-tumble">
        <div className="cube-inner">
          <div className="cube-face cube-face--front" />
          <div className="cube-spine" aria-hidden="true" />
          <div className="cube-face cube-face--back" aria-hidden={!flipped}>
            {tile.id}
          </div>
        </div>
      </div>
    </div>
  );
}, (prev, next) => (
  prev.flipped === next.flipped &&
  prev.onCta === next.onCta &&
  prev.tile.id === next.tile.id &&
  prev.tile.role === next.tile.role &&
  prev.tile.x === next.tile.x &&
  prev.tile.y === next.tile.y &&
  prev.tile.size === next.tile.size &&
  prev.flipX === next.flipX &&
  prev.flipY === next.flipY &&
  prev.flipTilt === next.flipTilt
));

export function Stage() {
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>("loader");
  const [docReady, setDocReady] = useState(
    () => document.readyState !== "loading",
  );
  const [fieldReady, setFieldReady] = useState(false);
  const [flippedIds, setFlippedIds] = useState<Set<string>>(() => new Set());
  const [size, setSize] = useState(() => ({
    w: window.innerWidth,
    h: window.innerHeight,
  }));
  const stageRef = useRef<HTMLElement>(null);
  const fieldRef = useRef<ForceFieldHandle>(null);
  const timersRef = useRef<number[]>([]);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const tiles = useMemo(
    () => layoutTiles(size.w, size.h, dpr),
    [size.w, size.h, dpr],
  );

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const apply = () => {
      const rect = el.getBoundingClientRect();
      setSize({
        w: rect.width > 1 ? rect.width : window.innerWidth,
        h: rect.height > 1 ? rect.height : window.innerHeight,
      });
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (docReady) return;
    const mark = () => setDocReady(true);
    document.addEventListener("DOMContentLoaded", mark);
    window.addEventListener("load", mark);
    return () => {
      document.removeEventListener("DOMContentLoaded", mark);
      window.removeEventListener("load", mark);
    };
  }, [docReady]);

  useEffect(() => {
    if (phase === "loader" && docReady && fieldReady) {
      setPhase((current) => reduce(current, { type: "ready" }, reducedMotion));
    }
  }, [phase, docReady, fieldReady, reducedMotion]);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  const startFlips = useCallback(
    (origin: { x: number; y: number }, currentTiles: Tile[]) => {
      clearTimers();
      const targets = flipTargets(currentTiles);
      const minSide = Math.min(size.w, size.h) || 1;
      if (reducedMotion) {
        setFlippedIds(new Set(targets.map((tile) => tile.id)));
        return;
      }
      for (const tile of targets) {
        const delayMs =
          scheduledFlipDelay(tile, origin, RIPPLE_SPEED, minSide, false) * 1000;
        const id = window.setTimeout(() => {
          setFlippedIds((prev) => {
            const next = new Set(prev);
            next.add(tile.id);
            return next;
          });
        }, delayMs);
        timersRef.current.push(id);
      }
    },
    [clearTimers, reducedMotion, size.h, size.w],
  );

  const onCta = useCallback(() => {
    const current = phaseRef.current;
    const next = reduce(current, { type: "cta" }, reducedMotion);
    if (next === current) return;
    if (current === "idle") {
      const origin = ctaOrigin(tiles);
      if (!origin) return;
      fieldRef.current?.impact(origin.x, origin.y);
      setPhase(next);
      startFlips(origin, tiles);
      return;
    }
    clearTimers();
    setFlippedIds(new Set());
    setPhase(next);
  }, [clearTimers, reducedMotion, startFlips, tiles]);

  const origin = ctaOrigin(tiles);

  return (
    <main className="stage" ref={stageRef}>
      <div className="stage-slot">
        <ForceFieldAdapter
          ref={fieldRef}
          onReady={() => setFieldReady(true)}
        />
      </div>
      <div className="overlay">
        {phase === "loader"
          ? null
          : tiles.map((tile) => {
              const axis =
                tile.role === "number" && origin
                  ? flipAxis(tile, origin)
                  : undefined;
              const tilt =
                tile.role === "number" && origin
                  ? flipTilt(tile, origin)
                  : undefined;
              return (
                <Cube
                  key={tile.id}
                  tile={tile}
                  flipped={tile.role === "number" && flippedIds.has(tile.id)}
                  onCta={tile.role === "cta" ? onCta : undefined}
                  flipX={axis?.x}
                  flipY={axis?.y}
                  flipTilt={tilt}
                />
              );
            })}
      </div>
    </main>
  );
}
