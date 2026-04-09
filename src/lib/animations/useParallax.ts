'use client';

import { useRef, useEffect, useState } from 'react';

export function useFloat(options: {
  amplitude?: number;
  duration?: number;
  delay?: number;
} = {}) {
  const { amplitude = 10, duration = 3000, delay = 0 } = options;

  return {
    animation: `float-custom ${duration}ms ease-in-out ${delay}ms infinite`,
    '--float-amplitude': `${amplitude}px`,
  } as React.CSSProperties;
}

export function useHoverSpring() {
  const [isHovered, setIsHovered] = useState(false);

  const style: React.CSSProperties = {
    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  };

  const bind = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  return { style, bind };
}

export function useCountUp(end: number, duration: number = 2000) {
  const [inView, setInView] = useState(false);
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    const startTime = performance.now();
    let animFrame: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * end));

      if (progress < 1) {
        animFrame = requestAnimationFrame(animate);
      }
    };

    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [inView, end, duration]);

  return { ref, value, inView };
}
