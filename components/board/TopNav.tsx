"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRODUCT } from "@/lib/peitho/config";
import { Ticker } from "./Ticker";

export function TopNav() {
  const path = usePathname();
  const tabs = [
    { href: "/", label: "Live board" },
    { href: "/ai-hackathon", label: "Cold open" },
  ];
  return (
    <div className="sticky top-0 z-10 bg-card/70 backdrop-blur">
      <Ticker />
      <div className="mx-auto flex max-w-6xl items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <Link href="/" className="text-sm font-bold tracking-tight text-foreground">
          {PRODUCT.name}
          <span className="ml-2 hidden text-xs font-normal text-muted-foreground sm:inline">
            {PRODUCT.tagline}
          </span>
        </Link>
        <div className="flex gap-1 rounded-full border border-border bg-card p-0.5 text-xs">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`rounded-full px-3 py-1.5 font-medium transition ${
                path === t.href
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
