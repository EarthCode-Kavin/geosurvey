# 🌍 GeoSurvey Virtual Laboratory

**An interactive educational platform for learning geophysical and geotechnical survey methods.**

GeoSurvey has been redesigned from a production survey application into a *virtual geoscience
laboratory* — a place where students, researchers and engineers learn how surveys work by
**doing them**: build a subsurface, run virtual surveys over it, watch the physics animate,
generate synthetic data, and learn to interpret what the instruments actually see.

Think *Jupyter Notebook × PhET Simulations × GeoGebra*, for near-surface geophysics.

---

## ✨ The modules

| Module | What you do there |
| --- | --- |
| **🏠 Home** | Animated Earth cross-section introducing the three flagship physics: current flow, seismic wavefronts, radar pulses. |
| **📓 Learning Notebooks** | Five Jupyter-style interactive lessons — theory, live formulas, runnable code cells, draggable figures and quizzes. Covers resistivity, seismic refraction, GPR, gravity/magnetics, and effective stress. |
| **⚡ Geophysics Lab** | Build ground layers (thickness, resistivity, velocity, density, permittivity, susceptibility…), then run **VES, ERT, seismic refraction, GPR, magnetics, gravity and EM** over your model. Animated survey physics + live synthetic data for every method. |
| **🏗️ Geotech Lab** | Design a soil profile, drill an animated virtual borehole with SPT log, and size a real foundation: Terzaghi/Vesic bearing capacity, Meyerhof SPT rules, consolidation + elastic settlement, stress profiles, and automatic foundation recommendations. |
| **🔎 Interpretation Lab** | Guess-before-reveal exercises on sounding curves, travel-time plots, pseudosections and gravity profiles — commit to an interpretation, then face the hidden true model. |
| **📄 Report Generator** | Assembles your lab session into a professional site-investigation report (ground model, figures, logs, recommendations, limitations) — export to PDF from the browser. |

## 🧪 The physics engine

All simulation runs **client-side in TypeScript** ([lib/geophysics.ts](lib/geophysics.ts),
[lib/geotech.ts](lib/geotech.ts)) — no backend, no database, no accounts.

- **1-D DC resistivity forward model**: resistivity transform via the Pekeris recurrence +
  numerical Hankel transform with self-contained Bessel J₀/J₁ implementations.
  *Validated against the exact two-layer image-series solution to <0.4% worst-case error.*
- **Seismic refraction**: exact multilayer head-wave travel times, crossover distances,
  intercept times — including correct handling of hidden layers (velocity inversions).
- **GPR**: layered reflectivity with Ricker wavelets, conductivity-driven attenuation,
  diffraction hyperbolas from point targets, rendered as a real radargram.
- **Gravity & magnetics**: buried-sphere anomalies against host-rock contrast.
- **FDEM**: skin-depth-weighted apparent conductivity soundings.
- **Geotechnics**: general bearing-capacity equation (Vesic factors), 2:1 stress distribution,
  1-D consolidation + SPT-based elastic settlement, N₁₆₀ corrections, USCS-styled borehole logs.

Every educational page answers the same eight questions: *What is this survey? Why use it?
How does it work? What equipment? What do results mean? How to interpret them?
What are the common mistakes? Where is it used in the real world?*

## 🛠️ Tech stack

- **Next.js 16** (App Router, static prerendering) + **React 19** + **TypeScript**
- **Tailwind CSS v4** for the design system
- Custom **SVG/Canvas** scientific charts and animations — zero charting dependencies
- **localStorage** persistence so the Report Generator can assemble your whole session

## 🚀 Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

No environment variables, no database, no Docker — it's a fully static-capable frontend.

## 🎓 Intended use

University teaching, self-learning, demonstrations, workshops and research training.

> **Note:** All survey results are synthetic and use simplified (though physically grounded)
> forward models. They are for education only and must never replace real site investigation.

## 📁 Project structure

```text
app/                  # Next.js routes (home, notebooks, labs, interpret, report)
components/
  geophysics/         # Method education content, survey animations, result panels
  geotech/            # Borehole log renderer
  notebooks/          # Notebook shell + five interactive lessons
  charts.tsx          # SVG line charts, canvas heatmaps, color scales
  LayerBuilder.tsx    # Ground-model builder + cross-section renderer
lib/
  geophysics.ts       # Forward models (VES, ERT, seismic, GPR, gravity, mag, EM)
  geotech.ts          # Bearing capacity, settlement, SPT, stress profiles
  materials.ts        # Earth-material property library
  store.ts            # localStorage persistence
```

## 🤝 Contributing

Physics improvements, new notebooks, new interpretation exercises and translations are all
welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 License

MIT — see [LICENSE](LICENSE).
