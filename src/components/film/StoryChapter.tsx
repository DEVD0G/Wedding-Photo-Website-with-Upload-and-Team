"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { Polaroid, StoryChapter as Chapter } from "@/lib/story";
import { AnimatedSectionTitle } from "@/components/animation/AnimatedSectionTitle";
import { ScrollReveal } from "@/components/animation/ScrollReveal";
import { PolaroidCard } from "./PolaroidCard";

/**
 * Ein Kapitel der Scroll-Journey „Unsere Geschichte" – mit großem
 * Hintergrund, Parallax-Polaroids, animierten Texten und einem Zitat.
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
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const frontY = useTransform(scrollYProgress, [0, 1], ["-18%", "18%"]);
  const backY = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"]);
  const numeralY = useTransform(scrollYProgress, [0, 1], ["12%", "-12%"]);

  const dark = chapter.tone === "dark";
  const flip = index % 2 === 1;

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
        {/* Polaroid-Paar mit Parallax */}
        <div className={flip ? "lg:order-2" : "lg:order-1"}>
          <div className="relative mx-auto h-[26rem] w-full max-w-sm">
            <motion.div
              style={{ y: backY }}
              className="absolute right-2 top-2"
            >
              <PolaroidCard
                polaroid={cards[1] ?? cards[0]}
                rotate={6}
                className="max-w-[13rem]"
              />
            </motion.div>
            <motion.div
              style={{ y: frontY }}
              className="absolute bottom-2 left-2"
            >
              <PolaroidCard
                polaroid={cards[0]}
                rotate={-5}
                className="max-w-[15rem]"
              />
            </motion.div>
          </div>
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
