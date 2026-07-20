# Agente de Campañas — Meta Ads

Sitio web propio (uso personal, no multi-cliente todavía) que conversa igual que la skill
`ejecutor-campanas-meta`: arma el plan, lo muestra, y solo crea campañas en Meta Ads en estado
**pausado** cuando tú lo apruebas. Nunca activa nada por su cuenta.

## Qué necesitas antes de empezar

1. Una cuenta en [GitHub](https://github.com) (gratis).
2. Una cuenta en [Vercel](https://vercel.com) (gratis, te puedes registrar con tu cuenta de
   GitHub directamente).
3. Una llave de API de Anthropic — se saca en https://console.anthropic.com → API Keys. Ojo:
   esto se paga por uso (no es lo mismo que tu plan de Claude.ai).

## Paso 1 — Subir este código a GitHub

Descarga esta carpeta, ábrela en una terminal, y ejecuta:

```bash
cd meta-ads-agent
git add .
git commit -m "Primera versión del agente"
```

Luego, en GitHub.com:
1. Crea un repositorio nuevo (botón verde "New"), sin marcar ninguna casilla de inicialización.
2. GitHub te mostrará unos comandos parecidos a estos — cópialos tal cual te los da (cambian
   según tu usuario):

```bash
git remote add origin https://github.com/TU-USUARIO/meta-ads-agent.git
git branch -M main
git push -u origin main
```

Te pedirá iniciar sesión en GitHub la primera vez — hazlo directamente en la ventana que se abra,
nunca le des tu contraseña ni tu llave a nadie más que a GitHub.

## Paso 2 — Desplegar en Vercel

1. Entra a vercel.com y elige "Add New → Project".
2. Conecta tu cuenta de GitHub y selecciona el repositorio `meta-ads-agent`.
3. Antes de darle a "Deploy", abre "Environment Variables" y agrega:
   - Nombre: `ANTHROPIC_API_KEY`
   - Valor: tu llave de la API de Anthropic
4. Dale a "Deploy". En un par de minutos te da una URL tipo `meta-ads-agent.vercel.app` — esa es
   tu sitio.

## Paso 3 — Conectar tu cuenta de Meta Ads (una sola vez)

La primera vez que le pidas al agente algo que necesite tocar Meta Ads (por ejemplo "revisa mis
campañas activas"), es posible que te devuelva un enlace de autorización de Meta. Ábrelo, inicia
sesión con la cuenta que administra tus clientes, y acepta los permisos. Después de eso, el
agente ya puede leer y crear cosas en las cuentas a las que tengas acceso.

## Cómo probarlo en tu computador antes de subirlo (opcional)

```bash
npm install
cp .env.example .env.local   # y pon tu llave real ahí
npm run dev
```

Abre http://localhost:3000

## Seguridad — qué NO hacer

- Nunca subas `.env.local` a GitHub (ya está bloqueado en `.gitignore`, no lo quites).
- Nunca pongas tu llave de API directamente en el código.
- Este agente está pensado para que **tú** lo uses, administrando tus propias cuentas de
  clientes — no está preparado todavía para que un cliente conecte su propia cuenta de Meta
  desde este sitio (eso requiere aprobación de Meta App Review, es un paso aparte).

## Las 11 skills que ya tiene cargadas

En `/skills` están las mismas skills que usas en Claude.ai. El servidor detecta de qué habla tu
mensaje y carga la que corresponda automáticamente (mira `lib/skills.js` si quieres ajustar las
palabras clave):

- `ejecutor-campanas-meta` — crea campañas de verdad, siempre pausadas.
- `excel-de-estrategia` — arma la estrategia (Presentación/Evaluación/Conversión/Ascensión).
- `3qs` — analiza campañas desde un CSV exportado de Ads Manager (adjúntalo con el clip 📎).
- `analizador-creativos` — deconstruye una imagen de anuncio (adjúntala con el clip 📎).
- `monitor-pixel` y `sugeridor-productos-test` — dependen de un script de Python cada una; el
  agente los ejecuta con la herramienta de "code execution" de Claude, que ya viene activada.
- `espia-competencia` — busca qué está anunciando un competidor o un nicho en la Biblioteca de
  Anuncios de Meta. Usa la herramienta de búsqueda web de Claude. **Requisito:** tu administrador
  de cuenta debe activar "Web search" en console.anthropic.com (Settings → Capabilities) o esta
  skill no podrá buscar nada. Ojo: la Biblioteca de Anuncios carga su contenido de forma dinámica,
  así que a veces no va a poder leer los anuncios directo y te va a pedir que se los pegues tú.
- `auditor-cuenta` — barrido de salud de cuenta (solo lectura): campañas sin gasto, conjuntos
  reiniciando aprendizaje, públicos solapados.
- `calendario-comercial` — cruza fechas comerciales del país/nicho con tu calendario de
  campañas (usa búsqueda web para confirmar fechas exactas de cada año).
- `reporte-cliente` — convierte un análisis técnico en un resumen ejecutivo sin jerga, listo
  para enviarle al cliente.
- `calculadora-ltv-cac` — cruza tu CAC real de Meta contra el LTV calculado con tus datos reales
  de ventas y recompra (no el ROAS de plataforma).
- `generador-hooks` — genera ángulos y ganchos de copy por fórmula y nivel de consciencia,
  usando LF8 y NESB.

**Honestidad sobre esta parte:** no he podido probar en vivo, fuera de este chat, que la
ejecución de código y la carga de archivos funcionen exactamente igual que en Claude.ai. Es muy
probable que funcione, pero si algo falla al usar `monitor-pixel`, `sugeridor-productos-test`,
`3qs` o `analizador-creativos`, tráeme el error y lo ajustamos juntos.

Cuando un reporte sale en formato HTML o Markdown (como `3qs` o `excel-de-estrategia`), el chat
te muestra un botón "⬇ Descargar reporte" — esta app no tiene disco propio, así que en vez de
"guardar el archivo" como hace en Claude.ai, te lo entrega para que lo descargues tú.

## Qué falta (siguientes pasos posibles)

- Historial de conversaciones guardado (hoy se borra al recargar la página).
- Login para que solo tú puedas entrar al sitio.
- Soporte multi-cliente con conexión de Meta Ads por cliente.
