/**
 * GeoSurvey Lab — geophysical forward-modelling engine (TypeScript port).
 *
 * Ported and extended from the original Python scientific engine
 * (resistivity.py): geometric factors, apparent resistivity, pseudosection
 * geometry — plus full 1-D layered-earth forward models for VES/ERT,
 * seismic refraction, GPR, gravity, magnetics and frequency-domain EM.
 */

export interface Layer1D {
  thickness: number;   // m (last layer: half-space, thickness ignored)
  resistivity: number; // Ω·m
  vp: number;          // m/s
  density: number;     // g/cm³
  epsilon: number;     // relative permittivity
  susceptibility: number; // SI ×10⁻³
}

/* ------------------------------------------------------------------ */
/* Bessel functions (self-contained, verified against series overlap)  */
/* ------------------------------------------------------------------ */

/** J1 Bessel function: power series for |x|<=15, asymptotic beyond (verified against series at overlap). */
export function besselJ1(x: number): number {
  const ax = Math.abs(x);
  if (ax <= 15) {
    // J1(x) = sum (-1)^k (x/2)^(2k+1) / (k! (k+1)!)
    const h = x / 2;
    let term = h;
    let sum = h;
    for (let k = 1; k <= 60; k++) {
      term *= -(h * h) / (k * (k + 1));
      sum += term;
      if (Math.abs(term) < 1e-16 * Math.abs(sum)) break;
    }
    return sum;
  }
  // Asymptotic: J1(x) ≈ sqrt(2/(πx)) [cos(ω) − (3/(8x)) sin(ω)], ω = x − 3π/4
  const w = ax - 2.356194490192345;
  const v = Math.sqrt(2 / (Math.PI * ax)) * (Math.cos(w) - (3 / (8 * ax)) * Math.sin(w));
  return x < 0 ? -v : v;
}

/** J0 Bessel function: power series for |x|<=15, asymptotic beyond (verified against series at overlap). */
export function besselJ0(x: number): number {
  const ax = Math.abs(x);
  if (ax <= 15) {
    const q = (x * x) / 4;
    let term = 1;
    let sum = 1;
    for (let k = 1; k <= 60; k++) {
      term *= -q / (k * k);
      sum += term;
      if (Math.abs(term) < 1e-16 * Math.abs(sum)) break;
    }
    return sum;
  }
  // J0(x) ≈ sqrt(2/(πx)) [cos(ω) + (1/(8x)) sin(ω)], ω = x − π/4
  const w = ax - 0.7853981633974483;
  return Math.sqrt(2 / (Math.PI * ax)) * (Math.cos(w) + (1 / (8 * ax)) * Math.sin(w));
}

/* ------------------------------------------------------------------ */
/* 1-D DC resistivity forward model (VES)                              */
/* ------------------------------------------------------------------ */

/**
 * Resistivity transform T(λ) via the Pekeris recurrence, bottom-up:
 *   T_i(λ) = (T_{i+1} + ρ_i tanh(λ h_i)) / (1 + T_{i+1} tanh(λ h_i)/ρ_i)
 */
export function resistivityTransform(rho: number[], h: number[], lambda: number): number {
  const n = rho.length;
  let T = rho[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    const lh = lambda * h[i];
    // tanh overflows gracefully to 1 for large arguments
    const t = lh > 20 ? 1 : Math.tanh(lh);
    T = (T + rho[i] * t) / (1 + (T * t) / rho[i]);
  }
  return T;
}

/**
 * Schlumberger apparent resistivity at half-spacing s (= AB/2):
 *   ρa(s) = s² ∫₀^∞ T(λ) J₁(λs) λ dλ
 * Evaluated as ρa = ρ₁ + ∫₀^∞ [T(x/s) − ρ₁] J₁(x) x dx  (x = λs),
 * where the bracket decays like e^(−2 x h₁ / s).
 */
