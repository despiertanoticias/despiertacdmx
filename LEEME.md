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
