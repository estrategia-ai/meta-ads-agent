---
id: excel-de-estrategia
title: "Excel de Estrategia — Meta Ads"
description: "Genera la estrategia completa de campañas de Meta Ads según la metodología de Felipe Vergara. Crea la estructura de campañas (Presentación, Evaluación, Conversión, Ascensión) con todos los parámetros: objetivo, presupuestos, conjuntos de anuncios, públicos, exclusiones y ubicaciones. Úsalo cuando el alumno quiera armar su estrategia de Facebook e Instagram Ads, no sepa cómo distribuir su presupuesto, quiera saber cuántas campañas crear, qué audiencias usar, o quiera replicar el Excel de estrategia de Felipe Vergara."
plans: premium,pro
---

---
name: excel-de-estrategia
description: >
  Genera la estrategia completa de campañas de Meta Ads según la metodología de Felipe Vergara.
  Crea la estructura de campañas (Presentación, Evaluación, Conversión, Ascensión) con todos los
  parámetros: objetivo, presupuestos, conjuntos de anuncios, públicos, exclusiones y ubicaciones.
  Úsalo cuando el alumno quiera armar su estrategia de Facebook e Instagram Ads, no sepa cómo
  distribuir su presupuesto, quiera saber cuántas campañas crear, qué audiencias usar, o quiera
  replicar el Excel de estrategia de Felipe Vergara.
---

> **REGLA DE CONVERSACIÓN:** Mantén tus respuestas en el chat lo más cortas posibles. Solo confirma acciones ("Investigando...", "Listo, archivo guardado"). NO des análisis adicionales, recomendaciones de estrategia, opiniones, ni explicaciones de la metodología en el chat. Todo el análisis va dentro del HTML/output. Si el usuario pregunta algo específico, responde solo eso, sin agregar contexto extra.

> **REGLA HTML (OBLIGATORIO):** SIEMPRE genera el archivo HTML usando la herramienta `Write` y guárdalo en el directorio actual con el nombre indicado en este skill. Después de guardarlo, confirma con: "✅ Archivo guardado: [nombre-archivo].html". NUNCA muestres el HTML en el chat, NUNCA lo dejes como bloque de código en la respuesta — siempre usa `Write` para guardarlo como archivo físico.

> **MODO ORQUESTADOR**: Si quien te invoca dice "no generes HTML", "devuelve resumen" o similar,
> omite completamente cualquier generación de HTML y entrega el resultado en texto estructurado.

# Excel de Estrategia — Meta Ads

Genera la estructura completa de campañas de Meta Ads según la metodología de Felipe Vergara.

---

## Flujo

### Paso 1 — Tipo de negocio

Pregunta:

```
¿Qué tipo de campañas vas a correr?

1. 🛒  Ventas (e-commerce con tienda online)
2. 💬  Interacción / Mensajes (WhatsApp o Messenger)
3. 📋  Leads — Formulario instantáneo de Meta
4. 🌐  Leads — Sitio web (landing page)
5. 📍  Reconocimiento / Marca Local (negocio físico)
```

Si elige **Interacción**, pregunta:
```
¿Qué app de mensajería usas?
1. WhatsApp
2. Messenger
3. Instagram Direct
```

### Paso 2 — Datos para retargeting

Pregunta:
```
¿Tienes datos suficientes para hacer retargeting?

1. 🟢 Sí — Tengo más de 1,000 visitas al mes en mi web,
   más de 500 seguidores activos, o una lista de clientes/leads
   (puedo crear audiencias personalizadas en Meta)

2. 🟡 No / No estoy seguro — Soy nuevo, tengo pocas visitas
   o pocos seguidores, o no sé si tengo suficientes datos
   para crear audiencias de retargeting
```

### Paso 3 — Presupuesto

Pregunta:
```
¿Cuál es tu presupuesto mensual total?

💱 Dime en qué moneda (USD, MXN, COP, EUR, etc.)
   Si no me dices, asumo USD.

💡 Si no sabes cuánto presupuesto necesitas, ejecuta
   /calculadora-de-presupuestos primero para calcularlo.
```

