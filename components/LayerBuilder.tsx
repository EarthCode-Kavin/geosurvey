"use client";

/**
 * Ground-model builder: stack layers, drag values, see the cross-section
 * update live. Shared by the Geophysics and Geotech laboratories.
 */

import { GroundLayer, MATERIALS, makeLayer, layerTops, totalDepth } from "@/lib/materials";
import { Slider } from "./ui";
import { useState } from "react";

/* ------------------------------------------------------------------ */
/* SVG hatch patterns for lithology                                    */
/* ------------------------------------------------------------------ */

export function HatchDefs({ idPrefix = "h" }: { idPrefix?: string }) {
  return (
    <defs>
      <pattern id={`${idPrefix}-dots`} width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.9" fill="rgba(0,0,0,0.35)" />
        <circle cx="6" cy="6" r="0.9" fill="rgba(0,0,0,0.35)" />
      </pattern>
      <pattern id={`${idPrefix}-dashes`} width="10" height="6" patternUnits="userSpaceOnUse">
        <line x1="0" y1="3" x2="6" y2="3" stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
      </pattern>
      <pattern id={`${idPrefix}-bricks`} width="14" height="8" patternUnits="userSpaceOnUse">
        <path d="M0 0H14M0 4H14M7 0V4M3.5 4V8M10.5 4V8" stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" fill="none" />
      </pattern>
      <pattern id={`${idPrefix}-cross`} width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M0 10L10 0M-2 2L2 -2M8 12L12 8" stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" />
      </pattern>
      <pattern id={`${idPrefix}-waves`} width="12" height="6" patternUnits="userSpaceOnUse">
        <path d="M0 3 Q3 0 6 3 T12 3" stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" fill="none" />
      </pattern>
    </defs>
  );
}

export const hatchFill = (hatch: string, idPrefix = "h") =>
  hatch === "none" ? undefined : `url(#${idPrefix}-${hatch})`;

/* ------------------------------------------------------------------ */
/* Cross-section renderer                                              */
/* ------------------------------------------------------------------ */

export function CrossSection({
  layers, width = 340, height = 420, waterTableDepth, selected, onSelect, children, showScale = true, idPrefix = "cs",
}: {
  layers: GroundLayer[]; width?: number; height?: number;
  waterTableDepth?: number; selected?: string | null; onSelect?: (id: string) => void;
  children?: React.ReactNode; // overlays (survey animations) in same coordinate space
  showScale?: boolean; idPrefix?: string;
}) {
  const depth = totalDepth(layers);
  const tops = layerTops(layers);
  const m = { l: showScale ? 40 : 8, r: 8, t: 26, b: 8 };
  const plotH = height - m.t - m.b;
  const plotW = width - m.l - m.r;
  const yOf = (d: number) => m.t + (d / depth) * plotH;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full select-none">
      <HatchDefs idPrefix={idPrefix} />
      {/* sky */}
      <rect x={m.l} y={0} width={plotW} height={m.t} fill="#0e1a33" />
      <line x1={m.l} y1={m.t} x2={m.l + plotW} y2={m.t} stroke="#4a5b7d" strokeWidth="1.6" />
      {/* ground surface deco */}
      <path d={`M${m.l} ${m.t} ${Array.from({ length: 20 }, (_, i) => `l${plotW / 20} ${i % 2 ? 1 : -1}`).join(" ")}`} stroke="#5b6f96" strokeWidth="0.8" fill="none" />

      {layers.map((l, i) => {
        const y0 = yOf(tops[i]);
        const h = yOf(tops[i] + l.thickness) - y0;
        const isSel = selected === l.id;
        return (
          <g key={l.id} onClick={() => onSelect?.(l.id)} style={{ cursor: onSelect ? "pointer" : "default" }}>
            <rect x={m.l} y={y0} width={plotW} height={h} fill={l.color} />
            {l.hatch !== "none" && <rect x={m.l} y={y0} width={plotW} height={h} fill={hatchFill(l.hatch, idPrefix)} />}
            <rect
              x={m.l} y={y0} width={plotW} height={h}
              fill={isSel ? "rgba(245,185,66,0.12)" : "transparent"}
              stroke={isSel ? "#f5b942" : "rgba(0,0,0,0.4)"}
              strokeWidth={isSel ? 2 : 0.8}
            />
            {h > 16 && (
              <text x={m.l + plotW / 2} y={y0 + h / 2 + 4} textAnchor="middle" fontSize="11"
                fill="rgba(255,255,255,0.92)" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                {l.name}
              </text>
            )}
          </g>
        );
      })}

      {/* water table */}
      {waterTableDepth !== undefined && waterTableDepth < depth && (
        <g>
          <line x1={m.l} x2={m.l + plotW} y1={yOf(waterTableDepth)} y2={yOf(waterTableDepth)}
            stroke="#4fd1c5" strokeWidth="1.6" strokeDasharray="7 4" />
          <text x={m.l + plotW - 4} y={yOf(waterTableDepth) - 4} textAnchor="end" fontSize="10" fill="#4fd1c5">▽ GWT</text>
        </g>
      )}

      {/* depth scale */}
      {showScale && (
        <g>
          {niceDepthTicks(depth).map((d) => (
            <g key={d}>
              <line x1={m.l - 4} x2={m.l} y1={yOf(d)} y2={yOf(d)} stroke="#8b9ab8" strokeWidth="1" />
              <text x={m.l - 7} y={yOf(d) + 3.5} textAnchor="end" fontSize="9.5" fill="#8b9ab8">{d}</text>
            </g>
          ))}
          <text x={12} y={m.t + plotH / 2} textAnchor="middle" fontSize="10" fill="#8b9ab8"
            transform={`rotate(-90 12 ${m.t + plotH / 2})`}>Depth (m)</text>
        </g>
      )}

      {children}
    </svg>
  );
}

