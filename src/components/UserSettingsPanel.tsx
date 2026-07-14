/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Eye, EyeOff, Sliders, Shield, Layers, HelpCircle } from "lucide-react";

interface UserSettingsPanelProps {
  showFeather: boolean;
  setShowFeather: (show: boolean) => void;
}

export default function UserSettingsPanel({
  showFeather,
  setShowFeather,
}: UserSettingsPanelProps) {
  return (
    <div className="rounded-2xl border border-[#2D3239] bg-[#16191D] p-6 shadow-xl flex flex-col gap-6 relative overflow-hidden">
      <div className="flex justify-between items-center border-b border-[#2D3239] pb-3">
        <h2 className="text-white text-sm font-semibold font-display flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#F5A623]" />
          Simulation Control Options
        </h2>
      </div>

      {/* WORKPIECE SPECS CARD - Explicit Simulation Standard */}
      <div className="bg-[#0D0F11]/40 rounded-xl p-4 border border-[#2D3239] space-y-3">
        <div>
          <div className="text-[10px] font-mono text-[#6B7076] tracking-wider uppercase mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            Active Workpiece Calibration
          </div>
          <p className="text-[11px] text-[#9AA0A6] leading-relaxed">
            All physical thermal simulations and metallurgical audits are calibrated against the following industrial joint standard:
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="bg-[#1C1F22] p-2 rounded-lg border border-[#2D3239]/40">
              <span className="text-[#6B7076] block text-[8px] uppercase">Material Type</span>
              <span className="text-blue-400 font-bold block mt-0.5">Mild Steel (A36)</span>
            </div>
            <div className="bg-[#1C1F22] p-2 rounded-lg border border-[#2D3239]/40">
              <span className="text-[#6B7076] block text-[8px] uppercase">Plate Thickness</span>
              <span className="text-amber-400 font-bold block mt-0.5">3.0 mm (1/8" Ga)</span>
            </div>
            <div className="bg-[#1C1F22] p-2 rounded-lg border border-[#2D3239]/40">
              <span className="text-[#6B7076] block text-[8px] uppercase">Joint Type / Gap</span>
              <span className="text-emerald-400 font-bold block mt-0.5">Square Butt / 1.5mm</span>
            </div>
            <div className="bg-[#1C1F22] p-2 rounded-lg border border-[#2D3239]/40">
              <span className="text-[#6B7076] block text-[8px] uppercase">Filler Standard</span>
              <span className="text-purple-400 font-bold block mt-0.5">RG45 (Mild Steel)</span>
            </div>
          </div>

          <div className="p-2.5 bg-[#1C1F22]/40 rounded-lg border border-blue-500/10 text-[10px] text-[#9AA0A6] leading-relaxed flex gap-2">
            <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-white font-semibold">Why this standard?</span> Oxy-acetylene welding is exceptionally suited for thin sheets up to 3.0 mm. Thicker plates require extensive beveling or arc processes. A 1.5 mm root opening allows full fusion penetration through the root face.
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 bg-[#0D0F11]/40 rounded-xl p-4 border border-[#2D3239]">
        <div>
          <div className="text-[10px] font-mono text-[#6B7076] tracking-wider uppercase mb-1">
            Visual Analysis Controls
          </div>
          <p className="text-[11px] text-[#9AA0A6] leading-relaxed">
            Toggle the intermediate whitish carburizing feather to analyze the core flame transition structure in the simulation.
          </p>
        </div>

        <button
          onClick={() => setShowFeather(!showFeather)}
          className={`flex items-center justify-between w-full rounded-xl border p-3.5 mt-2 transition-all cursor-pointer text-xs ${
            showFeather
              ? "bg-amber-950/15 border-amber-500/30 text-amber-400"
              : "bg-[#0D0F11] border-[#2D3239] text-[#6B7076] hover:text-[#EDEDE8] hover:border-[#3A3F47]"
          }`}
        >
          <span className="font-semibold font-display">Acetylene Feather Plume</span>
          <span className="flex items-center gap-1.5 font-mono text-[10px]">
            {showFeather ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                VISIBLE
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                HIDDEN
              </>
            )
            }
          </span>
        </button>
      </div>
    </div>
  );
}