### Paso 4 — Recompra

Pregunta:
```
¿Tu producto tiene recompra? (¿un cliente te puede comprar más de una vez?)
1. ✅ Sí — mis clientes pueden volver a comprar
2. ❌ No — es una compra única (o muy esporádica)
```

Si NO tiene recompra → NO incluir campaña de Ascensión.

### Paso 5 — Generar estrategia

Con el tipo de negocio, datos de retargeting, recompra y presupuesto, genera la estrategia completa.

**OBLIGATORIO:** El output SIEMPRE es un archivo HTML guardado con `Write`. NO generes texto plano, ASCII, ni markdown. Usa el template HTML definido en la sección "Formato de salida" de este skill. El archivo debe llamarse `estrategia-[tipo-negocio]-[YYYY-MM-DD].html`.

---

## Lógica de presupuestos

### Regla de presupuesto bajo (APLICA PRIMERO)

**Si el presupuesto mensual es ≤ $600 USD (o equivalente en otra moneda):**
- Solo 2 campañas: Presentación (80%) + Evaluación (20%)
- NO incluir Ascensión ni Conversión — con poco presupuesto hay que ir a la fija
- Aplica sin importar si tiene datos de retargeting o no

### Con datos de retargeting — 3 campañas (presupuesto > $600)

| Campaña | % del total | Conjuntos | Presupuesto diario por conjunto |
|---|---|---|---|
| Presentación | 60% | 3 | (Total × 0.60) ÷ 3 ÷ 30 |
| Evaluación | 20% | 1 | (Total × 0.20) ÷ 30 |
| Ascensión | 20% | 1 | (Total × 0.20) ÷ 30 |

**Conversión (campaña adicional, solo si aplica):**
- Solo para Ventas con catálogo de productos en Meta
- Solo si presupuesto > $1,000
- Si se activa: redistribuir → Presentación 50% / Evaluación 20% / Conversión 20% / Ascensión 10%

> Nota: Para Reconocimiento, la campaña de Conversión NO aplica.

### Sin datos de retargeting — 2 campañas

| Campaña | % del total | Conjuntos | Presupuesto diario por conjunto |
|---|---|---|---|
| Presentación | 80% | 3 | (Total × 0.80) ÷ 3 ÷ 30 |
| Retargeting | 20% | 1 | (Total × 0.20) ÷ 30 |

La campaña de Retargeting combina Evaluación + Conversión + Ascensión en una sola campaña con **1 solo conjunto de anuncios** que agrupa todos los públicos:

| Conjunto | Público | Exclusiones |
|---|---|---|
| Todo el retargeting | FB 30d + IG 30d + Video medio 30d + Web 30d + Carrito 30d + Inicio pago 30d + Compradores 180d + Lista clientes | — |

---

## Parámetros por tipo de negocio

### 🛒 VENTAS

**Presentación — 60%**
- Objetivo: Ventas
- CBO Advantage+: ON
- Evento de conversión: Compras
- Objetivo de rendimiento: Maximizar número de conversiones
- Calendario: Indefinido
- Ubicaciones: Advantage+
- Conjuntos: 3

| Conjunto | Público | Exclusiones |
|---|---|---|
| Abierto | País, H+M, 18-65+ | FB 90d, IG 90d, Video +10s 90d, Web 90d, Compradores 180d, Lista clientes |
| Intereses | País, H+M, 18-40 + Intereses | Mismas |
| Similares | País, H+M, 18-40, LAL 1% Compras 180d + LAL 1% Lista clientes | Mismas |

**Evaluación — 20%**
- Objetivo: Ventas
- CBO Advantage+: ON
- Evento de conversión: Compras
- Objetivo de rendimiento: Maximizar número de conversiones
- Calendario: Indefinido
- Ubicaciones: Advantage+
- Conjuntos: 1

| Conjunto | Público | Exclusiones |
|---|---|---|
| Retargeting 30d | País, H+M, 18-65 — FB 30d + IG 30d + Video medio 30d + Web 30d | Compradores 30d, Lista clientes |

