/**
 * GeoSurvey Lab — geotechnical analysis engine.
 *
 * Bearing capacity (Terzaghi / Vesic factors), stress distribution,
 * consolidation and elastic settlement, SPT corrections and correlations.
 * References: Bowles (1996), Das "Principles of Foundation Engineering",
 * Terzaghi & Peck (1967), Meyerhof (1956).
 */

import type { GroundLayer } from "./materials";

const GAMMA_W = 9.81; // kN/m³

/* ------------------------------------------------------------------ */
/* Stress profile                                                      */
/* ------------------------------------------------------------------ */

export interface StressPoint {
  depth: number;
  totalStress: number;     // kPa
  porePressure: number;    // kPa
  effectiveStress: number; // kPa
}

export function stressProfile(
  layers: GroundLayer[],
  waterTableDepth: number,
  dz = 0.25,
): StressPoint[] {
  const points: StressPoint[] = [];
  const totalD = layers.reduce((s, l) => s + l.thickness, 0);
  let sigma = 0;
  let depth = 0;
  points.push({ depth: 0, totalStress: 0, porePressure: 0, effectiveStress: 0 });
  while (depth < totalD - 1e-9) {
    const step = Math.min(dz, totalD - depth);
    const li = layerIndexAt(layers, depth + step / 2);
    sigma += layers[li].unitWeight * step;
    depth += step;
    const u = Math.max(0, (depth - waterTableDepth) * GAMMA_W);
    points.push({ depth, totalStress: sigma, porePressure: u, effectiveStress: Math.max(0, sigma - u) });
  }
  return points;
}

export function layerIndexAt(layers: GroundLayer[], z: number): number {
  let d = 0;
  for (let i = 0; i < layers.length; i++) {
    d += layers[i].thickness;
    if (z < d) return i;
  }
  return layers.length - 1;
}

export function effectiveStressAt(layers: GroundLayer[], waterTableDepth: number, z: number): number {
  let sigma = 0;
  let d = 0;
  for (const l of layers) {
    const top = d;
    const bot = d + l.thickness;
    const seg = Math.max(0, Math.min(z, bot) - top);
    sigma += l.unitWeight * seg;
    d = bot;
    if (z <= bot) break;
  }
  if (z > d) sigma += layers[layers.length - 1].unitWeight * (z - d);
  const u = Math.max(0, (z - waterTableDepth) * GAMMA_W);
  return Math.max(0, sigma - u);
}

/* ------------------------------------------------------------------ */
/* SPT corrections & correlations                                      */
/* ------------------------------------------------------------------ */

/** Overburden correction C_N = sqrt(100/σ'v), capped at 1.7 (Liao & Whitman 1986). */
export function sptN160(nField: number, effStress: number, energyRatio = 60): number {
  const n60 = (nField * energyRatio) / 60;
  const cn = Math.min(1.7, Math.sqrt(100 / Math.max(10, effStress)));
  return n60 * cn;
}

/** Peck/Hanson friction-angle correlation for sands: φ ≈ 27.1 + 0.3 N₁₆₀ − 0.00054 N₁₆₀². */
export function frictionAngleFromSpt(n160: number): number {
  return Math.min(45, 27.1 + 0.3 * n160 - 0.00054 * n160 * n160);
}

/** Undrained shear strength from SPT for clays (Terzaghi & Peck): Su ≈ 6.25 N kPa. */
export function undrainedStrengthFromSpt(n: number): number {
  return 6.25 * n;
}

export function sptDensityClass(n: number, cohesive: boolean): string {
  if (cohesive) {
    if (n < 2) return "Very soft";
    if (n < 4) return "Soft";
    if (n < 8) return "Medium stiff";
    if (n < 15) return "Stiff";
    if (n < 30) return "Very stiff";
    return "Hard";
  }
  if (n < 4) return "Very loose";
  if (n < 10) return "Loose";
  if (n < 30) return "Medium dense";
  if (n < 50) return "Dense";
  return "Very dense";
}

/* ------------------------------------------------------------------ */
/* Bearing capacity                                                    */
/* ------------------------------------------------------------------ */

export interface BearingResult {
  Nc: number; Nq: number; Ngamma: number;
  qUltimate: number;   // kPa
  qAllowable: number;  // kPa (FS = 3)
  governingLayer: number;
  method: string;
  contributions: { cohesion: number; surcharge: number; width: number };
}

