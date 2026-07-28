---
id: reporte-cliente
title: "Reporte para Cliente — Meta Ads"
description: "Toma el análisis técnico de una campaña (por ejemplo el de 3qs, o métricas que el usuario describa) y lo convierte en un resumen ejecutivo para enviarle al cliente final: lenguaje de negocio, sin jerga de plataforma (nada de CPM/CTR/ROAS sin explicar), enfocado en resultados y próximos pasos. Úsala cuando el usuario pida 'arma el reporte para mi cliente', 'resume esto para que lo entienda el cliente', 'necesito algo presentable para enviar', o después de generar un análisis técnico si el usuario quiere una versión no técnica."
plans: premium,pro
---

---
name: reporte-cliente
description: >
  Convierte un análisis técnico de campañas (de 3qs u otra fuente) en un resumen ejecutivo
  para el cliente final: lenguaje de negocio, sin jerga de plataforma, enfocado en
  resultados y próximos pasos.
---

> **REGLA DE CONVERSACIÓN:** Genera el archivo y confirma en una línea. El resumen ejecutivo va
> completo en el archivo, no en el chat.

# Reporte para Cliente — Meta Ads

## Paso 1 — Confirmar tono y fuente

Si no lo sabes, pregunta:

```
¿De dónde saco los resultados? (¿ya tienes un análisis de 3qs, o me los describes tú?)
¿Tu cliente es alguien que ya entiende de marketing digital, o prefieres cero tecnicismos?
```

## Paso 2 — Traducir a lenguaje de negocio

Nunca uses en el reporte, sin explicarlo en la misma frase: CPM, CTR, ROAS, CPL, CPC, frecuencia,
optimización, embudo. En su lugar:

| Término técnico | Cómo se dice en el reporte |
|---|---|
| ROAS 4x | Por cada $1 invertido, recuperaste $4 en ventas |
| CPL $12 | Cada cliente potencial costó $12 |
| CTR bajo | Pocas personas se interesaron al ver el anuncio |
| Frecuencia alta | La misma persona vio el anuncio demasiadas veces esta semana |
| Se pausó el anuncio X | Dejamos de mostrar el anuncio que ya no estaba rindiendo, para no gastar de más |

Si el cliente **sí** es sofisticado en marketing (según el Paso 1), puedes usar los términos
técnicos entre paréntesis junto a la traducción, no en vez de ella.

## Paso 3 — Estructura del reporte

1. **Resumen de una línea:** ¿fue un buen período o no, y por qué, en una frase.
2. **Lo que logramos:** 2-4 resultados concretos en números de negocio (ventas, leads, clientes).
3. **Lo que ajustamos:** qué se cambió y por qué, en una frase por cambio.
4. **Qué sigue:** próximos pasos concretos, sin condicionales vagos ("seguiremos optimizando").

## Paso 4 — Guardar

Genera un archivo Markdown simple (sin HTML, esto es para copiar/pegar en un correo o
presentación): `reporte-cliente-[nombre-cliente]-[YYYY-MM-DD].md`. Confirma con una línea:
"✅ Archivo guardado: [nombre].md"

## Reglas

- Nunca inventes resultados o números que no te dieron o que no salieron de un análisis real.
- Si los datos de origen tienen algo negativo, no lo escondas — dilo con el mismo tono directo
  pero sin alarmismo, y enfócalo en la acción que ya se tomó o se va a tomar.
- No repitas aquí las tablas de semáforo técnicas de `3qs` — este reporte es la versión
  destilada, no un duplicado del análisis técnico.
