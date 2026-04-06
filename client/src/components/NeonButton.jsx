export default function NeonButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`rounded-2xl border border-cyan-200/60 bg-cyan-300/10 px-5 py-2.5 font-semibold tracking-wide text-cyan-100 transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-300/20 hover:shadow-[0_0_24px_rgba(34,211,238,0.7)] ${className}`}
    >
      {children}
    </button>
  );
}