function niceDepthTicks(depth: number): number[] {
  const step = depth > 60 ? 20 : depth > 30 ? 10 : depth > 12 ? 5 : depth > 5 ? 2 : 1;
  const t: number[] = [];
  for (let d = 0; d <= depth; d += step) t.push(d);
  return t;
}

/* ------------------------------------------------------------------ */
/* Layer editor list                                                   */
/* ------------------------------------------------------------------ */

export type PropertyKey =
  | "resistivity" | "vp" | "density" | "epsilon" | "susceptibility" | "moisture"
  | "sptN" | "cohesion" | "frictionAngle" | "unitWeight";

const PROP_META: Record<PropertyKey, { label: string; unit: string; min: number; max: number; step?: number; log?: boolean }> = {
  resistivity: { label: "Resistivity", unit: "Ω·m", min: 1, max: 100000, log: true },
  vp: { label: "P-wave velocity", unit: "m/s", min: 200, max: 6500, step: 50 },
  density: { label: "Density", unit: "g/cm³", min: 1.1, max: 3.2, step: 0.05 },
  epsilon: { label: "Dielectric εr", unit: "", min: 1, max: 40, step: 1 },
  susceptibility: { label: "Susceptibility", unit: "×10⁻³ SI", min: 0, max: 50, step: 0.1 },
  moisture: { label: "Moisture", unit: "%", min: 0, max: 60, step: 1 },
  sptN: { label: "SPT N-value", unit: "blows", min: 1, max: 100, step: 1 },
  cohesion: { label: "Cohesion c", unit: "kPa", min: 0, max: 1000, step: 5 },
  frictionAngle: { label: "Friction angle φ", unit: "°", min: 0, max: 45, step: 0.5 },
  unitWeight: { label: "Unit weight γ", unit: "kN/m³", min: 12, max: 27, step: 0.5 },
};

