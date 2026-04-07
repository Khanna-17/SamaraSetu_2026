export default function NeonButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`rounded-2xl border border-sky-300/30 bg-sky-400/8 px-5 py-2.5 font-semibold tracking-wide text-sky-100 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/55 hover:bg-cyan-300/14 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}
