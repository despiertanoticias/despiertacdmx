// Junta las notas de content/notas/*.json y los datos de content/hoy.json
// en assets/datos.js, que lee el sitio. Netlify lo ejecuta en cada publicación.
// Además genera, sin depender de JavaScript en el navegador:
//   - notas/<slug>/index.html  una página estática por nota (URL limpia)
//   - sitemap.xml              todas las URLs /notas/<slug>/ con su lastmod
//   - netlify/mapa-notas.js    id antiguo -> slug, para la Edge Function que
//                              redirige nota.html?id=<id> con 301
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { agregarVivo } from "./vivo.mjs";

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CARPETA = path.join(RAIZ, "content/notas");
const SITIO = "https://despiertacdmx.com";
const NOMBRE = "Despierta Ciudad de México";
const SECCIONES = ["ciudad","nacional","politica","economia","internacional","entretenimiento","tecnologia","educacion","deportes"];
const CATS = {ciudad:"Ciudad",nacional:"Nacional",politica:"Política",economia:"Economía",internacional:"Internacional",entretenimiento:"Entretenimiento",tecnologia:"Tecnología",educacion:"Educación",deportes:"Deportes"};
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const ZONA = "-06:00"; // Ciudad de México, sin horario de verano desde 2022
const MAX_NOTAS = 600; // las más recientes que van en assets/datos.js

const errores = [];
const notas = [];
for (const archivo of fs.readdirSync(CARPETA).filter(f => f.endsWith(".json"))) {
  let o;
  try { o = JSON.parse(fs.readFileSync(path.join(CARPETA, archivo), "utf8")); }
  catch (e) { errores.push(`${archivo}: JSON inválido (${e.message})`); continue; }
  const id = archivo.replace(/\.json$/, "");
  if (!o.titulo) errores.push(`${archivo}: falta "titulo"`);
  if (!SECCIONES.includes(o.seccion)) errores.push(`${archivo}: sección "${o.seccion}" no existe`);
  if (!/^\d{4}-\d{2}-\d{2}/.test(o.fecha || "")) errores.push(`${archivo}: fecha inválida`);
  if (o.borrador) continue;
  const f = String(o.fecha || "").replace(" ", "T").slice(0, 16);
  notas.push({
    id,
    t: String(o.titulo || "").trim(),
    c: o.seccion,
    f,
    m: String(o.modificado || "").replace(" ", "T").slice(0, 16) || f,
    r: String(o.resumen || "").trim(),
    b: String(o.cuerpo || "").trim(),
    img: o.imagen_tema || "",
    foto: o.imagen || "",
    cred: o.credito || "",
    src: (o.fuentes || []).filter(s => s && s.enlace).map(s => [s.medio || s.enlace, s.enlace]),
    dest: !!o.destacada,
    p: !!o.patrocinado,
    a: o.autor || "Redacción"
  });
}
if (errores.length) {
  console.error("Errores en las notas:\n- " + errores.join("\n- "));
  process.exit(1);
}

// Slug derivado del titular. Se asigna de la nota más antigua a la más nueva,
// así una nota vieja conserva su URL aunque después llegue otra con el mismo titular.
function slugify(t) {
  return t.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90).replace(/-+$/, "") || "nota";
}
const usados = new Set();
[...notas].sort((a, b) => (a.f + a.id < b.f + b.id ? -1 : 1)).forEach(n => {
  const base = slugify(n.t);
  let s = base, i = 2;
  while (usados.has(s)) s = `${base}-${i++}`;
  usados.add(s);
  n.s = s;
});

notas.sort((a, b) => (a.f < b.f ? 1 : a.f > b.f ? -1 : 0));
const hoy = JSON.parse(fs.readFileSync(path.join(RAIZ, "content/hoy.json"), "utf8"));
const salida = "/* Generado por scripts/build.mjs — no editar a mano. */\n" +
  "window.NOTAS=" + JSON.stringify(notas.slice(0, MAX_NOTAS).map(({ m, ...n }) => n)) + ";\n" +
  "window.HOY=" + JSON.stringify(hoy) + ";\n";
fs.writeFileSync(path.join(RAIZ, "assets/datos.js"), salida);

