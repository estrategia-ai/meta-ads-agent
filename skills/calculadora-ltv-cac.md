---
id: calculadora-ltv-cac
title: "Calculadora LTV vs CAC — Meta Ads"
description: "Cruza el costo de adquisición real de Meta Ads (CAC) contra el valor de vida del cliente (LTV) calculado con datos reales de ventas/recompra del negocio (no con el ROAS estimado de la plataforma). Da el ratio LTV:CAC y un diagnóstico de salud del negocio. Úsala cuando el usuario pida 'cuánto vale realmente un cliente', 'mi ROAS está bien pero no sé si el negocio es rentable', 'calcula mi LTV', 'compara mi CAC con lo que me deja un cliente', o quiera saber si puede pagar más por adquisición."
plans: premium,pro
---

---
name: calculadora-ltv-cac
description: >
  Cruza el CAC real de Meta Ads contra el LTV calculado con datos reales de ventas y
  recompra del negocio (no el ROAS de plataforma), y da un diagnóstico de salud del ratio
  LTV:CAC.
---

# Calculadora LTV vs CAC

## Por qué existe esta skill

El ROAS que reporta Meta compara gasto contra el valor de la **primera compra**. No sabe si ese
cliente vuelve a comprar, ni cuál es tu margen real. Esta skill calcula lo que sí importa para la
rentabilidad del negocio: cuánto vale un cliente en el tiempo, contra cuánto cuesta conseguirlo.

## Paso 1 — Pedir los datos reales (nunca los asumas)

```
Para el CAC (lo que ya sabemos de Meta):
- Presupuesto/gasto del período
- Clientes nuevos que salieron de ese gasto (no leads, clientes que compraron)

Para el LTV (esto sale de tu negocio, no de Meta):
- Valor promedio de una compra (ticket promedio)
- Margen bruto (%) sobre ese ticket
- ¿Cuántas veces en promedio te vuelve a comprar el mismo cliente? (o el período que
  consideras como "vida" del cliente, ej. 12 meses)
```

Si el usuario no tiene el dato de recompra, pregunta si prefiere:
1. Calcular solo con la primera compra (LTV = ticket × margen), dejando claro que subestima el
   valor real si hay recompra.
2. Estimar la recompra con un supuesto conservador que él mismo defina.

**No inventes una tasa de recompra si el usuario no la sabe.**

## Paso 2 — Calcular

```
CAC = gasto total / clientes nuevos

LTV = ticket promedio × margen bruto (%) × número promedio de compras en el período de vida
```

## Paso 3 — Diagnóstico del ratio

| Ratio LTV:CAC | Lectura |
|---|---|
| < 1:1 | 🔴 Pierdes dinero con cada cliente nuevo — insostenible a este ritmo |
| 1:1 – 2:1 | 🟡 Apenas cubre costos — poco margen para reinvertir o escalar |
| 3:1 | 🟢 Saludable — referencia estándar de la industria |
| > 5:1 | 🟢 Muy saludable — probablemente puedes invertir más en adquisición sin miedo |

Aclara siempre: estos rangos son referencia general, no una regla absoluta — un negocio con
ciclo de venta largo o ticket alto puede ser sano con un ratio distinto.

## Paso 4 — Presentar

En el chat, sin necesidad de archivo (es una cifra puntual, no un reporte largo):

```
CAC: $[X]
LTV: $[Y]
Ratio: [Y/X]:1 — [lectura de la tabla]

[1-2 frases de qué implica esto para cuánto puede pagar por adquisición o si debe ajustar algo]
```

## Reglas

- Nunca mezcles el ROAS de Meta con este cálculo como si fueran lo mismo — son preguntas
  distintas (rentabilidad de la campaña vs. rentabilidad del cliente en el tiempo).
- Si el margen bruto no lo sabe el usuario, no asumas un número — pregúntalo o dile que sin eso
  el cálculo de LTV no es confiable.
- No recomiendes "sube tu presupuesto" solo por un ratio bueno sin considerar si el usuario tiene
  capacidad operativa/inventario para atender más clientes.
