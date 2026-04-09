'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment, Center } from '@react-three/drei';
import * as THREE from 'three';
import Image from 'next/image';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Container } from '@/components/ui';

type StaffMember = {
  id: string;
  slug: string;
  image_url: string | null;
  name: string;
  title: string;
};

/**
 * ImplantModel
 * -------------
 * Scroll-driven model. Mirrors the iPhone scroll-rotate pattern:
 *  - parent computes a 0..1 `progress` from window scrollY (rAF-throttled)
 *  - that prop is written into a ref (no React state in the hot path)
 *  - useFrame eases currentProgress toward targetProgress with a lerp
 *  - rotation is written directly to the Three.js group each frame
 *  - canvas runs in `frameloop="demand"`; we call invalidate() while moving
 *
 * Why useFrame instead of useEffect: an effect-driven version goes through
 * state → render → commit → next paint, which adds 2–3 frames of latency you
 * can feel as drag while scrolling. useFrame writes straight to the object
 * with no React reconciliation, and the lerp smooths what's left.
 */
function ImplantModel({ progress }: { progress: number }) {
  const { scene } = useGLTF('/models/implant.glb');
  const groupRef = useRef<THREE.Group>(null);
  const targetProgress = useRef(0);
  const currentProgress = useRef(0);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    targetProgress.current = progress;
    invalidate();
  }, [progress, invalidate]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Smoothness knob: lower = slower / more smoothing. ~6 frames to catch up.
    currentProgress.current = THREE.MathUtils.lerp(
      currentProgress.current,
      targetProgress.current,
      0.08
    );
    const inv = 1 - currentProgress.current;

    // Scroll-driven base rotation: progress 0 = tilted, progress 1 = face-on.
    groupRef.current.rotation.x = inv * Math.PI * 0.33;
    groupRef.current.rotation.z = inv * Math.PI * -0.08;

    // Continuous spin around Y, plus the scroll offset on top.
    groupRef.current.rotation.y += delta * 0.15;

    // Always schedule the next frame so the spin keeps going.
    invalidate();
  });

  return (
    <Center>
      <group ref={groupRef}>
        <primitive object={scene} scale={1.15} />
      </group>
    </Center>
  );
}

