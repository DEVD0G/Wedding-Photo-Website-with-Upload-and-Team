"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Heart, Menu, X } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { EASE_OUT } from "@/lib/motion";

const NAV = [
  { href: "/", label: "Start" },
  { href: "/upload", label: "Hochladen" },
  { href: "/galerie", label: "Galerie" },
  { href: "/botschaften", label: "Botschaften" },
  { href: "/slideshow", label: "Slideshow" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  // Header im Admin-Bereich und auf der Live-Wand ausblenden.
  if (pathname.startsWith("/admin") || pathname.startsWith("/wall")) {
    return null;
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.1 }}
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/60 bg-cream/85 shadow-soft backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="group flex items-center gap-3">
          <motion.span
            whileHover={{ rotate: 8, scale: 1.06 }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-ivory/80 text-rose shadow-soft"
          >
            <Heart size={20} fill="currentColor" strokeWidth={0} />
          </motion.span>
          <span className="leading-tight">
            <span className="block font-display text-xl font-semibold text-ink">
              {siteConfig.projectName}
            </span>
            <span className="block font-script text-base text-rosedeep">
              {siteConfig.coupleNames}
            </span>
          </span>
        </Link>

        {/* Desktop-Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                isActive(item.href) ? "text-ink" : "text-cocoa hover:text-ink"
              }`}
            >
              {item.label}
              {isActive(item.href) && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
                />
              )}
            </Link>
          ))}
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
            <Link href="/upload" className="btn-gold ml-2 px-5 py-2.5 text-sm">
              <Camera size={16} />
              Hochladen
            </Link>
          </motion.div>
        </nav>

        {/* Mobile-Umschalter */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-ivory/80 text-cocoa md:hidden"
          aria-label="Menü öffnen"
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile-Navigation */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="overflow-hidden md:hidden"
          >
            <div className="mx-4 mb-4 rounded-3xl border border-white/70 bg-ivory/95 p-3 shadow-card backdrop-blur-md">
              {NAV.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <Link
                    href={item.href}
                    className={`block rounded-2xl px-4 py-3 text-base font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-sand/80 text-ink"
                        : "text-cocoa hover:bg-sand/50"
                    }`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <Link href="/upload" className="btn-gold mt-2 w-full">
                <Camera size={16} />
                Foto oder Video hochladen
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
