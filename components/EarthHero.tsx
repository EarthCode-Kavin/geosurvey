"use client";

/**
 * Animated Earth cross-section for the landing page.
 * A requestAnimationFrame canvas that cycles through the three flagship
 * survey physics: electrical current flow, seismic wavefronts, GPR pulses.
 */

import { useEffect, useRef, useState } from "react";

const LAYERS = [
  { name: "Topsoil", color: "#6b4f2e", h: 0.09 },
  { name: "Sand", color: "#d9b36c", h: 0.16 },
  { name: "Clay (aquitard)", color: "#8c6f56", h: 0.2 },
  { name: "Saturated sand — aquifer", color: "#b3985f", h: 0.22 },
  { name: "Weathered rock", color: "#8f8a7a", h: 0.14 },
  { name: "Bedrock", color: "#635f5c", h: 0.19 },
];

const MODES = [
  { id: "ert", label: "Electrical Resistivity — current flows through the ground", color: "#f5b942" },
  { id: "seismic", label: "Seismic Refraction — waves bend at layer boundaries", color: "#4fd1c5" },
  { id: "gpr", label: "Ground Penetrating Radar — reflections from interfaces", color: "#a78bfa" },
];

export default function EarthHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState(0);
  const modeRef = useRef(0);
  modeRef.current = mode;

  useEffect(() => {
    const id = setInterval(() => setMode((m) => (m + 1) % MODES.length), 6000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let start = performance.now();
    let lastMode = modeRef.current;

    const draw = (now: number) => {
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (modeRef.current !== lastMode) { lastMode = modeRef.current; start = now; }
      const t = (now - start) / 1000;
      const m = MODES[modeRef.current];

      ctx.clearRect(0, 0, W, H);

      const groundY = H * 0.22;

      // sky glow
      const sky = ctx.createLinearGradient(0, 0, 0, groundY);
      sky.addColorStop(0, "#0b1120");
      sky.addColorStop(1, "#14203b");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, groundY);

      // stars
      for (let i = 0; i < 26; i++) {
        const sx = ((i * 137.5) % 360 / 360) * W;
        const sy = ((i * 73.1) % 100 / 100) * groundY * 0.8;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(now / 900 + i));
        ctx.fillStyle = `rgba(219,228,245,${0.35 * tw})`;
        ctx.fillRect(sx, sy, 1.4, 1.4);
      }

      // layers
      let y = groundY;
      const totalH = H - groundY;
      LAYERS.forEach((l, i) => {
        const lh = l.h * totalH;
        ctx.fillStyle = l.color;
        ctx.beginPath();
        const wob = (x: number, yy: number) => yy + Math.sin(x / 90 + i * 2.2) * 5;
        ctx.moveTo(0, wob(0, y));
        for (let x = 0; x <= W; x += 12) ctx.lineTo(x, wob(x, y));
        for (let x = W; x >= 0; x -= 12) ctx.lineTo(x, wob(x, y + lh));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.16)";
        ctx.fill();
        ctx.fillStyle = l.color;
        ctx.globalAlpha = 0.92;
        ctx.fill();
        ctx.globalAlpha = 1;
        // label
        if (W > 500) {
          ctx.fillStyle = "rgba(255,255,255,0.75)";
          ctx.font = "11px var(--font-body), sans-serif";
          ctx.fillText(l.name, 14, y + lh / 2 + 4);
        }
        y += lh;
      });

      // ground line
      ctx.strokeStyle = "#5b6f96";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      for (let x = 0; x <= W; x += 12) ctx.lineTo(x, groundY + Math.sin(x / 90) * 5);
      ctx.stroke();

      const cx = W * 0.52;

      if (m.id === "ert") {
        // electrodes
        const eA = W * 0.3, eB = W * 0.74;
        for (const ex of [eA, W * 0.44, W * 0.6, eB]) {
          ctx.fillStyle = "#f5b942";
          ctx.fillRect(ex - 2.5, groundY - 16, 5, 18);
          ctx.beginPath();
          ctx.arc(ex, groundY - 18, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
        // cable
        ctx.strokeStyle = "rgba(245,185,66,0.6)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(eA, groundY - 18);
        ctx.quadraticCurveTo((eA + eB) / 2, groundY - 44, eB, groundY - 18);
        ctx.stroke();

        // current flow lines: half-ellipse arcs between A and B with moving dashes
        const phase = (t * 26) % 20;
        ctx.setLineDash([7, 13]);
        ctx.lineDashOffset = -phase;
        for (let k = 1; k <= 6; k++) {
          const depth = (k / 6.5) * (H - groundY) * 0.85;
          ctx.strokeStyle = `rgba(245,185,66,${0.75 - k * 0.09})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(eA, groundY);
          ctx.bezierCurveTo(eA, groundY + depth * 1.25, eB, groundY + depth * 1.25, eB, groundY);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        // equipotentials
        for (let k = 1; k <= 3; k++) {
          ctx.strokeStyle = `rgba(79,209,197,${0.3 - k * 0.07})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(eA, groundY, 16 * k, 0, Math.PI);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(eB, groundY, 16 * k, 0, Math.PI);
          ctx.stroke();
        }
      }

      if (m.id === "seismic") {
        // source
        ctx.fillStyle = "#4fd1c5";
        ctx.fillRect(W * 0.2 - 6, groundY - 14, 12, 14);
        // geophones
        for (let g = 0; g < 8; g++) {
          const gx = W * 0.3 + g * W * 0.065;
          ctx.fillStyle = "#8b9ab8";
          ctx.beginPath();
          ctx.moveTo(gx - 4, groundY - 1);
          ctx.lineTo(gx + 4, groundY - 1);
          ctx.lineTo(gx, groundY - 10);
          ctx.closePath();
          ctx.fill();
        }
        // expanding wavefronts (repeat every 3.2 s)
        const cycle = (t % 3.2) / 3.2;
        const sx = W * 0.2;
        const maxR = W * 0.7;
        for (let w = 0; w < 3; w++) {
          const r = ((cycle + w * 0.16) % 1) * maxR;
          const alpha = Math.max(0, 0.8 - (r / maxR));
          ctx.strokeStyle = `rgba(79,209,197,${alpha})`;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(sx, groundY, r, 0, Math.PI);
          ctx.stroke();
        }
        // refracted head-wave along the 3rd interface
        const iy = groundY + (LAYERS[0].h + LAYERS[1].h + LAYERS[2].h) * totalH;
        const hw = ((cycle * 1.6) % 1) * W;
        ctx.strokeStyle = "rgba(79,209,197,0.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.max(sx, hw - 90), iy);
        ctx.lineTo(Math.min(W, hw), iy);
        ctx.stroke();
        // upgoing rays from head wave
        for (let k = 0; k < 3; k++) {
          const rx = hw - k * 55;
          if (rx > sx && rx < W) {
            ctx.strokeStyle = "rgba(79,209,197,0.4)";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(rx, iy);
            ctx.lineTo(rx + 26, groundY);
            ctx.stroke();
          }
        }
      }

      if (m.id === "gpr") {
        // antenna box moving across the surface
        const ax = W * (0.18 + 0.6 * ((t / 5.5) % 1));
        ctx.fillStyle = "#a78bfa";
        ctx.fillRect(ax - 16, groundY - 16, 32, 12);
        ctx.fillStyle = "#0b1120";
        ctx.fillRect(ax - 11, groundY - 13, 22, 6);
        // downgoing + reflected pulses
        const pulse = (t * 2.2) % 1;
        const i1 = groundY + (LAYERS[0].h + LAYERS[1].h) * totalH;
        const i2 = groundY + (LAYERS[0].h + LAYERS[1].h + LAYERS[2].h) * totalH;
        for (const iy of [i1, i2]) {
          const d = iy - groundY;
          const py = groundY + pulse * 2 * d;
          const yy = py <= iy ? py : 2 * iy - py; // reflect
          const alpha = 0.9 - pulse * 0.5;
          ctx.strokeStyle = `rgba(167,139,250,${alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ax, yy, 7, 0, Math.PI * 2);
          ctx.stroke();
        }
        // buried pipe target
        const px = W * 0.62;
        ctx.fillStyle = "#4fd1c5";
        ctx.beginPath();
        ctx.arc(px, i2 + 26, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(79,209,197,0.5)";
        const rr = 10 + ((t * 22) % 26);
        ctx.beginPath();
        ctx.arc(px, i2 + 26, rr, 0, Math.PI * 2);
        ctx.stroke();
      }

      // borehole on right side
      const bx = W * 0.88;
      ctx.strokeStyle = "rgba(219,228,245,0.5)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bx, groundY);
      ctx.lineTo(bx, H * 0.86);
      ctx.stroke();
      ctx.strokeStyle = "rgba(219,228,245,0.9)";
      ctx.lineWidth = 1;
      const probeY = groundY + ((Math.sin(now / 2400) + 1) / 2) * (H * 0.86 - groundY - 12);
      ctx.fillStyle = "#f5b942";
      ctx.fillRect(bx - 4, probeY, 8, 12);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line">
      <canvas ref={canvasRef} className="block h-[340px] w-full md:h-[420px]" />
      <div className="absolute bottom-0 left-0 right-0 flex flex-wrap items-center gap-2 bg-gradient-to-t from-ink/95 to-transparent px-4 pb-3 pt-8">
        {MODES.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setMode(i)}
            className={`rounded-full border px-3 py-1 text-xs transition-all ${
              i === mode ? "border-current bg-panel" : "border-line text-muted hover:text-fg"
            }`}
            style={i === mode ? { color: m.color } : undefined}
          >
            {i === mode ? "● " : ""}{m.label.split(" — ")[0]}
          </button>
        ))}
        <span className="ml-auto hidden text-xs text-muted md:block">{MODES[mode].label.split(" — ")[1]}</span>
      </div>
    </div>
  );
}
