/**
 * GeoSurvey Lab — Earth material library.
 *
 * Every material carries the full set of physical properties used by the
 * geophysical and geotechnical simulators, with values taken from standard
 * references (Telford et al., "Applied Geophysics"; Bowles, "Foundation
 * Analysis and Design"; Reynolds, "An Introduction to Applied and
 * Environmental Geophysics").
 */

export interface Material {
  id: string;
  name: string;
  category: "soil" | "rock" | "fluid";
  color: string;        // cross-section fill
  hatch: "dots" | "dashes" | "bricks" | "cross" | "waves" | "none";
  resistivity: number;  // Ω·m (typical)
  resistivityRange: [number, number];
  vp: number;           // P-wave velocity, m/s
  vpRange: [number, number];
  density: number;      // g/cm³ (bulk)
  epsilon: number;      // relative dielectric permittivity (GPR)
  susceptibility: number; // magnetic susceptibility, SI ×10⁻³
  porosity: number;     // fraction
  defaultThickness: number; // m
  // Geotechnical
  sptN: number;             // typical SPT blow count
  cohesion: number;         // kPa
  frictionAngle: number;    // degrees
  unitWeight: number;       // kN/m³
  compressionIndex: number; // Cc (consolidation)
  voidRatio: number;        // e0
  uscs: string;             // USCS symbol
  description: string;
}

export const MATERIALS: Material[] = [
  {
    id: "topsoil", name: "Topsoil", category: "soil",
    color: "#6b4f2e", hatch: "dots",
    resistivity: 80, resistivityRange: [20, 300],
    vp: 400, vpRange: [200, 700],
    density: 1.5, epsilon: 12, susceptibility: 0.5, porosity: 0.45,
    defaultThickness: 1,
    sptN: 5, cohesion: 10, frictionAngle: 25, unitWeight: 15,
    compressionIndex: 0.15, voidRatio: 0.9, uscs: "OL",
    description: "Organic-rich surficial soil. Loose, variable moisture, low strength.",
  },
  {
    id: "dry-sand", name: "Dry Sand", category: "soil",
    color: "#d9b36c", hatch: "dots",
    resistivity: 1200, resistivityRange: [500, 5000],
    vp: 500, vpRange: [300, 1000],
    density: 1.6, epsilon: 4, susceptibility: 0.1, porosity: 0.35,
    defaultThickness: 3,
    sptN: 15, cohesion: 0, frictionAngle: 32, unitWeight: 16,
    compressionIndex: 0.02, voidRatio: 0.65, uscs: "SP",
    description: "Clean sand above the water table. Very resistive, fast GPR medium.",
  },
  {
    id: "wet-sand", name: "Saturated Sand", category: "soil",
    color: "#c2a05c", hatch: "dots",
    resistivity: 120, resistivityRange: [50, 400],
    vp: 1600, vpRange: [1400, 2000],
    density: 2.0, epsilon: 25, susceptibility: 0.1, porosity: 0.35,
    defaultThickness: 4,
    sptN: 20, cohesion: 0, frictionAngle: 33, unitWeight: 19,
    compressionIndex: 0.02, voidRatio: 0.6, uscs: "SW",
    description: "Sand below the water table — a classic aquifer. P-velocity jumps to ~1500 m/s at saturation.",
  },
  {
    id: "clay", name: "Clay", category: "soil",
    color: "#8c6f56", hatch: "dashes",
    resistivity: 25, resistivityRange: [5, 60],
    vp: 1500, vpRange: [1100, 2500],
    density: 1.9, epsilon: 20, susceptibility: 0.2, porosity: 0.5,
    defaultThickness: 5,
    sptN: 8, cohesion: 50, frictionAngle: 5, unitWeight: 18,
    compressionIndex: 0.35, voidRatio: 1.1, uscs: "CH",
    description: "Fine-grained, low-permeability soil. Very conductive (low resistivity) — the strongest ERT signature. Compressible: main source of consolidation settlement.",
  },
  {
    id: "silt", name: "Silt", category: "soil",
    color: "#a58a68", hatch: "dashes",
    resistivity: 60, resistivityRange: [20, 150],
    vp: 1200, vpRange: [800, 1800],
    density: 1.8, epsilon: 16, susceptibility: 0.2, porosity: 0.45,
    defaultThickness: 3,
    sptN: 10, cohesion: 20, frictionAngle: 28, unitWeight: 17,
    compressionIndex: 0.2, voidRatio: 0.9, uscs: "ML",
    description: "Intermediate between sand and clay in grain size and in nearly every physical property.",
  },
  {
    id: "gravel", name: "Gravel", category: "soil",
    color: "#b8a189", hatch: "bricks",
    resistivity: 800, resistivityRange: [300, 3000],
    vp: 900, vpRange: [500, 1500],
    density: 2.0, epsilon: 6, susceptibility: 0.1, porosity: 0.3,
    defaultThickness: 3,
    sptN: 35, cohesion: 0, frictionAngle: 38, unitWeight: 20,
    compressionIndex: 0.01, voidRatio: 0.45, uscs: "GW",
    description: "Coarse, free-draining, high-strength soil. Excellent founding material.",
  },
  {
    id: "weathered-rock", name: "Weathered Rock", category: "rock",
    color: "#8f8a7a", hatch: "cross",
    resistivity: 350, resistivityRange: [100, 1000],
    vp: 2200, vpRange: [1500, 3000],
    density: 2.2, epsilon: 9, susceptibility: 1.0, porosity: 0.2,
    defaultThickness: 6,
    sptN: 50, cohesion: 80, frictionAngle: 35, unitWeight: 21,
    compressionIndex: 0.005, voidRatio: 0.3, uscs: "—",
    description: "Chemically and mechanically altered rock. Gradational properties — often hosts fracture aquifers.",
  },
  {
    id: "fractured-rock", name: "Fractured Rock", category: "rock",
    color: "#7d7a70", hatch: "cross",
    resistivity: 900, resistivityRange: [300, 3000],
    vp: 3200, vpRange: [2500, 4200],
    density: 2.5, epsilon: 7, susceptibility: 2.0, porosity: 0.08,
    defaultThickness: 8,
    sptN: 80, cohesion: 200, frictionAngle: 40, unitWeight: 24,
    compressionIndex: 0.002, voidRatio: 0.1, uscs: "—",
    description: "Jointed bedrock. Water-filled fractures lower resistivity and seismic velocity relative to intact rock.",
  },
  {
    id: "bedrock", name: "Bedrock (Granite)", category: "rock",
    color: "#635f5c", hatch: "bricks",
    resistivity: 5000, resistivityRange: [1000, 100000],
    vp: 5200, vpRange: [4500, 6000],
    density: 2.65, epsilon: 5, susceptibility: 5.0, porosity: 0.01,
    defaultThickness: 20,
    sptN: 100, cohesion: 1000, frictionAngle: 45, unitWeight: 26,
    compressionIndex: 0.001, voidRatio: 0.02, uscs: "—",
    description: "Fresh crystalline basement. Extremely resistive, fast, dense — the classic 'geophysical basement'.",
  },
  {
    id: "limestone", name: "Limestone", category: "rock",
    color: "#9aa4ad", hatch: "bricks",
    resistivity: 2000, resistivityRange: [500, 10000],
    vp: 4000, vpRange: [3000, 6000],
    density: 2.55, epsilon: 6, susceptibility: 0.3, porosity: 0.1,
    defaultThickness: 10,
    sptN: 100, cohesion: 500, frictionAngle: 42, unitWeight: 25,
    compressionIndex: 0.001, voidRatio: 0.05, uscs: "—",
    description: "Carbonate rock — prone to karst cavities, a major geotechnical hazard detectable with GPR / gravity.",
  },
];

