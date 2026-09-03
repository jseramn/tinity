import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

type RevealSectionProps = Omit<ComponentPropsWithoutRef<"section">, "children"> & {
  children: ReactNode;
};

export function RevealSection({ children, className = "", ...props }: RevealSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const classes = ["section", className, revealed ? "section--revealed" : "section--pending"]
    .filter(Boolean)
    .join(" ");

  return (
    <section ref={ref} className={classes} {...props}>
      {children}
    </section>
  );
}
