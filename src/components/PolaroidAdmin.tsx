"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Heart, ImagePlus, RotateCcw, Save, Trash2, X } from "lucide-react";
import type { PolaroidCardItem } from "@/lib/types";
import type { PolaroidSectionDef, PolaroidSlotDef } from "@/lib/polaroidSections";

interface Props {
  /** Kaertchen-Liste – der State lebt im AdminDashboard, damit er
   *  einen Tab-Wechsel (Unmount/Remount dieser Komponente) ueberlebt. */
  cards: PolaroidCardItem[];
  onChange: React.Dispatch<React.SetStateAction<PolaroidCardItem[]>>;
  sections: PolaroidSectionDef[];
}

/**
 * Kapitel-Foto-Verwaltung: Jedes Kapitel der Startseite zeigt zwei
 * Fotos. Hier setzt man genau diese zwei Fotos je Kapitel – Bild
 * hochladen (automatischer quadratischer Zuschnitt) sowie Titel und
 * Untertitel bearbeiten. Solange ein Platz kein eigenes Foto hat, zeigt
 * die Seite den eingebauten Standard.
 */
export function PolaroidAdmin({ cards, onChange, sections }: Props) {
  const [busy, setBusy] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...cards].sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
      ),
    [cards],
  );

  function cardsOf(section: string): PolaroidCardItem[] {
    return sorted.filter((c) => c.section === section);
  }

  /** Ordnet die vorhandenen Karten den festen Plaetzen einer Sektion zu. */
  function slotsOf(
    section: PolaroidSectionDef,
  ): { slot: PolaroidSlotDef; index: number; card: PolaroidCardItem | null }[] {
    const list = cardsOf(section.key);
    const used = new Set<string>();
    return section.slots.map((slot, index) => {
      // bevorzugt die Karte mit passendem sortOrder, sonst die naechste freie
      let card =
        list.find((c) => !used.has(c.id) && c.sortOrder === index) ?? null;
      if (!card) card = list.find((c) => !used.has(c.id)) ?? null;
      if (card) used.add(card.id);
      return { slot, index, card };
    });
  }

  // Karten aus nicht mehr existierenden Bereichen (z.B. entferntes Kapitel
  // oder der alte Abschluss-Bereich) bleiben loeschbar.
  const orphanCards = useMemo(() => {
    const known = new Set(sections.map((s) => s.key));
    return sorted.filter((c) => !known.has(c.section));
  }, [sorted, sections]);

  async function patchCard(
    id: string,
    build: (form: FormData) => void,
  ): Promise<PolaroidCardItem | null> {
    const form = new FormData();
    build(form);
    try {
      const res = await fetch(`/api/admin/polaroids/${id}`, {
        method: "PATCH",
        body: form,
      });
      const data = await res.json();
      if (res.ok && data.card) {
        onChange((prev) => prev.map((c) => (c.id === id ? data.card : c)));
        return data.card;
      }
      toast.error(data.error || "Speichern fehlgeschlagen.");
      return null;
    } catch {
      toast.error("Netzwerkfehler.");
      return null;
    }
  }

  async function createCard(
    section: string,
    slotIndex: number,
    build: (form: FormData) => void,
  ): Promise<PolaroidCardItem | null> {
    const form = new FormData();
    form.append("section", section);
    form.append("sortOrder", String(slotIndex));
    build(form);
    try {
      const res = await fetch("/api/admin/polaroids", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (res.ok && data.card) {
        onChange((prev) => [...prev, data.card]);
        return data.card;
      }
      toast.error(data.error || "Speichern fehlgeschlagen.");
      return null;
    } catch {
      toast.error("Netzwerkfehler.");
      return null;
    }
  }

  async function deleteCard(card: PolaroidCardItem, confirmText: string) {
    if (!confirm(confirmText)) return;
    setBusy(card.id);
    try {
      const res = await fetch(`/api/admin/polaroids/${card.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onChange((prev) => prev.filter((c) => c.id !== card.id));
        toast.success("Foto zurückgesetzt.");
      } else {
        toast.error("Löschen fehlgeschlagen.");
      }
    } catch {
      toast.error("Netzwerkfehler.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <p className="rounded-2xl bg-cream/70 p-4 text-sm text-cocoa">
        Jedes Kapitel der Startseite zeigt <strong>zwei Fotos</strong>. Hier
        setzt du genau diese Fotos: Bild hochladen (wird automatisch{" "}
        <strong>quadratisch zugeschnitten</strong>) sowie Titel und Untertitel
        anpassen. Solange ein Platz kein eigenes Foto hat, zeigt die Seite den
        eingebauten Standard.
      </p>

      <div className="mt-6 space-y-8">
        {sections.map((section) => (
          <section key={section.key}>
            <h2 className="border-b border-beige pb-2 font-display text-2xl text-ink">
              {section.label}
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {slotsOf(section).map(({ slot, index, card }) => (
                <SlotEditor
                  key={`${section.key}-${index}`}
                  slot={slot}
                  card={card}
                  photoLabel={`Foto ${index + 1}`}
                  busy={card ? busy === card.id : false}
                  onPatch={patchCard}
                  onCreate={(build) => createCard(section.key, index, build)}
                  onReset={(c) =>
                    deleteCard(
                      c,
                      "Dieses Foto auf den Standard zurücksetzen?",
                    )
                  }
                />
              ))}
            </div>
          </section>
        ))}

        {orphanCards.length > 0 && (
          <section>
            <h2 className="border-b border-beige pb-2 font-display text-2xl text-ink">
              Nicht mehr verwendet
            </h2>
            <p className="mt-3 rounded-2xl bg-blush/40 p-3 text-xs text-rosedeep">
              Diese Fotos gehören zu Bereichen, die es auf der Webseite nicht
              mehr gibt. Sie werden nirgends angezeigt und können hier gelöscht
              werden.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {orphanCards.map((card) => (
                <div key={card.id} className="card overflow-hidden">
                  <div className="relative aspect-square bg-sand">
                    {card.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={card.imageUrl}
                        alt={card.caption}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{
                          background:
                            card.tone ||
                            "linear-gradient(150deg,#F2E8D7,#EAD8B6)",
                        }}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <span className="truncate text-sm text-cocoa">
                      {card.caption}
                    </span>
                    <button
                      onClick={() =>
                        deleteCard(card, `„${card.caption}“ wirklich löschen?`)
                      }
                      disabled={busy === card.id}
                      className="btn shrink-0 px-2.5 py-2 text-xs text-rosedeep hover:bg-rosedeep/10"
                      aria-label="Löschen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ---------- Editor für einen festen Foto-Platz ---------- */

function SlotEditor({
  slot,
  card,
  photoLabel,
  busy,
  onPatch,
  onCreate,
  onReset,
}: {
  slot: PolaroidSlotDef;
  card: PolaroidCardItem | null;
  photoLabel: string;
  busy: boolean;
  onPatch: (
    id: string,
    build: (form: FormData) => void,
  ) => Promise<PolaroidCardItem | null>;
  onCreate: (
    build: (form: FormData) => void,
  ) => Promise<PolaroidCardItem | null>;
  onReset: (card: PolaroidCardItem) => void;
}) {
  // Angezeigte Texte: eigene Werte, sonst der eingebaute Standard.
  const [caption, setCaption] = useState(card?.caption ?? slot.caption);
  const [note, setNote] = useState(card?.note ?? slot.note);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentCaption = card?.caption ?? slot.caption;
  const currentNote = card?.note ?? slot.note;
  const dirty = caption !== currentCaption || note !== currentNote;

  async function saveTexts() {
    if (caption.trim().length === 0) {
      toast.error("Der Titel darf nicht leer sein.");
      return;
    }
    setSaving(true);
    const build = (form: FormData) => {
      form.append("caption", caption.trim());
      form.append("note", note.trim());
    };
    const updated = card ? await onPatch(card.id, build) : await onCreate(build);
    setSaving(false);
    if (updated) {
      setCaption(updated.caption);
      setNote(updated.note ?? "");
      toast.success("Texte gespeichert.");
    }
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Bitte wähle eine Bilddatei.");
      return;
    }
    setUploading(true);
    // Beim ersten Upload das Kärtchen anlegen und dabei die aktuell
    // angezeigten Texte übernehmen; sonst nur das Bild ersetzen.
    const updated = card
      ? await onPatch(card.id, (form) => form.append("image", file))
      : await onCreate((form) => {
          form.append("image", file);
          form.append("caption", caption.trim() || slot.caption);
          form.append("note", note.trim());
        });
    setUploading(false);
    if (updated) toast.success("Foto gesetzt.");
  }

  async function removeImage() {
    if (!card) return;
    setUploading(true);
    const updated = await onPatch(card.id, (form) =>
      form.append("removeImage", "1"),
    );
    setUploading(false);
    if (updated) toast.success("Bild entfernt.");
  }

  const imageUrl = card?.imageUrl ?? null;

  return (
    <div className="card overflow-hidden">
      {/* Vorschau im echten Polaroid-Look – quadratisch, object-cover */}
      <div className="bg-ivory p-3 pb-0">
        <div className="relative aspect-square overflow-hidden bg-sand">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={caption}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                background:
                  card?.tone || "linear-gradient(150deg,#F2E8D7,#EAD8B6)",
              }}
            >
              <Heart size={24} className="text-ivory/70" fill="currentColor" />
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-noir/60 px-2 py-0.5 text-[10px] font-medium text-ivory">
            {photoLabel}
          </span>
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-noir/40 text-xs font-medium text-ivory">
              Wird verarbeitet …
            </span>
          )}
        </div>
        <div className="px-1 pb-2 pt-2.5 text-center">
          <p className="truncate font-script text-2xl leading-none text-rosedeep">
            {caption || "Titel"}
          </p>
          <p className="mt-1 truncate text-[11px] uppercase tracking-wider text-muted">
            {note || " "}
          </p>
        </div>
      </div>

      <div className="space-y-2.5 border-t border-beige p-4">
        <div className="flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || busy}
            className="btn-outline flex-1 px-3 py-2 text-xs"
          >
            <ImagePlus size={14} />
            {imageUrl ? "Bild ersetzen" : "Bild hochladen"}
          </button>
          {imageUrl && (
            <button
              onClick={removeImage}
              disabled={uploading || busy}
              className="btn px-3 py-2 text-xs text-rosedeep hover:bg-rosedeep/10"
              aria-label="Bild entfernen"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            uploadImage(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div>
          <label className="label text-xs">Titel (geschwungene Schrift)</label>
          <input
            type="text"
            className="field py-2 text-sm"
            value={caption}
            maxLength={80}
            placeholder="z. B. Ein Tag voller Liebe"
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
        <div>
          <label className="label text-xs">Untertitel (Großbuchstaben)</label>
          <input
            type="text"
            className="field py-2 text-sm"
            value={note}
            maxLength={60}
            placeholder="z. B. Unzählige davon"
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={saveTexts}
            disabled={saving || !dirty}
            className="btn-gold flex-1 px-3 py-2 text-xs"
          >
            <Save size={14} />
            {saving ? "Speichert …" : "Speichern"}
          </button>
          {card && (
            <button
              onClick={() => onReset(card)}
              disabled={busy}
              className="btn-ghost px-2.5 py-2 text-xs"
              aria-label="Auf Standard zurücksetzen"
              title="Auf Standard zurücksetzen"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
