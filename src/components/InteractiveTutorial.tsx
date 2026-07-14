/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { HelpCircle, ChevronRight, ChevronLeft, X, Check, Flame, HelpCircle as HelpIcon } from "lucide-react";

interface InteractiveTutorialProps {
  currentStep: number | null;
  onStepChange: (step: number | null) => void;
  ratio: number;
  onSetRatioPreset: (preset: "acetylene" | "carburizing" | "neutral" | "oxidizing") => void;
  onSetRatioDirect: (ratio: number) => void;
  lit: boolean;
  setLit: (lit: boolean) => void;
}

interface TutorialStepData {
  title: string;
  desc: string;
  highlightClass: string;
  actionRequired?: string;
}

const TUTORIAL_STEPS: TutorialStepData[] = [
  {
    title: "1. The O₂:C₂H₂ Mixture Ratio Slider",
    desc: "The O₂:C₂H₂ Compute Ratio slider calculates the exact gas mixture proportion. Moving the slider dynamically alters the flame structure, temperature, and combustion behavior in real-time.",
    highlightClass: "tutorial-ratio-slider",
    actionRequired: "Drag the slider to see how the ratio changes, or click Next to proceed."
  },
  {
    title: "2. Exploring the Carburizing Flame",
    desc: "A Carburizing flame occurs when Acetylene is in excess (ratio < 0.50). This carbon-rich flame introduces carbon into steel, hardening it but making it brittle.",
    highlightClass: "tutorial-preset-carb",
    actionRequired: "Click the 'Carburizing' preset button to load a carbon-rich mixture."
  },
  {
    title: "3. Exploring the Neutral Flame (Balanced)",
    desc: "A Neutral flame occurs at a perfect 1:1 balance (ratio 0.50). This flame has no chemical effect on the weld pool and is the standard choice for most steels and welding tasks.",
    highlightClass: "tutorial-preset-neutral",
    actionRequired: "Click the 'Neutral (Balanced)' preset button to ignite the ideal welding mixture."
  },
  {
    title: "4. Exploring the Oxidizing Flame",
    desc: "An Oxidizing flame has excess oxygen (ratio > 0.50). The inner cone shrinks and turns purplish/dark blue. It burns alloying elements out of steel, producing weak welds with thick slag.",
    highlightClass: "tutorial-preset-oxid",
    actionRequired: "Click the 'Oxidizing' preset button to inspect this hot, hissing flame."
  },
  {
    title: "5. Visual Component: The Inner Cone",
    desc: "The bright white Inner Cone is the primary reaction zone (C₂H₂ + O₂ → 2CO + H₂). It produces high-luminosity neutral combustion and is where the temperature peaks at around 3100°C–3200°C.",
    highlightClass: "tutorial-inner-cone",
  },
  {
    title: "6. Visual Component: The Acetylene Feather",
    desc: "The whitish intermediate plume is the Acetylene Feather of unburnt carbon. It is only visible when the gas ratio is below 0.50. You can toggle its visibility in the User Settings panel!",
    highlightClass: "tutorial-feather",
  },
  {
    title: "7. Visual Component: The Outer Envelope",
    desc: "The blue Outer Envelope is the secondary combustion zone. It burns the generated carbon monoxide and hydrogen with surrounding air, creating a protective envelope shield around the weld pool.",
    highlightClass: "tutorial-outer-envelope",
  },
  {
    title: "8. Real-Time Canvas Drag Handles",
    desc: "You can click and drag the yellow (inner cone) or blue (outer envelope) circle handles directly inside the rendering stage! Dragging them horizontal recalculates the ratio instantly.",
    highlightClass: "tutorial-drag-handles",
    actionRequired: "Try dragging the handles inside the flame stage to interactively shape the flame!"
  }
];

export default function InteractiveTutorial({
  currentStep,
  onStepChange,
  ratio,
  onSetRatioPreset,
  onSetRatioDirect,
  lit,
  setLit,
}: InteractiveTutorialProps) {
  
  if (currentStep === null) return null;

  const stepData = TUTORIAL_STEPS[currentStep - 1];
  const totalSteps = TUTORIAL_STEPS.length;

  // Perform automatic actions to assist the user on specific steps
  useEffect(() => {
    if (!lit) {
      setLit(true);
    }
    
    // Auto-apply preset values on respective tutorial steps if the user proceeds
    if (currentStep === 2) {
      onSetRatioPreset("carburizing");
    } else if (currentStep === 3) {
      onSetRatioPreset("neutral");
    } else if (currentStep === 4) {
      onSetRatioPreset("oxidizing");
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      onStepChange(currentStep + 1);
    } else {
      // Finished
      onStepChange(null);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-[#F5A623] bg-[#1B1E22] p-5 shadow-2xl flex flex-col gap-4 animate-fade-in relative overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#F5A623]/5 rounded-full blur-2xl pointer-events-none" />
      
      {/* Top row */}
      <div className="flex justify-between items-center border-b border-[#2D3239] pb-3">
        <div className="flex items-center gap-2">
          <HelpIcon className="w-5 h-5 text-[#F5A623] animate-pulse" />
          <span className="text-white text-xs font-semibold tracking-wider font-mono">
            GUIDED TUTORIAL (STEP {currentStep} OF {totalSteps})
          </span>
        </div>
        <button
          onClick={() => onStepChange(null)}
          className="p-1 rounded-lg text-[#6B7076] hover:text-[#EDEDE8] hover:bg-[#2D3239]/50 transition-all cursor-pointer"
          title="Exit Tutorial"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step Content */}
      <div className="flex flex-col gap-2.5">
        <h3 className="text-[#F5A623] font-display font-bold text-sm tracking-tight">
          {stepData.title}
        </h3>
        <p className="text-[11.5px] text-[#EDEDE8] leading-relaxed">
          {stepData.desc}
        </p>

        {stepData.actionRequired && (
          <div className="mt-1 p-2.5 rounded-lg bg-[#2A2114]/30 border border-amber-900/30 flex items-start gap-2">
            <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[10px] font-mono text-amber-300 leading-normal">
              <strong>ACTION REQUIRED:</strong> {stepData.actionRequired}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center border-t border-[#2D3239] pt-3 mt-1">
        <button
          onClick={() => onStepChange(null)}
          className="text-[10px] font-mono text-[#6B7076] hover:text-[#EDEDE8] transition-all cursor-pointer"
        >
          SKIP TUTORIAL
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-display font-semibold transition-all ${
              currentStep === 1
                ? "text-[#4B525A] cursor-not-allowed border border-[#2D3239]/50"
                : "text-[#EDEDE8] hover:bg-[#2D3239] border border-[#2D3239] cursor-pointer"
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            BACK
          </button>
          
          <button
            onClick={handleNext}
            className="flex items-center gap-1 rounded-xl bg-[#F5A623] hover:bg-[#D97706] text-black font-display font-semibold text-[10px] px-3.5 py-1.5 transition-all cursor-pointer shadow-md shadow-[#F5A623]/10"
          >
            {currentStep === totalSteps ? "FINISH" : "NEXT"}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