/**
 * General bearing-capacity equation for a strip/square footing at depth Df:
 *   q_ult = c·Nc·sc + q·Nq + 0.5·γ'·B·Nγ·sγ
 * Factors: Nq = e^{π tanφ} tan²(45+φ/2) (Reissner), Nc = (Nq−1)cotφ
 * (Prandtl), Nγ = 2(Nq+1)tanφ (Vesic).
 */
export function bearingCapacity(
  layers: GroundLayer[],
  waterTableDepth: number,
  footingWidth: number,
  footingDepth: number,
  shape: "strip" | "square" = "square",
): BearingResult {
  const li = layerIndexAt(layers, footingDepth + footingWidth / 4);
  const soil = layers[li];
  const phi = (soil.frictionAngle * Math.PI) / 180;
  const c = soil.cohesion;

  let Nq: number, Nc: number, Ng: number;
  if (soil.frictionAngle < 0.5) {
    Nq = 1; Nc = 5.14; Ng = 0;
  } else {
    Nq = Math.exp(Math.PI * Math.tan(phi)) * Math.pow(Math.tan(Math.PI / 4 + phi / 2), 2);
    Nc = (Nq - 1) / Math.tan(phi);
    Ng = 2 * (Nq + 1) * Math.tan(phi);
  }

  const sc = shape === "square" ? 1.3 : 1.0;
  const sg = shape === "square" ? 0.8 : 1.0;

  // Effective surcharge at founding level
  const q = effectiveStressAt(layers, waterTableDepth, footingDepth);

  // Effective unit weight below footing (water-table correction)
  let gammaEff = soil.unitWeight;
  if (waterTableDepth <= footingDepth) {
    gammaEff = soil.unitWeight - GAMMA_W;
  } else if (waterTableDepth < footingDepth + footingWidth) {
    const d = waterTableDepth - footingDepth;
    const frac = d / footingWidth;
    gammaEff = (soil.unitWeight - GAMMA_W) + frac * GAMMA_W;
  }
  gammaEff = Math.max(5, gammaEff);

  const term1 = c * Nc * sc;
  const term2 = q * Nq;
  const term3 = 0.5 * gammaEff * footingWidth * Ng * sg;
  const qUlt = term1 + term2 + term3;

  return {
    Nc, Nq, Ngamma: Ng,
    qUltimate: qUlt,
    qAllowable: qUlt / 3,
    governingLayer: li,
    method: "General equation (Vesic factors), FS = 3",
    contributions: { cohesion: term1, surcharge: term2, width: term3 },
  };
}

/** Meyerhof allowable bearing pressure from SPT for 25 mm settlement (kPa). */
export function meyerhofAllowable(n160: number, B: number): number {
  if (B <= 1.22) return 12 * n160;
  return 8 * n160 * Math.pow((B + 0.305) / B, 2);
}

/* ------------------------------------------------------------------ */
/* Stress increase and settlement                                      */
/* ------------------------------------------------------------------ */

/** 2:1 stress distribution: Δσ(z) = q·B·L / ((B+z)(L+z)) below a footing. */
export function stressIncrease(q: number, B: number, L: number, z: number): number {
  if (z <= 0) return q;
  return (q * B * L) / ((B + z) * (L + z));
}

export interface SettlementResult {
  total: number; // mm
  perLayer: { layer: number; depthMid: number; consolidation: number; elastic: number }[];
}

/**
 * Settlement under a footing: consolidation for cohesive layers
 * (Sc = Cc·H/(1+e0)·log((σ'0+Δσ)/σ'0)) and elastic for granular layers
 * (Se = Δσ·H/Es with Es ≈ 766·N kPa for sands, Bowles).
 */
export function settlement(
  layers: GroundLayer[],
  waterTableDepth: number,
  qNet: number,          // net applied pressure kPa
  B: number,
  L: number,
  footingDepth: number,
): SettlementResult {
  const perLayer: SettlementResult["perLayer"] = [];
  let total = 0;
  let d = 0;
  for (let i = 0; i < layers.length; i++) {
    const l = layers[i];
    const top = Math.max(d, footingDepth);
    const bot = d + l.thickness;
    d = bot;
    if (bot <= footingDepth) { perLayer.push({ layer: i, depthMid: (top + bot) / 2, consolidation: 0, elastic: 0 }); continue; }
    const H = bot - top;
    const zMid = (top + bot) / 2 - footingDepth;
    if (zMid > 2 * Math.max(B, L) * 2.5) { perLayer.push({ layer: i, depthMid: (top + bot) / 2, consolidation: 0, elastic: 0 }); continue; }
    const dSigma = stressIncrease(qNet, B, L, zMid);
    const sigma0 = effectiveStressAt(layers, waterTableDepth, (top + bot) / 2);

    let sc = 0;
    let se = 0;
    if (l.cohesion > 25 && l.compressionIndex > 0.05) {
      // cohesive — consolidation
      sc = ((l.compressionIndex * H) / (1 + l.voidRatio)) *
        Math.log10((Math.max(5, sigma0) + dSigma) / Math.max(5, sigma0)) * 1000; // mm
    } else {
      // granular — elastic (Es from SPT)
      const Es = 766 * Math.max(2, l.sptN); // kPa
      se = (dSigma * H) / Es * 1000; // mm
    }
    total += sc + se;
    perLayer.push({ layer: i, depthMid: (top + bot) / 2, consolidation: sc, elastic: se });
  }
  return { total, perLayer };
}

