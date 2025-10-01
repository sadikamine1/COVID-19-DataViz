import React, { useEffect, useRef, useState } from 'react';

type Props = {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  rootMargin?: string;
  minDelayMs?: number; // optional minimum delay before mounting, to let main thread breathe
};

// Mounts children only when the container enters the viewport (or after a small idle),
// useful to defer heavy chunks like Chart.js.
export const LazyVisible: React.FC<Props> = ({ children, placeholder = null, rootMargin = '200px', minDelayMs = 0 }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (shouldMount) return;
    const node = ref.current;
    if (!node) return;

    let timeoutId: number | undefined;
    let idleId: number | undefined;
    const onVisible = () => {
      if (minDelayMs > 0) {
        timeoutId = window.setTimeout(() => setShouldMount(true), minDelayMs);
      } else if ('requestIdleCallback' in window) {
        // @ts-ignore
        idleId = window.requestIdleCallback(() => setShouldMount(true), { timeout: 500 });
      } else {
        setShouldMount(true);
      }
    };

    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e && (e.isIntersecting || e.intersectionRatio > 0)) {
        onVisible();
        io.disconnect();
      }
    }, { root: null, rootMargin, threshold: 0 });

    io.observe(node);
    return () => {
      io.disconnect();
      if (timeoutId) window.clearTimeout(timeoutId);
      if (idleId && 'cancelIdleCallback' in window) {
        // @ts-ignore
        window.cancelIdleCallback(idleId);
      }
    };
  }, [shouldMount, rootMargin, minDelayMs]);

  return <div ref={ref}>{shouldMount ? children : placeholder}</div>;
};

export default LazyVisible;
