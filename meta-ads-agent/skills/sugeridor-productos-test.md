---
name: sugeridor-productos-test
description: >
  Sugiere qué productos agrupar y testear como conjuntos de productos (product sets) en
  campañas de catálogo / Dynamic Ads de Meta. A partir del gasto por producto de la
  cuenta genera hipótesis de prueba accionables: conjunto de cola subfinanciada, por
  tipo de producto, por variantes del mismo producto, y alerta de gasto sin atribuir.
  Es 100% de SOLO LECTURA — no crea nada y no toca los endpoints de catálogo; corre
  sobre los insights de anuncios. Úsala SIEMPRE que el usuario pregunte qué productos
  testear, qué meter en un conjunto / product set, qué productos probar primero, cuáles
  son buenos candidatos de prueba para DPA, qué productos están subexpuestos o sin
  oportunidad, cómo armar conjuntos de productos para testear, o pida ideas o hipótesis
  de testeo para su catálogo de Meta Ads. No la uses para CREAR conjuntos (eso es
  monitor-catalogo) ni para auditar la salud del catálogo.
---

# Sugeridor de Productos para Testear (DPA)

Este skill responde una sola pregunta: **¿qué productos debería agrupar y testear como
conjuntos de productos?** Analiza cómo se reparte la inversión publicitaria entre los
productos de la cuenta y propone hipótesis de prueba concretas.

**Es de solo lectura.** No crea conjuntos, no modifica el catálogo, no consulta los
endpoints de catálogo (`ads_catalog_*`). Corre enteramente sobre `ads_get_ad_entities`,
el insight de anuncios — por eso es estable: funciona aunque el API de catálogo de Meta
esté caído. Si el usuario quiere *crear* el conjunto, eso es otro skill (monitor-catalogo,
Parte B); este solo sugiere.

## Qué necesitas

- **ad_account_id** — el ID de la cuenta publicitaria. Es lo único obligatorio. No hace
  falta `catalog_id`: el gasto por producto sale de los insights de la cuenta.

Si el usuario no lo dio, pídelo (en Ads Manager arriba a la izquierda, `act_<número>` —
solo el número). No lo adivines.

## Qué hace y qué NO hace — dilo claro en el reporte

- Trabaja con **gasto por producto, no ventas**. El breakdown `product_id` de Meta no
  devuelve conversiones por producto (vuelven "Not available"). Las sugerencias salen de
  *dónde el algoritmo pone el dinero*, no de qué convierte.
- **No ve el inventario sin gasto.** Un breakdown de gasto solo lista productos que
  recibieron presupuesto; los productos nunca anunciados no aparecen. El skill no puede
  sugerir "testea esto que nunca corriste" si nunca corrió — no lo ve.
- Lo que produce son **hipótesis para testear**, no ganadores garantizados. El test es lo
  que confirma; el skill solo dice dónde vale la pena mirar.

Esa honestidad va en el reporte, no escondida — es lo que separa un consejo útil de un
consejo que suena bien y desorienta.

## Flujo

### Paso 1 — Traer el gasto por producto

```
ads_get_ad_entities(ad_account_id, level="account", date_preset="last_30d",
  fields=["amount_spent"], breakdowns=["product_id"],
  sort="amount_spent_descending", limit=50)
```

`last_30d` es el default; usa `last_90d` si el usuario quiere una base más amplia. El
`sort` + `limit=50` mantiene la respuesta chica y trae los productos que importan (el
resto es polvo de gasto). Si aun así la respuesta es enorme y el conector la corta a un
archivo, baja `limit` a 30.

El `product_id` viene como `"<FBID>, <Nombre>"` — separa ambos. Una fila puede venir como
`product_id="unknown"`: es gasto no atribuido a un producto; **consérvala**, el script la
usa para la alerta de gasto sin atribuir.

### Paso 2 — Normalizar y armar `products.json`

