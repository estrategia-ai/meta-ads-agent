const { getOverview } = require("../../../lib/metaApi");

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const metaToken = req.cookies?.meta_token;
  if (!metaToken) {
    return res.status(401).json({ error: "No conectado a Meta." });
  }

  try {
    const overview = await getOverview(metaToken);
    return res.status(200).json(overview);
  } catch (err) {
    console.error("Error trayendo overview de Meta:", err);
    return res.status(500).json({ error: err.message || "Error interno." });
  }
}
