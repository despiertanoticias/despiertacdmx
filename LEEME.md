# Despierta Ciudad de México

## Cómo publicar una nota (panel)
1. Entra a **https://despiertacdmx.com/admin**.
2. Inicia sesión con GitHub.
3. En **Notas → Nueva nota**, llena titular, sección, resumen y, si quieres, el texto completo y una foto.
4. Pulsa **Guardar / Publicar**. En uno o dos minutos aparece en el sitio.

Desde el mismo panel puedes editar o borrar notas y cambiar los **Datos del día** (clima, Metro, Hoy No Circula y marchas).

## Publicación automática
Dos veces al día (alrededor de las 6:15 y las 18:15, hora del centro) una tarea programada agrega las 20 noticias más importantes y actualiza los datos del día. Las instrucciones que sigue están en `AUTOMATIZACION.md`; si las cambias, la siguiente ejecución usa la versión nueva.

## Estructura
- `content/notas/*.json` — una nota por archivo
- `content/hoy.json` — clima, transporte, Hoy No Circula y marchas
- `scripts/build.mjs` — junta todo en `assets/datos.js` (Netlify lo ejecuta en cada publicación)
- `assets/imagenes.js` — fotos de archivo de Wikimedia Commons por tema
- `admin/` — panel de publicación
- `img/subidas/` — fotos que subes desde el panel

## URLs, SEO y contenido patrocinado
- Cada nota tiene una página estática en `/notas/<slug>/` (el slug sale del titular). La genera `scripts/build.mjs`, con title, description, canonical, Open Graph, Twitter y JSON-LD `Article`, y no necesita JavaScript.
- Las URLs antiguas `nota.html?id=<id>` redirigen con 301 a la nueva mediante la Edge Function `netlify/edge-functions/nota-antigua.js`.
- `sitemap.xml` se genera en cada build y aparece en `robots.txt`.
- Marca `"patrocinado": true` en una nota (o la casilla en el panel) para mostrar la etiqueta "Contenido patrocinado" y poner `rel="sponsored noopener"` en sus enlaces.

## Lo que publicas desde /admin no gasta créditos de Netlify
Netlify cobra 15 créditos por cada publicación del sitio. Para que lo que subes desde el panel no cueste:
- `scripts/omitir-build.sh` le dice a Netlify que **no** publique cuando el cambio viene del panel (notas nuevas, ediciones, borrados, fotos o datos del día).
- `assets/en-vivo.js` hace que el sitio lea esos cambios directo de GitHub y los muestre de inmediato (la nota abre en `nota.html?id=...`).
- La siguiente publicación automática (o cualquier cambio de diseño) sí publica el sitio completo y la nota recibe su página fija y su lugar en el sitemap.
