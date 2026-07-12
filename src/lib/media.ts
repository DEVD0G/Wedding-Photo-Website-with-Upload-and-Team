import { cookies } from "next/headers";
import { prisma } from "./db";
import { VISITOR_COOKIE } from "./auth";
import type {
  MediaItem,
  CommentItem,
  TeamInviteItem,
  GreetingItem,
  CapsuleLetterItem,
} from "./types";

/** Liest die anonyme Besucher-ID aus dem Cookie (von der Middleware gesetzt). */
export function getVisitorId(): string {
  return cookies().get(VISITOR_COOKIE)?.value ?? "";
}

const NO_MATCH = "__no_visitor__";

type MediaRow = {
  id: string;
  type: string;
  originalName: string;
  mimeType: string;
  size: number;
  guestName: string | null;
  message: string | null;
  approved: boolean;
  createdAt: Date;
  _count?: { likes: number; comments: number };
  likes?: { id: string }[];
};

export function serializeMedia(row: MediaRow): MediaItem {
  return {
    id: row.id,
    type: row.type === "video" ? "video" : "image",
    originalName: row.originalName,
    mimeType: row.mimeType,
    size: row.size,
    guestName: row.guestName,
    message: row.message,
    approved: row.approved,
    createdAt: row.createdAt.toISOString(),
    likeCount: row._count?.likes ?? 0,
    commentCount: row._count?.comments ?? 0,
    likedByMe: Array.isArray(row.likes) && row.likes.length > 0,
  };
}

/** Alle sichtbaren (freigegebenen) Medien – fuer Galerie & Slideshow. */
export async function getVisibleMedia(visitorId: string): Promise<MediaItem[]> {
  const rows = await prisma.media.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { likes: true, comments: true } },
      likes: { where: { visitorId: visitorId || NO_MATCH }, select: { id: true } },
    },
  });
  return rows.map(serializeMedia);
}

/** Alle Medien inkl. nicht freigegebener – nur fuer den Admin-Bereich. */
export async function getAllMedia(): Promise<MediaItem[]> {
  const rows = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { likes: true, comments: true } } },
  });
  return rows.map(serializeMedia);
}

export function serializeComment(row: {
  id: string;
  author: string | null;
  body: string;
  createdAt: Date;
}): CommentItem {
  return {
    id: row.id,
    author: row.author,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

type GreetingRow = {
  id: string;
  kind: string;
  originalName: string;
  mimeType: string;
  size: number;
  guestName: string | null;
  approved: boolean;
  surprise: boolean;
  revealAt: Date | null;
  createdAt: Date;
};

export function serializeGreeting(row: GreetingRow): GreetingItem {
  return {
    id: row.id,
    kind: row.kind === "video" ? "video" : "audio",
    originalName: row.originalName,
    mimeType: row.mimeType,
    size: row.size,
    guestName: row.guestName,
    approved: row.approved,
    surprise: row.surprise,
    revealAt: row.revealAt ? row.revealAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Sichtbare Botschaften: freigegeben und (falls Überraschung) enthüllt. */
export async function getVisibleGreetings(
  kind?: "audio" | "video",
): Promise<GreetingItem[]> {
  const now = new Date();
  const rows = await prisma.greeting.findMany({
    where: {
      approved: true,
      ...(kind ? { kind } : {}),
      OR: [{ surprise: false }, { surprise: true, revealAt: { lte: now } }],
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serializeGreeting);
}

export async function getAllGreetings(): Promise<GreetingItem[]> {
  const rows = await prisma.greeting.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serializeGreeting);
}

export function serializeCapsuleLetter(row: {
  id: string;
  author: string;
  body: string;
  createdAt: Date;
}): CapsuleLetterItem {
  return {
    id: row.id,
    author: row.author,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeInvite(
  row: {
    id: string;
    token: string;
    label: string | null;
    revoked: boolean;
    useCount: number;
    lastUsedAt: Date | null;
    createdAt: Date;
  },
  baseUrl: string,
): TeamInviteItem {
  return {
    id: row.id,
    label: row.label,
    revoked: row.revoked,
    useCount: row.useCount,
    lastUsedAt: row.lastUsedAt ? row.lastUsedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    link: `${baseUrl}/team-einladung/${row.token}`,
  };
}
