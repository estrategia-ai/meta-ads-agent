---
id: espia-competencia
title: "Espía de Competencia — Biblioteca de Anuncios de Meta"
description: "Analiza qué anuncios está corriendo un competidor o qué se está anunciando en un nicho, usando la Biblioteca de Anuncios pública de Meta (facebook.com/ads/library). Detecta anuncios que llevan tiempo activos (señal de que están funcionando), identifica patrones de gancho/oferta/formato repetidos entre varios anunciantes, y puede pasar cualquier anuncio encontrado por analizador-creativos para un brief profundo de por qué funciona. Úsala cuando el usuario pida 'qué está anunciando [competidor]', 'espía a mi competencia', 'qué anuncios corren en mi nicho', 'qué se está anunciando en [industria/país]', 'ads library', 'biblioteca de anuncios', o quiera inspiración/validación de ángulos antes de crear una campaña nueva."
plans: premium,pro
---

---
name: espia-competencia
description: >
  Analiza qué anuncios está corriendo un competidor o un nicho completo, usando la
  Biblioteca de Anuncios pública de Meta. Detecta anuncios con permanencia larga (señal de
  que funcionan), extrae patrones repetidos entre anunciantes, y puede encadenar con
  analizador-creativos para un brief profundo de un anuncio puntual.
---

> **REGLA DE HONESTIDAD DE DATOS:** Meta NO expone gasto ni impresiones exactas para anuncios
> comerciales normales (eso solo existe para anuncios políticos/de interés público). La única
> señal disponible es **cuánto tiempo lleva un anuncio activo sin que el anunciante lo pause** —
> úsala como proxy de "esto probablemente funciona", nunca como dato de inversión. Nunca inventes
> cifras de gasto, impresiones o alcance que no puedas confirmar.

> **PROHIBIDO disparar otras skills automáticamente:** ofrece encadenar con
> `analizador-creativos` sobre un anuncio puntual, pero no lo ejecutes sin que el usuario lo pida.

# Espía de Competencia — Biblioteca de Anuncios de Meta

## Paso 1 — Definir qué buscar

Pregunta (si no lo dio ya):

```
¿Qué quieres investigar?
1. Un competidor específico (nombre de su página o marca)
2. Un nicho o palabra clave (ej. "cursos de inglés online")

¿Y en qué país? (la Biblioteca de Anuncios filtra por país de entrega)
```

## Paso 2 — Intentar traer los anuncios reales

Construye la URL pública de la Biblioteca de Anuncios con lo que te dieron:

```
https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=<CÓDIGO_PAÍS>&q=<búsqueda>&search_type=keyword_unordered
```

Intenta traer el contenido con búsqueda/fetch web. **Aviso honesto:** esta página carga su
contenido de forma dinámica (JavaScript), así que es común que la herramienta de búsqueda no
traiga el detalle real de los anuncios — puede traer poco o nada útil. Es un intento, no una
garantía.

**Si no se pudo traer contenido útil real:**

Dile al usuario, sin rodeos, que la herramienta no pudo leer la página directamente, y pídele
que la abra él mismo y te pegue lo que ve — no necesitas que sepa nada técnico, solo:

```
Abre este link: [URL que armaste arriba]

Y pégame, para los 5-10 anuncios que más se repitan o te llamen la atención:
- Una captura de pantalla o el texto del anuncio
- Hace cuánto lo has visto corriendo (si lo sabes)
```

Espera lo que te pegue antes de seguir. **No inventes anunciantes ni anuncios que no hayas
confirmado por fetch exitoso o porque el usuario te los pegó.**

## Paso 3 — Analizar lo que se encontró (real o pegado)

Para cada anuncio confirmado, identifica:

- Anunciante / marca
- Tipo de creativo (imagen, video, carrusel)
- Gancho principal (la primera línea o los primeros 2 segundos)
- Oferta / propuesta central
- Formato de CTA
- Hace cuánto está corriendo, si se sabe (proxy de que funciona; si no se sabe, dilo)

## Paso 4 — Patrones y siguiente paso

Cierra con un resumen de **patrones repetidos entre los anuncios encontrados** (mismo tipo de
gancho, misma oferta, mismo formato) — eso es la inteligencia accionable, más que cualquier
anuncio individual.

Ofrece, sin ejecutarlo solo:

```
Si quieres el desglose profundo de alguno de estos (por qué funciona, nivel de consciencia,
fórmula de persuasión), pásame la imagen y corro analizador-creativos sobre él.
```

## Reglas

- Nunca afirmes gasto, presupuesto o impresiones de un anuncio comercial normal — no existen esos
  datos públicos. Si el usuario insiste en pedirlos, explica esta limitación de Meta.
- No niveles automáticamente entre "seguro que funciona" — la permanencia es una señal, no una
  prueba. Dilo así en el reporte.
- Si el usuario da un nicho muy amplio ("moda"), pide que lo acote (ej. "moda femenina fast
  fashion Colombia") — una búsqueda demasiado amplia no rinde nada útil.
