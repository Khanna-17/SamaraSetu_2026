export default function GlassCard({ children, className = "" }) {
  return (
    <section className={`rounded-3xl border border-amber-300/25 bg-[rgba(22,12,6,0.78)] p-6 shadow-[0_0_45px_rgba(159,29,29,0.16)] backdrop-blur-xl ${className}`}>
      {children}
    </section>
  );
}
