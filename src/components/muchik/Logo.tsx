export function MuchikLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
        <defs>
          <linearGradient id="mk-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.32 0.14 330)" />
            <stop offset="60%" stopColor="oklch(0.58 0.22 350)" />
            <stop offset="100%" stopColor="oklch(0.72 0.16 200)" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="22" fill="url(#mk-g)" />
        <path
          d="M24 10c7.7 0 14 6.3 14 14s-6.3 14-14 14c-5 0-9-3-9-7s3-6 6-6 5 2 5 4"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-display text-2xl font-bold italic tracking-tight text-primary">
        MUCHIK
      </span>
    </div>
  );
}