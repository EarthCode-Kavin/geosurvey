"use client";

import { useMemo, useState } from "react";
import { NotebookLayout, Md, H2, CodeCell, FigureCell } from "./shell";
import { Slider, Quiz, Formula, InfoBox } from "@/components/ui";
import { LineChart } from "@/components/charts";
import { vesTwoLayerExact, logspace, wennerK, schlumbergerK } from "@/lib/geophysics";

export default function ResistivityNotebook() {
  return (
    <NotebookLayout
      badge="Notebook 01 · Electrical methods"
      title="How electricity reads the ground"
      subtitle="From Ohm's law to a sounding curve you can interpret: current flow in a half-space, apparent resistivity, geometric factors, and the two-layer master curves."
    >
      <Md>
        <p>
          Every electrical survey is the same experiment: <strong>push a known current I into the ground,
          measure the voltage ΔV it creates somewhere else</strong>. Dry sand resists the current; wet clay
          welcomes it. The ratio ΔV/I, scaled by geometry, is the ground telling you what it is made of.
        </p>
      </Md>

      <H2>1 · Resistivity is a material property</H2>
      <Md>
        <p>
          Resistivity ρ (Ω·m) is resistance normalized by shape — an intrinsic property, like density.
          The span in nature is enormous: <em>five orders of magnitude</em>, which is exactly why the
          method works so well.
        </p>
      </Md>
      <ResistivitySpectrum />

      <H2>2 · A point of current in a half-space</H2>
      <Md>
        <p>
          Current from a single electrode spreads through hemispherical shells of area 2πr².
          Integrating Ohm&apos;s law across the shells gives the potential at distance r:
        </p>
      </Md>
      <Formula label="Potential around a current electrode on a homogeneous half-space">
        V(r) = ρ·I / (2π·r)
      </Formula>
      <CodeCell
        caption="potential vs distance"
        code={`import numpy as np

rho, I = 100.0, 0.5          # ohm-m, amperes
r = np.array([1, 2, 5, 10, 20])   # metres
V = rho * I / (2 * np.pi * r)
for ri, vi in zip(r, V):
    print(f"r = {ri:>4} m   V = {vi*1000:7.1f} mV")`}
        compute={() => {
          const rho = 100, I = 0.5;
          return [1, 2, 5, 10, 20]
            .map((r) => `r = ${String(r).padStart(4)} m   V = ${((rho * I) / (2 * Math.PI * r) * 1000).toFixed(1).padStart(7)} mV`)
            .join("\n");
        }}
      />
      <Md>
        <p>
          Notice the 1/r fall-off — most of the voltage drop happens <strong>near the electrodes</strong>.
          That is why electrode contact matters so much in the field, and why we use four electrodes:
          two to carry current (A, B), two to sense voltage (M, N) where no current flows through the contacts.
        </p>
      </Md>

      <H2>3 · The geometric factor K</H2>
      <Md>
        <p>
          For any four-electrode arrangement, superposing the potentials of A (+I) and B (−I) at M and N
          gives ΔV. Rearranged for resistivity:
        </p>
      </Md>
      <Formula label="Apparent resistivity — the central formula of resistivity surveying">
        ρₐ = K · ΔV / I,&nbsp;&nbsp;&nbsp;K = 2π / (1/AM − 1/BM − 1/AN + 1/BN)
      </Formula>
      <CodeCell
        caption="geometric factors of the classic arrays (ported from the original GeoSurvey engine)"
        code={`import numpy as np

def wenner_K(a):                 # A--a--M--a--N--a--B
    return 2 * np.pi * a

def schlumberger_K(AB2, MN2):    # symmetric, MN << AB
    return np.pi * AB2**2 / (2 * MN2)

print("Wenner a=10 m:        K =", round(wenner_K(10.0), 1), "m")
print("Schlumberger 50/2 m:  K =", round(schlumberger_K(50.0, 2.0), 1), "m")`}
        compute={() =>
          `Wenner a=10 m:        K = ${wennerK(10).toFixed(1)} m\n` +
          `Schlumberger 50/2 m:  K = ${schlumbergerK(50, 2).toFixed(1)} m`}
      />
      <Md>
        <p>
          On homogeneous ground, ρₐ equals the true ρ — always. On layered ground it becomes a weighted
          average of everything the current touched, hence <em>apparent</em> resistivity. The art of
          interpretation is un-mixing that average.
        </p>
      </Md>

      <H2>4 · The two-layer sounding curve — play with it</H2>
      <Md>
        <p>
          Expand the electrode spacing and current probes deeper. The exact response of a two-layer earth
          (via the image-series solution) is below. <strong>Drag the sliders</strong> and build intuition:
        </p>
      </Md>
      <TwoLayerExplorer />

      <H2>5 · Check yourself</H2>
      <Quiz
        question="A Schlumberger sounding shows ρₐ ≈ 300 Ω·m at small AB/2, falling steadily to ≈ 25 Ω·m at large AB/2. The most likely geology is…"
        options={[
          "Wet clay over dry sand",
          "Dry sand over wet clay",
          "Homogeneous granite",
          "A vertical fault beside the array",
        ]}
        correct={1}
        explanation="Small spacings sample shallow ground (resistive ≈ 300 Ω·m → dry sand); large spacings average in the deep conductor (≈ 25 Ω·m → clay). A falling curve means resistive over conductive."
      />
      <Quiz
        question="Doubling AB/2 doubles the depth of investigation."
        options={[
          "True — depth equals AB/2",
          "Roughly true in trend, but depth is nearer AB/4–AB/6 and depends on the layering itself",
        ]}
        correct={1}
        explanation="Depth of investigation grows with spacing but is not equal to it; for typical layering the median depth sensed is roughly a quarter of AB/2's span, and conductive overburden shrinks it further."
      />
      <InfoBox kind="tip" title="Where next">
        Open the Geophysics Lab, build a three-layer model, and identify H, K, A and Q curve types on
        the VES panel — then find the equivalence problem by fitting two different models to the same curve.
      </InfoBox>
    </NotebookLayout>
  );
}

