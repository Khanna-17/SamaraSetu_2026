export default function TimerBar({ elapsed, expectedSeconds = 900 }) {
  const ratio = Math.min(1, elapsed / expectedSeconds);
  const progress = Math.round(ratio * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-300">
        <span>Mission Timer</span>
        <span>{elapsed}s</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-950/90">
        <div
          className="h-full bg-gradient-to-r from-slate-700 via-sky-700 to-cyan-300 transition-all"
          style={{ width: `${Math.max(progress, 2)}%` }}
        />
      </div>
    </div>
  );
}
