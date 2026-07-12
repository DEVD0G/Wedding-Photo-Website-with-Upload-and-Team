"use client";

import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";

/**
 * Aufsteigende Herzen beim Herunterscrollen im oberen Seitenbereich –
 * der sanfte Ersatz für die frühere Polaroid-Collage.
 *
 * Verhalten:
 *  - Herzen erscheinen nur, während der Gast aktiv nach unten scrollt,
 *    und nur innerhalb der ersten ~2 Bildschirmhöhen der Seite.
 *  - Jedes Herz blendet weich ein, steigt mit leichtem seitlichen
 *    Drift auf und blendet wieder aus (reine CSS-Keyframe-Animation,
 *    JavaScript übernimmt nur das sparsame Erzeugen).
 *  - Höchstens 14 Herzen gleichzeitig, gedrosselt auf eines pro ~150 ms –
 *    elegant statt überladen.
 *  - Bei aktivierter Bewegungsreduzierung erscheint nichts.
 */

interface HeartSpawn {
  id: number;
  left: number; // Position in vw
  bottom: number; // Start-Abstand vom unteren Rand in vh
  size: number; // px
  duration: number; // s
  sway: number; // seitlicher Drift in px
  rotate: number; // Grad
  opacity: number;
  color: string;
}

const COLORS = ["#DDA29E", "#C27C74", "#C6A24B", "#EFD0CB"];
const MAX_HEARTS = 14;
const SPAWN_INTERVAL_MS = 150;
/** Nur im oberen Seitenbereich (in Bildschirmhöhen) Herzen erzeugen. */
const ACTIVE_UNTIL_VIEWPORTS = 2.2;

export function ScrollHearts() {
  const [hearts, setHearts] = useState<HeartSpawn[]>([]);
  const lastSpawnRef = useRef(0);
  const lastYRef = useRef(0);
  const idRef = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Auf 0 klemmen: beim iOS-Rubber-Band wird scrollY negativ, und das
    // Zurückfedern soll nicht wie Herunterscrollen wirken.
    lastYRef.current = Math.max(0, window.scrollY);

    const onScroll = () => {
      const y = Math.max(0, window.scrollY);
      const delta = y - lastYRef.current;
      lastYRef.current = y;

      // nur beim Herunterscrollen und nur im Einstiegsbereich
      if (delta < 3) return;
      if (y > window.innerHeight * ACTIVE_UNTIL_VIEWPORTS) return;

      const now = performance.now();
      if (now - lastSpawnRef.current < SPAWN_INTERVAL_MS) return;
      lastSpawnRef.current = now;

      const rnd = (min: number, max: number) =>
        min + Math.random() * (max - min);

      setHearts((prev) => {
        if (prev.length >= MAX_HEARTS) return prev;
        idRef.current += 1;
        return [
          ...prev,
          {
            id: idRef.current,
            left: rnd(4, 94),
            bottom: rnd(6, 38),
            size: rnd(13, 28),
            duration: rnd(3.8, 6.2),
            sway: rnd(-70, 70),
            rotate: rnd(-16, 16),
            opacity: rnd(0.3, 0.55),
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
          },
        ];
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (hearts.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
    >
      {hearts.map((h) => (
        <span
          key={h.id}
          className="pm-scroll-heart"
          style={
            {
              left: `${h.left}vw`,
              bottom: `${h.bottom}vh`,
              color: h.color,
              "--pm-heart-duration": `${h.duration}s`,
              "--pm-heart-sway": `${h.sway}px`,
              "--pm-heart-rot": `${h.rotate}deg`,
              "--pm-heart-opacity": h.opacity,
            } as React.CSSProperties
          }
          onAnimationEnd={() =>
            setHearts((prev) => prev.filter((x) => x.id !== h.id))
          }
        >
          <Heart size={h.size} fill="currentColor" strokeWidth={0} />
        </span>
      ))}
    </div>
  );
}
