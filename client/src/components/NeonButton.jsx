export default function NeonButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`rounded-2xl border border-amber-300/55 bg-amber-300/10 px-5 py-2.5 font-semibold tracking-wide text-amber-100 transition duration-300 hover:-translate-y-0.5 hover:bg-amber-300/18 hover:shadow-[0_0_24px_rgba(212,175,55,0.32)] ${className}`}
    >
      {children}
    </button>
  );
}
