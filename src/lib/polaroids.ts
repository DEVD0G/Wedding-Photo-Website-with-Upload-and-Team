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
 * Fotos einer Sektion fuers Frontend. Startpunkt sind die eingebauten
 * Standard-Kaertchen; vorhandene DB-Kaertchen ueberschreiben ihren
 * jeweiligen Platz (per sortOrder). So wirkt es auch, wenn nur eines
 * der beiden Kapitel-Fotos gesetzt wurde – der andere Platz bleibt beim
 * Standard, statt doppelt zu erscheinen.
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

  const result = [...defaultPolaroidsFor(section)];
  for (const row of rows) {
    const card = toDisplayPolaroid(row);
    if (row.sortOrder >= 0 && row.sortOrder < result.length) {
      result[row.sortOrder] = card;
    } else {
      result.push(card);
    }
  }
  return result;
}

/** Alle Kaertchen fuer die Admin-Verwaltung. */
export async function getAllPolaroidCards(): Promise<PolaroidCardItem[]> {
  const rows = await prisma.polaroidCard.findMany({
    orderBy: [{ section: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(serializePolaroidCard);
}
