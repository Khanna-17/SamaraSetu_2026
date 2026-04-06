export default function NeonButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`rounded-2xl border border-sky-300/45 bg-sky-300/10 px-5 py-2.5 font-semibold tracking-wide text-sky-100 transition duration-300 hover:-translate-y-0.5 hover:bg-sky-300/16 hover:shadow-[0_0_24px_rgba(110,168,255,0.32)] ${className}`}
    >
      {children}
    </button>
  );
}
