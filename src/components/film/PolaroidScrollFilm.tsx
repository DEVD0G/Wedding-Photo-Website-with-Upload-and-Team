"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { filmPolaroids, type Polaroid } from "@/lib/story";
import { AnimatedSectionTitle } from "@/components/animation/AnimatedSectionTitle";
import { PolaroidCard } from "./PolaroidCard";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// leichte, abwechselnde Rotation & Ausrichtung je Polaroid
const LAYOUT = [
  { align: "self-start sm:ml-[8%]", rotate: -6 },
  { align: "self-end sm:mr-[10%]", rotate: 5 },
  { align: "self-center", rotate: -3 },
  { align: "self-start sm:ml-[14%]", rotate: 7 },
  { align: "self-end sm:mr-[6%]", rotate: -5 },
  { align: "self-center", rotate: 4 },
];

/**
 * Filmische Polaroid-Sequenz: Die Bilder schweben beim Scrollen
 * nacheinander ins Bild, kippen leicht und ziehen mit Parallax weiter.
 * Die Kaertchen kommen aus der Datenbank (Admin-Dashboard) und fallen
 * ohne eigene Eintraege auf die eingebauten Standard-Kaertchen zurueck.
 */
export function PolaroidScrollFilm({
  polaroids = filmPolaroids,
}: {
  polaroids?: Polaroid[];
}) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const cards = gsap.utils.toArray<HTMLElement>(".pm-film-polaroid");
      cards.forEach((card, i) => {
        const dir = i % 2 === 0 ? -1 : 1;
        gsap.fromTo(
          card,
          { y: 120, autoAlpha: 0, rotate: dir * 10 },
          {
            y: -90,
            autoAlpha: 1,
            rotate: LAYOUT[i % LAYOUT.length].rotate,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top 92%",
              end: "bottom 12%",
              scrub: 1,
            },
          },
        );
      });
    },
    { scope: container },
  );

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-5">
        <AnimatedSectionTitle
          eyebrow="Unser Film"
          title="Bilder, die bleiben"
          script="Moment für Moment"
          subtitle="Scrolle langsam – jede Erinnerung schwebt herein wie ein frisch entwickeltes Foto."
        />
      </div>

      <div
        ref={container}
        className="mx-auto mt-12 flex max-w-2xl flex-col gap-10 px-5 sm:gap-4"
      >
        {polaroids.map((polaroid, i) => (
          <div
            key={`${polaroid.caption}-${i}`}
            className={`pm-film-polaroid ${LAYOUT[i % LAYOUT.length].align}`}
          >
            <PolaroidCard
              polaroid={polaroid}
              rotate={LAYOUT[i % LAYOUT.length].rotate}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