/* ------------------------------------------------------------------ */
/* Foundation recommendation                                           */
/* ------------------------------------------------------------------ */

export interface FoundationAdvice {
  type: string;
  reason: string;
  cautions: string[];
}

export function foundationRecommendation(
  layers: GroundLayer[],
  waterTableDepth: number,
  bearing: BearingResult,
  settlementMm: number,
): FoundationAdvice {
  const cautions: string[] = [];
  const topLayer = layers[0];
  const qa = bearing.qAllowable;

  if (waterTableDepth < 2) cautions.push("Shallow groundwater — dewatering will be needed for excavations; check uplift and buoyancy.");
  const softClay = layers.find((l, i) => i < 3 && l.cohesion > 25 && l.sptN < 4);
  if (softClay) cautions.push(`Soft cohesive layer (“${softClay.name}”, N=${softClay.sptN}) near surface — expect long-term consolidation settlement.`);
  const looseSand = layers.find((l, i) => i < 3 && l.cohesion <= 25 && l.sptN < 10);
  if (looseSand && waterTableDepth < 5) cautions.push(`Loose saturated granular layer (“${looseSand.name}”) — evaluate liquefaction potential in seismic regions.`);
  if (topLayer.uscs === "OL") cautions.push("Organic topsoil must be stripped before founding any structure.");

  if (qa > 300 && settlementMm < 25) {
    return { type: "Shallow isolated (pad) footings", reason: `Allowable bearing ${qa.toFixed(0)} kPa with ${settlementMm.toFixed(0)} mm predicted settlement — well within limits for conventional spread footings.`, cautions };
  }
  if (qa > 150 && settlementMm < 40) {
    return { type: "Strip footings / stiffened raft", reason: `Moderate allowable bearing (${qa.toFixed(0)} kPa) and settlement (${settlementMm.toFixed(0)} mm). Continuous footings or a raft will spread loads and even out differential settlement.`, cautions };
  }
  if (qa > 75) {
    return { type: "Raft (mat) foundation", reason: `Low allowable bearing (${qa.toFixed(0)} kPa) or high settlement (${settlementMm.toFixed(0)} mm) — a raft reduces net bearing pressure and bridges weak zones.`, cautions };
  }
  const rockDepth = (() => { let dsum = 0; for (const l of layers) { if (l.sptN >= 50) return dsum; dsum += l.thickness; } return null; })();
  return {
    type: rockDepth !== null ? `Deep foundations — piles to ~${rockDepth.toFixed(1)} m (competent stratum)` : "Deep foundations — friction piles",
    reason: `Very low allowable bearing (${qa.toFixed(0)} kPa) and/or excessive settlement (${settlementMm.toFixed(0)} mm) rule out shallow options. Transfer loads to the deeper competent stratum.`,
    cautions,
  };
}

/* ------------------------------------------------------------------ */
/* Synthetic SPT log                                                   */
/* ------------------------------------------------------------------ */

export interface SptPoint { depth: number; n: number; n160: number; layer: number }

/** SPT profile every 1.5 m with realistic scatter (deterministic pseudo-random). */
export function syntheticSptLog(layers: GroundLayer[], waterTableDepth: number): SptPoint[] {
  const totalD = layers.reduce((s, l) => s + l.thickness, 0);
  const points: SptPoint[] = [];
  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let z = 1.5; z <= totalD; z += 1.5) {
    const li = layerIndexAt(layers, z);
    const l = layers[li];
    // mild depth-hardening within a layer + scatter
    const base = l.sptN * (1 + 0.02 * z);
    const n = Math.max(1, Math.round(base * (0.85 + 0.3 * rand())));
    const nCapped = Math.min(n, 100);
    const eff = effectiveStressAt(layers, waterTableDepth, z);
    points.push({ depth: z, n: nCapped, n160: Math.round(sptN160(nCapped, eff)), layer: li });
  }
  return points;
}
