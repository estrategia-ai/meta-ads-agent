---
id: auditor-cuenta
title: "Auditor de Cuenta — Meta Ads"
description: "Barrido de salud de una cuenta de Meta Ads: campañas activas sin gasto real, conjuntos que reinician constantemente su fase de aprendizaje por ediciones frecuentes, y solapamiento de públicos entre campañas del mismo embudo (ej. Presentación compitiendo contra Retargeting por no excluirse entre sí). Es 100% de SOLO LECTURA — no cambia nada en la cuenta. Úsala cuando el usuario pida 'audita mi cuenta', 'revisa la salud de mi cuenta', 'algo anda mal en mi cuenta', 'por qué mis campañas no aprenden', o quiera un chequeo general antes de escalar presupuesto."
plans: premium,pro
---

---
name: auditor-cuenta
description: >
  Barrido de salud de una cuenta de Meta Ads: campañas activas sin gasto, conjuntos que
  reinician su aprendizaje por ediciones frecuentes, y solapamiento de públicos entre
  campañas del mismo embudo. Solo lectura, no modifica nada.
---

> **REGLA DE SOLO LECTURA:** Esta skill nunca pausa, activa ni edita nada. Si encuentra un
> problema, lo reporta y pregunta si el usuario quiere corregirlo — la corrección la hace el
> usuario o una skill aparte (`ejecutor-campanas-meta` para estructura, edición manual para lo
> demás), nunca esta.

# Auditor de Cuenta — Meta Ads

## Qué necesitas

- **ad_account_id** — si el usuario maneja varias cuentas, confirma cuál antes de empezar. No lo
  asumas.

## Flujo

### 1. Campañas activas sin gasto real

Trae las campañas/conjuntos activos de los últimos 7-14 días con su gasto (usa las herramientas
de lectura de entidades/insights del conector de Meta Ads — si no las tienes cargadas, búscalas
con `tool_search`, por ejemplo "ads get entities insights meta"). Marca en 🔴 cualquier campaña
o conjunto en estado ACTIVE con gasto $0 en ese período — o está mal configurado, o Meta no lo
está entregando por algún bloqueo (revisión de anuncio, público demasiado angosto, etc.).

### 2. Conjuntos que reinician su aprendizaje

Usa `ads_account_get_activity_logs` filtrando `event_category=ad_set` en la ventana de los
últimos 14-30 días. Cuenta cuántas veces se editó presupuesto, targeting o creativo del mismo
conjunto. **Más de 2-3 ediciones significativas en 7 días** reinicia la fase de aprendizaje cada
vez — márcalo en 🟡 y dile al usuario que cada edición cuenta, aunque la intención sea "optimizar".

### 3. Solapamiento de públicos entre campañas del mismo embudo

Compara el targeting de los conjuntos activos entre sí (mismo ad_account, mismo período):

- ¿Un conjunto de "Abierto"/Presentación **no** excluye las audiencias de retargeting/clientes
  que sí corren en otra campaña activa? Si no las excluye, ambos conjuntos compiten por la misma
  persona en la misma subasta — ineficiencia clásica.
- ¿Dos conjuntos de campañas distintas targetean exactamente el mismo público sin exclusión
  mutua? Marca en 🟡 y sugiere la exclusión que falta.

### 4. Presentar el reporte

Resumen breve en el chat (no generes HTML aquí, es un chequeo rápido, no un informe formal):

```
🔴 [n] campañas/conjuntos activos sin gasto
🟡 [n] conjuntos con ediciones frecuentes (aprendizaje reiniciado)
🟡 [n] solapamientos de público detectados

[Detalle punto por punto, con el nombre de cada entidad y qué se encontró]
```

Termina preguntando: "¿Quieres que ajuste alguno de estos? Puedo pausar, editar exclusiones o
corregir presupuesto, pero primero confírmame cuál y qué cambio exactamente."

## Reglas

- Nunca cambies nada sin que el usuario lo pida explícitamente, entidad por entidad.
- No marques como problema algo que no tenga evidencia clara — si los datos son insuficientes
  (cuenta muy nueva, poco historial), dilo en vez de forzar un diagnóstico.
- Si la cuenta no tiene campañas activas, dilo directo: "no hay nada que auditar, no tienes
  campañas activas ahora mismo."
