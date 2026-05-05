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
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
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

// ── Morphing Blob Background ───────────────────────────────────────────
export function MorphingBlob({
  className = '',
  color = 'rgba(221, 219, 202, 0.3)',
  size = 300,
}: {
  className?: string;
  color?: string;
  size?: number;
}) {
  return (
    <div
      className={`absolute morph-blob pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: 'blur(40px)',
        willChange: 'border-radius',
      }}
    />
  );
}

// ── Wave Loader ─────────────────────────────────────────────────────────
export function WaveLoader({
  barCount = 5,
  className = '',
  height = 24,
}: {
  barCount?: number;
  className?: string;
  height?: number;
}) {
  return (
    <div className={`wave-loader ${className}`} style={{ height }}>
      {Array.from({ length: barCount }, (_, i) => (
        <span key={i} style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}

// ── Spotlight Card ─────────────────────────────────────────────────────
export function SpotlightCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - 100;
    const y = e.clientY - rect.top - 100;
    el.style.setProperty('--spotlight-x', `${x}px`);
    el.style.setProperty('--spotlight-y', `${y}px`);
    const before = el.querySelector('.spotlight-inner') as HTMLElement | null;
    if (before) {
      before.style.left = `${x}px`;
      before.style.top = `${y}px`;
      before.style.opacity = '1';
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    const before = el.querySelector('.spotlight-inner') as HTMLElement | null;
    if (before) before.style.opacity = '0';
  }, []);

  return (
    <div
      ref={cardRef}
      className={`spotlight-card relative overflow-hidden rounded-2xl ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="spotlight-inner absolute w-[200px] h-[200px] rounded-full pointer-events-none transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle, rgba(12,11,11,0.08) 0%, transparent 70%)',
          opacity: 0,
          transform: 'translate(0, 0)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ── Marquee Ticker ─────────────────────────────────────────────────────
export function MarqueeTicker({
  items,
  speed = 30,
  className = '',
}: {
  items: string[];
  speed?: number;
  className?: string;
}) {
  const doubled = [...items, ...items];
  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className="marquee-track"
        style={{ animationDuration: `${speed}s` }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="text-sm text-soft whitespace-nowrap flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-soft/40 flex-shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Animated Value Change ──────────────────────────────────────────────
export function AnimatedValue({
  value,
  className = '',
}: {
  value: string | number;
  className?: string;
}) {
  return (
    <span key={String(value)} className={`inline-block tabular-nums elastic-pop ${className}`}>
      {value}
    </span>
  );
}

// ── Sound Wave Visualizer ──────────────────────────────────────────────
export function SoundWave({
  isPlaying = false,
  barCount = 20,
  className = '',
}: {
  isPlaying?: boolean;
  barCount?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-[2px] h-6 ${className}`}>
      {Array.from({ length: barCount }, (_, i) => (
        <motion.div
          key={i}
          className="w-[2px] rounded-full bg-foreground/40"
          animate={
            isPlaying
              ? {
                  height: [4, 12 + (i % 4) * 4, 4],
                  opacity: [0.3, 0.8, 0.3],
                }
              : { height: 4, opacity: 0.2 }
          }
          transition={
            isPlaying
              ? {
                  duration: 0.8 + (i % 3) * 0.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.05,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

// ── Countdown Ring ──────────────────────────────────────────────────────
export function CountdownRing({
  seconds,
  maxSeconds = 60,
  size = 40,
  strokeWidth = 3,
  color = '#22c55e',
  onComplete,
}: {
  seconds: number;
  maxSeconds?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  onComplete?: () => void;
}) {
  const prevSec = useRef(seconds);

  useEffect(() => {
    if (prevSec.current > 0 && seconds === 0 && onComplete) {
      onComplete();
    }
    prevSec.current = seconds;
  }, [seconds, onComplete]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = seconds / maxSeconds;
  const offset = circumference * (1 - progress);

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
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
        />
      </svg>
      <span className="absolute text-[10px] font-bold tabular-nums text-foreground">{seconds}s</span>
    </div>
  );
}

// ── Status Grid (Live Matrix Visualization) ────────────────────────────
export function StatusGrid({
  cells,
  activeCount,
  className = '',
}: {
  cells: number;
  activeCount: number;
  className?: string;
}) {
  return (
    <div className={`grid gap-1 ${className}`} style={{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(cells))}, 8px)` }}>
      {Array.from({ length: cells }, (_, i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          animate={{
            backgroundColor: i < activeCount ? 'var(--foreground)' : 'var(--border)',
            scale: i < activeCount ? [1, 1.2, 1] : 0.8,
            opacity: i < activeCount ? 1 : 0.3,
          }}
          transition={{
            duration: 1.5,
            repeat: i < activeCount ? Infinity : 0,
            delay: i * 0.03,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ── Glowing Line Separator ─────────────────────────────────────────────
export function GlowingLine({ className = '' }: { className?: string }) {
  return (
    <div className={`relative h-px w-full overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      <motion.div
        className="absolute top-0 h-full w-8 bg-gradient-to-r from-transparent via-foreground/30 to-transparent"
        animate={{ x: ['-100%', '400%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// ── Parallax Tilt Card ─────────────────────────────────────────────────
export function ParallaxTilt({
  children,
  className = '',
  intensity = 6,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = cardRef.current;
      const inner = innerRef.current;
      if (!el || !inner) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * intensity;
      const rotateY = (x - 0.5) * intensity;
      inner.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    },
    [intensity]
  );

  const handleMouseLeave = useCallback(() => {
    const inner = innerRef.current;
    if (!inner) return;
    inner.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  }, []);

  return (
    <div ref={cardRef} className={className} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <div
        ref={innerRef}
        className="transition-transform duration-300 ease-out"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Live Pulse Dot ─────────────────────────────────────────────────────
export function LivePulseDot({
  color = 'bg-green-500',
  size = 8,
  className = '',
}: {
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <span className={`absolute inline-flex h-full w-full rounded-full ${color} animate-ping opacity-40`} />
      <span className={`relative inline-flex rounded-full ${color}`} style={{ width: size * 0.6, height: size * 0.6 }} />
    </div>
  );
}

// ── Number Morph ───────────────────────────────────────────────────────
export function NumberMorph({
  value,
  className = '',
}: {
  value: number;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={value}
        className={`inline-block tabular-nums ${className}`}
        initial={{ y: 16, opacity: 0, filter: 'blur(4px)' }}
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        exit={{ y: -16, opacity: 0, filter: 'blur(4px)' }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

// ── Skeleton Card ──────────────────────────────────────────────────────
export function SkeletonCard({
  className = '',
  lines = 3,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={`rounded-2xl p-4 space-y-3 ${className}`}>
      <div className="skeleton-shimmer h-4 w-2/3 rounded-lg bg-muted animate-pulse" />
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="skeleton-shimmer h-3 rounded-lg bg-muted animate-pulse"
          style={{ width: `${65 + (i * 10) % 35}%` }}
        />
      ))}
    </div>
  );
}

// ── Elastic Button ─────────────────────────────────────────────────────
export function ElasticButton({
  children,
  onClick,
  className = '',
  variant = 'default',
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'accent' | 'destructive';
}) {
  const colorMap = {
    default: 'bg-foreground text-background',
    accent: 'bg-cashew text-foreground',
    destructive: 'bg-red-500 text-white',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ripple-container ${colorMap[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
