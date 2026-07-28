---
name: monitor-pixel
description: >-
  Monitorea la salud de un Pixel (conjunto de datos / dataset) de Meta Ads. Revisa el
  volumen de eventos, la calidad de coincidencia de cada evento (Event Match Quality / EMQ),
  el estado del dataset, y genera una ALERTA si algún evento cayó más del 20% en los últimos
  7 días respecto a los 7 días previos. Úsala SIEMPRE que el usuario mencione: revisar el
  pixel, salud del pixel, monitorear el pixel, auditar el pixel, eventos del pixel, calidad
  de coincidencia, event match quality, EMQ, cobertura de coincidencia, caída de eventos,
  alerta de eventos, conjunto de datos de Meta, dataset de Meta, píxel de Meta/Facebook, o
  cuando sospeche que el pixel dejó de registrar eventos o perdió calidad. También úsala
  cuando pida revisar si los eventos de su pixel están bajando o si su pixel está sano.
---

# Monitor de Pixel de Meta

Esta skill revisa la salud de un Pixel (Meta lo llama ahora "conjunto de datos" / *dataset*)
y avisa cuando algo se rompe. Responde tres preguntas: ¿están entrando los eventos?,
¿con qué calidad de coincidencia?, y ¿alguno cayó de forma alarmante esta semana?

Se apoya en el conector de **Meta Ads** (herramientas `ads_get_dataset_details`,
`ads_get_dataset_quality`, `ads_get_dataset_stats`) y en un script incluido que hace los
cálculos. El cálculo va en script a propósito: una alerta automática no puede depender de
sumas hechas a ojo sobre cientos de filas.

## Requisito previo: el ID del conjunto de datos

La skill necesita un **dataset ID** (ID del pixel) para funcionar.

- Si el usuario ya lo dio en su mensaje (o lo trae el prompt de una tarea programada),
  úsalo directo y no preguntes.
- Si **no** se proporcionó, pídelo antes de seguir. No lo adivines ni asumas uno de
  contexto previo: correr el reporte sobre el pixel equivocado es peor que no correrlo.

Para encontrarlo, el usuario puede abrir Meta Events Manager → su conjunto de datos → el
número que aparece bajo el nombre. Opcionalmente, `ads_get_datasets` lista los datasets de
una cuenta, pero esa herramienta a veces está limitada por rollout; las tres herramientas
de dataset que usa esta skill funcionan con el `dataset_id` directo.

## Flujo de trabajo

Crea una carpeta de trabajo temporal (por ejemplo en el directorio de salida o `/tmp`) para
guardar las respuestas crudas del conector como archivos `.json`. El script lee esos archivos.

### 1. Calcular la ventana y el punto de corte

Con bash, obtén la hora actual y deriva los timestamps Unix:

```
NOW=$(date +%s)
MIDPOINT=$((NOW-604800))     # hace 7 días — separa la ventana previa de la reciente
START=$((NOW-1209600))      # hace 14 días — inicio de la ventana total
```

Consultas **una sola ventana de 14 días** (`START` → `NOW`) y el script la parte en dos
mitades de 7 días usando `MIDPOINT`.

`ads_get_dataset_stats` solo permite mirar **28 días hacia atrás**, así que esta comparación
(7d vs 7d previos = 14 días) entra sin problema. No intentes comparar contra "el mismo
periodo del mes/trimestre pasado" — el conector no llega tan atrás.

### 2. Identidad y estado del dataset

Llama `ads_get_dataset_details(dataset_id)`. Guarda la respuesta en `details.json`.
Esto da el nombre, si está activo, y la última vez que disparó un evento (navegador y servidor).

### 3. Calidad de coincidencia (EMQ)

Llama `ads_get_dataset_quality(dataset_id)`. Guarda la respuesta en `quality.json`.
Devuelve el EMQ por evento y la cobertura de cada llave de coincidencia (email, teléfono, etc.).

### 4. Volumen de eventos — una consulta por evento

Saca la lista de eventos de `quality.json` (cada entrada, bajo cada canal, trae un
`event_name`). Para **cada evento**, llama:

```
ads_get_dataset_stats(dataset_id, aggregation="event", event_name="<EVENTO>",
                      start_time=START, end_time=NOW)
```

Guarda cada respuesta en su propio archivo: `ev_<EVENTO>.json`.

