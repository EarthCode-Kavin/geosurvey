export interface NotebookMeta {
  slug: string;
  number: string;
  title: string;
  description: string;
  topics: string[];
  minutes: number;
  track: "Electrical" | "Seismic" | "Electromagnetic" | "Potential fields" | "Geotechnics";
  color: string;
}

export const NOTEBOOKS: NotebookMeta[] = [
  {
    slug: "resistivity",
    number: "01",
    title: "How electricity reads the ground",
    description: "Ohm's law in a half-space, geometric factors, apparent resistivity, and the two-layer master curves — the foundation of VES and ERT.",
    topics: ["V(r) = ρI/2πr", "Geometric factor K", "Sounding curves", "Equivalence"],
    minutes: 25,
    track: "Electrical",
    color: "#f5b942",
  },
  {
    slug: "seismic",
    number: "02",
    title: "Racing waves through the ground",
    description: "Snell's law, the critical angle, head waves and travel-time curves. Includes the hidden-layer problem every engineer must know.",
    topics: ["sin θc = v₁/v₂", "Head waves", "Crossover distance", "Hidden layers"],
    minutes: 25,
    track: "Seismic",
    color: "#4fd1c5",
  },
  {
    slug: "gpr",
    number: "03",
    title: "Radar underground: GPR from first principles",
    description: "Dielectric permittivity, radar velocity, the diffraction hyperbola, attenuation — and why clay is GPR's kryptonite.",
    topics: ["v = c/√εr", "Hyperbolas", "Attenuation", "Frequency trade-off"],
    minutes: 20,
    track: "Electromagnetic",
    color: "#a78bfa",
  },
  {
    slug: "potential-fields",
    number: "04",
    title: "Gravity & magnetics: weighing the Earth",
    description: "Sphere anomalies, the half-width depth rule, and a live demonstration of the ambiguity theorem.",
    topics: ["Δg of a sphere", "Half-width rule", "Ambiguity", "µGal budgets"],
    minutes: 20,
    track: "Potential fields",
    color: "#60a5fa",
  },
  {
    slug: "effective-stress",
    number: "05",
    title: "Effective stress: the one idea that runs geotechnics",
    description: "Terzaghi's principle, pore pressure, SPT overburden corrections, and why rain makes slopes fail.",
    topics: ["σ' = σ − u", "Stress profiles", "N₁₆₀ correction", "Quicksand"],
    minutes: 20,
    track: "Geotechnics",
    color: "#fb923c",
  },
];
