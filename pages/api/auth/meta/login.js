// Paso 1 del login con Meta: redirige al usuario a la pantalla de Meta
// donde acepta darle acceso a este sitio a sus cuentas de Meta Ads.
export default function handler(req, res) {
  const appId = process.env.META_APP_ID;
  if (!appId) {
    return res
      .status(500)
      .send("Falta configurar META_APP_ID en las variables de entorno del servidor.");
  }

  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host;
  const redirectUri = `${protocol}://${host}/api/auth/meta/callback`;

  const scope = "ads_management,ads_read,business_management";
  const state = Math.random().toString(36).slice(2);

  const authUrl =
    `https://www.facebook.com/v23.0/dialog/oauth` +
    `?client_id=${encodeURIComponent(appId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${state}` +
    `&response_type=code`;

  res.redirect(authUrl);
}