**Por qué evento por evento y no todo de golpe:** en un pixel de alto volumen, pedir todos
los eventos juntos devuelve una respuesta tan grande que el conector la corta y la guarda en
un archivo que el script no puede alcanzar desde su entorno aislado. Una consulta por evento
siempre devuelve algo chico y manejable, sin importar cuán grande sea el pixel — por eso la
skill es robusta para cualquier cuenta.

Reglas que no se rompen:

- **`aggregation` debe ser `"event"`.** No uses `"event_total_counts"`: devuelve entradas
  duplicadas por evento, sin etiquetar, y no se pueden sumar de forma confiable.
- Si un evento devuelve igual una respuesta demasiado grande (raro, solo eventos altísimos
  como PageView), pídelo en dos tramos de 7 días y guarda ambos archivos — el script los
  acumula igual.

La respuesta trae conteos hora por hora; el script los suma y los reparte por ventana.

### 5. Calcular caídas y detectar alertas

Ejecuta el script incluido (usa la ruta absoluta de esta skill). El patrón `ev_*.json` toma
todos los archivos por evento; el script parte cada uno en las dos mitades de 7 días usando
`MIDPOINT`:

```
python3 <ruta-de-la-skill>/scripts/analyze_pixel.py \
  --stats ev_*.json --midpoint $MIDPOINT \
  --quality quality.json --details details.json \
  --floor 50 --threshold 20
```

El script suma los buckets por evento, los reparte en las dos ventanas de 7 días según el
timestamp de cada bucket, calcula el cambio porcentual, aplica el piso de ruido, marca las
alertas y devuelve el reporte completo en Markdown.

### 6. Presentar el reporte

Muestra la salida del script. **Si hay alertas, ponlas primero** y dilo de frente — el punto
de la skill es que una caída no pase desapercibida. Agrega 1–2 frases de lectura propia si
aporta (p. ej. si la caída coincide con un cambio conocido en la web), pero no inventes causas.

## La regla de la alerta

Un evento dispara **alerta** cuando se cumplen **las dos** condiciones:

1. Cayó **más del 20%** en los últimos 7 días respecto a los 7 previos.
2. La ventana previa tuvo **al menos 50 eventos** (el piso de ruido, parámetro `--floor`).

El piso existe por una razón estadística concreta: en conteos, el ruido relativo ronda
1/√N. Un evento que recibió 6 ocurrencias puede "caer 30%" solo por azar — alertar sobre eso
entrena al usuario a ignorar la skill. Los eventos por debajo del piso se reportan igual
(marcados ⚪ "bajo volumen"), pero no disparan alerta. Si el usuario pide más o menos
sensibilidad, ajusta `--floor` y `--threshold`.

Caso especial: un evento que existía la semana previa y **desaparece** (0 esta semana)
cuenta como caída de -100% — alerta fuerte si tenía volumen.

## Cómo leer el EMQ

El Event Match Quality es un puntaje de 0 a 10 por evento: **≥8 excelente, 6–7.9 aceptable,
4–5.9 bajo, <4 crítico**. Lo que más mueve el score es la cobertura de las llaves de
coincidencia fuertes (email, teléfono, external_id). El reporte marca las llaves con
cobertura débil para que el usuario sepa qué empujar. Ojo: `ads_get_dataset_quality` solo da
el EMQ **actual** — es una foto, no tiene histórico —, así que esta skill no detecta "caídas
de EMQ" en el tiempo, solo reporta el estado de hoy.

## Uso en una tarea programada

Esta skill está pensada para correr también de forma automática (tarea semanal). Una tarea
programada corre sin nadie que conteste preguntas, así que el `dataset_id` **debe venir en
el prompt de la tarea**. Si la skill se invoca sin ID y sin nadie que lo dé, no puede correr.

## Ejemplos de disparo

**Ejemplo 1**
Usuario: "Revísame el pixel, siento que las compras vienen bajando."
Acción: pedir el dataset ID si no lo dio, luego correr el flujo completo.

**Ejemplo 2**
Usuario: "¿Cómo está la calidad de coincidencia de mis eventos del dataset 642774669816359?"
Acción: correr el flujo con ese ID; destacar la sección de EMQ.

**Ejemplo 3** (tarea programada)
Prompt: "Ejecuta monitor-pixel para el dataset 642774669816359."
Acción: correr el flujo directo, sin preguntar; encabezar con alertas si las hay.
