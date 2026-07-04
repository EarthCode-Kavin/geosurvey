"use client";

import { useMemo, useState } from "react";
import { NotebookLayout, Md, H2, CodeCell, FigureCell } from "./shell";
import { Slider, Quiz, Formula, InfoBox } from "@/components/ui";
import { LineChart } from "@/components/charts";

export default function EffectiveStressNotebook() {
  return (
    <NotebookLayout
      badge="Notebook 05 · Geotechnics"
      title="Effective stress: the one idea that runs geotechnics"
      subtitle="Terzaghi's principle, pore pressure, and why raising the water table weakens the ground — with SPT corrections as a working example."
    >
      <Md>
        <p>
          Karl Terzaghi&apos;s 1925 insight created modern soil mechanics: soil grains and pore water share
          the load, but <strong>only the grain-to-grain (effective) stress produces strength and
          stiffness</strong>. Water pressure pushes grains apart; it can hold weight but it cannot
          generate friction.
        </p>
      </Md>

      <H2>1 · The principle</H2>
      <Formula label="Terzaghi's principle of effective stress">
        σ′ = σ − u&nbsp;&nbsp;&nbsp;(effective = total − pore pressure)
      </Formula>
      <StressExplorer />

      <H2>2 · Compute it yourself</H2>
      <CodeCell
        caption="stress profile: 3 m sand over 5 m clay, water table at 2 m"
        code={`gamma_w = 9.81      # kN/m3
profile = [("sand", 3.0, 18.0), ("clay", 5.0, 17.0)]
gwt = 2.0

z, sigma = 0.0, 0.0
for name, h, gamma in profile:
    z += h
    sigma += gamma * h
    u = max(0.0, (z - gwt)) * gamma_w
    print(f"z={z:4.1f} m  sigma={sigma:6.1f}  u={u:5.1f}  sigma'={sigma-u:6.1f} kPa")`}
        compute={() => {
          const gw = 9.81; const gwt = 2;
          const prof: [string, number, number][] = [["sand", 3, 18], ["clay", 5, 17]];
          let z = 0, s = 0;
          return prof.map(([, h, g]) => {
            z += h; s += g * h;
            const u = Math.max(0, z - gwt) * gw;
            return `z=${z.toFixed(1).padStart(4)} m  sigma=${s.toFixed(1).padStart(6)}  u=${u.toFixed(1).padStart(5)}  sigma'=${(s - u).toFixed(1).padStart(6)} kPa`;
          }).join("\n");
        }}
      />

      <H2>3 · Why SPT values need correcting</H2>
      <Md>
        <p>
          The same sand at 2 m and at 20 m gives different blow counts — deeper sand is squeezed harder,
          so it resists penetration more. To compare soils fairly we normalize to a standard overburden
          of 100 kPa:
        </p>
      </Md>
      <Formula label="Overburden correction (Liao & Whitman 1986), capped at 1.7">
        N₁₆₀ = N₆₀ · √(100 / σ′v)
      </Formula>
      <CodeCell
        caption="same soil, three depths"
        code={`for depth, N, sigma_eff in [(2, 12, 30), (10, 19, 110), (20, 25, 210)]:
    CN = min(1.7, (100 / sigma_eff) ** 0.5)
    print(f"z={depth:>2} m  N={N:>2}  sigma'={sigma_eff:>3} kPa  CN={CN:4.2f}  N160={N*CN:4.1f}")`}
        compute={() =>
          ([[2, 12, 30], [10, 19, 110], [20, 25, 210]] as const).map(([d, N, s]) => {
            const CN = Math.min(1.7, Math.sqrt(100 / s));
            return `z=${String(d).padStart(2)} m  N=${String(N).padStart(2)}  sigma'=${String(s).padStart(3)} kPa  CN=${CN.toFixed(2)}  N160=${(N * CN).toFixed(1).padStart(4)}`;
          }).join("\n")}
      />
      <Md>
        <p>
          After correction all three depths give N₁₆₀ ≈ 12–17 — it was the <em>same</em> sand all along.
          Skip the correction and you&apos;d wrongly report the deep sand as much denser.
        </p>
      </Md>

      <H2>4 · Check yourself</H2>
      <Quiz
        question="Heavy rain raises the water table from 5 m to 1 m depth. The effective stress at 6 m depth…"
        options={[
          "Increases — the ground got heavier with water",
          "Decreases by roughly 4 × 9.81 ≈ 39 kPa",
          "Stays the same — total stress is unchanged",
          "Becomes zero",
        ]}
        correct={1}
        explanation="Total stress barely changes (soil was already moist), but pore pressure at 6 m rises by ~39 kPa, so σ' = σ − u drops by about the same amount. Less effective stress = less frictional strength — this is why slopes fail during storms."
      />
      <Quiz
        question="A quicksand condition (soil behaves like a liquid) happens when…"
        options={[
          "The sand is very loose",
          "Upward seepage makes pore pressure equal total stress (σ' → 0)",
          "The sand is dry and wind-blown",
          "Clay content exceeds 30%",
        ]}
        correct={1}
        explanation="With σ' = 0 the grains carry no contact force, so frictional strength vanishes: τ = σ'·tanφ = 0. It is a pressure condition, not a special soil — any sand can 'quick' under sufficient upward gradient."
      />
      <InfoBox kind="tip" title="Connect it">
        In the Geotech Lab, drag the groundwater slider up and watch three things fall together:
        effective stress, bearing capacity, and (through buoyant unit weight) the width term of the
        bearing equation. One principle, three consequences.
      </InfoBox>
    </NotebookLayout>
  );
}

/* ------------------------------------------------------------------ */

function StressExplorer() {
  const [gwt, setGwt] = useState(3);
  const gammaSand = 18, gammaClay = 17, gw = 9.81;
  const depths = useMemo(() => Array.from({ length: 41 }, (_, i) => (i * 12) / 40), []);

  const data = useMemo(() => {
    const sigma = depths.map((z) => (z <= 4 ? z * gammaSand : 4 * gammaSand + (z - 4) * gammaClay));
    const u = depths.map((z) => Math.max(0, (z - gwt) * gw));
    const eff = sigma.map((s, i) => Math.max(0, s - u[i]));
    return { sigma, u, eff };
  }, [depths, gwt]);

  return (
    <FigureCell title="Stress profile explorer — 4 m sand over 8 m clay; drag the water table">
      <Slider label="Water table depth" value={gwt} onChange={setGwt} min={0} max={12} step={0.25} unit="m" />
      <LineChart
        series={[
          { x: data.sigma, y: depths, color: "#8b9ab8", label: "total σv" },
          { x: data.u, y: depths, color: "#4fd1c5", label: "pore pressure u" },
          { x: data.eff, y: depths, color: "#f5b942", label: "effective σ'v", width: 2.6 },
        ]}
        yFlip height={320} xLabel="stress (kPa)" yLabel="depth (m)"
      />
      <p className="mt-1 text-xs text-muted">
        The amber curve is what the soil skeleton actually feels. Pull the water table to the surface and
        watch σ&apos; collapse by ~45% — the soil didn&apos;t change, but its strength did.
      </p>
    </FigureCell>
  );
}
