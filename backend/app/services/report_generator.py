"""
GeoSurvey Platform — PDF Report Generator
Generates comprehensive project reports using ReportLab.
"""

from datetime import datetime
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    HRFlowable,
)


def generate_project_report(
    output_path: str,
    project: Any,
    surveys: list[Any],
    boreholes: list[Any],
    results: list[Any],
) -> str:
    """
    Generate a multi-page PDF report for a geophysical survey project.

    Args:
        output_path: File path for the generated PDF.
        project: Project model instance.
        surveys: List of Survey model instances.
        boreholes: List of Borehole model instances.
        results: List of ProcessingResult model instances.

    Returns:
        The output file path.
    """
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=25 * mm,
        bottomMargin=25 * mm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    styles.add(ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontSize=24,
        spaceAfter=6 * mm,
        textColor=colors.HexColor("#1a365d"),
    ))
    styles.add(ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=14,
        spaceBefore=8 * mm,
        spaceAfter=4 * mm,
        textColor=colors.HexColor("#2c5282"),
        borderWidth=1,
        borderColor=colors.HexColor("#bee3f8"),
        borderPadding=(0, 0, 2, 0),
    ))
    styles.add(ParagraphStyle(
        "SubHeading",
        parent=styles["Heading3"],
        fontSize=11,
        spaceBefore=4 * mm,
        spaceAfter=2 * mm,
        textColor=colors.HexColor("#2b6cb0"),
    ))
    styles.add(ParagraphStyle(
        "BodyText2",
        parent=styles["BodyText"],
        fontSize=9,
        leading=13,
    ))

    story = []

    # ── Title Page ──────────────────────────────────────────────────────
    story.append(Spacer(1, 40 * mm))
    story.append(Paragraph("GEOPHYSICAL &amp; GEOTECHNICAL", styles["ReportTitle"]))
    story.append(Paragraph("SURVEY ANALYSIS REPORT", styles["ReportTitle"]))
    story.append(Spacer(1, 10 * mm))
    story.append(HRFlowable(width="80%", thickness=2, color=colors.HexColor("#2c5282")))
    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph(f"<b>Project:</b> {project.name}", styles["Heading3"]))
    if project.client_name:
        story.append(Paragraph(f"<b>Client:</b> {project.client_name}", styles["BodyText"]))
    if project.location_name:
        story.append(Paragraph(f"<b>Location:</b> {project.location_name}", styles["BodyText"]))
    story.append(Paragraph(
        f"<b>Generated:</b> {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        styles["BodyText"],
    ))
    story.append(Paragraph(f"<b>Status:</b> {project.status}", styles["BodyText"]))
    story.append(PageBreak())

    # ── Project Summary ─────────────────────────────────────────────────
    story.append(Paragraph("1. Project Summary", styles["SectionHeading"]))
    summary_data = [
        ["Field", "Value"],
        ["Project Name", project.name],
        ["Description", project.description or "—"],
        ["Client", project.client_name or "—"],
        ["Location", project.location_name or "—"],
        ["Coordinates", f"{project.latitude}, {project.longitude}" if project.latitude else "—"],
        ["Status", project.status],
        ["Created", project.created_at.strftime("%Y-%m-%d") if project.created_at else "—"],
        ["Total Surveys", str(len(surveys))],
        ["Total Boreholes", str(len(boreholes))],
    ]
    story.append(_make_table(summary_data))
    story.append(Spacer(1, 5 * mm))

    # ── Survey Data ─────────────────────────────────────────────────────
    story.append(Paragraph("2. Survey Data", styles["SectionHeading"]))
    if surveys:
        survey_data = [["ID", "Name", "Array", "Type", "Status", "Engine"]]
        for s in surveys:
            survey_data.append([
                str(s.id),
                s.name[:30],
                s.array_type,
                s.survey_type or "—",
                s.processing_status,
                s.processing_engine or "—",
            ])
        story.append(_make_table(survey_data))
    else:
        story.append(Paragraph("No surveys recorded for this project.", styles["BodyText2"]))
    story.append(Spacer(1, 5 * mm))

    # ── Borehole Logs ───────────────────────────────────────────────────
    story.append(Paragraph("3. Borehole Logs", styles["SectionHeading"]))
    if boreholes:
        for bh in boreholes:
            story.append(Paragraph(f"Borehole: {bh.name}", styles["SubHeading"]))
            bh_data = [
                ["Field", "Value"],
                ["Total Depth", f"{bh.total_depth} m"],
                ["Groundwater", f"{bh.groundwater_depth} m" if bh.groundwater_depth else "—"],
                ["Drilling Method", bh.drilling_method or "—"],
                ["Location", f"{bh.latitude}, {bh.longitude}" if bh.latitude else "—"],
            ]
            story.append(_make_table(bh_data))

            # Soil layers table
            if bh.soil_layers:
                story.append(Paragraph("Soil Layers", styles["SubHeading"]))
                layers = [["From (m)", "To (m)", "Description", "USCS"]]
                for layer in bh.soil_layers:
                    layers.append([
                        str(layer.get("depth_from", "")),
                        str(layer.get("depth_to", "")),
                        layer.get("description", "")[:40],
                        layer.get("uscs", "—"),
                    ])
                story.append(_make_table(layers))

            # SPT values table
            if bh.spt_values:
                story.append(Paragraph("SPT Values", styles["SubHeading"]))
                spt = [["Depth (m)", "N-value", "Blows (1)", "Blows (2)", "Blows (3)"]]
                for sv in bh.spt_values:
                    spt.append([
                        str(sv.get("depth", "")),
                        str(sv.get("n_value", "")),
                        str(sv.get("blows_1", "—")),
                        str(sv.get("blows_2", "—")),
                        str(sv.get("blows_3", "—")),
                    ])
                story.append(_make_table(spt))

            story.append(Spacer(1, 3 * mm))
    else:
        story.append(Paragraph("No boreholes recorded for this project.", styles["BodyText2"]))

    # ── Processing Results ──────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("4. Processing Results", styles["SectionHeading"]))
    if results:
        for r in results:
            story.append(Paragraph(
                f"Result #{r.id} — Engine: {r.engine_type}",
                styles["SubHeading"],
            ))
            res_data = [
                ["Field", "Value"],
                ["Method", r.processing_method or "—"],
                ["RMS Misfit", f"{r.rms_misfit:.4f}" if r.rms_misfit else "—"],
                ["Chi-squared", f"{r.chi_squared:.4f}" if r.chi_squared else "—"],
                ["Iterations", str(r.iterations) if r.iterations else "—"],
                ["Duration", f"{r.processing_duration_seconds:.1f} s" if r.processing_duration_seconds else "—"],
            ]
            story.append(_make_table(res_data))
            story.append(Spacer(1, 3 * mm))
    else:
        story.append(Paragraph("No processing results available.", styles["BodyText2"]))

    # ── Build the PDF ───────────────────────────────────────────────────
    doc.build(story)
    return output_path


def _make_table(data: list[list[str]]) -> Table:
    """Create a styled ReportLab table from a list of rows."""
    table = Table(data, repeatRows=1)
    style = TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c5282")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f7fafc")]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ])
    table.setStyle(style)
    return table
