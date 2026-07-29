// Este endpoint lo llama Vercel Cron (o un servicio externo como
// cron-job.org) de forma automática, sin que haya un navegador abierto.
// Revisa cada campaña con objetivo definido, concluye si va bien o mal, lo
// compara con el chequeo anterior (tendencia), y si el usuario autorizó
// pausa automática para esa campaña puntual, puede PAUSARLA (nunca
// activarla) cuando el mal desempeño se repite varias veces seguidas.

const { graphGet, graphPost } = require("../../../lib/metaApi");
const {
  getMetaToken,
  listGoals,
  appendHistory,
  getHistory,
  setLatestChecks,
} = require("../../../lib/db");

export const config = {
  maxDuration: 60,
};

function extractMetricValue(insightsRow, metric) {
  if (!insightsRow) return null;

  if (metric === "ctr") return parseFloat(insightsRow.ctr || "0");
  if (metric === "cpm") return parseFloat(insightsRow.cpm || "0");
  if (metric === "spend") return parseFloat(insightsRow.spend || "0");

  if (metric === "roas") {
    const roas = insightsRow.purchase_roas?.[0]?.value;
    return roas ? parseFloat(roas) : null;
  }

  if (metric === "cpl" || metric === "cpa") {
    const list = insightsRow.cost_per_action_type || [];
    // Buscamos primero acciones de tipo "lead", si no hay, cualquier acción.
    const leadEntry = list.find((a) => a.action_type.includes("lead"));
    const entry = leadEntry || list[0];
    return entry ? parseFloat(entry.value) : null;
  }

  return null;
}

function computeVerdict(value, target, direction) {
  if (value === null || value === undefined) return "sin_datos";
  if (direction === "lower_is_better") return value <= target ? "bien" : "mal";
  return value >= target ? "bien" : "mal";
}

function computeTrend(current, previousValue) {
  if (current === null || previousValue === null || previousValue === undefined) return "sin_comparacion";
  if (current < previousValue) return "bajando";
  if (current > previousValue) return "subiendo";
  return "estable";
}

export default async function handler(req, res) {
  // Protección: solo Vercel Cron, o quien tenga el secreto, puede disparar esto.
  // Acepta el secreto de dos formas: el header que manda Vercel Cron
  // automáticamente, o un parámetro en la URL (?secret=...) para que puedas
  // probarlo tú mismo desde el navegador mientras configuras todo.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    const querySecret = req.query.secret;
    const authorized = authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;
    if (!authorized) {
      return res.status(401).json({ error: "No autorizado." });
    }
  }

  const token = await getMetaToken();
  if (!token) {
    return res.status(200).json({ ok: true, message: "Nadie ha conectado Meta todavía, nada que revisar." });
  }

  const goals = await listGoals();
  if (goals.length === 0) {
    return res.status(200).json({ ok: true, message: "No hay campañas con objetivo definido todavía." });
  }

  const results = [];

  for (const goal of goals) {
    try {
      const insights = await graphGet(`/${goal.campaign_id}/insights`, token, {
        date_preset: "last_7d",
        fields: "spend,ctr,cpm,actions,cost_per_action_type,purchase_roas",
      });
      const row = insights.data?.[0] || null;
      const metricValue = extractMetricValue(row, goal.metric);
      const verdict = computeVerdict(metricValue, goal.target_value, goal.direction);

      const history = await getHistory(goal.campaign_id);
      const previous = history[history.length - 1];
      const trend = computeTrend(metricValue, previous?.metric_value);

      let actionTaken = "ninguna";

      if (goal.autopause_rule?.enabled && verdict === "mal") {
        const needed = goal.autopause_rule.consecutive_checks || 3;
        const recentVerdicts = history.slice(-(needed - 1)).map((h) => h.verdict);
        recentVerdicts.push(verdict);
        const allBad = recentVerdicts.length >= needed && recentVerdicts.every((v) => v === "mal");
        if (allBad) {
          await graphPost(`/${goal.campaign_id}`, token, { status: "PAUSED" });
          actionTaken = "pausada_automaticamente";
        }
      }

      const entry = {
        date: new Date().toISOString(),
        metric_value: metricValue,
        target_value: goal.target_value,
        verdict,
        trend,
        action_taken: actionTaken,
      };
      await appendHistory(goal.campaign_id, entry);

      results.push({
        campaign_id: goal.campaign_id,
        campaign_name: goal.campaign_name,
        metric: goal.metric,
        ...entry,
      });
    } catch (err) {
      results.push({
        campaign_id: goal.campaign_id,
        campaign_name: goal.campaign_name,
        error: err.message,
      });
    }
  }

  await setLatestChecks(results);

  return res.status(200).json({ ok: true, checked: results.length, results });
}
