const { getLatestChecks } = require("../../../lib/db");

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  const metaToken = req.cookies?.meta_token;
  if (!metaToken) {
    return res.status(401).json({ error: "No conectado a Meta." });
  }
  try {
    const data = await getLatestChecks();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Error interno." });
  }
}
