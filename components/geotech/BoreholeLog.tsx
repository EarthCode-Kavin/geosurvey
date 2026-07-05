"use client";

/**
 * Professional-style borehole log: lithology column, USCS symbols, sample
 * depths, SPT N-value plot, water level — drawn live from the soil profile.
 */

import { GroundLayer, layerTops, totalDepth } from "@/lib/materials";
import { HatchDefs, hatchFill } from "@/components/LayerBuilder";
import type { SptPoint } from "@/lib/geotech";
import { sptDensityClass } from "@/lib/geotech";

export default function BoreholeLog({
  layers, spt, waterTableDepth, width = 460, height = 520, animateProgress = 1,
}: {
  layers: GroundLayer[];
  spt: SptPoint[];
  waterTableDepth: number;
  width?: number;
  height?: number;
  /** 0..1 — drilling animation: how much of the hole is logged */
  animateProgress?: number;
}) {
  const depth = totalDepth(layers);
  const tops = layerTops(layers);
  const m = { t: 44, b: 26 };
  const cols = {
    depth: { x: 0, w: 34 },
    lith: { x: 34, w: 88 },
    desc: { x: 122, w: 148 },
    spt: { x: 270, w: width - 270 - 8 },
  };
  const plotH = height - m.t - m.b;
  const yOf = (d: number) => m.t + (Math.min(d, depth) / depth) * plotH;
  const drillY = yOf(depth * animateProgress);

  const maxN = 100;
  const nX = (n: number) => cols.spt.x + 6 + (Math.min(n, maxN) / maxN) * (cols.spt.w - 12);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full select-none">
      <HatchDefs idPrefix="bh" />
      {/* header */}
      <rect x="0" y="0" width={width} height={m.t - 12} fill="#16213a" rx="4" />
      {[
        ["Depth", cols.depth.x + cols.depth.w / 2],
        ["Lithology", cols.lith.x + cols.lith.w / 2],
        ["Description", cols.desc.x + cols.desc.w / 2],
        ["SPT N-value (0–100)", cols.spt.x + cols.spt.w / 2],
      ].map(([t, x]) => (
        <text key={t as string} x={x as number} y="20" textAnchor="middle" fontSize="10.5" fill="#dbe4f5" fontWeight="600">{t}</text>
      ))}

      {/* column frame */}
      <rect x={cols.lith.x} y={m.t} width={cols.lith.w} height={plotH} fill="#0e1a33" stroke="#31405f" />
      <rect x={cols.spt.x} y={m.t} width={cols.spt.w} height={plotH} fill="#0e1a33" stroke="#31405f" />

      {/* SPT grid */}
      {[25, 50, 75].map((n) => (
        <g key={n}>
          <line x1={nX(n)} x2={nX(n)} y1={m.t} y2={m.t + plotH} stroke="#24304d" strokeWidth="0.8" />
          <text x={nX(n)} y={m.t + plotH + 12} textAnchor="middle" fontSize="8.5" fill="#8b9ab8">{n}</text>
        </g>
      ))}

      {/* lithology + descriptions (clipped by drilling progress) */}
      <clipPath id="bh-progress">
        <rect x="0" y="0" width={width} height={drillY} />
      </clipPath>
      <g clipPath="url(#bh-progress)">
        {layers.map((l, i) => {
          const y0 = yOf(tops[i]);
          const y1 = yOf(tops[i] + l.thickness);
          const h = y1 - y0;
          return (
            <g key={l.id}>
              <rect x={cols.lith.x} y={y0} width={cols.lith.w} height={h} fill={l.color} />
              {l.hatch !== "none" && <rect x={cols.lith.x} y={y0} width={cols.lith.w} height={h} fill={hatchFill(l.hatch, "bh")} />}
              <line x1={cols.lith.x} x2={cols.spt.x + cols.spt.w} y1={y1} y2={y1} stroke="#31405f" strokeWidth="0.8" />
              {h > 13 && (
                <>
                  <text x={cols.desc.x + 6} y={y0 + Math.min(16, h / 2 + 4)} fontSize="9.5" fill="#dbe4f5" fontWeight="600">
                    {l.name}{l.uscs !== "—" ? ` (${l.uscs})` : ""}
                  </text>
                  {h > 30 && (
                    <text x={cols.desc.x + 6} y={y0 + Math.min(16, h / 2 + 4) + 12} fontSize="8.5" fill="#8b9ab8">
                      {sptDensityClass(l.sptN, l.cohesion > 25)}, γ={l.unitWeight} kN/m³
                    </text>
                  )}
                  {h > 44 && (
                    <text x={cols.desc.x + 6} y={y0 + Math.min(16, h / 2 + 4) + 24} fontSize="8.5" fill="#8b9ab8">
                      c={l.cohesion} kPa, φ={l.frictionAngle}°
                    </text>
                  )}
                </>
              )}
              {/* depth marks */}
              <text x={cols.depth.x + cols.depth.w - 5} y={y1 + 3} textAnchor="end" fontSize="8.5" fill="#8b9ab8">
                {(tops[i] + l.thickness).toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* SPT curve */}
        <polyline
          points={spt.map((p) => `${nX(p.n)},${yOf(p.depth)}`).join(" ")}
          fill="none" stroke="#f5b942" strokeWidth="1.6"
        />
        {spt.map((p, i) => (
          <g key={i}>
            <circle cx={nX(p.n)} cy={yOf(p.depth)} r="3" fill="#0b1120" stroke="#f5b942" strokeWidth="1.5">
              <title>{`z=${p.depth} m — N=${p.n} (N₁₆₀=${p.n160})`}</title>
            </circle>
            <text x={nX(p.n) + 6} y={yOf(p.depth) + 3} fontSize="8" fill="#f5b942">{p.n}</text>
          </g>
        ))}
      </g>

      {/* water table */}
      {waterTableDepth < depth && drillY > yOf(waterTableDepth) && (
        <g>
          <line x1={cols.lith.x - 4} x2={cols.spt.x + cols.spt.w} y1={yOf(waterTableDepth)} y2={yOf(waterTableDepth)}
            stroke="#4fd1c5" strokeWidth="1.4" strokeDasharray="6 4" />
          <text x={cols.lith.x - 2} y={yOf(waterTableDepth) - 4} fontSize="9" fill="#4fd1c5">▽</text>
        </g>
      )}

      {/* drill string animation */}
      {animateProgress < 1 && (
        <g>
          <line x1={cols.lith.x + cols.lith.w / 2} y1={m.t - 8} x2={cols.lith.x + cols.lith.w / 2} y2={drillY}
            stroke="#dbe4f5" strokeWidth="2.5" opacity="0.85" />
          <path d={`M${cols.lith.x + cols.lith.w / 2 - 6} ${drillY} h12 l-6 9 Z`} fill="#f5b942" />
        </g>
      )}

      <text x={cols.depth.x + cols.depth.w - 5} y={m.t - 2} textAnchor="end" fontSize="8.5" fill="#8b9ab8">m</text>
    </svg>
  );
}
