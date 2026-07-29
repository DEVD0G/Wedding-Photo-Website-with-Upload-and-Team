"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/config";
import { AnimatedFloralLine } from "./animation/AnimatedFloralLine";
import { ScrollReveal } from "./animation/ScrollReveal";

export function SiteFooter() {
  const pathname = usePathname();

  // Auf der Live-Wand keinen Footer zeigen.
  if (pathname.startsWith("/wall")) return null;

  return (
    <footer className="mt-10 border-t border-white/60 bg-ivory/60 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-5 py-14 text-center">
        <AnimatedFloralLine />
        <ScrollReveal className="mt-7">
          <p className="font-script text-4xl text-rosedeep">
            {siteConfig.coupleNames}
          </p>
          {siteConfig.weddingDate && (
            <p className="mt-1 text-sm uppercase tracking-wider2 text-gold">
              {siteConfig.weddingDate}
            </p>
          )}
          <p className="mt-5 text-sm text-cocoa">
            Mit Liebe erstellt für die Hochzeit der Petersen&apos;s.
          </p>

          <nav className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
            <Link href="/" className="transition-colors hover:text-ink">
              Start
            </Link>
            <Link href="/galerie" className="transition-colors hover:text-ink">
              Galerie
            </Link>
            <Link href="/botschaften" className="transition-colors hover:text-ink">
              Botschaften
            </Link>
            <Link href="/slideshow" className="transition-colors hover:text-ink">
              Slideshow
            </Link>
            <Link href="/admin" className="transition-colors hover:text-ink">
              Admin
            </Link>
          </nav>

          <p className="mt-8 text-xs text-muted/80">
            © {new Date().getFullYear()} {siteConfig.projectName}
          </p>
        </ScrollReveal>
      </div>
    </footer>
  );
}
