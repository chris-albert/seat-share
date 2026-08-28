/** Ticket-stub mark. Shared by the in-app logo and the generated apple-icon. */
export const TICKET_PATH =
  "M16 18H48Q52 18 52 22V28A4 4 0 0 0 52 36V42Q52 46 48 46H16Q12 46 12 42V36A4 4 0 0 0 12 28V22Q12 18 16 18Z";

export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff7a3d" />
          <stop offset="1" stopColor="#e3450d" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#logo-bg)" />
      <path d={TICKET_PATH} fill="#fff" />
      <path d="M42 23V41" stroke="#e3450d" strokeWidth="2" strokeLinecap="round" strokeDasharray="0.5 4" />
    </svg>
  );
}