/* ------------------------------------------------------------------ */

function ResistivitySpectrum() {
  const items: [string, number, number, string][] = [
    ["Seawater", 0.2, 1, "#38bdf8"],
    ["Clay", 5, 60, "#8c6f56"],
    ["Groundwater", 10, 100, "#4fd1c5"],
    ["Silt / loam", 20, 200, "#a58a68"],
    ["Wet sand", 50, 500, "#c2a05c"],
    ["Dry sand / gravel", 500, 5000, "#d9b36c"],
    ["Limestone", 500, 10000, "#9aa4ad"],
    ["Granite (fresh)", 1000, 100000, "#635f5c"],
  ];
  const lmin = Math.log10(0.1), lmax = Math.log10(1e5);
  const pos = (v: number) => ((Math.log10(v) - lmin) / (lmax - lmin)) * 100;
  return (
    <FigureCell title="The resistivity spectrum of earth materials (log scale, Ω·m)">
      <div className="space-y-1.5">
        {items.map(([name, lo, hi, color]) => (
          <div key={name} className="flex items-center gap-2 text-xs">
            <span className="w-28 shrink-0 text-right text-muted">{name}</span>
            <div className="relative h-4 flex-1 rounded bg-panel-2">
              <div className="absolute h-full rounded" style={{ left: `${pos(lo)}%`, width: `${pos(hi) - pos(lo)}%`, background: color, opacity: 0.85 }} />
            </div>
          </div>
        ))}
        <div className="ml-30 flex justify-between pl-30 font-[family-name:var(--font-mono)] text-[10px] text-muted">
          {["0.1", "1", "10", "100", "1k", "10k", "100k"].map((t) => <span key={t}>{t}</span>)}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">
        Water content and salinity control almost everything: the same sand spans a decade between dry and saturated.
      </p>
    </FigureCell>
  );
}

/* ------------------------------------------------------------------ */

function TwoLayerExplorer() {
  const [rho1, setRho1] = useState(100);
  const [rho2, setRho2] = useState(1000);
  const [h, setH] = useState(5);

  const spacings = useMemo(() => logspace(1, 500, 30), []);
  const curve = useMemo(() => vesTwoLayerExact(rho1, rho2, h, spacings), [rho1, rho2, h, spacings]);
  const k = (rho2 - rho1) / (rho2 + rho1);

  return (
    <FigureCell title="Two-layer Schlumberger master curve — exact image-series solution">
      <div className="grid gap-3 md:grid-cols-3">
        <Slider label="ρ₁ (top layer)" value={rho1} onChange={setRho1} min={1} max={10000} log unit="Ω·m" />
        <Slider label="ρ₂ (basement)" value={rho2} onChange={setRho2} min={1} max={10000} log unit="Ω·m" />
        <Slider label="h (top thickness)" value={h} onChange={setH} min={1} max={50} step={0.5} unit="m" />
      </div>
      <LineChart
        series={[
          { x: spacings, y: curve, color: "#f5b942", label: "ρₐ(AB/2)", points: true },
          { x: [spacings[0], spacings[spacings.length - 1]], y: [rho1, rho1], color: "#4fd1c5", dash: "4 4", label: "ρ₁", width: 1 },
          { x: [spacings[0], spacings[spacings.length - 1]], y: [rho2, rho2], color: "#a78bfa", dash: "4 4", label: "ρ₂", width: 1 },
        ]}
        logX logY height={320}
        xLabel="AB/2 (m)" yLabel="ρₐ (Ω·m)"
      />
      <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-muted md:grid-cols-3">
        <span>Reflection coefficient k = <span className="font-[family-name:var(--font-mono)] text-accent">{k.toFixed(2)}</span></span>
        <span>Curve leaves ρ₁ near AB/2 ≈ h ({h} m)</span>
        <span>…but needs AB/2 ≈ {(h * 10).toFixed(0)} m to reach ρ₂</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Three things to notice: (1) the curve is bounded by ρ₁ and ρ₂; (2) a rising branch cannot exceed
        45° on log-log paper — steeper data means measurement error; (3) the transition is smeared over a
        full decade of spacing — resistivity sounding has excellent depth <em>sensitivity</em> but blunt
        depth <em>resolution</em>.
      </p>
    </FigureCell>
  );
}
