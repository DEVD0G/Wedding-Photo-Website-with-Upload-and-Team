import fs from "fs";
import { Readable } from "stream";
import { prisma } from "@/lib/db";
import { resolveMediaPath } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liefert das Bild eines Polaroid-Kaertchens aus. */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const card = await prisma.polaroidCard.findUnique({
    where: { id: params.id },
  });
  if (!card || !card.filename) {
    return new Response("Nicht gefunden.", { status: 404 });
  }

  const filePath = resolveMediaPath(card.filename);
  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(filePath);
  } catch {
    return new Response("Datei nicht gefunden.", { status: 404 });
  }

  const stream = fs.createReadStream(filePath);
  return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": card.mimeType || "application/octet-stream",
      "Content-Length": String(stat.size),
      // Die Bild-URL traegt einen Versions-Parameter – lange cachen ist ok.
      "Cache-Control": "private, max-age=86400",
    },
  });
}
