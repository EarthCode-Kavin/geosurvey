"use client";

/**
 * Result panels for each survey method: parameter controls + live synthetic
 * data computed from the user's ground model.
 */

import { useEffect, useMemo, useState } from "react";
import type { GroundLayer } from "@/lib/materials";
import {
  Layer1D, vesSchlumberger, vesWenner, logspace, ertPseudosection, Anomaly,
  seismicRefraction, gprSurvey, gravityProfile, magneticProfile, emSounding, skinDepth,
} from "@/lib/geophysics";
import { LineChart, CanvasHeatmap, ColorBar, resistivityColor, rgbCss, fmtSI, linScale, logScale } from "@/components/charts";
import { Slider, Select, Stat, InfoBox } from "@/components/ui";

export const toLayer1D = (layers: GroundLayer[]): Layer1D[] =>
  layers.map((l) => ({
    thickness: l.thickness, resistivity: l.resistivity, vp: l.vp,
    density: l.density, epsilon: l.epsilon, susceptibility: l.susceptibility,
  }));

/* ================================================================== */
/* VES                                                                 */
/* ================================================================== */

export function VesPanel({ layers }: { layers: GroundLayer[] }) {
  const [array, setArray] = useState<"schlumberger" | "wenner">("schlumberger");
  const [maxAb, setMaxAb] = useState(200);

  const { spacings, rhoA } = useMemo(() => {
    const sp = logspace(1, maxAb, 24);
    const model = toLayer1D(layers);
    return { spacings: sp, rhoA: array === "schlumberger" ? vesSchlumberger(model, sp) : vesWenner(model, sp) };
  }, [layers, array, maxAb]);

  const curveType = useMemo(() => classifyCurve(layers), [layers]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Select label="Electrode array" value={array} onChange={setArray}
          options={[{ value: "schlumberger", label: "Schlumberger" }, { value: "wenner", label: "Wenner" }]} />
        <Slider label={array === "schlumberger" ? "Max AB/2" : "Max a-spacing"} value={maxAb}
          onChange={setMaxAb} min={20} max={1000} log unit="m" />
      </div>

      <LineChart
        series={[{ x: spacings, y: rhoA, color: "#f5b942", label: "sounding curve ρₐ", points: true }]}
        logX logY height={330}
        xLabel={array === "schlumberger" ? "AB/2 (m)  — larger spacing senses deeper" : "a-spacing (m)"}
        yLabel="Apparent resistivity ρₐ (Ω·m)"
        title="VES sounding curve (synthetic, exact 1-D forward model)"
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Shallow ρₐ" value={fmtSI(rhoA[0])} unit="Ω·m" />
        <Stat label="Deep ρₐ →" value={fmtSI(rhoA[rhoA.length - 1])} unit="Ω·m" />
        <Stat label="Layers" value={layers.length} />
        {curveType && <Stat label="Curve type" value={curveType} tone="good" />}
      </div>

      <InfoBox kind="physics" title="Reading this curve">
        The left end approaches the resistivity of your first layer ({fmtSI(layers[0].resistivity)} Ω·m);
        the right end climbs or falls toward the basement ({fmtSI(layers[layers.length - 1].resistivity)} Ω·m).
        Each inflection marks a layer boundary — but its position on the AB/2 axis is roughly 2–6× the
        actual depth, never equal to it. {curveType && <>With three layers, this shape is a classic
        <strong> type-{curveType}</strong> curve.</>}
      </InfoBox>
    </div>
  );
}

function classifyCurve(layers: GroundLayer[]): string | null {
  if (layers.length !== 3) return null;
  const [r1, r2, r3] = layers.map((l) => l.resistivity);
  if (r1 > r2 && r2 < r3) return "H";
  if (r1 < r2 && r2 < r3) return "A";
  if (r1 < r2 && r2 > r3) return "K";
  if (r1 > r2 && r2 > r3) return "Q";
  return null;
}

/* ================================================================== */
/* ERT                                                                 */
/* ================================================================== */

