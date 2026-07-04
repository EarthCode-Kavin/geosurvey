"use client";

import { ReactNode, useState } from "react";

/* ------------------------------------------------------------------ */

export function Slider({
  label, value, onChange, min, max, step = 1, unit = "", log = false,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number; unit?: string; log?: boolean;
}) {
  const toSlider = (v: number) => (log ? Math.log10(v) : v);
  const fromSlider = (v: number) => (log ? Math.pow(10, v) : v);
  const display = value >= 100 ? Math.round(value).toLocaleString() : value >= 10 ? value.toFixed(1) : value.toFixed(2).replace(/\.?0+$/, "");
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-[family-name:var(--font-mono)] text-accent">{display}{unit && <span className="text-muted"> {unit}</span>}</span>
      </div>
      <input
        type="range"
        className="w-full"
        min={toSlider(min)}
        max={toSlider(max)}
        step={log ? (Math.log10(max) - Math.log10(min)) / 200 : step}
        value={toSlider(value)}
        onChange={(e) => {
          let v = fromSlider(parseFloat(e.target.value));
          if (log) v = parseFloat(v.toPrecision(3));
          onChange(v);
        }}
      />
    </label>
  );
}

/* ------------------------------------------------------------------ */

export function Select<T extends string>({
  label, value, onChange, options,
}: {
  label?: string; value: T; onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="block text-xs">
      {label && <div className="mb-1 text-muted">{label}</div>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-sm text-fg outline-none focus:border-accent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

/* ------------------------------------------------------------------ */

export function Panel({ title, subtitle, children, className = "", right }: {
  title?: ReactNode; subtitle?: ReactNode; children: ReactNode; className?: string; right?: ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-panel p-4 md:p-5 ${className}`}>
      {(title || right) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="font-[family-name:var(--font-display)] text-base font-semibold">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function InfoBox({ kind = "info", title, children }: {
  kind?: "info" | "tip" | "warn" | "physics"; title?: string; children: ReactNode;
}) {
  const styles = {
    info: { border: "border-accent-2/40", bg: "bg-accent-2/5", icon: "ⓘ", color: "text-accent-2" },
    tip: { border: "border-good/40", bg: "bg-good/5", icon: "✦", color: "text-good" },
    warn: { border: "border-warn/40", bg: "bg-warn/5", icon: "⚠", color: "text-warn" },
    physics: { border: "border-accent/40", bg: "bg-accent/5", icon: "ƒ", color: "text-accent" },
  }[kind];
  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} px-4 py-3 text-sm leading-relaxed`}>
      {title && <div className={`mb-1 font-semibold ${styles.color}`}>{styles.icon} {title}</div>}
      <div className="text-fg/90">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Tabs<T extends string>({ tabs, active, onChange }: {
  tabs: { id: T; label: ReactNode }[]; active: T; onChange: (t: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-full border px-3.5 py-1.5 text-sm transition-all ${
            t.id === active
              ? "border-accent bg-accent/15 text-accent"
              : "border-line bg-panel-2 text-muted hover:border-line-2 hover:text-fg"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Stat({ label, value, unit, tone = "default" }: {
  label: string; value: string | number; unit?: string; tone?: "default" | "good" | "warn" | "bad";
}) {
  const color = { default: "text-fg", good: "text-good", warn: "text-warn", bad: "text-bad" }[tone];
  return (
    <div className="rounded-xl border border-line bg-panel-2 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-0.5 font-[family-name:var(--font-mono)] text-lg ${color}`}>
        {value}{unit && <span className="ml-1 text-xs text-muted">{unit}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Quiz({ question, options, correct, explanation }: {
  question: string; options: string[]; correct: number; explanation: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="rounded-xl border border-line bg-panel-2 p-4">
      <div className="mb-3 text-sm font-medium">🧠 {question}</div>
      <div className="grid gap-2">
        {options.map((o, i) => {
          let cls = "border-line bg-panel hover:border-line-2";
          if (picked !== null) {
            if (i === correct) cls = "border-good bg-good/10 text-good";
            else if (i === picked) cls = "border-bad bg-bad/10 text-bad";
            else cls = "border-line bg-panel opacity-50";
          }
          return (
            <button
              key={i}
              disabled={picked !== null}
              onClick={() => setPicked(i)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${cls}`}
            >
              <span className="mr-2 font-[family-name:var(--font-mono)] text-xs text-muted">{String.fromCharCode(65 + i)}</span>
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className={`anim-fade-up mt-3 rounded-lg px-3 py-2 text-sm ${picked === correct ? "bg-good/10 text-good" : "bg-warn/10 text-warn"}`}>
          <span className="font-semibold">{picked === correct ? "Correct. " : "Not quite. "}</span>
          <span className="text-fg/85">{explanation}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Formula({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="my-3 rounded-xl border border-accent/25 bg-accent/5 px-4 py-3">
      <div className="overflow-x-auto text-center font-[family-name:var(--font-mono)] text-[15px] text-accent">
        {children}
      </div>
      {label && <div className="mt-1 text-center text-xs text-muted">{label}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Reveal({ label = "Reveal answer", children }: { label?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-accent/50 bg-accent/10 px-4 py-2 text-sm text-accent transition-colors hover:bg-accent/20"
      >
        {label} →
      </button>
    );
  }
  return <div className="anim-fade-up">{children}</div>;
}
