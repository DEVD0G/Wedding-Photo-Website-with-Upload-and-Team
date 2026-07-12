import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { saveMediaFile, getUploadDir } from "@/lib/storage";
import { detectFileType, sanitizeText } from "@/lib/validation";
import { maxFileSize, maxFileSizeMb, requireApproval } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILES_PER_REQUEST = 30;

function reason(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * Prüft per Duck-Typing, ob ein FormData-Eintrag eine hochgeladene Datei ist.
 * Bewusst ohne `instanceof File`, da die globale `File`-Klasse erst ab
 * Node.js 20 existiert – so funktioniert der Upload auch unter Node 18.
 */
function isUploadFile(value: FormDataEntryValue): value is File {
  return (
    typeof value !== "string" &&
    value !== null &&
    typeof (value as { arrayBuffer?: unknown }).arrayBuffer === "function" &&
    typeof (value as { size?: unknown }).size === "number"
  );
}

/**
 * Diagnose-Endpunkt (nur Admin): prüft, ob das Upload-Verzeichnis
 * beschreibbar ist und ob die Datenbank gelesen/geschrieben werden kann.
 * Aufruf: im Browser /api/upload öffnen (vorher unter /admin anmelden).
 */
export async function GET() {
  if (!isAdmin()) {
    return NextResponse.json(
      { error: "Diese Diagnose ist nur für angemeldete Admins verfügbar." },
      { status: 401 },
    );
  }

  const checks: Record<string, string> = {};

  // 1) Upload-Verzeichnis beschreibbar?
  try {
    const dir = getUploadDir();
    const probe = path.join(dir, `.diag-${Date.now()}`);
    await fs.promises.writeFile(probe, "ok");
    await fs.promises.unlink(probe);
    checks.uploadVerzeichnis = `OK – beschreibbar (${dir})`;
  } catch (err) {
    checks.uploadVerzeichnis = `FEHLER: ${reason(err)}`;
  }

  // 2) Datenbank lesen?
  try {
    const count = await prisma.media.count();
    checks.datenbankLesen = `OK – ${count} Medien`;
  } catch (err) {
    checks.datenbankLesen = `FEHLER: ${reason(err)}`;
  }

  // 3) Datenbank schreiben? Probe-Eintrag in einer Transaktion anlegen
  //    und löschen – schlägt das Löschen fehl, rollt alles zurück, sodass
  //    nie ein "__diag__"-Brief in der Zeitkapsel zurückbleibt.
  try {
    await prisma.timeCapsuleLetter.deleteMany({
      where: { author: "__diag__" },
    });
    await prisma.$transaction(async (tx) => {
      const probe = await tx.timeCapsuleLetter.create({
        data: { author: "__diag__", body: "Schreibtest" },
      });
      await tx.timeCapsuleLetter.delete({ where: { id: probe.id } });
    });
    checks.datenbankSchreiben = "OK – beschreibbar";
  } catch (err) {
    checks.datenbankSchreiben = `FEHLER: ${reason(err)}`;
  }

  const ok = Object.values(checks).every((v) => v.startsWith("OK"));
  return NextResponse.json({
    status: ok ? "Alles in Ordnung" : "Es wurden Probleme gefunden",
    checks,
    hinweis:
      "FEHLER bei 'uploadVerzeichnis' oder 'datenbankSchreiben' deuten auf " +
      "fehlende Schreibrechte hin. Lösung: chown -R <dienst-user> auf den " +
      "Projektordner (besonders 'uploads/' und 'prisma/').",
  });
}

export async function POST(req: NextRequest) {
  try {
    let form: FormData;
    try {
      form = await req.formData();
    } catch (err) {
      console.error("[upload] formData() fehlgeschlagen:", err);
      return NextResponse.json(
        { error: `Die Daten konnten nicht gelesen werden (${reason(err)}).` },
        { status: 400 },
      );
    }

    const files = form.getAll("files").filter(isUploadFile);
    if (files.length === 0) {
      return NextResponse.json(
        { error: "Bitte wähle mindestens eine Datei aus." },
        { status: 400 },
      );
    }
    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        {
          error: `Bitte lade höchstens ${MAX_FILES_PER_REQUEST} Dateien gleichzeitig hoch.`,
        },
        { status: 400 },
      );
    }

    const guestName = sanitizeText(form.get("guestName"), 80) || null;
    const message = sanitizeText(form.get("message"), 400) || null;

    const uploaded: { id: string; originalName: string }[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const name = file?.name || "Datei";
      try {
        if (file.size === 0) {
          errors.push(`„${name}“ ist leer und wurde übersprungen.`);
          continue;
        }
        if (file.size > maxFileSize) {
          errors.push(`„${name}“ ist zu groß (max. ${maxFileSizeMb} MB).`);
          continue;
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const detected = detectFileType(buffer);
        if (!detected) {
          errors.push(
            `„${name}“ hat ein nicht unterstütztes Format und wurde abgelehnt.`,
          );
          continue;
        }

        const filename = `${crypto.randomUUID()}.${detected.ext}`;
        await saveMediaFile(filename, buffer);

        const record = await prisma.media.create({
          data: {
            type: detected.kind,
            filename,
            originalName: sanitizeText(file.name, 160) || filename,
            mimeType: detected.mimeType,
            size: file.size,
            guestName,
            message,
            approved: !requireApproval,
          },
        });
        uploaded.push({ id: record.id, originalName: record.originalName });
      } catch (err) {
        // Die echte Ursache wird mitgeliefert (z. B. Schreibrechte,
        // Datenbank), damit Probleme ohne Server-Zugriff erkennbar sind.
        console.error(`[upload] Datei-Fehler bei "${name}":`, err);
        errors.push(`„${name}“ konnte nicht gespeichert werden: ${reason(err)}`);
      }
    }

    if (uploaded.length === 0) {
      return NextResponse.json(
        { error: errors[0] || "Kein Upload war erfolgreich.", errors },
        { status: 400 },
      );
    }

    return NextResponse.json({
      uploaded,
      errors,
      pendingApproval: requireApproval,
    });
  } catch (err) {
    // Auffangnetz: die echte Fehlermeldung wird zurückgegeben.
    console.error("[upload] Unerwarteter Fehler:", err);
    return NextResponse.json(
      {
        error: `Serverfehler beim Hochladen: ${reason(err)}`,
        detail: reason(err),
      },
      { status: 500 },
    );
  }
}
