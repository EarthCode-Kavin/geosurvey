"use client";

import { useMemo, useState } from "react";
import { GroundLayer, DEFAULT_GEOPHYSICS_MODEL, layerTops } from "@/lib/materials";
import { usePersistentState } from "@/lib/store";
import { LayerBuilder, CrossSection } from "@/components/LayerBuilder";
import SurveyOverlay from "@/components/geophysics/SurveyOverlay";
import { METHOD_INFO, METHOD_ORDER, MethodId } from "@/components/geophysics/methodInfo";
import { VesPanel, ErtPanel, SeismicPanel, GprPanel, MagneticPanel, GravityPanel, EmPanel } from "@/components/geophysics/panels";
import { Panel, Tabs } from "@/components/ui";

export default function GeophysicsLab() {
  const [layers, setLayers] = usePersistentState<GroundLayer[]>("geophysics-layers", DEFAULT_GEOPHYSICS_MODEL);
  const [method, setMethod] = usePersistentState<MethodId>("geophysics-method", "ves");
  const [selected, setSelected] = useState<string | null>(null);
  const [learnOpen, setLearnOpen] = useState(true);

  const info = METHOD_INFO[method];
  const waveDepths = useMemo(() => layerTops(layers).slice(1), [layers]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
          Geophysical Survey <span className="text-accent">Laboratory</span>
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted">
          Build the ground on the left — the truth only you know. Then run surveys over it and study
          what the instruments <em>actually</em> see. Change a layer and watch every dataset respond.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        {/* LEFT: model builder */}
        <div className="space-y-4">
          <Panel title="1 · Build the subsurface" subtitle="Click a layer to edit its properties">
            <LayerBuilder
              layers={layers}
              onChange={setLayers}
              selected={selected}
              onSelect={setSelected}
              properties={["resistivity", "vp", "density", "epsilon", "susceptibility", "moisture"]}
            />
          </Panel>
          <Panel title="Cross-section" subtitle={`Survey animation: ${info.short}`}>
            <CrossSection layers={layers} selected={selected} onSelect={setSelected} idPrefix="geo">
              <SurveyOverlay
                method={method}
                totalDepthM={layers.reduce((s, l) => s + l.thickness, 0)}
                waveDepths={waveDepths}
              />
            </CrossSection>
          </Panel>
        </div>

        {/* RIGHT: method + results */}
        <div className="space-y-4">
          <Panel title="2 · Choose a survey method">
            <Tabs
              tabs={METHOD_ORDER.map((id) => ({ id, label: METHOD_INFO[id].short }))}
              active={method}
              onChange={setMethod}
            />
            <div className="mt-3 rounded-xl border border-line bg-panel-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold" style={{ color: info.color }}>{info.name}</h3>
                  <p className="mt-0.5 text-xs text-muted">Measures: {info.measures}</p>
                </div>
                <button onClick={() => setLearnOpen(!learnOpen)}
                  className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:text-fg">
                  {learnOpen ? "Hide theory" : "Learn this method"}
                </button>
              </div>
              {learnOpen && (
                <div className="anim-fade-up mt-3 grid gap-3 text-sm leading-relaxed md:grid-cols-2">
                  <div className="space-y-3">
                    <InfoRow label="What is it?">{info.what}</InfoRow>
                    <InfoRow label="Why use it?">{info.why}</InfoRow>
                    <InfoRow label="How does it work?">{info.how}</InfoRow>
                  </div>
                  <div className="space-y-3">
                    <InfoRow label="Equipment">
                      <ul className="list-inside list-disc space-y-0.5">
                        {info.equipment.map((e) => <li key={e}>{e}</li>)}
                      </ul>
                    </InfoRow>
                    <InfoRow label="What do results mean?">{info.results}</InfoRow>
                    <InfoRow label="Common mistakes">
                      <ul className="list-inside list-disc space-y-0.5">
                        {info.mistakes.map((e) => <li key={e}>{e}</li>)}
                      </ul>
                    </InfoRow>
                    <InfoRow label="Real-world applications">{info.applications.join(" · ")}</InfoRow>
                  </div>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="3 · Run the survey" subtitle="Synthetic data computed live from your model">
            {method === "ves" && <VesPanel layers={layers} />}
            {method === "ert" && <ErtPanel layers={layers} />}
            {method === "seismic" && <SeismicPanel layers={layers} />}
            {method === "gpr" && <GprPanel layers={layers} />}
            {method === "magnetic" && <MagneticPanel layers={layers} />}
            {method === "gravity" && <GravityPanel layers={layers} />}
            {method === "em" && <EmPanel layers={layers} />}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="text-fg/90">{children}</div>
    </div>
  );
}
