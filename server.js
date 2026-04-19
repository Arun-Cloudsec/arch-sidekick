import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const APP_NAME = process.env.APP_NAME || "Arch Sidekick";

app.use(express.json({ limit: "10mb" }));

// Initialize Anthropic client (only if key is set)
const anthropic = API_KEY ? new Anthropic({ apiKey: API_KEY }) : null;

/* ──────────────── Health check ──────────────── */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hasApiKey: Boolean(API_KEY), time: new Date().toISOString() });
});

/* ──────────────── Anthropic proxy (keeps /api/openrouter path for frontend compatibility) ──────────────── */
app.post("/api/openrouter", async (req, res) => {
  if (!anthropic) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured on the server." });
  }

  try {
    // Translate OpenRouter/OpenAI-format request into Anthropic-format
    const { messages = [], model, max_tokens = 4096, temperature, stream } = req.body;

    // Extract system message (Anthropic uses a separate 'system' parameter)
    let systemPrompt = "";
    const userAssistantMessages = [];
    for (const m of messages) {
      if (m.role === "system") {
        systemPrompt += (systemPrompt ? "\n\n" : "") + (typeof m.content === "string" ? m.content : JSON.stringify(m.content));
      } else {
        userAssistantMessages.push({
          role: m.role,
          content: m.content,
        });
      }
    }

    // Map model name: strip "anthropic/" prefix if frontend sends it in OpenRouter format
    let anthropicModel = model || "claude-sonnet-4-6";
    if (anthropicModel.startsWith("anthropic/")) {
      anthropicModel = anthropicModel.replace("anthropic/", "");
    }

    // Normalize: replace dots with dashes (claude-sonnet-4.5 → claude-sonnet-4-5)
    anthropicModel = anthropicModel.replace(/\./g, "-");

    // Map to current Anthropic model names (April 2026)
    const modelMap = {
      "claude-3-5-sonnet": "claude-3-5-sonnet-latest",
      "claude-3-5-haiku": "claude-3-5-haiku-latest",
      "claude-3-opus": "claude-3-opus-latest",
      "claude-sonnet-4": "claude-sonnet-4-6",
      "claude-sonnet-4-5": "claude-sonnet-4-5",
      "claude-sonnet-4-6": "claude-sonnet-4-6",
      "claude-opus-4": "claude-opus-4-7",
      "claude-opus-4-5": "claude-opus-4-6",
      "claude-opus-4-6": "claude-opus-4-6",
      "claude-opus-4-7": "claude-opus-4-7",
      "claude-haiku-4-5": "claude-haiku-4-5",
    };
    anthropicModel = modelMap[anthropicModel] || anthropicModel;

    // Call Anthropic
    const response = await anthropic.messages.create({
      model: anthropicModel,
      max_tokens,
      ...(systemPrompt && { system: systemPrompt }),
      ...(temperature !== undefined && { temperature }),
      messages: userAssistantMessages,
    });

    // Translate Anthropic response back into OpenRouter/OpenAI format (so frontend parsing works unchanged)
    const text = response.content
      .filter(block => block.type === "text")
      .map(block => block.text)
      .join("");

    const openAIFormatResponse = {
      id: response.id,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: response.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: text,
          },
          finish_reason: response.stop_reason === "end_turn" ? "stop" : response.stop_reason,
        },
      ],
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };

    res.json(openAIFormatResponse);
  } catch (err) {
    console.error("Anthropic proxy error:", err);
    const status = err.status || 502;
    res.status(status).json({
      error: "Upstream call to Anthropic failed",
      detail: err.message,
    });
  }
});

/* ──────────────── Azure Retail Prices API (public, no auth) ────────────────
   Docs: https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices
*/
app.get("/api/azure-pricing", async (req, res) => {
  const { service, region = "westeurope", sku } = req.query;
  if (!service) return res.status(400).json({ error: "service query parameter required" });

  const filters = [
    `serviceName eq '${service.replace(/'/g, "''")}'`,
    `armRegionName eq '${region}'`,
    `priceType eq 'Consumption'`,
  ];
  if (sku) filters.push(`contains(tolower(skuName), tolower('${sku.replace(/'/g, "''")}'))`);

  const url = `https://prices.azure.com/api/retail/prices?$filter=${encodeURIComponent(filters.join(" and "))}&$top=20`;
  try {
    const r = await fetch(url, { headers: { accept: "application/json" } });
    const data = await r.json();
    const items = (data.Items || []).slice(0, 20).map(i => ({
      service: i.serviceName,
      productName: i.productName,
      skuName: i.skuName,
      armSkuName: i.armSkuName,
      meterName: i.meterName,
      retailPrice: i.retailPrice,
      unitOfMeasure: i.unitOfMeasure,
      region: i.armRegionName,
      currency: i.currencyCode,
      type: i.type,
    }));
    res.json({ service, region, count: items.length, items });
  } catch (err) {
    console.error("Azure pricing fetch error:", err);
    res.status(502).json({ error: "Failed to fetch Azure retail pricing", detail: err.message });
  }
});

/* ──────────────── Static frontend ──────────────── */
const distDir = path.join(__dirname, "dist");
app.use(express.static(distDir));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n  Arch Sidekick v2`);
  console.log(`  Listening on http://localhost:${PORT}`);
  console.log(`  Anthropic key: ${API_KEY ? "configured" : "NOT SET"}\n`);
});
