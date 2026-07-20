---
id: generador-hooks
title: "Generador de Hooks — Meta Ads"
description: "Genera ángulos y ganchos de copy para anuncios de Meta Ads, organizados por fórmula de copywriting y nivel de consciencia del mercado (Schwartz), apoyado en las 8 Fuerzas de Vida (LF8) y el marco NESB. Puede alimentarse de patrones detectados por espia-competencia o de un análisis de analizador-creativos. Úsala cuando el usuario pida 'dame ideas de hooks', 'ángulos para mi anuncio', 'ganchos para [producto]', 'no se me ocurre cómo empezar el anuncio', o mencione /diversificacion-creativa."
plans: premium,pro
---

---
name: generador-hooks
description: >
  Genera ángulos y ganchos de copy para anuncios de Meta Ads, organizados por fórmula de
  copywriting y nivel de consciencia del mercado, apoyado en LF8 y NESB. Puede alimentarse
  de espia-competencia o analizador-creativos.
---

> **PROHIBIDO disparar otras skills automáticamente:** si el usuario menciona que quiere
> validar estos hooks contra la competencia, ofrece correr `espia-competencia`, no lo hagas solo.

# Generador de Hooks — Meta Ads

## Paso 1 — Contexto del producto/oferta

Si no lo tienes, pregunta:

```
¿Qué producto/oferta es, y para quién es? (avatar: quién lo compra y qué problema resuelve)
¿En qué nivel de consciencia está tu audiencia? (si no sabes, dime y te ayudo a ubicarlo:
Sin Consciencia / Consciente del Problema / de la Solución / del Producto / Más Consciente)
¿Cuántos hooks quieres? (default: 8, uno por fórmula distinta)
```

Si el usuario ya corrió `espia-competencia` o `analizador-creativos` en la conversación y hay
patrones detectados, úsalos como insumo — pero no los copies literal, son inspiración de
estructura, no el hook final.

## Paso 2 — Generar por fórmula (no repitas la misma fórmula dos veces)

Para cada hook, usa una fórmula distinta:

1. Brecha de curiosidad
2. Beneficio directo
3. Pregunta que interpela al avatar
4. Comando/imperativo
5. Antes/después
6. Prueba social ("cómo [X personas] lograron...")
7. Ángulo de noticia/actualidad
8. Contraste "nosotros vs. la forma en que lo hacías antes"

Para cada hook, indica en una línea:
- **LF8 que apunta** (de las 8 Fuerzas de Vida)
- **Nivel de consciencia** al que está calibrado

## Paso 3 — Presentar

Lista directa en el chat (no requiere archivo, es material para iterar en la conversación):

```
1. [Fórmula] — "[Hook]"
   LF8: [cuál] · Consciencia: [nivel]

2. [Fórmula] — "[Hook]"
   ...
```

Si el usuario pide guardarlo, ofrece un archivo Markdown simple.

## Reglas

- No generes hooks genéricos de plantilla ("Descubre el secreto de...") sin adaptarlos al
  producto/avatar específico que te dieron — cada hook debe poder identificarse con ESTE
  producto, no con cualquier producto.
- No inventes datos de prueba social (cifras, testimonios) — si un hook los necesita, dilo como
  placeholder claro: "[cifra real del cliente aquí]", nunca un número inventado.
- No generes contenido que haga afirmaciones de salud, ingresos garantizados u otras promesas
  que puedan meter al usuario en problemas regulatorios — si el producto es de una categoría
  sensible (salud, finanzas), avisa y sugiere un ángulo más conservador.
