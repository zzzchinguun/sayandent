'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { staggerContainer, staggerContainerFast } from '@/lib/animations/variants';

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  fast?: boolean;
  once?: boolean;
  amount?: number;
  as?: 'div' | 'ul' | 'section' | 'article';
}

export function StaggerContainer({
  children,
  className,
  fast = false,
  once = true,
  amount = 0.2,
  as = 'div',
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount });

  const Component = motion[as] as typeof motion.div;

  return (
    <Component
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fast ? staggerContainerFast : staggerContainer}
      className={cn(className)}
    >
      {children}
    </Component>
  );
}
