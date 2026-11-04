// Redirige con 301 las URLs antiguas nota.html?id=<id> a /notas/<slug>/.
// El mapa id -> slug lo genera scripts/build.mjs en cada publicación.
import mapa from "../mapa-notas.js";

export default async (request) => {
  const u = new URL(request.url);
  const slug = mapa[u.searchParams.get("id") || ""];
  if (!slug) return; // id desconocido: sigue a nota.html, que muestra "Nota no encontrada"
  return new Response(null, {
    status: 301,
    headers: { Location: `${u.origin}/notas/${slug}/`, "Cache-Control": "public, max-age=3600" }
  });
};

export const config = { path: ["/nota.html", "/nota"] };
