import crypto from "crypto";
import { saveMediaFile } from "./storage";
import { detectFileType } from "./validation";
import { maxFileSize, maxFileSizeMb } from "./config";

/**
 * Server-Helfer fuer Bild-Uploads der Polaroid-Kaertchen.
 * Bewusst ohne `instanceof File` (Duck-Typing), damit der Code auch
 * unter Node.js 18 laeuft, wo die globale File-Klasse fehlt.
 */

export function isUploadFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value !== "string" &&
    value !== null &&
    typeof (value as { arrayBuffer?: unknown }).arrayBuffer === "function" &&
    typeof (value as { size?: unknown }).size === "number"
  );
}

/**
 * Prueft eine hochgeladene Bilddatei (nur Bildformate, Groessenlimit)
 * und speichert sie. Gibt Dateiname + MIME-Type oder einen Fehler zurueck.
 */
export async function storePolaroidImage(
  file: File,
): Promise<{ filename: string; mimeType: string } | { error: string }> {
  if (file.size === 0) return { error: "Die Bilddatei ist leer." };
  if (file.size > maxFileSize) {
    return { error: `Das Bild ist zu groß (max. ${maxFileSizeMb} MB).` };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectFileType(buffer);
  if (!detected || detected.kind !== "image") {
    return { error: "Bitte lade ein Bild hoch (JPG, PNG, GIF oder WEBP)." };
  }
  // HEIC koennen die meisten Browser nicht im <img>-Tag anzeigen – das
  // Kaertchen bliebe leer. Deshalb hier bewusst ablehnen.
  if (detected.ext === "heic") {
    return {
      error:
        "HEIC-Fotos können Browser leider nicht anzeigen – bitte als JPG, PNG oder WEBP hochladen.",
    };
  }
  const filename = `${crypto.randomUUID()}.${detected.ext}`;
  await saveMediaFile(filename, buffer);
  return { filename, mimeType: detected.mimeType };
}
