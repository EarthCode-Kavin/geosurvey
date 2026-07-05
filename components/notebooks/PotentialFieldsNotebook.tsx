"use client";

import { useMemo, useState } from "react";
import { NotebookLayout, Md, H2, CodeCell, FigureCell } from "./shell";
import { Slider, Quiz, Formula, InfoBox } from "@/components/ui";
import { LineChart } from "@/components/charts";

export default function PotentialFieldsNotebook() {
  return (
    <NotebookLayout
      badge="Notebook 04 · Potential fields"
      title="Gravity & magnetics: weighing and magnetizing the Earth"
      subtitle="Sphere anomalies, the half-width depth rule, and the ambiguity theorem — why potential-field data always needs a second opinion."
    >
      <Md>
        <p>
          Gravity and magnetics are <strong>passive</strong> methods: no source, no waves — you simply
          measure a field the Earth already provides and look for departures from the expected value.
          Both obey the same 1/r² physics, so they share interpretation rules — and the same fundamental
          weakness.
        </p>
      </Md>

      <H2>1 · The sphere anomaly — workhorse of teaching</H2>
      <Formula label="Gravity anomaly of a buried sphere (profile over its centre)">
        Δg(x) = (4/3)·π·G·Δρ·R³ · z / (x² + z²)^(3/2)
      </Formula>
      <SphereExplorer />

      <H2>2 · The half-width rule</H2>
      <Md>
        <p>
          For a sphere, the profile falls to half its peak at x½ ≈ 0.766·z. Inverted:{" "}
          <strong>z ≈ 1.3·x½</strong>. This is depth estimation with a ruler — no computer required,
          and it works because the anomaly <em>shape</em> depends only on depth, while its{" "}
          <em>amplitude</em> depends on everything else.
        </p>
      </Md>
      <CodeCell
        caption="half-width depth estimate"
        code={`# measured on the profile:
x_half = 10.4        # m, half-amplitude half-width

z = 1.305 * x_half
print(f"estimated source depth z = {z:.1f} m")

# amplitude then constrains the mass (NOT R and drho separately):
# dg_max = 4/3*pi*G*drho*R^3 / z^2   ->  drho*R^3 = known`}
        compute={() => `estimated source depth z = ${(1.305 * 10.4).toFixed(1)} m`}
      />

      <H2>3 · The ambiguity theorem — the humbling part</H2>
      <AmbiguityDemo />
      <Md>
        <p>
          Two completely different bodies, one indistinguishable curve. Green&apos;s theorem guarantees
          this: <strong>infinitely many density distributions produce identical external fields</strong>.
          Potential-field interpretation therefore always imports outside knowledge — drilling, seismic,
          geology — to collapse the ambiguity. Anyone who sells you &quot;the&quot; gravity model without
          constraints is selling art, not science.
        </p>
      </Md>

      <H2>4 · Check yourself</H2>
      <Quiz
        question="A magnetic anomaly is 40 m wide at half its amplitude. Roughly how deep is the compact source?"
        options={["~4 m", "~20–26 m", "~80 m", "Cannot say without susceptibility"]}
        correct={1}
        explanation="Half-width ≈ source depth for dipole-like bodies (z ≈ 1.3·x½ for a sphere; x½ here ≈ 20 m). Susceptibility controls amplitude, not shape — depth comes free from geometry."
      />
      <Quiz
        question="Which target is a job for microgravity rather than magnetics?"
        options={[
          "A buried steel drum",
          "An air-filled limestone cavity",
          "A dolerite dyke",
          "An archaeological kiln",
        ]}
        correct={1}
        explanation="An air void has a strong density deficit but no magnetic contrast in limestone. Steel, dolerite and fired clay are all magnetic targets. Gravity is the only method that senses missing mass directly."
      />
      <InfoBox kind="tip" title="Corrections are the real work">
        In field gravity, the anomaly you seek (tens of µGal) is buried under corrections thousands of
        times larger: −0.3086 mGal per metre of elevation (free-air), +0.0419·ρ mGal/m (Bouguer), tides,
        drift, latitude. Gravity surveying is 10% measuring and 90% correcting.
      </InfoBox>
    </NotebookLayout>
  );
}

