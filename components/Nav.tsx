"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/notebooks", label: "Notebooks" },
  { href: "/geophysics", label: "Geophysics Lab" },
  { href: "/geotech", label: "Geotech Lab" },
  { href: "/interpret", label: "Interpretation" },
  { href: "/report", label: "Report" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="no-print sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-3 overflow-x-auto">
        <Link href="/" className="mr-4 flex shrink-0 items-center gap-2">
          <EarthMark />
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
            GeoSurvey<span className="text-accent"> Lab</span>
          </span>
        </Link>
        <div className="flex gap-1">
          {LINKS.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:bg-panel-2 hover:text-fg"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function EarthMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
      <defs>
        <clipPath id="nav-earth-clip">
          <circle cx="13" cy="13" r="11" />
        </clipPath>
      </defs>
      <circle cx="13" cy="13" r="11" fill="#16213a" stroke="#f5b942" strokeWidth="1.5" />
      <g clipPath="url(#nav-earth-clip)">
        <rect x="0" y="13" width="26" height="4" fill="#d9b36c" opacity="0.9" />
        <rect x="0" y="17" width="26" height="4" fill="#8c6f56" opacity="0.9" />
        <rect x="0" y="21" width="26" height="5" fill="#635f5c" opacity="0.9" />
        <path d="M2 13 Q7 9 13 12 T24 11" stroke="#4fd1c5" strokeWidth="1.4" fill="none" />
      </g>
    </svg>
  );
}
