// Memoria persistente del agente: objetivos por campaña, historial de
// chequeos/decisiones, y el token de Meta guardado para que el proceso
// automático (cron) pueda trabajar sin que haya un navegador abierto.
const { kv } = require("@vercel/kv");

// --- Token de Meta (para que el cron funcione sin sesión de navegador) ---

async function setMetaToken(token, expiresInSeconds) {
  await kv.set("meta_token_global", token, { ex: expiresInSeconds || 60 * 60 * 24 * 55 });
}

async function getMetaToken() {
  return await kv.get("meta_token_global");
}

// --- Objetivos por campaña ---
// goal: { ad_account_id, campaign_id, campaign_name, metric, direction,
//         target_value, autopause_rule: { enabled, consecutive_checks } | null }

async function setGoal(goal) {
  await kv.set(`goal:${goal.campaign_id}`, goal);
  const ids = (await kv.get("goals:index")) || [];
  if (!ids.includes(goal.campaign_id)) {
    ids.push(goal.campaign_id);
    await kv.set("goals:index", ids);
  }
}

async function getGoal(campaignId) {
  return await kv.get(`goal:${campaignId}`);
}

async function listGoals() {
  const ids = (await kv.get("goals:index")) || [];
  const goals = await Promise.all(ids.map((id) => kv.get(`goal:${id}`)));
  return goals.filter(Boolean);
}

// --- Historial de chequeos/decisiones por campaña (para "aprender") ---
// entry: { date, metric_value, target_value, verdict, trend, action_taken }

async function appendHistory(campaignId, entry) {
  const history = (await kv.get(`history:${campaignId}`)) || [];
  history.push(entry);
  const trimmed = history.slice(-30);
  await kv.set(`history:${campaignId}`, trimmed);
  return trimmed;
}

async function getHistory(campaignId) {
  return (await kv.get(`history:${campaignId}`)) || [];
}

// --- Resumen del último chequeo global (para el panel del sitio) ---

async function setLatestChecks(checks) {
  await kv.set("latest_checks", { checks, ranAt: new Date().toISOString() });
}

async function getLatestChecks() {
  return (await kv.get("latest_checks")) || { checks: [], ranAt: null };
}

module.exports = {
  setMetaToken,
  getMetaToken,
  setGoal,
  getGoal,
  listGoals,
  appendHistory,
  getHistory,
  setLatestChecks,
  getLatestChecks,
};
