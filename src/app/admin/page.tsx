import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { siteConfig } from "@/lib/config";
import {
  getAllGreetings,
  getAllMedia,
  serializeCapsuleLetter,
  serializeGuestbook,
  serializeInvite,
} from "@/lib/media";
import { getAllPolaroidCards } from "@/lib/polaroids";
import { POLAROID_SECTIONS } from "@/lib/polaroidSections";
import { AdminDashboard } from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin-Bereich",
};

export default async function AdminPage() {
  // Zusätzliche Absicherung – die Middleware schützt bereits den Pfad.
  if (!isAdmin()) {
    redirect("/admin/login");
  }

  // Basis-URL aus der aktuellen Anfrage ableiten – so zeigen QR-Code
  // und Einladungslinks immer auf die tatsächlich genutzte Adresse.
  const h = headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() || "http";
  const baseUrl = host ? `${proto}://${host}` : siteConfig.siteUrl;

  const [media, guestbookRows, inviteRows, greetings, letterRows, polaroids] =
    await Promise.all([
      getAllMedia(),
      prisma.guestbookEntry.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.teamInvite.findMany({ orderBy: { createdAt: "desc" } }),
      getAllGreetings(),
      prisma.timeCapsuleLetter.findMany({ orderBy: { createdAt: "asc" } }),
      getAllPolaroidCards(),
    ]);

  const qrTarget = `${baseUrl}/upload`;
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(qrTarget, {
      width: 480,
      margin: 1,
      color: { dark: "#43392F", light: "#FFFFFF" },
    });
  } catch {
    qrDataUrl = "";
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <AdminDashboard
        initialMedia={media}
        initialGuestbook={guestbookRows.map(serializeGuestbook)}
        initialInvites={inviteRows.map((row) => serializeInvite(row, baseUrl))}
        initialGreetings={greetings}
        initialLetters={letterRows.map(serializeCapsuleLetter)}
        initialPolaroids={polaroids}
        polaroidSections={POLAROID_SECTIONS}
        qrDataUrl={qrDataUrl}
        siteUrl={qrTarget}
      />
    </div>
  );
}