Normaliza el gasto a número plano según la moneda de la cuenta — la respuesta lo da
formateado: `"$ 836.793 COP"` → `836793` (COP no usa decimales, el punto es separador de
miles); `"2.513,67 MXN"` → `2513.67` (punto = miles, coma = decimales); USD estándar.

```
{"window": "last_30d", "currency": "<COP/MXN/USD/...>", "products": [
  {"product_id": "<FBID o 'unknown'>", "name": "<nombre>", "spend": <número>}
]}
```

### Paso 3 — Correr el script

El cálculo va en script a propósito: una sugerencia no puede depender de sumas y
porcentajes hechos a ojo sobre decenas de filas.

```
python3 <ruta-de-la-skill>/scripts/analyze_test_candidates.py \
  --products products.json --currency <COP/MXN/USD/...>
```

El script trae umbrales por defecto sensatos; córrelo sin tocarlos salvo que el usuario
pida más o menos sensibilidad. Son ajustables con flags:

- `--concentration-pct` (default 55) — el top 5 de productos por encima de este % del
  gasto se marca como inversión concentrada.
- `--tail-pct` (default 15) — la cola subfinanciada acumula productos, desde el de menor
  gasto, hasta este % del gasto total. Súbelo para un conjunto de prueba más amplio,
  bájalo para uno más ajustado.
- `--unknown-floor` (default 3) — la Hipótesis 4 solo aparece si el gasto sin atribuir
  llega a este % del total. Es un piso de ruido: por debajo, no vale la pena alertar.

### Paso 4 — Presentar

Muestra la salida del script tal cual. Puedes agregar 1–2 frases de lectura propia si
aportan (por ejemplo, atar una hipótesis a algo que sabes del negocio), pero no inventes.
**No crees ningún conjunto** — el skill sugiere; crear el conjunto lo decide y lo hace el
usuario en Commerce Manager (o con monitor-catalogo).

## Las hipótesis que genera el script

- **Cola subfinanciada** — los productos que entre todos suman una porción mínima del
  gasto. El algoritmo casi no los corrió; agrupados en su propio conjunto con presupuesto
  propio, dejan de competir en desventaja y revelan si hay un ganador escondido. Es la
  hipótesis más fuerte cuando la inversión está concentrada.
- **Por tipo de producto** — agrupa por el tipo (primera palabra del nombre: camiseta,
  pantalón, camisa, bundle…) y señala el tipo subexpuesto, candidato a un conjunto propio.
- **Variantes del mismo producto** — productos que aparecen como varias entradas (tallas
  o colores con FBID distinto). El gasto repartido esconde la fuerza real; conviene
  testearlos a nivel de producto padre.
- **Gasto sin producto identificado** — si el bucket `unknown` supera el piso de ruido
  (`--unknown-floor`, 3% por defecto), lo marca: hay que entender ese gasto antes de
  testear nada, porque ensucia toda lectura por producto. Por debajo del piso no aparece.

## Reglas

- Gasto no es venta. Un grupo rankeado por gasto nunca se llama "más vendidos".
- El skill es de solo lectura. Nunca crea un conjunto de productos. Si el usuario lo pide,
  remítelo a monitor-catalogo (Parte B).
- Si el usuario aporta ventas reales por producto (de Shopify o del desglose del catálogo
  en Ads Manager), puedes mencionarlo como mejora: con ventas, las hipótesis pasan de
  "dónde gasta el algoritmo" a "qué rinde de verdad". Pero el skill funciona sin eso.

## Ejemplos de disparo

- "¿Qué productos debería testear en mis campañas de catálogo?" → flujo completo.
- "Dame ideas de qué meter en un product set nuevo." → flujo completo.
- "¿Qué productos de mi cuenta están subexpuestos?" → flujo completo.
- "Arma hipótesis de testeo para mi DPA, cuenta 735567337446757." → corre directo con ese
  ad_account_id.
