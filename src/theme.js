/* ─────────────────────── Theme ─────────────────────── */
export const T = {
  bg: "#0B0E14",
  bgElev: "#12161F",
  bgElev2: "#171C28",
  line: "#252B38",
  lineSoft: "#1A1F2B",
  text: "#E8EAF0",
  textSoft: "#A0A7B8",
  textFade: "#5A6070",
  blue: "#5B9FED",
  blueBg: "rgba(91, 159, 237, 0.1)",
  cyan: "#5EE4D0",
  cyanBg: "rgba(94, 228, 208, 0.1)",
  green: "#7DD3A6",
  greenBg: "rgba(125, 211, 166, 0.1)",
  amber: "#F2B452",
  amberBg: "rgba(242, 180, 82, 0.12)",
  red: "#EF6E6E",
  redBg: "rgba(239, 110, 110, 0.12)",
  purple: "#B686FF",
  purpleBg: "rgba(182, 134, 255, 0.1)",
};

/* ─────────────────────── Platforms ─────────────────────── */
export const PLATFORMS = [
  { id: "Azure", label: "Azure", color: "#5B9FED", region: "westeurope",  regionLabel: "West Europe" },
  { id: "AWS",   label: "AWS",   color: "#F2B452", region: "eu-west-1",   regionLabel: "eu-west-1 (Ireland)" },
  { id: "GCP",   label: "GCP",   color: "#7DD3A6", region: "europe-west1", regionLabel: "europe-west1 (Belgium)" },
];

/* ─────────────────────── OpenRouter models ─────────────────────── */
/* Adjust slugs as OpenRouter updates them at https://openrouter.ai/models */
export const MODELS = [
  { id: "anthropic/claude-sonnet-4.5",       label: "Claude Sonnet 4.5",  short: "Sonnet 4.5",  note: "Balanced · recommended default" },
  { id: "anthropic/claude-opus-4.1",         label: "Claude Opus 4.1",    short: "Opus 4.1",    note: "Highest quality · slower" },
  { id: "openai/gpt-5",                      label: "GPT-5",              short: "GPT-5",       note: "Strong alternative POV" },
  { id: "google/gemini-2.5-pro-preview",     label: "Gemini 2.5 Pro",     short: "Gemini 2.5",  note: "Long context" },
  { id: "deepseek/deepseek-chat",            label: "DeepSeek V3",        short: "DeepSeek",    note: "Cheap · fast drafts" },
];

/* Default model triple for multi-model consensus mode */
export const CONSENSUS_MODELS = [
  "anthropic/claude-sonnet-4.5",
  "openai/gpt-5",
  "google/gemini-2.5-pro-preview",
];

/* ─────────────────────── Generation modes ─────────────────────── */
export const MODES = [
  {
    id: "single",
    label: "Single design",
    description: "One balanced design from one model",
    subtitle: "~20s · $0.05",
    chipLabel: "1 design",
  },
  {
    id: "tiers",
    label: "Alternative tiers",
    description: "Cost-optimised + balanced + enterprise, side-by-side",
    subtitle: "~45s · $0.15",
    chipLabel: "3 tiers",
  },
  {
    id: "consensus",
    label: "Multi-model consensus",
    description: "Same prompt to 3 different models. Disagreements flagged.",
    subtitle: "~45s · $0.12",
    chipLabel: "3 models",
  },
];

/* ─────────────────────── Tier meta (used in alternative-tiers mode) ─────────────────────── */
export const TIERS = [
  { id: "cost-opt",   label: "Cost-optimised",  color: "#7DD3A6", subtitle: "Cheapest that meets requirements" },
  { id: "balanced",   label: "Balanced",        color: "#5B9FED", subtitle: "Reasonable trade-offs" },
  { id: "enterprise", label: "Enterprise",      color: "#B686FF", subtitle: "Max reliability, premium SKUs" },
];

/* ─────────────────────── Example prompts ─────────────────────── */
export const EXAMPLES = [
  {
    title: "E-commerce platform",
    prompt: "E-commerce platform handling orders, payments, and inventory. 100k daily active users, PCI-DSS compliance. Expect 3x traffic spikes during seasonal promotions. Budget is $25k/month. Need 99.95% SLA."
  },
  {
    title: "Internal HR portal",
    prompt: "Internal HR self-service portal for 5,000 employees. GDPR compliance, single region. Integrates with SAP SuccessFactors and on-prem Active Directory via hybrid. Budget around $8k/month. Business-hours usage."
  },
  {
    title: "IoT analytics",
    prompt: "Real-time IoT analytics platform. 50,000 devices sending telemetry every 10 seconds. Hot data retained 12 months, cold archive for 5 years. SOC 2 Type II required. 500 concurrent dashboard users. Budget $18k/month."
  },
  {
    title: "Multi-tenant B2B SaaS",
    prompt: "Multi-tenant B2B SaaS platform. 200 customer tenants, average 100 users per tenant. 99.95% SLA with multi-region DR (active-passive). GDPR and ISO 27001. Budget approximately $35k/month."
  },
];

/* ─────────────────────── Coverage meta ─────────────────────── */
export const COVERAGE = {
  met:     { label: "Met",     color: T.green, bg: T.greenBg },
  partial: { label: "Partial", color: T.amber, bg: T.amberBg },
  gap:     { label: "Gap",     color: T.red,   bg: T.redBg },
};

export const FEASIBILITY = {
  feasible:    { label: "Feasible design", color: T.green, bg: T.greenBg, glyph: "✓" },
  tight:       { label: "Tight fit",       color: T.amber, bg: T.amberBg, glyph: "◐" },
  challenging: { label: "Challenging",     color: T.red,   bg: T.redBg,   glyph: "△" },
};