export function vesSchlumberger(layers: Layer1D[], spacings: number[]): number[] {
  const rho = layers.map((l) => Math.max(0.1, l.resistivity));
  const h = layers.slice(0, -1).map((l) => Math.max(0.05, l.thickness));
  if (rho.length === 1) return spacings.map(() => rho[0]);
  const rho1 = rho[0];
  const hMin = Math.min(...h);

  return spacings.map((s) => {
    // Integration in x = λs. The kernel G = T − ρ1 decays on scale x ~ s/(2 hMin).
    const xDecay = (s / (2 * hMin)) * 14; // e^-14 ≈ 1e-6
    const xMax = Math.max(20, Math.min(xDecay, 60000));
    // Resolve both the Bessel oscillation (period 2π) and the kernel scale.
    const dx = Math.min(0.35, xMax / 4000);
    let sum = 0;
    let xPrev = 0;
    let fPrev = 0; // integrand at x=0 is 0 (J1(0)=0)
    for (let x = dx; x <= xMax; x += dx) {
      const G = resistivityTransform(rho, h, x / s) - rho1;
      const f = G * besselJ1(x) * x;
      sum += 0.5 * (f + fPrev) * (x - xPrev);
      xPrev = x;
      fPrev = f;
    }
    return Math.max(0.1, rho1 + sum);
  });
}

/**
 * Wenner apparent resistivity at electrode spacing a. From the surface
 * potential V(r) = (I/2π)∫ T(λ) J₀(λr) dλ and K = 2πa:
 *   ρa(a) = 2a ∫₀^∞ T(λ) [J₀(λa) − J₀(2λa)] dλ
 *         = ρ₁ + 2 ∫₀^∞ [T(x/a) − ρ₁][J₀(x) − J₀(2x)] dx   (x = λa)
 */
export function vesWenner(layers: Layer1D[], aSpacings: number[]): number[] {
  const rho = layers.map((l) => Math.max(0.1, l.resistivity));
  const h = layers.slice(0, -1).map((l) => Math.max(0.05, l.thickness));
  if (rho.length === 1) return aSpacings.map(() => rho[0]);
  const rho1 = rho[0];
  const hMin = Math.min(...h);

  return aSpacings.map((a) => {
    const xDecay = (a / (2 * hMin)) * 14;
    const xMax = Math.max(20, Math.min(xDecay, 60000));
    const dx = Math.min(0.3, xMax / 4500);
    let sum = 0;
    let xPrev = 0;
    let fPrev = 0;
    for (let x = dx; x <= xMax; x += dx) {
      const G = resistivityTransform(rho, h, x / a) - rho1;
      const f = G * (besselJ0(x) - besselJ0(2 * x));
      sum += 0.5 * (f + fPrev) * (x - xPrev);
      xPrev = x;
      fPrev = f;
    }
    return Math.max(0.1, rho1 + 2 * sum);
  });
}

/** Exact 2-layer Schlumberger image-series solution (validation + notebooks). */
export function vesTwoLayerExact(rho1: number, rho2: number, h: number, spacings: number[]): number[] {
  const k = (rho2 - rho1) / (rho2 + rho1);
  return spacings.map((s) => {
    let sum = 0;
    let kn = 1;
    for (let n = 1; n <= 4000; n++) {
      kn *= k;
      const term = kn * Math.pow(1 + Math.pow((2 * n * h) / s, 2), -1.5);
      sum += term;
      if (Math.abs(kn) < 1e-12) break;
    }
    return rho1 * (1 + 2 * sum);
  });
}

/* ------------------------------------------------------------------ */
/* Geometric factors (ported from resistivity.py)                      */
/* ------------------------------------------------------------------ */

export const wennerK = (a: number) => 2 * Math.PI * a;
export const schlumbergerK = (abHalf: number, mnHalf: number) =>
  (Math.PI * abHalf * abHalf) / (2 * mnHalf);
export const dipoleDipoleK = (a: number, n: number) =>
  Math.PI * a * n * (n + 1) * (n + 2);

/** General 4-electrode geometric factor K = 2π / (1/AM − 1/BM − 1/AN + 1/BN). */
export function geometricFactor(
  a: [number, number], b: [number, number], m: [number, number], n: [number, number],
): number {
  const d = (p: [number, number], q: [number, number]) =>
    Math.max(1e-12, Math.hypot(p[0] - q[0], p[1] - q[1]));
  const denom = 1 / d(a, m) - 1 / d(b, m) - 1 / d(a, n) + 1 / d(b, n);
  return (2 * Math.PI) / (Math.abs(denom) < 1e-12 ? 1e-12 : denom);
}

