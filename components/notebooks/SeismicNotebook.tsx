"use client";

import { useMemo, useState } from "react";
import { NotebookLayout, Md, H2, CodeCell, FigureCell } from "./shell";
import { Slider, Quiz, Formula, InfoBox } from "@/components/ui";
import { LineChart } from "@/components/charts";

export default function SeismicNotebook() {
  return (
    <NotebookLayout
      badge="Notebook 02 · Seismic methods"
      title="Racing waves through the ground"
      subtitle="Snell's law, critical refraction, head waves and the travel-time curve — the physics that turns a hammer blow into a depth-to-bedrock profile."
    >
      <Md>
        <p>
          Drop a hammer on the ground and you launch a compressional (P) wave in every direction at once.
          In soil it crawls at 300–800 m/s; in fresh granite it flies at 5–6 km/s. Seismic refraction
          exploits a beautiful accident of physics: <strong>beyond a certain distance, the wave that dived
          down into fast rock and came back arrives before the wave that went straight</strong>.
        </p>
      </Md>

      <H2>1 · Snell&apos;s law and the critical angle</H2>
      <Formula label="Refraction at an interface; critical refraction when θ₂ = 90°">
        sin θ₁ / v₁ = sin θ₂ / v₂ &nbsp;&nbsp;⇒&nbsp;&nbsp; sin θc = v₁ / v₂
      </Formula>
      <CriticalAngleExplorer />
      <CodeCell
        caption="critical angle for common contrasts"
        code={`import numpy as np

pairs = [("soil→rock", 600, 4500),
         ("dry→saturated sand", 500, 1550),
         ("weathered→fresh rock", 2200, 5200)]
for name, v1, v2 in pairs:
    theta_c = np.degrees(np.arcsin(v1 / v2))
    print(f"{name:24s} v1={v1:>5} v2={v2:>5}  θc = {theta_c:4.1f}°")`}
        compute={() => {
          const pairs: [string, number, number][] = [
            ["soil→rock", 600, 4500],
            ["dry→saturated sand", 500, 1550],
            ["weathered→fresh rock", 2200, 5200],
          ];
          return pairs.map(([n, v1, v2]) =>
            `${n.padEnd(24)} v1=${String(v1).padStart(5)} v2=${String(v2).padStart(5)}  θc = ${(Math.asin(v1 / v2) * 180 / Math.PI).toFixed(1).padStart(4)}°`
          ).join("\n");
        }}
      />
      <Md>
        <p>
          At exactly the critical angle the refracted wave skims <em>along</em> the interface at v₂,
          and — this is the key — continuously leaks energy back to the surface at the same angle.
          That leaking wave is the <strong>head wave</strong>, the signal refraction surveys live on.
        </p>
      </Md>

      <H2>2 · The travel-time curve</H2>
      <Formula label="Two-layer travel times: direct wave and head wave">
        t_direct = x / v₁ &nbsp;&nbsp;·&nbsp;&nbsp; t_head = x / v₂ + (2h·cos θc) / v₁
      </Formula>
      <TravelTimeExplorer />

      <H2>3 · From curve to depth</H2>
      <CodeCell
        caption="solving for depth from the crossover distance"
        code={`import numpy as np

v1, v2 = 600.0, 4500.0     # m/s (read from the two slopes)
x_cross = 14.6             # m   (where the branches intersect)

# depth from crossover distance:
h = 0.5 * x_cross * np.sqrt((v2 - v1) / (v2 + v1))
print(f"depth to refractor h = {h:.1f} m")`}
        compute={() => {
          const v1 = 600, v2 = 4500, xc = 14.6;
          const h = 0.5 * xc * Math.sqrt((v2 - v1) / (v2 + v1));
          return `depth to refractor h = ${h.toFixed(1)} m`;
        }}
      />
      <Md>
        <p>
          Field practice: pick first arrivals on the seismograph record, plot t–x, fit straight lines,
          read v₁ and v₂ from the slopes, then compute h from either the crossover distance or the
          intercept time. Always shoot from <strong>both ends of the line</strong> — a dipping interface
          gives different apparent velocities in the two directions, and only the pair reveals the dip.
        </p>
      </Md>

      <H2>4 · Check yourself</H2>
      <Quiz
        question="On a t–x plot, the slope of a travel-time branch equals…"
        options={["The layer velocity v", "1/v — inverse velocity", "The layer thickness", "The critical angle"]}
        correct={1}
        explanation="t = x/v + intercept, so dt/dx = 1/v. Steep = slow, flat = fast. The fastest deep refractors produce the flattest branches."
      />
      <Quiz
        question="A stiff gravel layer (900 m/s) lies beneath saturated clay (1600 m/s). What does refraction see?"
        options={[
          "A clear extra branch for the gravel",
          "Nothing — the gravel is a hidden (velocity-inversion) layer",
          "A negative travel time",
          "Stronger amplitudes only",
        ]}
        correct={1}
        explanation="Head waves require the deeper layer to be faster. A slower layer under a faster one never produces critically refracted first arrivals — it is invisible, and depths computed below it will be wrong. This is the classic hidden-layer problem."
      />
      <InfoBox kind="warn" title="The 1500 m/s trap">
        A branch at ~1500 m/s often marks nothing more than the water table (P-waves travel at
        ~1480 m/s in water). Don&apos;t report it as a soil-to-rock boundary — check against a borehole.
      </InfoBox>
    </NotebookLayout>
  );
}

