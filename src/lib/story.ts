/**
 * Inhalte der filmischen Story auf der Startseite.
 * Texte, Polaroid-Beschriftungen und Kapitel lassen sich hier zentral
 * anpassen. Echte Fotos können später über das Feld `image` ergänzt
 * werden (z. B. "/polaroids/erstes-bild.jpg" in /public ablegen).
 */

export interface Polaroid {
  /** Handschriftliche Beschriftung. */
  caption: string;
  /** Datum oder Ort (optional). */
  note?: string;
  /** Warmer Verlauf für die Foto-Fläche, solange kein echtes Bild da ist. */
  tone: string;
  /** Optionaler Pfad zu einem echten Foto. */
  image?: string;
}

export interface StoryChapter {
  numeral: string;
  eyebrow: string;
  title: string;
  text: string;
  quote: string;
  tone: "light" | "dark";
  background: string;
  polaroids: Polaroid[];
}

const WARM = "linear-gradient(150deg,#F2E8D7,#EAD8B6)";
const BLUSH = "linear-gradient(150deg,#EFD0CB,#DDA29E)";
const GOLD = "linear-gradient(150deg,#EAD8B6,#C6A24B)";
const NIGHT = "linear-gradient(150deg,#352C25,#241E1A)";
const SAND = "linear-gradient(150deg,#F2E8D7,#EFD0CB)";

/** Polaroids der filmischen Einstiegs-Sequenz. */
export const filmPolaroids: Polaroid[] = [
  { caption: "Unser erstes Bild", note: "wie alles begann", tone: WARM },
  { caption: "Der Moment, in dem alles begann", note: "ein Lächeln", tone: BLUSH },
  { caption: "Unser Zuhause", note: "wo die Liebe wohnt", tone: SAND },
  { caption: "Ein Tag voller Liebe", note: "unzählige davon", tone: GOLD },
  { caption: "Für immer wir", note: "Versprechen", tone: BLUSH },
  { caption: "31.07.2026", note: "der schönste Tag", tone: NIGHT },
];

/** Die Kapitel von „Unsere Geschichte". */
export const storyChapters: StoryChapter[] = [
  {
    numeral: "I",
    eyebrow: "Kapitel Eins",
    title: "Als alles begann",
    text: "Es war kein großer Moment, kein Donnerschlag – nur ein Lächeln, ein Blick und das leise Gefühl, angekommen zu sein. So beginnt jede große Liebe: ganz still.",
    quote: "„Aus einem Hallo wurde unser ganzes Leben.“",
    tone: "light",
    background: "linear-gradient(160deg,#FBF6EC,#F2E8D7 60%,#EAD8B6)",
    polaroids: [
      { caption: "Das erste Hallo", tone: WARM },
      { caption: "Der erste Funke", note: "unvergessen", tone: BLUSH },
    ],
  },
  {
    numeral: "II",
    eyebrow: "Kapitel Zwei",
    title: "Unser erstes gemeinsames Abenteuer",
    text: "Wir packten unsere Träume in einen Koffer und zogen los. Jede neue Straße, jeder Sonnenuntergang gehörte plötzlich uns beiden.",
    quote: "„Mit dir wird jeder Weg zum schönsten Ziel.“",
    tone: "dark",
    background: "linear-gradient(160deg,#352C25,#241E1A)",
    polaroids: [
      { caption: "Unterwegs zu zweit", tone: GOLD },
      { caption: "Der weite Horizont", note: "endlich frei", tone: NIGHT },
    ],
  },
  {
    numeral: "III",
    eyebrow: "Kapitel Drei",
    title: "Unsere schönsten Momente",
    text: "Es sind die leisen Augenblicke, die bleiben: gemeinsames Lachen, lange Gespräche, ein Tanz in der Küche. Aus tausend kleinen Momenten wurde unser Glück.",
    quote: "„Das Glück versteckt sich im Alltäglichen – wir haben es gefunden.“",
    tone: "light",
    background: "linear-gradient(160deg,#FBF6EC,#EFD0CB 70%,#DDA29E)",
    polaroids: [
      { caption: "Lachen bis spät", tone: BLUSH },
      { caption: "Tanz in der Küche", note: "unser Lied", tone: SAND },
    ],
  },
  {
    numeral: "IV",
    eyebrow: "Kapitel Vier",
    title: "Der Antrag",
    text: "Ein Kniefall, ein zitterndes Ja, Tränen voller Freude. In diesem einen Moment wurde aus zwei Menschen ein Versprechen für immer.",
    quote: "„Willst du für immer mein Zuhause sein? – Ja, tausendmal ja.“",
    tone: "dark",
    background: "linear-gradient(160deg,#241E1A,#352C25)",
    polaroids: [
      { caption: "Der Antrag", note: "sie sagte Ja", tone: GOLD },
      { caption: "Der Ring", note: "ein Kreis ohne Ende", tone: NIGHT },
    ],
  },
  {
    numeral: "V",
    eyebrow: "Kapitel Fünf",
    title: "Der Tag, an dem wir Petersen werden",
    text: "Heute geben wir uns das Wort. Umgeben von allen, die wir lieben, schreiben wir die schönste Zeile unserer Geschichte.",
    quote: "„Heute werden aus zwei Herzen die Petersens.“",
    tone: "light",
    background: "linear-gradient(160deg,#FBF6EC,#EAD8B6 60%,#C6A24B)",
    polaroids: [
      { caption: "Das Ja-Wort", note: "31.07.2026", tone: GOLD },
      { caption: "Mr. & Mrs. Petersen", tone: WARM },
    ],
  },
];
