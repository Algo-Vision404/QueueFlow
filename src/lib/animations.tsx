'use client';

import { useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Animated Number Counter ────────────────────────────────────────────
export function useCountUp(
  target: number,
  duration: number = 1200,
  startOnMount: boolean = true
) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    if (!startOnMount) return;

    const startValue = 0;
    const endValue = target;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(startValue + (endValue - startValue) * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    startTimeRef.current = undefined;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, startOnMount]);

  return value;
}

// ── Scroll Reveal Hook ─────────────────────────────────────────────────
export function useScrollReveal(threshold: number = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

// ── Magnetic Tilt Hook ─────────────────────────────────────────────────
export function useMagneticTilt(intensity: number = 8) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -intensity;
      const rotateY = ((x - centerX) / centerX) * intensity;

      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
    },
    [intensity]
  );

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
  }, []);

  return { ref, handleMouseMove, handleMouseLeave };
}

// ── Reveal Wrapper Component ───────────────────────────────────────────
export function RevealOnScroll({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, isVisible } = useScrollReveal(0.15);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ── Stagger Container ──────────────────────────────────────────────────
export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.08,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, cubicBezier: [0.16, 1, 0.3, 1] },
  },
};

// ── Animated Counter Display ───────────────────────────────────────────
export function AnimatedCounter({
  value,
  duration = 1000,
  className = '',
  prefix = '',
  suffix = '',
}: {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}) {
  const count = useCountUp(value, duration);

  return (
    <span className={className}>
      {prefix}{count}{suffix}
    </span>
  );
}

// ── Sparkline (tiny inline chart) ──────────────────────────────────────
export function Sparkline({
  data,
  width = 80,
  height = 28,
  color = 'var(--foreground)',
  fillColor = 'var(--foreground)',
  className = '',
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  className?: string;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = padding + (1 - (val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const fillPath = `M${padding},${height} L${points.split(' ').join(' L')} L${width - padding},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      fill="none"
    >
      <path
        d={fillPath}
        fill={fillColor}
        opacity="0.08"
      />
      <polyline
        points={points}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Confetti Burst Effect ──────────────────────────────────────────────
export function ConfettiBurst({
  trigger,
  x = 0,
  y = 0,
}: {
  trigger: number;
  x?: number;
  y?: number;
}) {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    color: ['#0c0b0b', '#979585', '#dddbca', '#b8a88a', '#e9e6d7'][i % 5],
    angle: (i * 30) * (Math.PI / 180),
    speed: 40 + Math.random() * 60,
    size: 4 + Math.random() * 4,
  }));

  return (
    <AnimatePresence>
      {trigger > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          {particles.map((p) => {
            const endX = x + Math.cos(p.angle) * p.speed;
            const endY = y + Math.sin(p.angle) * p.speed + 40;
            return (
              <motion.div
                key={p.id}
                initial={{ x, y, scale: 1, opacity: 1, rotate: 0 }}
                animate={{ x: endX, y: endY, scale: 0, opacity: 0, rotate: 720 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="fixed w-2 h-2 rounded-sm"
                style={{ backgroundColor: p.color, width: p.size, height: p.size }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Progress Ring (circular progress) ───────────────────────────────────
export function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 3,
  color = 'var(--foreground)',
  children,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Typewriter Text ────────────────────────────────────────────────────
export function TypewriterText({
  text,
  speed = 50,
  className = '',
  showCursor = true,
}: {
  text: string;
  speed?: number;
  className?: string;
  showCursor?: boolean;
}) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayed('');

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayed(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span className={`${className} ${showCursor ? 'typewriter-cursor' : ''}`}>
      {displayed}
    </span>
  );
}
