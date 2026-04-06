export default function GlassCard({ children, className = "" }) {
  return (
    <section className={`rounded-3xl border border-cyan-300/30 bg-slate-900/60 p-6 shadow-[0_0_45px_rgba(34,211,238,0.15)] backdrop-blur-xl ${className}`}>
      {children}
    </section>
  );
}