export function Hero() {
  const t = useTranslations('hero');
  const locale = useLocale();

  // r3f's Canvas mutates the DOM on init, so its SSR output never matches
  // the client tree. Mount it only after hydration to silence the mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Staff carousel — scroll progress as a motion value for spring smoothing.
  const progressMV = useMotionValue(0);
  const smoothProgress = useSpring(progressMV, { stiffness: 80, damping: 25, restDelta: 0.001 });

  // Hard-coded for now — DB call replaced so the carousel works without
  // a live Postgres connection (e.g. on Vercel before envs are wired).
  const STAFF_MN: StaffMember[] = [
    { id: '1', slug: 'dr-sonin-batsanaa', image_url: '/images/staff/sonin-batsanaa.png', name: 'Сонин Батсанаа', title: 'Нүүр амны мэс заслын их эмч, Согог заслын их эмч' },
    { id: '2', slug: 'dr-onon-erdenebat', image_url: '/images/staff/onon-erdenebat.png', name: 'Онон Эрдэнэбат', title: 'Нүүр амны их эмч' },
    { id: '3', slug: 'dr-ganbaatar-erdenezorig', image_url: '/images/staff/ganbaatar-erdenezorig.png', name: 'Ганбаатар Эрдэнэзориг', title: 'Нүүр амны их эмч' },
    { id: '4', slug: 'dr-ganbayar-khongorzul', image_url: '/images/staff/ganbayar-khongorzul.png', name: 'Ганбаяр Хонгорзул', title: 'Нүүр амны их эмч' },
    { id: '5', slug: 'dr-ganbold-tsenguun', image_url: '/images/staff/ganbold-tsenguun.png', name: 'Ганболд Цэнгүүн', title: 'Нүүр амны их эмч' },
  ];
  const STAFF_EN: StaffMember[] = [
    { id: '1', slug: 'dr-sonin-batsanaa', image_url: '/images/staff/sonin-batsanaa.png', name: 'Sonin Batsanaa', title: 'Oral Surgeon & Orthodontist' },
    { id: '2', slug: 'dr-onon-erdenebat', image_url: '/images/staff/onon-erdenebat.png', name: 'Onon Erdenebat', title: 'General Dentist' },
    { id: '3', slug: 'dr-ganbaatar-erdenezorig', image_url: '/images/staff/ganbaatar-erdenezorig.png', name: 'Ganbaatar Erdenezorig', title: 'General Dentist' },
    { id: '4', slug: 'dr-ganbayar-khongorzul', image_url: '/images/staff/ganbayar-khongorzul.png', name: 'Ganbayar Khongorzul', title: 'General Dentist' },
    { id: '5', slug: 'dr-ganbold-tsenguun', image_url: '/images/staff/ganbold-tsenguun.png', name: 'Ganbold Tsenguun', title: 'General Dentist' },
  ];
  const staff = locale === 'en' ? STAFF_EN : STAFF_MN;

  // Single rAF-throttled scroll listener → 0..1 progress for the 3D model.
  // maxScroll mirrors the iPhone setup: ~90vh on desktop, 600px on mobile.
  const [modelProgress, setModelProgress] = useState(0);
  useEffect(() => {
    let ticking = false;
    const update = () => {
      // Lock the hero in view until rotation completes: progress reaches 1
      // exactly when the sticky wrapper releases (parent is h-[200vh] → 100vh
      // of pinned scroll = one full innerHeight).
      const isDesktop = window.innerWidth >= 1024;
      const maxScroll = isDesktop ? window.innerHeight : 600;
      const p = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
      setModelProgress(p);
      progressMV.set(p);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
    };
  }, [progressMV]);

  // Derived translate for the staff strip — step matches card width + gap,
  // and we only slide the *hidden* portion so the last card lands flush.
  const [cardStep, setCardStep] = useState(272);
  const [containerWidth, setContainerWidth] = useState(340);
  useEffect(() => {
    const updateSizes = () => {
      const w = window.innerWidth;
      const isLg = w >= 1024;
      const isMd = w >= 768;
      setCardStep(isLg ? 272 : isMd ? 232 : 172); // lg/md/mobile: 260/220/160 + 12 gap
      setContainerWidth(isMd ? Math.min(340, w * 0.28) : w - 32);
    };
    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, []);

  const carouselX = useTransform(smoothProgress, (p) => {
    const totalWidth = staff.length * cardStep;
    const maxTranslate = Math.max(0, totalWidth - containerWidth);
    return -p * maxTranslate;
  });

  return (
    <div className="relative h-[200vh]">
      <section
        id="hero"
        className="sticky top-0 left-0 right-0 h-screen overflow-hidden flex items-center bg-white"
      >
        {/* Editorial grid dividers */}
        <div className="hidden md:block pointer-events-none absolute inset-0 z-20">
          {/* Vertical divider */}
          <div className="absolute top-0 bottom-0 left-2/3 w-px bg-earth-200" />
          {/* Horizontal divider near the bottom */}
          <div className="absolute left-0 right-0 bottom-20 h-px bg-earth-200" />
        </div>
        {/* 3D Model — centered, full-bleed, sits behind text */}
        <div className="absolute inset-0 pointer-events-none z-30">
          {mounted && (
            <Canvas
              frameloop="demand"
              camera={{ position: [0, 0, 6], fov: 45, near: 0.1, far: 100 }}
              gl={{ toneMappingExposure: 1.2 }}
            >
              <Environment preset="studio" />
              <ambientLight intensity={0.3} />
              <directionalLight position={[5, 5, 5]} intensity={0.8} />
              <Suspense fallback={null}>
                <ImplantModel progress={modelProgress} />
              </Suspense>
            </Canvas>
          )}
        </div>

        <div className="relative z-10 w-full h-full">
          <Container className="h-full">
            <div className="relative h-full">
              {/* Top-left — short description */}
              <p className="absolute top-28 left-0 max-w-60 text-earth-600 text-sm sm:text-base font-medium leading-snug">
                {t('shortDescription')}
              </p>

              {/* Bottom-left — big headline */}
              <h1
                className="absolute bottom-24 left-0 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-medium leading-[0.9] whitespace-pre-line"
                style={{ fontFamily: 'var(--font-exo2)' }}
              >
                <span className="text-primary-600 block">{t('titleLine1')}</span>
                <span className="text-accent-500 block">{t('titleLine2')}</span>
              </h1>

            </div>
          </Container>
        </div>

        {/* Bottom-right — staff carousel: lives outside Container so it can
            bleed all the way to the right edge of the viewport, ignoring the
            page padding. */}
        {staff.length > 0 && (
          <div
            className="absolute bottom-8 md:bottom-24 left-0 md:left-2/3 right-0 z-10 pointer-events-auto overflow-hidden pl-4 md:pl-6 lg:pl-10"
          >
            <motion.div
              className="flex items-stretch gap-3"
              style={{ x: carouselX }}
            >
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="relative shrink-0 w-[160px] h-[220px] md:w-[220px] md:h-[300px] lg:w-[260px] lg:h-[380px] rounded-2xl overflow-hidden bg-primary-900 shadow-xl border border-earth-200"
                >
                  {member.image_url ? (
                    <Image
                      src={member.image_url}
                      alt={member.name}
                      fill
                      sizes="260px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-primary-700 to-primary-900" />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/80 to-transparent">
                    <p className="text-white font-semibold text-sm lg:text-base leading-tight">
                      {member.name}
                    </p>
                    <p className="text-white/70 text-xs mt-0.5">{member.title}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        )}
      </section>
    </div>
  );
}

useGLTF.preload('/models/implant.glb');
