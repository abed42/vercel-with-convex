// YC hackathon logomark — a rounded-capsule outline. Uses currentColor so it
// inherits the surrounding text color (white on the dark board).
export function Logomark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="15.5"
        width="39"
        height="17"
        rx="8.5"
        stroke="currentColor"
        strokeWidth="5"
        opacity="0.84"
      />
    </svg>
  );
}
