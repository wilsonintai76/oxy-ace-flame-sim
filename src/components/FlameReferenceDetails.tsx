/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { FLAME_ZONES } from "../utils/data";
import { Flame, Compass, Settings, ShieldAlert } from "lucide-react";

export default function FlameReferenceDetails() {
  const [activeTab, setActiveTab] = useState<string>("neutral");

  const currentZone = FLAME_ZONES.find((z) => z.key === activeTab) || FLAME_ZONES[1];

  return (
    <div className="rounded-2xl border border-[#2D3239] bg-[#16191D] p-6 shadow-xl flex flex-col gap-5">
      <div className="flex flex-wrap gap-2 justify-between items-center border-b border-[#2D3239] pb-3">
        <h2 className="text-white text-sm font-semibold font-display flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#4A7A9E]" />
          Flame Profile Technical Reference
        </h2>
        {/* Toggle Pills */}
        <div className="flex gap-1.5 bg-[#0D0F11] p-1 rounded-xl border border-[#2D3239]">
          {FLAME_ZONES.map((z) => (
            <button
              key={z.key}
              onClick={() => setActiveTab(z.key)}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-mono font-bold transition-all duration-150 ${
                activeTab === z.key
                  ? z.key === "carb"
                    ? "bg-[#2A2114] text-[#F5A623] border border-amber-900/40"
                    : z.key === "oxid"
                      ? "bg-[#192735] text-[#7FB2D9] border border-indigo-900/40"
                      : "bg-[#1B242C] text-[#4A7A9E] border border-[#2D3239]"
                  : "text-[#6B7076] hover:text-[#EDEDE8]"
              }`}
            >
              {z.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* ACTIVE TAB SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Profile Card */}
        <div className="md:col-span-1 rounded-xl border border-[#2D3239] bg-[#0D0F11] p-5 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono font-semibold tracking-wider text-[#6B7076] uppercase">Flame Class</div>
            <h3 className="text-[#EDEDE8] font-display font-bold text-lg mt-0.5 leading-tight">{currentZone.label}</h3>
            <p className="text-[10px] text-[#9AA0A6] font-mono mt-1 italic">{currentZone.alt}</p>
            <p className="text-[11px] text-[#9AA0A6] mt-3 leading-relaxed">{currentZone.description}</p>
          </div>

          <div className="mt-5 border-t border-[#2D3239] pt-3.5 space-y-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#6B7076]">Max Temp:</span>
              <span className="font-mono text-[#F5A623] font-semibold">{currentZone.temperature}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#6B7076]">Gas Ratio:</span>
              <span className="font-mono text-[#EDEDE8]">{currentZone.ratioRange}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#6B7076]">Behavior:</span>
              <span className="font-display text-[#EDEDE8] font-medium">{currentZone.chemicalBehavior.split(" ")[0]}</span>
            </div>
          </div>
        </div>

        {/* Detailed Points */}
        <div className="md:col-span-2 flex flex-col gap-4">
          
          {/* Flame Anatomy */}
          <div className="rounded-xl border border-[#2D3239] bg-[#0D0F11]/60 p-5">
            <h4 className="text-white font-display font-bold text-xs flex items-center gap-1.5 mb-2.5">
              <Compass className="w-3.5 h-3.5 text-[#F5A623]" />
              Flame Anatomy & Structure
            </h4>
            <ul className="space-y-2">
              {currentZone.bullets.map((b, i) => (
                <li key={i} className="text-[11px] text-[#EDEDE8] leading-relaxed flex items-start gap-1.5">
                  <span className="text-[#F5A623] font-bold mt-0.5 shrink-0">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Metallurgical Applications & Chemistry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div 
              className="rounded-xl border border-[#2D3239] bg-[#0D0F11]/60 p-4 relative group cursor-help"
            >
              <div className="text-[9px] font-mono text-[#6B7076] tracking-wider uppercase mb-1">Metallurgical Uses</div>
              <p className="text-[11px] text-[#EDEDE8] leading-relaxed">{currentZone.use}</p>
              
              {/* Tooltip for Typical Use */}
              <div className="absolute -top-12 left-0 w-64 bg-[#1C1F22] border border-[#3A3F47] p-2.5 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="text-[10px] font-bold text-emerald-400 mb-0.5 font-display">TYPICAL USE GUIDANCE</div>
                <p className="text-[9px] text-[#9AA0A6] leading-tight">
                  Selection of the correct flame zone is critical. Using the wrong atmosphere can lead to carbon pick-up (brittleness) or oxidation (slag inclusion).
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#2D3239] bg-[#0D0F11]/60 p-4 flex flex-col justify-between">
              <div>
                <div className="text-[9px] font-mono text-[#6B7076] tracking-wider uppercase mb-1">Combustion Chemistry</div>
                <div className="text-[11px] text-[#EDEDE8] font-mono mt-1 space-y-1">
                  {currentZone.key === "neutral" ? (
                    <>
                      <div className="text-emerald-400 font-semibold">C₂H₂ + O₂ → 2CO + H₂ + Q</div>
                      <div className="text-[#9AA0A6] text-[10px]">Primary stage (at inner core)</div>
                    </>
                  ) : currentZone.key === "oxid" ? (
                    <>
                      <div className="text-red-400 font-semibold">C₂H₂ + O₂ + [excess O₂]</div>
                      <div className="text-[#9AA0A6] text-[10px]">Oxidizing atmosphere burns alloy components</div>
                    </>
                  ) : (
                    <>
                      <div className="text-yellow-500 font-semibold">C₂H₂ + O₂ + [unburnt Carbon]</div>
                      <div className="text-[#9AA0A6] text-[10px]">Unburnt carbon feather dissolves into hot steel</div>
                    </>
                  )}
                </div>
              </div>
              <div className="text-[9px] text-[#6B7076] mt-2 italic leading-normal">
                Stage 2 combustion occurs in the outer plume where CO and H₂ burn with oxygen from the surrounding air.
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* METALLURGICAL WARNING SUMMARY PANEL */}
      <div className="rounded-xl bg-amber-950/10 border border-amber-900/30 p-4 flex gap-2.5 items-start">
        <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <div className="text-[11px] font-bold text-[#EDEDE8] font-display">Gas Welding Metallurgical Danger Zones</div>
          <p className="text-[10px] text-[#9AA0A6] mt-1 leading-relaxed">
            Using the wrong flame on metals ruins weld integrity. For example, a **Carburizing flame** introduces excess carbon into mild steel, making it extremely brittle and prone to structural cracking. Conversely, an **Oxidizing flame** on mild steel will burn out the alloying carbon and form severe slag, weakening the weld pool. Always adjust your valves carefully to achieve a clean **Neutral flame** for steel welding!
          </p>
        </div>
      </div>
    </div>
  );
}
