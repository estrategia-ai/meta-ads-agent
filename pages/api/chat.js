const { BASE_SYSTEM_PROMPT } = require("../../lib/systemPrompt");
const { buildSkillsContext } = require("../../lib/skills");
const { TOOLS, executeTool } = require("../../lib/metaApi");

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "15mb",
    },
  },
};

const MAX_TOOL_ITERATIONS = 6;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Falta configurar ANTHROPIC_API_KEY en las variables de entorno del servidor.",
    });
  }

  const metaToken = req.cookies?.meta_token;
  if (!metaToken) {
    return res.status(401).json({
      error:
        "Todavía no conectaste tu cuenta de Meta Ads. Ve a la página principal y haz clic en 'Conectar con Meta'.",
    });
  }

  const { messages, attachment } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Falta el historial de mensajes." });
  }

  const preparedMessages = messages.map((m) => ({ ...m }));
  const lastIndex = preparedMessages.length - 1;

  if (attachment && preparedMessages[lastIndex]?.role === "user") {
    const textContent = preparedMessages[lastIndex].content;
    const isImage = attachment.mediaType.startsWith("image/");
    const fileBlock = isImage
      ? { type: "image", source: { type: "base64", media_type: attachment.mediaType, data: attachment.base64 } }
      : { type: "document", source: { type: "base64", media_type: attachment.mediaType, data: attachment.base64 } };
    preparedMessages[lastIndex].content = [fileBlock, { type: "text", text: textContent }];
  }

  const lastUserText =
    typeof messages[lastIndex]?.content === "string" ? messages[lastIndex].content : "";

  const systemPrompt = BASE_SYSTEM_PROMPT + buildSkillsContext(lastUserText);

  // Herramientas propias (Graph API directa) + búsqueda web (para
  // espia-competencia y calendario-comercial).
  const tools = [
    ...TOOLS,
    { type: "web_search_20260209", name: "web_search", max_uses: 5 },
  ];

  const toolCallsLog = [];

  async function callClaude(msgs) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        system: systemPrompt,
<<<<<<< HEAD
        messages: msgs,
        tools,
=======
        messages: preparedMessages,
        // Conector de Meta Ads. authorization_token viene del login que el
        // usuario ya hizo con "Conectar con Meta" (cookie meta_token).
        mcp_servers: [
          {
            type: "url",
            url: "https://mcp.facebook.com/ads",
            name: "meta-ads",
            authorization_token: metaToken,
          },
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
>>>>>>> 009a67381279e2e9c3f3dfa81ba63865fe351d84
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      const err = new Error(JSON.stringify(data));
      err.status = response.status;
      throw err;
    }
    return data;
  }

  try {
    let workingMessages = [...preparedMessages];
    let finalData = await callClaude(workingMessages);

    let iterations = 0;
    while (finalData.stop_reason === "tool_use" && iterations < MAX_TOOL_ITERATIONS) {
      iterations++;
      const toolUseBlocks = finalData.content.filter((b) => b.type === "tool_use");

      // Nuestras herramientas propias (create_campaign, etc.) las ejecutamos
      // aquí. Las de servidor (web_search) ya vienen resueltas por Claude y
      // no aparecen como "tool_use" de este tipo.
      const toolResults = [];
      for (const block of toolUseBlocks) {
        toolCallsLog.push(block.name);
        try {
          const result = await executeTool(block.name, block.input, metaToken);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        } catch (err) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `Error ejecutando ${block.name}: ${err.message}`,
            is_error: true,
          });
        }
      }

      workingMessages = [
        ...workingMessages,
        { role: "assistant", content: finalData.content },
        { role: "user", content: toolResults },
      ];

      finalData = await callClaude(workingMessages);
    }

    // Agregamos server_tool_use (web_search) al log para mostrarlo también.
    finalData.content
      .filter((b) => b.type === "server_tool_use")
      .forEach((b) => toolCallsLog.push(b.name));

    return res.status(200).json({ ...finalData, toolCallsLog });
  } catch (err) {
    console.error("Error llamando a la API de Claude:", err);
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || "Error interno del servidor." });
  }
}