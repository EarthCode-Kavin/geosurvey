"use client";

import { useMemo, useState } from "react";
import { NotebookLayout, Md, H2, CodeCell, FigureCell } from "./shell";
import { Slider, Quiz, Formula, InfoBox } from "@/components/ui";
import { LineChart } from "@/components/charts";
import { C_LIGHT } from "@/lib/geophysics";

export default function GprNotebook() {
  return (
    <NotebookLayout
      badge="Notebook 03 · Electromagnetic methods"
      title="Radar underground: GPR from first principles"
      subtitle="Dielectric permittivity, radar velocity, reflections, the famous hyperbola — and why clay is GPR's kryptonite."
    >
      <Md>
        <p>
          GPR is literally radar pointed down. A pulse of radio energy (10–1000 MHz) travels into the
          ground, and every contrast in <strong>water content</strong> sends an echo back. Water dominates
          because its relative permittivity (εr ≈ 81) towers over dry minerals (εr ≈ 4–6): a few percent
          of moisture shifts the electrical properties more than a change of rock type does.
        </p>
      </Md>

      <H2>1 · Velocity from permittivity</H2>
      <Formula label="Radar velocity in a low-loss medium">
        v = c / √εr,&nbsp;&nbsp;&nbsp;c = 0.3 m/ns
      </Formula>
      <CodeCell
        caption="radar velocities in common materials"
        code={`c = 0.2998   # m/ns

materials = [("air", 1), ("dry sand", 4), ("limestone", 6),
             ("wet sand", 25), ("clay (wet)", 20), ("water", 81)]
for name, eps in materials:
    v = c / eps**0.5
    print(f"{name:12s} eps_r={eps:>3}   v = {v*1000:5.1f} mm/ns")`}
        compute={() => {
          const mats: [string, number][] = [["air", 1], ["dry sand", 4], ["limestone", 6], ["wet sand", 25], ["clay (wet)", 20], ["water", 81]];
          return mats.map(([n, e]) =>
            `${n.padEnd(12)} eps_r=${String(e).padStart(3)}   v = ${(C_LIGHT / Math.sqrt(e) * 1000).toFixed(1).padStart(5)} mm/ns`
          ).join("\n");
        }}
      />
      <Md>
        <p>
          Depth conversion is just d = v·t/2 (two-way time!). Get the velocity wrong by 30% and every
          utility you mark is 30% off — which is why field crews calibrate on a target of known depth
          or fit a hyperbola first.
        </p>
      </Md>

      <H2>2 · The hyperbola — GPR&apos;s signature</H2>
      <HyperbolaExplorer />

      <H2>3 · Attenuation: why clay kills radar</H2>
      <Formula label="Low-loss attenuation (dB/m); σ in S/m">
        α ≈ 1690 · σ / √εr
      </Formula>
      <CodeCell
        caption="penetration depth ≈ 60 dB dynamic range / (2·α·1 m)"
        code={`materials = [("dry sand",  2000, 4),
             ("wet sand",    150, 25),
             ("silt",         60, 16),
             ("clay",         25, 20)]
for name, rho, eps in materials:
    alpha = 1690 * (1/rho) / eps**0.5          # dB/m
    pen = 60 / (2 * alpha)                     # metres (60 dB budget)
    print(f"{name:10s} alpha = {alpha:6.2f} dB/m   usable depth ~ {pen:6.1f} m")`}
        compute={() => {
          const mats: [string, number, number][] = [["dry sand", 2000, 4], ["wet sand", 150, 25], ["silt", 60, 16], ["clay", 25, 20]];
          return mats.map(([n, rho, eps]) => {
            const a = (1690 * (1 / rho)) / Math.sqrt(eps);
            return `${n.padEnd(10)} alpha = ${a.toFixed(2).padStart(6)} dB/m   usable depth ~ ${(60 / (2 * a)).toFixed(1).padStart(6)} m`;
          }).join("\n");
        }}
      />
      <Md>
        <p>
          Read that table twice: in clean dry sand GPR sees tens of metres; in clay it dies within a
          metre or two. <strong>No antenna, no amplifier, no processing rescues you</strong> — attenuation
          is exponential. The first question before any GPR job is: &quot;is there clay?&quot;
        </p>
      </Md>

      <H2>4 · Frequency: the eternal trade-off</H2>
      <Md>
        <p>
          Resolution ≈ λ/4 = v/(4f). Higher frequency → shorter wavelength → sharper image → but stronger
          scattering losses and shallower penetration. There is no free lunch:
        </p>
      </Md>
      <FrequencyTradeoff />

      <H2>5 · Check yourself</H2>
      <Quiz
        question="A hyperbola in a radargram has very 'wide', flat limbs. Compared to a tight, narrow hyperbola at the same depth, the wide one indicates…"
        options={[
          "A larger buried object",
          "Faster ground (higher radar velocity)",
          "Slower ground (lower radar velocity)",
          "A metal object instead of plastic",
        ]}
        correct={1}
        explanation="Hyperbola curvature is set by velocity: t(x) = (2/v)·√(d²+(x−x₀)²). Faster ground flattens the limbs. Analysts fit the curvature precisely to measure v — the shape says nothing directly about the object's size or material."
      />
      <Quiz
        question="You must map rebar at 10 cm depth in a concrete slab. Which antenna?"
        options={["100 MHz", "250 MHz", "1000–2600 MHz", "Any — depth is what matters"]}
        correct={2}
        explanation="At 1 GHz in concrete (εr≈8, v≈106 mm/ns), λ≈10 cm and resolution ≈2.5 cm — ideal for rebar spacing. A 100 MHz antenna has a metre-scale wavelength and simply cannot separate bars."
      />
      <InfoBox kind="tip" title="Field wisdom">
        Always drag the antenna both ways and watch the screen live: real targets repeat, antenna ringing
        and surface reflections don&apos;t move with the ground. And never trust depths until you&apos;ve
        calibrated velocity on something you can verify.
      </InfoBox>
    </NotebookLayout>
  );
}

