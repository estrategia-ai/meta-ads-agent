// Llamadas directas a la Graph API de Meta (Marketing API), usando el token
// que ya conseguimos con el login "Conectar con Meta". Esto reemplaza al
// conector MCP de Meta, que solo acepta apps ya aprobadas por Meta
// (Claude.ai, ChatGPT, Cursor) — no admite apps propias como esta.

const GRAPH_VERSION = "v23.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

async function graphGet(path, token, params = {}) {
  const url = new URL(`${GRAPH_BASE}${path}`);
  url.searchParams.set("access_token", token);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString());
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function graphPost(path, token, body = {}) {
  const url = new URL(`${GRAPH_BASE}${path}`);
  url.searchParams.set("access_token", token);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

// --- Herramientas expuestas a Claude ---

const TOOLS = [
  {
    name: "list_ad_accounts",
    description:
      "Lista las cuentas publicitarias de Meta Ads a las que el usuario tiene acceso, con su ID, nombre y divisa. Úsala siempre antes de crear o consultar algo, para confirmar de qué cuenta se trata (el usuario maneja varias).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_campaigns",
    description:
      "Lista las campañas de una cuenta publicitaria específica, con su estado, presupuesto y objetivo.",
    input_schema: {
      type: "object",
      properties: {
        ad_account_id: {
          type: "string",
          description: "ID numérico de la cuenta, sin el prefijo 'act_'.",
        },
      },
      required: ["ad_account_id"],
    },
  },
  {
    name: "get_campaign_insights",
    description:
      "Trae métricas de rendimiento (gasto, resultados, CPM, CTR, etc.) de una cuenta o campaña específica en un rango de fechas.",
    input_schema: {
      type: "object",
      properties: {
        ad_account_id: { type: "string" },
        campaign_id: {
          type: "string",
          description: "Opcional. Si se omite, trae insights de toda la cuenta.",
        },
        date_preset: {
          type: "string",
          description:
            "Rango de fechas. Valores típicos: last_7d, last_14d, last_30d, last_90d.",
        },
      },
      required: ["ad_account_id"],
    },
  },
  {
    name: "create_campaign",
    description:
      "Crea una campaña nueva en Meta Ads, SIEMPRE en estado pausado. Nunca la actives desde esta llamada. Si la cuenta usa presupuesto por conjunto de anuncios (ABO) en vez de por campaña (CBO), omite daily_budget_cents aquí y ponlo en create_ad_set.",
    input_schema: {
      type: "object",
      properties: {
        ad_account_id: { type: "string" },
        name: { type: "string" },
        objective: {
          type: "string",
          description:
            "Valores ODAX válidos: OUTCOME_AWARENESS, OUTCOME_TRAFFIC, OUTCOME_ENGAGEMENT, OUTCOME_LEADS, OUTCOME_SALES, OUTCOME_APP_PROMOTION.",
        },
        daily_budget_cents: {
          type: "integer",
          description:
            "Opcional. Presupuesto diario de la CAMPAÑA (CBO) en centavos. Omite este campo si la cuenta usa presupuesto por conjunto de anuncios (ABO) y ponlo en create_ad_set en su lugar.",
        },
      },
      required: ["ad_account_id", "name", "objective"],
    },
  },
  {
    name: "create_ad_set",
    description:
      "Crea un conjunto de anuncios dentro de una campaña existente, SIEMPRE en estado pausado. Targeting simple (país + edad) por ahora — sin públicos personalizados ni intereses todavía. Si la cuenta exige puja manual, incluye bid_strategy y bid_amount_cents.",
    input_schema: {
      type: "object",
      properties: {
        ad_account_id: { type: "string" },
        campaign_id: { type: "string" },
        name: { type: "string" },
        billing_event: { type: "string", description: "Ej. IMPRESSIONS." },
        optimization_goal: {
          type: "string",
          description: "Ej. OFFSITE_CONVERSIONS, LINK_CLICKS, REACH.",
        },
        countries: {
          type: "array",
          items: { type: "string" },
          description: "Códigos de país ISO, ej. ['CO','MX'].",
        },
        age_min: { type: "integer" },
        age_max: { type: "integer" },
        bid_strategy: {
          type: "string",
          description:
            "Opcional. Solo si la cuenta lo exige (error pidiendo 'importe de puja manual'). Valor típico: LOWEST_COST_WITH_BID_CAP.",
        },
        bid_amount_cents: {
          type: "integer",
          description:
            "Opcional. Monto de puja manual en centavos (o unidad mínima de la divisa), requerido solo si se usa bid_strategy.",
        },
        daily_budget_cents: {
          type: "integer",
          description:
            "Opcional. Presupuesto diario del CONJUNTO DE ANUNCIOS (ABO) en centavos. Úsalo cuando la campaña se creó sin presupuesto propio (cuenta con ABO).",
        },
      },
      required: [
        "ad_account_id",
        "campaign_id",
        "name",
        "billing_event",
        "optimization_goal",
        "countries",
      ],
    },
  },
  {
    name: "activate_entity",
    description:
      "Activa (pasa de PAUSED a ACTIVE) una campaña o conjunto de anuncios existente. SOLO llamar cuando el usuario lo haya confirmado explícitamente para esa entidad puntual — nunca como parte de crearla.",
    input_schema: {
      type: "object",
      properties: {
        ad_account_id: { type: "string" },
        entity_id: { type: "string" },
        entity_type: { type: "string", description: "campaign o adset." },
      },
      required: ["ad_account_id", "entity_id", "entity_type"],
    },
  },
];

// --- Ejecución de cada herramienta ---

async function executeTool(name, input, token) {
  switch (name) {
    case "list_ad_accounts": {
      const data = await graphGet("/me/adaccounts", token, {
        fields: "id,name,account_id,currency,account_status",
      });
      return data;
    }
    case "list_campaigns": {
      const data = await graphGet(`/act_${input.ad_account_id}/campaigns`, token, {
        fields: "id,name,status,objective,daily_budget,lifetime_budget",
      });
      return data;
    }
    case "get_campaign_insights": {
      const path = input.campaign_id
        ? `/${input.campaign_id}/insights`
        : `/act_${input.ad_account_id}/insights`;
      const data = await graphGet(path, token, {
        date_preset: input.date_preset || "last_30d",
        fields:
          "spend,impressions,clicks,ctr,cpm,cpc,actions,cost_per_action_type",
      });
      return data;
    }
    case "create_campaign": {
      const body = {
        name: input.name,
        objective: input.objective,
        status: "PAUSED",
        special_ad_categories: "[]",
        is_adset_budget_sharing_enabled: "false",
      };
      if (input.daily_budget_cents) {
        body.campaign_daily_budget = input.daily_budget_cents;
        body.campaign_bid_strategy = "LOWEST_COST_WITHOUT_CAP";
      }
      const data = await graphPost(`/act_${input.ad_account_id}/campaigns`, token, body);
      return data;
    }
    case "create_ad_set": {
      const targeting = JSON.stringify({
        geo_locations: { countries: input.countries },
        age_min: input.age_min || 18,
        age_max: input.age_max || 65,
      });
      const body = {
        name: input.name,
        campaign_id: input.campaign_id,
        billing_event: input.billing_event,
        optimization_goal: input.optimization_goal,
        targeting,
        status: "PAUSED",
      };
      if (input.bid_strategy) {
        body.bid_strategy = input.bid_strategy;
      }
      if (input.bid_amount_cents) {
        body.bid_amount = input.bid_amount_cents;
      }
      if (input.daily_budget_cents) {
        body.daily_budget = input.daily_budget_cents;
      }
      const data = await graphPost(`/act_${input.ad_account_id}/adsets`, token, body);
      return data;
    }
    case "activate_entity": {
      const data = await graphPost(`/${input.entity_id}`, token, { status: "ACTIVE" });
      return data;
    }
    default:
      throw new Error(`Herramienta desconocida: ${name}`);
  }
}

module.exports = { TOOLS, executeTool };