/* ------------------------------------------------------------------ */
/* ERT pseudosection (synthetic, layered background + anomaly)         */
/* ------------------------------------------------------------------ */

export interface Anomaly {
  x: number;       // center along line, m
  depth: number;   // center depth, m
  radius: number;  // m
  resistivity: number; // Ω·m
}

export interface Pseudosection {
  points: { x: number; z: number; rhoA: number; n: number }[];
  nElectrodes: number;
  spacing: number;
  levels: number;
  min: number;
  max: number;
}

/**
 * Synthetic Wenner-alpha pseudosection over the layered model with optional
 * local anomalies. The layered response is the exact 1-D Wenner forward; the
 * anomaly effect is applied through a normalized Gaussian sensitivity volume
 * centred at the pseudo-position (an educational approximation to the true
 * 2.5-D response — it reproduces position, polarity and smearing).
 */
export function ertPseudosection(
  layers: Layer1D[],
  nElectrodes: number,
  spacing: number,
  anomalies: Anomaly[] = [],
): Pseudosection {
  const levels = Math.min(Math.floor((nElectrodes - 1) / 3), 12);
  const aSpacings: number[] = [];
  for (let n = 1; n <= levels; n++) aSpacings.push(n * spacing);
  const layered = vesWenner(layers, aSpacings);

  const points: Pseudosection["points"] = [];
  for (let n = 1; n <= levels; n++) {
    const a = n * spacing;
    const base = layered[n - 1];
    for (let i = 0; i + 3 * n < nElectrodes; i++) {
      const xA = i * spacing;
      const xMid = xA + 1.5 * a;
      const zPseudo = 0.519 * a; // Wenner median depth of investigation (Edwards 1977)
      let rhoA = base;
      for (const an of anomalies) {
        // Sensitivity-weighted perturbation, strongest when the pseudo-point
        // sits inside the body; falls off as a Gaussian of the body radius +
        // the array's spatial resolution.
        const sigma = Math.max(an.radius, 0.5 * a);
        const dx = (xMid - an.x) / (sigma * 1.4);
        const dz = (zPseudo - an.depth) / sigma;
        const w = Math.exp(-(dx * dx + dz * dz));
        const contrast = Math.log(an.resistivity / rhoA);
        rhoA *= Math.exp(contrast * 0.7 * w * Math.min(1, (an.radius / (0.4 * a + an.depth * 0.3)) ** 1.5));
      }
      points.push({ x: xMid, z: zPseudo, rhoA, n });
    }
  }
  const vals = points.map((p) => p.rhoA);
  return {
    points, nElectrodes, spacing, levels,
    min: Math.min(...vals), max: Math.max(...vals),
  };
}

/* ------------------------------------------------------------------ */
/* Seismic refraction                                                  */
/* ------------------------------------------------------------------ */

export interface RefractionResult {
  /** For each geophone offset: first-arrival time (ms) and branch index (0 = direct). */
  offsets: number[];
  firstArrivals: number[];
  branch: number[];
  /** Full branch curves for plotting: branch[i][j] = time at offsets[j] (ms), NaN if not refracting. */
  branches: { label: string; v: number; times: (number | null)[]; intercept: number; crossover: number | null }[];
  hiddenLayers: number[]; // indices of layers invisible to first arrivals (velocity inversions)
}

/**
 * First-arrival travel times for a horizontally layered model.
 * Direct wave: t = x/v₁.
 * Head wave from the top of layer n (requires v_n greater than all layers above):
 *   t = x/v_n + Σ_{i<n} (2 h_i cos θ_i)/v_i, with sin θ_i = v_i/v_n.
 */
