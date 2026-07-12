"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Clock,
  Copy,
  Download,
  Eye,
  EyeOff,
  Film,
  Heart,
  Image as ImageIcon,
  Link2,
  Lock,
  LogOut,
  MessageCircle,
  Mic,
  Pencil,
  Printer,
  QrCode,
  Save,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import type {
  CapsuleLetterItem,
  CommentItem,
  GreetingItem,
  GuestbookItem,
  MediaItem,
  PolaroidCardItem,
  TeamInviteItem,
} from "@/lib/types";
import type { PolaroidSectionDef } from "@/lib/polaroidSections";
import { PolaroidAdmin } from "./PolaroidAdmin";
import { formatBytes, formatDateTime } from "@/lib/format";

interface Props {
  initialMedia: MediaItem[];
  initialGuestbook: GuestbookItem[];
  initialInvites: TeamInviteItem[];
  initialGreetings: GreetingItem[];
  initialLetters: CapsuleLetterItem[];
  initialPolaroids: PolaroidCardItem[];
  polaroidSections: PolaroidSectionDef[];
  qrDataUrl: string;
  siteUrl: string;
}

type Tab =
  | "media"
  | "polaroids"
  | "greetings"
  | "guestbook"
  | "capsule"
  | "team"
  | "tools";
type MediaFilter = "all" | "visible" | "hidden" | "image" | "video";

