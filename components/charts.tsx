"use client";

/**
 * Lightweight SVG/Canvas chart primitives — purpose-built for the lab so we
 * control every pixel of the scientific presentation (log axes, pseudo-depth
 * conventions, geology color scales) without a charting dependency.
 */

import { useEffect, useMemo, useRef } from "react";

/* ------------------------------------------------------------------ */
/* Scales                                                              */
/* ------------------------------------------------------------------ */

export interface Scale {
  (v: number): number;
  invert?: (px: number) => number;
}

export function linScale(d0: number, d1: number, r0: number, r1: number): Scale {
  const f = ((v: number) => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0)) as Scale;
  f.invert = (px) => d0 + ((px - r0) / (r1 - r0 || 1)) * (d1 - d0);
  return f;
}

export function logScale(d0: number, d1: number, r0: number, r1: number): Scale {
  const l0 = Math.log10(d0);
  const l1 = Math.log10(d1);
  const f = ((v: number) => r0 + ((Math.log10(Math.max(1e-12, v)) - l0) / (l1 - l0 || 1)) * (r1 - r0)) as Scale;
  f.invert = (px) => Math.pow(10, l0 + ((px - r0) / (r1 - r0 || 1)) * (l1 - l0));
  return f;
}

export function niceTicks(min: number, max: number, n = 5): number[] {
  const span = max - min || 1;
  const step0 = Math.pow(10, Math.floor(Math.log10(span / n)));
  const err = span / n / step0;
  const step = step0 * (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1);
  const ticks: number[] = [];
  for (let t = Math.ceil(min / step) * step; t <= max + 1e-9; t += step) ticks.push(parseFloat(t.toPrecision(10)));
  return ticks;
}

export function logTicks(min: number, max: number): number[] {
  const ticks: number[] = [];
  const e0 = Math.floor(Math.log10(min));
  const e1 = Math.ceil(Math.log10(max));
  for (let e = e0; e <= e1; e++) {
    const v = Math.pow(10, e);
    if (v >= min * 0.999 && v <= max * 1.001) ticks.push(v);
  }
  return ticks;
}

export const fmtSI = (v: number): string => {
  if (v === 0) return "0";
  const a = Math.abs(v);
  if (a >= 10000) return v.toExponential(0).replace("e+", "e");
  if (a >= 100) return v.toFixed(0);
  if (a >= 1) return parseFloat(v.toPrecision(3)).toString();
  return parseFloat(v.toPrecision(2)).toString();
};

/* ------------------------------------------------------------------ */
/* Line chart (supports log axes, multiple series, points)             */
/* ------------------------------------------------------------------ */

export interface Series {
  x: number[];
  y: (number | null)[];
  color?: string;
  label?: string;
  dash?: string;
  points?: boolean;
  width?: number;
}

