"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Images, RotateCcw, Upload } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { EASE_OUT, staggerContainer, viewportOnce } from "@/lib/motion";
import { MotionButton } from "@/components/animation/MotionButton";
import { FloatingHearts } from "@/components/animation/FloatingHearts";
import { PolaroidCard } from "./PolaroidCard";
import { filmPolaroids, type Polaroid } from "@/lib/story";

const LINES = [
  "Und unter all den Momenten,",
  "die wir an diesem Tag sammeln,",
  "bist du immer noch mein schönster.",
];

/**
 * Emotionaler Abschluss: Der Hintergrund wird dunkler, Polaroids
 * schweben langsam aus dem Bild, der letzte Text erscheint Zeile für
 * Zeile – gefolgt von den abschließenden Buttons.
 */
export function EmotionalFinale({
  polaroids = filmPolaroids,
}: {
  polaroids?: Polaroid[];
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const poFloat = useTransform(scrollYProgress, [0, 1], ["0%", "-160%"]);
  const poFade = useTransform(scrollYProgress, [0.1, 0.5], [0.85, 0]);

  function watchAgain() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-28"
      style={{
        background: "linear-gradient(180deg,#EAD8B6 0%,#6E5D4C 45%,#241E1A 100%)",
      }}
    >
      <FloatingHearts count={10} />

      {/* davonschwebende Polaroids */}
      <motion.div
        style={{ y: poFloat, opacity: poFade }}
        className="pointer-events-none absolute inset-x-0 top-10 flex justify-center gap-6"
        aria-hidden
      >
        {polaroids.slice(0, 3).map((p, i) => (
          <PolaroidCard
            key={`${p.caption}-${i}`}
            polaroid={p}
            rotate={(i - 1) * 8}
            className="hidden max-w-[9rem] sm:block"
          />
        ))}
      </motion.div>

      <div className="relative mx-auto max-w-2xl px-5 pt-44 text-center sm:pt-52">
        <motion.div
          variants={staggerContainer(0.5)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          {LINES.map((line, i) => (
            <motion.p
              key={i}
              className="font-display text-3xl leading-snug text-ivory sm:text-4xl"
              variants={{
                hidden: { opacity: 0, y: 22 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 1, ease: EASE_OUT },
                },
              }}
            >
              {line}
            </motion.p>
          ))}
        </motion.div>

        <motion.p
          className="mt-8 font-script text-5xl text-gold-gradient"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 1.2, delay: 1.6 }}
        >
          {siteConfig.coupleNames}
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.8, delay: 2 }}
        >
          <MotionButton href="/galerie" variant="gold">
            <Images size={17} />
            Unsere Galerie ansehen
          </MotionButton>
          <MotionButton href="/upload" variant="rose">
            <Upload size={17} />
            Moment hochladen
          </MotionButton>
          <button
            type="button"
            onClick={watchAgain}
            className="btn text-ivory/70 hover:text-ivory"
          >
            <RotateCcw size={16} />
            Noch einmal ansehen
          </button>
        </motion.div>
      </div>
    </section>
  );
}