**Conversión — 20% (solo si tiene catálogo de productos)**
- Objetivo: Ventas del catálogo
- CBO Advantage+: ON
- Evento de conversión: Comprar
- Objetivo de rendimiento: Maximizar número de conversiones
- Conjunto de productos: Disponibilidad en stock
- Calendario: Indefinido
- Ubicaciones: Advantage+
- Conjuntos: 1

| Conjunto | Público | Exclusiones |
|---|---|---|
| Carrito abandonado | Vieron contenido 30d + Carrito 30d + Inicio pago 30d | Compradores 30d |

**Ascensión — 10%**
- Objetivo: Ventas
- CBO Advantage+: ON
- Evento de conversión: Comprar
- Objetivo de rendimiento: Maximizar número de resultados
- Calendario: Indefinido
- Ubicaciones: Advantage+
- Conjuntos: 1

| Conjunto | Público | Exclusiones |
|---|---|---|
| Clientes | País, H+M, edad, Compradores 180d + Lista clientes | Opcional: excluir compradores recientes según ciclo de recompra del producto |

---

### 💬 INTERACCIÓN

Igual que Ventas. Cambios:
- Objetivo: Interacción
- Se agrega columna **App de mensajería**: WhatsApp o Messenger (según el alumno)
- No hay evento de conversión

---

### 📋 LEADS — FORMULARIO INSTANTÁNEO

Igual que Ventas. Cambios:
- Objetivo: Clientes Potenciales
- Evento de conversión: Formulario instantáneo de Meta

---

### 🌐 LEADS — SITIO WEB

Igual que Ventas. Cambios:
- Objetivo: Clientes Potenciales
- Evento de conversión: Lead en sitio web

---

### 📍 RECONOCIMIENTO / MARCA LOCAL

**OBJETIVO de TODAS las campañas: Reconocimiento** (NO Ventas, NO Tráfico, NO Conversiones).
- Sin evento de conversión
- CBO Advantage+: ON
- Calendario: Indefinido
- Ubicaciones: Advantage+

**Presentación** — público por radio:
| Conjunto | Público | Exclusiones |
|---|---|---|
| Abierto | Radio 2km, H+M, 25-65 | FB 90d, IG 90d, Video +10s 90d, Web 90d, Compradores 180d, Lista clientes |
| Intereses | Radio 4km, H+M, 25-65 + Intereses | Mismas |
| Similares | Radio 4km, H+M, 25-65, Lookalike | Mismas |

**Evaluación** — radio 4km en vez de País:
| Conjunto | Público | Exclusiones |
|---|---|---|
| Retargeting 30d | Radio 4km, H+M, 18-65 — FB 30d + IG 30d + Video medio 30d + Web 30d | Compradores 30d, Lista clientes |

**Conversión:** NO APLICA

**Ascensión:**
| Conjunto | Público | Exclusiones |
|---|---|---|
| Clientes | País, H+M, 18-65+, Lista de clientes | Opcional según ciclo de recompra |

---

## Formato de salida

