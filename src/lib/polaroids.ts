import { prisma } from "./db";
import type { Polaroid } from "./story";
import type { PolaroidCardItem } from "./types";
import { defaultPolaroidsFor, POLAROID_TONES } from "./polaroidSections";

/**
 * Server-Helfer fuer die anpassbaren Polaroid-Kaertchen.
 * Existieren fuer eine Sektion eigene Kaertchen in der Datenbank,
 * ersetzen sie die eingebauten Standard-Kaertchen.
 */

type PolaroidRow = {
  id: string;
  section: string;
  sortOrder: number;
  caption: string;
  note: string | null;
  tone: string | null;
  filename: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Bild-URL mit Versions-Parameter, damit ersetzte Bilder sofort greifen. */
function imageUrlFor(row: PolaroidRow): string | null {
  if (!row.filename) return null;
  return `/api/polaroids/${row.id}/image?v=${row.updatedAt.getTime()}`;
}

export function serializePolaroidCard(row: PolaroidRow): PolaroidCardItem {
  return {
    id: row.id,
    section: row.section,
    sortOrder: row.sortOrder,
    caption: row.caption,
    note: row.note,
    tone: row.tone,
    imageUrl: imageUrlFor(row),
    createdAt: row.createdAt.toISOString(),
  };
}

/** Wandelt eine DB-Zeile in das Anzeige-Format der PolaroidCard-Komponente. */
export function toDisplayPolaroid(row: PolaroidRow): Polaroid {
  return {
    caption: row.caption,
    note: row.note ?? undefined,
    tone: row.tone || POLAROID_TONES[0],
    image: imageUrlFor(row) ?? undefined,
  };
}

/**
 * Kaertchen einer Sektion fuers Frontend. Ohne eigene Eintraege werden
 * die eingebauten Standard-Kaertchen der Sektion geliefert.
 */
export async function getPolaroidsForSection(
  section: string,
): Promise<Polaroid[]> {
  const rows = await prisma.polaroidCard
    .findMany({
      where: { section },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })
    .catch(() => [] as PolaroidRow[]);
  if (rows.length === 0) return defaultPolaroidsFor(section);
  return rows.map(toDisplayPolaroid);
}

/** Alle Kaertchen fuer die Admin-Verwaltung. */
export async function getAllPolaroidCards(): Promise<PolaroidCardItem[]> {
  const rows = await prisma.polaroidCard.findMany({
    orderBy: [{ section: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(serializePolaroidCard);
}
