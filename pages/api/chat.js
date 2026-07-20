const { BASE_SYSTEM_PROMPT } = require("../../lib/systemPrompt");
const { buildSkillsContext } = require("../../lib/skills");

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "15mb", // por las imágenes/CSV adjuntos
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "Falta configurar ANTHROPIC_API_KEY en las variables de entorno del servidor.",
    });
  }

  const { messages, attachment } = req.body;
  // attachment (opcional): { mediaType: "image/png" | "text/csv" | "application/pdf", base64: "...", name: "..." }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Falta el historial de mensajes." });
  }

  // Si viene un adjunto, lo metemos como bloque de contenido en el último
  // mensaje del usuario antes de mandarlo a Claude.
  const preparedMessages = messages.map((m) => ({ ...m }));
  const lastIndex = preparedMessages.length - 1;

  if (attachment && preparedMessages[lastIndex]?.role === "user") {
    const textContent = preparedMessages[lastIndex].content;
    const isImage = attachment.mediaType.startsWith("image/");

    const fileBlock = isImage
      ? {
          type: "image",
          source: {
            type: "base64",
            media_type: attachment.mediaType,
            data: attachment.base64,
          },
        }
      : {
          type: "document",
          source: {
            type: "base64",
            media_type: attachment.mediaType,
            data: attachment.base64,
          },
        };

    preparedMessages[lastIndex].content = [
      fileBlock,
      { type: "text", text: textContent },
    ];
  }

  const lastUserText =
    typeof messages[lastIndex]?.content === "string"
      ? messages[lastIndex].content
      : "";

  const systemPrompt = BASE_SYSTEM_PROMPT + buildSkillsContext(lastUserText);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "mcp-client-2025-11-20",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        system: systemPrompt,
        messages: preparedMessages,
        // Conector de Meta Ads.
        mcp_servers: [
          { type: "url", url: "https://mcp.facebook.com/ads", name: "meta-ads" },
        ],
        // code_execution: la necesitan monitor-pixel y sugeridor-productos-test
        // para correr sus scripts de Python.
        // web_search: la necesita espia-competencia para intentar leer la
        // Biblioteca de Anuncios pública de Meta (con resultados no garantizados,
        // ver nota en skills/espia-competencia.md).
 tools: [
          { type: "web_search_20260209", name: "web_search", max_uses: 5 },
          { type: "mcp_toolset", mcp_server_name: "meta-ads" },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Error llamando a la API de Claude:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
