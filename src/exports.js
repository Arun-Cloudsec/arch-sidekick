import * as XLSX from "xlsx";

/* ─────────────────────── Excel BoM export ─────────────────────── */
export function exportBoMExcel(design) {
  const rows = [];
  design.tiers.forEach(tier => {
    tier.components.forEach(c => {
      rows.push({
        Tier: tier.name,
        Service: c.name,
        Category: c.category,
        SKU: c.sku,
        Quantity: c.quantity,
        Purpose: c.purpose,
        Rationale: c.rationale,
        "Monthly USD": c.monthlyUsd,
      });
    });
  });
  rows.push({ Tier: "", Service: "TOTAL", Category: "", SKU: "", Quantity: "", Purpose: "", Rationale: "", "Monthly USD": design.totalMonthlyUsd });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{wch:18},{wch:34},{wch:14},{wch:30},{wch:16},{wch:36},{wch:48},{wch:14}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bill of Materials");

  const meta = [
    ["Design Summary"], [design.summary], [],
    ["Platform"], [design._platform || "Azure"], [],
    ["Feasibility"], [design.feasibility + " — " + design.feasibilityNote], [],
    ["Parsed Requirements"], ...Object.entries(design.parsedRequirements).map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : String(v ?? "")]), [],
    ["Compliance Coverage"], ...design.compliance.map(c => [c.requirement, c.coverage, c.how]), [],
    ["Non-Functional"], ...design.nonFunctional.map(n => [n.aspect, n.target, n.how]), [],
    ["Trade-offs"], ...design.tradeoffs.map(t => [`Chose ${t.chose} over ${t.over}`, t.because, t.revisitIf || ""]), [],
    ["Assumptions"], ...design.assumptions.map(a => [a]), [],
    ["Risks"], ...design.risks.map(r => [r]), [],
    ["Next Questions"], ...design.nextQuestions.map(q => [q]),
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(meta);
  ws2["!cols"] = [{wch:40},{wch:30},{wch:60}];
  XLSX.utils.book_append_sheet(wb, ws2, "Design Notes");

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(out, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", `arch-bom-${dateStr()}.xlsx`);
}

