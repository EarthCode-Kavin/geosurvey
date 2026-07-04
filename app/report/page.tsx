"use client";

/**
 * Report Generator — assembles the student's session (ground models from both
 * laboratories) into a professional site-investigation report, print-ready
 * as PDF via the browser (Ctrl+P → Save as PDF).
 */

import { useMemo } from "react";
import { usePersistentState, SiteInfo } from "@/lib/store";
import { GroundLayer, DEFAULT_GEOPHYSICS_MODEL, DEFAULT_GEOTECH_MODEL, layerTops, totalDepth } from "@/lib/materials";
import { vesSchlumberger, logspace, seismicRefraction } from "@/lib/geophysics";
import { toLayer1D } from "@/components/geophysics/panels";
import {
  bearingCapacity, settlement, syntheticSptLog, foundationRecommendation,
} from "@/lib/geotech";
import { CrossSection } from "@/components/LayerBuilder";
import BoreholeLog from "@/components/geotech/BoreholeLog";
import { LineChart } from "@/components/charts";
import { METHOD_INFO, MethodId } from "@/components/geophysics/methodInfo";

const today = () => new Date().toISOString().slice(0, 10);

export default function ReportPage() {
  const [site, setSite] = usePersistentState<SiteInfo>("site-info", {
    projectName: "Proposed Development — Site A",
    client: "GeoSurvey Lab (training)",
    location: "Virtual site, GeoSurvey Laboratory",
    engineer: "Student Engineer",
    date: today(),
    objective: "Characterize subsurface conditions, determine depth to bedrock and groundwater, and provide preliminary foundation recommendations.",
  });
  const [geoLayers] = usePersistentState<GroundLayer[]>("geophysics-layers", DEFAULT_GEOPHYSICS_MODEL);
  const [method] = usePersistentState<MethodId>("geophysics-method", "ves");
  const [gtLayers] = usePersistentState<GroundLayer[]>("geotech-layers", DEFAULT_GEOTECH_MODEL);
  const [gwt] = usePersistentState<number>("geotech-gwt", 3);
  const [B] = usePersistentState<number>("geotech-b", 2);
  const [Df] = usePersistentState<number>("geotech-df", 1.5);
  const [q] = usePersistentState<number>("geotech-q", 150);

  const spacings = useMemo(() => logspace(1, 300, 22), []);
  const ves = useMemo(() => vesSchlumberger(toLayer1D(geoLayers), spacings), [geoLayers, spacings]);
  const seis = useMemo(() => seismicRefraction(toLayer1D(geoLayers), 120), [geoLayers]);
  const spt = useMemo(() => syntheticSptLog(gtLayers, gwt), [gtLayers, gwt]);
  const bearing = useMemo(() => bearingCapacity(gtLayers, gwt, B, Df), [gtLayers, gwt, B, Df]);
  const settle = useMemo(() => settlement(gtLayers, gwt, q, B, B, Df), [gtLayers, gwt, q, B, Df]);
  const advice = useMemo(() => foundationRecommendation(gtLayers, gwt, bearing, settle.total), [gtLayers, gwt, bearing, settle]);

  const geoTops = layerTops(geoLayers);
  const rockLayer = gtLayers.findIndex((l) => l.sptN >= 50);
  const rockDepth = rockLayer >= 0 ? layerTops(gtLayers)[rockLayer] : null;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-8">
      {/* Controls (screen only) */}
      <div className="no-print mb-6 rounded-2xl border border-line bg-panel p-5">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
          Report <span className="text-accent">Generator</span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          This report is assembled live from your Geophysics Lab and Geotech Lab sessions. Edit the
          header fields, then export — the browser print dialog saves a clean A4 PDF.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {([
            ["projectName", "Project name"], ["client", "Client"], ["location", "Location"],
            ["engineer", "Engineer / student"], ["date", "Date"],
          ] as const).map(([key, label]) => (
            <label key={key} className="block text-xs">
              <span className="text-muted">{label}</span>
              <input
                value={site[key]}
                onChange={(e) => setSite({ ...site, [key]: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-sm outline-none focus:border-accent"
              />
            </label>
          ))}
          <label className="block text-xs md:col-span-3">
            <span className="text-muted">Objective</span>
            <textarea
              value={site.objective}
              onChange={(e) => setSite({ ...site, objective: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-sm outline-none focus:border-accent"
            />
          </label>
        </div>
        <button
          onClick={() => window.print()}
          className="mt-4 rounded-xl bg-accent px-5 py-2.5 font-medium text-ink transition-transform hover:scale-[1.02]"
        >
          🖨 Export as PDF
        </button>
      </div>

      {/* THE REPORT (paper-styled) */}
      <div className="paper rounded-xl bg-white p-8 text-slate-800 shadow-2xl md:p-12 print:rounded-none print:p-0 print:shadow-none">
        {/* Cover */}
        <div className="border-b-4 border-slate-800 pb-6">
          <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Geotechnical & Geophysical Site Investigation</div>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-slate-900">{site.projectName}</h1>
          <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1 text-sm md:grid-cols-4">
            <Field k="Client" v={site.client} />
            <Field k="Location" v={site.location} />
            <Field k="Engineer" v={site.engineer} />
            <Field k="Date" v={site.date} />
          </div>
        </div>

        <Section n="1" title="Introduction and Objective">
          <p>{site.objective}</p>
          <p className="mt-2">
            The investigation combined non-invasive geophysical profiling ({METHOD_INFO[method].name}
            {method !== "seismic" ? " and seismic refraction" : ""}) with a geotechnical borehole
            including Standard Penetration Testing (SPT). All data in this training report are synthetic,
            generated by the GeoSurvey Laboratory forward-modelling engine from the user-defined ground model.
          </p>
        </Section>

        <Section n="2" title="Ground Model">
          <div className="grid gap-6 md:grid-cols-[280px_1fr]">
            <div className="print-block">
              <CrossSection layers={geoLayers} width={280} height={330} idPrefix="rep" />
              <p className="mt-1 text-center text-xs text-slate-500">Figure 2.1 — Interpreted cross-section</p>
            </div>
            <table className="h-fit w-full border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-700 text-left">
                  {["Layer", "Depth (m)", "Thickness (m)", "ρ (Ω·m)", "Vp (m/s)", "Density (g/cc)"].map((h) => (
                    <th key={h} className="py-1.5 pr-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {geoLayers.map((l, i) => (
                  <tr key={l.id} className="border-b border-slate-200">
                    <td className="py-1.5 pr-2 font-medium">{l.name}</td>
                    <td className="py-1.5 pr-2">{geoTops[i].toFixed(1)}–{(geoTops[i] + l.thickness).toFixed(1)}</td>
                    <td className="py-1.5 pr-2">{l.thickness.toFixed(1)}</td>
                    <td className="py-1.5 pr-2">{l.resistivity.toLocaleString()}</td>
                    <td className="py-1.5 pr-2">{l.vp.toLocaleString()}</td>
                    <td className="py-1.5 pr-2">{l.density.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section n="3" title="Geophysical Survey Results">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="print-block">
              <LineChart series={[{ x: spacings, y: ves, color: "#b45309", points: true, label: "ρₐ (Schlumberger)" }]}
                logX logY height={280} xLabel="AB/2 (m)" yLabel="ρₐ (Ω·m)" />
              <p className="mt-1 text-center text-xs text-slate-500">Figure 3.1 — Vertical electrical sounding</p>
            </div>
            <div className="print-block">
              <LineChart series={[{ x: seis.offsets, y: seis.firstArrivals, color: "#0f766e", points: true, label: "first arrivals" }]}
                height={280} xLabel="offset (m)" yLabel="t (ms)" />
              <p className="mt-1 text-center text-xs text-slate-500">Figure 3.2 — Seismic refraction travel times</p>
            </div>
          </div>
          <p className="mt-3">
            The sounding curve indicates a {ves[0] > ves[ves.length - 1] ? "generally fining/conductive" : "coarsening/resistive"}{" "}
            sequence with surface apparent resistivity of ≈{ves[0].toFixed(0)} Ω·m trending to
            ≈{ves[ves.length - 1].toFixed(0)} Ω·m at depth. Seismic velocities range from{" "}
            {Math.min(...geoLayers.map((l) => l.vp)).toLocaleString()} m/s (surficial deposits) to{" "}
            {Math.max(...geoLayers.map((l) => l.vp)).toLocaleString()} m/s
            {seis.hiddenLayers.length > 0 && (
              <> — note: {seis.hiddenLayers.length} velocity inversion(s) present; refraction depths below
              the inversion are unreliable and were checked against the borehole</>
            )}.
          </p>
        </Section>

        <Section n="4" title="Geotechnical Investigation" pageBreak>
          <div className="grid gap-6 md:grid-cols-[1fr_240px]">
            <div className="print-block">
              <BoreholeLog layers={gtLayers} spt={spt} waterTableDepth={gwt} width={460} height={430} />
              <p className="mt-1 text-center text-xs text-slate-500">Figure 4.1 — Borehole log BH-01 with SPT profile</p>
            </div>
            <div className="space-y-2 text-sm">
              <Kv k="Borehole depth" v={`${totalDepth(gtLayers).toFixed(1)} m`} />
              <Kv k="Groundwater" v={`${gwt.toFixed(1)} m bgl`} />
              <Kv k="Depth to competent stratum" v={rockDepth !== null ? `${rockDepth.toFixed(1)} m` : "not encountered"} />
              <Kv k="Footing analysed" v={`${B.toFixed(2)} m square @ ${Df.toFixed(2)} m`} />
              <Kv k="Applied pressure" v={`${q} kPa`} />
              <Kv k="Ultimate bearing capacity" v={`${bearing.qUltimate.toFixed(0)} kPa`} />
              <Kv k="Allowable bearing (FS=3)" v={`${bearing.qAllowable.toFixed(0)} kPa`} />
              <Kv k="Estimated settlement" v={`${settle.total.toFixed(0)} mm`} />
            </div>
          </div>
        </Section>

        <Section n="5" title="Engineering Recommendations">
          <p className="font-semibold text-slate-900">Recommended foundation: {advice.type}</p>
          <p className="mt-1">{advice.reason}</p>
          {advice.cautions.length > 0 && (
            <>
              <p className="mt-3 font-semibold text-slate-900">Cautions and construction considerations:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {advice.cautions.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </>
          )}
          <p className="mt-3">
            Bearing capacity computed with the general equation (Vesic factors: Nc={bearing.Nc.toFixed(1)},
            Nq={bearing.Nq.toFixed(1)}, Nγ={bearing.Ngamma.toFixed(1)}); settlement from 1-D consolidation
            theory for cohesive strata and SPT-based elastic modulus (Es ≈ 766·N kPa) for granular strata.
          </p>
        </Section>

        <Section n="6" title="Limitations">
          <p>
            This is a training document produced by the GeoSurvey Virtual Laboratory. All measurements are
            synthetic and generated from a user-defined model; the report structure follows professional
            practice, but no real site data are represented. In real investigations: geophysical models are
            non-unique and must be verified by drilling; SPT values require equipment-specific energy
            calibration; and recommendations would reference applicable codes (e.g. Eurocode 7, IS 6403,
            ASCE guidance).
          </p>
        </Section>

        <div className="mt-8 flex items-end justify-between border-t border-slate-300 pt-4 text-xs text-slate-500">
          <span>GeoSurvey Virtual Laboratory — generated {site.date}</span>
          <span className="text-right">
            ____________________________<br />{site.engineer}
          </span>
        </div>
      </div>

    </div>
  );
}

/* ------------------------------------------------------------------ */

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{k}</div>
      <div className="font-medium text-slate-800">{v}</div>
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-slate-200 py-1">
      <span className="text-slate-500">{k}</span>
      <span className="font-medium text-slate-800">{v}</span>
    </div>
  );
}

function Section({ n, title, children, pageBreak = false }: {
  n: string; title: string; children: React.ReactNode; pageBreak?: boolean;
}) {
  return (
    <section className={`mt-8 ${pageBreak ? "print-page-before" : ""}`}>
      <h2 className="border-b border-slate-300 pb-1 font-[family-name:var(--font-display)] text-lg font-bold text-slate-900">
        {n}. {title}
      </h2>
      <div className="mt-3 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}
