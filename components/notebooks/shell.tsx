"use client";

/**
 * Notebook shell — Jupyter-flavoured presentation: numbered cells,
 * markdown-ish prose, runnable code cells whose "kernel" is the TypeScript
 * physics engine running live in the browser.
 */

import { ReactNode, useState } from "react";
import Link from "next/link";

let cellCounter = 0;

export function NotebookLayout({ title, subtitle, badge, children }: {
  title: string; subtitle: string; badge: string; children: ReactNode;
}) {
  cellCounter = 0;
  return (
    <div className="mx-auto max-w-4xl px-4 pt-8">
      <div className="mb-2 flex items-center gap-3 text-sm">
        <Link href="/notebooks" className="text-muted hover:text-fg">← All notebooks</Link>
        <span className="rounded-full border border-accent-2/40 bg-accent-2/10 px-2.5 py-0.5 text-xs text-accent-2">{badge}</span>
      </div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
      <div className="mt-8 space-y-6">{children}</div>
      <div className="mt-12 rounded-xl border border-line bg-panel p-4 text-sm text-muted">
        ✅ Notebook complete. Take these ideas into the{" "}
        <Link href="/geophysics" className="text-accent hover:underline">Geophysics Lab</Link> and test them on
        your own ground model.
      </div>
    </div>
  );
}

export function Md({ children }: { children: ReactNode }) {
  return (
    <div className="prose-invert max-w-none text-[15px] leading-relaxed text-fg/90 [&_strong]:text-fg [&_em]:text-accent-2">
      {children}
    </div>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-10 font-[family-name:var(--font-display)] text-xl font-semibold text-accent">{children}</h2>;
}

/**
 * Runnable code cell: shows scientific Python (as used in real practice);
 * pressing ▶ executes the equivalent TypeScript live and prints the result.
 */
export function CodeCell({ code, compute, caption }: {
  code: string;
  compute: () => string;
  caption?: string;
}) {
  const [output, setOutput] = useState<string | null>(null);
  const [ran, setRan] = useState(false);
  const n = ++cellCounter;
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="flex items-center gap-2 border-b border-line bg-panel-2 px-3 py-1.5">
        <span className="font-[family-name:var(--font-mono)] text-xs text-accent-2">In [{ran ? n : " "}]:</span>
        <span className="text-xs text-muted">{caption ?? "code"}</span>
        <button
          onClick={() => { setOutput(compute()); setRan(true); }}
          className="ml-auto rounded-md border border-good/50 bg-good/10 px-2.5 py-0.5 text-xs text-good hover:bg-good/20"
        >
          ▶ Run
        </button>
      </div>
      <pre className="overflow-x-auto bg-[#0a0f1d] px-4 py-3 font-[family-name:var(--font-mono)] text-[12.5px] leading-relaxed text-fg/90">
        {highlight(code)}
      </pre>
      {output !== null && (
        <div className="anim-fade-up border-t border-line bg-panel px-4 py-3">
          <span className="mr-2 font-[family-name:var(--font-mono)] text-xs text-warn">Out[{n}]:</span>
          <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-[family-name:var(--font-mono)] text-[12.5px] text-accent">{output}</pre>
        </div>
      )}
    </div>
  );
}

/** Extremely small "syntax highlighter" — keywords, numbers, strings, comments. */
function highlight(code: string): ReactNode[] {
  return code.split("\n").map((line, i) => {
    const parts: ReactNode[] = [];
    const commentIdx = line.indexOf("#");
    const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
    const comment = commentIdx >= 0 ? line.slice(commentIdx) : "";
    const tokens = codePart.split(/(\b(?:import|from|def|return|for|in|if|else|print|np|as|lambda)\b|\d+\.?\d*(?:e-?\d+)?|"[^"]*"|'[^']*')/g);
    tokens.forEach((tok, j) => {
      if (!tok) return;
      if (/^(import|from|def|return|for|in|if|else|as|lambda)$/.test(tok)) {
        parts.push(<span key={j} className="text-[#c792ea]">{tok}</span>);
      } else if (/^(print|np)$/.test(tok)) {
        parts.push(<span key={j} className="text-[#82aaff]">{tok}</span>);
      } else if (/^\d/.test(tok)) {
        parts.push(<span key={j} className="text-[#f78c6c]">{tok}</span>);
      } else if (/^["']/.test(tok)) {
        parts.push(<span key={j} className="text-[#c3e88d]">{tok}</span>);
      } else {
        parts.push(tok);
      }
    });
    if (comment) parts.push(<span key="c" className="text-[#546e7a]">{comment}</span>);
    return <div key={i}>{parts.length ? parts : " "}</div>;
  });
}

/** Figure cell: interactive area with a caption bar. */
export function FigureCell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="border-b border-line bg-panel-2 px-3 py-1.5 text-xs text-muted">
        <span className="mr-2 font-[family-name:var(--font-mono)] text-accent-2">⟨interactive⟩</span>{title}
      </div>
      <div className="bg-panel p-4">{children}</div>
    </div>
  );
}
