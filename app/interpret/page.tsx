"use client";

/**
 * Interpretation Laboratory — the skill-building module.
 * Each exercise shows survey data generated from a hidden ground model.
 * The student commits to an interpretation BEFORE the truth is revealed.
 */

import { useMemo, useState } from "react";
import { LineChart, resistivityColor, rgbCss, linScale } from "@/components/charts";
import { Panel, InfoBox } from "@/components/ui";
import {
  vesSchlumberger, logspace, seismicRefraction, ertPseudosection, gravityProfile, Layer1D,
} from "@/lib/geophysics";

/* ------------------------------------------------------------------ */

const L = (thickness: number, resistivity: number, vp: number, density = 2, epsilon = 10, susceptibility = 0.3): Layer1D =>
  ({ thickness, resistivity, vp, density, epsilon, susceptibility });

interface Exercise {
  id: string;
  kind: string;
  title: string;
  prompt: string;
  figure: React.ReactNode;
  options: string[];
  correct: number;
  explanation: string;
  truth: string;
}

export default function InterpretLab() {
  const exercises = useExercises();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const answered = Object.keys(answers).length;
  const score = exercises.filter((e) => answers[e.id] === e.correct).length;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-8">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
          Interpretation <span className="text-accent">Laboratory</span>
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted">
          Real interpretation means committing before you know the answer. Each dataset below was
          generated from a hidden ground model by the same physics engine as the labs. Study the figure,
          choose your interpretation, then face the truth.
        </p>
        <div className="mt-3 inline-flex items-center gap-3 rounded-full border border-line bg-panel px-4 py-1.5 text-sm">
          <span className="text-muted">Score</span>
          <span className="font-[family-name:var(--font-mono)] text-accent">{score} / {answered}</span>
          <span className="text-xs text-muted">({exercises.length} exercises)</span>
        </div>
      </header>

      <div className="space-y-6">
        {exercises.map((ex, i) => (
          <ExerciseCard key={ex.id} ex={ex} index={i + 1}
            picked={answers[ex.id] ?? null}
            onPick={(v) => setAnswers((a) => ({ ...a, [ex.id]: v }))} />
        ))}
      </div>

      <div className="mt-10">
        <InfoBox kind="tip" title="The interpreter's oath">
          Every geophysical dataset admits multiple explanations. Professionals rank hypotheses, seek
          independent constraints (drilling, another method, site history), and report uncertainty
          honestly. If you scored below 100%, you learned something more valuable than the points.
        </InfoBox>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ExerciseCard({ ex, index, picked, onPick }: {
  ex: Exercise; index: number; picked: number | null; onPick: (v: number) => void;
}) {
  return (
    <Panel
      title={<span><span className="font-[family-name:var(--font-mono)] text-accent-2">#{index}</span> {ex.title}</span>}
      subtitle={ex.kind}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div>{ex.figure}</div>
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">{ex.prompt}</p>
          {ex.options.map((o, i) => {
            let cls = "border-line bg-panel-2 hover:border-line-2";
            if (picked !== null) {
              if (i === ex.correct) cls = "border-good bg-good/10 text-good";
              else if (i === picked) cls = "border-bad bg-bad/10 text-bad";
              else cls = "border-line bg-panel-2 opacity-50";
            }
            return (
              <button key={i} disabled={picked !== null} onClick={() => onPick(i)}
                className={`block w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${cls}`}>
                <span className="mr-2 font-[family-name:var(--font-mono)] text-xs text-muted">{String.fromCharCode(65 + i)}</span>
                {o}
              </button>
            );
          })}
          {picked !== null && (
            <div className="anim-fade-up space-y-2 pt-1">
              <div className={`rounded-lg px-3 py-2 text-sm ${picked === ex.correct ? "bg-good/10 text-good" : "bg-warn/10 text-warn"}`}>
                {picked === ex.correct ? "✓ Correct." : "✗ Not this time."}
              </div>
              <div className="rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-xs leading-relaxed text-fg/85">
                <div className="mb-1 font-semibold text-accent">The hidden model</div>
                {ex.truth}
              </div>
              <div className="text-xs leading-relaxed text-muted">{ex.explanation}</div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Exercise construction                                               */
/* ------------------------------------------------------------------ */

function useExercises(): Exercise[] {
  return useMemo(() => {
    const spac = logspace(1, 300, 24);

    /* 1 — H-type VES */
    const ves1 = vesSchlumberger([L(2, 400, 500), L(6, 30, 1500), L(1, 3000, 4500)], spac);

    /* 2 — falling VES to very low values (saline) */
    const ves2 = vesSchlumberger([L(3, 150, 600), L(10, 40, 1500), L(1, 2, 1600)], spac);

    /* 3 — seismic with a velocity inversion (hidden layer) */
    const seis = seismicRefraction([L(4, 300, 900), L(8, 150, 400), L(1, 100, 4800)], 150);

    /* 4 — ERT with conductive body */
    const pseudo = ertPseudosection(
      [L(3, 500, 500), L(10, 350, 2000), L(1, 900, 4000)],
      48, 2,
      [{ x: 46, depth: 7, radius: 4, resistivity: 8 }],
    );

    /* 5 — gravity low */
    const grav = gravityProfile(
      [L(30, 2000, 4000, 2.55)],
      [{ x: 50, depth: 9, radius: 4.5, density: 0.05 }],
      100,
    );

    return [
      {
        id: "ves-h",
        kind: "VES sounding curve · Schlumberger array",
        title: "The classic three-layer curve",
        prompt: "This sounding was run for a housing project. What sequence best explains the curve?",
        figure: (
          <LineChart series={[{ x: spac, y: ves1, color: "#f5b942", points: true, label: "ρₐ" }]}
            logX logY height={300} xLabel="AB/2 (m)" yLabel="ρₐ (Ω·m)" />
        ),
        options: [
          "Conductive clay over resistive sand over conductive clay (K-type)",
          "Resistive dry sand over conductive clay over resistive bedrock (H-type)",
          "Uniform sand with a deep water table",
          "Resistivity increasing steadily with depth (A-type)",
        ],
        correct: 1,
        explanation: "The curve starts high (~400 Ω·m), dips to a clear minimum (~30–50 Ω·m), then rises steeply — the textbook H-type signature: resistive cover, conductive middle, resistive base. The 45° terminal rise says the basement is much more resistive than anything above.",
        truth: "2 m of dry sand (400 Ω·m) over 6 m of clay (30 Ω·m) on granite bedrock (3000 Ω·m).",
      },
      {
        id: "ves-saline",
        kind: "VES sounding curve · coastal site",
        title: "The curve that keeps falling",
        prompt: "A coastal well-field sounding. The terminal branch falls and flattens near 2 Ω·m. What is the deep conductor?",
        figure: (
          <LineChart series={[{ x: spac, y: ves2, color: "#4fd1c5", points: true, label: "ρₐ" }]}
            logX logY height={300} xLabel="AB/2 (m)" yLabel="ρₐ (Ω·m)" />
        ),
        options: [
          "Fresh granite bedrock",
          "A saline-water-saturated zone (seawater intrusion)",
          "Dense dry gravel",
          "An air-filled cavity system",
        ],
        correct: 1,
        explanation: "Nothing geological except saline pore water (or massive sulphides/graphite) gets down to single-digit Ω·m. Fresh rock, gravel and air-filled voids are all resistive — they would bend the curve upward. Values ≈ 1–5 Ω·m near a coast scream seawater intrusion, and define the depth fresh-water wells must not exceed.",
        truth: "3 m dry sand (150 Ω·m), 10 m fresh-water sand (40 Ω·m), then sand saturated with saline water (2 Ω·m) — a classic coastal aquifer profile.",
      },
      {
        id: "seis-1",
        kind: "Seismic refraction · first-arrival picks",
        title: "How many layers do you see?",
        prompt: "First arrivals from a 150 m spread. The model that produced them has THREE layers. What did the survey actually resolve?",
        figure: (
          <LineChart
            series={[{ x: seis.offsets, y: seis.firstArrivals, color: "#ffffff", points: true, label: "first arrivals" }]}
            height={300} xLabel="offset (m)" yLabel="time (ms)" />
        ),
        options: [
          "All three layers — three straight branches are visible",
          "Only two: the soft middle layer is slower than the crust above it, so it produces no branch (velocity inversion)",
          "Only one: the ground is homogeneous",
          "Four layers including the water table",
        ],
        correct: 1,
        explanation: "Only two slopes exist in the picks (≈900 m/s and ≈4800 m/s). The soft clay between them is SLOWER than the stiff crust above, so it can never critically refract — it is a hidden layer, and nothing in this plot warns you it exists. Worse: interpreting these picks as two layers will OVERestimate the depth to bedrock, because the clay delays arrivals more per metre than 900 m/s material would. Refraction must be paired with a borehole when inversions are possible (fill or caliche over soft soils).",
        truth: "4 m of compacted crust at 900 m/s over 8 m of soft clay at 400 m/s (the hidden layer) on bedrock at 4800 m/s. The t–x plot shows only two usable branches.",
      },
      {
        id: "ert-1",
        kind: "ERT pseudosection · Wenner array, 48 electrodes",
        title: "The blue blob",
        prompt: "An ERT line across an old industrial site shows a strong conductive anomaly (blue) near x ≈ 46 m. Which explanation fits best?",
        figure: <PseudoFigure pseudo={pseudo} />,
        options: [
          "An air-filled void (old mine working)",
          "A leachate / contaminant plume or clay pocket",
          "A granite boulder",
          "A processing artifact — conductive anomalies are impossible",
        ],
        correct: 1,
        explanation: "Blue = LOW resistivity. Air voids and granite boulders are resistive (they would plot red). Ionic contamination (leachate), saline water or clay are the standard conductive culprits — on an industrial site, a plume demands investigation. Polarity is the first thing to check before speculating about geometry.",
        truth: "Background: 3 m sand over weathered then fresh rock. Buried at x=46 m, 7 m deep: a 4 m-radius body at 8 Ω·m simulating a leachate-saturated zone.",
      },
      {
        id: "grav-1",
        kind: "Microgravity profile · karst terrain",
        title: "The missing mass",
        prompt: "A microgravity profile over limestone shows this anomaly. Using the half-width rule (z ≈ 1.3·x½), the cavity depth is roughly…",
        figure: (
          <LineChart series={[{ x: grav.x, y: grav.g.map((v) => v * 1000), color: "#60a5fa", label: "Δg (µGal)" }]}
            height={300} xLabel="distance (m)" yLabel="Δg (µGal)" />
        ),
        options: [
          "~2 m",
          "~9 m",
          "~30 m",
          "The anomaly gives no depth information",
        ],
        correct: 1,
        explanation: "Measure where |Δg| falls to half its peak: x½ ≈ 7 m either side of the minimum, so z ≈ 1.3 × 7 ≈ 9 m. Shape gives depth; amplitude then constrains Δρ·R³. The negative sign confirms a mass deficit — a cavity or low-density fill.",
        truth: "An air-filled cavity, radius 4.5 m, centred 9 m below the profile in 2.55 g/cc limestone.",
      },
    ];
  }, []);
}

/* ------------------------------------------------------------------ */

function PseudoFigure({ pseudo }: { pseudo: ReturnType<typeof ertPseudosection> }) {
  const lineLength = (pseudo.nElectrodes - 1) * pseudo.spacing;
  const maxZ = Math.max(...pseudo.points.map((p) => p.z)) * 1.15;
  const W = 560, H = 260, ml = 42, mt = 18, mr = 12, mb = 34;
  const sx = linScale(0, lineLength, ml, W - mr);
  const sz = linScale(0, maxZ, mt, H - mb);
  const lmin = Math.log10(pseudo.min);
  const lmax = Math.log10(pseudo.max);
  const tOf = (v: number) => (Math.log10(v) - lmin) / (lmax - lmin || 1);
  const cell = Math.max(4, (sx(3 * pseudo.spacing) - sx(0)) / 3.1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {pseudo.points.map((p, i) => (
        <rect key={i} x={sx(p.x) - cell / 2} y={sz(p.z) - cell / 2} width={cell} height={cell} rx="1.5"
          fill={rgbCss(resistivityColor(tOf(p.rhoA)))} />
      ))}
      <text x={ml - 6} y={sz(0) + 3} textAnchor="end" fontSize="9" fill="#8b9ab8">0</text>
      <text x={ml - 6} y={sz(maxZ) + 3} textAnchor="end" fontSize="9" fill="#8b9ab8">{maxZ.toFixed(0)} m</text>
      <text x={(ml + W - mr) / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="#8b9ab8">
        distance (m) · blue = conductive, red = resistive
      </text>
    </svg>
  );
}
