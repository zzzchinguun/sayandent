'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface ParallaxLayerProps {
  children: React.ReactNode;
  speed?: number;
  smooth?: boolean;
  className?: string;
}

export function ParallaxLayer({
  children,
  speed = 0.3,
  smooth = false,
  className,
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const range = speed * 100;
  const rawY = useTransform(scrollYProgress, [0, 1], [-range, range]);
  const smoothY = useSpring(rawY, { stiffness: 100, damping: 30, restDelta: 0.5 });

  return (
    <motion.div
      ref={ref}
      style={{ y: smooth ? smoothY : rawY }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
