import { useState, useRef, useEffect } from "react";
import {
  Sparkles, ArrowRight, Loader2, Download, RotateCcw, Printer, X,
  AlertTriangle, Info, ChevronRight, Cpu, Database, Layers, MessageSquare,
  Activity, HardDrive, Globe, KeyRound, Shield, Box, Network, Code2,
  CircleAlert, CircleCheck, CircleDot, Compass, Wand2, Users, Zap,
  FileSpreadsheet, Presentation, MessageCircle, GitCompareArrows, DollarSign,
  Check, TrendingUp, TrendingDown, Equal
} from "lucide-react";
import { T, PLATFORMS, MODELS, MODES, TIERS, COVERAGE, FEASIBILITY, EXAMPLES } from "./theme.js";
import { fetchAzurePricing } from "./api.js";

/* ─────────────────────── Category icons ─────────────────────── */
const CAT_ICON = {
  CDN: Globe, WAF: Shield, Compute: Cpu, Database: Database, Cache: Layers,
  Messaging: MessageSquare, Monitoring: Activity, Storage: HardDrive,
  Network: Network, Identity: KeyRound, AI: Sparkles, DevOps: Code2, Other: Box,
};
const CAT_COLOR = {
  CDN: T.cyan, WAF: T.red, Compute: T.blue, Database: T.purple, Cache: T.amber,
  Messaging: T.green, Monitoring: T.cyan, Storage: T.textSoft, Network: T.blue,
  Identity: T.amber, AI: T.purple, DevOps: T.green, Other: T.textSoft,
};

/* ─────────────────────── Circle placeholder (not imported from lucide for styling control) ─────────────────────── */
const EmptyCircle = ({ size = 14, color = T.textFade }) =>
  <div style={{ width: size, height: size, border: `1.5px solid ${color}`, borderRadius: "50%", opacity: 0.5 }} />;

