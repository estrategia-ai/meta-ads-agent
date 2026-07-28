---
id: ejecutor-campanas-meta
title: "Ejecutor de Campañas — Meta Ads"
description: "Toma una estrategia de Meta Ads (generada por excel-de-estrategiaskill o descrita por el usuario) y la crea de verdad en la cuenta de Meta Ads del cliente: campañas, conjuntos de anuncios y anuncios con creativos, SIEMPRE en estado pausado. Muestra el plan completo y pide aprobación antes de crear nada. Úsalo cuando el usuario diga 'ejecuta esta estrategia', 'sube esto a Meta', 'crea las campañas de verdad', 'materializa el plan en mi cuenta', o después de generar una estrategia con excel-de-estrategiaskill si el usuario quiere llevarla a la cuenta real."
plans: premium,pro
---

---
name: ejecutor-campanas-meta
description: >
  Toma una estrategia de Meta Ads (de excel-de-estrategiaskill o descrita en el chat) y la
  ejecuta de verdad en la cuenta del cliente: crea campañas, conjuntos de anuncios y anuncios
  con creativos, siempre en PAUSA. Muestra el plan completo y espera aprobación antes de crear
  nada. Nunca activa campañas sin confirmación explícita del usuario, entidad por entidad.
---

> **REGLA DE ORO — NUNCA ACTIVAR SOLO:** Esta skill jamás llama a `ads_activate_entity` por su
> cuenta. Todo lo que se crea queda en PAUSED (así lo hace la API de Meta por defecto). Activar
> una campaña/conjunto/anuncio implica gastar dinero real y SIEMPRE requiere que el usuario lo
> pida explícitamente, entidad por entidad, en un turno posterior — nunca como parte de la
> ejecución de esta skill.

> **REGLA DE ORO — SIEMPRE MOSTRAR EL PLAN ANTES DE CREAR:** Antes de llamar cualquier herramienta
> que cree algo en Meta (`ads_create_campaign`, `ads_create_ad_set`, `ads_create_ad`,
> `ads_create_custom_audience`), muestra en el chat el plan completo resuelto (nombres,
> presupuestos, objetivos, públicos ya traducidos a IDs reales, y anuncios) y espera un "sí,
> adelante" explícito del usuario. Si el usuario pide cambios, ajusta y vuelve a mostrar el plan.

---

# Ejecutor de Campañas — Meta Ads

## Cuándo usar esta skill

- El usuario ya tiene una estrategia (de `excel-de-estrategiaskill` o descrita de palabra) y
  quiere que se cree de verdad en su cuenta de Meta Ads.
- Frases como: "ejecuta esto en Meta", "crea las campañas de verdad", "sube esta estrategia a
  mi cuenta", "materializa el plan".
- NO uses esta skill solo para diseñar la estrategia (eso es `excel-de-estrategiaskill`) ni para
  analizar campañas existentes (eso es `3qs`, `monitor-pixel`, `sugeridor-productos-test`).

---

## Flujo

### Paso 0 — Identificar la cuenta

El usuario maneja **varias cuentas publicitarias** (una por cliente/proyecto). Nunca asumas cuál
usar:

1. Pregunta para qué cliente/proyecto es esta ejecución.
2. Si no sabes el `ad_account_id`, usa `ads_get_ad_accounts` para listar las cuentas disponibles
   y que el usuario confirme cuál es, por nombre.
3. Con `ads_get_ad_accounts` obtén también la **divisa** de esa cuenta — la necesitas para
   convertir bien los presupuestos (ver Paso 3).
4. Obtén el `page_id` de la Página de Facebook a usar con `ads_get_ad_account_pages`. Si hay más
   de una página, pregunta cuál.

### Paso 1 — Recoger la estrategia

- Si viene de `excel-de-estrategiaskill` en la misma conversación, toma esos datos directamente
  (tipo de negocio, campañas, % de presupuesto, conjuntos, públicos, exclusiones).
- Si el usuario la describe de palabra, complétala con las mismas preguntas que hace
  `excel-de-estrategiaskill` (tipo de negocio, retargeting, presupuesto, recompra) — no inventes
  campañas ni conjuntos que el usuario no pidió.

### Paso 2 — Traducir a parámetros reales de Meta

**Objetivo de campaña** (`objective`, valores ODAX únicamente):

| Tipo de negocio (excel-de-estrategia) | objective |
|---|---|
| 🛒 Ventas | OUTCOME_SALES |
| 💬 Interacción / Mensajes | OUTCOME_ENGAGEMENT (destination_type según app: WHATSAPP, MESSENGER o INSTAGRAM_DIRECT) |
| 📋 Leads — Formulario instantáneo | OUTCOME_LEADS |
| 🌐 Leads — Sitio web | OUTCOME_LEADS (o OUTCOME_TRAFFIC si el usuario prioriza tráfico sobre leads) |
| 📍 Reconocimiento / Marca Local | OUTCOME_AWARENESS |

