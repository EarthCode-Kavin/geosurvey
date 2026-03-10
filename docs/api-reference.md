# API Reference

Base URL: `http://localhost:8000`

Interactive docs: `http://localhost:8000/docs` (Swagger) | `http://localhost:8000/redoc` (ReDoc)

---

## Projects

### `GET /api/projects/`
List all projects. Optional `status_filter` query param.

### `POST /api/projects/`
```json
{
  "name": "Highway Bridge Investigation",
  "description": "Geophysical survey for foundation design",
  "client_name": "NHAI",
  "location_name": "NH-44, Karnataka",
  "latitude": 13.0827,
  "longitude": 77.5877
}
```

### `GET /api/projects/{id}`
Get project by ID.

### `PUT /api/projects/{id}`
Update project fields.

### `DELETE /api/projects/{id}`
Delete project and all associated data.

---

## Surveys

### `GET /api/surveys/`
List surveys. Optional `project_id` query param.

### `POST /api/surveys/`
```json
{
  "project_id": 1,
  "name": "Profile Line 1",
  "array_type": "wenner",
  "survey_type": "resistivity",
  "electrode_spacing": 5.0,
  "num_electrodes": 48
}
```
`array_type`: `wenner` | `schlumberger` | `dipole_dipole`

### `POST /api/surveys/{id}/upload`
Upload survey data file. Multipart form with `file` field. Accepts: .csv, .txt, .dat, .res, .ohm

### `GET /api/surveys/{id}` | `PUT` | `DELETE`

---

## Boreholes

### `POST /api/boreholes/`
```json
{
  "project_id": 1,
  "name": "BH-01",
  "total_depth": 15.0,
  "groundwater_depth": 4.5,
  "drilling_method": "Rotary",
  "soil_layers": [
    {"depth_from": 0, "depth_to": 2.5, "description": "Topsoil", "uscs": "OH"},
    {"depth_from": 2.5, "depth_to": 8.0, "description": "Silty clay", "uscs": "CL"}
  ],
  "spt_values": [
    {"depth": 1.5, "n_value": 8, "blows_1": 3, "blows_2": 2, "blows_3": 3}
  ]
}
```

---

## Processing

### `POST /api/processing/run`
```json
{
  "survey_id": 1,
  "engine": "simpeg",
  "method": "inversion",
  "params": {"max_iterations": 20}
}
```
`engine`: `simpeg` | `pygimli`

### `GET /api/processing/results/{survey_id}`
### `GET /api/processing/result/{result_id}`

---

## Visualization

### `GET /api/visualization/resistivity-section/{result_id}`
Returns Plotly contour data for 2D resistivity section.

### `GET /api/visualization/mesh-3d/{result_id}`
Returns Three.js mesh data (vertices, faces, colours).

### `GET /api/visualization/survey-map/{project_id}`
Returns GeoJSON FeatureCollection for Leaflet map.

### `GET /api/visualization/borehole-log/{borehole_id}`
Returns structured borehole log data.

---

## Reports

### `POST /api/reports/generate/{project_id}`
Generate a PDF report. Returns download URL.

### `GET /api/reports/download/{project_id}`
Download the generated PDF.
