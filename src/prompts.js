/* ─────────────────────── Platform-specific guidance ─────────────────────── */
const PLATFORM_GUIDANCE = {
  Azure: `
- Prefer Azure-native PaaS: App Service, AKS, Container Apps, Functions, Logic Apps
- Apply the Azure Well-Architected Framework (reliability, security, cost, operational excellence, performance)
- Security: Entra ID, Key Vault, Defender for Cloud, Microsoft Sentinel, Azure Policy
- Data: Azure SQL Database, Cosmos DB, Azure Database for PostgreSQL, Azure Cache for Redis, Storage Accounts
- Integration: Azure API Management, Service Bus, Event Hubs, Event Grid, Front Door, Application Gateway
- Observability: Log Analytics, Application Insights, Azure Monitor, Workbooks
- SKU specificity: name the exact tier (e.g. "App Service P1v3", "Standard_D4s_v5", "Azure SQL BC_Gen5_8vCore", "Cosmos DB autoscale 4000 RU/s")`,

  AWS: `
- Prefer AWS managed services: ECS/Fargate, EKS, App Runner, Lambda, Elastic Beanstalk, Amplify
- Apply the AWS Well-Architected Framework (operational excellence, security, reliability, performance, cost, sustainability)
- Security: IAM, AWS KMS, Secrets Manager, Security Hub, GuardDuty, AWS WAF, Shield
- Data: RDS (PostgreSQL/MySQL), Aurora, DynamoDB, ElastiCache (Redis/Memcached), S3, Redshift
- Integration: API Gateway, SQS, SNS, EventBridge, Step Functions, CloudFront, ALB/NLB
- Observability: CloudWatch (Logs, Metrics, Alarms), X-Ray, AWS Distro for OpenTelemetry
- SKU specificity: name the exact instance type (e.g. "t3.medium", "m7g.large", "db.r6g.xlarge", "Aurora Serverless v2 1-8 ACUs")`,

  GCP: `
- Prefer Google Cloud managed services: Cloud Run, GKE, App Engine, Cloud Functions, Cloud Workflows
- Apply the Google Cloud Architecture Framework (system design, operational excellence, security, reliability, cost, performance)
- Security: Cloud IAM, Cloud KMS, Secret Manager, Security Command Center, Cloud Armor, BeyondCorp
- Data: Cloud SQL, Spanner, AlloyDB, Firestore, Bigtable, Memorystore, Cloud Storage, BigQuery
- Integration: API Gateway / Apigee, Pub/Sub, Cloud Tasks, Eventarc, Cloud CDN, Load Balancers
- Observability: Cloud Logging, Cloud Monitoring, Cloud Trace, Cloud Profiler
- SKU specificity: name the exact machine type/tier (e.g. "e2-standard-4", "n2-highmem-8", "Cloud SQL db-custom-4-16384", "Cloud Run 2 vCPU / 4Gi")`,
};

/* ─────────────────────── Tier instructions (for alternative-tiers mode) ─────────────────────── */
const TIER_INSTRUCTIONS = {
  balanced: "Design for the BALANCED tier — reasonable trade-offs between cost, reliability, and operational complexity. Production-grade but not gold-plated.",
  "cost-opt": "Design for the COST-OPTIMISED tier — the cheapest architecture that still meets the stated functional requirements and compliance. Accept lower SLAs, manual failover, single-region if workload allows. Favour serverless and consumption pricing.",
  enterprise: "Design for the ENTERPRISE tier — maximum reliability, redundancy, premium SKUs, multi-region active-passive (or active-active if warranted), top-tier SLA. Cost is secondary to resilience and operational confidence.",
};

