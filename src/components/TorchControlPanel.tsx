/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Zap, Volume2, VolumeX, Flame, RefreshCw } from "lucide-react";
import { soundManager } from "../utils/audio";

interface TorchControlPanelProps {
  oxyTorchValve: number;
  setOxyTorchValve: (v: number) => void;
  aceTorchValve: number;
  setAceTorchValve: (v: number) => void;
  c2h2Flow: number;
  o2Flow: number;
  lit: boolean;
  setLit: (lit: boolean) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onSpark: () => void;
  onExtinguish: () => void;
  ratio: number;
  setRatioDirect: (ratio: number) => void;
  onSetRatioPreset: (preset: "acetylene" | "carburizing" | "neutral" | "oxidizing") => void;
  activeTutorialStep?: number | null;
}

export default function TorchControlPanel({
  oxyTorchValve,
  setOxyTorchValve,
  aceTorchValve,
  setAceTorchValve,
  c2h2Flow,
  o2Flow,
  lit,
  setLit,
  isMuted,
  setIsMuted,
  onSpark,
  onExtinguish,
  ratio,
  setRatioDirect,
  onSetRatioPreset,
  activeTutorialStep = null,
}: TorchControlPanelProps) {

  // Flow presets matching physical flame mixtures
  const applyPreset = (type: "acetylene" | "carburizing" | "neutral" | "oxidizing") => {
    soundManager.playClick(isMuted);
    onSetRatioPreset(type);
  };

  const handleRatioChange = (val: number) => {
    soundManager.playWhoosh(isMuted);
    setRatioDirect(val);
  };

  const hasAcetylene = c2h2Flow > 0.1;

  return (
    <div className="rounded-2xl border border-[#2D3239] bg-[#16191D] p-6 flex flex-col gap-5 shadow-xl">
      
      {/* SECTION 1: MASTER ACTION PANEL */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0D0F11] p-4 rounded-xl border border-[#2D3239]">
        <div className="flex gap-2">
          {/* Piezo Spark Ignition Button */}
          <button
            onClick={() => {
              onSpark();
              soundManager.playSpark(isMuted);
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs font-semibold tracking-wide transition-all duration-200 ${
              lit 
                ? "bg-[#1C1F22] text-[#6B7076] cursor-not-allowed border border-[#2D3239]" 
                : hasAcetylene
                  ? "bg-[#F5A623] hover:bg-[#D97706] text-black border border-amber-300 shadow-lg shadow-[#F5A623]/20 hover:scale-[1.02]"
                  : "bg-[#0D0F11] text-[#6B7076] border border-[#2D3239] hover:border-red-900/50 hover:text-red-400"
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${hasAcetylene && !lit ? "animate-bounce" : ""}`} />
            STRIKE SPARK
          </button>

          {/* Extinguish Button */}
          <button
            onClick={() => {
              onExtinguish();
              soundManager.playExtinguish(isMuted);
            }}
            disabled={!lit}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-display text-xs font-semibold tracking-wide border transition-all duration-150 ${
              lit 
                ? "border-red-900/50 bg-red-950/30 text-red-400 hover:bg-red-950/60 hover:text-red-300 cursor-pointer" 
                : "border-[#2D3239] bg-[#0D0F11]/40 text-[#6B7076] cursor-not-allowed"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            EXTINGUISH
          </button>
        </div>

        {/* Audio Mute/Unmute */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-mono transition-all duration-150 ${
            isMuted 
              ? "border-[#2D3239] bg-[#0D0F11]/30 text-[#9AA0A6] hover:bg-[#1C1F22]" 
              : "border-emerald-900/50 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40"
          }`}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4" />
              SOUND MUTED
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 animate-pulse" />
              SOUND ACTIVE
            </>
          )}
        </button>
      </div>

      {/* SECTION 2: PHYSICAL TORCH NEEDLE VALVES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ACETYLENE VALVE (RED) */}
        <div className="rounded-xl border border-red-950/40 bg-[#150F0F] p-4 flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-900/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono tracking-wider text-red-500 font-semibold uppercase">C₂H₂ Torch Valve</span>
            <span className="text-xs font-mono text-red-400 bg-red-950/40 border border-red-900/30 px-1.5 py-0.5 rounded">
              {aceTorchValve}% OPEN
            </span>
          </div>

          <div className="flex gap-4 items-center">
            {/* Visual Dial representation */}
            <div className="w-12 h-12 rounded-full border-2 border-red-900 flex items-center justify-center relative select-none">
              <div 
                className="w-1.5 h-5 bg-red-500 rounded-full origin-bottom transition-transform duration-200"
                style={{ transform: `rotate(${(aceTorchValve / 100) * 270 - 135}deg)`, marginTop: "-16px" }}
              />
              <div className="w-3 h-3 rounded-full bg-[#150F0F] border border-red-900 absolute" />
            </div>

            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="100"
                value={aceTorchValve}
                onChange={(e) => {
                  soundManager.playWhoosh(isMuted);
                  setAceTorchValve(parseInt(e.target.value));
                }}
                className="w-full accent-red-600 cursor-pointer h-1 bg-[#0D0F11] rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] font-mono text-[#6B7076] mt-1">
                <span>CLOSED</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          <div className="text-[9px] font-mono text-[#6B7076] text-right">
            Flow: {c2h2Flow.toFixed(2)} L/min
          </div>
        </div>

        {/* OXYGEN VALVE (BLUE) */}
        <div className="rounded-xl border border-blue-950/40 bg-[#0F1318] p-4 flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-900/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono tracking-wider text-blue-400 font-semibold uppercase">O₂ Torch Valve</span>
            <span className="text-xs font-mono text-blue-400 bg-blue-950/40 border border-blue-900/30 px-1.5 py-0.5 rounded">
              {oxyTorchValve}% OPEN
            </span>
          </div>

          <div className="flex gap-4 items-center">
            {/* Visual Dial representation */}
            <div className="w-12 h-12 rounded-full border-2 border-blue-900 flex items-center justify-center relative select-none">
              <div 
                className="w-1.5 h-5 bg-blue-400 rounded-full origin-bottom transition-transform duration-200"
                style={{ transform: `rotate(${(oxyTorchValve / 100) * 270 - 135}deg)`, marginTop: "-16px" }}
              />
              <div className="w-3 h-3 rounded-full bg-[#0F1318] border border-blue-900 absolute" />
            </div>

            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="100"
                value={oxyTorchValve}
                onChange={(e) => {
                  soundManager.playWhoosh(isMuted);
                  setOxyTorchValve(parseInt(e.target.value));
                }}
                className="w-full accent-blue-500 cursor-pointer h-1 bg-[#0D0F11] rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] font-mono text-[#6B7076] mt-1">
                <span>CLOSED</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          <div className="text-[9px] font-mono text-[#6B7076] text-right">
            Flow: {o2Flow.toFixed(2)} L/min
          </div>
        </div>
      </div>

      {/* SECTION 3: REINFORCED FLAME MIXTURE PRESETS */}
      <div className="flex flex-col gap-2.5">
        <div className="text-[10px] font-mono text-[#9AA0A6] uppercase tracking-wider">
          Standard Torch Mixtures (Gas Welding Presets)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => applyPreset("acetylene")}
            className="rounded-xl border border-[#2D3239] bg-[#0D0F11] hover:bg-[#1C1F22] py-2 px-1 text-center transition-all duration-150 hover:border-amber-900/60"
          >
            <div className="text-[11px] font-semibold text-[#FBBF24] font-display">Pure Acetylene</div>
            <div className="text-[9px] font-mono text-[#6B7076] mt-0.5">Sooty / Yellow</div>
          </button>
          <button
            onClick={() => applyPreset("carburizing")}
            className={`rounded-xl border py-2 px-1 text-center transition-all duration-150 ${
              activeTutorialStep === 2
                ? "border-[#F5A623] bg-[#F5A623]/15 ring-2 ring-[#F5A623] animate-pulse scale-[1.02]"
                : "border-[#2D3239] bg-[#0D0F11] hover:bg-[#1C1F22] hover:border-[#F5A623]/60"
            }`}
          >
            <div className="text-[11px] font-semibold text-[#F5A623] font-display">Carburizing</div>
            <div className="text-[9px] font-mono text-[#6B7076] mt-0.5">Ratio ~0.32</div>
          </button>
          <button
            onClick={() => applyPreset("neutral")}
            className={`rounded-xl border py-2 px-1 text-center transition-all duration-150 ${
              activeTutorialStep === 3
                ? "border-[#4A7A9E] bg-[#4A7A9E]/15 ring-2 ring-[#4A7A9E] animate-pulse scale-[1.02]"
                : "border-[#2D3239] bg-[#0D0F11] hover:bg-[#1C1F22] hover:border-[#4A7A9E]/60"
            }`}
          >
            <div className="text-[11px] font-semibold text-[#4A7A9E] font-display">Neutral (Balanced)</div>
            <div className="text-[9px] font-mono text-[#6B7076] mt-0.5">Ratio 0.50 (1:1)</div>
          </button>
          <button
            onClick={() => applyPreset("oxidizing")}
            className={`rounded-xl border py-2 px-1 text-center transition-all duration-150 ${
              activeTutorialStep === 4
                ? "border-[#7FB2D9] bg-[#7FB2D9]/15 ring-2 ring-[#7FB2D9] animate-pulse scale-[1.02]"
                : "border-[#2D3239] bg-[#0D0F11] hover:bg-[#1C1F22] hover:border-[#7FB2D9]/60"
            }`}
          >
            <div className="text-[11px] font-semibold text-[#7FB2D9] font-display">Oxidizing</div>
            <div className="text-[9px] font-mono text-[#6B7076] mt-0.5">Ratio ~0.67</div>
          </button>
        </div>
      </div>

      {/* SECTION 4: THEORETICAL RATIO SLIDER (As requested in user's prompt code) */}
      <div className={`transition-all duration-300 ${
        activeTutorialStep === 1
          ? "border-t border-emerald-500 bg-[#10B981]/5 p-3.5 rounded-xl ring-2 ring-emerald-500/80 animate-pulse"
          : "border-t border-[#2D3239] pt-4"
      }`}>
        <div className="flex justify-between items-center text-[10px] font-mono text-[#9AA0A6] mb-1.5">
          <span className="text-red-500/80">← EXCESS FUEL (C₂H₂)</span>
          <span className="text-[#6B7076]">O₂ : C₂H₂ COMPUTE RATIO</span>
          <span className="text-blue-400/80">EXCESS OXIDIZER (O₂) →</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={ratio}
          onChange={(e) => handleRatioChange(parseFloat(e.target.value))}
          className="w-full accent-emerald-500 cursor-pointer"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] font-mono text-[#6B7076]">
            Ratio Value: <strong className="text-emerald-400">{ratio.toFixed(2)}</strong>
          </span>
          <span className="text-[10px] font-mono text-[#6B7076]">
            {ratio < 0.34 
              ? "Reducing Region" 
              : ratio > 0.66 
                ? "Oxidizing Region" 
                : "Neutral / Balanced Region"}
          </span>
        </div>
      </div>
    </div>
  );
}
