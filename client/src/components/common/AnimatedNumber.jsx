import { useState, useEffect, useRef } from 'react';

/**
 * Count-up animation for numbers. Uses requestAnimationFrame for smooth 60fps.
 * @param {{ value: number, duration?: number, formatter?: (n: number) => string, className?: string }} props
 */
const AnimatedNumber = ({ value, duration = 800, formatter, className = '' }) => {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  const raf = useRef(null);

  useEffect(() => {
    const start = prev.current;
    const diff = value - start;
    if (diff === 0) return;

    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setDisplay(current);

      if (progress < 1) {
        raf.current = requestAnimationFrame(step);
      } else {
        prev.current = value;
      }
    };
    raf.current = requestAnimationFrame(step);

    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, duration]);

  return (
    <span className={className}>
      {formatter ? formatter(display) : Math.round(display).toLocaleString()}
    </span>
  );
};

export default AnimatedNumber;
