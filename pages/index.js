import { useState, useRef, useEffect } from "react";

// Convierte **negrita** a <strong> real (en vez de mostrar los asteriscos
// literales). No es un parser de Markdown completo a propósito -- solo lo
// que realmente usan las respuestas del agente.
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
    return data.toolCallsLog.map((name) => name);
  }
  return [];
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

// Pastillas de acción, mapeadas 1 a 1 con las tareas diarias de un
// trafficker. Cada una dispara la skill exacta (o ninguna, cuando es una
// consulta directa), sin adivinar por palabras clave.
function buildPills(account) {
  const idNum = account ? account.id.replace("act_", "") : null;
  const accLabel = account ? `${account.name} (ID: ${idNum})` : null;

  return [
    {
      label: "Crear campaña",
      skillId: "ejecutor-campanas-meta",
      text: account ? `Quiero crear una campaña nueva en la cuenta ${accLabel}.` : "Quiero crear una campaña nueva.",
    },
    {
      label: "Armar estrategia",
      skillId: "excel-de-estrategia",
      text: "Ayúdame a armar una estrategia de campañas nueva.",
    },
    {
      label: "Ver campañas",
      skillId: null,
      text: account ? `Muéstrame las campañas de la cuenta ${accLabel}.` : "Muéstrame mis campañas.",
    },
    {
      label: "Resumen últimos 7 días",
      skillId: null,
      text: account
        ? `Dame un resumen de rendimiento de los últimos 7 días de la cuenta ${accLabel}.`
        : "Dame un resumen de rendimiento de los últimos 7 días.",
    },
    {
      label: "Auditar cuenta",
      skillId: "auditor-cuenta",
      text: account ? `Audita la cuenta ${accLabel}.` : "Audita mi cuenta.",
    },
    {
      label: "Espiar competencia",
      skillId: "espia-competencia",
      text: account
        ? `Espía qué está anunciando la competencia en el nicho de la cuenta ${accLabel}.`
        : "Espía qué está anunciando la competencia en mi nicho.",
    },
    {
      label: "Reporte para cliente",
      skillId: "reporte-cliente",
      text: "Arma un reporte para mi cliente con los resultados recientes.",
    },
    {
      label: "Calcular LTV vs CAC",
      skillId: "calculadora-ltv-cac",
      text: "Ayúdame a calcular mi LTV contra mi CAC.",
    },
    {
      label: "Generar hooks",
      skillId: "generador-hooks",
      text: "Dame ideas de hooks para un anuncio nuevo.",
    },
    {
      label: "Calendario comercial",
      skillId: "calendario-comercial",
      text: "Ayúdame a planear mi calendario comercial de campañas.",
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
      const text = extractText(data.content);
      const downloadable = extractDownloadable(text);

      setMessages([...newMessages, { role: "assistant", content: text, toolCalls, downloadable }]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  function handlePillClick(pill) {
    sendMessage(pill.text, pill.skillId);
  }

  const allAccounts = overview ? Object.values(overview.businesses).flat() : [];
  const selectedAccount = allAccounts.find((a) => a.id === selectedAccountId) || null;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Agente de Campañas, Meta Ads</h1>
      <p style={styles.subtitle}>
        Uso personal. Administra tus cuentas de Meta Ads. Todo lo que se crea
        queda pausado hasta que tú lo actives.
      </p>

      {metaConnected ? (
        <p style={styles.metaOk}>Conectado a Meta Ads</p>
      ) : (
        <a href="/api/auth/meta/login" style={styles.metaBtn}>
          Conectar con Meta
        </a>
      )}

      {metaConnected && (
        <div style={styles.overviewBox}>
          {overviewLoading && <p style={styles.placeholder}>Cargando tus cuentas...</p>}
          {overviewError && <p style={styles.errorMsg}>{overviewError}</p>}

          {allAccounts.length > 0 && (
            <div style={styles.accountSelectorRow}>
              <span style={styles.accountSelectorLabel}>Cuenta activa:</span>
              <select
                style={styles.accountSelect}
                value={selectedAccountId || ""}
                onChange={(e) => setSelectedAccountId(e.target.value)}
              >
                {allAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                    {acc.error ? "" : ` (${acc.active_campaigns} activas, ${acc.paused_campaigns} pausadas)`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={styles.pillsLabel}>Que quieres hacer hoy</div>
          <div style={styles.pillsRow}>
            {buildPills(selectedAccount).map((pill) => (
              <button
                key={pill.label}
                style={styles.pill}
                onClick={() => handlePillClick(pill)}
                disabled={loading}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={styles.chatBox}>
        {messages.length === 0 && (
          <p style={styles.placeholder}>
            Usa una pastilla arriba, o escribe directamente lo que necesitas.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} style={m.role === "user" ? styles.userMsg : styles.botMsg}>
            <strong>{m.role === "user" ? "Tu" : "Agente"}:</strong>
            <div style={{ whiteSpace: "pre-wrap" }}>{renderInlineMarkdown(m.content)}</div>
            {m.toolCalls && m.toolCalls.length > 0 && (
              <div style={styles.toolCalls}>{m.toolCalls.join(" - ")}</div>
            )}
            {m.downloadable && (
              <button
                style={styles.downloadBtn}
                onClick={() => downloadFile(m.downloadable.content, m.downloadable.ext)}
              >
                Descargar reporte (.{m.downloadable.ext})
              </button>
            )}
          </div>
        ))}
        {loading && <p style={styles.placeholder}>Pensando...</p>}
        {error && <p style={styles.errorMsg}>{error}</p>}
      </div>

      <div style={styles.inputRow}>
        <textarea
          style={styles.textarea}
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
        <label style={styles.attachBtn}>
          +
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.csv,.xlsx,.pdf"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
        </label>
        <button style={styles.button} onClick={() => sendMessage()} disabled={loading}>
          Enviar
        </button>
      </div>
      {file && <p style={styles.fileNote}>Adjunto: {file.name}</p>}
    </div>
  );
}

const styles = {
  page: { maxWidth: 720, margin: "40px auto", fontFamily: "system-ui, sans-serif", padding: "0 16px" },
  title: { marginBottom: 4 },
  subtitle: { color: "#666", fontSize: 14, marginBottom: 16 },
  metaOk: { color: "#1a7f37", fontSize: 13, fontWeight: 700, marginBottom: 16 },
  metaBtn: {
    display: "inline-block", marginBottom: 16, padding: "8px 16px", borderRadius: 8,
    background: "#1877F2", color: "white", fontWeight: 700, fontSize: 13,
    textDecoration: "none",
  },
  overviewBox: {
    border: "1px solid #ddd", borderRadius: 12, padding: 16, marginBottom: 16,
    background: "#fafbfc",
  },
  accountSelectorRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14 },
  accountSelectorLabel: { fontSize: 13, fontWeight: 700, color: "#333" },
  accountSelect: { padding: "6px 10px", borderRadius: 8, border: "1px solid #ccc", fontSize: 13, flex: 1 },
  pillsLabel: { fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 8 },
  pillsRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  pill: {
    padding: "8px 14px", borderRadius: 20, border: "1px solid #2e3848", background: "white",
    color: "#2e3848", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  chatBox: {
    border: "1px solid #ddd", borderRadius: 12, padding: 16, minHeight: 300,
    marginBottom: 16, display: "flex", flexDirection: "column", gap: 12,
  },
  placeholder: { color: "#999", fontSize: 14 },
  userMsg: { background: "#f0f4f8", borderRadius: 8, padding: 10 },
  botMsg: { background: "#fff9e6", borderRadius: 8, padding: 10 },
  toolCalls: { fontSize: 12, color: "#888", marginTop: 6 },
  errorMsg: { color: "#c0392b", fontSize: 14 },
  inputRow: { display: "flex", gap: 8, alignItems: "flex-start" },
  textarea: { flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ccc", minHeight: 60, fontFamily: "inherit" },
  attachBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44,
    borderRadius: 8, border: "1px solid #ccc", cursor: "pointer", fontSize: 18,
  },
  button: { padding: "0 20px", borderRadius: 8, border: "none", background: "#2e3848", color: "#74fbfb", fontWeight: 700, cursor: "pointer" },
  downloadBtn: {
    marginTop: 8, padding: "6px 14px", borderRadius: 8, border: "1px solid #2e3848",
    background: "white", color: "#2e3848", fontWeight: 700, cursor: "pointer", fontSize: 13,
  },
  fileNote: { fontSize: 12, color: "#666", marginTop: 4 },
};
