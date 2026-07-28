---
id: calendario-comercial
title: "Calendario Comercial — Meta Ads"
description: "Cruza las fechas comerciales clave del país y nicho del usuario (Black Friday, Cyber Monday, Día de la Madre/Padre, Navidad, quincenas, temporadas propias del negocio) con su calendario de campañas de Meta Ads, para detectar si una campaña de Ascensión/Conversión debe armarse con anticipación. Úsala cuando el usuario pida 'qué fechas comerciales vienen', 'cuándo debo lanzar mi campaña de [fecha]', 'planea mi calendario de campañas', o quiera anticiparse a una temporada alta."
plans: premium,pro
---

---
name: calendario-comercial
description: >
  Cruza fechas comerciales clave (Black Friday, Día de la Madre, quincenas, etc.) del país
  y nicho del usuario con su calendario de campañas de Meta Ads, y alerta cuándo debe
  empezar a armar cada campaña para llegar con aprendizaje completado a tiempo.
---

# Calendario Comercial — Meta Ads

## Paso 1 — Contexto

Pregunta (si no lo dio ya):

```
¿Para qué país y nicho armo el calendario?
¿Qué ventana quieres planear? (próximos 30 / 60 / 90 días)
```

## Paso 2 — Traer las fechas reales (nunca las inventes de memoria)

Las fechas comerciales cambian de año a año (Black Friday es el viernes después de Acción de
Gracias en EE. UU., que no cae el mismo día cada año; en Latinoamérica hay fechas propias como
"Hot Sale" o "Buen Fin" con fechas que Meta/el comercio local confirma cada temporada). **Usa
búsqueda web para confirmar las fechas exactas del año en curso** para el país indicado — no las
calcules ni las asumas de memoria.

Incluye también, sin necesidad de buscar (son fijas):
- Quincenas / días de pago típicos del país (ej. 15 y 30 en muchos países de LATAM)
- Fechas propias del nicho del usuario, si las mencionó (ej. inicio de semestre para un negocio
  educativo)

## Paso 3 — Cruzar con las campañas del usuario

Si el usuario tiene una estrategia de `excel-de-estrategia` o campañas activas descritas en la
conversación, cruza cada fecha comercial relevante contra ellas:

- **Regla de anticipación:** una campaña de Conversión/Ascensión necesita idealmente **7-14 días
  de aprendizaje ya completado** antes del pico de la fecha comercial. Si el usuario planea
  lanzarla menos de esos días antes, márcalo como alerta.
- Si no tiene ninguna campaña planeada para una fecha importante que sí aplica a su nicho,
  señálalo como oportunidad, no como error.

## Paso 4 — Presentar

Lista cronológica simple en el chat:

```
📅 [Fecha] — [Nombre de la fecha comercial]
   Para llegar con aprendizaje listo, deberías tener la campaña corriendo desde: [fecha límite]
   Estado: [🟢 ya la tienes lista / 🟡 hay que apurarse / 🔴 ya se pasó la ventana ideal]
```

## Reglas

- Nunca afirmes una fecha comercial sin haberla confirmado por búsqueda si cambia año a año.
- No inventes campañas o presupuestos del usuario — solo trabaja con lo que él te dio o lo que
  ya existe en la conversación.
- Si el nicho no tiene fechas comerciales obvias además de las genéricas del país, dilo — no
  fuerces relevancia donde no la hay.