export function LayerBuilder({
  layers, onChange, properties, maxLayers = 7, selected, onSelect,
}: {
  layers: GroundLayer[];
  onChange: (l: GroundLayer[]) => void;
  properties: PropertyKey[];
  maxLayers?: number;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);

  const update = (id: string, patch: Partial<GroundLayer>) =>
    onChange(layers.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const remove = (id: string) => {
    if (layers.length <= 2) return;
    onChange(layers.filter((l) => l.id !== id));
    if (selected === id) onSelect(null);
  };

  const move = (id: string, dir: -1 | 1) => {
    const i = layers.findIndex((l) => l.id === id);
    const j = i + dir;
    if (j < 0 || j >= layers.length) return;
    const next = [...layers];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {layers.map((l, i) => {
        const isSel = selected === l.id;
        return (
          <div key={l.id}
            className={`rounded-xl border transition-colors ${isSel ? "border-accent bg-panel-2" : "border-line bg-panel-2/50 hover:border-line-2"}`}>
            <button className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
              onClick={() => onSelect(isSel ? null : l.id)}>
              <span className="h-4 w-4 shrink-0 rounded-sm border border-black/40" style={{ background: l.color }} />
              <span className="flex-1 text-sm font-medium">
                {i + 1}. {l.name}
                <span className="ml-2 font-[family-name:var(--font-mono)] text-xs text-muted">{l.thickness} m</span>
              </span>
              <span className="text-xs text-muted">{isSel ? "▲" : "▼"}</span>
            </button>
            {isSel && (
              <div className="anim-fade-up space-y-3 border-t border-line px-3 py-3">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={l.materialId}
                    onChange={(e) => {
                      const nm = makeLayer(e.target.value, l.thickness);
                      update(l.id, { ...nm, id: l.id, thickness: l.thickness });
                    }}
                    className="col-span-2 rounded-lg border border-line bg-panel px-2 py-1.5 text-sm outline-none focus:border-accent"
                  >
                    {MATERIALS.map((mt) => <option key={mt.id} value={mt.id}>{mt.name}</option>)}
                  </select>
                </div>
                <Slider label="Thickness" value={l.thickness} onChange={(v) => update(l.id, { thickness: v })}
                  min={0.5} max={30} step={0.5} unit="m" />
                {properties.map((p) => {
                  const meta = PROP_META[p];
                  return (
                    <Slider key={p} label={meta.label} value={l[p] as number}
                      onChange={(v) => update(l.id, { [p]: v } as Partial<GroundLayer>)}
                      min={meta.min} max={meta.max} step={meta.step} unit={meta.unit} log={meta.log} />
                  );
                })}
                <div className="flex gap-1.5 pt-1">
                  <button onClick={() => move(l.id, -1)} disabled={i === 0}
                    className="rounded-md border border-line px-2 py-1 text-xs text-muted hover:text-fg disabled:opacity-30">↑ up</button>
                  <button onClick={() => move(l.id, 1)} disabled={i === layers.length - 1}
                    className="rounded-md border border-line px-2 py-1 text-xs text-muted hover:text-fg disabled:opacity-30">↓ down</button>
                  <button onClick={() => remove(l.id)} disabled={layers.length <= 2}
                    className="ml-auto rounded-md border border-bad/40 px-2 py-1 text-xs text-bad hover:bg-bad/10 disabled:opacity-30">remove</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {layers.length < maxLayers && (
        <div>
          {!addOpen ? (
            <button onClick={() => setAddOpen(true)}
              className="w-full rounded-xl border border-dashed border-line-2 py-2.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent">
              + Add layer
            </button>
          ) : (
            <div className="anim-fade-up grid grid-cols-2 gap-1.5 rounded-xl border border-line bg-panel-2 p-2">
              {MATERIALS.map((mt) => (
                <button key={mt.id}
                  onClick={() => { onChange([...layers.slice(0, -1), makeLayer(mt.id), layers[layers.length - 1]]); setAddOpen(false); }}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-panel">
                  <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: mt.color }} />
                  {mt.name}
                </button>
              ))}
              <button onClick={() => setAddOpen(false)} className="col-span-2 py-1 text-xs text-muted hover:text-fg">cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
