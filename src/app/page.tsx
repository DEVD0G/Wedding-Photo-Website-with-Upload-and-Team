import { storyChapters } from "@/lib/story";
import { getPolaroidsForSection } from "@/lib/polaroids";
import { AnimatedHero } from "@/components/home/AnimatedHero";
import { PolaroidScrollFilm } from "@/components/film/PolaroidScrollFilm";
import { StoryChapter } from "@/components/film/StoryChapter";
import { BrideSurpriseSection } from "@/components/film/BrideSurpriseSection";
import { StarrySkySection } from "@/components/film/StarrySkySection";
import { TimeCapsuleSection } from "@/components/film/TimeCapsuleSection";
import { EmotionalFinale } from "@/components/film/EmotionalFinale";
import { AnimatedFloralLine } from "@/components/animation/AnimatedFloralLine";

export const dynamic = "force-dynamic";

/**
 * Die Startseite ist ein interaktiver Liebesfilm: filmische Polaroid-
 * Sequenz, sechs Story-Kapitel, eine versteckte Überraschung, ein
 * Sternenhimmel, die Zeitkapsel und ein emotionaler Abschluss.
 * Alle Polaroid-Kärtchen sind über das Admin-Dashboard anpassbar.
 */
export default async function HomePage() {
  const [filmCards, ...chapterCards] = await Promise.all([
    getPolaroidsForSection("film"),
    ...storyChapters.map((_, i) => getPolaroidsForSection(`kapitel-${i + 1}`)),
  ]);

  return (
    <div className="overflow-x-clip">
      <AnimatedHero />

      <AnimatedFloralLine className="py-6" />

      {/* Filmische Polaroid-Sequenz */}
      <PolaroidScrollFilm polaroids={filmCards} />

      {/* Unsere Geschichte – sechs Kapitel */}
      {storyChapters.map((chapter, index) => (
        <StoryChapter
          key={chapter.numeral}
          chapter={chapter}
          index={index}
          polaroids={chapterCards[index]}
        />
      ))}

      {/* Versteckte Überraschung für die Braut */}
      <BrideSurpriseSection />

      {/* Digitaler Sternenhimmel */}
      <StarrySkySection />

      {/* Zeitkapsel */}
      <TimeCapsuleSection />

      {/* Emotionaler Abschluss */}
      <EmotionalFinale polaroids={filmCards} />
    </div>
  );
}
