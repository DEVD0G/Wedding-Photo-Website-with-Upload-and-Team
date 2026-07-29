import { storyChapters, type Polaroid } from "./story";

/**
 * Client-sichere Definition der Kapitel-Foto-Bereiche (keine Server-Importe).
 *
 * Jedes Kapitel der Startseite zeigt zwei Fotos. Über diese Sektionen
 * werden im Admin-Dashboard genau diese zwei Fotos je Kapitel gesetzt.
 */

export interface PolaroidSlotDef {
  caption: string;
  note: string;
}

export interface PolaroidSectionDef {
  key: string;
  label: string;
  /** Feste Foto-Plätze dieser Sektion (Titel/Untertitel als Vorgabe). */
  slots: PolaroidSlotDef[];
}

export const POLAROID_SECTIONS: PolaroidSectionDef[] = storyChapters.map(
  (chapter, i) => ({
    key: `kapitel-${i + 1}`,
    label: `Kapitel ${chapter.numeral} – ${chapter.title}`,
    slots: chapter.polaroids.map((p) => ({
      caption: p.caption,
      note: p.note ?? "",
    })),
  }),
);

/** Prueft, ob ein Sektions-Slug zu einer bekannten Sektion gehoert. */
export function isKnownSection(section: string): boolean {
  return POLAROID_SECTIONS.some((s) => s.key === section);
}

/** Anzahl der Foto-Plaetze einer Sektion. */
export function slotCountFor(section: string): number {
  return POLAROID_SECTIONS.find((s) => s.key === section)?.slots.length ?? 0;
}

/** Eingebaute Standard-Kaertchen je Sektion (Fallback ohne DB-Eintraege). */
export function defaultPolaroidsFor(section: string): Polaroid[] {
  const match = /^kapitel-(\d+)$/.exec(section);
  if (match) {
    return storyChapters[Number(match[1]) - 1]?.polaroids ?? [];
  }
  return [];
}

/** Warme Farbverlaeufe fuer neue Kaertchen ohne Bild. */
export const POLAROID_TONES = [
  "linear-gradient(150deg,#F2E8D7,#EAD8B6)",
  "linear-gradient(150deg,#EFD0CB,#DDA29E)",
  "linear-gradient(150deg,#F2E8D7,#EFD0CB)",
  "linear-gradient(150deg,#EAD8B6,#C6A24B)",
  "linear-gradient(150deg,#352C25,#241E1A)",
];
