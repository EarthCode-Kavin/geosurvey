"use client";

/**
 * Animated survey-physics overlays drawn inside the CrossSection SVG.
 * Coordinates must match CrossSection: margins l=40 (scale), t=26 sky.
 */

import type { MethodId } from "./methodInfo";

export const CS = { w: 340, h: 420, l: 40, r: 8, t: 26, b: 8 };
const plotW = CS.w - CS.l - CS.r;
const plotH = CS.h - CS.t - CS.b;

export default function SurveyOverlay({ method, totalDepthM, waveDepths }: {
  method: MethodId;
  totalDepthM: number;
  /** depths (m) of interfaces for wave/reflection animations */
  waveDepths: number[];
}) {
  const yOf = (d: number) => CS.t + (d / totalDepthM) * plotH;

  switch (method) {
    case "ves":
    case "ert":
      return <CurrentFlow ert={method === "ert"} />;
    case "seismic":
      return <SeismicWaves yOf={yOf} waveDepths={waveDepths} />;
    case "gpr":
      return <GprPulses yOf={yOf} waveDepths={waveDepths} />;
    case "magnetic":
      return <FieldLines color="#f472b6" label="magnetometer" />;
    case "gravity":
      return <FieldLines color="#60a5fa" label="gravimeter" gravity />;
    case "em":
      return <EmCoils />;
  }
}

/* ---------------- ERT / VES: electrodes + current arcs ---------------- */

function CurrentFlow({ ert }: { ert: boolean }) {
  const surf = CS.t;
  const eA = CS.l + plotW * 0.12;
  const eB = CS.l + plotW * 0.88;
  const eM = CS.l + plotW * 0.4;
  const eN = CS.l + plotW * 0.6;
  const arcs = [0.18, 0.35, 0.55, 0.78];
  return (
    <g>
      {/* current flow arcs A→B */}
      {arcs.map((f, i) => (
        <path
          key={i}
          d={`M${eA} ${surf} C ${eA} ${surf + plotH * f * 1.35}, ${eB} ${surf + plotH * f * 1.35}, ${eB} ${surf}`}
          fill="none"
          stroke="#f5b942"
          strokeWidth="1.8"
          opacity={0.85 - i * 0.16}
          className="anim-dash"
        />
      ))}
      {/* equipotential hints */}
      {[26, 46].map((r) => (
        <g key={r} opacity="0.4">
          <path d={`M${eA - r} ${surf} A ${r} ${r} 0 0 0 ${eA + r} ${surf}`} fill="none" stroke="#4fd1c5" strokeWidth="1" />
          <path d={`M${eB - r} ${surf} A ${r} ${r} 0 0 0 ${eB + r} ${surf}`} fill="none" stroke="#4fd1c5" strokeWidth="1" />
        </g>
      ))}
      {/* electrodes */}
      {(ert
        ? Array.from({ length: 12 }, (_, i) => CS.l + plotW * (0.06 + (0.88 * i) / 11))
        : [eA, eM, eN, eB]
      ).map((x, i) => (
        <g key={i}>
          <rect x={x - 1.8} y={surf - 11} width="3.6" height="12" fill="#f5b942" rx="1" />
          <circle cx={x} cy={surf - 13} r="2.4" fill="#f5b942" />
        </g>
      ))}
      {/* labels */}
      {!ert && (
        <g fontSize="9" fill="#f5b942" textAnchor="middle">
          <text x={eA} y={surf - 18}>A</text>
          <text x={eM} y={surf - 18}>M</text>
          <text x={eN} y={surf - 18}>N</text>
          <text x={eB} y={surf - 18}>B</text>
        </g>
      )}
      <text x={CS.l + plotW / 2} y={surf - 4} textAnchor="middle" fontSize="8" fill="#8b9ab8">
        {ert ? "multi-electrode cable — measurements scan automatically" : "I injected at A,B — ΔV read at M,N"}
      </text>
    </g>
  );
}

/* ---------------- Seismic: expanding wavefronts + head wave ---------------- */