export const materialById = (id: string): Material =>
  MATERIALS.find((m) => m.id === id) ?? MATERIALS[0];

/** One layer of the user-built ground model. All properties editable. */
export interface GroundLayer {
  id: string;
  materialId: string;
  name: string;
  thickness: number;      // m
  resistivity: number;    // Ω·m
  vp: number;             // m/s
  density: number;        // g/cm³
  epsilon: number;
  susceptibility: number; // SI ×10⁻³
  moisture: number;       // %
  sptN: number;
  cohesion: number;       // kPa
  frictionAngle: number;  // °
  unitWeight: number;     // kN/m³
  compressionIndex: number;
  voidRatio: number;
  color: string;
  hatch: Material["hatch"];
  uscs: string;
}

let layerCounter = 0;
export function makeLayer(materialId: string, thickness?: number): GroundLayer {
  const m = materialById(materialId);
  layerCounter += 1;
  return {
    id: `L${Date.now().toString(36)}${layerCounter}`,
    materialId: m.id,
    name: m.name,
    thickness: thickness ?? m.defaultThickness,
    resistivity: m.resistivity,
    vp: m.vp,
    density: m.density,
    epsilon: m.epsilon,
    susceptibility: m.susceptibility,
    moisture: Math.round(m.porosity * 60),
    sptN: m.sptN,
    cohesion: m.cohesion,
    frictionAngle: m.frictionAngle,
    unitWeight: m.unitWeight,
    compressionIndex: m.compressionIndex,
    voidRatio: m.voidRatio,
    color: m.color,
    hatch: m.hatch,
    uscs: m.uscs,
  };
}

export const DEFAULT_GEOPHYSICS_MODEL: GroundLayer[] = [
  makeLayer("dry-sand", 2),
  makeLayer("clay", 5),
  makeLayer("weathered-rock", 8),
  makeLayer("bedrock", 20),
];

export const DEFAULT_GEOTECH_MODEL: GroundLayer[] = [
  makeLayer("topsoil", 1),
  makeLayer("clay", 4),
  makeLayer("silt", 3),
  makeLayer("wet-sand", 5),
  makeLayer("weathered-rock", 5),
  makeLayer("bedrock", 10),
];

/** Cumulative depth to the top of each layer. */
export function layerTops(layers: GroundLayer[]): number[] {
  const tops: number[] = [];
  let d = 0;
  for (const l of layers) {
    tops.push(d);
    d += l.thickness;
  }
  return tops;
}

export function totalDepth(layers: GroundLayer[]): number {
  return layers.reduce((s, l) => s + l.thickness, 0);
}

/** Layer index at a given depth (last layer extends to infinity). */
export function layerAtDepth(layers: GroundLayer[], depth: number): number {
  let d = 0;
  for (let i = 0; i < layers.length; i++) {
    d += layers[i].thickness;
    if (depth < d) return i;
  }
  return layers.length - 1;
}
