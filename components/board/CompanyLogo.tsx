// Company logo with initials fallback. Logos come from Orange Slice enrichment
// (Deal.logo); seeded/fake deals fall back to an initials tile. `className`
// controls size + rounding (e.g. "h-9 w-9 rounded-lg text-xs").

export function CompanyLogo({
  logo,
  initials,
  className = "",
}: {
  logo?: string;
  initials: string;
  className?: string;
}) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt=""
        referrerPolicy="no-referrer"
        className={`shrink-0 bg-white object-contain p-0.5 ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-muted font-bold text-foreground ${className}`}
    >
      {initials}
    </div>
  );
}
