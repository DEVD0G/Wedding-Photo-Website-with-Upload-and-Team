"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Heart,
  ImagePlus,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { PolaroidCardItem } from "@/lib/types";
import type { PolaroidSectionDef } from "@/lib/polaroidSections";

interface Props {
  /** Kaertchen-Liste – der State lebt im AdminDashboard, damit er
   *  einen Tab-Wechsel (Unmount/Remount dieser Komponente) ueberlebt. */
  cards: PolaroidCardItem[];
  onChange: React.Dispatch<React.SetStateAction<PolaroidCardItem[]>>;
  sections: PolaroidSectionDef[];
}

/**
 * Verwaltung der Polaroid-Kaertchen: pro Sektion Bild hochladen
 * (automatischer quadratischer Zuschnitt im Frontend), Titel und
 * Untertitel bearbeiten, Reihenfolge aendern, Kaertchen hinzufuegen
 * und loeschen.
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

  function replaceCard(card: PolaroidCardItem) {
    onChange((prev) => prev.map((c) => (c.id === card.id ? card : c)));
  }

  async function seedSection(section: string) {
    setBusy(section);
    try {
      const res = await fetch("/api/admin/polaroids/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.cards)) {
        onChange((prev) => [...prev, ...data.cards]);
        toast.success("Standard-Kärtchen übernommen – jetzt bearbeitbar.");
      } else {
        toast.error(data.error || "Übernehmen fehlgeschlagen.");
      }
    } catch {
      toast.error("Netzwerkfehler.");
    } finally {
      setBusy(null);
    }
  }

  async function addCard(section: string) {
    setBusy(section);
    try {
      const form = new FormData();
      form.append("section", section);
      form.append("caption", "Neues Kärtchen");
      const res = await fetch("/api/admin/polaroids", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (res.ok && data.card) {
        onChange((prev) => [...prev, data.card]);
        toast.success("Kärtchen hinzugefügt.");
      } else {
        toast.error(data.error || "Anlegen fehlgeschlagen.");
      }
    } catch {
      toast.error("Netzwerkfehler.");
    } finally {
      setBusy(null);
    }
  }

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
        replaceCard(data.card);
        return data.card;
      }
      toast.error(data.error || "Speichern fehlgeschlagen.");
      return null;
    } catch {
      toast.error("Netzwerkfehler.");
      return null;
    }
  }

  async function deleteCard(card: PolaroidCardItem) {
    if (!confirm(`„${card.caption}“ wirklich löschen?`)) return;
    setBusy(card.id);
    try {
      const res = await fetch(`/api/admin/polaroids/${card.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onChange((prev) => prev.filter((c) => c.id !== card.id));
        toast.success("Kärtchen gelöscht.");
      } else {
        toast.error("Löschen fehlgeschlagen.");
      }
    } catch {
      toast.error("Netzwerkfehler.");
    } finally {
      setBusy(null);
    }
  }

  /** Tauscht die Reihenfolge mit dem Nachbarn in derselben Sektion. */
  async function moveCard(card: PolaroidCardItem, direction: -1 | 1) {
    const list = cardsOf(card.section);
    const index = list.findIndex((c) => c.id === card.id);
    const neighbor = list[index + direction];
    if (!neighbor) return;
    setBusy(card.id);
    try {
      // Positionen der beiden Karten tauschen (Index-basiert, damit auch
      // gleiche sortOrder-Werte sauber aufgeloest werden).
      const orderA = index + direction;
      const orderB = index;
      const updatedA = await patchCard(card.id, (f) =>
        f.append("sortOrder", String(orderA)),
      );
      const updatedB = await patchCard(neighbor.id, (f) =>
        f.append("sortOrder", String(orderB)),
      );
      if (!updatedA || !updatedB) return;
      // Restliche Karten der Sektion auf fortlaufende Indizes normalisieren.
      for (let i = 0; i < list.length; i++) {
        const c = list[i];
        if (c.id === card.id || c.id === neighbor.id) continue;
        if (c.sortOrder !== i) {
          await patchCard(c.id, (f) => f.append("sortOrder", String(i)));
        }
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <p className="rounded-2xl bg-cream/70 p-4 text-sm text-cocoa">
        Hier verwaltest du die <strong>Polaroid-Kärtchen</strong> der Webseite:
        Bild, Titel (geschwungene Schrift) und Untertitel (Großbuchstaben).
        Hochgeladene Fotos werden <strong>automatisch quadratisch
        zugeschnitten</strong> – das Layout bleibt immer erhalten. Solange eine
        Sektion keine eigenen Kärtchen hat, zeigt die Seite die eingebauten
        Standard-Kärtchen; werden alle gelöscht, gelten wieder die Standards.
      </p>

      <div className="mt-6 space-y-8">
        {sections.map((section) => {
          const list = cardsOf(section.key);
          return (
            <section key={section.key}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-beige pb-2">
                <h2 className="font-display text-2xl text-ink">
                  {section.label}
                </h2>
                {list.length > 0 && (
                  <button
                    onClick={() => addCard(section.key)}
                    disabled={busy === section.key}
                    className="btn-outline px-3.5 py-2 text-xs"
                  >
                    <Plus size={14} />
                    Kärtchen hinzufügen
                  </button>
                )}
              </div>

              {section.maxVisible !== undefined &&
                list.length > section.maxVisible && (
                  <p className="mt-3 rounded-2xl bg-blush/40 p-3 text-xs text-rosedeep">
                    Hinweis: Diese Sektion zeigt auf der Seite nur die ersten{" "}
                    {section.maxVisible} Kärtchen – weitere bleiben verborgen.
                  </p>
                )}

              {list.length === 0 ? (
                <div className="card mt-4 flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
                  <p className="text-sm text-cocoa">
                    Diese Sektion zeigt aktuell die eingebauten
                    Standard-Kärtchen.
                  </p>
                  <div className="flex shrink-0 flex-wrap justify-center gap-2">
                    <button
                      onClick={() => seedSection(section.key)}
                      disabled={busy === section.key}
                      className="btn-gold px-4 py-2 text-xs"
                    >
                      <Sparkles size={14} />
                      Standard-Kärtchen übernehmen
                    </button>
                    <button
                      onClick={() => addCard(section.key)}
                      disabled={busy === section.key}
                      className="btn-outline px-4 py-2 text-xs"
                    >
                      <Plus size={14} />
                      Leeres Kärtchen
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((card, i) => (
                    <PolaroidEditor
                      key={card.id}
                      card={card}
                      isFirst={i === 0}
                      isLast={i === list.length - 1}
                      busy={busy === card.id}
                      onPatch={patchCard}
                      onDelete={() => deleteCard(card)}
                      onMove={(dir) => moveCard(card, dir)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Editor fuer ein einzelnes Kaertchen ---------- */

function PolaroidEditor({
  card,
  isFirst,
  isLast,
  busy,
  onPatch,
  onDelete,
  onMove,
}: {
  card: PolaroidCardItem;
  isFirst: boolean;
  isLast: boolean;
  busy: boolean;
  onPatch: (
    id: string,
    build: (form: FormData) => void,
  ) => Promise<PolaroidCardItem | null>;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const [caption, setCaption] = useState(card.caption);
  const [note, setNote] = useState(card.note ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = caption !== card.caption || note !== (card.note ?? "");

  async function save() {
    if (caption.trim().length === 0) {
      toast.error("Der Titel darf nicht leer sein.");
      return;
    }
    setSaving(true);
    const updated = await onPatch(card.id, (form) => {
      form.append("caption", caption.trim());
      form.append("note", note.trim());
    });
    setSaving(false);
    if (updated) {
      // lokalen State mit der server-bereinigten Fassung synchronisieren,
      // damit der Speichern-Button nicht faelschlich aktiv bleibt
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
    const updated = await onPatch(card.id, (form) =>
      form.append("image", file),
    );
    setUploading(false);
    if (updated) toast.success("Bild aktualisiert.");
  }

  async function removeImage() {
    if (!confirm("Bild entfernen? Das Kärtchen zeigt dann den Farbverlauf.")) {
      return;
    }
    setUploading(true);
    const updated = await onPatch(card.id, (form) =>
      form.append("removeImage", "1"),
    );
    setUploading(false);
    if (updated) toast.success("Bild entfernt.");
  }

  return (
    <div className="card overflow-hidden">
      {/* Vorschau im echten Polaroid-Look – quadratisch, object-cover */}
      <div className="bg-ivory p-3 pb-0">
        <div className="relative aspect-square overflow-hidden bg-sand">
          {card.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.imageUrl}
              alt={card.caption}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                background:
                  card.tone || "linear-gradient(150deg,#F2E8D7,#EAD8B6)",
              }}
            >
              <Heart size={24} className="text-ivory/70" fill="currentColor" />
            </div>
          )}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-noir/40 text-xs font-medium text-ivory">
              Wird verarbeitet …
            </span>
          )}
        </div>
        {/* Live-Vorschau der Texte im Kaertchen-Stil */}
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
            {card.imageUrl ? "Bild ersetzen" : "Bild hochladen"}
          </button>
          {card.imageUrl && (
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
            onClick={save}
            disabled={saving || !dirty}
            className="btn-gold flex-1 px-3 py-2 text-xs"
          >
            <Save size={14} />
            {saving ? "Speichert …" : "Speichern"}
          </button>
          <button
            onClick={() => onMove(-1)}
            disabled={isFirst || busy}
            className="btn-ghost px-2.5 py-2 text-xs"
            aria-label="Nach vorne"
          >
            <ArrowUp size={14} />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={isLast || busy}
            className="btn-ghost px-2.5 py-2 text-xs"
            aria-label="Nach hinten"
          >
            <ArrowDown size={14} />
          </button>
          <button
            onClick={onDelete}
            disabled={busy}
            className="btn px-2.5 py-2 text-xs text-rosedeep hover:bg-rosedeep/10"
            aria-label="Löschen"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
