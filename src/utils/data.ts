/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZoneInfo, QuizQuestion } from "../types";

export const FLAME_ZONES: ZoneInfo[] = [
  {
    key: "carb",
    label: "Carburizing Flame",
    alt: "Reducing Flame (Excess Acetylene)",
    description: "Formed when there is more acetylene than oxygen. It is characterized by three distinct colors and zones: a sharp inner cone, a whitish intermediate 'feather' or cone of unburnt carbon, and a larger light blue outer envelope.",
    temperature: "3,040°C (5,500°F)",
    chemicalBehavior: "Reducing / Carburizing (introduces carbon into the weld pool)",
    ratioRange: "O₂ : C₂H₂ ratio of 0.85 to 0.95",
    bullets: [
      "Inner Cone: Small, bright white and rounded.",
      "Acetylene Feather: Intermediate whitish cone surrounding the inner core. The length of the feather indicates the degree of excess acetylene.",
      "Outer Envelope: Large, bushy, blue/purple plume of low luminosity.",
      "Chemical effect: Prevents oxidation of the metal and carburizes steel, making it harder but more brittle if overused."
    ],
    use: "Welding high-carbon steels, alloy steels, cast iron, hard-facing alloys (e.g., Stellite), and monel metal.",
    color: "#F5A623",
    accentColor: "bg-[#2A2114] border-[#F5A623] text-[#F5A623]"
  },
  {
    key: "neutral",
    label: "Neutral Flame",
    alt: "Balanced Flame (1:1 Ratio)",
    description: "Formed when equal volumes of oxygen and acetylene are mixed. It burns cleanly without adding carbon or oxygen to the weld pool. It has two distinct zones: a small, rounded, highly luminous inner cone and a large blue-purple outer envelope.",
    temperature: "3,200°C (5,800°F)",
    chemicalBehavior: "Neutral (neither oxidizes nor carburizes the weld pool)",
    ratioRange: "O₂ : C₂H₂ ratio of 1.0 to 1.1",
    bullets: [
      "Inner Cone: Clean, sharp, well-defined, rounded tip with no whitish feather.",
      "Outer Envelope: Smooth, moderately large, deep blue to light violet plume.",
      "Combustion: Acetylene burns in two stages. First stage (inner cone) yields CO and H₂. Second stage (outer envelope) combines with atmospheric oxygen to yield CO₂ and H₂O.",
      "Chemical effect: Does not chemically react with the metal, ensuring a pure, strong, ductile weld."
    ],
    use: "Most general welding! Perfect for mild steel, stainless steel, cast steel, aluminum, copper, and bronze.",
    color: "#4A7A9E",
    accentColor: "bg-[#1B242C] border-[#4A7A9E] text-[#4A7A9E]"
  },
  {
    key: "oxid",
    label: "Oxidizing Flame",
    alt: "Oxygen-Rich Flame (Excess Oxygen)",
    description: "Formed when the oxygen volume exceeds the acetylene volume. It has two zones: a very small, sharp, pointed inner cone that is less luminous, and a short, narrow, pale blue outer envelope. It makes a characteristic sharp whistling/screaming noise.",
    temperature: "3,500°C (6,300°F)",
    chemicalBehavior: "Oxidizing (reacts with metals to form oxides)",
    ratioRange: "O₂ : C₂H₂ ratio of 1.15 to 1.50",
    bullets: [
      "Inner Cone: Very short, extremely pointed, and pale purplish-white color.",
      "Outer Envelope: Short, narrow, highly focused, pale blue or purplish-blue plume.",
      "Whistling Sound: The high pressure of oxygen creates a loud, distinctive roar or whistle.",
      "Chemical effect: Generates oxides on steel, causing a weak, brittle weld with slag. However, for copper/zinc, the copper oxide layer protects the zinc from vaporizing."
    ],
    use: "Brazing steel and cast iron, bronze-welding, and welding copper-zinc alloys (brass, bronze) to prevent zinc fumes.",
    color: "#7FB2D9",
    accentColor: "bg-[#192735] border-[#7FB2D9] text-[#7FB2D9]"
  }
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Which flame has an intermediate whitish section known as the 'feather'?",
    options: ["Neutral Flame", "Oxidizing Flame", "Carburizing Flame", "Sooty Flame"],
    correctIndex: 2,
    explanation: "The Carburizing (reducing) flame contains excess acetylene, which is visible as a whitish intermediate cone or 'feather' extending from the inner cone.",
    targetFlame: "carb"
  },
  {
    id: 2,
    question: "What is the approximate temperature of a Neutral oxy-acetylene flame?",
    options: ["2,500°C", "3,040°C", "3,200°C", "3,500°C"],
    correctIndex: 2,
    explanation: "A neutral flame has a temperature of approximately 3,200°C (5,800°F). An oxidizing flame is hotter (~3,500°C), while a carburizing flame is cooler (~3,040°C).",
    targetFlame: "neutral"
  },
  {
    id: 3,
    question: "For welding mild steel, which flame type is universally recommended and used?",
    options: ["Oxidizing Flame", "Carburizing Flame", "Neutral Flame", "Pure Acetylene Flame"],
    correctIndex: 2,
    explanation: "A neutral flame is used for mild steel and stainless steel because it does not chemically react with the weld metal, keeping the weld strong and ductile.",
    targetFlame: "neutral"
  },
  {
    id: 4,
    question: "Why is an oxidizing flame used when gas welding brass or bronze (copper-zinc alloys)?",
    options: [
      "To cool the weld pool",
      "To form a protective copper-oxide layer that prevents volatile zinc from vaporizing",
      "To inject additional carbon into the brass",
      "To speed up the melting process with high pressure"
    ],
    correctIndex: 1,
    explanation: "An oxidizing flame is used on brass because the slight excess of oxygen forms a protective copper-oxide film over the weld pool, preventing zinc from boiling off as toxic fumes.",
    targetFlame: "oxid"
  },
  {
    id: 5,
    question: "Which flame makes a loud, distinctive whistling or roaring sound?",
    options: ["Pure Acetylene Flame", "Carburizing Flame", "Neutral Flame", "Oxidizing Flame"],
    correctIndex: 3,
    explanation: "The oxidizing flame is driven by higher pressure of oxygen, making a sharp whistling/screaming noise and creating a very short, pointed inner cone.",
    targetFlame: "oxid"
  },
  {
    id: 6,
    question: "What chemical reaction describes the primary combustion stage at the inner cone of a neutral flame?",
    options: [
      "C₂H₂ + O₂ → 2CO + H₂",
      "2CO + O₂ → 2CO₂",
      "2H₂ + O₂ → 2H₂O",
      "C₂H₂ + 2.5 O₂ → 2CO₂ + H₂O"
    ],
    correctIndex: 0,
    explanation: "In the primary stage at the inner cone, acetylene cracks and burns with oxygen to produce Carbon Monoxide (CO) and Hydrogen (H₂). These gases then burn with atmospheric oxygen in the outer envelope.",
    targetFlame: "neutral"
  }
];