/* ═════════════════════════════════════════════════════════════
   HEADER
═════════════════════════════════════════════════════════════ */
export const Header = ({ platform, setPlatform, model, setModel, hasResult, onReset, onExportExcel, onExportPpt, onPrint, onRefineToggle }) => (
  <header className="sticky top-0 z-30 border-b backdrop-blur-sm no-print" style={{ background: `${T.bg}E6`, borderColor: T.line }}>
    <div className="max-w-[1500px] mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 flex items-center justify-center" style={{ background: T.blue, color: T.bg }}>
          <Compass size={18} strokeWidth={2} />
        </div>
        <div>
          <div className="font-display text-lg leading-none" style={{ color: T.text, fontWeight: 500 }}>Arch Sidekick</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] mt-1" style={{ color: T.textFade }}>
            Multi-cloud reference architect
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Platform chip group */}
        <div className="flex items-center p-1" style={{ background: T.bgElev, border: `1px solid ${T.line}` }}>
          {PLATFORMS.map(p => (
            <button key={p.id} onClick={() => setPlatform(p.id)}
              className="px-3 py-1.5 font-mono text-xs transition-all"
              style={{
                background: platform === p.id ? p.color : "transparent",
                color: platform === p.id ? T.bg : T.textSoft,
                fontWeight: platform === p.id ? 600 : 400,
              }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Model selector */}
        <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: T.bgElev, border: `1px solid ${T.line}` }}>
          <Wand2 size={12} style={{ color: T.textFade }} />
          <select value={model} onChange={e => setModel(e.target.value)}
            className="bg-transparent outline-none font-mono text-xs" style={{ color: T.text }}>
            {MODELS.map(m => (
              <option key={m.id} value={m.id} style={{ background: T.bgElev }}>{m.short}</option>
            ))}
          </select>
        </div>

        {hasResult && (
          <>
            <button onClick={onRefineToggle} className="flex items-center gap-2 px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: T.cyan, color: T.bg }}>
              <MessageCircle size={13} /> Refine
            </button>
            <button onClick={onExportPpt} className="flex items-center gap-2 px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: T.blue, color: T.bg }}>
              <Presentation size={13} /> .pptx
            </button>
            <button onClick={onExportExcel} className="flex items-center gap-2 px-3 py-2 text-xs"
              style={{ background: T.bgElev, color: T.textSoft, border: `1px solid ${T.line}` }}>
              <FileSpreadsheet size={13} /> .xlsx
            </button>
            <button onClick={onPrint} className="p-2" style={{ color: T.textFade }} title="Print">
              <Printer size={14} />
            </button>
            <button onClick={onReset} className="p-2" style={{ color: T.textFade }} title="New">
              <RotateCcw size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  </header>
);

/* ═════════════════════════════════════════════════════════════
   INTAKE VIEW
═════════════════════════════════════════════════════════════ */
export const IntakeView = ({ onGenerate, error, platform, mode, setMode, model }) => {
  const [text, setText] = useState("");
  const [showStructured, setShowStructured] = useState(false);
  const [structured, setStructured] = useState({
    workload: "", users: "", regions: "", compliance: "", budget: "", slo: "", data: "", traffic: ""
  });
  const textareaRef = useRef(null);

  const submit = () => text.trim() && onGenerate(text.trim(), structured);
  const modelInfo = MODELS.find(m => m.id === model);
  const modeInfo = MODES.find(m => m.id === mode);
  const platformInfo = PLATFORMS.find(p => p.id === platform);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-6 flex items-center gap-3" style={{ color: T.textFade }}>
        <span className="inline-block w-8 h-px" style={{ background: platformInfo.color }} />
        {platformInfo.label} · Reference design intake
      </div>

      <h1 className="font-display text-6xl md:text-7xl leading-[0.95] mb-6" style={{ color: T.text, fontWeight: 400, letterSpacing: "-0.025em" }}>
        Describe the workload.<br/>
        <span style={{ color: platformInfo.color, fontStyle: "italic", fontWeight: 300 }}>
          Get {mode === "single" ? "a first-draft" : mode === "tiers" ? "three alternative" : "three model-compared"} architecture{mode !== "single" ? "s" : ""}.
        </span>
      </h1>

      <p className="text-lg leading-relaxed max-w-2xl mb-10" style={{ color: T.textSoft }}>
        Plain-English requirement in → reference architecture with specific SKUs, monthly cost estimate, compliance coverage, and the questions you should pressure-test with the customer.
      </p>

      {/* Mode selector */}
      <div className="mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: T.textFade }}>Generation mode</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className="text-left p-4 transition-all"
              style={{
                background: mode === m.id ? T.bgElev2 : T.bgElev,
                border: `1px solid ${mode === m.id ? T.blue : T.line}`,
              }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-display text-sm font-medium" style={{ color: T.text }}>{m.label}</div>
                {mode === m.id && <Check size={14} style={{ color: T.blue }} />}
              </div>
              <div className="text-xs leading-relaxed mb-2" style={{ color: T.textSoft }}>{m.description}</div>
              <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: T.textFade }}>{m.subtitle}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main prompt box */}
      <div className="relative mb-4">
        <textarea ref={textareaRef} value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
          placeholder={`e.g. ${EXAMPLES[0].prompt.slice(0, 120)}…`}
          rows={5}
          className="w-full p-5 text-base leading-relaxed outline-none transition-colors"
          style={{ background: T.bgElev, border: `1px solid ${text ? platformInfo.color : T.line}`, color: T.text, fontFamily: "Geist, sans-serif" }} />
        <button onClick={submit} disabled={!text.trim()}
          className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all disabled:opacity-40"
          style={{ background: text.trim() ? platformInfo.color : T.line, color: T.bg }}>
          Generate <ArrowRight size={14} />
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs mb-10 flex-wrap" style={{ color: T.textFade }}>
        <span className="font-mono uppercase tracking-wider">Mode</span>
        <span className="font-mono" style={{ color: platformInfo.color }}>{modeInfo.chipLabel}</span>
        <span>·</span>
        <span className="font-mono uppercase tracking-wider">Model</span>
        <span className="font-mono" style={{ color: T.blue }}>
          {mode === "consensus" ? "3 models (auto)" : modelInfo?.label}
        </span>
        <span className="ml-auto font-mono">⌘↵ generate</span>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 mb-6 slide-up" style={{ background: T.redBg, border: `1px solid ${T.red}40` }}>
          <AlertTriangle size={16} style={{ color: T.red }} className="flex-shrink-0 mt-0.5" />
          <div className="text-sm" style={{ color: T.text }}>{error}</div>
        </div>
      )}

      <div className="mb-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: T.textFade }}>─ Or start from an example</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {EXAMPLES.map((ex, i) => (
            <button key={i} onClick={() => { setText(ex.prompt); textareaRef.current?.focus(); }}
              className="text-left p-4 transition-colors group"
              style={{ background: T.bgElev, border: `1px solid ${T.line}` }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = platformInfo.color; e.currentTarget.style.background = T.bgElev2; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.background = T.bgElev; }}>
              <div className="font-display text-sm font-medium mb-1.5 flex items-center justify-between" style={{ color: T.text }}>
                {ex.title}
                <ArrowRight size={12} style={{ color: T.textFade }} className="transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="text-xs leading-relaxed line-clamp-2" style={{ color: T.textSoft }}>{ex.prompt}</div>
            </button>
          ))}
        </div>
      </div>

      <details open={showStructured} onToggle={e => setShowStructured(e.currentTarget.open)}>
        <summary className="cursor-pointer flex items-center gap-2 text-sm font-mono uppercase tracking-wider mb-4" style={{ color: T.textSoft }}>
          <ChevronRight size={14} style={{ transform: showStructured ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s" }} />
          Optional · Structured parameters
        </summary>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {[
            ["workload", "Workload type", "e.g. e-commerce API"],
            ["users", "Users / load", "e.g. 100k DAU, 10k concurrent"],
            ["regions", "Regions", "e.g. West Europe + DR"],
            ["compliance", "Compliance", "e.g. GDPR, PCI-DSS"],
            ["budget", "Monthly budget (USD)", "e.g. 25000"],
            ["slo", "SLO / SLA target", "e.g. 99.95%"],
            ["data", "Data volume", "e.g. 5TB operational"],
            ["traffic", "Traffic pattern", "e.g. 3x spikes"],
          ].map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="block text-[10px] uppercase tracking-wider font-mono mb-1" style={{ color: T.textFade }}>{label}</label>
              <input value={structured[key]} onChange={e => setStructured({ ...structured, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full px-3 py-2 text-sm outline-none"
                style={{ background: T.bgElev, border: `1px solid ${T.line}`, color: T.text }} />
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════
   ANALYSING VIEW (with per-task progress for parallel modes)
═════════════════════════════════════════════════════════════ */
export const AnalysingView = ({ mode, platform, taskProgress }) => {
  const singleSteps = [
    "Parsing requirements…",
    "Applying Well-Architected principles…",
    "Selecting services…",
    "Sizing components…",
    "Estimating costs…",
  ];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep(i => Math.min(i + 1, singleSteps.length - 1)), 2500);
    return () => clearInterval(timer);
  }, []);

  const platformInfo = PLATFORMS.find(p => p.id === platform);

  return (
    <div className="max-w-[900px] mx-auto px-6 py-24 text-center fade-in">
      <div className="inline-flex items-center justify-center mb-8 relative">
        <div className="absolute inset-0 rounded-full" style={{ background: `${platformInfo.color}15`, filter: "blur(24px)" }} />
        <Loader2 size={32} className="animate-spin relative" style={{ color: platformInfo.color }} strokeWidth={1.5} />
      </div>

      <div className="font-mono text-xs uppercase tracking-[0.3em] mb-4" style={{ color: T.textFade }}>
        {platformInfo.label} · {MODES.find(m => m.id === mode)?.label}
      </div>

      <h2 className="font-display text-5xl mb-6" style={{ color: T.text, fontWeight: 400, letterSpacing: "-0.02em" }}>
        Drafting the architecture<span style={{ color: platformInfo.color }}>.</span>
      </h2>

      <div className="max-w-md mx-auto">
        <div className="h-px w-full scan-line mb-8" style={{ background: T.line }} />

        {mode === "single" ? (
          <div className="space-y-2.5 text-left">
            {singleSteps.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm transition-opacity"
                style={{ opacity: i <= step ? 1 : 0.3 }}>
                {i < step ? <CircleCheck size={14} style={{ color: T.green }} /> :
                 i === step ? <CircleDot size={14} style={{ color: platformInfo.color }} className="animate-pulse" /> :
                 <EmptyCircle />}
                <span className="font-mono text-xs" style={{ color: i <= step ? T.text : T.textFade }}>{s}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 text-left">
            {Object.entries(taskProgress || {}).map(([key, status]) => (
              <div key={key} className="flex items-center justify-between p-3" style={{ background: T.bgElev, border: `1px solid ${T.line}` }}>
                <div className="flex items-center gap-3">
                  {status === "done" ? <CircleCheck size={14} style={{ color: T.green }} /> :
                   status === "failed" ? <CircleAlert size={14} style={{ color: T.red }} /> :
                   <Loader2 size={14} className="animate-spin" style={{ color: platformInfo.color }} />}
                  <span className="font-mono text-xs" style={{ color: T.text }}>
                    {mode === "tiers" ? TIERS.find(t => t.id === key)?.label : MODELS.find(m => m.id === key)?.label || key}
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: status === "done" ? T.green : status === "failed" ? T.red : T.textFade }}>
                  {status === "done" ? "complete" : status === "failed" ? "failed" : "running"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════
   FEASIBILITY BANNER
═════════════════════════════════════════════════════════════ */
export const FeasibilityBanner = ({ design }) => {
  const meta = FEASIBILITY[design.feasibility] || FEASIBILITY.tight;
  return (
    <section className="mb-8 fade-in">
      <div className="flex items-start gap-5 mb-4">
        <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center font-display text-2xl"
          style={{ background: meta.bg, border: `1px solid ${meta.color}`, color: meta.color }}>
          {meta.glyph}
        </div>
        <div className="flex-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] px-2 py-1 inline-block mb-2"
            style={{ color: meta.color, background: meta.bg }}>
            {meta.label}
          </div>
          <h2 className="font-display text-3xl leading-tight mb-2" style={{ color: T.text, fontWeight: 500, letterSpacing: "-0.015em" }}>
            {design.summary}
          </h2>
          <p className="text-sm" style={{ color: T.textSoft }}>{design.feasibilityNote}</p>
        </div>
      </div>
    </section>
  );
};

/* ═════════════════════════════════════════════════════════════
   BUDGET METER
═════════════════════════════════════════════════════════════ */
export const BudgetMeter = ({ design }) => {
  const total = design.totalMonthlyUsd;
  const budget = design.parsedRequirements.budgetMonthlyUsd;
  const pct = budget ? Math.min((total / budget) * 100, 150) : null;
  const color = !budget ? T.blue : pct <= 90 ? T.green : pct <= 100 ? T.amber : T.red;

  return (
    <div className="p-5 mb-4" style={{ background: T.bgElev, border: `1px solid ${T.line}` }}>
      <div className="flex items-baseline justify-between mb-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: T.textFade }}>Monthly spend · this design</div>
        <div className="font-mono text-xs" style={{ color: T.textFade }}>{design.budgetFitNote}</div>
      </div>
      <div className="flex items-end gap-6 mb-4 flex-wrap">
        <div>
          <div className="font-display text-5xl leading-none" style={{ color: T.text, fontWeight: 400 }}>
            ${total.toLocaleString()}
          </div>
          <div className="font-mono text-xs mt-2" style={{ color: T.textFade }}>
            {budget ? `vs $${budget.toLocaleString()} stated budget` : "no budget stated"}
          </div>
        </div>
        {budget && (
          <div className="flex-1 min-w-[200px]">
            <div className="relative h-8" style={{ background: T.lineSoft }}>
              <div className="absolute inset-y-0 left-0 transition-all duration-1000"
                style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
              {pct > 100 && (
                <div className="absolute inset-y-0 transition-all duration-1000"
                  style={{ left: "100%", width: `${Math.min(pct - 100, 50)}%`, background: T.red, opacity: 0.5 }} />
              )}
              <div className="absolute inset-y-0 w-px" style={{ left: "100%", background: T.text }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════
   REQUIREMENT CHIPS
═════════════════════════════════════════════════════════════ */
export const RequirementChips = ({ req }) => {
  const chips = [];
  if (req.workload) chips.push({ label: "Workload", value: req.workload, color: T.blue });
  if (req.users) chips.push({ label: "Users", value: req.users, color: T.cyan });
  if (req.regions?.length) chips.push({ label: "Region", value: req.regions.join(", "), color: T.purple });
  if (req.compliance?.length) chips.push({ label: "Compliance", value: req.compliance.join(" · "), color: T.amber });
  if (req.slo) chips.push({ label: "SLO", value: req.slo, color: T.green });
  if (req.dataVolume) chips.push({ label: "Data", value: req.dataVolume, color: T.textSoft });
  if (req.trafficPattern) chips.push({ label: "Traffic", value: req.trafficPattern, color: T.textSoft });
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {chips.map((c, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-1.5" style={{ background: T.bgElev, border: `1px solid ${T.line}` }}>
          <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: c.color }}>{c.label}</span>
          <span className="text-xs" style={{ color: T.text }}>{c.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════
   ARCHITECTURE DIAGRAM (tiered)
═════════════════════════════════════════════════════════════ */
export const ArchitectureDiagram = ({ design, onSelect, compact }) => (
  <section className={`${compact ? "mb-6" : "mb-10"} slide-up`}>
    {!compact && (
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: T.textFade }}>Reference architecture</div>
          <h3 className="font-display text-2xl" style={{ color: T.text, fontWeight: 500 }}>The shape</h3>
        </div>
        <div className="font-mono text-xs" style={{ color: T.textFade }}>
          {design.tiers.reduce((sum, t) => sum + t.components.length, 0)} components · {design.tiers.length} tiers
        </div>
      </div>
    )}
    <div className="blueprint p-4 md:p-6" style={{ background: T.bgElev, border: `1px solid ${T.line}` }}>
      <div className="space-y-3">
        {design.tiers.map((tier, ti) => (
          <div key={ti} className="relative">
            {ti > 0 && <div className="absolute -top-3 left-1/2 w-px h-3" style={{ background: T.line, transform: "translateX(-50%)" }} />}
            <div className="flex items-stretch gap-3 flex-wrap md:flex-nowrap">
              <div className="flex-shrink-0 w-full md:w-32 flex items-center">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: T.blue }}>{tier.name}</div>
              </div>
              <div className="flex-1 flex flex-wrap gap-2">
                {tier.components.map((c, ci) => {
                  const Icon = CAT_ICON[c.category] || Box;
                  const color = CAT_COLOR[c.category] || T.textSoft;
                  return (
                    <button key={ci} onClick={() => onSelect(c)}
                      className="flex items-start gap-3 p-3 flex-1 min-w-[220px] max-w-[360px] text-left transition-all"
                      style={{ background: T.bg, border: `1px solid ${T.line}` }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = color; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.line; }}>
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
                        <Icon size={14} style={{ color }} strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-sm font-medium leading-tight mb-0.5" style={{ color: T.text }}>{c.name}</div>
                        <div className="font-mono text-[10px] leading-tight mb-1 truncate" style={{ color: T.textFade }}>{c.sku}</div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-xs" style={{ color }}>${c.monthlyUsd?.toLocaleString() || "—"}</span>
                          <span className="text-[10px] font-mono" style={{ color: T.textFade }}>/mo</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ═════════════════════════════════════════════════════════════
   SERVICE DETAIL with Azure Retail Prices lookup
═════════════════════════════════════════════════════════════ */
export const ServiceDetail = ({ component, platform, onClose }) => {
  const [pricingData, setPricingData] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState("");

  if (!component) return null;
  const Icon = CAT_ICON[component.category] || Box;
  const color = CAT_COLOR[component.category] || T.textSoft;
  const canCheckAzure = platform === "Azure";

  const checkPricing = async () => {
    setPricingLoading(true);
    setPricingError("");
    setPricingData(null);
    try {
      const serviceName = component.azureServiceName || inferAzureServiceName(component);
      const data = await fetchAzurePricing({ service: serviceName, sku: extractSkuHint(component.sku) });
      setPricingData(data);
      if (data.count === 0) setPricingError(`No matches for "${serviceName}". Try a different service name.`);
    } catch (e) { setPricingError(e.message); }
    finally { setPricingLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end no-print" style={{ background: "rgba(11,14,20,0.7)" }} onClick={onClose}>
      <div className="w-full max-w-lg h-full overflow-y-auto slide-up" style={{ background: T.bg, borderLeft: `1px solid ${T.line}` }} onClick={e => e.stopPropagation()}>
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
                <Icon size={18} style={{ color }} strokeWidth={1.75} />
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color }}>{component.category}</div>
                <h3 className="font-display text-xl leading-tight mt-1" style={{ color: T.text, fontWeight: 500 }}>{component.name}</h3>
              </div>
            </div>
            <button onClick={onClose} style={{ color: T.textFade }}><X size={18} /></button>
          </div>

          <div className="space-y-5">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: T.textFade }}>SKU · Size</div>
              <div className="font-mono text-sm p-3" style={{ background: T.bgElev, color: T.text, border: `1px solid ${T.line}` }}>{component.sku}</div>
              {component.quantity && <div className="font-mono text-xs mt-2" style={{ color: T.textSoft }}>{component.quantity}</div>}
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: T.textFade }}>Monthly cost (model estimate)</div>
              <div className="font-display text-3xl" style={{ color, fontWeight: 400 }}>${component.monthlyUsd?.toLocaleString() || "—"}</div>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: T.textFade }}>Purpose</div>
              <p className="text-sm leading-relaxed" style={{ color: T.text }}>{component.purpose}</p>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: T.textFade }}>Rationale</div>
              <p className="text-sm leading-relaxed" style={{ color: T.textSoft }}>{component.rationale}</p>
            </div>

            {/* Azure Retail Prices verification */}
            {canCheckAzure && (
              <div className="pt-4 border-t" style={{ borderColor: T.line }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: T.textFade }}>Azure Retail Prices (live)</div>
                  <button onClick={checkPricing} disabled={pricingLoading}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ background: T.blue, color: T.bg }}>
                    {pricingLoading ? <Loader2 size={12} className="animate-spin" /> : <DollarSign size={12} />}
                    {pricingLoading ? "Fetching" : "Verify"}
                  </button>
                </div>
                {pricingError && (
                  <div className="p-3 text-xs" style={{ background: T.amberBg, color: T.amber, border: `1px solid ${T.amber}30` }}>
                    {pricingError}
                  </div>
                )}
                {pricingData && pricingData.items.length > 0 && (
                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                    <div className="text-[10px] font-mono" style={{ color: T.textFade }}>
                      {pricingData.count} matches · region {pricingData.region}
                    </div>
                    {pricingData.items.slice(0, 8).map((p, i) => (
                      <div key={i} className="p-2.5 text-xs" style={{ background: T.bgElev, border: `1px solid ${T.line}` }}>
                        <div className="font-medium mb-0.5" style={{ color: T.text }}>{p.skuName || p.meterName}</div>
                        <div className="font-mono text-[10px]" style={{ color: T.textFade }}>{p.productName}</div>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="font-mono text-xs" style={{ color: T.green }}>${p.retailPrice}</span>
                          <span className="font-mono text-[10px]" style={{ color: T.textFade }}>{p.unitOfMeasure}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-start gap-2 mt-2 text-[10px] leading-relaxed" style={{ color: T.textFade }}>
                      <Info size={10} className="mt-0.5 flex-shrink-0" />
                      <span>Unit prices above (per hour/GB/request). Multiply by usage to compare against the model's monthly estimate.</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* Infer Azure service name from component name if not provided */
function inferAzureServiceName(c) {
  const n = c.name.toLowerCase();
  if (n.includes("front door")) return "Azure Front Door";
  if (n.includes("application gateway")) return "Application Gateway";
  if (n.includes("app service") || n.includes("web app")) return "Azure App Service";
  if (n.includes("aks") || n.includes("kubernetes")) return "Azure Kubernetes Service";
  if (n.includes("container app")) return "Container Apps";
  if (n.includes("function")) return "Functions";
  if (n.includes("virtual machine") || n.includes(" vm")) return "Virtual Machines";
  if (n.includes("cosmos")) return "Azure Cosmos DB";
  if (n.includes("sql")) return "SQL Database";
  if (n.includes("postgres")) return "Azure Database for PostgreSQL";
  if (n.includes("redis") || n.includes("cache")) return "Redis Cache";
  if (n.includes("storage") || n.includes("blob")) return "Storage";
  if (n.includes("service bus")) return "Service Bus";
  if (n.includes("event hub")) return "Event Hubs";
  if (n.includes("api management")) return "API Management";
  if (n.includes("key vault")) return "Key Vault";
  if (n.includes("monitor") || n.includes("log analytics") || n.includes("insight")) return "Log Analytics";
  if (n.includes("sentinel")) return "Microsoft Sentinel";
  return c.name.replace(/\b(Azure|Microsoft)\b/gi, "").trim();
}

function extractSkuHint(sku) {
  if (!sku) return undefined;
  // Extract first token that looks like a SKU code (e.g. "P1v3", "D4s_v5", "BC_Gen5")
  const m = sku.match(/\b([A-Z][A-Za-z0-9_]+(?:_v\d+)?)\b/);
  return m ? m[1] : undefined;
}

/* ═════════════════════════════════════════════════════════════
   BOM TABLE
═════════════════════════════════════════════════════════════ */
export const BoMTable = ({ design }) => {
  const rows = design.tiers.flatMap(t => t.components.map(c => ({ ...c, tier: t.name })));
  return (
    <section className="mb-10 slide-up">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: T.textFade }}>Bill of materials</div>
          <h3 className="font-display text-2xl" style={{ color: T.text, fontWeight: 500 }}>What it costs</h3>
        </div>
      </div>
      <div style={{ background: T.bgElev, border: `1px solid ${T.line}` }}>
        <div className="grid grid-cols-[1.2fr_1.5fr_1.8fr_120px] gap-4 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.15em] border-b" style={{ color: T.textFade, borderColor: T.line }}>
          <div>Tier · Service</div><div>SKU</div><div>Purpose</div><div className="text-right">Monthly USD</div>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1.2fr_1.5fr_1.8fr_120px] gap-4 px-5 py-3 border-b text-sm items-start" style={{ borderColor: T.lineSoft }}>
            <div>
              <div style={{ color: T.text }}>{r.name}</div>
              <div className="font-mono text-[10px] mt-0.5" style={{ color: T.textFade }}>{r.tier}</div>
            </div>
            <div className="font-mono text-xs" style={{ color: T.textSoft }}>{r.sku}</div>
            <div style={{ color: T.textSoft }}>{r.purpose}</div>
            <div className="font-mono text-right" style={{ color: T.text }}>${r.monthlyUsd?.toLocaleString() || "—"}</div>
          </div>
        ))}
        <div className="grid grid-cols-[1.2fr_1.5fr_1.8fr_120px] gap-4 px-5 py-4 text-sm items-baseline" style={{ background: T.bgElev2 }}>
          <div className="font-display font-semibold" style={{ color: T.text }}>Total</div>
          <div /><div />
          <div className="font-display text-xl text-right" style={{ color: T.blue, fontWeight: 500 }}>${design.totalMonthlyUsd.toLocaleString()}</div>
        </div>
      </div>
      {design.pricingNote && (
        <div className="flex items-start gap-2 mt-3 text-xs" style={{ color: T.textFade }}>
          <Info size={12} className="mt-0.5 flex-shrink-0" /><span>{design.pricingNote}</span>
        </div>
      )}
    </section>
  );
};

/* ═════════════════════════════════════════════════════════════
   COMPLIANCE + NFR GRID
═════════════════════════════════════════════════════════════ */
export const ComplianceGrid = ({ design }) => (
  <section className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-5 slide-up">
    <div>
      <div className="mb-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: T.textFade }}>Compliance coverage</div>
        <h3 className="font-display text-2xl" style={{ color: T.text, fontWeight: 500 }}>How we meet the rules</h3>
      </div>
      <div className="space-y-2">
        {design.compliance.map((c, i) => {
          const m = COVERAGE[c.coverage] || COVERAGE.partial;
          return (
            <div key={i} className="p-4" style={{ background: T.bgElev, border: `1px solid ${T.line}` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-display text-base font-medium" style={{ color: T.text }}>{c.requirement}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5" style={{ color: m.color, background: m.bg }}>{m.label}</div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: T.textSoft }}>{c.how}</p>
            </div>
          );
        })}
      </div>
    </div>
    <div>
      <div className="mb-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: T.textFade }}>Non-functional</div>
        <h3 className="font-display text-2xl" style={{ color: T.text, fontWeight: 500 }}>Quality targets</h3>
      </div>
      <div className="space-y-2">
        {design.nonFunctional.map((n, i) => (
          <div key={i} className="p-4" style={{ background: T.bgElev, border: `1px solid ${T.line}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-display text-base font-medium" style={{ color: T.text }}>{n.aspect}</div>
              <div className="font-mono text-xs" style={{ color: T.cyan }}>{n.target}</div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: T.textSoft }}>{n.how}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ═════════════════════════════════════════════════════════════
   TRADE-OFFS, ASSUMPTIONS, NEXT QUESTIONS
═════════════════════════════════════════════════════════════ */
export const Tradeoffs = ({ design }) => (
  <section className="mb-10 slide-up">
    <div className="mb-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: T.textFade }}>Design decisions</div>
      <h3 className="font-display text-2xl" style={{ color: T.text, fontWeight: 500 }}>Trade-offs we made</h3>
    </div>
    <div className="space-y-2">
      {design.tradeoffs.map((t, i) => (
        <div key={i} className="p-4 flex gap-4 items-start" style={{ background: T.bgElev, border: `1px solid ${T.line}` }}>
          <div className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 flex-shrink-0" style={{ color: T.purple, background: T.purpleBg }}>{String(i + 1).padStart(2, "0")}</div>
          <div className="flex-1">
            <div className="font-display text-sm mb-1" style={{ color: T.text }}>
              Chose <span style={{ color: T.blue, fontWeight: 600 }}>{t.chose}</span> over <span style={{ color: T.textFade }}>{t.over}</span>
            </div>
            <p className="text-sm leading-relaxed mb-2" style={{ color: T.textSoft }}>{t.because}</p>
            {t.revisitIf && (
              <div className="text-xs italic flex items-start gap-2" style={{ color: T.textFade }}>
                <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: T.amber }}>Revisit if:</span>
                <span>{t.revisitIf}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </section>
);

export const AssumptionsRisks = ({ design }) => (
  <section className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-5 slide-up">
    <div>
      <div className="mb-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: T.textFade }}>We assumed</div>
        <h3 className="font-display text-xl" style={{ color: T.text, fontWeight: 500 }}>Assumptions</h3>
      </div>
      <ul className="space-y-2">
        {design.assumptions.map((a, i) => (
          <li key={i} className="flex items-start gap-3 p-3 text-sm leading-relaxed" style={{ background: T.bgElev, border: `1px solid ${T.line}`, color: T.textSoft }}>
            <span className="font-mono text-[10px] pt-0.5" style={{ color: T.blue }}>→</span><span>{a}</span>
          </li>
        ))}
      </ul>
    </div>
    <div>
      <div className="mb-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: T.textFade }}>Watch for</div>
        <h3 className="font-display text-xl" style={{ color: T.text, fontWeight: 500 }}>Risks</h3>
      </div>
      <ul className="space-y-2">
        {design.risks.map((r, i) => (
          <li key={i} className="flex items-start gap-3 p-3 text-sm leading-relaxed" style={{ background: T.bgElev, border: `1px solid ${T.line}`, color: T.textSoft }}>
            <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" style={{ color: T.amber }} /><span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export const NextQuestions = ({ design }) => (
  <section className="mb-10 slide-up">
    <div className="mb-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: T.textFade }}>Before the next customer meeting</div>
      <h3 className="font-display text-2xl" style={{ color: T.text, fontWeight: 500 }}>Questions to pressure-test</h3>
    </div>
    <ol className="space-y-2">
      {design.nextQuestions.map((q, i) => (
        <li key={i} className="flex items-start gap-4 p-4" style={{ background: T.bgElev, border: `1px solid ${T.line}` }}>
          <div className="font-display text-lg flex-shrink-0" style={{ color: T.blue, fontWeight: 300, letterSpacing: "-0.02em" }}>{String(i + 1).padStart(2, "0")}</div>
          <div className="text-sm leading-relaxed pt-1" style={{ color: T.text }}>{q}</div>
        </li>
      ))}
    </ol>
  </section>
);

/* ═════════════════════════════════════════════════════════════
   TIERS COMPARISON VIEW (alternative-tiers mode)
═════════════════════════════════════════════════════════════ */
export const TiersComparisonView = ({ results, onSelectDesign, activeTier }) => {
  return (
    <section className="mb-10 slide-up">
      <div className="mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: T.textFade }}>Three designs · pick the tier that fits</div>
        <h2 className="font-display text-3xl" style={{ color: T.text, fontWeight: 500 }}>Side-by-side</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {results.map(r => {
          const tierMeta = TIERS.find(t => t.id === r.tierId);
          const d = r.design;
          const isActive = activeTier === r.tierId;

          if (!d) {
            return (
              <div key={r.tierId} className="p-6 text-center" style={{ background: T.bgElev, border: `1px dashed ${T.red}`, borderRadius: 0 }}>
                <div className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: tierMeta.color }}>{tierMeta.label}</div>
                <CircleAlert size={24} style={{ color: T.red }} className="mx-auto mb-2" />
                <div className="text-xs" style={{ color: T.textFade }}>{r.error}</div>
              </div>
            );
          }

          return (
            <button key={r.tierId} onClick={() => onSelectDesign(r.tierId)}
              className="text-left p-5 transition-all cursor-pointer"
              style={{
                background: isActive ? T.bgElev2 : T.bgElev,
                border: `2px solid ${isActive ? tierMeta.color : T.line}`,
              }}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: tierMeta.color }}>{tierMeta.label}</div>
                {isActive && <Check size={14} style={{ color: tierMeta.color }} />}
              </div>
              <div className="font-display text-4xl mb-1" style={{ color: T.text, fontWeight: 400 }}>
                ${d.totalMonthlyUsd.toLocaleString()}
                <span className="text-sm font-mono ml-1" style={{ color: T.textFade }}>/mo</span>
              </div>
              <div className="text-xs mb-4" style={{ color: T.textSoft }}>{tierMeta.subtitle}</div>

              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-xs">
                  <span style={{ color: T.textFade }}>Feasibility</span>
                  <span style={{ color: FEASIBILITY[d.feasibility]?.color || T.text }}>
                    {FEASIBILITY[d.feasibility]?.label || d.feasibility}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: T.textFade }}>Components</span>
                  <span className="font-mono" style={{ color: T.text }}>
                    {d.tiers.reduce((s, t) => s + t.components.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: T.textFade }}>Budget fit</span>
                  <span className="font-mono" style={{ color: d.budgetFit === "within" ? T.green : d.budgetFit === "over" ? T.red : T.amber }}>
                    {d.budgetFit}
                  </span>
                </div>
              </div>
              <p className="text-xs leading-relaxed line-clamp-3" style={{ color: T.textSoft }}>{d.summary}</p>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1" style={{ color: isActive ? tierMeta.color : T.textFade }}>
                {isActive ? "Viewing below" : "Click to view"} <ArrowRight size={10} />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

/* ═════════════════════════════════════════════════════════════
   CONSENSUS VIEW (multi-model mode)
═════════════════════════════════════════════════════════════ */
export const ConsensusView = ({ consensus, activeModel, onSelectModel }) => {
  if (!consensus) return null;
  const { designs, agreements, partial, uniques, cost, feasibilityAgreed, feasibilities } = consensus;

  return (
    <section className="mb-10 slide-up">
      <div className="mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: T.textFade }}>Three models · same requirement</div>
        <h2 className="font-display text-3xl" style={{ color: T.text, fontWeight: 500 }}>Where they agree · where they disagree</h2>
      </div>

      {/* Model selection tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        {designs.map((d) => {
          const isActive = activeModel === d._modelLabel;
          return (
            <button key={d._modelLabel} onClick={() => onSelectModel(d._modelLabel)}
              className="text-left p-4 transition-all"
              style={{ background: isActive ? T.bgElev2 : T.bgElev, border: `2px solid ${isActive ? T.blue : T.line}` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: T.blue }}>
                  {MODELS.find(m => m.id === d._modelLabel)?.short || d._modelLabel}
                </div>
                {isActive && <Check size={14} style={{ color: T.blue }} />}
              </div>
              <div className="font-display text-3xl" style={{ color: T.text, fontWeight: 400 }}>
                ${d.totalMonthlyUsd.toLocaleString()}
              </div>
              <div className="text-xs mt-1" style={{ color: FEASIBILITY[d.feasibility]?.color || T.textFade }}>
                {FEASIBILITY[d.feasibility]?.label || d.feasibility}
              </div>
            </button>
          );
        })}
      </div>

      {/* Diff summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4" style={{ background: T.bgElev, border: `1px solid ${T.line}` }}>
          <div className="flex items-center gap-2 mb-3">
            <Equal size={14} style={{ color: T.green }} />
            <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: T.green }}>All agreed</div>
          </div>
          <div className="font-display text-2xl mb-1" style={{ color: T.text }}>{agreements.length}</div>
          <div className="text-xs" style={{ color: T.textFade }}>services picked by every model</div>
        </div>
        <div className="p-4" style={{ background: T.bgElev, border: `1px solid ${T.line}` }}>
          <div className="flex items-center gap-2 mb-3">
            <GitCompareArrows size={14} style={{ color: T.amber }} />
            <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: T.amber }}>Partial agreement</div>
          </div>
          <div className="font-display text-2xl mb-1" style={{ color: T.text }}>{partial.length}</div>
          <div className="text-xs" style={{ color: T.textFade }}>picked by 2 of 3 models</div>
        </div>
        <div className="p-4" style={{ background: T.bgElev, border: `1px solid ${T.line}` }}>
          <div className="flex items-center gap-2 mb-3">
            {cost.spreadPct > 30 ? <TrendingUp size={14} style={{ color: T.red }} /> : <TrendingDown size={14} style={{ color: T.green }} />}
            <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: cost.spreadPct > 30 ? T.red : T.green }}>Cost spread</div>
          </div>
          <div className="font-display text-2xl mb-1" style={{ color: T.text }}>{cost.spreadPct}%</div>
          <div className="text-xs" style={{ color: T.textFade }}>
            ${cost.low.total.toLocaleString()} → ${cost.high.total.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Agreement details */}
      {(partial.length > 0 || uniques.length > 0) && (
        <div className="p-5" style={{ background: T.bgElev, border: `1px solid ${T.line}` }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-4" style={{ color: T.textFade }}>
            Disagreements — where the architect should think harder
          </div>

          {partial.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <GitCompareArrows size={12} style={{ color: T.amber }} />
                <span className="font-mono text-xs uppercase tracking-wider" style={{ color: T.amber }}>2-of-3 agreement</span>
              </div>
              <div className="space-y-1.5">
                {partial.slice(0, 6).map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 text-sm" style={{ background: T.bg, border: `1px solid ${T.lineSoft}` }}>
                    <span style={{ color: T.text }}>{p.displayName}</span>
                    <span className="font-mono text-[10px]" style={{ color: T.textFade }}>
                      {[...p.models].map(m => MODELS.find(mm => mm.id === m)?.short || m).join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uniques.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={12} style={{ color: T.purple }} />
                <span className="font-mono text-xs uppercase tracking-wider" style={{ color: T.purple }}>Unique to one model</span>
              </div>
              <div className="space-y-1.5">
                {uniques.slice(0, 6).map((u, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 text-sm" style={{ background: T.bg, border: `1px solid ${T.lineSoft}` }}>
                    <span style={{ color: T.text }}>{u.displayName}</span>
                    <span className="font-mono text-[10px]" style={{ color: T.textFade }}>
                      {[...u.models].map(m => MODELS.find(mm => mm.id === m)?.short || m).join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

/* ═════════════════════════════════════════════════════════════
   RESULT FOOTER
═════════════════════════════════════════════════════════════ */
export const ResultFooter = ({ design }) => (
  <div className="mt-12 pt-6 border-t flex items-center justify-between text-xs font-mono flex-wrap gap-3" style={{ borderColor: T.line, color: T.textFade }}>
    <span>Arch Sidekick · {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
    <div className="flex items-center gap-4">
      {design._usage && <span>{design._usage.total_tokens?.toLocaleString()} tokens</span>}
      <span style={{ color: T.blue }}>{design._model}</span>
      <span>· {design._platform}</span>
    </div>
  </div>
);
