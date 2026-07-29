import { storyChapters } from "@/lib/story";
import { getPolaroidsForSection } from "@/lib/polaroids";
import { AnimatedHero } from "@/components/home/AnimatedHero";
import { StoryChapter } from "@/components/film/StoryChapter";
import { StarrySkySection } from "@/components/film/StarrySkySection";
import { TimeCapsuleSection } from "@/components/film/TimeCapsuleSection";
import { EmotionalFinale } from "@/components/film/EmotionalFinale";
import { AnimatedFloralLine } from "@/components/animation/AnimatedFloralLine";
import { ScrollHearts } from "@/components/animation/ScrollHearts";

export const dynamic = "force-dynamic";

/**
 * Die Startseite ist ein interaktiver Liebesfilm: aufsteigende Herzen
 * beim Scrollen, die Story-Kapitel mit ihren zwei Fotos, ein
 * Sternenhimmel, die Zeitkapsel und ein emotionaler Abschluss.
 * Die zwei Fotos pro Kapitel sind über das Admin-Dashboard anpassbar.
 */
export default async function HomePage() {
  const chapterCards = await Promise.all(
    storyChapters.map((_, i) => getPolaroidsForSection(`kapitel-${i + 1}`)),
  );

  return (
    <div className="overflow-x-clip">
      {/* Aufsteigende Herzen beim Herunterscrollen im Einstiegsbereich */}
      <ScrollHearts />

      <AnimatedHero />

      <AnimatedFloralLine className="py-6" />

      {/* Unsere Geschichte – Kapitel für Kapitel */}
      {storyChapters.map((chapter, index) => (
        <StoryChapter
          key={chapter.numeral}
          chapter={chapter}
          index={index}
          polaroids={chapterCards[index]}
        />
      ))}

      {/* Digitaler Sternenhimmel */}
      <StarrySkySection />

      {/* Zeitkapsel */}
      <TimeCapsuleSection />

      {/* Emotionaler Abschluss */}
      <EmotionalFinale />
    </div>
  );
}