// Archivo: cada nota en assets/notas/<id>.json. datos.js solo lleva las MAX_NOTAS más recientes;
// nota.html carga de aquí las más viejas para que sus enlaces sigan funcionando.
const ARCHIVO = path.join(RAIZ, "assets/notas");
fs.rmSync(ARCHIVO, { recursive: true, force: true });
fs.mkdirSync(ARCHIVO, { recursive: true });
for (const n of notas) fs.writeFileSync(path.join(ARCHIVO, n.id + ".json"), JSON.stringify(n));
const v = crypto.createHash("md5").update(salida).digest("hex").slice(0, 10);

// En Netlify, cada página pide assets/datos.js?v=<huella> para que el navegador
// nunca use una lista de notas vieja después de publicar.
if (process.env.NETLIFY) {
  for (const html of fs.readdirSync(RAIZ).filter(f => f.endsWith(".html"))) {
    const p = path.join(RAIZ, html);
    const antes = fs.readFileSync(p, "utf8");
    const despues = antes.replace(/assets\/datos\.js(\?v=[0-9a-f]*)?"/g, `assets/datos.js?v=${v}"`);
    if (despues !== antes) fs.writeFileSync(p, despues);
  }
}

// ---------- páginas estáticas por nota ----------
const IMG = (() => {
  const w = {};
  new Function("window", fs.readFileSync(path.join(RAIZ, "assets/imagenes.js"), "utf8"))(w);
  return w.IMAGENES || {};
})();
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const urlNota = n => `/notas/${n.s}/`;
const fechaLarga = f => { const [a, m, d] = f.slice(0, 10).split("-"); return `${parseInt(d, 10)} de ${MESES[parseInt(m, 10) - 1]} de ${a}`; };
const iso = f => (f.length === 10 ? f + "T00:00" : f) + ":00" + ZONA;
const absoluta = u => /^https?:/.test(u) ? u : SITIO + "/" + u.replace(/^\/+/, "");
function imagenDe(n, ancho = 1400) {
  if (n.foto) return absoluta(n.foto);
  const m = IMG[n.img];
  if (!m) return "";
  if (/^(img\/|\/img\/|https?:)/.test(m.file)) return absoluta(m.file);
  return "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(m.file) + "?width=" + ancho;
}
const relEnlace = n => (n.p ? "sponsored noopener" : "noopener");
function parrafos(n) {
  const rel = relEnlace(n);
  if (!n.b) return n.r ? `<p>${esc(n.r)}</p>` : "";
  let out = n.r ? `<p><strong>${esc(n.r)}</strong></p>` : "";
  n.b.split(/\n\s*\n/).forEach(p => {
    p = p.trim(); if (!p) return;
    const h = esc(p).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, `<a href="$2" target="_blank" rel="${rel}" style="text-decoration:underline">$1</a>`)
      .replace(/\n/g, "<br>");
    out += /^#{1,3} /.test(p) ? `<h2 style="font-size:24px;margin:24px 0 10px">${h.replace(/^#{1,3} /, "")}</h2>` : `<p>${h}</p>`;
  });
  return out;
}
const navLinks = c => `<li><a href="/">Portada</a></li>` + SECCIONES.map(s => `<li><a href="/seccion.html?s=${s}"${s === c ? ' aria-current="page"' : ""}>${CATS[s]}</a></li>`).join("");

function paginaNota(n) {
  const url = SITIO + urlNota(n);
  const titulo = `${n.t} · ${NOMBRE}`;
  const desc = (n.r || n.b || n.t).replace(/\s+/g, " ").slice(0, 300);
  const imagen = imagenDe(n) || SITIO + "/assets/logo.png";
  const m = IMG[n.img] || {};
  const credito = n.foto ? esc(n.cred || "") : esc(m.alt || "");
  const etiqueta = n.p ? `<p class="patrocinado" style="display:inline-block;margin:0 0 12px;padding:4px 10px;border:1px solid currentColor;border-radius:4px;font:700 12px/1.4 Montserrat,sans-serif;letter-spacing:.06em;text-transform:uppercase">Contenido patrocinado</p>` : "";
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: n.t.slice(0, 110),
    description: desc,
    datePublished: iso(n.f),
    dateModified: iso(n.m),
    image: [imagen],
    author: { "@type": "Organization", name: n.a === "Redacción" ? NOMBRE : n.a },
    publisher: { "@type": "Organization", name: NOMBRE, logo: { "@type": "ImageObject", url: SITIO + "/assets/logo.png" } },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: CATS[n.c]
  };
  const fuentes = n.src.length ? `<div class="caja-fuentes"><b>Fuentes</b><ul>${n.src.map(s => `<li><a href="${esc(s[1])}" target="_blank" rel="${relEnlace(n)}">${esc(s[0])}</a></li>`).join("")}</ul></div>` : "";
  return `<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta name="theme-color" content="#14296b">
<meta property="og:site_name" content="${esc(NOMBRE)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(n.t)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(imagen)}">
<meta property="og:locale" content="es_MX">
<meta property="article:published_time" content="${iso(n.f)}">
<meta property="article:modified_time" content="${iso(n.m)}">
<meta property="article:section" content="${esc(CATS[n.c])}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(n.t)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(imagen)}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..100,600;75..100,700;75..100,800;75..100,900&family=Montserrat:wght@500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap">
<link rel="stylesheet" href="/assets/style.css">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
</head>
<body data-pagina="nota" data-id="${esc(n.id)}">
<div id="app">
<header class="mast"><div class="wrap fila"><a class="logo" href="/" aria-label="${esc(NOMBRE)}, inicio"><img src="/assets/logo.webp" width="900" height="254" alt="${esc(NOMBRE)}"></a></div>
<nav class="secciones" aria-label="Secciones"><div class="wrap"><ul>${navLinks(n.c)}</ul></div></nav></header>
<div class="wrap"><main class="cuerpo" id="contenido"><article class="nota-art">
<div class="migas"><a href="/">Portada</a><span>›</span><a href="/seccion.html?s=${n.c}">${CATS[n.c]}</a></div>
${etiqueta}<h1>${esc(n.t)}</h1>
<div class="meta"><a class="cat" href="/seccion.html?s=${n.c}">${CATS[n.c]}</a><span>${esc(n.a)} · <time datetime="${iso(n.f)}">${fechaLarga(n.f)}</time></span></div>
${imagenDe(n) ? `<figure><div class="img"><img src="${esc(imagenDe(n))}" alt="${esc(m.alt || n.t)}" loading="eager" decoding="async" referrerpolicy="no-referrer"></div><figcaption>${credito}</figcaption></figure>` : ""}
<div class="texto">${parrafos(n)}</div>
${fuentes}
</article></main></div>
<footer class="pie"><div class="wrap"><div class="copy">© 2026 ${esc(NOMBRE)}. Una publicación de la editorial de Despierta Dominicana.</div></div></footer>
</div>
<script src="/assets/imagenes.js"></script>
<script src="/assets/datos.js?v=${v}"></script>
<script src="/assets/en-vivo.js"></script><script src="/assets/app.js"></script>
</body>
</html>
`;
}

const DIR_NOTAS = path.join(RAIZ, "notas");
fs.rmSync(DIR_NOTAS, { recursive: true, force: true });
for (const n of notas) {
  const d = path.join(DIR_NOTAS, n.s);
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, "index.html"), paginaNota(n));
}

// ---------- sitemap ----------
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITIO}/</loc><lastmod>${iso(notas[0]?.f || "2026-01-01")}</lastmod></url>
${notas.map(n => `  <url><loc>${SITIO}${urlNota(n)}</loc><lastmod>${iso(n.m)}</lastmod></url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(RAIZ, "sitemap.xml"), sitemap);

// ---------- mapa para redirigir nota.html?id=<id> ----------
const mapa = Object.fromEntries(notas.map(n => [n.id, n.s]));
fs.mkdirSync(path.join(RAIZ, "netlify"), { recursive: true });
fs.writeFileSync(path.join(RAIZ, "netlify/mapa-notas.js"),
  "// Generado por scripts/build.mjs — no editar a mano.\nexport default " + JSON.stringify(mapa) + ";\n");

console.log(`Listo: ${Math.min(notas.length, MAX_NOTAS)} notas en datos.js, ${notas.length} páginas en /notas/, sitemap con ${notas.length + 1} URLs.`);

// Datos para assets/en-vivo.js (notas publicadas desde /admin sin volver a publicar).
agregarVivo(RAIZ);
