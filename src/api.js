import { buildDesignPrompt, buildRefinePrompt } from "./prompts.js";
import { CONSENSUS_MODELS, TIERS } from "./theme.js";

/* ─────────────────────── Low-level OpenRouter call ─────────────────────── */
async function callOpenRouter({ model, messages, max_tokens = 8000, temperature = 0.3 }) {
  const resp = await fetch("/api/openrouter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, max_tokens, temperature }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Server returned ${resp.status}`);
  }

  const data = await resp.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

  const text = data.choices?.[0]?.message?.content || "";
  return { text, usage: data.usage, model: data.model || model };
}

/* ─────────────────────── JSON extraction helper ─────────────────────── */
function extractJson(text) {
  // Strip fences if present
  let cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  // If there's prose before the JSON, try to find the first { and last }
  if (!cleaned.startsWith("{")) {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first >= 0 && last > first) cleaned = cleaned.slice(first, last + 1);
  }
  return JSON.parse(cleaned);
}

/* ─────────────────────── Single design ─────────────────────── */
export async function generateSingleDesign({ freeText, structured, platform, model, tier = "balanced" }) {
  const prompt = buildDesignPrompt({ freeText, structured, platform, tier });
  const { text, usage, model: modelUsed } = await callOpenRouter({
    model,
    messages: [{ role: "user", content: prompt }],
  });

  try {
    const design = extractJson(text);
    design._usage = usage;
    design._model = modelUsed;
    design._platform = platform;
    design._tier = tier;
    return design;
  } catch (e) {
    console.error("Malformed JSON from", modelUsed, "\nRaw:", text.slice(0, 500));
    throw new Error(`${modelUsed}: returned malformed JSON. Try again or switch model.`);
  }
}

/* ─────────────────────── Alternative tiers (3 parallel calls) ─────────────────────── */
export async function generateTierDesigns({ freeText, structured, platform, model, onProgress }) {
  const tasks = TIERS.map(async (t) => {
    try {
      const design = await generateSingleDesign({ freeText, structured, platform, model, tier: t.id });
      onProgress?.(t.id, "done");
      return { tierId: t.id, design, error: null };
    } catch (e) {
      onProgress?.(t.id, "failed");
      return { tierId: t.id, design: null, error: e.message };
    }
  });

  const results = await Promise.all(tasks);
  const succeeded = results.filter(r => r.design);
  if (succeeded.length === 0) {
    throw new Error("All tier generations failed. Try again or switch model.");
  }
  return results;
}

/* ─────────────────────── Multi-model consensus (3 parallel calls) ─────────────────────── */
export async function generateConsensusDesigns({ freeText, structured, platform, models = CONSENSUS_MODELS, onProgress }) {
  const tasks = models.map(async (m) => {
    try {
      const design = await generateSingleDesign({ freeText, structured, platform, model: m, tier: "balanced" });
      onProgress?.(m, "done");
      return { model: m, design, error: null };
    } catch (e) {
      onProgress?.(m, "failed");
      return { model: m, design: null, error: e.message };
    }
  });

  const results = await Promise.all(tasks);
  const succeeded = results.filter(r => r.design);
  if (succeeded.length === 0) {
    throw new Error("All model calls failed. Check API key and quota.");
  }
  return results;
}

/* ─────────────────────── Refinement chat ─────────────────────── */
export async function refineDesign({ design, history, userMessage, platform, model }) {
  const prompt = buildRefinePrompt({ design, history, userMessage, platform });
  const { text, usage, model: modelUsed } = await callOpenRouter({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
  });

  // Detect whether response includes an updated design
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  let updatedDesign = null;
  let prose = text;

  if (jsonMatch) {
    try {
      updatedDesign = JSON.parse(jsonMatch[1].trim());
      updatedDesign._usage = usage;
      updatedDesign._model = modelUsed;
      updatedDesign._platform = platform;
      prose = text.slice(0, jsonMatch.index).trim();
    } catch (e) {
      // JSON block present but malformed — return prose only
      console.warn("Refinement JSON block failed to parse:", e);
    }
  }

  return { prose: prose || "Design updated.", updatedDesign, usage, model: modelUsed };
}

/* ─────────────────────── Consensus analysis ─────────────────────── */
/* Compares the 3 designs and surfaces agreements / disagreements */
export function analyseConsensus(results) {
  const designs = results.filter(r => r.design).map(r => ({ ...r.design, _modelLabel: r.model }));
  if (designs.length === 0) return null;

  // Collect all component names across designs, normalise
  const componentMap = new Map(); // key: lowercase service name → { count, models: Set, samples: [{model, component}] }

  designs.forEach((d, di) => {
    d.tiers.forEach(tier => {
      tier.components.forEach(c => {
        const key = normaliseServiceName(c.name);
        if (!componentMap.has(key)) {
          componentMap.set(key, { count: 0, models: new Set(), samples: [], displayName: c.name, category: c.category });
        }
        const entry = componentMap.get(key);
        entry.count += 1;
        entry.models.add(d._modelLabel);
        entry.samples.push({ model: d._modelLabel, component: c });
      });
    });
  });

  const n = designs.length;
  const agreements = [];
  const partial = [];
  const uniques = [];
  componentMap.forEach((v) => {
    if (v.count === n) agreements.push(v);
    else if (v.count >= 2) partial.push(v);
    else uniques.push(v);
  });

  // Cost spread
  const totals = designs.map(d => ({ model: d._modelLabel, total: d.totalMonthlyUsd }));
  const sortedTotals = [...totals].sort((a, b) => a.total - b.total);
  const low = sortedTotals[0];
  const high = sortedTotals[sortedTotals.length - 1];
  const median = sortedTotals[Math.floor(sortedTotals.length / 2)];

  // Feasibility consensus
  const feasibilities = designs.map(d => d.feasibility);
  const feasibilityAgreed = feasibilities.every(f => f === feasibilities[0]);

  return {
    designs,
    agreements: agreements.sort((a, b) => a.category.localeCompare(b.category)),
    partial: partial.sort((a, b) => b.count - a.count),
    uniques,
    cost: { low, high, median, spread: high.total - low.total, spreadPct: ((high.total - low.total) / median.total * 100).toFixed(0) },
    feasibilityAgreed,
    feasibilities,
  };
}

function normaliseServiceName(name) {
  return name.toLowerCase()
    .replace(/\b(azure|aws|amazon|google|gcp|cloud)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/* ─────────────────────── Azure Retail Prices lookup ─────────────────────── */
export async function fetchAzurePricing({ service, region = "westeurope", sku }) {
  const params = new URLSearchParams({ service, region });
  if (sku) params.set("sku", sku);
  const resp = await fetch(`/api/azure-pricing?${params}`);
  if (!resp.ok) throw new Error(`Azure pricing lookup failed (${resp.status})`);
  return resp.json();
}
