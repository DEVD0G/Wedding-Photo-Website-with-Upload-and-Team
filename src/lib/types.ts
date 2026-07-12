/** Serialisierbare Typen, die zwischen Server- und Client-Komponenten wandern. */

export interface MediaItem {
  id: string;
  type: "image" | "video";
  originalName: string;
  mimeType: string;
  size: number;
  guestName: string | null;
  message: string | null;
  approved: boolean;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

export interface CommentItem {
  id: string;
  author: string | null;
  body: string;
  createdAt: string;
}

export interface GreetingItem {
  id: string;
  kind: "audio" | "video";
  originalName: string;
  mimeType: string;
  size: number;
  guestName: string | null;
  approved: boolean;
  surprise: boolean;
  revealAt: string | null;
  createdAt: string;
}

export interface CapsuleLetterItem {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface PolaroidCardItem {
  id: string;
  section: string;
  sortOrder: number;
  caption: string;
  note: string | null;
  tone: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface TeamInviteItem {
  id: string;
  label: string | null;
  revoked: boolean;
  useCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  link: string;
}
