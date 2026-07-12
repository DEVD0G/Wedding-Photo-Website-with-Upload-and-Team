import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { sanitizeText } from "@/lib/validation";
import { serializePolaroidCard } from "@/lib/polaroids";
import { defaultPolaroidsFor, isKnownSection } from "@/lib/polaroidSections";

export const dynamic = "force-dynamic";

/**
 * Uebernimmt die eingebauten Standard-Kaertchen einer Sektion in die
 * Datenbank, damit sie im Dashboard bearbeitet werden koennen.
 */
export async function POST(req: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  let payload: { section?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const section = sanitizeText(payload.section, 40)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  if (!section || !isKnownSection(section)) {
    return NextResponse.json(
      { error: "Es wurde keine gültige Sektion angegeben." },
      { status: 400 },
    );
  }

  const existing = await prisma.polaroidCard.count({ where: { section } });
  if (existing > 0) {
    return NextResponse.json(
      { error: "Diese Sektion hat bereits eigene Kärtchen." },
      { status: 400 },
    );
  }

  const defaults = defaultPolaroidsFor(section);
  if (defaults.length === 0) {
    return NextResponse.json(
      { error: "Für diese Sektion gibt es keine Standard-Kärtchen." },
      { status: 400 },
    );
  }

  // Transaktional anlegen: entweder alle Standard-Kaertchen oder keins.
  const cards = await prisma.$transaction(
    defaults.map((d, i) =>
      prisma.polaroidCard.create({
        data: {
          section,
          sortOrder: i,
          caption: d.caption,
          note: d.note ?? null,
          tone: d.tone,
        },
      }),
    ),
  );

  return NextResponse.json({ cards: cards.map(serializePolaroidCard) });
}
