export default function TimerBar({ elapsed, expectedSeconds = 900 }) {
  const ratio = Math.min(1, elapsed / expectedSeconds);
  const progress = Math.round(ratio * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-amber-100/80">
        <span>Mission Timer</span>
        <span>{elapsed}s</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-stone-950">
        <div
          className="h-full bg-gradient-to-r from-red-900 via-amber-700 to-amber-300 shadow-[0_0_18px_rgba(212,175,55,0.35)] transition-all"
          style={{ width: `${Math.max(progress, 2)}%` }}
        />
      </div>
    </div>
  );
}