/* ------------------------------------------------------------------ */

function HyperbolaExplorer() {
  const [eps, setEps] = useState(9);
  const [d, setD] = useState(1.5);
  const [x0] = useState(10);

  const v = C_LIGHT / Math.sqrt(eps); // m/ns
  const data = useMemo(() => {
    const xs = Array.from({ length: 81 }, (_, i) => (i * 20) / 80);
    const t = xs.map((x) => (2 * Math.sqrt(d * d + (x - x0) * (x - x0))) / v);
    return { xs, t };
  }, [eps, d, v, x0]);

  return (
    <FigureCell title="Diffraction hyperbola explorer — a buried pipe seen by a moving antenna">
      <div className="grid gap-3 md:grid-cols-2">
        <Slider label="Ground permittivity εr" value={eps} onChange={setEps} min={3} max={30} step={1} />
        <Slider label="Pipe depth d" value={d} onChange={setD} min={0.5} max={4} step={0.1} unit="m" />
      </div>
      <LineChart
        series={[{ x: data.xs, y: data.t, color: "#a78bfa", label: `t(x) = (2/v)·√(d²+(x−x₀)²), v = ${(v * 1000).toFixed(0)} mm/ns` }]}
        yFlip height={280}
        xLabel="antenna position x (m)" yLabel="two-way time (ns)"
      />
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Time axis points down, exactly like a real radargram. Apex time = 2d/v locates the pipe; the limb
        curvature encodes velocity. Increase εr (wetter ground): the whole hyperbola sinks and the limbs
        steepen — same pipe, slower medium.
      </p>
    </FigureCell>
  );
}

/* ------------------------------------------------------------------ */

function FrequencyTradeoff() {
  const freqs = [50, 100, 200, 400, 800, 1600];
  const eps = 9;
  const v = C_LIGHT / Math.sqrt(eps);
  return (
    <FigureCell title="Antenna selection chart (ground: εr = 9, moderate loss)">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {freqs.map((f) => {
          const lambda = v / (f / 1000); // m
          const resol = lambda / 4;
          const depth = Math.min(40, 90 / Math.sqrt(f)); // empirical teaching curve
          return (
            <div key={f} className="rounded-xl border border-line bg-panel-2 p-3 text-center">
              <div className="font-[family-name:var(--font-mono)] text-lg text-accent">{f >= 1000 ? `${f / 1000} GHz` : `${f} MHz`}</div>
              <div className="mt-1 text-[11px] text-muted">resolution ≈ <span className="text-fg">{resol < 0.01 ? `${(resol * 1000).toFixed(0)} mm` : `${(resol * 100).toFixed(0)} cm`}</span></div>
              <div className="text-[11px] text-muted">max depth ≈ <span className="text-fg">{depth.toFixed(0)} m</span></div>
              <div className="mt-1 text-[10px] text-muted/70">
                {f <= 100 ? "geology, bedrock" : f <= 400 ? "utilities, archaeology" : "concrete, rebar"}
              </div>
            </div>
          );
        })}
      </div>
    </FigureCell>
  );
}