export function LineChart({
  series, width = 560, height = 320, logX = false, logY = false,
  xLabel, yLabel, yFlip = false, title, xDomain, yDomain, className = "",
}: {
  series: Series[]; width?: number; height?: number;
  logX?: boolean; logY?: boolean; xLabel?: string; yLabel?: string;
  yFlip?: boolean; title?: string; xDomain?: [number, number]; yDomain?: [number, number];
  className?: string;
}) {
  const m = { l: 56, r: 16, t: title ? 30 : 14, b: 42 };

  const allX = series.flatMap((s) => s.x);
  const allY = series.flatMap((s) => s.y.filter((v): v is number => v !== null && isFinite(v)));
  if (allX.length === 0 || allY.length === 0) return null;

  let x0 = xDomain?.[0] ?? Math.min(...allX);
  let x1 = xDomain?.[1] ?? Math.max(...allX);
  let y0 = yDomain?.[0] ?? Math.min(...allY);
  let y1 = yDomain?.[1] ?? Math.max(...allY);
  if (!logY) { const pad = (y1 - y0) * 0.08 || Math.abs(y1) * 0.1 || 1; y0 -= pad; y1 += pad; }
  else { y0 *= 0.7; y1 *= 1.4; }
  if (logX) { x0 *= 0.95; x1 *= 1.05; }

  const sx = logX ? logScale(x0, x1, m.l, width - m.r) : linScale(x0, x1, m.l, width - m.r);
  const sy = logY
    ? logScale(y0, y1, yFlip ? m.t : height - m.b, yFlip ? height - m.b : m.t)
    : linScale(y0, y1, yFlip ? m.t : height - m.b, yFlip ? height - m.b : m.t);

  const xTicks = logX ? logTicks(x0, x1) : niceTicks(x0, x1, 6);
  const yTicks = logY ? logTicks(y0, y1) : niceTicks(y0, y1, 5);

  // Round every emitted coordinate: Math.tanh/log10 differ by 1 ulp between
  // Node and browser engines, which would otherwise cause hydration warnings.
  const R = (v: number) => v.toFixed(2);

  const path = (s: Series) => {
    let d = "";
    let pen = false;
    s.x.forEach((xv, i) => {
      const yv = s.y[i];
      if (yv === null || !isFinite(yv)) { pen = false; return; }
      d += `${pen ? "L" : "M"}${R(sx(xv))},${R(sy(yv))}`;
      pen = true;
    });
    return d;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`w-full ${className}`} role="img">
      {title && <text x={width / 2} y={16} textAnchor="middle" fill="#dbe4f5" fontSize="13" fontWeight="600">{title}</text>}
      {/* grid + ticks */}
      {xTicks.map((t) => (
        <g key={`x${t}`}>
          <line x1={R(sx(t))} x2={R(sx(t))} y1={m.t} y2={height - m.b} stroke="#24304d" strokeWidth="0.7" />
          <text x={R(sx(t))} y={height - m.b + 16} textAnchor="middle" fill="#8b9ab8" fontSize="10">{fmtSI(t)}</text>
        </g>
      ))}
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={m.l} x2={width - m.r} y1={R(sy(t))} y2={R(sy(t))} stroke="#24304d" strokeWidth="0.7" />
          <text x={m.l - 6} y={R(sy(t) + 3.5)} textAnchor="end" fill="#8b9ab8" fontSize="10">{fmtSI(t)}</text>
        </g>
      ))}
      <rect x={m.l} y={m.t} width={width - m.l - m.r} height={height - m.t - m.b} fill="none" stroke="#31405f" strokeWidth="1" rx="2" />
      {/* series */}
      {series.map((s, i) => (
        <g key={i}>
          <path d={path(s)} fill="none" stroke={s.color ?? "#f5b942"} strokeWidth={s.width ?? 2} strokeDasharray={s.dash} strokeLinejoin="round" />
          {s.points && s.x.map((xv, j) => {
            const yv = s.y[j];
            if (yv === null || !isFinite(yv)) return null;
            return <circle key={j} cx={R(sx(xv))} cy={R(sy(yv))} r="3" fill="#0b1120" stroke={s.color ?? "#f5b942"} strokeWidth="1.6" />;
          })}
        </g>
      ))}
      {/* labels */}
      {xLabel && <text x={(m.l + width - m.r) / 2} y={height - 6} textAnchor="middle" fill="#8b9ab8" fontSize="11">{xLabel}</text>}
      {yLabel && (
        <text x={14} y={(m.t + height - m.b) / 2} textAnchor="middle" fill="#8b9ab8" fontSize="11"
          transform={`rotate(-90 14 ${(m.t + height - m.b) / 2})`}>{yLabel}</text>
      )}
      {/* legend */}
      {series.some((s) => s.label) && (
        <g>
          {series.filter((s) => s.label).map((s, i) => (
            <g key={i} transform={`translate(${m.l + 10}, ${m.t + 14 + i * 15})`}>
              <line x1="0" x2="18" y1="-3" y2="-3" stroke={s.color ?? "#f5b942"} strokeWidth="2.4" strokeDasharray={s.dash} />
              <text x="23" y="0" fill="#dbe4f5" fontSize="10">{s.label}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Color scales                                                        */
/* ------------------------------------------------------------------ */

/** Resistivity-style rainbow: blue (conductive) → green → yellow → red (resistive). */
export function resistivityColor(t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  const stops: [number, [number, number, number]][] = [
    [0.0, [26, 55, 145]],
    [0.25, [26, 152, 180]],
    [0.5, [80, 180, 90]],
    [0.7, [235, 215, 70]],
    [0.85, [235, 130, 40]],
    [1.0, [200, 30, 30]],
  ];
  for (let i = 1; i < stops.length; i++) {
    if (clamped <= stops[i][0]) {
      const [t0, c0] = stops[i - 1];
      const [t1, c1] = stops[i];
      const f = (clamped - t0) / (t1 - t0);
      return [0, 1, 2].map((k) => Math.round(c0[k] + f * (c1[k] - c0[k]))) as [number, number, number];
    }
  }
  return stops[stops.length - 1][1];
}

export const rgbCss = (c: [number, number, number]) => `rgb(${c[0]},${c[1]},${c[2]})`;

/* ------------------------------------------------------------------ */
/* Canvas heatmap (radargrams, pseudosections)                         */
/* ------------------------------------------------------------------ */

export function CanvasHeatmap({
  data, width, height, colorFn, className = "",
}: {
  /** data[col][row] rendered left→right, top→bottom, values already 0..1 */
  data: number[][];
  width: number; height: number;
  colorFn: (t: number) => [number, number, number];
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || data.length === 0) return;
    const nx = data.length;
    const ny = data[0].length;
    canvas.width = nx;
    canvas.height = ny;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(nx, ny);
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const [r, g, b] = colorFn(data[i][j]);
        const idx = (j * nx + i) * 4;
        img.data[idx] = r; img.data[idx + 1] = g; img.data[idx + 2] = b; img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [data, colorFn]);
  return (
    <canvas
      ref={ref}
      className={className}
      style={{ width: "100%", height: "auto", aspectRatio: `${width}/${height}`, imageRendering: "auto" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Color bar                                                           */
/* ------------------------------------------------------------------ */

export function ColorBar({ min, max, label, log = true }: { min: number; max: number; label: string; log?: boolean }) {
  const grad = useMemo(() => {
    const stops = Array.from({ length: 11 }, (_, i) => {
      const t = i / 10;
      return `${rgbCss(resistivityColor(t))} ${t * 100}%`;
    });
    return `linear-gradient(to right, ${stops.join(",")})`;
  }, []);
  const mid = log ? Math.sqrt(min * max) : (min + max) / 2;
  return (
    <div className="mt-2">
      <div className="h-2.5 w-full rounded-full" style={{ background: grad }} />
      <div className="mt-1 flex justify-between font-[family-name:var(--font-mono)] text-[10px] text-muted">
        <span>{fmtSI(min)}</span>
        <span>{fmtSI(mid)} — {label}</span>
        <span>{fmtSI(max)}</span>
      </div>
    </div>
  );
}
