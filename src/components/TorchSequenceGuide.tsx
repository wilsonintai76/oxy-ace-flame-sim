/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CheckCircle2, Play, RefreshCw, Shield, AlertTriangle } from "lucide-react";

interface TorchSequenceGuideProps {
  c2h2Flow: number;
  o2Flow: number;
  lit: boolean;
  onSpark: () => void;
  onExtinguish: () => void;
  setOxyCylinderOpen: (v: boolean) => void;
  setAceCylinderOpen: (v: boolean) => void;
  setOxyRegulatorPSI: (v: number) => void;
  setAceRegulatorPSI: (v: number) => void;
  setAceTorchValve: (v: number) => void;
  setOxyTorchValve: (v: number) => void;
  setLit: (lit: boolean) => void;
}

export default function TorchSequenceGuide({
  c2h2Flow,
  o2Flow,
  lit,
  onSpark,
  onExtinguish,
  setOxyCylinderOpen,
  setAceCylinderOpen,
  setOxyRegulatorPSI,
  setAceRegulatorPSI,
  setAceTorchValve,
  setOxyTorchValve,
  setLit,
}: TorchSequenceGuideProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [inspected, setInspected] = useState(false);
  const [completedAll, setCompletedAll] = useState(false);

  // Re-evaluate steps based on actual user actions on the regulators/igniter
  useEffect(() => {
    if (currentStep === 1 && inspected) {
      setCurrentStep(2);
    }
    if (currentStep === 2 && lit && c2h2Flow > 0 && o2Flow === 0) {
      setCurrentStep(3);
    }
    if (currentStep === 3 && lit && c2h2Flow >= 3.0 && o2Flow === 0) {
      setCurrentStep(4);
    }
    // Neutral flame achieved: equal flows and lit
    if (currentStep === 4 && lit && c2h2Flow >= 2.0 && Math.abs(c2h2Flow - o2Flow) < 0.25) {
      setCurrentStep(5);
    }
    // Shut down: acetylene closed first, then oxygen closed
    if (currentStep === 5 && !lit && c2h2Flow === 0 && o2Flow === 0) {
      setCompletedAll(true);
    }
  }, [c2h2Flow, o2Flow, lit, inspected, currentStep]);

  const resetSequence = () => {
    onExtinguish();
    setOxyCylinderOpen(false);
    setAceCylinderOpen(false);
    setOxyRegulatorPSI(0);
    setAceRegulatorPSI(0);
    setAceTorchValve(0);
    setOxyTorchValve(0);
    setLit(false);
    setInspected(false);
    setCurrentStep(1);
    setCompletedAll(false);
  };

  const steps = [
    {
      id: 1,
      title: "Inspect Setup & Safety Gear",
      desc: "Wear safety goggles (shade 5), thick leather apron, and heat-resistant welding gloves. Check regulator valves and gas cylinders.",
      actionLabel: "Complete Pre-Check",
      isDone: inspected,
      isActive: currentStep === 1,
      action: () => setInspected(true),
    },
    {
      id: 2,
      title: "Crack and Ignite Acetylene",
      desc: "Crack open the Acetylene regulator valve slightly (e.g. 2.0 to 3.0 L/min). Press 'Strike Spark' to ignite the pure fuel gas.",
      hint: "Ensure Oxygen valve is completely CLOSED (0.0 L/min) before striking a spark, or high back-pressure can cause a dangerous flashback!",
      isDone: inspected && (lit && c2h2Flow > 0),
      isActive: currentStep === 2,
    },
    {
      id: 3,
      title: "Eliminate Black Carbon Soot",
      desc: "Increase the Acetylene flow rate (to ~4.5 - 5.0 L/min) until the dense black soot clouds and smoke clear away from the nozzle.",
      hint: "Pure acetylene produces heavy, sticky soot. Adjust the valve to get a clean, highly-luminous yellow-orange plume.",
      isDone: inspected && (lit && c2h2Flow >= 4.0),
      isActive: currentStep === 3,
    },
    {
      id: 4,
      title: "Blend Oxygen to Neutral Flame",
      desc: "Slowly turn on the Oxygen valve. Adjust it until the intermediate white 'acetylene feather' disappears completely, leaving a clean, well-defined rounded inner core.",
      hint: "Target: Set both Acetylene and Oxygen flows to exactly 5.0 L/min (balanced 1:1 ratio). This produces the clean Neutral Flame (~3200°C).",
      isDone: inspected && (lit && c2h2Flow >= 3.0 && Math.abs(c2h2Flow - o2Flow) < 0.25),
      isActive: currentStep === 4,
    },
    {
      id: 5,
      title: "Extinguish Safely (Shutdown Sequence)",
      desc: "To shut down the torch safely: ALWAYS close the Acetylene fuel valve FIRST, then close the Oxygen valve.",
      hint: "Closing Acetylene first avoids a puff of sticky soot and prevents the fire from snapping back into the tip (flashback).",
      isDone: completedAll,
      isActive: currentStep === 5 && !completedAll,
    }
  ];

  return (
    <div className="rounded-2xl border border-[#2D3239] bg-[#16191D] p-6 shadow-xl flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-[#2D3239] pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h2 className="text-white text-sm font-semibold font-display">Interactive Safety & Lighting Guide</h2>
        </div>
        <button
          onClick={resetSequence}
          className="flex items-center gap-1.5 text-[10px] font-mono text-[#9AA0A6] hover:text-white bg-[#0D0F11] px-2.5 py-1 rounded-xl border border-[#2D3239] transition-all hover:bg-[#1C1F22]"
        >
          <RefreshCw className="w-3 h-3" />
          RESET PROCEDURE
        </button>
      </div>

      {completedAll ? (
        <div className="rounded-2xl bg-emerald-950/20 border border-emerald-900/50 p-5 text-center flex flex-col items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
          <div>
            <h3 className="text-white font-display font-bold text-sm">Procedure Completed Successfully!</h3>
            <p className="text-[11px] text-[#9AA0A6] mt-1 max-w-md mx-auto">
              Excellent! You have demonstrated proper safety steps, ignited a stable neutral flame, and executed the standard shutdown sequence safely. This is critical for workshop gas welding.
            </p>
          </div>
          <button
            onClick={resetSequence}
            className="mt-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-display font-semibold text-xs py-1.5 px-4 transition-all"
          >
            Practice Again
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {steps.map((step) => {
            const isFinished = step.isDone || currentStep > step.id;
            return (
              <div
                key={step.id}
                className={`rounded-xl border p-4 transition-all duration-200 ${
                  step.isActive
                    ? "border-[#F5A623] bg-[#2A2114]/20"
                    : isFinished
                      ? "border-emerald-950/40 bg-emerald-950/5 opacity-75"
                      : "border-[#2D3239] bg-[#0D0F11]/40 opacity-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {isFinished ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-all ${
                        step.isActive ? "bg-[#F5A623] text-black" : "bg-[#1C1F22] text-[#6B7076] border border-[#2D3239]"
                      }`}>
                        {step.id}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 justify-between">
                      <h4 className={`text-xs font-semibold font-display ${step.isActive ? "text-[#F5A623]" : isFinished ? "text-[#EDEDE8]" : "text-[#6B7076]"}`}>
                        {step.title}
                      </h4>
                      {step.isActive && (
                        <span className="text-[9px] font-mono bg-amber-950/40 text-amber-400 border border-amber-900/40 px-1.5 py-0.5 rounded-lg">
                          ACTIVE STEP
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] mt-1 leading-relaxed ${step.isActive ? "text-[#EDEDE8]" : "text-[#9AA0A6]"}`}>
                      {step.desc}
                    </p>

                    {step.isActive && step.hint && (
                      <div className="mt-3.5 flex items-start gap-2 rounded-xl bg-amber-950/25 border border-amber-900/30 p-3 text-[10px] text-amber-400 leading-normal">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div>{step.hint}</div>
                      </div>
                    )}

                    {step.isActive && step.action && (
                      <button
                        onClick={step.action}
                        className="mt-3 flex items-center gap-1.5 rounded-xl bg-[#F5A623] hover:bg-[#D97706] text-black font-display font-semibold text-[10px] px-3.5 py-1.5 transition-colors"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        {step.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
