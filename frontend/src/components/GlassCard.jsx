export default function GlassCard({ children, className = "" }) {
  return (
    <section className={`rounded-3xl border border-sky-300/20 bg-[rgba(8,18,32,0.82)] p-6 shadow-[0_0_45px_rgba(37,99,235,0.18)] backdrop-blur-xl ${className}`}>
      {children}
    </section>
  );
}