/* ------------------------------------------------------------------ */

function CriticalAngleExplorer() {
  const [v1, setV1] = useState(600);
  const [v2, setV2] = useState(4500);
  const ratio = v1 / v2;
  const thetaC = ratio < 1 ? (Math.asin(ratio) * 180) / Math.PI : null;

  const W = 560, H = 240, iy = 130, sx = 130;
  const rays = [20, thetaC ?? 45, 65].filter((a): a is number => a !== null);

  return (
    <FigureCell title="Critical refraction — drag the velocities">
      <div className="grid gap-3 md:grid-cols-2">
        <Slider label="v₁ (upper layer)" value={v1} onChange={setV1} min={300} max={3000} step={50} unit="m/s" />
        <Slider label="v₂ (lower layer)" value={v2} onChange={setV2} min={500} max={6000} step={50} unit="m/s" />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full">
        <rect x="0" y="0" width={W} height={iy} fill="#d9b36c" opacity="0.25" />
        <rect x="0" y={iy} width={W} height={H - iy} fill="#635f5c" opacity="0.35" />
        <line x1="0" y1={iy} x2={W} y2={iy} stroke="#8b9ab8" strokeWidth="1.5" />
        <text x="8" y="18" fontSize="11" fill="#d9b36c">v₁ = {v1} m/s</text>
        <text x="8" y={iy + 18} fontSize="11" fill="#9aa4ad">v₂ = {v2} m/s</text>

        {thetaC === null ? (
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="12" fill="#f87171">
            v₂ ≤ v₁ — no critical angle, no head wave. This layer is seismically invisible.
          </text>
        ) : (
          <>
            {rays.map((ang, i) => {
              const isCrit = Math.abs(ang - thetaC) < 0.01;
              const rad = (ang * Math.PI) / 180;
              const hitX = sx + Math.tan(rad) * (iy - 30);
              // transmitted angle from Snell
              const sinT = (v2 / v1) * Math.sin(rad);
              const color = isCrit ? "#f5b942" : sinT > 1 ? "#f87171" : "#4fd1c5";
              return (
                <g key={i}>
                  <line x1={sx} y1={30} x2={hitX} y2={iy} stroke={color} strokeWidth={isCrit ? 2.4 : 1.4}
                    strokeDasharray={isCrit ? undefined : "5 4"} className="anim-dash" />
                  {sinT > 1 ? (
                    // total reflection
                    <line x1={hitX} y1={iy} x2={hitX + Math.tan(rad) * (iy - 60)} y2={60} stroke={color} strokeWidth="1.4" strokeDasharray="5 4" className="anim-dash" />
                  ) : isCrit ? (
                    <>
                      <line x1={hitX} y1={iy} x2={W - 20} y2={iy} stroke="#f5b942" strokeWidth="2.4" className="anim-dash" strokeDasharray="6 5" />
                      {[0.35, 0.6, 0.85].map((f) => (
                        <line key={f} x1={hitX + (W - 40 - hitX) * f} y1={iy}
                          x2={hitX + (W - 40 - hitX) * f + Math.tan(rad) * (iy - 30)} y2={30}
                          stroke="#f5b942" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.7" className="anim-dash" />
                      ))}
                    </>
                  ) : (
                    <line x1={hitX} y1={iy}
                      x2={hitX + Math.tan(Math.asin(Math.min(1, sinT))) * (H - iy - 16)} y2={H - 16}
                      stroke={color} strokeWidth="1.4" strokeDasharray="5 4" className="anim-dash" />
                  )}
                </g>
              );
            })}
            <circle cx={sx} cy={30} r="5" fill="#4fd1c5" />
            <text x={sx} y={20} textAnchor="middle" fontSize="10" fill="#4fd1c5">source</text>
            <text x={W - 12} y={iy - 8} textAnchor="end" fontSize="11" fill="#f5b942">
              θc = {thetaC.toFixed(1)}° — head wave skims interface, leaking energy up
            </text>
          </>
        )}
      </svg>
      <p className="mt-1 text-xs text-muted">
        Teal ray: sub-critical (refracts down, lost). Amber ray at θc: critically refracted — this one
        creates the head wave. Red ray: super-critical (totally reflected).
      </p>
    </FigureCell>
  );
}

