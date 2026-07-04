/**
 * Educational content for each survey method: the eight questions every
 * page must answer (what / why / how / equipment / results / interpretation
 * / mistakes / applications).
 */

export type MethodId = "ves" | "ert" | "seismic" | "gpr" | "magnetic" | "gravity" | "em";

export interface MethodInfo {
  id: MethodId;
  name: string;
  short: string;
  color: string;
  measures: string;
  what: string;
  why: string;
  how: string;
  equipment: string[];
  results: string;
  interpretation: string;
  mistakes: string[];
  applications: string[];
}

export const METHOD_INFO: Record<MethodId, MethodInfo> = {
  ves: {
    id: "ves",
    name: "Vertical Electrical Sounding (VES)",
    short: "VES",
    color: "#f5b942",
    measures: "Apparent resistivity ρₐ vs. electrode spacing (∝ depth)",
    what: "A 1-D resistivity survey. Four electrodes are placed in a line and progressively expanded around a fixed centre. Bigger spacing → current penetrates deeper → each reading averages over a thicker slice of the earth.",
    why: "The cheapest way to find depth to the water table, clay/aquifer boundaries or bedrock at a single location — a 'geo-electrical borehole' without drilling.",
    how: "Current I is injected through outer electrodes A and B; the voltage ΔV between inner electrodes M and N gives apparent resistivity ρₐ = K·ΔV/I, where K is the geometric factor (K = π(AB/2)²/MN for Schlumberger, K = 2πa for Wenner). Plotting ρₐ against AB/2 on log-log axes produces a sounding curve whose shape encodes the layering.",
    equipment: ["Resistivity meter (transmitter + receiver)", "4 steel electrodes + hammers", "Cable reels (up to several hundred metres)", "GPS + measuring tapes", "Salt water for contact in dry ground"],
    results: "A log-log sounding curve. Left side ≈ resistivity of the shallow layers; right side approaches the deep basement. Bends record each layer boundary.",
    interpretation: "Fit a 1-D layered model whose forward response matches the curve. A rising terminal branch (up to 45°) = resistive basement; a falling one = conductive basement (e.g. clay or saline water). Beware equivalence: thin layers trade thickness against resistivity.",
    mistakes: [
      "Reading depth directly from AB/2 — the depth of investigation is roughly AB/4 to AB/6, not AB/2.",
      "Ignoring the principle of equivalence — many models fit the same curve.",
      "Expanding the line over lateral geology changes (VES assumes flat layers).",
      "MN too large relative to AB (breaks the Schlumberger assumption).",
    ],
    applications: ["Groundwater exploration", "Depth to bedrock for foundations", "Saltwater-intrusion mapping", "Geothermal reconnaissance"],
  },
  ert: {
    id: "ert",
    name: "Electrical Resistivity Tomography (ERT)",
    short: "ERT",
    color: "#fbbf24",
    measures: "2-D distribution of apparent resistivity along a profile",
    what: "Dozens of electrodes in a line, automatically switched through hundreds of four-electrode combinations, produce a 2-D image (pseudosection) of resistivity beneath the profile.",
    why: "Where VES gives one point, ERT gives a picture: it maps lateral change — buried channels, fault zones, cavities, contamination plumes — as well as layering.",
    how: "A multi-core cable connects all electrodes to a switching resistivity meter. For each quadrupole the instrument records ρₐ = K·ΔV/I. Larger separations sense deeper; each datum is plotted at the array midpoint and a pseudo-depth, building a triangular data section. Inversion software then converts the pseudosection into a true resistivity model.",
    equipment: ["Multi-electrode resistivity meter (48–96 channels)", "Multi-core cables", "Stainless electrodes every a metres", "12 V battery / generator", "Inversion software (e.g. pyGIMLi, RES2DINV)"],
    results: "A colour pseudosection: blues = conductive (clay, saline, wet), reds = resistive (sand, gravel, dry rock, air-filled voids).",
    interpretation: "Work from known geology: continuous horizontal bands = layering; localized bull's-eyes = bodies (check polarity!); vertical discontinuities = faults or trenches. Remember the pseudosection is a *distorted* image — always invert before quantitative work.",
    mistakes: [
      "Treating pseudo-depth as true depth (it is a plotting convention).",
      "Over-interpreting single-datum anomalies (often electrode contact errors).",
      "Choosing an array blindly: Wenner = best signal/noise, dipole-dipole = best lateral resolution, Schlumberger = compromise.",
      "Forgetting that resolution decays rapidly with depth.",
    ],
    applications: ["Landfill and plume mapping", "Karst/cavity detection", "Dam-seepage investigation", "Archaeology", "Permafrost monitoring"],
  },
  seismic: {
    id: "seismic",
    name: "Seismic Refraction",
    short: "Seismic",
    color: "#4fd1c5",
    measures: "First-arrival travel times of P-waves vs. offset",
    what: "A hammer, weight drop or small explosive creates a sound wave in the ground. Geophones along the line record when the first energy arrives. Waves refracted along fast layers overtake the direct wave beyond a crossover distance — the travel-time plot reveals layer velocities and depths.",
    why: "Velocity is the property engineers need: it correlates with rippability, rock quality, and stiffness. Refraction is the standard tool for depth-to-bedrock profiles along roads, dams and pipelines.",
    how: "At the critical angle (sin θc = v₁/v₂) the refracted wave travels along the interface at v₂, continuously radiating energy back to the surface (a head wave). Direct wave: t = x/v₁. Head wave: t = x/v₂ + tᵢ where the intercept tᵢ = Σ 2hᵢcosθᵢ/vᵢ encodes layer thicknesses. Slopes of the travel-time branches give 1/v of each layer.",
    equipment: ["24–48 geophones + land streamer or spikes", "Seismograph", "Sledgehammer + strike plate (or accelerated weight drop)", "Trigger sensor", "Survey tapes / GNSS"],
    results: "The travel-time (t–x) graph: straight-line branches, one per layer, with slope = 1/velocity. Crossover distances mark where each deeper refractor takes over.",
    interpretation: "Fit straight lines to branches, read velocities from slopes, compute depths from intercept times. Velocities < 1500 m/s = unsaturated soils; ≈1500 m/s often just means saturation; >4000 m/s = competent rock.",
    mistakes: [
      "A hidden layer: a low-velocity layer beneath a faster one produces NO refraction branch and is invisible — depths below it are overestimated.",
      "A blind zone: a thin fast layer may never produce first arrivals.",
      "Spread too short: rule of thumb, line length ≥ 4–5× target depth.",
      "Ignoring dipping interfaces (shoot forward AND reverse!).",
    ],
    applications: ["Depth to bedrock / rippability", "Landslide slip-surface mapping", "Vs30 site classification (with MASW)", "Aggregate/quarry evaluation"],
  },
  gpr: {
    id: "gpr",
    name: "Ground Penetrating Radar (GPR)",
    short: "GPR",
    color: "#a78bfa",
    measures: "Two-way travel time of reflected electromagnetic pulses",
    what: "A radar antenna slides along the surface transmitting nanosecond electromagnetic pulses. Contrasts in dielectric permittivity (mostly = water content) reflect energy back. The record is a high-resolution image of the shallow subsurface.",
    why: "Nothing else approaches its resolution (centimetres!). The tool of choice for utilities, rebar, voids, archaeology — anywhere the target is shallow and the ground is resistive.",
    how: "Radar velocity v = c/√εr. Each interface with an εr contrast reflects a fraction R = (√εr₁−√εr₂)/(√εr₁+√εr₂) of the energy. Depth = v·t/2 from the two-way time t. Point objects (pipes) create diffraction hyperbolas whose curvature reveals velocity. Conductive ground (clay!) absorbs the signal: attenuation α ≈ 1.69·σ/√εr dB/m.",
    equipment: ["Shielded antenna (100 MHz – 1 GHz; low freq = deep, high freq = sharp)", "Control unit + odometer wheel", "Field laptop / tablet", "Marking paint for utility strikes"],
    results: "A radargram: horizontal bands = layer boundaries, hyperbolas = pipes/boulders/voids, signal white-out = clay or saline ground.",
    interpretation: "Fit hyperbolas to estimate velocity, convert time to depth, trace continuous reflectors. A 'bright spot' with phase reversal can flag an air void. Loss of signal below a certain time marks the penetration limit, not the end of geology.",
    mistakes: [
      "Using GPR over conductive clay and concluding 'nothing there' — the signal was absorbed.",
      "Wrong velocity → wrong depths (calibrate on a known target!).",
      "Choosing high frequency for deep targets (500 MHz rarely sees below ~2 m).",
      "Interpreting surface reflections/antenna ringing as geology.",
    ],
    applications: ["Utility location", "Rebar and slab inspection", "Archaeology", "Void/karst detection", "Snow, ice and peat thickness"],
  },
  magnetic: {
    id: "magnetic",
    name: "Magnetic Survey",
    short: "Magnetics",
    color: "#f472b6",
    measures: "Total magnetic field intensity (nT) along a profile/grid",
    what: "A magnetometer walks a grid measuring tiny distortions of Earth's field (~48,000 nT) caused by magnetized bodies — magnetite-rich rocks, steel objects, fired archaeology.",
    why: "Fast, cheap and totally passive: kilometres per day, no source needed. Unmatched for finding buried steel (drums, USTs, pipelines) and mapping magnetic basement.",
    how: "Bodies with magnetic susceptibility χ acquire induced magnetization M = χH in Earth's field. A buried compact body behaves like a dipole: at mid-northern latitudes its anomaly shows a positive lobe with a northern negative trough; anomaly width ≈ depth (the half-width rule). Diurnal field wander must be removed using a base station.",
    equipment: ["Proton-precession / Overhauser / cesium magnetometer", "Base-station magnetometer for diurnal correction", "GNSS", "Non-magnetic clothing (no steel boots!)"],
    results: "Profile or contour map of total-field anomalies in nT — dipolar highs/lows over compact sources, long wavelengths from deep geology.",
    interpretation: "Depth rules: anomaly half-width ≈ source depth for a sphere. Sharp = shallow, broad = deep. Reduce-to-pole to centre anomalies over sources. Remove regional gradients first.",
    mistakes: [
      "Surveying with steel on the operator (zippers, phones) — self-inflicted anomalies.",
      "No diurnal correction — solar variation masquerades as geology.",
      "Forgetting remanent magnetization can defeat the induced-dipole assumption.",
      "Line spacing coarser than target depth — aliasing.",
    ],
    applications: ["UXO and drum detection", "Mineral exploration (iron, kimberlites)", "Archaeology (kilns, hearths)", "Basement mapping under sediments"],
  },
  gravity: {
    id: "gravity",
    name: "Gravity Survey",
    short: "Gravity",
    color: "#60a5fa",
    measures: "Variations of gravitational acceleration g (mGal, μGal)",
    what: "A gravimeter measures differences in g of parts-per-billion. Dense bodies pull a little harder; voids and low-density sediments a little less. After careful corrections, the residual anomaly maps subsurface density.",
    why: "The only method that responds directly to mass — the definitive tool for cavities/sinkholes (mass deficit), basin depth, and monitoring (e.g. aquifer storage change with time-lapse microgravity).",
    how: "Δg of a buried sphere: Δg = 4/3·πG·Δρ·R³·z/(x²+z²)^(3/2). Raw readings need drift, latitude, free-air (−0.3086 mGal/m) and Bouguer (+0.0419·ρ mGal/m) corrections — the corrections are often larger than the anomaly! Precision levelling of station elevations is essential.",
    equipment: ["Relative gravimeter (spring or superconducting; μGal class)", "Precise levelling / RTK GNSS for elevations", "Base station for drift loops", "Patience — one station takes minutes"],
    results: "Bouguer anomaly profile/map. Negative bull's-eye = mass deficit (cavity, low-density fill); broad lows = deep basins.",
    interpretation: "Anomaly amplitude scales with Δρ·R³ (ambiguity!) — a small shallow body mimics a large deep one. Half-width ≈ 1.3× depth for a sphere. Always constrain with drilling or another method.",
    mistakes: [
      "Sloppy elevations: 3 cm of survey error = 0.01 mGal ≈ a small cavity signal.",
      "Skipping drift loops (springs creep continuously).",
      "Interpreting Bouguer maps without removing the regional trend.",
      "Forgetting non-uniqueness — infinitely many density models fit one profile.",
    ],
    applications: ["Karst/void hazards", "Sedimentary basin mapping", "Volcano and geothermal monitoring", "Regional tectonics"],
  },
  em: {
    id: "em",
    name: "Electromagnetic Survey (FDEM)",
    short: "EM",
    color: "#34d399",
    measures: "Apparent electrical conductivity σₐ (mS/m)",
    what: "A transmitter coil broadcasts an alternating magnetic field; ground currents induced by it broadcast a secondary field read by a receiver coil. No electrodes, no ground contact — conductivity mapping at walking pace.",
    why: "10× faster than ERT for mapping: soil salinity, contamination plumes, clay content, buried metal. The workhorse of precision agriculture and environmental screening.",
    how: "Induction obeys the skin-depth law δ = 503·√(ρ/f) m — low frequencies (or large coil separations) see deeper. At 'low induction number' the quadrature response is directly proportional to ground conductivity (McNeill 1980), so the instrument reads σₐ directly. Sounding = measuring at several frequencies/geometries.",
    equipment: ["Ground-conductivity meter (e.g. EM31/EM38-style)", "GNSS logging", "Optionally towed sled / quad bike"],
    results: "Conductivity vs. position (mapping mode) or vs. frequency/geometry (sounding mode). Metal objects give sharp in-phase spikes.",
    interpretation: "High σₐ = clay, saline moisture or metal; low σₐ = clean sands, dry rock. In sounding mode, rising σₐ with lower frequency = conductor at depth.",
    mistakes: [
      "Using EM near fences, powerlines, rebar — cultural interference dominates.",
      "Assuming fixed exploration depth — it shifts with ground conductivity itself.",
      "Ignoring instrument drift with temperature.",
      "Applying the low-induction-number approximation over very conductive ground where it breaks down.",
    ],
    applications: ["Soil salinity mapping", "Contaminant plume screening", "Buried metal / UST detection", "Groundwater reconnaissance"],
  },
};

export const METHOD_ORDER: MethodId[] = ["ves", "ert", "seismic", "gpr", "magnetic", "gravity", "em"];
