import { useState, useMemo } from "react";
import { T, PLATFORMS, MODELS, MODES, TIERS, CONSENSUS_MODELS } from "./theme.js";
import { generateSingleDesign, generateTierDesigns, generateConsensusDesigns, analyseConsensus } from "./api.js";
import { exportBoMExcel, exportDesignPpt } from "./exports.js";
import {
  Header, IntakeView, AnalysingView,
  FeasibilityBanner, BudgetMeter, RequirementChips, ArchitectureDiagram, ServiceDetail,
  BoMTable, ComplianceGrid, Tradeoffs, AssumptionsRisks, NextQuestions, ResultFooter,
  TiersComparisonView, ConsensusView,
} from "./components.jsx";
import { RefineChat } from "./refine.jsx";

export default function App() {
  /* ─────────── Core state ─────────── */
  const [view, setView] = useState("intake"); // intake | analysing | result
  const [platform, setPlatform] = useState("Azure");
  const [model, setModel] = useState(MODELS[0].id);
  const [mode, setMode] = useState("single"); // single | tiers | consensus
  const [error, setError] = useState("");

  /* ─────────── Result state (varies by mode) ─────────── */
  const [singleDesign, setSingleDesign] = useState(null);       // single mode
  const [tierResults, setTierResults] = useState(null);         // tiers mode: [{tierId, design}]
  const [activeTier, setActiveTier] = useState("balanced");     // which tier is "selected" for display
  const [consensusResults, setConsensusResults] = useState(null); // consensus mode: [{model, design}]
  const [activeConsensusModel, setActiveConsensusModel] = useState(null);

  /* ─────────── UI state ─────────── */
  const [taskProgress, setTaskProgress] = useState({});
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [refineOpen, setRefineOpen] = useState(false);

  /* ─────────── Active design resolution ─────────── */
  const activeDesign = useMemo(() => {
    if (mode === "single") return singleDesign;
    if (mode === "tiers" && tierResults) {
      return tierResults.find(r => r.tierId === activeTier)?.design || null;
    }
    if (mode === "consensus" && consensusResults) {
      return consensusResults.find(r => r.model === activeConsensusModel)?.design || null;
    }
    return null;
  }, [mode, singleDesign, tierResults, activeTier, consensusResults, activeConsensusModel]);

  /* ─────────── Consensus analysis ─────────── */
  const consensus = useMemo(() => {
    return mode === "consensus" && consensusResults ? analyseConsensus(consensusResults) : null;
  }, [mode, consensusResults]);

  /* ─────────── Generate handler ─────────── */
  const onGenerate = async (freeText, structured) => {
    setError("");
    setView("analysing");
    setSingleDesign(null);
    setTierResults(null);
    setConsensusResults(null);
    setTaskProgress({});

    try {
      if (mode === "single") {
        const design = await generateSingleDesign({ freeText, structured, platform, model });
        setSingleDesign(design);
      } else if (mode === "tiers") {
        const initialProgress = {};
        TIERS.forEach(t => { initialProgress[t.id] = "running"; });
        setTaskProgress(initialProgress);

        const results = await generateTierDesigns({
          freeText, structured, platform, model,
          onProgress: (id, status) => setTaskProgress(p => ({ ...p, [id]: status })),
        });
        setTierResults(results);
        // Default to balanced tier, fall back to first successful
        const balanced = results.find(r => r.tierId === "balanced" && r.design);
        setActiveTier(balanced ? "balanced" : results.find(r => r.design)?.tierId);
      } else if (mode === "consensus") {
        const initialProgress = {};
        CONSENSUS_MODELS.forEach(m => { initialProgress[m] = "running"; });
        setTaskProgress(initialProgress);

        const results = await generateConsensusDesigns({
          freeText, structured, platform,
          onProgress: (id, status) => setTaskProgress(p => ({ ...p, [id]: status })),
        });
        setConsensusResults(results);
        setActiveConsensusModel(results.find(r => r.design)?.model);
      }
      setView("result");
      window.scrollTo(0, 0);
    } catch (e) {
      console.error(e);
      setError(e.message || "Generation failed. Try again.");
      setView("intake");
    }
  };

  /* ─────────── Handlers ─────────── */
  const onReset = () => {
    setView("intake");
    setSingleDesign(null); setTierResults(null); setConsensusResults(null);
    setActiveTier("balanced"); setActiveConsensusModel(null);
    setError(""); setSelectedComponent(null); setRefineOpen(false); setTaskProgress({});
  };

  const onExportExcel = () => activeDesign && exportBoMExcel(activeDesign);
  const onExportPpt = async () => {
    if (!activeDesign) return;
    try { await exportDesignPpt(activeDesign); }
    catch (e) { console.error(e); alert("PowerPoint export failed: " + e.message); }
  };
  const onPrint = () => window.print();

  /* ─────────── Refinement: apply updated design ─────────── */
  const onDesignUpdate = (updatedDesign) => {
    // Apply the update back to whatever the active design was
    if (mode === "single") {
      setSingleDesign(updatedDesign);
    } else if (mode === "tiers") {
      setTierResults(tierResults.map(r =>
        r.tierId === activeTier ? { ...r, design: updatedDesign } : r
      ));
    } else if (mode === "consensus") {
      setConsensusResults(consensusResults.map(r =>
        r.model === activeConsensusModel ? { ...r, design: updatedDesign } : r
      ));
    }
  };

  /* ─────────── Render ─────────── */
  const hasResult = view === "result" && activeDesign;

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.text }}>
      <Header
        platform={platform} setPlatform={setPlatform}
        model={model} setModel={setModel}
        hasResult={hasResult}
        onReset={onReset}
        onExportExcel={onExportExcel}
        onExportPpt={onExportPpt}
        onPrint={onPrint}
        onRefineToggle={() => setRefineOpen(true)}
      />

      {view === "intake" && (
        <IntakeView
          onGenerate={onGenerate} error={error}
          platform={platform} mode={mode} setMode={setMode} model={model}
        />
      )}

      {view === "analysing" && (
        <AnalysingView mode={mode} platform={platform} taskProgress={taskProgress} />
      )}

      {view === "result" && (
        <main className="max-w-[1500px] mx-auto px-6 py-10">
          {/* Mode-specific top section */}
          {mode === "tiers" && tierResults && (
            <TiersComparisonView
              results={tierResults}
              activeTier={activeTier}
              onSelectDesign={setActiveTier}
            />
          )}

          {mode === "consensus" && consensus && (
            <ConsensusView
              consensus={consensus}
              activeModel={activeConsensusModel}
              onSelectModel={setActiveConsensusModel}
            />
          )}

          {/* The actual design detail view (works for all three modes — just renders the active one) */}
          {activeDesign && (
            <>
              <FeasibilityBanner design={activeDesign} />
              <BudgetMeter design={activeDesign} />
              <RequirementChips req={activeDesign.parsedRequirements} />
              <ArchitectureDiagram design={activeDesign} onSelect={setSelectedComponent} />
              <BoMTable design={activeDesign} />
              <ComplianceGrid design={activeDesign} />
              <Tradeoffs design={activeDesign} />
              <AssumptionsRisks design={activeDesign} />
              <NextQuestions design={activeDesign} />
              <ResultFooter design={activeDesign} />
            </>
          )}
        </main>
      )}

      {selectedComponent && (
        <ServiceDetail
          component={selectedComponent}
          platform={platform}
          onClose={() => setSelectedComponent(null)}
        />
      )}

      {refineOpen && activeDesign && (
        <RefineChat
          design={activeDesign}
          platform={platform}
          model={model}
          onClose={() => setRefineOpen(false)}
          onDesignUpdate={onDesignUpdate}
        />
      )}
    </div>
  );
}