/* ------------------------------------------------------------------ */

function TravelTimeExplorer() {
  const [v1, setV1] = useState(600);
  const [v2, setV2] = useState(4500);
  const [h, setH] = useState(5);

  const data = useMemo(() => {
    const xs = Array.from({ length: 60 }, (_, i) => (i + 1) * 1.5);
    const direct = xs.map((x) => (x / v1) * 1000);
    let head: (number | null)[] = xs.map(() => null);
    let xCross: number | null = null;
    if (v2 > v1) {
      const thetaC = Math.asin(v1 / v2);
      const ti = (2 * h * Math.cos(thetaC)) / v1;
      const xCrit = 2 * h * Math.tan(thetaC);
      head = xs.map((x) => (x < xCrit ? null : (x / v2 + ti) * 1000));
      xCross = 2 * h * Math.sqrt((v2 + v1) / (v2 - v1));
    }
    return { xs, direct, head, xCross };
  }, [v1, v2, h]);

  return (
    <FigureCell title="Two-layer travel-time explorer">
      <div className="grid gap-3 md:grid-cols-3">
        <Slider label="v₁" value={v1} onChange={setV1} min={300} max={2500} step={50} unit="m/s" />
        <Slider label="v₂" value={v2} onChange={setV2} min={800} max={6000} step={100} unit="m/s" />
        <Slider label="h (layer 1 thickness)" value={h} onChange={setH} min={1} max={25} step={0.5} unit="m" />
      </div>
      <LineChart
        series={[
          { x: data.xs, y: data.direct, color: "#8b9ab8", label: `direct — slope 1/v₁ (${v1} m/s)` },
          { x: data.xs, y: data.head, color: "#4fd1c5", label: v2 > v1 ? `head wave — slope 1/v₂ (${v2} m/s)` : "no head wave (v₂ ≤ v₁!)" },
        ]}
        height={300} xLabel="offset x (m)" yLabel="time (ms)"
      />
      {data.xCross && (
        <p className="mt-1 text-xs text-muted">
          Crossover at <span className="font-[family-name:var(--font-mono)] text-accent">
          x = {data.xCross.toFixed(1)} m</span> = 2h·√((v₂+v₁)/(v₂−v₁)). Beyond it, first arrivals carry
          bedrock information. Rule of thumb: your spread must reach ~3× the crossover to define the
          second branch — i.e. line length ≳ 4–5× the target depth.
        </p>
      )}
    </FigureCell>
  );
}
