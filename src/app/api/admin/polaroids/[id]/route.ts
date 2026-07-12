import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { deleteMediaFile } from "@/lib/storage";
import { sanitizeText } from "@/lib/validation";
import { serializePolaroidCard } from "@/lib/polaroids";
import { isUploadFile, storePolaroidImage } from "@/lib/polaroidImage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden() {
  return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
}

/**
 * Kaertchen bearbeiten: Titel, Untertitel, Reihenfolge sowie Bild
 * hochladen/ersetzen/entfernen. Es werden nur uebergebene Felder geaendert.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!isAdmin()) return forbidden();

  const existing = await prisma.polaroidCard.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const data: {
    caption?: string;
    note?: string | null;
    sortOrder?: number;
    filename?: string | null;
    mimeType?: string | null;
  } = {};

  if (form.has("caption")) {
    const caption = sanitizeText(form.get("caption"), 80);
    if (!caption) {
      return NextResponse.json(
        { error: "Der Titel darf nicht leer sein." },
        { status: 400 },
      );
    }
    data.caption = caption;
  }
  if (form.has("note")) {
    data.note = sanitizeText(form.get("note"), 60) || null;
  }
  if (form.has("sortOrder")) {
    const sortOrder = Number(form.get("sortOrder"));
    // Bereich begrenzen: Prisma-Int ist 32-Bit, und mehr als 100000
    // Kaertchen pro Sektion gibt es ohnehin nicht.
    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 100000) {
      return NextResponse.json(
        { error: "Ungültige Reihenfolge." },
        { status: 400 },
      );
    }
    data.sortOrder = sortOrder;
  }

  // Bild ersetzen oder entfernen – die alte Datei wird danach geloescht.
  let staleFile: string | null = null;
  const image = form.get("image");
  if (isUploadFile(image)) {
    const stored = await storePolaroidImage(image);
    if ("error" in stored) {
      return NextResponse.json({ error: stored.error }, { status: 400 });
    }
    staleFile = existing.filename;
    data.filename = stored.filename;
    data.mimeType = stored.mimeType;
  } else if (form.get("removeImage") === "1") {
    staleFile = existing.filename;
    data.filename = null;
    data.mimeType = null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Es wurden keine Änderungen übergeben." },
      { status: 400 },
    );
  }

  try {
    const card = await prisma.polaroidCard.update({
      where: { id: existing.id },
      data,
    });
    if (staleFile) await deleteMediaFile(staleFile);
    return NextResponse.json({ card: serializePolaroidCard(card) });
  } catch (err) {
    // frisch gespeicherte neue Bilddatei nicht verwaisen lassen
    if (data.filename) await deleteMediaFile(data.filename);
    console.error("[polaroids] Aktualisieren fehlgeschlagen:", err);
    return NextResponse.json(
      { error: "Die Änderung konnte nicht gespeichert werden." },
      { status: 500 },
    );
  }
}

/** Kaertchen endgueltig loeschen (Datenbank-Eintrag + Bilddatei). */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!isAdmin()) return forbidden();

  const card = await prisma.polaroidCard.findUnique({
    where: { id: params.id },
  });
  if (!card) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  await prisma.polaroidCard.delete({ where: { id: card.id } });
  if (card.filename) await deleteMediaFile(card.filename);

  return NextResponse.json({ ok: true });
}
