"use client";

import { useState } from "react";

// Company logo with initials fallback. Logos come from Orange Slice enrichment
// or Clearbit (Deal.logo); if the image is missing OR fails to load (404), it
// falls back to an initials tile instead of a broken-image icon. `className`
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
  const [failed, setFailed] = useState(false);

  if (logo && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
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