function SeismicWaves({ yOf, waveDepths }: { yOf: (d: number) => number; waveDepths: number[] }) {
  const surf = CS.t;
  const sx = CS.l + plotW * 0.12;
  const refractor = waveDepths[Math.min(1, waveDepths.length - 1)] ?? 5;
  const ry = yOf(refractor);
  return (
    <g>
      {/* source */}
      <rect x={sx - 5} y={surf - 12} width="10" height="12" fill="#4fd1c5" rx="1.5" />
      <text x={sx} y={surf - 16} textAnchor="middle" fontSize="8" fill="#4fd1c5">source</text>
      {/* geophones */}
      {Array.from({ length: 8 }, (_, i) => CS.l + plotW * (0.28 + (0.66 * i) / 7)).map((x, i) => (
        <path key={i} d={`M${x - 3.5} ${surf} L${x + 3.5} ${surf} L${x} ${surf - 8} Z`} fill="#8b9ab8" />
      ))}
      {/* expanding wavefront semicircles (SMIL animation) */}
      {[0, 0.9, 1.8].map((delay, i) => (
        <circle key={i} cx={sx} cy={surf} r="2" fill="none" stroke="#4fd1c5" strokeWidth="2">
          <animate attributeName="r" from="2" to={String(plotW * 0.85)} dur="2.7s" begin={`${delay}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.9" to="0" dur="2.7s" begin={`${delay}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {/* critically refracted ray path */}
      <path
        d={`M${sx} ${surf} L${sx + (ry - surf) * 0.7} ${ry} L${CS.l + plotW * 0.86} ${ry}`}
        fill="none" stroke="#4fd1c5" strokeWidth="1.6" strokeDasharray="5 4" className="anim-dash" opacity="0.9"
      />
      {/* head-wave rays returning to surface */}
      {[0.5, 0.65, 0.8].map((f, i) => (
        <path key={i}
          d={`M${CS.l + plotW * f} ${ry} L${CS.l + plotW * f + (ry - surf) * 0.7} ${surf}`}
          fill="none" stroke="#4fd1c5" strokeWidth="1.2" strokeDasharray="4 4" className="anim-dash" opacity="0.55"
        />
      ))}
      <text x={CS.l + plotW * 0.55} y={ry + 11} textAnchor="middle" fontSize="8" fill="#4fd1c5">
        head wave travels along fast layer
      </text>
    </g>
  );
}

/* ---------------- GPR: antenna + reflected pulses ---------------- */

function GprPulses({ yOf, waveDepths }: { yOf: (d: number) => number; waveDepths: number[] }) {
  const surf = CS.t;
  const ax = CS.l + plotW * 0.5;
  const targets = waveDepths.slice(0, 3);
  return (
    <g>
      {/* antenna sliding */}
      <g>
        <rect x={-22} y={surf - 14} width="44" height="11" fill="#a78bfa" rx="2">
          <animate attributeName="x" values={`${CS.l + 10};${CS.l + plotW - 54};${CS.l + 10}`} dur="9s" repeatCount="indefinite" />
        </rect>
      </g>
      {/* stationary illustrative pulse fan at centre */}
      {targets.map((d, i) => {
        const iy = yOf(d);
        return (
          <g key={i}>
            <line x1={ax - 4} y1={surf} x2={ax - 4} y2={iy} stroke="#a78bfa" strokeWidth="1.4" strokeDasharray="3 4" className="anim-dash" opacity={0.85 - i * 0.22} />
            <line x1={ax + 4} y1={iy} x2={ax + 4} y2={surf} stroke="#c4b5fd" strokeWidth="1.4" strokeDasharray="3 4" className="anim-dash" opacity={0.7 - i * 0.18} />
            <circle cx={ax} cy={iy} r="3" fill="none" stroke="#a78bfa" strokeWidth="1.2" opacity="0.8" />
          </g>
        );
      })}
      <text x={ax} y={surf - 18} textAnchor="middle" fontSize="8" fill="#a78bfa">↓ transmit    reflect ↑</text>
    </g>
  );
}

/* ---------------- Magnetics / gravity: walking sensor + field ---------------- */

function FieldLines({ color, label, gravity = false }: { color: string; label: string; gravity?: boolean }) {
  const surf = CS.t;
  return (
    <g>
      {/* walking operator with sensor */}
      <g>
        <g>
          <circle cx="0" cy={surf - 26} r="4" fill={color} />
          <line x1="0" y1={surf - 22} x2="0" y2={surf - 10} stroke={color} strokeWidth="2" />
          <line x1="0" y1={surf - 10} x2="-4" y2={surf} stroke={color} strokeWidth="2" />
          <line x1="0" y1={surf - 10} x2="4" y2={surf} stroke={color} strokeWidth="2" />
          <line x1="0" y1={surf - 18} x2="9" y2={surf - 14} stroke={color} strokeWidth="2" />
          <rect x="7" y={surf - 14} width="5" height="8" fill={color} rx="1" />
          <animateTransform attributeName="transform" type="translate"
            values={`${CS.l + 14},0; ${CS.l + plotW - 20},0; ${CS.l + 14},0`} dur="10s" repeatCount="indefinite" />
        </g>
      </g>
      {gravity ? (
        // gravity pull arrows
        Array.from({ length: 6 }, (_, i) => CS.l + plotW * (0.12 + (0.76 * i) / 5)).map((x, i) => (
          <g key={i} opacity="0.6">
            <line x1={x} y1={surf + 8} x2={x} y2={surf + 26} stroke={color} strokeWidth="1.6" strokeDasharray="3 3" className="anim-dash" />
            <path d={`M${x - 3} ${surf + 23} L${x} ${surf + 29} L${x + 3} ${surf + 23}`} fill="none" stroke={color} strokeWidth="1.6" />
          </g>
        ))
      ) : (
        // dipole field loops around a buried magnetic body
        <g opacity="0.75">
          {[16, 28, 42].map((r, i) => (
            <ellipse key={i} cx={CS.l + plotW * 0.5} cy={surf + plotH * 0.45} rx={r * 0.7} ry={r}
              fill="none" stroke={color} strokeWidth="1.2" strokeDasharray="4 4" className="anim-dash" opacity={0.8 - i * 0.2} />
          ))}
          <circle cx={CS.l + plotW * 0.5} cy={surf + plotH * 0.45} r="6" fill={color} opacity="0.9" />
        </g>
      )}
      <text x={CS.l + plotW / 2} y={surf - 18} textAnchor="middle" fontSize="8" fill={color}>
        {label} walks the line — passive measurement
      </text>
    </g>
  );
}

/* ---------------- EM: coils + induced eddy currents ---------------- */

function EmCoils() {
  const surf = CS.t;
  const tx = CS.l + plotW * 0.3;
  const rx = CS.l + plotW * 0.7;
  return (
    <g>
      <ellipse cx={tx} cy={surf - 8} rx="10" ry="5" fill="none" stroke="#34d399" strokeWidth="2" />
      <ellipse cx={rx} cy={surf - 8} rx="10" ry="5" fill="none" stroke="#a7f3d0" strokeWidth="2" />
      <line x1={tx + 10} y1={surf - 8} x2={rx - 10} y2={surf - 8} stroke="#34d399" strokeWidth="1" opacity="0.5" />
      <text x={tx} y={surf - 17} textAnchor="middle" fontSize="8" fill="#34d399">Tx</text>
      <text x={rx} y={surf - 17} textAnchor="middle" fontSize="8" fill="#a7f3d0">Rx</text>
      {/* primary field */}
      {[14, 26, 40].map((r, i) => (
        <path key={i} d={`M${tx - r} ${surf} A ${r} ${r * 0.9} 0 0 0 ${tx + r} ${surf}`} fill="none"
          stroke="#34d399" strokeWidth="1.2" strokeDasharray="4 4" className="anim-dash" opacity={0.7 - i * 0.18} />
      ))}
      {/* induced eddy-current loops */}
      {[0.35, 0.55].map((f, i) => (
        <g key={i}>
          <ellipse cx={CS.l + plotW * 0.5} cy={surf + plotH * f} rx={plotW * 0.22} ry="7"
            fill="none" stroke="#fbbf24" strokeWidth="1.4" strokeDasharray="5 4" className="anim-dash" opacity={0.8 - i * 0.25} />
        </g>
      ))}
      {/* secondary field back to Rx */}
      <path d={`M${CS.l + plotW * 0.5} ${surf + plotH * 0.32} Q ${rx} ${surf + 30} ${rx} ${surf - 4}`}
        fill="none" stroke="#a7f3d0" strokeWidth="1.2" strokeDasharray="4 4" className="anim-dash" opacity="0.7" />
      <text x={CS.l + plotW * 0.5} y={surf + plotH * 0.35 + 18} textAnchor="middle" fontSize="8" fill="#fbbf24">
        eddy currents induced in conductors
      </text>
    </g>
  );
}