**Presupuesto:** usa CBO (presupuesto a nivel de campaña) salvo que el usuario pida ABO
explícitamente. Los montos van en la **unidad mínima de la divisa de la cuenta** (para USD/COP
suele ser centavos, es decir, multiplicar por 100 — pero confirma con la divisa real que trajiste
en el Paso 0, no asumas). Divide el presupuesto mensual entre 30 para el diario, igual que hace
`excel-de-estrategiaskill`.

**Audiencias — nunca inventes IDs:**

- Públicos "Abierto" (país, género, edad) → `targeting` broad con `geo_locations`, sin intereses.
- Conjuntos "Intereses" → busca los IDs reales con la herramienta de búsqueda de intereses de Meta
  Ads (si no la tienes cargada, búscala con `tool_search`: "targeting search intereses meta
  ads"). Si no encuentras un interés que calce, usa targeting broad en su lugar y avísale al
  usuario — nunca pongas un ID inventado.
- Exclusiones/inclusiones de retargeting (FB 30d, IG 30d, Web 90d, Compradores 180d, Lista de
  clientes, etc.) → son **públicos personalizados (Custom Audiences)** que deben existir en la
  cuenta. Usa `ads_get_ad_account_custom_audiences` para listar las que ya existen y empareja
  por nombre/definición.
  - Si falta alguna, dile al usuario exactamente cuáles faltan y pregunta si las creas ahora
    (con `ads_create_custom_audience`, requiere pixel_id o lista de clientes) o si continúa sin
    esa exclusión por ahora. No las crees sin que el usuario lo confirme.

### Paso 3 — Creativos (solo si el usuario los tiene listos en este momento)

- Si el usuario adjunta imágenes/videos y copy en el chat, arma el `creative` de cada anuncio:
  `object_story_spec` con `page_id` (obligatorio) + `link_data`/`video_data` con la imagen/video
  y el texto.
- Sube la imagen al ad account con la herramienta de subida de imágenes de Meta Ads antes de
  usar `image_hash` (si no la tienes cargada, búscala con `tool_search`).
- Si el usuario NO tiene creativos listos todavía, detente en la estructura (campaña + conjunto)
  y dile claramente: "la estructura queda lista y pausada; en cuanto tengas los creativos, corro
  este mismo flujo para los anuncios."
- Sigue las recomendaciones de tipos de creativo y nivel de consciencia que ya define
  `excel-de-estrategiaskill` para cada campaña (Presentación vs Evaluación/Conversión/Ascensión).

### Paso 4 — Mostrar el plan y pedir aprobación

Antes de crear nada, muestra en el chat una tabla o lista con:

- Cuenta y página que se van a usar.
- Cada campaña: nombre, objetivo, presupuesto mensual/diario.
- Cada conjunto: nombre, público ya resuelto (real, con IDs si aplica), exclusiones, optimización.
- Cada anuncio: nombre, a qué conjunto pertenece, resumen del creativo.
- Cualquier público personalizado que falte y qué se decidió hacer con él.

Pregunta explícitamente: "¿Confirmas que cree esto en Meta? Quedará todo en pausa, nada se
activa ni gasta hasta que tú lo pidas." Solo continúa si el usuario confirma.

### Paso 5 — Crear en Meta (siempre en este orden)

1. `ads_create_campaign` (una por campaña del plan).
2. `ads_create_ad_set` bajo cada campaña (uno por conjunto).
3. `ads_create_ad` bajo cada conjunto, si hay creativos listos.
4. Si el usuario aprobó crear públicos personalizados nuevos, créalos primero (antes del Paso 5.2
   si un conjunto depende de ellos).

Guarda los IDs devueltos por cada llamada — los necesitas para reportar y para futuras
optimizaciones.

### Paso 6 — Reporte final

Confirma en el chat, por campaña:

- Nombre y ID de la campaña, conjunto(s) y anuncio(s) creados.
- Estado: **PAUSADO** en todos los niveles.
- Recordatorio explícito: "Nada se está gastando. Cuando quieras activar algo, dímelo
  específicamente (por campaña/conjunto/anuncio) y te confirmo antes de hacerlo."

---

## Prohibido

- NO actives ninguna entidad (`ads_activate_entity`) como parte de esta skill, bajo ninguna
  circunstancia — ni siquiera si el usuario dice "y actívalo también" dentro del mismo mensaje:
  primero termina de crear todo en pausa, reporta, y trata la activación como una acción aparte
  que confirmas de nuevo en ese momento.
- NO inventes IDs de intereses ni de públicos personalizados. Si no existen o no los encuentras,
  dilo y pregunta cómo proceder.
- NO agregues campañas, conjuntos, públicos o presupuestos que no estén en el plan aprobado por
  el usuario en el Paso 4.
- NO asumas la cuenta publicitaria — el usuario maneja varias, confirma siempre cuál es.
