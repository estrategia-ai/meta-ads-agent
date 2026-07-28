import { useState, useRef, useEffect } from "react";
import {
  Rocket,
  ClipboardList,
  TrendingUp,
  ShieldCheck,
  Eye,
  FileText,
  Calculator,
  Lightbulb,
  CalendarDays,
  Paperclip,
  ArrowUp,
  Circle,
} from "lucide-react";

function renderInlineMarkdown(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function extractText(contentBlocks) {
  return contentBlocks
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n\n");
}

function extractToolCalls(data) {
  if (Array.isArray(data.toolCallsLog) && data.toolCallsLog.length > 0) {
    return data.toolCallsLog;
  }
  return [];
}

function extractSuggestions(text) {
  const match = text.match(/```suggestions\n([\s\S]*?)```/);
  if (!match) return { clean: text, suggestions: [] };
  const clean = text.replace(match[0], "").trim();
  const suggestions = match[1]
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return { clean, suggestions };
}

function extractDownloadable(text) {
  const match = text.match(/```(html|markdown|md)\n([\s\S]*?)```/);
  if (!match) return null;
  const ext = match[1] === "html" ? "html" : "md";
  return { ext, content: match[2] };
}

function downloadFile(content, ext) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reporte.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function buildActions(account) {
  const idNum = account ? account.id.replace("act_", "") : null;
  const accLabel = account ? `${account.name} (ID: ${idNum})` : null;

  return [
    {
      label: "Crear campaña",
      desc: "Arma y lanza una campaña pausada",
      icon: Rocket,
      skillId: "ejecutor-campanas-meta",
      text: account ? `Quiero crear una campaña nueva en la cuenta ${accLabel}.` : "Quiero crear una campaña nueva.",
    },
    {
      label: "Ver campañas",
      desc: "Estado actual de la cuenta",
      icon: ClipboardList,
      skillId: null,
      text: account ? `Muéstrame las campañas de la cuenta ${accLabel}.` : "Muéstrame mis campañas.",
    },
    {
      label: "Resumen 7 días",
      desc: "Cómo va el rendimiento",
      icon: TrendingUp,
      skillId: null,
      text: account
        ? `Dame un resumen de rendimiento de los últimos 7 días de la cuenta ${accLabel}.`
        : "Dame un resumen de rendimiento de los últimos 7 días.",
    },
    {
      label: "Auditar cuenta",
      desc: "Detecta problemas de estructura",
      icon: ShieldCheck,
      skillId: "auditor-cuenta",
      text: account ? `Audita la cuenta ${accLabel}.` : "Audita mi cuenta.",
    },
    {
      label: "Espiar competencia",
      desc: "Qué anuncia el mercado",
      icon: Eye,
      skillId: "espia-competencia",
      text: account
        ? `Espía qué está anunciando la competencia en el nicho de la cuenta ${accLabel}.`
        : "Espía qué está anunciando la competencia en mi nicho.",
    },
    {
      label: "Armar estrategia",
      desc: "Estructura de campañas nueva",
      icon: FileText,
      skillId: "excel-de-estrategia",
      text: "Ayúdame a armar una estrategia de campañas nueva.",
    },
    {
      label: "LTV vs CAC",
      desc: "Rentabilidad real del cliente",
      icon: Calculator,
      skillId: "calculadora-ltv-cac",
      text: "Ayúdame a calcular mi LTV contra mi CAC.",
    },
    {
      label: "Generar hooks",
      desc: "Ángulos de copy nuevos",
      icon: Lightbulb,
      skillId: "generador-hooks",
      text: "Dame ideas de hooks para un anuncio nuevo.",
    },
  ];
}

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [metaConnected, setMetaConnected] = useState(false);
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    setMetaConnected(document.cookie.includes("meta_connected=1"));
  }, []);

  useEffect(() => {
    if (!metaConnected) return;
    setOverviewLoading(true);
    setOverviewError(null);
    fetch("/api/meta/overview")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setOverviewError(typeof data.error === "string" ? data.error : "No se pudo cargar el resumen de cuentas.");
          setOverview(null);
          return;
        }
        setOverview(data);
        const allAccs = Object.values(data.businesses || {}).flat();
        if (allAccs.length > 0) setSelectedAccountId(allAccs[0].id);
      })
      .catch(() => setOverviewError("No se pudo conectar con el servidor para traer tus cuentas."))
      .finally(() => setOverviewLoading(false));
  }, [metaConnected]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(overrideText, overrideSkillId) {
    const textToSend = overrideText !== undefined ? overrideText : input;
    if ((!textToSend.trim() && !file) || loading) return;

    const newMessages = [...messages, { role: "user", content: textToSend || `[archivo: ${file?.name}]` }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    let attachment = null;
    if (file) {
      const base64 = await fileToBase64(file);
      attachment = { mediaType: file.type || "text/csv", base64, name: file.name };
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          attachment,
          skill_id: overrideSkillId || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
        setLoading(false);
        return;
      }

      const toolCalls = extractToolCalls(data);
      const rawText = extractText(data.content);
      const { clean, suggestions } = extractSuggestions(rawText);
      const downloadable = extractDownloadable(clean);

      setMessages([...newMessages, { role: "assistant", content: clean, toolCalls, downloadable, suggestions }]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  const allAccounts = overview ? Object.values(overview.businesses).flat() : [];
  const selectedAccount = allAccounts.find((a) => a.id === selectedAccountId) || null;
  const actions = buildActions(selectedAccount);

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brandMark" />
          Agente de campañas
        </div>
        {metaConnected ? (
          <span className="statusPill statusOk">
            <Circle size={7} fill="currentColor" stroke="none" /> Conectado a Meta Ads
          </span>
        ) : (
          <a href="/api/auth/meta/login" className="connectBtn">
            Conectar con Meta
          </a>
        )}
      </header>

      {metaConnected && (
        <section className="panel">
          {overviewLoading && <p className="muted">Cargando tus cuentas...</p>}
          {overviewError && <p className="errorText">{overviewError}</p>}

          {allAccounts.length > 0 && (
            <div className="accountRow">
              {allAccounts.map((acc) => {
                const healthy = !acc.error && acc.active_campaigns > 0;
                return (
                  <button
                    key={acc.id}
                    className={`accountChip ${selectedAccountId === acc.id ? "accountChipActive" : ""}`}
                    onClick={() => setSelectedAccountId(acc.id)}
                  >
                    <span className="accountAvatar">{acc.name.slice(0, 1).toUpperCase()}</span>
                    <span className="accountInfo">
                      <span className="accountName">{acc.name}</span>
                      <span className="accountMeta">
                        <Circle size={6} fill={healthy ? "#34D399" : "#5B6274"} stroke="none" />
                        {acc.error ? "sin datos" : `${acc.active_campaigns} activas · ${acc.paused_campaigns} pausadas`}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <p className="sectionLabel">Qué quieres hacer hoy</p>
          <div className="actionGrid">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  className="actionCard"
                  disabled={loading}
                  onClick={() => sendMessage(action.text, action.skillId)}
                >
                  <span className="actionIcon">
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  <span className="actionText">
                    <span className="actionLabel">{action.label}</span>
                    <span className="actionDesc">{action.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="chatBox" ref={scrollRef}>
        {messages.length === 0 && (
          <p className="muted">Usa una tarjeta arriba, o escribe directamente lo que necesitas.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msgRow ${m.role === "user" ? "msgRowUser" : ""}`}>
            <div className={`bubble ${m.role === "user" ? "bubbleUser" : "bubbleAgent"}`}>
              <div className="bubbleText">{renderInlineMarkdown(m.content)}</div>
              {m.toolCalls && m.toolCalls.length > 0 && (
                <div className="toolTrace">{m.toolCalls.join(" · ")}</div>
              )}
              {m.downloadable && (
                <button className="downloadBtn" onClick={() => downloadFile(m.downloadable.content, m.downloadable.ext)}>
                  Descargar reporte (.{m.downloadable.ext})
                </button>
              )}
              {m.suggestions && m.suggestions.length > 0 && (
                <div className="suggestionRow">
                  {m.suggestions.map((s) => (
                    <button key={s} className="suggestionPill" disabled={loading} onClick={() => sendMessage(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <p className="muted">Pensando...</p>}
        {error && <p className="errorText">{error}</p>}
      </section>

      <div className="inputBar">
        <label className="attachBtn">
          <Paperclip size={18} strokeWidth={1.75} />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.csv,.xlsx,.pdf"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
        </label>
        <textarea
          className="textInput"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Escribe tu mensaje..."
        />
        <button className="sendBtn" onClick={() => sendMessage()} disabled={loading}>
          <ArrowUp size={18} strokeWidth={2} />
        </button>
      </div>
      {file && <p className="fileNote">Adjunto: {file.name}</p>}

      <style jsx global>{`
        html, body {
          background: #0b0d12;
          margin: 0;
        }
      `}</style>

      <style jsx>{`
        .page {
          max-width: 760px;
          margin: 0 auto;
          padding: 28px 20px 40px;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
          color: #e8eaf0;
          min-height: 100vh;
        }
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: "Space Grotesk", "Inter", sans-serif;
          font-size: 17px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .brandMark {
          width: 8px;
          height: 8px;
          border-radius: 2px;
          background: #34d399;
        }
        .statusPill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          padding: 5px 10px;
          border-radius: 20px;
        }
        .statusOk {
          color: #34d399;
          background: rgba(52, 211, 153, 0.1);
        }
        .connectBtn {
          padding: 7px 14px;
          border-radius: 8px;
          background: #1877f2;
          color: white;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
        }
        .panel {
          border: 1px solid #232837;
          border-radius: 14px;
          background: #12151c;
          padding: 18px;
          margin-bottom: 16px;
        }
        .muted {
          color: #5b6274;
          font-size: 13px;
        }
        .errorText {
          color: #f2545b;
          font-size: 13px;
        }
        .accountRow {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          margin-bottom: 18px;
        }
        .accountChip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid #232837;
          background: #171b24;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .accountChip:hover {
          border-color: #2e3542;
        }
        .accountChipActive {
          border-color: #34d399;
          background: rgba(52, 211, 153, 0.08);
        }
        .accountAvatar {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          background: #232837;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #e8eaf0;
          flex-shrink: 0;
        }
        .accountInfo {
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: left;
        }
        .accountName {
          font-size: 13px;
          font-weight: 600;
          color: #e8eaf0;
        }
        .accountMeta {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: #8991a3;
        }
        .sectionLabel {
          font-size: 12px;
          font-weight: 600;
          color: #8991a3;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0 0 10px;
        }
        .actionGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }
        .actionCard {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid #232837;
          background: #171b24;
          cursor: pointer;
          text-align: left;
          transition: border-color 0.15s ease, transform 0.1s ease;
        }
        .actionCard:hover:not(:disabled) {
          border-color: #34d399;
        }
        .actionCard:active:not(:disabled) {
          transform: scale(0.98);
        }
        .actionCard:disabled {
          opacity: 0.5;
          cursor: default;
        }
        .actionIcon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: rgba(52, 211, 153, 0.1);
          color: #34d399;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .actionText {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .actionLabel {
          font-size: 13px;
          font-weight: 600;
          color: #e8eaf0;
        }
        .actionDesc {
          font-size: 12px;
          color: #8991a3;
        }
        .chatBox {
          border: 1px solid #232837;
          border-radius: 14px;
          background: #0e1016;
          padding: 18px;
          min-height: 280px;
          max-height: 520px;
          overflow-y: auto;
          margin-bottom: 14px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .msgRow {
          display: flex;
        }
        .msgRowUser {
          justify-content: flex-end;
        }
        .bubble {
          max-width: 88%;
          border-radius: 12px;
          padding: 12px 14px;
        }
        .bubbleAgent {
          background: #171b24;
          border: 1px solid #232837;
        }
        .bubbleUser {
          background: rgba(52, 211, 153, 0.12);
          border: 1px solid rgba(52, 211, 153, 0.25);
        }
        .bubbleText {
          white-space: pre-wrap;
          font-size: 14px;
          line-height: 1.55;
          color: #e8eaf0;
        }
        .toolTrace {
          margin-top: 8px;
          font-family: "IBM Plex Mono", monospace;
          font-size: 11px;
          color: #5b6274;
        }
        .suggestionRow {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
        }
        .suggestionPill {
          padding: 6px 12px;
          border-radius: 16px;
          border: 1px solid #34d399;
          background: rgba(52, 211, 153, 0.08);
          color: #34d399;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .suggestionPill:hover:not(:disabled) {
          background: rgba(52, 211, 153, 0.18);
        }
        .downloadBtn {
          margin-top: 8px;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #232837;
          background: transparent;
          color: #e8eaf0;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .inputBar {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          border: 1px solid #232837;
          border-radius: 14px;
          background: #12151c;
          padding: 8px;
        }
        .attachBtn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          color: #8991a3;
          cursor: pointer;
          flex-shrink: 0;
        }
        .attachBtn:hover {
          background: #1a1e27;
        }
        .textInput {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          color: #e8eaf0;
          font-family: inherit;
          font-size: 14px;
          min-height: 22px;
          max-height: 120px;
          padding: 7px 4px;
        }
        .textInput::placeholder {
          color: #5b6274;
        }
        .sendBtn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          background: #34d399;
          color: #0b0d12;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }
        .sendBtn:disabled {
          opacity: 0.5;
          cursor: default;
        }
        .fileNote {
          font-size: 12px;
          color: #8991a3;
          margin-top: 6px;
        }
      `}</style>
    </div>
  );
}