export function ErtPanel({ layers }: { layers: GroundLayer[] }) {
  const [nElec, setNElec] = useState(48);
  const [spacing, setSpacing] = useState(2);
  const [anomalyOn, setAnomalyOn] = useState(true);
  const [anRes, setAnRes] = useState(10);
  const [anX, setAnX] = useState(45);
  const [anDepth, setAnDepth] = useState(8);
  const [anR, setAnR] = useState(4);
  const [revealed, setRevealed] = useState(1);

  const pseudo = useMemo(() => {
    const an: Anomaly[] = anomalyOn ? [{ x: anX, depth: anDepth, radius: anR, resistivity: anRes }] : [];
    return ertPseudosection(toLayer1D(layers), nElec, spacing, an);
  }, [layers, nElec, spacing, anomalyOn, anRes, anX, anDepth, anR]);

  // scanning animation: progressively reveal measurements
  useEffect(() => {
    setRevealed(0);
    let i = 0;
    const id = setInterval(() => {
      i += Math.max(4, Math.round(pseudo.points.length / 60));
      setRevealed(i);
      if (i >= pseudo.points.length) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [pseudo]);

  const lineLength = (nElec - 1) * spacing;
  const maxZ = Math.max(...pseudo.points.map((p) => p.z)) * 1.15;
  const W = 620, H = 300, ml = 46, mt = 26, mr = 14, mb = 40;
  const sx = linScale(0, lineLength, ml, W - mr);
  const sz = linScale(0, maxZ, mt, H - mb);
  const lmin = Math.log10(pseudo.min);
  const lmax = Math.log10(Math.max(pseudo.max, pseudo.min * 1.2));
  const tOf = (v: number) => (Math.log10(v) - lmin) / (lmax - lmin || 1);
  const cell = Math.max(4, (sx(3 * spacing) - sx(0)) / 3.1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Slider label="Electrodes" value={nElec} onChange={(v) => setNElec(Math.round(v))} min={24} max={96} step={8} />
        <Slider label="Spacing a" value={spacing} onChange={setSpacing} min={0.5} max={5} step={0.5} unit="m" />
        <div className="col-span-2 flex items-end gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={anomalyOn} onChange={(e) => setAnomalyOn(e.target.checked)}
              className="h-4 w-4 accent-[#f5b942]" />
            Bury a target body
          </label>
        </div>
      </div>
      {anomalyOn && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-panel-2 p-3 md:grid-cols-4">
          <Slider label="Body position x" value={anX} onChange={setAnX} min={5} max={lineLength - 5} step={1} unit="m" />
          <Slider label="Body depth" value={anDepth} onChange={setAnDepth} min={1} max={maxZ} step={0.5} unit="m" />
          <Slider label="Body radius" value={anR} onChange={setAnR} min={1} max={10} step={0.5} unit="m" />
          <Slider label="Body resistivity" value={anRes} onChange={setAnRes} min={1} max={10000} log unit="Ω·m" />
        </div>
      )}

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <text x={W / 2} y={14} textAnchor="middle" fill="#dbe4f5" fontSize="12" fontWeight="600">
          Wenner pseudosection — {pseudo.points.length} measurements, {pseudo.levels} depth levels
        </text>
        {pseudo.points.slice(0, revealed).map((p, i) => (
          <rect key={i}
            x={sx(p.x) - cell / 2} y={sz(p.z) - cell / 2}
            width={cell} height={cell} rx={1.5}
            fill={rgbCss(resistivityColor(tOf(p.rhoA)))}
          >
            <title>{`x=${p.x.toFixed(1)} m, pseudo-z=${p.z.toFixed(1)} m, ρₐ=${p.rhoA.toFixed(1)} Ω·m (level n=${p.n})`}</title>
          </rect>
        ))}
        {/* electrodes */}
        {Array.from({ length: nElec }, (_, i) => (
          <circle key={i} cx={sx(i * spacing)} cy={mt - 6} r="1.6" fill="#f5b942" />
        ))}
        {/* buried body outline (truth) */}
        {anomalyOn && (
          <circle cx={sx(anX)} cy={sz(anDepth)} r={Math.abs(sz(anR) - sz(0))} fill="none"
            stroke="#ffffff" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.75" />
        )}
        <text x={ml - 6} y={sz(0) + 3} textAnchor="end" fontSize="9" fill="#8b9ab8">0</text>
        <text x={ml - 6} y={sz(maxZ) + 3} textAnchor="end" fontSize="9" fill="#8b9ab8">{maxZ.toFixed(0)}</text>
        <text x={12} y={(mt + H - mb) / 2} textAnchor="middle" fontSize="10" fill="#8b9ab8"
          transform={`rotate(-90 12 ${(mt + H - mb) / 2})`}>pseudo-depth (m)</text>
        <text x={(ml + W - mr) / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="#8b9ab8">
          distance along line (m) — line length {lineLength} m
        </text>
      </svg>
      <ColorBar min={pseudo.min} max={pseudo.max} label="apparent resistivity (Ω·m)" />

      <InfoBox kind="warn" title="A pseudosection is not a geological section">
        Values are plotted at a conventional pseudo-depth (0.52·a for Wenner) and are volume averages —
        shapes are smeared and pulled toward the surface. The white dashed circle shows where your body
        *really* is; note how the coloured anomaly sits shallower and wider. Real surveys run an
        <em> inversion</em> to recover the true geometry.
      </InfoBox>
    </div>
  );
}

/* ================================================================== */
/* Seismic                                                             */
/* ================================================================== */

export function SeismicPanel({ layers }: { layers: GroundLayer[] }) {
  const [maxOffset, setMaxOffset] = useState(120);
  const res = useMemo(() => seismicRefraction(toLayer1D(layers), maxOffset), [layers, maxOffset]);

  const palette = ["#8b9ab8", "#4fd1c5", "#f5b942", "#f472b6", "#60a5fa", "#34d399", "#a78bfa"];
  const series = res.branches.map((b, i) => ({
    x: res.offsets, y: b.times, color: palette[i % palette.length],
    label: b.label, dash: i === 0 ? undefined : "5 4", width: 1.4,
  }));
  series.push({
    x: res.offsets, y: res.firstArrivals.map((v) => v), color: "#ffffff",
    label: "first arrivals (what you pick)", dash: undefined, width: 2.4,
  });

  return (
    <div className="space-y-4">
      <Slider label="Spread length (max geophone offset)" value={maxOffset} onChange={setMaxOffset}
        min={30} max={500} step={10} unit="m" />
      <LineChart series={series} height={340}
        xLabel="offset x (m)" yLabel="travel time (ms)"
        title="Travel-time curves — slope = 1/velocity" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {res.branches.slice(0, 4).map((b, i) => (
          <Stat key={i} label={i === 0 ? "v₁ (direct)" : `v${i + 1} ${b.crossover ? `· xover ${b.crossover.toFixed(0)} m` : ""}`}
            value={fmtSI(b.v)} unit="m/s"
            tone={res.hiddenLayers.includes(i) ? "bad" : "default"} />
        ))}
      </div>
      {res.hiddenLayers.length > 0 && (
        <InfoBox kind="warn" title="Hidden layer!">
          Layer{res.hiddenLayers.length > 1 ? "s" : ""} {res.hiddenLayers.map((i) => i + 1).join(", ")} ha
          {res.hiddenLayers.length > 1 ? "ve" : "s"} lower velocity than a layer above — no refracted first
          arrival is ever produced, so refraction alone cannot see {res.hiddenLayers.length > 1 ? "them" : "it"}.
          This is the classic <em>velocity-inversion problem</em>: depths computed below this layer will be wrong.
          (This is why engineers pair refraction with boreholes.)
        </InfoBox>
      )}
      <InfoBox kind="physics" title="How to read it">
        Each straight branch belongs to one layer; its slope is 1/velocity. The <strong>crossover
        distance</strong> is where a deeper, faster refractor overtakes the direct wave — beyond it, first
        arrivals carry deep information. Intercept times (extrapolating each branch to x = 0) give layer
        thicknesses via tᵢ = Σ 2h·cosθc/v. Try shortening the spread: deep refractors vanish from the data.
      </InfoBox>
    </div>
  );
}

/* ================================================================== */
/* GPR                                                                 */
/* ================================================================== */

const grayMap = (t: number): [number, number, number] => {
  const v = Math.round(255 * Math.max(0, Math.min(1, t)));
  return [v, v, v];
};

export function GprPanel({ layers }: { layers: GroundLayer[] }) {
  const [freq, setFreq] = useState<"100" | "250" | "500" | "1000">("250");
  const [pipeOn, setPipeOn] = useState(true);
  const [pipeX, setPipeX] = useState(12);
  const [pipeD, setPipeD] = useState(1.5);
  const lineLength = 24;

  const res = useMemo(() => {
    const targets = pipeOn ? [{ x: pipeX, depth: pipeD, radius: 0.2, label: "pipe" }] : [];
    return gprSurvey(toLayer1D(layers), parseInt(freq), lineLength, targets);
  }, [layers, freq, pipeOn, pipeX, pipeD]);

  const img = useMemo(() => {
    // normalize traces to 0..1 with gain curve (deeper = more gain)
    let maxAmp = 1e-9;
    res.traces.forEach((tr) => tr.forEach((v, j) => {
      const g = 1 + (3.5 * j) / tr.length;
      maxAmp = Math.max(maxAmp, Math.abs(v * g));
    }));
    return res.traces.map((tr) =>
      tr.map((v, j) => {
        const g = 1 + (3.5 * j) / tr.length;
        return 0.5 + (0.5 * (v * g)) / maxAmp;
      }),
    );
  }, [res]);

  const wavelength = useMemo(() => {
    const v = res.velocities[0]; // m/ns
    return (v / (parseInt(freq) / 1000)); // m
  }, [res, freq]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Select label="Antenna frequency" value={freq} onChange={setFreq}
          options={[
            { value: "100", label: "100 MHz — deep, coarse" },
            { value: "250", label: "250 MHz — balanced" },
            { value: "500", label: "500 MHz — shallow, sharp" },
            { value: "1000", label: "1 GHz — concrete scanning" },
          ]} />
        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={pipeOn} onChange={(e) => setPipeOn(e.target.checked)}
              className="h-4 w-4 accent-[#a78bfa]" />
            Bury a pipe
          </label>
        </div>
        {pipeOn && <Slider label="Pipe position" value={pipeX} onChange={setPipeX} min={2} max={lineLength - 2} step={0.5} unit="m" />}
        {pipeOn && <Slider label="Pipe depth" value={pipeD} onChange={setPipeD} min={0.4} max={6} step={0.1} unit="m" />}
      </div>

      <div className="rounded-xl border border-line bg-black/40 p-3">
        <div className="mb-1 flex justify-between text-[11px] text-muted">
          <span>0 m</span><span className="text-fg">Radargram — {freq} MHz common-offset profile</span><span>{lineLength} m</span>
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col justify-between py-0.5 text-right font-[family-name:var(--font-mono)] text-[10px] text-muted">
            <span>0</span>
            <span>{(res.timeWindow / 2).toFixed(0)}</span>
            <span>{res.timeWindow.toFixed(0)} ns</span>
          </div>
          <CanvasHeatmap data={img} width={res.nTraces} height={res.nSamples} colorFn={grayMap} className="rounded" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="v (top layer)" value={(res.velocities[0] * 1000).toFixed(0)} unit="mm/ns" />
        <Stat label="Wavelength λ" value={wavelength.toFixed(2)} unit="m" />
        <Stat label="Resolution ≈ λ/4" value={(wavelength / 4 * 100).toFixed(0)} unit="cm" />
        <Stat label="Penetration" value={res.maxDepthReached.toFixed(1)} unit="m"
          tone={res.maxDepthReached < 2 ? "warn" : "good"} />
      </div>

      {res.maxDepthReached < 3 && (
        <InfoBox kind="warn" title="Signal absorbed">
          Conductive layers (clay, saline moisture) eat radar energy — attenuation α ≈ 1690·σ/√εr dB/m.
          Below ~{res.maxDepthReached.toFixed(1)} m your signal is gone. No antenna choice fixes this:
          it is physics, not equipment. Swap clay for sand in your model and watch the penetration recover.
        </InfoBox>
      )}
      <InfoBox kind="physics" title="Why the pipe makes a hyperbola">
        The antenna records the pipe long before and after passing directly over it — at slant distance
        √(d² + Δx²). Plotting that distance as time creates the hyperbola t(x) = (2/v)·√(d² + (x−x₀)²).
        Its curvature depends only on velocity, which is why analysts fit hyperbolas to calibrate v.
      </InfoBox>
    </div>
  );
}

/* ================================================================== */
/* Magnetics                                                           */
/* ================================================================== */

export function MagneticPanel({ layers }: { layers: GroundLayer[] }) {
  const [bodyX, setBodyX] = useState(50);
  const [bodyD, setBodyD] = useState(6);
  const [bodyR, setBodyR] = useState(2);
  const [chi, setChi] = useState(150); // ×10⁻³ SI — e.g. steel/magnetite-rich
  const lineLength = 100;

  const prof = useMemo(
    () => magneticProfile(toLayer1D(layers), [{ x: bodyX, depth: bodyD, radius: bodyR, susceptibility: chi }], lineLength),
    [layers, bodyX, bodyD, bodyR, chi],
  );
  const peak = Math.max(...prof.t.map(Math.abs));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Slider label="Body position" value={bodyX} onChange={setBodyX} min={10} max={90} step={1} unit="m" />
        <Slider label="Body depth" value={bodyD} onChange={setBodyD} min={1} max={30} step={0.5} unit="m" />
        <Slider label="Body radius" value={bodyR} onChange={setBodyR} min={0.5} max={8} step={0.25} unit="m" />
        <Slider label="Susceptibility χ" value={chi} onChange={setChi} min={1} max={1000} log unit="×10⁻³" />
      </div>
      <LineChart
        series={[{ x: prof.x, y: prof.t, color: "#f472b6", label: "total-field anomaly ΔT", points: false }]}
        height={300} xLabel="distance along line (m)" yLabel="ΔT (nT)"
        title="Magnetic profile over a buried magnetized body (vertical-field dipole)" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Peak anomaly" value={peak > 10 ? peak.toFixed(0) : peak.toFixed(2)} unit="nT"
          tone={peak < 5 ? "warn" : "good"} />
        <Stat label="Earth's field" value="≈48,000" unit="nT" />
        <Stat label="Half-width ≈ depth" value={bodyD.toFixed(1)} unit="m" />
      </div>
      <InfoBox kind="physics" title="Depth from shape">
        For a compact (dipole-like) source, the anomaly's half-width approximately equals the source
        depth — double the depth and the anomaly becomes twice as wide and 8× weaker (1/z³). Sharp
        narrow spikes are always shallow. Amplitude scales with χ·R³, so a small shallow drum and a
        large deep magnetite body can look identical: this is the fundamental ambiguity of potential fields.
      </InfoBox>
    </div>
  );
}

/* ================================================================== */
/* Gravity                                                             */
/* ================================================================== */

export function GravityPanel({ layers }: { layers: GroundLayer[] }) {
  const [bodyX, setBodyX] = useState(50);
  const [bodyD, setBodyD] = useState(8);
  const [bodyR, setBodyR] = useState(4);
  const [bodyRho, setBodyRho] = useState(0.0); // g/cc — 0 = air cavity
  const lineLength = 100;

  const prof = useMemo(
    () => gravityProfile(toLayer1D(layers), [{ x: bodyX, depth: bodyD, radius: bodyR, density: bodyRho }], lineLength),
    [layers, bodyX, bodyD, bodyR, bodyRho],
  );
  const peak = Math.max(...prof.g.map(Math.abs));
  const uGal = peak * 1000;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Slider label="Body position" value={bodyX} onChange={setBodyX} min={10} max={90} step={1} unit="m" />
        <Slider label="Body depth" value={bodyD} onChange={setBodyD} min={2} max={40} step={0.5} unit="m" />
        <Slider label="Body radius" value={bodyR} onChange={setBodyR} min={1} max={12} step={0.5} unit="m" />
        <Slider label="Body density" value={bodyRho} onChange={setBodyRho} min={0} max={4} step={0.1} unit="g/cc" />
      </div>
      <LineChart
        series={[{ x: prof.x, y: prof.g, color: "#60a5fa", label: "gravity anomaly Δg" }]}
        height={300} xLabel="distance along line (m)" yLabel="Δg (mGal)"
        title="Gravity profile — buried sphere vs. host density" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Peak |Δg|" value={peak.toExponential(1)} unit="mGal" />
        <Stat label="= " value={uGal > 1 ? uGal.toFixed(1) : uGal.toFixed(3)} unit="µGal"
          tone={uGal < 5 ? "bad" : uGal < 20 ? "warn" : "good"} />
        <Stat label="Detectable?" value={uGal < 5 ? "No (< 5 µGal)" : uGal < 20 ? "Marginal" : "Yes"}
          tone={uGal < 5 ? "bad" : uGal < 20 ? "warn" : "good"} />
      </div>
      <InfoBox kind="physics" title="Mass is everything">
        Δg = (4/3)πG·Δρ·R³ · z/(x²+z²)^(3/2). Set the body density to ~0 g/cc to simulate an air-filled
        cavity — the anomaly flips negative (a mass <em>deficit</em>). Modern field gravimeters resolve
        roughly 5 µGal in good conditions: notice how quickly a cavity becomes undetectable with depth —
        amplitude falls as 1/z². That's why microgravity cavity surveys demand shallow targets and
        millimetre-level elevation control.
      </InfoBox>
    </div>
  );
}

/* ================================================================== */
/* EM                                                                  */
/* ================================================================== */

export function EmPanel({ layers }: { layers: GroundLayer[] }) {
  const freqs = useMemo(() => logspace(400, 100000, 22), []);
  const res = useMemo(() => emSounding(toLayer1D(layers), freqs), [layers, freqs]);

  const d1 = skinDepth(layers[0].resistivity, 10000);

  return (
    <div className="space-y-4">
      <LineChart
        series={[{ x: res.freq, y: res.sigmaA, color: "#34d399", label: "apparent conductivity σₐ", points: true }]}
        logX height={300}
        xLabel="frequency (Hz) — lower frequency senses deeper"
        yLabel="σₐ (mS/m)"
        title="Frequency-domain EM sounding" />
      <LineChart
        series={[{ x: res.freq, y: res.depth, color: "#a7f3d0", label: "skin depth δ = 503·√(ρ/f)", points: true }]}
        logX logY height={240}
        xLabel="frequency (Hz)" yLabel="skin depth (m)" />
      <div className="grid grid-cols-2 gap-3">
        <Stat label="σₐ at 10 kHz" value={fmtSI(res.sigmaA[Math.floor(freqs.length * 0.7)] ?? 0)} unit="mS/m" />
        <Stat label="δ (top layer, 10 kHz)" value={fmtSI(d1)} unit="m" />
      </div>
      <InfoBox kind="physics" title="The skin-depth rule">
        Alternating fields decay exponentially in conductors: δ = 503·√(ρ/f) metres. In 25 Ω·m clay at
        10 kHz, δ ≈ 25 m; in 2500 Ω·m granite it is 250 m. Reading the σₐ curve from right (high f,
        shallow) to left (low f, deep) is reading your model from top to bottom — watch the curve bend
        toward the conductivity of each successive layer.
      </InfoBox>
    </div>
  );
}
