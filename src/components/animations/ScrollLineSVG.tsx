'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface ScrollLineSVGProps {
  className?: string;
}

export function ScrollLineSVG({ className }: ScrollLineSVGProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.2'],
  });

  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const smoothPathLength = useSpring(pathLength, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div ref={containerRef} className={`absolute inset-0 pointer-events-none z-0 hidden sm:block overflow-hidden ${className || ''}`}>
      <svg
        className="absolute left-1/2 -translate-x-1/2 h-full"
        width="200"
        viewBox="0 0 200 1000"
        preserveAspectRatio="xMidYMin slice"
        fill="none"
      >
        <path
          d="M100 0 C60 100, 140 200, 100 300 C60 400, 140 500, 100 600 C60 700, 140 800, 100 1000"
          stroke="var(--color-primary-200)"
          strokeWidth="2"
          opacity="0.4"
          strokeDasharray="8 8"
        />
        <motion.path
          d="M100 0 C60 100, 140 200, 100 300 C60 400, 140 500, 100 600 C60 700, 140 800, 100 1000"
          stroke="var(--color-primary-400)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ pathLength: smoothPathLength }}
          opacity="0.6"
        />
      </svg>
    </div>
  );
}
