// Paso 2 del login con Meta: Meta redirige aquí después de que el usuario
// acepta. Cambiamos el código que nos manda por un token de acceso real,
// lo extendemos a larga duración (~60 días), y lo guardamos en una cookie
// segura que solo el servidor puede leer (nunca el navegador).
export default async function handler(req, res) {
  const { code, error, error_description } = req.query;

  if (error) {
    return res
      .status(400)
      .send(`Meta devolvió un error al autorizar: ${error_description || error}`);
  }
  if (!code) {
    return res.status(400).send("Falta el código de autorización de Meta.");
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    return res
      .status(500)
      .send("Falta configurar META_APP_ID o META_APP_SECRET en las variables de entorno.");
  }

  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host;
  const redirectUri = `${protocol}://${host}/api/auth/meta/callback`;

  try {
    // 1. Cambiar el código por un token de corta duración.
    const tokenRes = await fetch(
      `https://graph.facebook.com/v23.0/oauth/access_token` +
        `?client_id=${encodeURIComponent(appId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&client_secret=${encodeURIComponent(appSecret)}` +
        `&code=${encodeURIComponent(code)}`
    );
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return res
        .status(400)
        .send(`Error al obtener el token de Meta: ${JSON.stringify(tokenData)}`);
    }

    // 2. Cambiarlo por uno de larga duración (~60 días) para no tener que
    //    repetir este login cada hora.
    const longRes = await fetch(
      `https://graph.facebook.com/v23.0/oauth/access_token` +
        `?grant_type=fb_exchange_token` +
        `&client_id=${encodeURIComponent(appId)}` +
        `&client_secret=${encodeURIComponent(appSecret)}` +
        `&fb_exchange_token=${encodeURIComponent(tokenData.access_token)}`
    );
    const longData = await longRes.json();
    const finalToken = longData.access_token || tokenData.access_token;
    const expiresIn = longData.expires_in || tokenData.expires_in || 3600;

    // 3. Guardar el token real en una cookie httpOnly (invisible para el
    //    navegador/JS) y una cookie aparte, solo informativa, para que la
    //    interfaz sepa mostrar "conectado".
    res.setHeader("Set-Cookie", [
      `meta_token=${finalToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${expiresIn}`,
      `meta_connected=1; Secure; SameSite=Lax; Path=/; Max-Age=${expiresIn}`,
    ]);

    res.redirect("/?meta=connected");
  } catch (err) {
    console.error("Error en el callback de Meta:", err);
    res.status(500).send("Error conectando con Meta. Intenta de nuevo.");
  }
}