/* ─────────────────────── Main design prompt ─────────────────────── */
export function buildDesignPrompt({ freeText, structured, platform, tier = "balanced" }) {
  return `You are a senior ${platform} Solution Architect with 15+ years of experience designing enterprise-grade production systems. You are producing the FIRST DRAFT reference architecture that a human architect will refine before presenting to the customer. Be thorough, pragmatic, and honest about trade-offs.

## Core principles
1. Prefer managed services over self-managed wherever reasonable.
2. Apply Well-Architected best practices: security by default, reliability via redundancy, cost efficiency, operational simplicity, performance.
3. Size components realistically for the stated load. Assume HA (minimum 2 availability zones for production tiers).
4. Always name specific SKUs/tiers/instance types, never generic categories.
5. Provide indicative monthly USD estimates based on public retail pricing as of your knowledge cutoff. Real pricing varies by region, commitment, and EA/enterprise discounts. This is a first-draft estimate.
6. Be honest when trade-offs exist. Call out what you'd pressure-test with the customer.

## ${platform}-specific guidance
${PLATFORM_GUIDANCE[platform]}

## Tier instruction
${TIER_INSTRUCTIONS[tier]}

## Customer input

Free-text requirement:
${freeText}

Structured parameters (may be partial or empty):
${JSON.stringify(structured || {}, null, 2)}

## Output contract

Return ONLY valid JSON (no markdown fences, no preamble) with this exact shape:

{
  "summary": "2-3 sentence executive summary of the design and its shape, addressed to the delivery team.",
  "feasibility": "feasible" | "tight" | "challenging",
  "feasibilityNote": "one-sentence note on fit vs stated constraints",
  "parsedRequirements": {
    "workload": "short description of the workload type",
    "users": "e.g. 100k DAU / 10k concurrent / 50 internal",
    "regions": ["Primary region name"],
    "compliance": ["GDPR", "PCI-DSS"],
    "budgetMonthlyUsd": number_or_null,
    "slo": "e.g. 99.95%",
    "dataVolume": "e.g. 5TB operational, 20TB archive",
    "trafficPattern": "e.g. steady with 3x promotional spikes"
  },
  "tiers": [
    {
      "name": "Edge & Security | Compute | Data & Storage | Integration | Observability | Identity | DevOps",
      "components": [
        {
          "name": "e.g. '${platform === "Azure" ? "Azure Front Door Premium" : platform === "AWS" ? "Amazon CloudFront + AWS WAF" : "Cloud CDN + Cloud Armor"}'",
          "category": "CDN | WAF | Compute | Database | Cache | Messaging | Monitoring | Storage | Network | Identity | AI | DevOps | Other",
          "sku": "specific SKU/tier/instance-type",
          "quantity": "e.g. 1, 3 nodes, 8 vCPU x 32GB",
          "purpose": "one-line role in this architecture",
          "rationale": "1-2 sentences on why this service AND this SKU specifically",
          "monthlyUsd": number,
          "azureServiceName": "${platform === "Azure" ? "exact Azure serviceName for Retail Prices API, e.g. 'Azure Front Door', 'Virtual Machines', 'SQL Database'" : "null or omit"}"
        }
      ]
    }
  ],
  "totalMonthlyUsd": number,
  "budgetFit": "within" | "tight" | "over",
  "budgetFitNote": "e.g. '12% headroom' or '$3.2k over budget'",
  "compliance": [
    { "requirement": "GDPR", "coverage": "met" | "partial" | "gap", "how": "2-3 sentences on specific services/controls" }
  ],
  "nonFunctional": [
    { "aspect": "Availability", "target": "99.95%", "how": "..." },
    { "aspect": "Disaster Recovery", "target": "RPO 1h / RTO 4h", "how": "..." },
    { "aspect": "Performance", "target": "<200ms p95 API", "how": "..." },
    { "aspect": "Security", "target": "...", "how": "..." },
    { "aspect": "Scalability", "target": "...", "how": "..." }
  ],
  "tradeoffs": [
    { "chose": "X", "over": "Y", "because": "...", "revisitIf": "..." }
  ],
  "assumptions": ["Pricing based on ${platform} public retail rates as of knowledge cutoff.", "..."],
  "risks": ["..."],
  "nextQuestions": [
    "Do you have an existing ${platform === "Azure" ? "Enterprise Agreement" : platform === "AWS" ? "Enterprise Discount Program" : "committed use discount"}?",
    "..."
  ],
  "pricingNote": "Indicative pricing. Validate with ${platform === "Azure" ? "Azure Pricing Calculator" : platform === "AWS" ? "AWS Pricing Calculator" : "Google Cloud Pricing Calculator"} before customer-facing quote."
}

Return the JSON object only.`;
}

/* ─────────────────────── Refinement prompt ─────────────────────── */
export function buildRefinePrompt({ design, history, userMessage, platform }) {
  const historyText = history.length
    ? history.map(m => `${m.role === "user" ? "Architect" : "You"}: ${m.content}`).join("\n\n")
    : "(none yet)";

  return `You are a senior ${platform} Solution Architect working with a delivery team to refine a reference architecture you previously drafted. The team will ask questions or request modifications. Be practical and direct.

## Current design
${JSON.stringify(design, null, 2)}

## Conversation so far
${historyText}

## Architect's new message
${userMessage}

## How to respond

1. If the architect is asking a **question or for explanation** (e.g. "why did you choose X over Y", "explain the DR strategy"), respond with prose only. Keep it focused — 2-4 sentences unless more is genuinely warranted.

2. If the architect is requesting a **modification** (e.g. "reduce costs by 30%", "drop the DR region", "swap X for Y", "add multi-region"), respond with:

   A. A brief prose explanation of what you're changing and the impact (2-4 sentences).

   B. Then, on a new line, the updated full design JSON inside a fenced code block:

   \`\`\`json
   { ...the entire updated design, same schema as the original... }
   \`\`\`

   Only include the JSON block when you are making actual structural or costing changes. For explanations, no JSON.

3. Preserve the JSON schema exactly — all fields must be present even if unchanged. Update \`summary\`, \`totalMonthlyUsd\`, \`budgetFit\`, and any affected tiers/components/trade-offs/assumptions. Do not invent new schema fields.

4. Keep your tone that of a trusted senior architect working alongside the team — direct, pragmatic, willing to push back if the request is unwise.`;
}
