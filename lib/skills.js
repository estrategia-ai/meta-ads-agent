const fs = require("fs");
const path = require("path");

// Quita el frontmatter (todo lo que va entre --- y --- al inicio, incluida
// la segunda repetición que usan estas skills) y deja solo el cuerpo real
// de instrucciones.
function stripFrontmatter(raw) {
  const parts = raw.split(/^---\s*$/m);
  // parts[0] = "" antes del primer ---, parts[1] = frontmatter 1,
  // parts[2] puede ser frontmatter 2 (formato usado por estas skills) o ya el cuerpo.
  if (parts.length <= 2) return raw;
  // Si el bloque 2 también parece frontmatter (tiene "name:" o "description:"),
  // el cuerpo real empieza después del tercer "---".
  if (/^\s*(name:|description:)/.test(parts[2] || "")) {
    return parts.slice(3).join("---").trim();
  }
  return parts.slice(2).join("---").trim();
}

// Palabras clave por skill, sacadas de la descripción con la que ya
// disparan en Claude.ai. No hace falta que sea perfecto: si no matchea
// ninguna, el agente ve el menú completo y puede preguntar o decidir.
const SKILLS = [
  {
    id: "ejecutor-campanas-meta",
    file: "ejecutor-campanas-meta.md",
    keywords: [
      "ejecuta", "ejecutar", "crea las campañas", "crea campañas",
      "sube esta estrategia", "sube la estrategia", "materializa",
      "crea la estrategia en meta", "publica la estrategia",
    ],
  },
  {
    id: "excel-de-estrategia",
    file: "excel-de-estrategia.md",
    keywords: [
      "estrategia", "excel de estrategia", "cuánto presupuesto",
      "cuántas campañas", "qué audiencias", "distribuir mi presupuesto",
      "arma mi estrategia", "estructura de campañas",
    ],
  },
  {
    id: "3qs",
    file: "3qs.md",
    keywords: [
      "3 q", "3q", "analiza mis campañas", "revisa mis campañas",
      "por qué no convierte", "roas", "cpl", "cpm", "cpc", "ctr",
      "frecuencia", "costo por resultado", "csv", "reporte de ads manager",
      "qué pausar", "qué escalar",
    ],
  },
  {
    id: "analizador-creativos",
    file: "analizador-creativos.md",
    keywords: [
      "analiza este ad", "analiza este anuncio", "por qué funciona este anuncio",
      "deconstruye", "reverse engineer", "analiza esta imagen",
      "analiza este creativo", "qué técnicas usa este creativo",
    ],
  },
  {
    id: "monitor-pixel",
    file: "monitor-pixel.md",
    keywords: [
      "pixel", "píxel", "dataset", "conjunto de datos", "event match quality",
      "emq", "calidad de coincidencia", "caída de eventos", "eventos del pixel",
    ],
    extraFiles: ["scripts/analyze_pixel.py"],
  },
  {
    id: "sugeridor-productos-test",
    file: "sugeridor-productos-test.md",
    keywords: [
      "qué productos testear", "product set", "conjunto de productos",
      "productos subexpuestos", "hipótesis de testeo", "dpa", "catálogo",
    ],
    extraFiles: ["scripts/analyze_test_candidates.py"],
  },
  {
    id: "espia-competencia",
    file: "espia-competencia.md",
    keywords: [
      "espía", "espia", "competencia", "competidor", "qué está anunciando",
      "que esta anunciando", "biblioteca de anuncios", "ads library",
      "qué se está anunciando", "que se esta anunciando", "qué está funcionando en meta",
    ],
  },
  {
    id: "auditor-cuenta",
    file: "auditor-cuenta.md",
    keywords: [
      "audita mi cuenta", "salud de mi cuenta", "algo anda mal", "no aprenden",
      "auditoria de cuenta", "auditoría de cuenta", "chequeo general",
    ],
  },
  {
    id: "calendario-comercial",
    file: "calendario-comercial.md",
    keywords: [
      "fechas comerciales", "calendario de campañas", "black friday", "cyber monday",
      "día de la madre", "dia de la madre", "temporada alta", "planea mi calendario",
    ],
  },
  {
    id: "reporte-cliente",
    file: "reporte-cliente.md",
    keywords: [
      "reporte para mi cliente", "resume esto para el cliente", "para enviar al cliente",
      "algo presentable", "resumen ejecutivo",
    ],
  },
  {
    id: "calculadora-ltv-cac",
    file: "calculadora-ltv-cac.md",
    keywords: [
      "ltv", "cac", "valor de vida del cliente", "cuánto vale un cliente",
      "cuanto vale un cliente", "rentabilidad del negocio", "recompra",
    ],
  },
  {
    id: "generador-hooks",
    file: "generador-hooks.md",
    keywords: [
      "hooks", "ganchos", "ángulos para mi anuncio", "angulos para mi anuncio",
      "ideas de anuncio", "no se me ocurre", "diversificacion-creativa", "diversificación creativa",
    ],
  },
];

function loadSkillBody(skill) {
  const raw = fs.readFileSync(path.join(process.cwd(), "skills", skill.file), "utf8");
  let text = `\n\n## SKILL: ${skill.id}\n\n${stripFrontmatter(raw)}`;

  if (skill.extraFiles) {
    for (const rel of skill.extraFiles) {
      const scriptSrc = fs.readFileSync(path.join(process.cwd(), "skills", rel), "utf8");
      text += `\n\n### Script bundleado (${rel})\n`;
      text += `Esta skill depende de un script de Python para los cálculos exactos. `;
      text += `Usa la herramienta de ejecución de código: primero escribe este archivo `;
      text += `tal cual en el sandbox (por ejemplo en /tmp/${path.basename(rel)}), y `;
      text += `luego ejecútalo como indica la skill de arriba.\n\n`;
      text += "```python\n" + scriptSrc + "\n```\n";
    }
  }
  return text;
}

// Decide qué skills cargar completas para este mensaje. Puede devolver varias
// si el mensaje toca más de un tema.
function pickSkills(userText) {
  const lower = (userText || "").toLowerCase();
  const matched = SKILLS.filter((s) => s.keywords.some((k) => lower.includes(k)));
  return matched;
}

function buildSkillsContext(userText) {
  const matched = pickSkills(userText);

  if (matched.length === 0) {
    // Nada matcheó con certeza: dale al modelo el menú de qué hay disponible,
    // para que decida o pregunte, en vez de cargar las 6 completas siempre
    // (serían decenas de miles de tokens en cada mensaje).
    const menu = SKILLS.map((s) => `- ${s.id}`).join("\n");
    return `\n\nTienes estas skills disponibles pero ninguna matcheó claramente con el último mensaje:\n${menu}\nSi el mensaje del usuario corresponde claramente a una, pídele que lo confirme o procede con la más probable. Si no aplica ninguna, actúa como agente general de Meta Ads.`;
  }

  return matched.map(loadSkillBody).join("\n\n");
}

module.exports = { pickSkills, buildSkillsContext, SKILLS };
