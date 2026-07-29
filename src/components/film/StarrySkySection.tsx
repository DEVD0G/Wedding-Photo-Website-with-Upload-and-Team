"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { EASE_OUT, viewportOnce } from "@/lib/motion";

// Der Three.js-Canvas wird nur im Browser geladen.
const StarrySkyCanvas = dynamic(() => import("./StarrySkyCanvas"), {
  ssr: false,
});

/**
 * Animierter Sternenhimmel mit Three.js – „Der Himmel über unserem
 * Moment". Bewusst reduziert: nur die goldene Zeile und die Überschrift
 * über dem Sternenhimmel.
 */
export function StarrySkySection() {
  return (
    <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden bg-noir">
      {/* 3D-Sternenhimmel */}
      <div className="absolute inset-0">
        <StarrySkyCanvas />
      </div>

      {/* warmer Lichtschimmer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(40rem 30rem at 50% 80%, rgba(198,162,75,0.18), transparent 70%)",
        }}
      />

      {/* Text-Ebene – nur goldene Zeile + Überschrift */}
      <motion.div
        className="relative z-10 mx-auto max-w-2xl px-5 text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        transition={{ duration: 1, ease: EASE_OUT }}
      >
        <p className="text-xs uppercase tracking-wider2 text-gold">
          Der Himmel über unserem Moment
        </p>
        <h2 className="mt-3 font-display text-4xl text-ivory sm:text-6xl">
          Unsere Sterne
        </h2>
      </motion.div>

      <span className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-noir to-transparent" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-noir to-transparent" />
    </section>
  );
}