export function seismicRefraction(layers: Layer1D[], maxOffset: number, nGeophones = 48): RefractionResult {
  const v = layers.map((l) => Math.max(100, l.vp));
  const h = layers.slice(0, -1).map((l) => Math.max(0.1, l.thickness));
  const offsets = Array.from({ length: nGeophones }, (_, i) => ((i + 1) * maxOffset) / nGeophones);

  const branches: RefractionResult["branches"] = [
    { label: "Direct (v₁)", v: v[0], times: offsets.map((x) => (x / v[0]) * 1000), intercept: 0, crossover: null },
  ];
  const hiddenLayers: number[] = [];

  for (let nL = 1; nL < v.length; nL++) {
    const vn = v[nL];
    const above = v.slice(0, nL);
    if (vn <= Math.max(...above)) {
      hiddenLayers.push(nL);
      branches.push({ label: `Refractor ${nL} (v=${vn} m/s) — hidden`, v: vn, times: offsets.map(() => null), intercept: 0, crossover: null });
      continue;
    }
    let ti = 0;
    for (let i = 0; i < nL; i++) {
      const sinT = v[i] / vn;
      ti += (2 * h[i] * Math.sqrt(1 - sinT * sinT)) / v[i];
    }
    // Critical (crossover-eligible) distance: head wave only exists beyond xc.
    let xCrit = 0;
    for (let i = 0; i < nL; i++) {
      const sinT = v[i] / vn;
      xCrit += (2 * h[i] * sinT) / Math.sqrt(1 - sinT * sinT);
    }
    branches.push({
      label: `Refractor ${nL} (v=${Math.round(vn)} m/s)`,
      v: vn,
      times: offsets.map((x) => (x < xCrit ? null : (x / vn + ti) * 1000)),
      intercept: ti * 1000,
      crossover: null,
    });
  }

  const firstArrivals: number[] = [];
  const branch: number[] = [];
  offsets.forEach((x, j) => {
    let best = Infinity;
    let bi = 0;
    branches.forEach((b, i) => {
      const t = b.times[j];
      if (t !== null && t < best) { best = t; bi = i; }
    });
    firstArrivals.push(best);
    branch.push(bi);
  });

  // Crossover: first offset where a deeper branch takes over.
  for (let i = 1; i < branches.length; i++) {
    const j = branch.findIndex((b) => b === i);
    branches[i].crossover = j >= 0 ? offsets[j] : null;
  }

  return { offsets, firstArrivals, branch, branches, hiddenLayers };
}

/* ------------------------------------------------------------------ */
/* Ground-penetrating radar                                            */
/* ------------------------------------------------------------------ */

export const C_LIGHT = 0.2998; // m/ns

export interface GprTarget { x: number; depth: number; radius: number; label?: string }

export interface GprResult {
  /** Two-way travel time (ns) to the base of each layer (null if signal lost above). */
  interfaceTwt: (number | null)[];
  velocities: number[]; // m/ns per layer
  maxDepthReached: number; // m, where signal drops below threshold
  /** Radargram matrix [trace][sample], amplitude −1..1 */
  traces: number[][];
  nSamples: number;
  timeWindow: number; // ns
  nTraces: number;
  lineLength: number;
  frequency: number; // MHz
}

/** Ricker wavelet, f in MHz, t in ns. */
export function ricker(t: number, fMHz: number): number {
  const f = fMHz / 1000; // GHz = 1/ns
  const a = Math.PI * Math.PI * f * f * t * t;
  return (1 - 2 * a) * Math.exp(-a);
}

/**
 * Synthetic common-offset radargram over the layered model with optional
 * point targets (pipes / boulders / voids → diffraction hyperbolas).
 * Attenuation uses α ≈ 1.69·σ/√εr dB/m (low-loss approximation) with
 * σ = 1/ρ from the layer resistivity.
 */
