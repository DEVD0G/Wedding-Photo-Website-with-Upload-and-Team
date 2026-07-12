import { filmPolaroids, storyChapters, type Polaroid } from "./story";

/**
 * Client-sichere Definition der Polaroid-Bereiche (keine Server-Importe).
 *
 * Jede Sektion beschreibt eine Stelle der Webseite, an der die
 * Polaroid-Kaertchen erscheinen. Neue Bereiche (z.B. Galerie oder
 * Gaestebuch) lassen sich hier ergaenzen – Dashboard-Eingabefelder und
 * Frontend-Styling greifen dann automatisch.
 */

export interface PolaroidSectionDef {
  key: string;
  label: string;
  /** Wie viele Kaertchen die Seite in dieser Sektion tatsaechlich zeigt. */
  maxVisible?: number;
}

export const POLAROID_SECTIONS: PolaroidSectionDef[] = [
  { key: "film", label: "Startseite – Polaroid-Filmsequenz" },
  ...storyChapters.map((chapter, i) => ({
    key: `kapitel-${i + 1}`,
    label: `Kapitel ${chapter.numeral} – ${chapter.title}`,
    maxVisible: 2,
  })),
];

/** Prueft, ob ein Sektions-Slug zu einer bekannten Sektion gehoert. */
export function isKnownSection(section: string): boolean {
  return POLAROID_SECTIONS.some((s) => s.key === section);
}

/** Eingebaute Standard-Kaertchen je Sektion (Fallback ohne DB-Eintraege). */
export function defaultPolaroidsFor(section: string): Polaroid[] {
  if (section === "film") return filmPolaroids;
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
