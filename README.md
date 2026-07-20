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

Esto es un clic desde el sitio ("Conectar con Meta"), pero antes hay que crear una app en Meta
for Developers para que ese botón tenga con qué autenticarse:

1. Ve a [developers.facebook.com/apps](https://developers.facebook.com/apps), inicia sesión con
   la cuenta que administra tus clientes en Business Manager.
2. **"Create App"** → tipo **"Business"** → nómbrala, ej. `Meta Ads Agent`.
3. Agrega el producto **"Facebook Login"** (o "Facebook Login for Business") → "Set Up".
4. En "Facebook Login" → "Settings", en **"Valid OAuth Redirect URIs"** pega:
   ```
   https://TU-DOMINIO-DE-VERCEL.vercel.app/api/auth/meta/callback
   ```
   (el dominio real que te dio Vercel). Guarda.
5. En "App Settings" → "Basic", copia el **App ID** y el **App Secret** (clic en "Show").
6. En Vercel → Settings → Environment Variables, agrega:
   - `META_APP_ID` → el App ID
   - `META_APP_SECRET` → el App Secret
   Y vuelve a desplegar (Redeploy).
7. Entra a tu sitio y haz clic en **"Conectar con Meta"** — acepta los permisos, listo.

No necesitas pasar por la revisión de Meta (App Review): mientras la app esté en modo
"Development" y tú seas su administrador, puedes usarla contigo mismo sin restricciones.

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
