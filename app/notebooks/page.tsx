import Link from "next/link";
import { NOTEBOOKS } from "@/lib/notebooks";

export const metadata = { title: "Learning Notebooks — GeoSurvey Lab" };

export default function NotebooksIndex() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-10">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
          Learning <span className="text-accent">Notebooks</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Interactive lessons in the style of a Jupyter notebook: theory in small doses, live formulas,
          runnable code cells, figures you can drag, and quizzes that bite back. Work through them in
          order or jump to what you need.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {NOTEBOOKS.map((nb) => (
          <Link key={nb.slug} href={`/notebooks/${nb.slug}`}
            className="group rounded-2xl border border-line bg-panel p-5 transition-all hover:-translate-y-0.5 hover:border-line-2">
            <div className="flex items-center justify-between">
              <span className="font-[family-name:var(--font-mono)] text-sm" style={{ color: nb.color }}>
                Notebook {nb.number} · {nb.track}
              </span>
              <span className="text-xs text-muted">~{nb.minutes} min</span>
            </div>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold group-hover:text-accent">
              {nb.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{nb.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {nb.topics.map((t) => (
                <span key={t} className="rounded-full border border-line bg-panel-2 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[11px] text-muted">
                  {t}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-line-2 p-5 text-sm text-muted">
        <strong className="text-fg">How to use these:</strong> every notebook ends with quiz questions and
        points you to a laboratory exercise. The code cells show scientific Python exactly as practitioners
        write it — pressing <span className="text-good">▶ Run</span> executes the same computation live in
        your browser via the lab&apos;s TypeScript physics engine.
      </div>
    </div>
  );
}
