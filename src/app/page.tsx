import { storyChapters } from "@/lib/story";
import { AnimatedHero } from "@/components/home/AnimatedHero";
import { PolaroidScrollFilm } from "@/components/film/PolaroidScrollFilm";
import { StoryChapter } from "@/components/film/StoryChapter";
import { BrideSurpriseSection } from "@/components/film/BrideSurpriseSection";
import { StarrySkySection } from "@/components/film/StarrySkySection";
import { TimeCapsuleSection } from "@/components/film/TimeCapsuleSection";
import { EmotionalFinale } from "@/components/film/EmotionalFinale";
import { AnimatedFloralLine } from "@/components/animation/AnimatedFloralLine";

/**
 * Die Startseite ist ein interaktiver Liebesfilm: filmische Polaroid-
 * Sequenz, sechs Story-Kapitel, eine versteckte Überraschung, ein
 * Sternenhimmel, die Zeitkapsel und ein emotionaler Abschluss.
 */
export default function HomePage() {
  return (
    <div className="overflow-x-clip">
      <AnimatedHero />

      <AnimatedFloralLine className="py-6" />

      {/* Filmische Polaroid-Sequenz */}
      <PolaroidScrollFilm />

      {/* Unsere Geschichte – sechs Kapitel */}
      {storyChapters.map((chapter, index) => (
        <StoryChapter key={chapter.numeral} chapter={chapter} index={index} />
      ))}

      {/* Versteckte Überraschung für die Braut */}
      <BrideSurpriseSection />

      {/* Digitaler Sternenhimmel */}
      <StarrySkySection />

      {/* Zeitkapsel */}
      <TimeCapsuleSection />

      {/* Emotionaler Abschluss */}
      <EmotionalFinale />
    </div>
  );
}
