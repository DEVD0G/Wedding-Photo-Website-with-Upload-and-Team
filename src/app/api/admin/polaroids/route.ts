import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { deleteMediaFile } from "@/lib/storage";
import { sanitizeText } from "@/lib/validation";
import { serializePolaroidCard } from "@/lib/polaroids";
import { isUploadFile, storePolaroidImage } from "@/lib/polaroidImage";
import { isKnownSection, POLAROID_TONES } from "@/lib/polaroidSections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Neues Polaroid-Kaertchen anlegen (optional direkt mit Bild). */
export async function POST(req: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const section = sanitizeText(form.get("section"), 40)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  if (!section || !isKnownSection(section)) {
    return NextResponse.json(
      { error: "Es wurde keine gültige Sektion angegeben." },
      { status: 400 },
    );
  }

  const caption = sanitizeText(form.get("caption"), 80) || "Neues Kärtchen";
  const note = sanitizeText(form.get("note"), 60) || null;

  // Optionaler fester Foto-Platz (Slot). Ohne Angabe wird angehaengt.
  let slot: number | null = null;
  if (form.has("sortOrder")) {
    const parsed = Number(form.get("sortOrder"));
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100000) {
      return NextResponse.json(
        { error: "Ungültiger Foto-Platz." },
        { status: 400 },
      );
    }
    slot = parsed;
  }

  let filename: string | null = null;
  let mimeType: string | null = null;
  const image = form.get("image");
  if (isUploadFile(image)) {
    const stored = await storePolaroidImage(image);
    if ("error" in stored) {
      return NextResponse.json({ error: stored.error }, { status: 400 });
    }
    filename = stored.filename;
    mimeType = stored.mimeType;
  }

  const [last, count] = await Promise.all([
    prisma.polaroidCard.findFirst({
      where: { section },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    }),
    prisma.polaroidCard.count({ where: { section } }),
  ]);

  try {
    const card = await prisma.polaroidCard.create({
      data: {
        section,
        caption,
        note,
        tone: POLAROID_TONES[count % POLAROID_TONES.length],
        sortOrder: slot ?? (last?.sortOrder ?? -1) + 1,
        filename,
        mimeType,
      },
    });
    return NextResponse.json({ card: serializePolaroidCard(card) });
  } catch (err) {
    // frisch gespeicherte Bilddatei nicht verwaisen lassen
    if (filename) await deleteMediaFile(filename);
    console.error("[polaroids] Anlegen fehlgeschlagen:", err);
    return NextResponse.json(
      { error: "Das Kärtchen konnte nicht gespeichert werden." },
      { status: 500 },
    );
  }
}
