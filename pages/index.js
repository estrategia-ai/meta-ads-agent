import { useState, useRef, useEffect } from "react";

function extractText(contentBlocks) {
  return contentBlocks
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n\n");
}

function extractToolCalls(data) {
  if (Array.isArray(data.toolCallsLog) && data.toolCallsLog.length > 0) {
    return data.toolCallsLog.map((name) => `🔧 ${name}`);
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

// Descarga el contenido como archivo cuando la respuesta trae un bloque de
// código html o markdown (las skills que generan "archivos" lo devuelven así
// porque este sitio no tiene disco propio del usuario).
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

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [metaConnected, setMetaConnected] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // meta_connected es una cookie NO httpOnly, solo informativa (el token
    // real vive en meta_token, httpOnly, invisible aquí a propósito).
    setMetaConnected(document.cookie.includes("meta_connected=1"));
  }, []);

  async function sendMessage() {
    if ((!input.trim() && !file) || loading) return;

    const newMessages = [...messages, { role: "user", content: input || `[archivo: ${file?.name}]` }];
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
        body: JSON.stringify({ messages: newMessages, attachment }),
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

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Agente de Campañas — Meta Ads</h1>
      <p style={styles.subtitle}>
        Uso personal — administra tus cuentas de Meta Ads. Todo lo que se cree
        queda pausado hasta que tú lo actives.
      </p>

      {metaConnected ? (
        <p style={styles.metaOk}>✅ Conectado a Meta Ads</p>
      ) : (
        <a href="/api/auth/meta/login" style={styles.metaBtn}>
          Conectar con Meta
        </a>
      )}

      <div style={styles.chatBox}>
        {messages.length === 0 && (
          <p style={styles.placeholder}>
            Ej: "Ejecuta la estrategia de Ventas para el cliente X" · o adjunta
            un CSV de Ads Manager para un análisis 3Q's · o una imagen de un
            anuncio para deconstruirlo.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} style={m.role === "user" ? styles.userMsg : styles.botMsg}>
            <strong>{m.role === "user" ? "Tú" : "Agente"}:</strong>
            <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
            {m.toolCalls && m.toolCalls.length > 0 && (
              <div style={styles.toolCalls}>{m.toolCalls.join(" · ")}</div>
            )}
            {m.downloadable && (
              <button
                style={styles.downloadBtn}
                onClick={() => downloadFile(m.downloadable.content, m.downloadable.ext)}
              >
                ⬇ Descargar reporte (.{m.downloadable.ext})
              </button>
            )}
          </div>
        ))}
        {loading && <p style={styles.placeholder}>Pensando…</p>}
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
          placeholder="Escribe tu mensaje…"
        />
        <label style={styles.attachBtn}>
          📎
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.csv,.xlsx,.pdf"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
        </label>
        <button style={styles.button} onClick={sendMessage} disabled={loading}>
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
