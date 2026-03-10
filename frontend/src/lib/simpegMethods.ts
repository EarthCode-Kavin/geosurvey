/**
 * SimPEG Methods Configuration
 * This file contains all the defined geophysical methods provided by SimPEG, 
 * categorized by physical property, with relevant column definitions and citations.
 */

export interface DataColumn {
    key: string;
    label: string;
    placeholder?: string;
}

export interface SimpegMethod {
    id: string;
    title: string;
    category: string;
    description: string;
    citation: string;
    citationUrl: string;
    columns: DataColumn[];
}

export const SIMPEG_METHODS: SimpegMethod[] = [
    // === GRAVITY ===
    {
        id: "grav_3d_fwd_anomaly",
        title: "3D Forward Simulation of Gravity Anomaly Data",
        category: "Gravity",
        description: "Simulate the gravity anomaly response of a 3D subsurface mass distribution.",
        citation: "SimPEG Contributors (2024). Tutorial: 3D Forward Simulation of Gravity Anomaly Data.",
        citationUrl: "https://simpeg.xyz/",
        columns: [
            { key: "x", label: "Easting (m)" },
            { key: "y", label: "Northing (m)" },
            { key: "z", label: "Elevation (m)" },
            { key: "gz", label: "gz (mGal)" }
        ]
    },
    {
        id: "grav_3d_fwd_gradiometry",
        title: "3D Forward Simulation of Gravity Gradiometry Data",
        category: "Gravity",
        description: "Simulate the full gravity tensor (gradiometry) response of a 3D subsurface.",
        citation: "SimPEG Contributors (2024). Tutorial: 3D Forward Simulation of Gravity Gradiometry Data.",
        citationUrl: "https://simpeg.xyz/",
        columns: [
            { key: "x", label: "Easting (m)" },
            { key: "y", label: "Northing (m)" },
            { key: "z", label: "Elevation (m)" },
            { key: "gxx", label: "gxx (Eötvös)" },
            { key: "gyy", label: "gyy (Eötvös)" },
            { key: "gzz", label: "gzz (Eötvös)" }
        ]
    },
    {
        id: "grav_3d_inv_anomaly",
        title: "3D Inversion of Gravity Anomaly Data",
        category: "Gravity",
        description: "Invert observed surface gravity anomaly data to recover a 3D density contrast model.",
        citation: "SimPEG Contributors (2024). Tutorial: 3D Inversion of Gravity Anomaly Data.",
        citationUrl: "https://simpeg.xyz/",
        columns: [
            { key: "x", label: "Easting (m)" },
            { key: "y", label: "Northing (m)" },
            { key: "z", label: "Elevation (m)" },
            { key: "gz", label: "Observed gz (mGal)" }
        ]
    },

    // === MAGNETICS ===
    {
        id: "mag_3d_fwd_tmi",
        title: "3D Forward Simulation of TMI Data",
        category: "Magnetics",
        description: "Simulate the Total Magnetic Intensity (TMI) response of a 3D susceptibility model.",
        citation: "SimPEG Contributors (2024). Tutorial: 3D Forward Simulation of TMI Data.",
        citationUrl: "https://simpeg.xyz/",
        columns: [
            { key: "x", label: "Easting (m)" },
            { key: "y", label: "Northing (m)" },
            { key: "z", label: "Elevation (m)" },
            { key: "tmi", label: "TMI (nT)" }
        ]
    },
    {
        id: "mag_3d_fwd_gradiometry",
        title: "3D Forward Simulation of Magnetic Gradiometry Data",
        category: "Magnetics",
        description: "Simulate the magnetic gradient tensor components for Magnetic Vector Models.",
        citation: "SimPEG Contributors (2024). Tutorial: 3D Forward Simulation of Magnetic Gradiometry Data.",
        citationUrl: "https://simpeg.xyz/",
        columns: [
            { key: "x", label: "Easting (m)" },
            { key: "y", label: "Northing (m)" },
            { key: "z", label: "Elevation (m)" },
            { key: "hxx", label: "Hxx (nT/m)" },
            { key: "hyy", label: "Hyy (nT/m)" },
            { key: "hzz", label: "Hzz (nT/m)" }
        ]
    },
    {
        id: "mag_3d_inv_tmi",
        title: "3D Inversion of TMI Data to Recover Susceptibility",
        category: "Magnetics",
        description: "Invert Total Magnetic Intensity (TMI) data to recover a 3D magnetic susceptibility model.",
        citation: "SimPEG Contributors (2024). Tutorial: 3D Inversion of TMI Data.",
        citationUrl: "https://simpeg.xyz/",
        columns: [
            { key: "x", label: "Easting (m)" },
            { key: "y", label: "Northing (m)" },
            { key: "z", label: "Elevation (m)" },
            { key: "tmi", label: "Observed TMI (nT)" }
        ]
    },

    // === DIRECT CURRENT RESISTIVITY ===
    {
        id: "dc_1d_fwd_sounding",
        title: "1D Forward Simulation for a Single Sounding",
        category: "Direct Current Resistivity",
        description: "Simulate apparent resistivity for a 1D layered Earth model over a single sounding.",
        citation: "SimPEG Contributors (2024). Tutorial: 1D Forward Simulation for a Single Sounding.",
        citationUrl: "https://simpeg.xyz/",
        columns: [
            { key: "spacing", label: "Electrode Spacing (m)" },
            { key: "rhoa", label: "Apparent Res. (Ωm)" }
        ]
    },
    {
        id: "dc_25d_fwd",
        title: "2.5D Forward Simulation",
        category: "Direct Current Resistivity",
        description: "Forward simulate an inline 2D resistivity profile using 2.5D discretization.",
        citation: "SimPEG Contributors (2024). Tutorial: 2.5D Forward Simulation.",
        citationUrl: "https://simpeg.xyz/",
        columns: [
            { key: "a", label: "A-Location (m)" },
            { key: "b", label: "B-Location (m)" },
            { key: "m", label: "M-Location (m)" },
            { key: "n", label: "N-Location (m)" },
            { key: "voltage", label: "Voltage (V) / App Res" }
        ]
    },
    {
        id: "dc_3d_inv",
        title: "3D DC Resistivity Inversion",
        category: "Direct Current Resistivity",
        description: "Full 3D inversion of arbitrary DC resistivity arrays to recover a 3D subsurface model.",
        citation: "SimPEG Contributors (2024). Tutorial: 3D DC Resistivity Inversion.",
        citationUrl: "https://simpeg.xyz/",
        columns: [
            { key: "a_x", label: "A_X (m)" }, { key: "a_y", label: "A_Y (m)" },
            { key: "b_x", label: "B_X (m)" }, { key: "b_y", label: "B_Y (m)" },
            { key: "m_x", label: "M_X (m)" }, { key: "m_y", label: "M_Y (m)" },
            { key: "n_x", label: "N_X (m)" }, { key: "n_y", label: "N_Y (m)" },
            { key: "data", label: "Observed Data (V/A)" }
        ]
    },

    // === INDUCED POLARIZATION ===
    {
        id: "ip_25d_inv",
        title: "2.5D IP Inversion",
        category: "Induced Polarization",
        description: "Invert apparent chargeability data over a 2D profile using a 2.5D formulation.",
        citation: "SimPEG Contributors (2024). Tutorial: 2.5D IP Inversion.",
        citationUrl: "https://simpeg.xyz/",
        columns: [
            { key: "a", label: "A-Location (m)" },
            { key: "b", label: "B-Location (m)" },
            { key: "m", label: "M-Location (m)" },
            { key: "n", label: "N-Location (m)" },
            { key: "chargeability", label: "App. Chargeability (mV/V)" }
        ]
    },
    {
        id: "ip_3d_inv",
        title: "3D IP Inversion",
        category: "Induced Polarization",
        description: "Full 3D inversion of Induced Polarization data over complex geology.",
        citation: "SimPEG Contributors (2024). Tutorial: 3D IP Inversion.",
        citationUrl: "https://simpeg.xyz/",
        columns: [
            { key: "tx_x", label: "Tx X (m)" }, { key: "tx_y", label: "Tx Y (m)" },
            { key: "rx_x", label: "Rx X (m)" }, { key: "rx_y", label: "Rx Y (m)" },
            { key: "chargeability", label: "App. Chargeability" }
        ]
    },

    // === EM METHODS ===
    {
        id: "fdem_1d_inv",
        title: "1D Inversion of Frequency Domain EM Data",
        category: "Frequency-Domain Electromagnetics",
        description: "Invert multi-frequency FDEM data over a single sounding to recover a 1D conductivity model.",
        citation: "SimPEG Contributors (2024). Tutorial: 1D Inversion of FDEM Data.",
        citationUrl: "https://simpeg.xyz/",
        columns: [
            { key: "freq", label: "Frequency (Hz)" },
            { key: "real", label: "Real Component" },
            { key: "imag", label: "Imag Component" }
        ]
    },
    {
        id: "tdem_1d_inv",
        title: "1D Inversion for a Single Sounding (TDEM)",
        category: "Time-Domain Electromagnetics",
        description: "Invert transient EM data (dB/dt) over time-channels to recover a 1D conductivity model.",
        citation: "SimPEG Contributors (2024). Tutorial: 1D Inversion of TDEM Data.",
        citationUrl: "https://simpeg.xyz/",
        columns: [
            { key: "time", label: "Time Gate (s)" },
            { key: "dbdt", label: "dB/dt (V/A-m²)" }
        ]
    },

    // === JOINT & PGI ===
    {
        id: "joint_cross_gradient",
        title: "Cross-gradient Joint Inversion of Gravity and Magnetic Data",
        category: "Joint Inversion",
        description: "Simultaneous inversion of gravity and magnetic data leveraging cross-gradient structural operators.",
        citation: "SimPEG Contributors (2024). Tutorial: Joint Inversion.",
        citationUrl: "https://simpeg.xyz/",
        columns: [
            { key: "x", label: "Easting (m)" },
            { key: "y", label: "Northing (m)" },
            { key: "z", label: "Elevation (m)" },
            { key: "gz", label: "Observed gz (mGal)" },
            { key: "tmi", label: "Observed TMI (nT)" }
        ]
    },
    {
        id: "pgi_joint",
        title: "Joint PGI of Gravity + Magnetic on an Octree mesh",
        category: "PGI Inversion",
        description: "Petrophysically Guided Inversion combining gravity, magnetic data, and multi-modal petrophysical distributions.",
        citation: "SimPEG Contributors (2024). Tutorial: Petrophysically Guided Inversion (PGI).",
        citationUrl: "https://simpeg.xyz/",
        columns: [
            { key: "x", label: "X (m)" },
            { key: "y", label: "Y (m)" },
            { key: "z", label: "Z (m)" },
            { key: "data1", label: "Gravity Data" },
            { key: "data2", label: "Magnetic Data" }
        ]
    }
];
