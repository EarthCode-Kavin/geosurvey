import Link from "next/link";
import EarthHero from "@/components/EarthHero";

const MODULES = [
  {
    href: "/notebooks", icon: "📓", title: "Learning Notebooks",
    text: "Interactive, Jupyter-style lessons. Read the theory, drag the parameters, watch the physics respond — then test yourself.",
    accent: "from-amber-400/20",
  },
  {
    href: "/geophysics", icon: "⚡", title: "Geophysical Survey Lab",
    text: "Build a subsurface layer by layer, then run ERT, VES, seismic refraction, GPR, magnetics, gravity and EM over it — with live animations and synthetic data.",
    accent: "from-teal-400/20",
  },
  {
    href: "/geotech", icon: "🏗️", title: "Geotechnical Lab",
    text: "Design a soil profile, drill a virtual borehole, read SPT logs, and compute bearing capacity, settlement and foundation recommendations.",
    accent: "from-orange-400/20",
  },
  {
    href: "/interpret", icon: "🔎", title: "Interpretation Lab",
    text: "Real skills practice: read pseudosections, travel-time curves and borehole logs. Commit to an interpretation before the answer is revealed.",
    accent: "from-violet-400/20",
  },
  {
    href: "/report", icon: "📄", title: "Report Generator",
    text: "Turn your lab session into a professional site-investigation report — ground model, figures, results and engineering recommendations. Export to PDF.",
    accent: "from-sky-400/20",
  },
];

const METHODS = [
  ["ERT", "Electrical Resistivity Tomography"],
  ["VES", "Vertical Electrical Sounding"],
  ["SRT", "Seismic Refraction"],
  ["GPR", "Ground Penetrating Radar"],
  ["MAG", "Magnetic Survey"],
  ["GRAV", "Gravity Survey"],
  ["EM", "Electromagnetic Survey"],
  ["SPT", "Standard Penetration Test"],
];

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* HERO */}
      <section className="grid items-center gap-8 pt-10 md:grid-cols-2 md:pt-16">
        <div className="stagger">
          <p className="mb-3 inline-block rounded-full border border-accent-2/40 bg-accent-2/10 px-3 py-1 text-xs tracking-wide text-accent-2">
            A virtual geoscience laboratory · no equipment required
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight md:text-5xl">
            See what the ground <span className="text-accent">hides</span>.
            Learn how surveys <span className="text-accent-2">reveal it</span>.
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-muted">
            GeoSurvey Lab teaches geophysical and geotechnical site investigation the way it
            should be taught — by <strong className="text-fg">doing</strong>. Build your own
            subsurface, fire seismic waves through it, push current into it, drill it,
            and learn to read what comes back.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/geophysics"
              className="rounded-xl bg-accent px-5 py-2.5 font-medium text-ink transition-transform hover:scale-[1.03]">
              Enter the Lab →
            </Link>
            <Link href="/notebooks"
              className="rounded-xl border border-line-2 bg-panel px-5 py-2.5 font-medium text-fg transition-colors hover:border-accent-2 hover:text-accent-2">
              Start with the Notebooks
            </Link>
          </div>
        </div>
        <div className="anim-fade-up">
          <EarthHero />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mt-20">
        <h2 className="text-center font-[family-name:var(--font-display)] text-2xl font-semibold">
          One loop, three skills
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted">
          Every module follows the same scientific loop used on real projects.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["1 · Build", "Stack soil and rock layers, set their physical properties — resistivity, velocity, density, strength, moisture.", "🧱"],
            ["2 · Survey", "Choose a method and watch the physics: current flow, wavefronts, radar pulses, anomalies. The instrument records synthetic data.", "📡"],
            ["3 · Interpret", "Read the curves and sections the way a geophysicist does — and check yourself against the true model you built.", "🧠"],
          ].map(([t, d, icon]) => (
            <div key={t} className="rounded-2xl border border-line bg-panel p-5">
              <div className="text-2xl">{icon}</div>
              <h3 className="mt-2 font-semibold text-accent">{t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MODULES */}
      <section className="mt-20">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">Explore the modules</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((mod) => (
            <Link key={mod.href} href={mod.href}
              className={`group relative overflow-hidden rounded-2xl border border-line bg-panel p-5 transition-all hover:-translate-y-0.5 hover:border-line-2`}>
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${mod.accent} to-transparent opacity-0 transition-opacity group-hover:opacity-100`} />
              <div className="text-2xl">{mod.icon}</div>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold">{mod.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{mod.text}</p>
              <span className="mt-3 inline-block text-sm text-accent opacity-0 transition-opacity group-hover:opacity-100">Open →</span>
            </Link>
          ))}
          <div className="rounded-2xl border border-dashed border-line-2 p-5">
            <div className="text-2xl">🎓</div>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold">Made for teaching</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              University courses, workshops, self-study, research training. Everything runs in
              the browser, fully client-side — project it, share it, fork it.
            </p>
          </div>
        </div>
      </section>

      {/* METHODS STRIP */}
      <section className="mt-20 rounded-2xl border border-line bg-panel p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">Survey methods covered</h2>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {METHODS.map(([abbr, name]) => (
            <span key={abbr} className="rounded-full border border-line-2 bg-panel-2 px-3.5 py-1.5 text-sm">
              <span className="font-[family-name:var(--font-mono)] text-accent">{abbr}</span>
              <span className="ml-2 text-muted">{name}</span>
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Each method is presented with the same discipline: <em className="text-fg">what</em> it measures,{" "}
          <em className="text-fg">why</em> you would choose it, <em className="text-fg">how</em> the physics works,
          what the <em className="text-fg">equipment</em> looks like in the field, how to <em className="text-fg">read
          the results</em> — and the classic mistakes to avoid.
        </p>
      </section>
    </div>
  );
}
