"use client";

import { useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import type { Polaroid, StoryChapter as Chapter } from "@/lib/story";
import { AnimatedSectionTitle } from "@/components/animation/AnimatedSectionTitle";
import { ScrollReveal } from "@/components/animation/ScrollReveal";
import { PolaroidCard } from "./PolaroidCard";

/** Vordere (sichtbare) und hintere Position im Foto-Stapel. */
const FRONT_POS = {
  x: "-12%",
  y: "9%",
  rotate: -5,
  scale: 1,
  opacity: 1,
};
const BACK_POS = {
  x: "22%",
  y: "-11%",
  rotate: 6,
  scale: 0.84,
  opacity: 0.92,
};

/**
 * Ein Kapitel der Scroll-Journey „Unsere Geschichte" – mit großem
 * Hintergrund, Parallax-Fotos, animierten Texten und einem Zitat.
 *
 * Die zwei Kapitel-Fotos liegen als Stapel übereinander. Beim Hovern
 * (Maus) bzw. Antippen (Handy) tauschen sie animiert die Plätze, sodass
 * jeweils das andere Foto mit seiner Beschriftung nach vorn kommt.
 */
export function StoryChapter({
  chapter,
  index,
  polaroids,
}: {
  chapter: Chapter;
  index: number;
  /** Kaertchen aus der Datenbank – ohne Eintraege gelten die des Kapitels. */
  polaroids?: Polaroid[];
}) {
  const cards =
    polaroids && polaroids.length > 0 ? polaroids : chapter.polaroids;
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // Welches Foto liegt vorn? Ein Klick/Tap merkt sich die Auswahl,
  // Hovern zeigt vorübergehend das jeweils andere Foto.
  const [pinned, setPinned] = useState(0);
  const [hovered, setHovered] = useState(false);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const cardAY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const cardBY = useTransform(scrollYProgress, [0, 1], ["12%", "-12%"]);
  const numeralY = useTransform(scrollYProgress, [0, 1], ["12%", "-12%"]);

  const dark = chapter.tone === "dark";
  const flip = index % 2 === 1;

  const pair: Polaroid[] = [cards[0], cards[1]].filter(Boolean) as Polaroid[];
  const hasTwo = pair.length > 1;
  const active = hasTwo && hovered ? 1 - pinned : pinned;

  const swapTransition = reduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 220, damping: 26, mass: 0.9 };

  function toggle() {
    if (!hasTwo) return;
    setPinned((p) => 1 - p);
    // Nach dem Tippen soll die Auswahl stehen bleiben – ein evtl. vom
    // Touch ausgelöster Hover-Zustand wird daher zurückgesetzt.
    setHovered(false);
  }

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-24 sm:py-32"
      style={{ background: chapter.background }}
    >
      {/* großes Kapitel-Numeral im Hintergrund */}
      <motion.span
        aria-hidden
        style={{ y: numeralY }}
        className={`pointer-events-none absolute -top-6 select-none font-display text-[14rem] leading-none sm:text-[20rem] ${
          flip ? "right-2" : "left-2"
        } ${dark ? "text-ivory/[0.05]" : "text-ink/[0.05]"}`}
      >
        {chapter.numeral}
      </motion.span>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2 lg:gap-16">
        {/* Foto-Stapel mit Parallax & Wechsel-Animation */}
        <div className={flip ? "lg:order-2" : "lg:order-1"}>
          <motion.div
            className={`relative mx-auto h-[26rem] w-full max-w-sm ${
              hasTwo ? "cursor-pointer select-none" : ""
            }`}
            onHoverStart={() => hasTwo && setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            onClick={toggle}
            onKeyDown={(e) => {
              if (!hasTwo) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle();
              }
            }}
            role={hasTwo ? "button" : undefined}
            tabIndex={hasTwo ? 0 : undefined}
            aria-label={
              hasTwo
                ? `Zwischen den beiden Fotos von „${chapter.title}“ wechseln`
                : undefined
            }
          >
            {pair.map((polaroid, i) => {
              const isActive = i === active;
              return (
                <motion.div
                  key={i}
                  style={{
                    y: i === 0 ? cardAY : cardBY,
                    zIndex: isActive ? 20 : 10,
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <motion.div
                    className="w-full max-w-[15rem]"
                    animate={isActive ? FRONT_POS : BACK_POS}
                    transition={swapTransition}
                  >
                    {/* Breite steuert der Wrapper – die Karte füllt ihn aus. */}
                    <PolaroidCard polaroid={polaroid} />
                  </motion.div>
                </motion.div>
              );
            })}

            {/* Kleine Anzeige, welches Foto vorn liegt */}
            {hasTwo && (
              <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-1.5">
                <div className="flex gap-1.5">
                  {pair.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === active
                          ? "w-5 bg-gold"
                          : dark
                            ? "w-1.5 bg-ivory/35"
                            : "w-1.5 bg-ink/20"
                      }`}
                    />
                  ))}
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wider sm:hidden ${
                    dark ? "text-ivory/45" : "text-ink/35"
                  }`}
                >
                  Tippen zum Wechseln
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Text */}
        <div className={flip ? "lg:order-1" : "lg:order-2"}>
          <AnimatedSectionTitle
            eyebrow={chapter.eyebrow}
            title={chapter.title}
            align="left"
            tone={chapter.tone}
          />
          <ScrollReveal delay={0.1} direction={flip ? "left" : "right"}>
            <p
              className={`mt-5 max-w-md text-lg leading-relaxed ${
                dark ? "text-ivory/75" : "text-cocoa"
              }`}
            >
              {chapter.text}
            </p>
            <p
              className={`mt-6 border-l-2 pl-4 font-display text-xl italic ${
                dark
                  ? "border-gold/60 text-ivory"
                  : "border-gold/60 text-ink"
              }`}
            >
              {chapter.quote}
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