export function AdminDashboard({
  initialMedia,
  initialGuestbook,
  initialInvites,
  initialGreetings,
  initialLetters,
  initialPolaroids,
  polaroidSections,
  qrDataUrl,
  siteUrl,
}: Props) {
  const [tab, setTab] = useState<Tab>("media");
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [guestbook, setGuestbook] = useState<GuestbookItem[]>(initialGuestbook);
  const [invites, setInvites] = useState<TeamInviteItem[]>(initialInvites);
  const [greetings, setGreetings] = useState<GreetingItem[]>(initialGreetings);
  const [letters, setLetters] = useState<CapsuleLetterItem[]>(initialLetters);
  // Lebt hier statt in PolaroidAdmin, damit Aenderungen einen
  // Tab-Wechsel (Unmount der Tab-Komponente) ueberleben.
  const [polaroids, setPolaroids] =
    useState<PolaroidCardItem[]>(initialPolaroids);
  const [filter, setFilter] = useState<MediaFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, CommentItem[]>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteLabel, setInviteLabel] = useState("");
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [letterAuthor, setLetterAuthor] = useState("");
  const [letterBody, setLetterBody] = useState("");
  const [savingLetter, setSavingLetter] = useState(false);

  const stats = useMemo(() => {
    const visible = media.filter((m) => m.approved).length;
    return {
      total: media.length,
      visible,
      hidden: media.length - visible,
      pendingGreetings: greetings.filter((g) => !g.approved).length,
    };
  }, [media, greetings]);

  const filtered = useMemo(() => {
    return media.filter((m) => {
      if (filter === "visible") return m.approved;
      if (filter === "hidden") return !m.approved;
      if (filter === "image") return m.type === "image";
      if (filter === "video") return m.type === "video";
      return true;
    });
  }, [media, filter]);

  /* ---------- Foto-Aktionen ---------- */

  async function toggleApprove(item: MediaItem) {
    setBusy(item.id);
    try {
      const res = await fetch(`/api/admin/media/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: !item.approved }),
      });
      if (res.ok) {
        setMedia((prev) =>
          prev.map((m) =>
            m.id === item.id ? { ...m, approved: !item.approved } : m,
          ),
        );
        toast.success(
          item.approved
            ? "Medium ist jetzt verborgen."
            : "Medium ist jetzt sichtbar.",
        );
      } else toast.error("Änderung fehlgeschlagen.");
    } catch {
      toast.error("Netzwerkfehler.");
    } finally {
      setBusy(null);
    }
  }

  async function saveEdit(id: string, guestName: string, message: string) {
    try {
      const res = await fetch(`/api/admin/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestName, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setMedia((prev) =>
          prev.map((m) =>
            m.id === id
              ? { ...m, guestName: data.guestName, message: data.message }
              : m,
          ),
        );
        toast.success("Änderungen gespeichert.");
        return true;
      }
      toast.error(data.error || "Speichern fehlgeschlagen.");
      return false;
    } catch {
      toast.error("Netzwerkfehler.");
      return false;
    }
  }

  async function deleteMedia(item: MediaItem) {
    if (!confirm(`„${item.originalName}“ wirklich löschen?`)) return;
    setBusy(item.id);
    try {
      const res = await fetch(`/api/admin/media/${item.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMedia((prev) => prev.filter((m) => m.id !== item.id));
        toast.success("Medium gelöscht.");
      } else toast.error("Löschen fehlgeschlagen.");
    } finally {
      setBusy(null);
    }
  }

  async function loadComments(id: string) {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (comments[id]) return;
    try {
      const res = await fetch(`/api/media/${id}`);
      const data = await res.json();
      if (Array.isArray(data.comments)) {
        setComments((prev) => ({ ...prev, [id]: data.comments }));
      }
    } catch {
      /* ignore */
    }
  }

  async function deleteComment(mediaId: string, commentId: string) {
    if (!confirm("Diesen Kommentar löschen?")) return;
    const res = await fetch(`/api/admin/comments/${commentId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setComments((prev) => ({
        ...prev,
        [mediaId]: (prev[mediaId] || []).filter((c) => c.id !== commentId),
      }));
      setMedia((prev) =>
        prev.map((m) =>
          m.id === mediaId
            ? { ...m, commentCount: Math.max(0, m.commentCount - 1) }
            : m,
        ),
      );
      toast.success("Kommentar gelöscht.");
    }
  }

  /* ---------- Botschaften ---------- */

  async function patchGreeting(id: string, body: Record<string, unknown>) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/greetings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setGreetings((prev) =>
          prev.map((g) =>
            g.id === id
              ? {
                  ...g,
                  approved: data.approved,
                  surprise: data.surprise,
                  revealAt: data.revealAt,
                }
              : g,
          ),
        );
      } else toast.error(data.error || "Änderung fehlgeschlagen.");
    } catch {
      toast.error("Netzwerkfehler.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteGreeting(g: GreetingItem) {
    if (!confirm("Diese Botschaft wirklich löschen?")) return;
    setBusy(g.id);
    try {
      const res = await fetch(`/api/admin/greetings/${g.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setGreetings((prev) => prev.filter((x) => x.id !== g.id));
        toast.success("Botschaft gelöscht.");
      }
    } finally {
      setBusy(null);
    }
  }

  /* ---------- Gästebuch ---------- */

  async function deleteGuestbook(id: string) {
    if (!confirm("Diesen Gästebuch-Eintrag löschen?")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/guestbook/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setGuestbook((prev) => prev.filter((e) => e.id !== id));
        toast.success("Eintrag gelöscht.");
      }
    } finally {
      setBusy(null);
    }
  }

  /* ---------- Zeitkapsel ---------- */

  async function createLetter(e: React.FormEvent) {
    e.preventDefault();
    if (letterBody.trim().length < 2) {
      toast.error("Bitte schreibe ein paar Worte.");
      return;
    }
    setSavingLetter(true);
    try {
      const res = await fetch("/api/admin/capsule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: letterAuthor.trim() || "Unbekannt",
          body: letterBody.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.letter) {
        setLetters((prev) => [...prev, data.letter]);
        setLetterAuthor("");
        setLetterBody("");
        toast.success("Brief in der Zeitkapsel gespeichert.");
      } else toast.error(data.error || "Speichern fehlgeschlagen.");
    } catch {
      toast.error("Netzwerkfehler.");
    } finally {
      setSavingLetter(false);
    }
  }

  async function deleteLetter(id: string) {
    if (!confirm("Diesen Brief löschen?")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/capsule/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setLetters((prev) => prev.filter((l) => l.id !== id));
        toast.success("Brief gelöscht.");
      }
    } finally {
      setBusy(null);
    }
  }

  /* ---------- Team ---------- */

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    setCreatingInvite(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: inviteLabel.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.invite) {
        setInvites((prev) => [data.invite, ...prev]);
        setInviteLabel("");
        toast.success("Einladung erstellt – jetzt den Link teilen.");
      } else toast.error(data.error || "Einladung fehlgeschlagen.");
    } catch {
      toast.error("Netzwerkfehler.");
    } finally {
      setCreatingInvite(false);
    }
  }

  async function revokeInvite(id: string) {
    if (!confirm("Diese Einladung zurückziehen?")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/team/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInvites((prev) => prev.filter((i) => i.id !== id));
        toast.success("Einladung zurückgezogen.");
      }
    } finally {
      setBusy(null);
    }
  }

  function copyText(text: string, message: string) {
    navigator.clipboard?.writeText(text).then(() => toast.success(message));
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.assign("/");
  }

  function copyLink() {
    navigator.clipboard?.writeText(siteUrl).then(() => {
      setCopied(true);
      toast.success("Link kopiert.");
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const filterTabs: [MediaFilter, string, number][] = [
    ["all", "Alle", stats.total],
    ["visible", "Sichtbar", stats.visible],
    ["hidden", "Verborgen", stats.hidden],
    ["image", "Fotos", media.filter((m) => m.type === "image").length],
    ["video", "Videos", media.filter((m) => m.type === "video").length],
  ];

  return (
    <div>
      {/* Kopf */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Admin-Bereich</p>
          <h1 className="font-display text-4xl text-ink">Petersen Memories</h1>
        </div>
        <button onClick={logout} className="btn-outline self-start">
          <LogOut size={16} />
          Abmelden
        </button>
      </div>

      {/* Statistik */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Medien gesamt" value={stats.total} />
        <Stat label="Öffentlich sichtbar" value={stats.visible} tone="gold" />
        <Stat label="Verborgen" value={stats.hidden} tone="rose" />
        <Stat
          label="Botschaften offen"
          value={stats.pendingGreetings}
          tone="rose"
        />
      </div>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-beige pb-3">
        {(
          [
            ["media", "Foto-Verwaltung"],
            ["polaroids", "Polaroids"],
            ["greetings", "Botschaften"],
            ["guestbook", "Gästebuch"],
            ["capsule", "Zeitkapsel"],
            ["team", "Team"],
            ["tools", "QR-Code & Export"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`chip ${tab === key ? "chip-active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ---------- Foto-Verwaltung ---------- */}
      {tab === "media" && (
        <div className="mt-6">
          <p className="rounded-2xl bg-cream/70 p-4 text-sm text-cocoa">
            Hier <strong>verwaltest und bearbeitest</strong> du alle Fotos und
            Videos. Grün markierte Medien sind öffentlich sichtbar.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {filterTabs.map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`chip ${filter === key ? "chip-active" : ""}`}
              >
                {label} · {count}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <p className="card mt-5 p-8 text-center text-cocoa">
              Für diese Auswahl sind keine Medien vorhanden.
            </p>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <MediaAdminCard
                  key={item.id}
                  item={item}
                  busy={busy === item.id}
                  expanded={expanded === item.id}
                  comments={comments[item.id]}
                  onToggle={() => toggleApprove(item)}
                  onDelete={() => deleteMedia(item)}
                  onToggleComments={() => loadComments(item.id)}
                  onDeleteComment={(cid) => deleteComment(item.id, cid)}
                  onSaveEdit={(name, msg) => saveEdit(item.id, name, msg)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------- Polaroid-Kaertchen ---------- */}
      {tab === "polaroids" && (
        <div className="mt-6">
          <PolaroidAdmin
            cards={polaroids}
            onChange={setPolaroids}
            sections={polaroidSections}
          />
        </div>
      )}

      {/* ---------- Botschaften ---------- */}
      {tab === "greetings" && (
        <div className="mt-6">
          <p className="rounded-2xl bg-cream/70 p-4 text-sm text-cocoa">
            Audio- und Video-Botschaften der Gäste. Sie erscheinen erst
            öffentlich, wenn du sie <strong>freigibst</strong>. Videos lassen
            sich als zeitgesteuerte <strong>Überraschung</strong> markieren.
          </p>
          {greetings.length === 0 ? (
            <p className="card mt-5 p-8 text-center text-cocoa">
              Noch keine Botschaften eingegangen.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {greetings.map((g) => (
                <GreetingAdminCard
                  key={g.id}
                  greeting={g}
                  busy={busy === g.id}
                  onApprove={() =>
                    patchGreeting(g.id, { approved: !g.approved })
                  }
                  onSurprise={() =>
                    patchGreeting(g.id, { surprise: !g.surprise })
                  }
                  onReveal={(value) =>
                    patchGreeting(g.id, { revealAt: value })
                  }
                  onDelete={() => deleteGreeting(g)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------- Gästebuch ---------- */}
      {tab === "guestbook" && (
        <div className="mt-6 space-y-3">
          {guestbook.length === 0 && (
            <p className="card p-8 text-center text-cocoa">
              Noch keine Gästebuch-Einträge.
            </p>
          )}
          {guestbook.map((entry) => (
            <div
              key={entry.id}
              className="card flex items-start justify-between gap-4 p-4"
            >
              <div>
                <p className="font-display text-lg text-ink">
                  {entry.name || "Ein lieber Gast"}
                </p>
                <p className="text-xs text-muted">
                  {formatDateTime(entry.createdAt)}
                </p>
                <p className="mt-1 text-sm text-cocoa">{entry.message}</p>
              </div>
              <button
                onClick={() => deleteGuestbook(entry.id)}
                disabled={busy === entry.id}
                className="btn shrink-0 px-3 py-2 text-xs text-rosedeep hover:bg-rosedeep/10"
              >
                <Trash2 size={14} />
                Löschen
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ---------- Zeitkapsel ---------- */}
      {tab === "capsule" && (
        <div className="mt-6">
          <p className="rounded-2xl bg-cream/70 p-4 text-sm text-cocoa">
            Briefe an euer Zukunfts-Ich. Sie bleiben für die Gäste{" "}
            <strong>versiegelt</strong> und werden erst am ersten Hochzeitstag
            sichtbar.
          </p>
          <form onSubmit={createLetter} className="card mt-5 p-5">
            <div className="grid gap-3">
              <input
                type="text"
                className="field"
                placeholder="Von wem ist der Brief? (z. B. Leon)"
                value={letterAuthor}
                maxLength={60}
                onChange={(e) => setLetterAuthor(e.target.value)}
              />
              <textarea
                className="field min-h-[140px] resize-y"
                placeholder="Liebe Worte an unser Zukunfts-Ich …"
                value={letterBody}
                maxLength={4000}
                onChange={(e) => setLetterBody(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={savingLetter}
              className="btn-gold mt-4"
            >
              <Lock size={15} />
              {savingLetter ? "Wird versiegelt …" : "Brief versiegeln"}
            </button>
          </form>

          <div className="mt-5 space-y-3">
            {letters.length === 0 && (
              <p className="card p-8 text-center text-cocoa">
                Noch keine Briefe in der Zeitkapsel.
              </p>
            )}
            {letters.map((letter) => (
              <div key={letter.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg text-ink">
                      {letter.author}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDateTime(letter.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteLetter(letter.id)}
                    disabled={busy === letter.id}
                    className="btn shrink-0 px-3 py-2 text-xs text-rosedeep hover:bg-rosedeep/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-cocoa">
                  {letter.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- Team ---------- */}
      {tab === "team" && (
        <div className="mt-6">
          <p className="rounded-2xl bg-cream/70 p-4 text-sm text-cocoa">
            Lade <strong>Teammitglieder</strong> ein. Jede Einladung erzeugt
            einen persönlichen Link, der Admin-Zugriff gewährt.
          </p>
          <form
            onSubmit={createInvite}
            className="card mt-5 flex flex-col gap-3 p-5 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label className="label" htmlFor="invite-label">
                Name des Teammitglieds{" "}
                <span className="text-muted">(optional)</span>
              </label>
              <input
                id="invite-label"
                type="text"
                className="field"
                placeholder="z. B. Trauzeugin Anna"
                value={inviteLabel}
                maxLength={80}
                onChange={(e) => setInviteLabel(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={creatingInvite}
              className="btn-gold shrink-0"
            >
              <UserPlus size={16} />
              {creatingInvite ? "Wird erstellt …" : "Einladung erstellen"}
            </button>
          </form>
          <div className="mt-5 space-y-3">
            {invites.length === 0 && (
              <p className="card p-8 text-center text-cocoa">
                Noch keine Einladungen erstellt.
              </p>
            )}
            {invites.map((invite) => (
              <div key={invite.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg text-ink">
                      {invite.label || "Teammitglied"}
                    </p>
                    <p className="text-xs text-muted">
                      Erstellt am {formatDateTime(invite.createdAt)} ·{" "}
                      {invite.useCount}× verwendet
                    </p>
                  </div>
                  <button
                    onClick={() => revokeInvite(invite.id)}
                    disabled={busy === invite.id}
                    className="btn shrink-0 px-3 py-2 text-xs text-rosedeep hover:bg-rosedeep/10"
                  >
                    <Trash2 size={14} />
                    Zurückziehen
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-2xl bg-cream/70 p-2.5">
                  <Link2 size={15} className="shrink-0 text-gold" />
                  <span className="min-w-0 flex-1 truncate text-xs text-cocoa">
                    {invite.link}
                  </span>
                  <button
                    onClick={() =>
                      copyText(invite.link, "Einladungslink kopiert.")
                    }
                    className="btn-outline shrink-0 px-3 py-1.5 text-xs"
                  >
                    <Copy size={13} />
                    Kopieren
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- QR & Export ---------- */}
      {tab === "tools" && (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="card p-6 text-center">
            <h2 className="flex items-center justify-center gap-2 font-display text-2xl text-ink">
              <QrCode size={22} className="text-gold" /> QR-Code
            </h2>
            <p className="mt-1 text-sm text-cocoa">
              Drucke diesen Code aus und stelle ihn auf die Tische.
            </p>
            {qrDataUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrDataUrl}
                alt="QR-Code zur Hochzeitsseite"
                className="mx-auto mt-4 h-52 w-52 rounded-2xl border border-beige bg-white p-3"
              />
            ) : (
              <p className="mt-4 text-sm text-muted">
                QR-Code konnte nicht erzeugt werden.
              </p>
            )}
            <p className="mt-3 break-all text-xs text-muted">{siteUrl}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                onClick={copyLink}
                className="btn-outline px-4 py-2 text-sm"
              >
                <Copy size={15} />
                {copied ? "Kopiert!" : "Link kopieren"}
              </button>
              <button
                onClick={() => window.print()}
                className="btn-outline px-4 py-2 text-sm"
              >
                <Printer size={15} />
                Drucken
              </button>
            </div>
          </div>
          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-display text-2xl text-ink">
              <Download size={20} className="text-gold" /> Alle Medien sichern
            </h2>
            <p className="mt-1 text-sm text-cocoa">
              Lade sämtliche Fotos und Videos als ZIP-Archiv herunter.
            </p>
            <a href="/api/admin/download" className="btn-gold mt-5 w-full">
              <Download size={16} />
              ZIP-Archiv herunterladen
            </a>
            <p className="mt-3 text-xs text-muted">
              {stats.total} Datei{stats.total === 1 ? "" : "en"} im Archiv.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Statistik-Kachel ---------- */

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "gold" | "rose";
}) {
  const color =
    tone === "gold"
      ? "text-golddeep"
      : tone === "rose"
        ? "text-rosedeep"
        : "text-gold";
  return (
    <div className="card px-4 py-5 text-center">
      <p className={`font-display text-3xl ${color}`}>{value}</p>
      <p className="mt-0.5 text-xs uppercase tracking-wider text-muted">
        {label}
      </p>
    </div>
  );
}

/* ---------- Botschafts-Karte ---------- */

function GreetingAdminCard({
  greeting,
  busy,
  onApprove,
  onSurprise,
  onReveal,
  onDelete,
}: {
  greeting: GreetingItem;
  busy: boolean;
  onApprove: () => void;
  onSurprise: () => void;
  onReveal: (value: string) => void;
  onDelete: () => void;
}) {
  const fileUrl = `/api/greetings/${greeting.id}/file`;

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="sm:w-56 sm:shrink-0">
          {greeting.kind === "video" ? (
            <video
              src={`${fileUrl}#t=0.1`}
              controls
              preload="metadata"
              className="aspect-video w-full rounded-2xl bg-noir"
            />
          ) : (
            <div className="flex items-center gap-2 rounded-2xl bg-cream/70 p-3">
              <Mic size={18} className="shrink-0 text-gold" />
              <audio src={fileUrl} controls className="min-w-0 flex-1" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-noir/65 px-2.5 py-1 text-[11px] font-medium text-ivory">
              {greeting.kind === "video" ? (
                <Film size={11} />
              ) : (
                <Mic size={11} />
              )}
              {greeting.kind === "video" ? "Video" : "Audio"}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                greeting.approved
                  ? "bg-gold/20 text-golddeep"
                  : "bg-rosedeep/15 text-rosedeep"
              }`}
            >
              {greeting.approved ? "Freigegeben" : "Wartet auf Freigabe"}
            </span>
          </div>
          <p className="mt-2 font-display text-lg text-ink">
            {greeting.guestName || "Unbekannter Gast"}
          </p>
          <p className="text-xs text-muted">
            {formatDateTime(greeting.createdAt)} ·{" "}
            {formatBytes(greeting.size)}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={onApprove}
              disabled={busy}
              className={`btn px-3.5 py-2 text-xs ${
                greeting.approved
                  ? "border border-beige text-cocoa hover:bg-sand/70"
                  : "bg-gradient-to-br from-gold to-golddeep text-ivory shadow-soft"
              }`}
            >
              {greeting.approved ? <EyeOff size={14} /> : <Eye size={14} />}
              {greeting.approved ? "Verbergen" : "Freigeben"}
            </button>
            {greeting.kind === "video" && (
              <button
                onClick={onSurprise}
                disabled={busy}
                className={`btn px-3.5 py-2 text-xs ${
                  greeting.surprise
                    ? "bg-gradient-to-br from-rose to-rosedeep text-ivory shadow-soft"
                    : "border border-beige text-cocoa hover:bg-sand/70"
                }`}
              >
                <Sparkles size={14} />
                Überraschung
              </button>
            )}
            <button
              onClick={onDelete}
              disabled={busy}
              className="btn px-3 py-2 text-xs text-rosedeep hover:bg-rosedeep/10"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {greeting.surprise && (
            <label className="mt-3 flex items-center gap-2 text-xs text-cocoa">
              <Clock size={14} className="text-gold" />
              Sichtbar ab:
              <input
                type="datetime-local"
                defaultValue={
                  greeting.revealAt ? greeting.revealAt.slice(0, 16) : ""
                }
                onChange={(e) => onReveal(e.target.value)}
                className="field max-w-[15rem] px-2 py-1 text-xs"
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Medien-Karte ---------- */

function MediaAdminCard({
  item,
  busy,
  expanded,
  comments,
  onToggle,
  onDelete,
  onToggleComments,
  onDeleteComment,
  onSaveEdit,
}: {
  item: MediaItem;
  busy: boolean;
  expanded: boolean;
  comments?: CommentItem[];
  onToggle: () => void;
  onDelete: () => void;
  onToggleComments: () => void;
  onDeleteComment: (commentId: string) => void;
  onSaveEdit: (guestName: string, message: string) => Promise<boolean>;
}) {
  const fileUrl = `/api/media/${item.id}/file`;
  const [editing, setEditing] = useState(false);
  const [guestName, setGuestName] = useState(item.guestName ?? "");
  const [message, setMessage] = useState(item.message ?? "");
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setGuestName(item.guestName ?? "");
    setMessage(item.message ?? "");
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    const ok = await onSaveEdit(guestName.trim(), message.trim());
    setSaving(false);
    if (ok) setEditing(false);
  }

  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-[4/3] bg-sand">
        {item.type === "image" ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={fileUrl}
            alt=""
            loading="lazy"
            className={`h-full w-full object-cover transition ${
              item.approved ? "" : "opacity-45 grayscale"
            }`}
          />
        ) : (
          <video
            src={`${fileUrl}#t=0.1`}
            preload="metadata"
            muted
            className={`h-full w-full object-cover transition ${
              item.approved ? "" : "opacity-45 grayscale"
            }`}
          />
        )}
        <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-noir/65 px-2.5 py-1 text-[11px] font-medium text-ivory backdrop-blur">
          {item.type === "video" ? <Film size={11} /> : <ImageIcon size={11} />}
          {item.type === "video" ? "Video" : "Foto"}
        </span>
        <span
          className={`absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-soft ${
            item.approved
              ? "bg-gold text-ivory"
              : "bg-noir/75 text-ivory backdrop-blur"
          }`}
        >
          {item.approved ? <Eye size={11} /> : <EyeOff size={11} />}
          {item.approved ? "Auf der Seite" : "Verborgen"}
        </span>
      </div>

      <div className="p-4">
        {editing ? (
          <div className="space-y-2.5">
            <div>
              <label className="label">Gastname</label>
              <input
                type="text"
                className="field"
                value={guestName}
                maxLength={80}
                placeholder="Name des Gastes"
                onChange={(e) => setGuestName(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Nachricht</label>
              <textarea
                className="field min-h-[70px] resize-y"
                value={message}
                maxLength={400}
                placeholder="Nachricht zum Medium"
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="btn-gold flex-1 px-3 py-2 text-xs"
              >
                <Save size={14} />
                {saving ? "Speichert …" : "Speichern"}
              </button>
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="btn-outline px-3 py-2 text-xs"
              >
                <X size={14} />
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="font-display text-lg text-ink">
              {item.guestName || "Unbekannter Gast"}
            </p>
            <p className="text-xs text-muted">
              {formatDateTime(item.createdAt)} · {formatBytes(item.size)}
            </p>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-cocoa">
              <span className="flex items-center gap-1">
                <Heart size={12} className="text-rose" fill="currentColor" />
                {item.likeCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle size={12} /> {item.commentCount}
              </span>
            </div>
            {item.message && (
              <p className="mt-2 line-clamp-2 text-sm italic text-cocoa">
                „{item.message}“
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={onToggle}
                disabled={busy}
                className={`btn px-3.5 py-2 text-xs ${
                  item.approved
                    ? "border border-beige text-cocoa hover:bg-sand/70"
                    : "bg-gradient-to-br from-gold to-golddeep text-ivory shadow-soft"
                }`}
              >
                {item.approved ? <EyeOff size={14} /> : <Eye size={14} />}
                {item.approved ? "Verbergen" : "Anzeigen"}
              </button>
              <button
                onClick={startEdit}
                className="btn-outline px-3 py-2 text-xs"
              >
                <Pencil size={13} />
                Bearbeiten
              </button>
              <button
                onClick={onToggleComments}
                className="btn-ghost px-3 py-2 text-xs"
              >
                <MessageCircle size={14} />
                {item.commentCount}
              </button>
              <button
                onClick={onDelete}
                disabled={busy}
                className="btn px-3 py-2 text-xs text-rosedeep hover:bg-rosedeep/10"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </>
        )}
      </div>

      {expanded && !editing && (
        <div className="border-t border-beige bg-cream/60 p-4">
          {!comments && <p className="text-sm text-muted">Wird geladen …</p>}
          {comments?.length === 0 && (
            <p className="text-sm text-muted">Keine Kommentare vorhanden.</p>
          )}
          <div className="space-y-2">
            {comments?.map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between gap-3 rounded-2xl bg-ivory p-3"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {c.author || "Gast"}
                  </p>
                  <p className="text-sm text-cocoa">{c.body}</p>
                </div>
                <button
                  onClick={() => onDeleteComment(c.id)}
                  className="shrink-0 text-rosedeep hover:text-rose"
                  aria-label="Kommentar löschen"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