/* ─────────────────────── PowerPoint export (lazy-loaded) ─────────────────────── */
export async function exportDesignPpt(design) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  pptx.layout = "LAYOUT_WIDE"; // 13.33 × 7.5 in
  pptx.title = `${design._platform || "Cloud"} Reference Architecture`;

  const INK = "14120F";
  const BG = "FAF8F4";
  const ACCENT = "1B3B5F";
  const SOFT = "5A544A";
  const LINE = "E3DCC9";
  const GREEN = "2D5F3F";
  const AMBER = "B8731F";
  const RED = "8B2C1A";

  const statusColor = {
    feasible: GREEN, tight: AMBER, challenging: RED,
    met: GREEN, partial: AMBER, gap: RED,
    within: GREEN, over: RED,
  };

  /* ─── Slide 1: Title ─── */
  const s1 = pptx.addSlide();
  s1.background = { color: BG };
  s1.addText(`${design._platform || "Cloud"} Reference Architecture`, {
    x: 0.6, y: 0.6, w: 12, h: 0.5, fontSize: 14, fontFace: "Calibri", color: SOFT, bold: false,
  });
  s1.addText(design.parsedRequirements.workload || "Solution Architecture", {
    x: 0.6, y: 1.2, w: 12, h: 2, fontSize: 44, fontFace: "Georgia", color: INK, bold: false,
  });
  s1.addText(design.summary, {
    x: 0.6, y: 3.4, w: 10, h: 1.8, fontSize: 16, fontFace: "Calibri", color: SOFT,
  });
  s1.addShape("rect", { x: 0.6, y: 5.6, w: 1.5, h: 0.4, fill: { color: statusColor[design.feasibility] || AMBER } });
  s1.addText(design.feasibility.toUpperCase(), {
    x: 0.6, y: 5.6, w: 1.5, h: 0.4, fontSize: 10, fontFace: "Calibri", color: "FFFFFF", bold: true, align: "center",
  });
  s1.addText(design.feasibilityNote, {
    x: 2.3, y: 5.6, w: 10, h: 0.4, fontSize: 12, fontFace: "Calibri", color: INK,
  });
  s1.addText(`Total monthly: $${design.totalMonthlyUsd.toLocaleString()} USD  ·  Model: ${design._model || ""}  ·  ${new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"long", year:"numeric" })}`, {
    x: 0.6, y: 6.8, w: 12, h: 0.3, fontSize: 10, fontFace: "Consolas", color: SOFT,
  });

  /* ─── Slide 2: Parsed requirements ─── */
  const s2 = pptx.addSlide();
  s2.background = { color: BG };
  s2.addText("Requirements", { x: 0.6, y: 0.5, w: 12, h: 0.6, fontSize: 28, fontFace: "Georgia", color: INK });
  const reqRows = [
    ["Workload", design.parsedRequirements.workload || ""],
    ["Users / Load", design.parsedRequirements.users || ""],
    ["Regions", (design.parsedRequirements.regions || []).join(", ")],
    ["Compliance", (design.parsedRequirements.compliance || []).join(", ")],
    ["SLO", design.parsedRequirements.slo || ""],
    ["Data Volume", design.parsedRequirements.dataVolume || ""],
    ["Traffic Pattern", design.parsedRequirements.trafficPattern || ""],
    ["Budget", design.parsedRequirements.budgetMonthlyUsd ? `$${design.parsedRequirements.budgetMonthlyUsd.toLocaleString()}/mo` : "Not specified"],
  ];
  s2.addTable(reqRows.map(r => [
    { text: r[0], options: { bold: true, color: ACCENT, fontFace: "Consolas", fontSize: 11 } },
    { text: r[1], options: { color: INK, fontFace: "Calibri", fontSize: 12 } },
  ]), {
    x: 0.6, y: 1.4, w: 12, colW: [3, 9], rowH: 0.45, border: { type: "solid", color: LINE, pt: 0.5 },
  });

  /* ─── Slide 3: Architecture by tier (one slide per tier, or compact if small) ─── */
  design.tiers.forEach((tier) => {
    const s = pptx.addSlide();
    s.background = { color: BG };
    s.addText(tier.name, { x: 0.6, y: 0.5, w: 12, h: 0.6, fontSize: 28, fontFace: "Georgia", color: INK });
    s.addText(`${tier.components.length} component${tier.components.length === 1 ? "" : "s"}`, {
      x: 0.6, y: 1.0, w: 12, h: 0.3, fontSize: 11, fontFace: "Consolas", color: SOFT,
    });

    // Component cards in a grid (max 2 columns)
    const perRow = 2;
    const cardW = 5.8;
    const cardH = 1.5;
    tier.components.forEach((c, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const x = 0.6 + col * (cardW + 0.3);
      const y = 1.5 + row * (cardH + 0.25);

      s.addShape("rect", { x, y, w: cardW, h: cardH, fill: { color: "FFFFFF" }, line: { color: LINE, width: 0.5 } });
      s.addText(c.name, { x: x + 0.2, y: y + 0.15, w: cardW - 0.4, h: 0.4, fontSize: 13, fontFace: "Calibri", color: INK, bold: true });
      s.addText(c.sku, { x: x + 0.2, y: y + 0.5, w: cardW - 0.4, h: 0.3, fontSize: 9, fontFace: "Consolas", color: SOFT });
      s.addText(c.purpose, { x: x + 0.2, y: y + 0.8, w: cardW - 0.4, h: 0.4, fontSize: 10, fontFace: "Calibri", color: SOFT });
      s.addText(`$${c.monthlyUsd?.toLocaleString() || "—"}/mo`, {
        x: x + cardW - 1.5, y: y + 0.15, w: 1.3, h: 0.3, fontSize: 12, fontFace: "Consolas", color: ACCENT, bold: true, align: "right",
      });
    });
  });

  /* ─── Slide: Bill of materials ─── */
  const sBom = pptx.addSlide();
  sBom.background = { color: BG };
  sBom.addText("Bill of Materials", { x: 0.6, y: 0.5, w: 12, h: 0.6, fontSize: 28, fontFace: "Georgia", color: INK });
  sBom.addText(`Total: $${design.totalMonthlyUsd.toLocaleString()} / month  ·  ${design.budgetFitNote || ""}`, {
    x: 0.6, y: 1.0, w: 12, h: 0.3, fontSize: 12, fontFace: "Calibri", color: statusColor[design.budgetFit] || SOFT,
  });

  const bomRows = [
    [
      { text: "Tier", options: { bold: true, color: "FFFFFF", fill: { color: INK }, fontSize: 10, fontFace: "Consolas" } },
      { text: "Service", options: { bold: true, color: "FFFFFF", fill: { color: INK }, fontSize: 10, fontFace: "Consolas" } },
      { text: "SKU", options: { bold: true, color: "FFFFFF", fill: { color: INK }, fontSize: 10, fontFace: "Consolas" } },
      { text: "Purpose", options: { bold: true, color: "FFFFFF", fill: { color: INK }, fontSize: 10, fontFace: "Consolas" } },
      { text: "$/mo", options: { bold: true, color: "FFFFFF", fill: { color: INK }, fontSize: 10, fontFace: "Consolas", align: "right" } },
    ],
    ...design.tiers.flatMap(t => t.components.map(c => [
      { text: t.name, options: { fontSize: 9, fontFace: "Calibri", color: SOFT } },
      { text: c.name, options: { fontSize: 10, fontFace: "Calibri", color: INK, bold: true } },
      { text: c.sku, options: { fontSize: 9, fontFace: "Consolas", color: SOFT } },
      { text: c.purpose, options: { fontSize: 9, fontFace: "Calibri", color: SOFT } },
      { text: `$${c.monthlyUsd?.toLocaleString() || "—"}`, options: { fontSize: 10, fontFace: "Consolas", color: INK, align: "right" } },
    ])),
    [
      { text: "", options: {} },
      { text: "TOTAL", options: { bold: true, fontSize: 11, fontFace: "Calibri", color: INK, fill: { color: "F0E8D0" } } },
      { text: "", options: { fill: { color: "F0E8D0" } } },
      { text: "", options: { fill: { color: "F0E8D0" } } },
      { text: `$${design.totalMonthlyUsd.toLocaleString()}`, options: { bold: true, fontSize: 12, fontFace: "Consolas", color: ACCENT, align: "right", fill: { color: "F0E8D0" } } },
    ],
  ];
  sBom.addTable(bomRows, { x: 0.4, y: 1.5, w: 12.5, colW: [1.4, 3, 3, 3.8, 1.3], rowH: 0.35, border: { type: "solid", color: LINE, pt: 0.3 } });

  /* ─── Slide: Compliance coverage ─── */
  const sComp = pptx.addSlide();
  sComp.background = { color: BG };
  sComp.addText("Compliance Coverage", { x: 0.6, y: 0.5, w: 12, h: 0.6, fontSize: 28, fontFace: "Georgia", color: INK });
  const compRows = [
    [
      { text: "Requirement", options: { bold: true, color: "FFFFFF", fill: { color: INK }, fontSize: 11, fontFace: "Consolas" } },
      { text: "Coverage", options: { bold: true, color: "FFFFFF", fill: { color: INK }, fontSize: 11, fontFace: "Consolas" } },
      { text: "How", options: { bold: true, color: "FFFFFF", fill: { color: INK }, fontSize: 11, fontFace: "Consolas" } },
    ],
    ...design.compliance.map(c => [
      { text: c.requirement, options: { bold: true, fontSize: 12, fontFace: "Calibri", color: INK } },
      { text: c.coverage.toUpperCase(), options: { fontSize: 10, fontFace: "Consolas", bold: true, color: statusColor[c.coverage] || SOFT } },
      { text: c.how, options: { fontSize: 10, fontFace: "Calibri", color: SOFT } },
    ]),
  ];
  sComp.addTable(compRows, { x: 0.6, y: 1.3, w: 12, colW: [2.5, 1.5, 8], rowH: 0.5, border: { type: "solid", color: LINE, pt: 0.3 } });

  /* ─── Slide: Non-functional ─── */
  const sNfr = pptx.addSlide();
  sNfr.background = { color: BG };
  sNfr.addText("Non-Functional Targets", { x: 0.6, y: 0.5, w: 12, h: 0.6, fontSize: 28, fontFace: "Georgia", color: INK });
  const nfrRows = [
    [
      { text: "Aspect", options: { bold: true, color: "FFFFFF", fill: { color: INK }, fontSize: 11, fontFace: "Consolas" } },
      { text: "Target", options: { bold: true, color: "FFFFFF", fill: { color: INK }, fontSize: 11, fontFace: "Consolas" } },
      { text: "How", options: { bold: true, color: "FFFFFF", fill: { color: INK }, fontSize: 11, fontFace: "Consolas" } },
    ],
    ...design.nonFunctional.map(n => [
      { text: n.aspect, options: { bold: true, fontSize: 12, fontFace: "Calibri", color: INK } },
      { text: n.target, options: { fontSize: 11, fontFace: "Consolas", color: ACCENT } },
      { text: n.how, options: { fontSize: 10, fontFace: "Calibri", color: SOFT } },
    ]),
  ];
  sNfr.addTable(nfrRows, { x: 0.6, y: 1.3, w: 12, colW: [2.5, 2.5, 7], rowH: 0.5, border: { type: "solid", color: LINE, pt: 0.3 } });

  /* ─── Slide: Trade-offs ─── */
  const sTr = pptx.addSlide();
  sTr.background = { color: BG };
  sTr.addText("Design Trade-offs", { x: 0.6, y: 0.5, w: 12, h: 0.6, fontSize: 28, fontFace: "Georgia", color: INK });
  design.tradeoffs.slice(0, 5).forEach((t, i) => {
    const y = 1.4 + i * 1.1;
    sTr.addText(`${String(i + 1).padStart(2, "0")}`, { x: 0.6, y, w: 0.6, h: 0.4, fontSize: 14, fontFace: "Georgia", color: ACCENT, bold: true });
    sTr.addText(`Chose ${t.chose} over ${t.over}`, { x: 1.3, y, w: 10.5, h: 0.4, fontSize: 14, fontFace: "Calibri", color: INK, bold: true });
    sTr.addText(t.because, { x: 1.3, y: y + 0.4, w: 10.5, h: 0.4, fontSize: 11, fontFace: "Calibri", color: SOFT });
    if (t.revisitIf) sTr.addText(`Revisit if: ${t.revisitIf}`, { x: 1.3, y: y + 0.75, w: 10.5, h: 0.3, fontSize: 10, fontFace: "Calibri", color: AMBER, italic: true });
  });

  /* ─── Slide: Assumptions & Risks ─── */
  const sAR = pptx.addSlide();
  sAR.background = { color: BG };
  sAR.addText("Assumptions & Risks", { x: 0.6, y: 0.5, w: 12, h: 0.6, fontSize: 28, fontFace: "Georgia", color: INK });
  sAR.addText("Assumptions", { x: 0.6, y: 1.2, w: 6, h: 0.3, fontSize: 14, fontFace: "Consolas", color: ACCENT, bold: true });
  design.assumptions.slice(0, 6).forEach((a, i) => {
    sAR.addText(`→  ${a}`, { x: 0.6, y: 1.6 + i * 0.55, w: 6, h: 0.5, fontSize: 11, fontFace: "Calibri", color: SOFT });
  });
  sAR.addText("Risks", { x: 6.9, y: 1.2, w: 6, h: 0.3, fontSize: 14, fontFace: "Consolas", color: AMBER, bold: true });
  design.risks.slice(0, 6).forEach((r, i) => {
    sAR.addText(`△  ${r}`, { x: 6.9, y: 1.6 + i * 0.55, w: 6, h: 0.5, fontSize: 11, fontFace: "Calibri", color: SOFT });
  });

  /* ─── Slide: Next questions ─── */
  const sNQ = pptx.addSlide();
  sNQ.background = { color: BG };
  sNQ.addText("Before the next customer meeting", { x: 0.6, y: 0.5, w: 12, h: 0.5, fontSize: 16, fontFace: "Consolas", color: SOFT });
  sNQ.addText("Questions to pressure-test", { x: 0.6, y: 1, w: 12, h: 0.6, fontSize: 28, fontFace: "Georgia", color: INK });
  design.nextQuestions.slice(0, 8).forEach((q, i) => {
    sNQ.addText(`${String(i + 1).padStart(2, "0")}`, { x: 0.6, y: 2 + i * 0.55, w: 0.6, h: 0.4, fontSize: 16, fontFace: "Georgia", color: ACCENT });
    sNQ.addText(q, { x: 1.3, y: 2 + i * 0.55, w: 11, h: 0.5, fontSize: 12, fontFace: "Calibri", color: INK });
  });

  /* ─── Slide: Closing ─── */
  const sEnd = pptx.addSlide();
  sEnd.background = { color: INK };
  sEnd.addText("First draft.", { x: 0.6, y: 3, w: 12, h: 1, fontSize: 54, fontFace: "Georgia", color: BG, italic: true });
  sEnd.addText("For a senior architect to refine.", { x: 0.6, y: 4.2, w: 12, h: 0.6, fontSize: 20, fontFace: "Calibri", color: "B8B0A0" });
  sEnd.addText(`Generated by Arch Sidekick · ${design._model} · ${design._platform}`, { x: 0.6, y: 6.8, w: 12, h: 0.3, fontSize: 10, fontFace: "Consolas", color: "888070" });

  await pptx.writeFile({ fileName: `arch-design-${dateStr()}.pptx` });
}

/* ─────────────────────── Helpers ─────────────────────── */
function dateStr() {
  return new Date().toISOString().split("T")[0];
}

function downloadBlob(data, type, filename) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
