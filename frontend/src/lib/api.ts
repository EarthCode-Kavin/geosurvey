/**
 * GeoSurvey Platform — Typed API Client
 * Communicates with the FastAPI backend.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Types ──────────────────────────────────────────────────────────

export interface Project {
    id: number;
    name: string;
    description?: string;
    client_name?: string;
    location_name?: string;
    latitude?: number;
    longitude?: number;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface ProjectCreate {
    name: string;
    description?: string;
    client_name?: string;
    location_name?: string;
    latitude?: number;
    longitude?: number;
}

export interface Survey {
    id: number;
    project_id: number;
    name: string;
    description?: string;
    array_type: string;
    survey_type: string;
    electrode_spacing?: number;
    num_electrodes?: number;
    original_filename?: string;
    file_format?: string;
    processing_status: string;
    processing_engine?: string;
    processing_params?: Record<string, unknown>;
    error_message?: string;
    created_at: string;
    updated_at: string;
    processed_at?: string;
}

export interface SurveyCreate {
    project_id: number;
    name: string;
    description?: string;
    array_type: string; // Dynamic string matching simpeg method IDs
    survey_type?: string;
    electrode_spacing?: number;
    num_electrodes?: number;
}

export interface Borehole {
    id: number;
    project_id: number;
    name: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    elevation?: number;
    total_depth: number;
    groundwater_depth?: number;
    drilling_method?: string;
    drilling_date?: string;
    soil_layers?: SoilLayer[];
    spt_values?: SPTValue[];
    core_recovery?: CoreRecovery[];
    created_at: string;
    updated_at: string;
}

export interface SoilLayer {
    depth_from: number;
    depth_to: number;
    description: string;
    uscs?: string;
    color?: string;
    moisture?: string;
}

export interface SPTValue {
    depth: number;
    n_value: number;
    blows_1?: number;
    blows_2?: number;
    blows_3?: number;
}

export interface CoreRecovery {
    depth_from: number;
    depth_to: number;
    recovery_pct: number;
    rqd_pct?: number;
}

export interface BoreholeCreate {
    project_id: number;
    name: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    elevation?: number;
    total_depth: number;
    groundwater_depth?: number;
    drilling_method?: string;
    soil_layers?: SoilLayer[];
    spt_values?: SPTValue[];
    core_recovery?: CoreRecovery[];
}

export interface ProcessingRequest {
    survey_id: number;
    engine: "simpeg" | "pygimli";
    method?: string;
    params?: Record<string, unknown>;
}

export interface ProcessingResult {
    id: number;
    survey_id: number;
    engine_type: string;
    processing_method?: string;
    result_data?: Record<string, unknown>;
    model_data?: Record<string, unknown>;
    rms_misfit?: number;
    chi_squared?: number;
    iterations?: number;
    output_files?: Record<string, string>;
    plot_data?: Record<string, unknown>;
    created_at: string;
    processing_duration_seconds?: number;
}

// ── Fetch Helper ───────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json", ...options?.headers },
        ...options,
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(error.detail || `API error: ${res.status}`);
    }
    if (res.status === 204) return undefined as unknown as T;
    return res.json();
}

// ── Projects ───────────────────────────────────────────────────────

export const projectsApi = {
    list: (status?: string) =>
        apiFetch<Project[]>(`/api/projects/${status ? `?status_filter=${status}` : ""}`),
    get: (id: number) => apiFetch<Project>(`/api/projects/${id}`),
    create: (data: ProjectCreate) =>
        apiFetch<Project>("/api/projects/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<ProjectCreate>) =>
        apiFetch<Project>(`/api/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
        apiFetch<void>(`/api/projects/${id}`, { method: "DELETE" }),
};

// ── Surveys ────────────────────────────────────────────────────────

export const surveysApi = {
    list: (projectId?: number) =>
        apiFetch<Survey[]>(`/api/surveys/${projectId ? `?project_id=${projectId}` : ""}`),
    get: (id: number) => apiFetch<Survey>(`/api/surveys/${id}`),
    create: (data: SurveyCreate) =>
        apiFetch<Survey>("/api/surveys/", { method: "POST", body: JSON.stringify(data) }),
    upload: async (surveyId: number, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${BASE_URL}/api/surveys/${surveyId}/upload`, {
            method: "POST",
            body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        return res.json() as Promise<Survey>;
    },
    delete: (id: number) =>
        apiFetch<void>(`/api/surveys/${id}`, { method: "DELETE" }),
};

// ── Boreholes ──────────────────────────────────────────────────────

export const boreholesApi = {
    list: (projectId?: number) =>
        apiFetch<Borehole[]>(`/api/boreholes/${projectId ? `?project_id=${projectId}` : ""}`),
    get: (id: number) => apiFetch<Borehole>(`/api/boreholes/${id}`),
    create: (data: BoreholeCreate) =>
        apiFetch<Borehole>("/api/boreholes/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<BoreholeCreate>) =>
        apiFetch<Borehole>(`/api/boreholes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
        apiFetch<void>(`/api/boreholes/${id}`, { method: "DELETE" }),
};

// ── Processing ─────────────────────────────────────────────────────

export const processingApi = {
    run: (data: ProcessingRequest) =>
        apiFetch<ProcessingResult>("/api/processing/run", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    getResults: (surveyId: number) =>
        apiFetch<ProcessingResult[]>(`/api/processing/results/${surveyId}`),
    getResult: (id: number) => apiFetch<ProcessingResult>(`/api/processing/result/${id}`),
};

// ── Visualization ──────────────────────────────────────────────────

export const visualizationApi = {
    getResistivitySection: (resultId: number) =>
        apiFetch<Record<string, unknown>>(`/api/visualization/resistivity-section/${resultId}`),
    getMesh3D: (resultId: number) =>
        apiFetch<Record<string, unknown>>(`/api/visualization/mesh-3d/${resultId}`),
    getSurveyMap: (projectId: number) =>
        apiFetch<Record<string, unknown>>(`/api/visualization/survey-map/${projectId}`),
    getBoreholeLog: (boreholeId: number) =>
        apiFetch<Record<string, unknown>>(`/api/visualization/borehole-log/${boreholeId}`),
};

// ── Reports ────────────────────────────────────────────────────────

export const reportsApi = {
    generate: (projectId: number) =>
        apiFetch<{ message: string; download_url: string }>(`/api/reports/generate/${projectId}`, {
            method: "POST",
        }),
    downloadUrl: (projectId: number) => `${BASE_URL}/api/reports/download/${projectId}`,
};
