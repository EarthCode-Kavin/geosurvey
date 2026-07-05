"use client";

import { useEffect, useMemo, useState } from "react";
import { GroundLayer, DEFAULT_GEOTECH_MODEL } from "@/lib/materials";
import { usePersistentState } from "@/lib/store";
import { LayerBuilder } from "@/components/LayerBuilder";
import BoreholeLog from "@/components/geotech/BoreholeLog";
import {
  bearingCapacity, settlement, stressProfile, syntheticSptLog,
  foundationRecommendation, meyerhofAllowable, sptN160, effectiveStressAt,
} from "@/lib/geotech";
import { LineChart } from "@/components/charts";
import { Panel, Slider, Stat, InfoBox, Tabs } from "@/components/ui";

type View = "borehole" | "bearing" | "settlement" | "stress";

export default function GeotechLab() {
  const [layers, setLayers] = usePersistentState<GroundLayer[]>("geotech-layers", DEFAULT_GEOTECH_MODEL);
  const [gwt, setGwt] = usePersistentState<number>("geotech-gwt", 3);
  const [B, setB] = usePersistentState<number>("geotech-b", 2);
  const [Df, setDf] = usePersistentState<number>("geotech-df", 1.5);
  const [q, setQ] = usePersistentState<number>("geotech-q", 150);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<View>("borehole");
  const [drill, setDrill] = useState(1);

  const spt = useMemo(() => syntheticSptLog(layers, gwt), [layers, gwt]);
  const bearing = useMemo(() => bearingCapacity(layers, gwt, B, Df), [layers, gwt, B, Df]);
  const settle = useMemo(() => settlement(layers, gwt, q, B, B, Df), [layers, gwt, q, B, Df]);
  const stresses = useMemo(() => stressProfile(layers, gwt), [layers, gwt]);
  const advice = useMemo(() => foundationRecommendation(layers, gwt, bearing, settle.total), [layers, gwt, bearing, settle]);

  const utilization = q / bearing.qAllowable;

  // drilling animation on mount / profile change
  useEffect(() => {
    setDrill(0);
    let p = 0;
    const id = setInterval(() => {
      p += 0.02;
      setDrill(Math.min(1, p));
      if (p >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [layers]);

  const meyerhof = useMemo(() => {
    const zi = Df + B / 2;
    const p = spt.find((s) => s.depth >= zi) ?? spt[spt.length - 1];
    if (!p) return 0;
    return meyerhofAllowable(sptN160(p.n, effectiveStressAt(layers, gwt, p.depth)), B);
  }, [spt, layers, gwt, B, Df]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
          Geotechnical <span className="text-accent">Laboratory</span>
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted">
          Design a soil profile, drill a virtual borehole and size a foundation on it. Every number
          on this page is recomputed live from your profile using standard geotechnical practice
          (Terzaghi/Vesic bearing theory, Meyerhof SPT rules, 1-D consolidation).
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        {/* LEFT */}
        <div className="space-y-4">
          <Panel title="1 · Build the soil profile" subtitle="Click a layer to edit">
            <LayerBuilder
              layers={layers}
              onChange={setLayers}
              selected={selected}
              onSelect={setSelected}
              properties={["sptN", "cohesion", "frictionAngle", "unitWeight", "moisture"]}
            />
          </Panel>
          <Panel title="Site conditions">
            <div className="space-y-3">
              <Slider label="Groundwater table depth" value={gwt} onChange={setGwt} min={0} max={20} step={0.5} unit="m" />
              <Slider label="Footing width B" value={B} onChange={setB} min={0.5} max={6} step={0.25} unit="m" />
              <Slider label="Founding depth Df" value={Df} onChange={setDf} min={0.5} max={5} step={0.25} unit="m" />
              <Slider label="Applied bearing pressure q" value={q} onChange={setQ} min={25} max={600} step={5} unit="kPa" />
            </div>
          </Panel>
          <Panel title="Verdict">
            <div className="space-y-2.5">
              <Stat label="Recommended foundation" value={advice.type} tone={utilization > 1 ? "warn" : "good"} />
              <p className="text-xs leading-relaxed text-muted">{advice.reason}</p>
              {advice.cautions.map((c) => (
                <div key={c} className="rounded-lg border border-warn/30 bg-warn/5 px-2.5 py-1.5 text-xs text-warn/90">⚠ {c}</div>
              ))}
            </div>
          </Panel>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="q ultimate" value={bearing.qUltimate.toFixed(0)} unit="kPa" />
            <Stat label="q allowable (FS=3)" value={bearing.qAllowable.toFixed(0)} unit="kPa"
              tone={utilization > 1 ? "bad" : "good"} />
            <Stat label="Meyerhof (SPT, 25 mm)" value={meyerhof.toFixed(0)} unit="kPa" />
            <Stat label="Settlement" value={settle.total.toFixed(0)} unit="mm"
              tone={settle.total > 50 ? "bad" : settle.total > 25 ? "warn" : "good"} />
          </div>

          <Panel>
            <Tabs
              tabs={[
                { id: "borehole" as View, label: "Borehole log" },
                { id: "bearing" as View, label: "Bearing capacity" },
                { id: "settlement" as View, label: "Settlement" },
                { id: "stress" as View, label: "Stress profile" },
              ]}
              active={view}
              onChange={setView}
            />
            <div className="mt-4">
              {view === "borehole" && (
                <div className="grid gap-4 md:grid-cols-[1fr_240px]">
                  <BoreholeLog layers={layers} spt={spt} waterTableDepth={gwt} animateProgress={drill} />
                  <div className="space-y-3">
                    <InfoBox kind="info" title="What is SPT?">
                      The Standard Penetration Test drives a split-spoon sampler with a 63.5 kg hammer
                      falling 760 mm. The blow count for 300 mm of penetration is N — the world&apos;s most
                      used measure of soil consistency. N&lt;4 = very loose/soft; N&gt;50 = refusal (rock).
                    </InfoBox>
                    <InfoBox kind="tip" title="Reading the log">
                      Watch N jump at layer boundaries and climb gently with depth inside a layer
                      (overburden confinement). The ▽ marks the groundwater table — everything below is
                      buoyant, which lowers effective stress and bearing capacity.
                    </InfoBox>
                    <button
                      onClick={() => {
                        setDrill(0);
                        let p = 0;
                        const id = setInterval(() => { p += 0.02; setDrill(Math.min(1, p)); if (p >= 1) clearInterval(id); }, 30);
                      }}
                      className="w-full rounded-xl border border-accent/50 bg-accent/10 py-2 text-sm text-accent hover:bg-accent/20">
                      🛠 Re-drill borehole
                    </button>
                  </div>
                </div>
              )}

              {view === "bearing" && <BearingView bearing={bearing} q={q} layers={layers} />}
              {view === "settlement" && <SettlementView settle={settle} layers={layers} q={q} />}
              {view === "stress" && (
                <div className="space-y-3">
                  <LineChart
                    series={[
                      { x: stresses.map((p) => p.totalStress), y: stresses.map((p) => p.depth), color: "#8b9ab8", label: "total stress σv" },
                      { x: stresses.map((p) => p.porePressure), y: stresses.map((p) => p.depth), color: "#4fd1c5", label: "pore pressure u" },
                      { x: stresses.map((p) => p.effectiveStress), y: stresses.map((p) => p.depth), color: "#f5b942", label: "effective stress σ'v" },
                    ]}
                    yFlip height={380}
                    xLabel="stress (kPa)" yLabel="depth (m)"
                    title="Vertical stress with depth — σv = u + σ'v (Terzaghi's principle)"
                  />
                  <InfoBox kind="physics" title="Why effective stress runs everything">
                    Soil strength and stiffness depend on σ&apos; = σ − u, the stress carried by the grain
                    skeleton. Raise the water table and watch the amber curve drop: the soil literally
                    carries less. This single idea — Terzaghi&apos;s principle — is the foundation of all
                    geotechnical engineering.
                  </InfoBox>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function BearingView({ bearing, q, layers }: {
  bearing: ReturnType<typeof bearingCapacity>; q: number; layers: GroundLayer[];
}) {
  const util = q / bearing.qAllowable;
  const parts = bearing.contributions;
  const total = parts.cohesion + parts.surcharge + parts.width || 1;
  return (
    <div className="space-y-4">
      {/* utilization gauge */}
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>Applied q = {q} kPa</span>
          <span>allowable {bearing.qAllowable.toFixed(0)} kPa · ultimate {bearing.qUltimate.toFixed(0)} kPa</span>
        </div>
        <div className="relative h-6 overflow-hidden rounded-full border border-line bg-panel-2">
          <div className={`h-full transition-all duration-500 ${util > 1 ? "bg-bad" : util > 0.7 ? "bg-warn" : "bg-good"}`}
            style={{ width: `${Math.min(100, util * 100 / 3)}%` }} />
          <div className="absolute top-0 h-full w-0.5 bg-fg/70" style={{ left: `${100 / 3}%` }} />
          <span className="absolute top-0.5 text-[10px] text-muted" style={{ left: `${100 / 3 + 1}%` }}>allowable (FS=3)</span>
        </div>
        <p className={`mt-1.5 text-sm ${util > 1 ? "text-bad" : "text-good"}`}>
          {util > 1
            ? `✗ Overstressed — utilization ${(util * 100).toFixed(0)}% of allowable. Widen the footing, found deeper, or improve the ground.`
            : `✓ OK — using ${(util * 100).toFixed(0)}% of allowable capacity (FS on ultimate ≈ ${(bearing.qUltimate / q).toFixed(1)}).`}
        </p>
      </div>

      {/* contribution bars */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Where the capacity comes from — q_ult = c·Nc·sc + q̄·Nq + ½γ&apos;B·Nγ·sγ
        </div>
        {[
          ["Cohesion term c·Nc", parts.cohesion, "#f5b942"],
          ["Surcharge term q̄·Nq", parts.surcharge, "#4fd1c5"],
          ["Width term ½γ'B·Nγ", parts.width, "#a78bfa"],
        ].map(([lbl, v, color]) => (
          <div key={lbl as string} className="mb-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted">{lbl}</span>
              <span className="font-[family-name:var(--font-mono)]">{(v as number).toFixed(0)} kPa</span>
            </div>
            <div className="h-2.5 rounded-full bg-panel-2">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${((v as number) / total) * 100}%`, background: color as string }} />
            </div>
          </div>
        ))}
        <div className="mt-2 grid grid-cols-3 gap-2 text-center font-[family-name:var(--font-mono)] text-xs text-muted">
          <span>Nc = {bearing.Nc.toFixed(1)}</span>
          <span>Nq = {bearing.Nq.toFixed(1)}</span>
          <span>Nγ = {bearing.Ngamma.toFixed(1)}</span>
        </div>
      </div>

      <InfoBox kind="physics" title="Interpretation">
        Bearing on <strong>{layers[bearing.governingLayer].name}</strong> (the layer beneath the footing).
        Clays are carried by the cohesion term; sands by the surcharge and width terms — that is why sand
        capacity grows with footing width and founding depth, while clay capacity barely cares. Raise the
        groundwater table above the footing and the width term drops by nearly half (buoyant unit weight).
      </InfoBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SettlementView({ settle, layers, q }: {
  settle: ReturnType<typeof settlement>; layers: GroundLayer[]; q: number;
}) {
  const s = settle.total;
  const sink = Math.min(38, s / 2.2); // px animation
  const tone = s > 50 ? "#f87171" : s > 25 ? "#fb923c" : "#4ade80";
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        {/* animated sinking building */}
        <div className="relative h-56 overflow-hidden rounded-xl border border-line bg-panel-2">
          <div className="absolute left-0 right-0 top-24 h-px bg-line-2" />
          <div className="absolute left-0 right-0 top-24 bottom-0 bg-[#6b4f2e]/30" />
          <div
            className="absolute left-1/2 -translate-x-1/2 transition-all duration-700"
            style={{ top: `${34 + sink}px` }}
          >
            <div className="mx-auto h-20 w-16 rounded-t-sm border border-line-2 bg-panel">
              {[0, 1, 2].map((r) => (
                <div key={r} className="mt-2 flex justify-center gap-1.5">
                  {[0, 1].map((c) => <div key={c} className="h-3 w-3 rounded-[2px]" style={{ background: tone }} />)}
                </div>
              ))}
            </div>
            <div className="h-3 w-24 -translate-x-4 rounded-sm bg-line-2" />
          </div>
          <div className="absolute bottom-2 left-0 right-0 text-center font-[family-name:var(--font-mono)] text-sm" style={{ color: tone }}>
            {s.toFixed(0)} mm
          </div>
          {/* 25mm reference */}
          <div className="absolute right-2 top-24 flex items-center gap-1 text-[9px] text-muted">
            <div className="h-[11px] w-px bg-muted" /> 25 mm limit
          </div>
        </div>

        {/* per-layer breakdown */}
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Settlement by layer under q = {q} kPa
          </div>
          {settle.perLayer.map((p) => {
            const v = p.consolidation + p.elastic;
            const max = Math.max(...settle.perLayer.map((x) => x.consolidation + x.elastic), 1);
            return (
              <div key={p.layer} className="mb-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">
                    {layers[p.layer].name}
                    <span className="ml-1 opacity-60">{p.consolidation > p.elastic ? "(consolidation)" : "(elastic)"}</span>
                  </span>
                  <span className="font-[family-name:var(--font-mono)]">{v.toFixed(1)} mm</span>
                </div>
                <div className="h-2.5 rounded-full bg-panel-2">
                  <div className="h-full rounded-full bg-accent-2 transition-all duration-500" style={{ width: `${(v / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Granular layers settle immediately (elastic, Se = Δσ·H/Es). Clays keep settling for years as
            water squeezes out (consolidation, Sc = Cc·H/(1+e₀)·log((σ&apos;₀+Δσ)/σ&apos;₀)). Buildings tolerate
            ~25 mm total and ~20 mm differential for isolated footings.
          </p>
        </div>
      </div>
      {s > 50 && (
        <InfoBox kind="warn" title="Excessive settlement">
          More than 50 mm will crack masonry and jam doors. Reduce bearing pressure, use a raft, preload
          the site, or pile through the compressible layer.
        </InfoBox>
      )}
    </div>
  );
}