export function gprSurvey(
  layers: Layer1D[],
  frequency: number, // MHz
  lineLength: number,
  targets: GprTarget[] = [],
  nTraces = 120,
  nSamples = 220,
): GprResult {
  const v = layers.map((l) => C_LIGHT / Math.sqrt(Math.max(1, l.epsilon))); // m/ns
  const h = layers.map((l) => Math.max(0.05, l.thickness));

  // attenuation per layer, dB/m
  const alpha = layers.map((l) => {
    const sigma = 1 / Math.max(1, l.resistivity); // S/m
    return 1690 * sigma / Math.sqrt(Math.max(1, l.epsilon)); // dB/m (1.69e3·σ/√εr)
  });

  // Interface TWTs and cumulative loss
  const interfaceTwt: (number | null)[] = [];
  let twt = 0;
  let lossDb = 0;
  let maxDepthReached = 0;
  let depth = 0;
  const reflCoef: number[] = [];
  for (let i = 0; i < layers.length - 1; i++) {
    twt += (2 * h[i]) / v[i];
    lossDb += 2 * h[i] * alpha[i];
    depth += h[i];
    const r =
      (Math.sqrt(layers[i].epsilon) - Math.sqrt(layers[i + 1].epsilon)) /
      (Math.sqrt(layers[i].epsilon) + Math.sqrt(layers[i + 1].epsilon));
    reflCoef.push(r);
    if (lossDb < 60) {
      interfaceTwt.push(twt);
      maxDepthReached = depth;
    } else {
      interfaceTwt.push(null);
    }
  }

  const timeWindow = Math.max(20, (interfaceTwt.filter((t) => t !== null).pop() ?? 20) * 1.4 + 12);
  const dt = timeWindow / nSamples;
  const traces: number[][] = [];

  for (let tr = 0; tr < nTraces; tr++) {
    const x = (tr / (nTraces - 1)) * lineLength;
    const trace = new Array(nSamples).fill(0);

    const addEvent = (t0: number, amp: number) => {
      const halfW = 1.2 * (1000 / frequency); // wavelet half-width in ns
      const j0 = Math.max(0, Math.floor((t0 - halfW) / dt));
      const j1 = Math.min(nSamples - 1, Math.ceil((t0 + halfW) / dt));
      for (let j = j0; j <= j1; j++) {
        trace[j] += amp * ricker(j * dt - t0, frequency);
      }
    };

    // Direct/ground wave
    addEvent(1.5, 0.9);

    // Layer interfaces (flat)
    let cumLoss = 0;
    let t = 0;
    for (let i = 0; i < interfaceTwt.length; i++) {
      t += (2 * h[i]) / v[i];
      cumLoss += 2 * h[i] * alpha[i];
      const a = reflCoef[i] * Math.pow(10, -cumLoss / 20);
      if (Math.abs(a) > 0.002) addEvent(t, a * 3);
    }

    // Point targets → hyperbolas
    for (const tg of targets) {
      // average velocity down to target
      let d = 0; let tt = 0; let loss = 0;
      for (let i = 0; i < layers.length && d < tg.depth; i++) {
        const seg = Math.min(h[i], tg.depth - d);
        tt += seg / v[i];
        loss += 2 * seg * alpha[i];
        d += seg;
      }
      const vAvg = tg.depth / Math.max(1e-6, tt); // m/ns one-way
      const dist = Math.sqrt(tg.depth ** 2 + (x - tg.x) ** 2);
      const t0 = (2 * dist) / vAvg;
      const geom = tg.depth / dist; // spherical spreading of the diffraction
      const a = 0.85 * geom * Math.pow(10, -loss / 20);
      if (a > 0.004) addEvent(t0, a * 2.5);
    }

    traces.push(trace);
  }

  return {
    interfaceTwt, velocities: v, maxDepthReached, traces,
    nSamples, timeWindow, nTraces, lineLength, frequency,
  };
}

/* ------------------------------------------------------------------ */
/* Gravity                                                             */
/* ------------------------------------------------------------------ */

const G_CONST = 6.674e-11;

export interface GravityBody { x: number; depth: number; radius: number; density: number } // g/cc

/**
 * Gravity anomaly profile (mGal) over buried sphere(s) against the background
 * density of the layer hosting each body:
 *   Δg = (4/3)πG Δρ R³ · z / (x² + z²)^{3/2}
 */
export function gravityProfile(
  layers: Layer1D[],
  bodies: GravityBody[],
  lineLength: number,
  nStations = 80,
): { x: number[]; g: number[] } {
  const x = Array.from({ length: nStations }, (_, i) => (i / (nStations - 1)) * lineLength);
  const g = x.map((xs) => {
    let sum = 0;
    for (const b of bodies) {
      const host = hostDensity(layers, b.depth);
      const dRho = (b.density - host) * 1000; // kg/m³
      const m = (4 / 3) * Math.PI * Math.pow(b.radius, 3) * dRho;
      const dx = xs - b.x;
      const r2 = dx * dx + b.depth * b.depth;
      sum += (G_CONST * m * b.depth) / Math.pow(r2, 1.5);
    }
    return sum * 1e5; // m/s² → mGal
  });
  return { x, g };
}

function hostDensity(layers: Layer1D[], depth: number): number {
  let d = 0;
  for (const l of layers) {
    d += l.thickness;
    if (depth < d) return l.density;
  }
  return layers[layers.length - 1].density;
}

