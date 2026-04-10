'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface ScrollRevealLinkedProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
  offset?: number;
}

export function ScrollRevealLinked({
  children,
  direction = 'up',
  className,
  offset = 60,
}: ScrollRevealLinkedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end 0.7'],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const directionMap = {
    up: { y: useTransform(scrollYProgress, [0, 1], [offset, 0]) },
    down: { y: useTransform(scrollYProgress, [0, 1], [-offset, 0]) },
    left: { x: useTransform(scrollYProgress, [0, 1], [-offset, 0]) },
    right: { x: useTransform(scrollYProgress, [0, 1], [offset, 0]) },
    none: {},
  };

  return (
    <motion.div
      ref={ref}
      style={{ opacity, ...directionMap[direction] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
