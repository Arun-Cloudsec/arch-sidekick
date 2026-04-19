import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, X, CornerDownLeft, RefreshCw, MessageCircle, Check } from "lucide-react";
import { T, MODELS } from "./theme.js";
import { refineDesign } from "./api.js";

/* ─────────────────────── Quick-pick refinement suggestions ─────────────────────── */
const QUICK_PROMPTS = [
  { label: "Cut cost 30%",      prompt: "Reduce the total monthly cost by about 30% while preserving core functionality. Explain what you're trading off." },
  { label: "Drop DR region",    prompt: "Remove multi-region DR. Re-size for single-region operation. Note what SLA we'd lose." },
  { label: "Add active-active", prompt: "Upgrade to multi-region active-active deployment. What changes and what does it cost?" },
  { label: "Explain compute",   prompt: "Why did you pick this compute tier? What were the alternatives?" },
  { label: "Explain data",      prompt: "Why this database/storage choice? What would push me toward a different one?" },
  { label: "Swap to serverless",prompt: "Refactor the compute layer to fully serverless (Functions / Lambda / Cloud Run). Show the new architecture and cost." },
];

/* ─────────────────────── Refine Chat Panel ─────────────────────── */
export const RefineChat = ({ design, platform, model, onClose, onDesignUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages, loading]);

  const send = async (messageText) => {
    const text = (messageText ?? input).trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text, id: Date.now() };
    const history = messages;
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const { prose, updatedDesign } = await refineDesign({
        design, history, userMessage: text, platform, model,
      });

      const assistantMsg = {
        role: "assistant",
        content: prose,
        id: Date.now() + 1,
        designUpdated: Boolean(updatedDesign),
      };
      setMessages(m => [...m, assistantMsg]);

      if (updatedDesign) {
        onDesignUpdate(updatedDesign);
      }
    } catch (e) {
      setError(e.message || "Failed to refine. Try again.");
      // Remove the user message so they can retry
      setMessages(m => m.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const onSubmit = (e) => { e?.preventDefault?.(); send(); };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end no-print"
      style={{ background: "rgba(11,14,20,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-xl h-full flex flex-col slide-up"
        style={{ background: T.bg, borderLeft: `1px solid ${T.line}` }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: T.line }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center" style={{ background: T.cyan, color: T.bg }}>
              <MessageCircle size={16} />
            </div>
            <div>
              <div className="font-display text-lg leading-none" style={{ color: T.text, fontWeight: 500 }}>Refine</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mt-1" style={{ color: T.textFade }}>
                {MODELS.find(m => m.id === model)?.short || model} · {platform}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: T.textFade }}><X size={18} /></button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="fade-in">
              <div className="font-display text-2xl leading-tight mb-3" style={{ color: T.text, fontWeight: 400 }}>
                Ask anything about the design.
                <span style={{ color: T.textFade }}> Or just tell me what to change.</span>
              </div>
              <p className="text-sm mb-6" style={{ color: T.textSoft }}>
                Modification requests produce an updated design below — the dashboard will refresh automatically. Questions produce an explanation only.
              </p>

              <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: T.textFade }}>Quick prompts</div>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((qp, i) => (
                  <button key={i} onClick={() => send(qp.prompt)}
                    disabled={loading}
                    className="text-left p-3 transition-colors disabled:opacity-50"
                    style={{ background: T.bgElev, border: `1px solid ${T.line}` }}
                    onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = T.cyan; } }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.line; }}>
                    <div className="flex items-start gap-2">
                      <Sparkles size={10} className="mt-1 flex-shrink-0" style={{ color: T.cyan }} />
                      <div>
                        <div className="text-xs font-medium mb-0.5" style={{ color: T.text }}>{qp.label}</div>
                        <div className="text-[10px] leading-snug line-clamp-2" style={{ color: T.textSoft }}>{qp.prompt}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(m => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-sm fade-in" style={{ color: T.textFade }}>
              <Loader2 size={14} className="animate-spin" style={{ color: T.cyan }} />
              <span className="font-mono text-xs">Thinking about the change…</span>
            </div>
          )}

          {error && (
            <div className="p-3 text-sm" style={{ background: T.redBg, color: T.red, border: `1px solid ${T.red}30` }}>
              {error}
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={onSubmit} className="p-5 border-t" style={{ borderColor: T.line }}>
          <div className="relative">
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder="Ask or instruct…   (↵ to send · shift+↵ for newline)"
              rows={3}
              disabled={loading}
              className="w-full p-3 pr-12 text-sm outline-none transition-colors disabled:opacity-50"
              style={{ background: T.bgElev, border: `1px solid ${input ? T.cyan : T.line}`, color: T.text, fontFamily: "Geist, sans-serif" }} />
            <button type="submit" disabled={!input.trim() || loading}
              className="absolute bottom-3 right-3 p-2 transition-opacity disabled:opacity-30"
              style={{ background: input.trim() ? T.cyan : T.line, color: T.bg }}>
              <Send size={14} />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] font-mono" style={{ color: T.textFade }}>
            <span>{messages.length} message{messages.length === 1 ? "" : "s"}</span>
            <span>↵ send · shift+↵ newline</span>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────── Message bubble ─────────────────────── */
const MessageBubble = ({ message }) => {
  const isUser = message.role === "user";
  return (
    <div className="fade-in">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1.5" style={{ color: isUser ? T.textFade : T.cyan }}>
        {isUser ? "Architect" : "AI Architect"}
      </div>
      <div className="p-4 text-sm leading-relaxed whitespace-pre-wrap"
        style={{
          background: isUser ? T.bgElev : T.bgElev2,
          border: `1px solid ${isUser ? T.line : T.cyan}40`,
          color: T.text,
        }}>
        {message.content}
      </div>
      {message.designUpdated && (
        <div className="flex items-center gap-2 mt-2 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider inline-flex"
          style={{ background: T.greenBg, color: T.green, border: `1px solid ${T.green}40` }}>
          <Check size={10} />
          Design updated — see dashboard
        </div>
      )}
    </div>
  );
};