/** Bouguer slab: Δg = 2πGΔρh in mGal, with Δρ in g/cc and h in m. */
export const bouguerSlab = (dRho: number, h: number) => 0.04193 * dRho * h;

/* ------------------------------------------------------------------ */
/* Magnetics                                                           */
/* ------------------------------------------------------------------ */

export interface MagneticBody { x: number; depth: number; radius: number; susceptibility: number } // SI ×10⁻³

/**
 * Total-field anomaly (nT) of buried sphere(s) magnetized by induction in a
 * vertical field (high magnetic latitude approximation):
 *   ΔT = (μ₀/4π) m (2z² − x²)/(x² + z²)^{5/2},  m = χ·H·V
 */
export function magneticProfile(
  layers: Layer1D[],
  bodies: MagneticBody[],
  lineLength: number,
  fieldNT = 48000,
  nStations = 80,
): { x: number[]; t: number[] } {
  const x = Array.from({ length: nStations }, (_, i) => (i / (nStations - 1)) * lineLength);
  const H = fieldNT / (4 * Math.PI * 1e-7) * 1e-9; // A/m
  const t = x.map((xs) => {
    let sum = 0;
    for (const b of bodies) {
      const hostChi = hostSusceptibility(layers, b.depth);
      const dChi = (b.susceptibility - hostChi) * 1e-3;
      const V = (4 / 3) * Math.PI * Math.pow(b.radius, 3);
      const m = dChi * H * V;
      const dx = xs - b.x;
      const z = b.depth;
      const r2 = dx * dx + z * z;
      sum += 1e-7 * m * (2 * z * z - dx * dx) / Math.pow(r2, 2.5) * 1e9; // Tesla → nT
    }
    return sum;
  });
  return { x, t };
}

function hostSusceptibility(layers: Layer1D[], depth: number): number {
  let d = 0;
  for (const l of layers) {
    d += l.thickness;
    if (depth < d) return l.susceptibility;
  }
  return layers[layers.length - 1].susceptibility;
}

/* ------------------------------------------------------------------ */
/* Frequency-domain EM                                                 */
/* ------------------------------------------------------------------ */

/** Skin depth δ = 503 √(ρ/f) in metres. */
export const skinDepth = (rho: number, freqHz: number) => 503 * Math.sqrt(rho / freqHz);

/**
 * Apparent conductivity sounding: at each frequency the instrument averages
 * the ground conductivity over roughly one skin depth, weighted by the
 * cumulative sensitivity function (McNeill 1980 style exponential kernel).
 */
export function emSounding(layers: Layer1D[], freqs: number[]): { freq: number[]; sigmaA: number[]; depth: number[] } {
  const sigmaA: number[] = [];
  const depth: number[] = [];
  for (const f of freqs) {
    // iterate: skin depth depends on the answer; two passes suffice
    let rhoEff = layers[0].resistivity;
    for (let pass = 0; pass < 3; pass++) {
      const d = skinDepth(rhoEff, f);
      // weighted harmonic mean of resistivity with exp(-2z/d) weighting
      let wSum = 0;
      let sSum = 0;
      let z = 0;
      const dz = d / 60;
      for (let i = 0; z < 3 * d && i < 600; i++) {
        const li = layerIndexAt(layers, z + dz / 2);
        const w = Math.exp((-2 * z) / d);
        wSum += w;
        sSum += w / Math.max(0.1, layers[li].resistivity);
        z += dz;
      }
      rhoEff = wSum / sSum;
    }
    sigmaA.push(1000 / rhoEff); // mS/m
    depth.push(skinDepth(rhoEff, f));
  }
  return { freq: freqs, sigmaA, depth };
}

function layerIndexAt(layers: Layer1D[], z: number): number {
  let d = 0;
  for (let i = 0; i < layers.length; i++) {
    d += layers[i].thickness;
    if (z < d) return i;
  }
  return layers.length - 1;
}

/* ------------------------------------------------------------------ */
/* Pseudo-log spacing helper                                           */
/* ------------------------------------------------------------------ */

export function logspace(a: number, b: number, n: number): number[] {
  const la = Math.log10(a);
  const lb = Math.log10(b);
  return Array.from({ length: n }, (_, i) => Math.pow(10, la + ((lb - la) * i) / (n - 1)));
}
