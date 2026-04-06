import { useMemo } from "react";

export default function ParticleBackground() {
  const dots = useMemo(
    () =>
      Array.from({ length: 40 }, (_, idx) => ({
        id: idx,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 6}s`,
        duration: `${6 + Math.random() * 8}s`
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(13,246,255,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,59,171,0.12),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(47,255,152,0.08),transparent_45%)]" />
      {dots.map((dot) => (
        <span
          key={dot.id}
          className="absolute h-1.5 w-1.5 animate-float rounded-full bg-cyan-300/50 shadow-[0_0_18px_rgba(34,211,238,0.9)]"
          style={{
            left: dot.left,
            top: dot.top,
            animationDelay: dot.delay,
            animationDuration: dot.duration
          }}
        />
      ))}
    </div>
  );
}