Genera el resultado en HTML con este diseño:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet">
  <title>Estrategia Meta Ads — [Tipo de Negocio]</title>
  <style>
    body { font-family: 'Lato', sans-serif; background: #F5F6F7; color: #2e3848; padding: 32px; }
    h1 { color: #2e3848; font-size: 28px; font-weight: 900; margin-bottom: 4px; }
    .subtitle { color: #666; margin-bottom: 32px; font-size: 14px; font-weight: 300; }
    .presupuesto-total { background: #2e3848; color: #74fbfb; padding: 16px 24px; border-radius: 12px; margin-bottom: 32px; font-size: 18px; font-weight: 700; display: inline-block; }
    .campaña { background: white; border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(46,56,72,0.08); }
    .campaña-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .campaña-nombre { font-size: 20px; font-weight: 900; }
    .campaña-presupuesto { background: rgba(116,251,251,0.15); color: #376290; padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 14px; }
    .params { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .param { background: #F5F6F7; border-radius: 8px; padding: 12px; }
    .param-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 700; }
    .param-value { font-size: 14px; font-weight: 700; color: #2e3848; }
    .conjunto { border: 1px solid #e9ecef; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
    .conjunto-titulo { font-weight: 900; color: #376290; margin-bottom: 12px; font-size: 15px; }
    .conjunto-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .campo-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 700; }
    .campo-valor { font-size: 13px; color: #2e3848; line-height: 1.5; }
    .presupuesto-diario { background: rgba(116,251,251,0.1); border: 1px solid #8dd0df; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 13px; }
    .presupuesto-diario strong { color: #376290; }
    .no-aplica { background: #f8d7da; color: #842029; padding: 12px 16px; border-radius: 8px; font-size: 14px; }
    .footer { margin-top: 40px; background: #2e3848; padding: 32px; text-align: center; color: #8dd0df; font-size: 12px; border-radius: 12px; }
    .disclaimer-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(46,56,72,0.9); display: flex; align-items: center; justify-content: center; z-index: 9999; }
    .disclaimer-box { background: white; border-radius: 16px; padding: 40px; max-width: 520px; text-align: center; }
    .disclaimer-box h2 { font-size: 20px; font-weight: 900; margin-bottom: 16px; color: #2e3848; }
    .disclaimer-box p { font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 24px; }
    .disclaimer-box button { background: #2e3848; color: #74fbfb; border: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 700; cursor: pointer; }
    .disclaimer-box button:hover { background: #376290; }
  </style>
</head>
<body>
  <div class="disclaimer-overlay" id="disclaimer">
    <div class="disclaimer-box">
      <h2>Antes de continuar</h2>
      <p>Este reporte es una herramienta de apoyo basada en los datos que proporcionaste. Las estructuras de campañas, presupuestos y creativos son <strong>ideas y puntos de partida</strong>, no recomendaciones definitivas.<br><br>Cada negocio es diferente. Usa este reporte como complemento de lo que aprendes en la comunidad de Felipe Vergara, no como sustituto.</p>
      <button onclick="document.getElementById('disclaimer').style.display='none'">Acepto y entiendo →</button>
    </div>
  </div>
  <h1>📊 Estrategia Meta Ads</h1>
  <p class="subtitle">Metodología Felipe Vergara — generado con Claude</p>
  <div class="presupuesto-total">💰 Presupuesto mensual: $[TOTAL] USD</div>

  <!-- Repetir bloque .campaña para cada campaña -->
  <div class="campaña">
    <div class="campaña-header">
      <div class="campaña-nombre">🎯 Presentación</div>
      <div class="campaña-presupuesto">$[MONTO] USD/mes · $[DIARIO] USD/día por conjunto</div>
    </div>
    <div class="params">
      <div class="param"><div class="param-label">Objetivo</div><div class="param-value">Ventas</div></div>
      <div class="param"><div class="param-label">CBO Advantage+</div><div class="param-value">ON</div></div>
      <div class="param"><div class="param-label">Evento de conversión</div><div class="param-value">Compras</div></div>
      <div class="param"><div class="param-label">Objetivo de rendimiento</div><div class="param-value">Maximizar conversiones</div></div>
      <div class="param"><div class="param-label">Calendario</div><div class="param-value">Indefinido</div></div>
      <div class="param"><div class="param-label">Ubicaciones</div><div class="param-value">Advantage+</div></div>
    </div>
    <!-- Conjuntos de anuncios -->
    <div class="conjunto">
      <div class="conjunto-titulo">Conjunto 1 — Abierto</div>
      <div class="conjunto-grid">
        <div>
          <div class="campo-label">Público</div>
          <div class="campo-valor">País, H+M, 18-65+</div>
        </div>
        <div>
          <div class="campo-label">Exclusiones</div>
          <div class="campo-valor">FB 90d · IG 90d · Video +10s 90d · Web 90d · Compradores 180d · Lista clientes</div>
        </div>
      </div>
    </div>
    <!-- Repetir .conjunto para cada conjunto -->
  </div>

</body>
</html>
```

---

## Tipos de anuncios por campaña

Se recomiendan **3 a 6 creativos por tipo de campaña**. Los mismos anuncios van en todos los conjuntos de una misma campaña.

### Presentación
Tipos de creativos recomendados:
1. Demostración
2. Aspiracional
3. Beneficios
4. Educativo
5. Pantalla dividida
6. Humano
7. Prensa

Nivel de consciencia: **Inconsciente, Problema y Solución**.

### Evaluación / Conversión / Ascensión / Retargeting
Tipos de creativos recomendados:
1. Testimonio
2. Prensa
3. Producto
4. Beneficios
5. Promociones

Nivel de consciencia: **Producto y Decisión**.

> 💡 Para generar hooks usa `/diversificacion-creativa`. Para generar prompts de imagen usa la skill de prompts.

**NO generar prompts de imagen ni Nano Banana 2 en esta skill.** Solo listar los tipos de creativos recomendados por campaña.

---

## Notas para Claude

- Calcula los montos con 2 decimales.
- **Presupuesto ≤ $600 USD (o equivalente):** SIEMPRE solo 2 campañas (Presentación 80% + Evaluación 20%). No importa si tiene datos de retargeting.
- **Con datos de retargeting + Ventas:** pregunta al final si tiene catálogo de productos en Meta. Si sí Y presupuesto > $1,000 → activa campaña de Conversión. Si no → omite Conversión.
- **Sin datos de retargeting:** usa siempre la estructura de 2 campañas (Presentación 80% + Retargeting 20%) sin importar el tipo de negocio.
- **Reconocimiento:** omite Conversión directamente sin preguntar, en cualquier escenario.
- **Sin recompra:** NO incluir campaña de Ascensión. Redistribuir su % entre Presentación y Evaluación.
- **Evaluación:** siempre 1 solo conjunto de retargeting 30d. NO usar lookalike en evaluación.
- **Ascensión:** solo si el presupuesto lo permite (> $600). Máximo 1 conjunto.
- **OBLIGATORIO:** El output SIEMPRE es un archivo HTML guardado con la herramienta `Write`. NUNCA generes texto plano, ASCII, tablas markdown ni respuestas en el chat. Siempre guarda un archivo `.html` usando el template definido en "Formato de salida".
- **El HTML SIEMPRE incluye el overlay de disclaimer** que el usuario debe aceptar antes de ver el contenido.
- En el HTML incluir la sección de anuncios recomendados para cada campaña con los tipos de creativos y el nivel de consciencia correspondiente.
- **Divisa:** usa la moneda que el usuario indique. Si no dice, asume USD.

**PROHIBIDO — no inventar ni agregar nada que no esté definido arriba:**
- NO inventes conjuntos de anuncios adicionales a los definidos en este skill
- NO inventes públicos, exclusiones o segmentaciones que no estén listados arriba
- NO agregues campañas que no correspondan según las reglas de presupuesto y audiencia
- NO recomiendes estrategias, embudos ni distribuciones que no estén en este documento
- Si no está escrito en este SKILL.md, NO lo incluyas. Sigue EXACTAMENTE la estructura definida.
- **Formato visual del HTML — estructura de tabs como el Excel de Felipe:**
- El HTML debe tener tabs clickeables por campaña (Presentación | Evaluación | Conversión | Ascensión)
- Cada tab muestra una tabla con dos bloques:
  · **Campaña:** Objetivo | Presupuesto campaña Advantage+ | Presupuesto diario
  · **Conjunto de Anuncios:** Evento de Conversión | Objetivo de rendimiento | Calendario | Público | Exclusiones | Ubicaciones
- Cada conjunto es una fila dentro de la tabla de su campaña
- Usar la paleta FV: fondo `#F5F6F7`, headers `#2e3848`, acentos `#74fbfb`, texto `#2e3848`, Lato
- Footer: fondo `#2e3848`, texto `#8dd0df`
