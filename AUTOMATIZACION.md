# Publicación automática — instrucciones para la tarea programada

Esta tarea corre dos veces al día (mañana y tarde, hora de la Ciudad de México) y publica en despiertacdmx.com.

## 1. Buscar las noticias
- Busca en la web las noticias más importantes de las últimas 12 horas en la Ciudad de México, en México y en el mundo.
- Prioridad: Ciudad (CDMX) > Nacional > Política > Economía > Internacional > Deportes > Entretenimiento > Tecnología > Educación.
- Revisa resúmenes de portadas (Uno TV "Las de hoy", Infobae México, Milenio, El Universal, La Jornada, Reforma, Excélsior, El Financiero, Expansión, Proceso) y abre las notas para confirmar los datos.
- Antes de escribir, lee los títulos de `content/notas/` de los últimos 2 días y **no repitas** una nota que ya existe. Si un tema avanzó, escribe una nota nueva con el dato nuevo.

## 2. Escribir 20 notas
Crea **exactamente 20** archivos nuevos en `content/notas/`, uno por nota, con nombre `AAAA-MM-DD-titular-en-minusculas-con-guiones.json` (máximo 70 caracteres después de la fecha) y este formato:

```json
{
  "titulo": "Titular claro, en tus palabras",
  "seccion": "ciudad",
  "fecha": "2026-10-21T06:20",
  "resumen": "Dos o tres frases con los hechos: qué pasó, dónde, cifras y quién lo dijo.",
  "cuerpo": "",
  "imagen_tema": "metro",
  "imagen": "",
  "credito": "",
  "fuentes": [{ "medio": "Infobae", "enlace": "https://..." }],
  "destacada": false,
  "autor": "Redacción"
}
```

Reglas:
- `seccion`: ciudad, nacional, politica, economia, internacional, entretenimiento, tecnologia, educacion o deportes. Al menos 6 de las 20 deben ser de `ciudad`.
- `fecha`: la hora de la ejecución en la Ciudad de México. Usa minutos distintos para conservar el orden de importancia (la más importante con la hora más reciente).
- Marca `"destacada": true` en las 4 más importantes.
- `imagen_tema`: una de las claves de `assets/imagenes.js` que corresponda al tema (lugar o asunto). Si ninguna encaja, usa `centro` para la ciudad o `zocalo` para el país.
- **Redacta todo con tus propias palabras.** No copies frases de los medios; como máximo, una cita breve (menos de 15 palabras) entre comillas si la frase exacta importa.
- **No inventes datos.** Cada cifra, nombre o fecha debe estar en la fuente enlazada. Si una fuente solo da el titular, escribe una nota breve con eso.
- Cada nota lleva al menos una fuente con su enlace real.
- Temas delicados (violencia, salud, política): tono neutral, sin adjetivos ni opiniones.

## 3. Actualizar los datos del día
Edita `content/hoy.json` (mismo formato que ya tiene): fecha ("Miércoles 21 de octubre de 2026"), hora de actualización, clima de la CDMX (SGIRPC / Conagua / SMN), calidad del aire (Sedema), estado del Metro y Metrobús, Hoy No Circula del día y marchas del día (SSC). Si no encuentras un dato, deja el anterior y no lo inventes.

Hoy No Circula (programa general, sin contingencia): lunes engomado amarillo (5 y 6), martes rosa (7 y 8), miércoles rojo (3 y 4), jueves verde (1 y 2), viernes azul (9 y 0). Sábado: según holograma y terminación; domingo circulan todos.

## 4. Revisar y publicar
1. Ejecuta `node scripts/build.mjs`. Si marca errores, corrígelos.
2. Confirma que hay 20 archivos nuevos y que ninguno repite una nota anterior.
3. Haz commit en `main` con el mensaje `Noticias del AAAA-MM-DD (mañana|tarde)` y push. Netlify publica solo.
4. Envía al usuario un mensaje corto: cuántas notas se publicaron, los 4 titulares destacados y cualquier problema.
