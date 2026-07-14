/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Gauge, AlertTriangle } from "lucide-react";

interface CylinderManifoldProps {
  oxyCylinderOpen: boolean;
  setOxyCylinderOpen: (v: boolean) => void;
  aceCylinderOpen: boolean;
  setAceCylinderOpen: (v: boolean) => void;
  oxyRegulatorPSI: number;
  setOxyRegulatorPSI: (v: number) => void;
  aceRegulatorPSI: number;
  setAceRegulatorPSI: (v: number) => void;
  showBlastWarning: boolean;
}

export default function CylinderManifold({
  oxyCylinderOpen,
  setOxyCylinderOpen,
  aceCylinderOpen,
  setAceCylinderOpen,
  oxyRegulatorPSI,
  setOxyRegulatorPSI,
  aceRegulatorPSI,
  setAceRegulatorPSI,
  showBlastWarning,
}: CylinderManifoldProps) {
  return (
    <div className="rounded-2xl border border-[#2D3239] bg-[#16191D] p-5 shadow-xl relative overflow-hidden">
      <div className="flex justify-between items-center mb-4 border-b border-[#2D3239] pb-2">
        <h2 className="text-[10px] font-mono font-black tracking-widest text-[#9AA0A6] uppercase flex items-center gap-2">
          <Gauge size={14} className="text-[#F5A623]" />
          Cylinder Regulator Station
        </h2>
        {showBlastWarning && (
          <span className="text-[10px] font-mono font-bold bg-red-950/80 text-red-400 border border-red-500/40 px-2 py-0.5 rounded animate-bounce flex items-center gap-1">
            <AlertTriangle size={12} /> EXPLOSION HAZARD
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* OXYGEN CYLINDER */}
        <div className="bg-[#0D0F11] rounded-xl p-3 border border-blue-900/20 relative">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Oxygen (O₂)
            </span>
            <button
              onClick={() => setOxyCylinderOpen(!oxyCylinderOpen)}
              className={`px-2 py-0.5 text-[9px] uppercase font-mono rounded font-black transition-all cursor-pointer ${
                oxyCylinderOpen 
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30" 
                  : "bg-[#1C1F22] text-[#6B7076] border border-[#2D3239]"
              }`}
            >
              {oxyCylinderOpen ? "Opened" : "Closed"}
            </button>
          </div>

          <div className="space-y-3">
            <div className="bg-[#16191D] p-2.5 rounded-lg border border-[#2D3239]">
              <span className="text-[10px] font-mono text-[#6B7076] block">Tank Pressure:</span>
              <span className="text-sm font-black font-mono text-[#EDEDE8]">
                {oxyCylinderOpen ? "2,200 PSI" : "0 PSI"}
              </span>
              <div className="w-full bg-[#0D0F11] h-1 rounded-full mt-1.5 overflow-hidden">
                <div className={`h-full transition-all duration-500 ${oxyCylinderOpen ? "bg-blue-500" : "bg-slate-800"}`} style={{ width: oxyCylinderOpen ? "85%" : "0%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-mono mb-1.5">
                <span className="text-[#6B7076]">Regulator Output:</span>
                <span className="font-bold text-blue-400">{oxyRegulatorPSI} PSI</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                disabled={!oxyCylinderOpen}
                value={oxyRegulatorPSI}
                onChange={(e) => setOxyRegulatorPSI(Number(e.target.value))}
                className="w-full accent-blue-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#6B7076] font-mono mt-1">
                <span>0 PSI</span>
                <span>Normal: ~30 PSI</span>
              </div>
            </div>
          </div>
        </div>

        {/* ACETYLENE CYLINDER */}
        <div className="bg-[#0D0F11] rounded-xl p-3 border border-red-900/20 relative">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-red-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Acetylene (C₂H₂)
            </span>
            <button
              onClick={() => setAceCylinderOpen(!aceCylinderOpen)}
              className={`px-2 py-0.5 text-[9px] uppercase font-mono rounded font-black transition-all cursor-pointer ${
                aceCylinderOpen 
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30" 
                  : "bg-[#1C1F22] text-[#6B7076] border border-[#2D3239]"
              }`}
            >
              {aceCylinderOpen ? "Opened" : "Closed"}
            </button>
          </div>

          <div className="space-y-3">
            <div className="bg-[#16191D] p-2.5 rounded-lg border border-[#2D3239]">
              <span className="text-[10px] font-mono text-[#6B7076] block">Tank Pressure:</span>
              <span className="text-sm font-black font-mono text-[#EDEDE8]">
                {aceCylinderOpen ? "250 PSI" : "0 PSI"}
              </span>
              <div className="w-full bg-[#0D0F11] h-1 rounded-full mt-1.5 overflow-hidden">
                <div className={`h-full transition-all duration-500 ${aceCylinderOpen ? "bg-red-500" : "bg-slate-800"}`} style={{ width: aceCylinderOpen ? "70%" : "0%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-mono mb-1.5">
                <span className="text-[#6B7076]">Regulator Output:</span>
                <span className={`font-bold ${aceRegulatorPSI > 15 ? "text-red-500 animate-pulse font-black" : "text-red-400"}`}>
                  {aceRegulatorPSI} PSI
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                disabled={!aceCylinderOpen}
                value={aceRegulatorPSI}
                onChange={(e) => setAceRegulatorPSI(Number(e.target.value))}
                className="w-full accent-red-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#6B7076] font-mono mt-1">
                <span>0 PSI</span>
                <span className="text-rose-500 font-bold">15 PSI Max!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
