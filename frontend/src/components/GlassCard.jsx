export default function GlassCard({ children, className = "" }) {
  return (
    <section className={`rounded-[28px] border border-sky-200/12 bg-[rgba(10,18,30,0.9)] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl ${className}`}>
      {children}
    </section>
  );
}
