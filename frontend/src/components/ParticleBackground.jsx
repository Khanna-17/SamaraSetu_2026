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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(110,168,255,0.12),transparent_35%),radial-gradient(circle_at_82%_0%,rgba(59,130,246,0.16),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(15,23,42,0.3),transparent_42%)]" />
      {dots.map((dot) => (
        <span
          key={dot.id}
          className="absolute h-1.5 w-1.5 animate-float rounded-full bg-sky-300/45 shadow-[0_0_18px_rgba(110,168,255,0.5)]"
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