/* ------------------------------------------------------------------ */

const G = 6.674e-11;

function sphereProfile(xs: number[], z: number, R: number, dRho: number): number[] {
  return xs.map((x) => {
    const m = (4 / 3) * Math.PI * R ** 3 * dRho * 1000;
    return ((G * m * z) / Math.pow(x * x + z * z, 1.5)) * 1e5; // mGal
  });
}

function SphereExplorer() {
  const [z, setZ] = useState(10);
  const [R, setR] = useState(4);
  const [dRho, setDRho] = useState(-1.8); // cavity in limestone

  const xs = useMemo(() => Array.from({ length: 101 }, (_, i) => -60 + (i * 120) / 100), []);
  const g = useMemo(() => sphereProfile(xs, z, R, dRho), [xs, z, R, dRho]);
  const peak = Math.max(...g.map(Math.abs));
  const halfWidth = 0.766 * z;

  return (
    <FigureCell title="Gravity anomaly of a buried sphere — drag depth, radius, contrast">
      <div className="grid gap-3 md:grid-cols-3">
        <Slider label="Depth z" value={z} onChange={setZ} min={3} max={40} step={0.5} unit="m" />
        <Slider label="Radius R" value={R} onChange={setR} min={1} max={10} step={0.25} unit="m" />
        <Slider label="Density contrast Δρ" value={dRho} onChange={setDRho} min={-2.5} max={2.5} step={0.1} unit="g/cc" />
      </div>
      <LineChart
        series={[
          { x: xs, y: g, color: "#60a5fa", label: "Δg profile" },
          { x: [-halfWidth, -halfWidth], y: [0, dRho >= 0 ? peak / 2 : -peak / 2], color: "#f5b942", dash: "3 3", width: 1, label: `x½ = 0.77·z = ${halfWidth.toFixed(1)} m` },
          { x: [halfWidth, halfWidth], y: [0, dRho >= 0 ? peak / 2 : -peak / 2], color: "#f5b942", dash: "3 3", width: 1 },
        ]}
        height={280} xLabel="distance from body centre (m)" yLabel="Δg (mGal)"
      />
      <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted">
        <span>peak |Δg| = <span className="font-[family-name:var(--font-mono)] text-accent">{(peak * 1000).toFixed(1)} µGal</span></span>
        <span>survey noise floor ≈ 5 µGal → {peak * 1000 < 5 ? <span className="text-bad">invisible!</span> : <span className="text-good">detectable</span>}</span>
        <span>amplitude ∝ Δρ·R³/z² — depth is brutal</span>
      </div>
    </FigureCell>
  );
}

/* ------------------------------------------------------------------ */

function AmbiguityDemo() {
  const xs = useMemo(() => Array.from({ length: 101 }, (_, i) => -60 + (i * 120) / 100), []);
  // Model A: small shallow sphere
  const gA = useMemo(() => sphereProfile(xs, 8, 3, 1.0), [xs]);
  // Model B: bigger deeper sphere tuned to nearly the same peak: amplitude ∝ ΔρR³/z²
  // peak_A ∝ 1.0·27/64; choose z=16 → need ΔρR³ = 27/64·256 = 108 → R³=108, R≈4.76 at Δρ=1
  const gB = useMemo(() => sphereProfile(xs, 16, Math.cbrt(108), 1.0), [xs]);

  return (
    <FigureCell title="Two very different bodies — nearly one curve">
      <LineChart
        series={[
          { x: xs, y: gA, color: "#4fd1c5", label: "Model A: R=3 m sphere at z=8 m" },
          { x: xs, y: gB, color: "#f472b6", dash: "6 4", label: "Model B: R=4.8 m sphere at z=16 m" },
        ]}
        height={260} xLabel="distance (m)" yLabel="Δg (mGal)"
      />
      <p className="mt-1 text-xs text-muted">
        Peaks match by construction (Δρ·R³/z² equal); only the subtle limb shape differs — and field noise
        would erase that distinction entirely. Add realistic noise of ±5 µGal and the two models are
        formally indistinguishable.
      </p>
    </FigureCell>
  );
}
