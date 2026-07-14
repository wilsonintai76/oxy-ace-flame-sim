/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Activity, TrendingUp } from "lucide-react";
import { PuddleState, Spark } from "../types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

interface WeldPuddleProps {
  puddleTemperature: number;
  puddleState: PuddleState;
  torchOffset: number;
  setTorchOffset: (v: number) => void;
  distanceToWorkpiece: number;
  setDistanceToWorkpiece: (v: number) => void;
  sootLevel: number;
  oxideLevel: number;
  sparks: Spark[];
  lit: boolean;
  ratio: number;
  c2h2Flow: number;
  o2Flow: number;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111317]/95 border border-[#2D3239] p-2 rounded-lg shadow-xl font-mono text-[9px] text-[#EDEDE8]">
        <p className="text-[#6B7076]">Time: {payload[0].payload.time}</p>
        <p className="font-bold text-[#F5A623]">Temp: {payload[0].value}°C</p>
      </div>
    );
  }
  return null;
};

export default function WeldPuddle({
  puddleTemperature,
  puddleState,
  torchOffset,
  setTorchOffset,
  distanceToWorkpiece,
  setDistanceToWorkpiece,
  sootLevel,
  oxideLevel,
  sparks,
  lit,
  ratio,
  c2h2Flow,
  o2Flow,
}: WeldPuddleProps) {
  const [tempHistory, setTempHistory] = React.useState<{ time: string; temp: number }[]>(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      time: `${30 - i}s ago`,
      temp: 25,
    }));
  });
  const tempRef = React.useRef(puddleTemperature);

  React.useEffect(() => {
    tempRef.current = puddleTemperature;
  }, [puddleTemperature]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTempHistory((prev) => {
        if (prev.length === 0) return prev;
        // Shift existing values left and add the new temperature value
        return prev.map((item, idx) => {
          if (idx === prev.length - 1) {
            return { time: "Now", temp: Math.round(tempRef.current) };
          }
          const secondsAgo = prev.length - 1 - idx;
          return { time: `${secondsAgo}s ago`, temp: prev[idx + 1].temp };
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Determine flame type and properties for visualization
  const isPureAcetylene = lit && (o2Flow < 0.1 || ratio < 0.1);
  const isCarburizing = lit && !isPureAcetylene && ratio < 0.45;
  const isNeutral = lit && ratio >= 0.45 && ratio <= 0.55;
  const isOxidizing = lit && ratio > 0.55;

  // Outer flame envelope colors
  let outerStartColor = "rgba(59, 130, 246, 0.95)"; // Blue
  let outerMidColor = "rgba(139, 92, 246, 0.85)";  // Purple
  let outerEndColor = "rgba(245, 158, 11, 0)";      // Orange/transparent
  
  if (isPureAcetylene) {
    outerStartColor = "rgba(249, 115, 22, 0.95)"; // Bright Orange
    outerMidColor = "rgba(239, 68, 68, 0.8)";    // Soft Red
    outerEndColor = "rgba(252, 211, 77, 0.2)";   // Soft yellow glow
  } else if (isCarburizing) {
    outerStartColor = "rgba(59, 130, 246, 0.85)";  // Light blue
    outerMidColor = "rgba(254, 215, 170, 0.85)"; // Acetylenic feather (yellowish-white)
    outerEndColor = "rgba(239, 68, 68, 0.25)";    // Faint reddish tail
  } else if (isNeutral) {
    outerStartColor = "rgba(37, 99, 235, 0.95)";  // Strong blue
    outerMidColor = "rgba(147, 51, 234, 0.75)";  // Deep purple
    outerEndColor = "rgba(249, 115, 22, 0)";     // Clean fade
  } else if (isOxidizing) {
    outerStartColor = "rgba(79, 70, 229, 0.95)";  // Indigo-purple
    outerMidColor = "rgba(236, 72, 153, 0.6)";   // Pinkish-purple
    outerEndColor = "rgba(220, 38, 38, 0)";      // Short fade
  }

  // Inner cone properties
  let innerConeStart = "#cffafe";
  let innerConeMid = "#ffffff";
  let innerConeEnd = "#cffafe";
  let innerConeOpacity = 0.95;

  if (isPureAcetylene) {
    // Pure acetylene has no bright inner cone, just a soft red-orange core
    innerConeStart = "rgba(239, 68, 68, 0.7)";
    innerConeMid = "rgba(249, 115, 22, 0.5)";
    innerConeEnd = "rgba(239, 68, 68, 0)";
    innerConeOpacity = 0.6;
  } else if (isCarburizing) {
    // White/cyan inner cone
    innerConeStart = "#e0f7fa";
    innerConeMid = "#ffffff";
    innerConeEnd = "#e0f7fa";
  } else if (isNeutral) {
    // Brilliant white-cyan inner cone
    innerConeStart = "#a5f3fc";
    innerConeMid = "#ffffff";
    innerConeEnd = "#a5f3fc";
  } else if (isOxidizing) {
    // Small deep purple-blue inner cone
    innerConeStart = "#c7d2fe";
    innerConeMid = "#ffffff";
    innerConeEnd = "#818cf8";
  }

  // Dynamic lengths & widths
  let innerConeLengthMultiplier = 0.7;
  let outerEnvelopeWidthMultiplier = 0.4;
  let outerEnvelopeLengthMultiplier = 1.0;

  if (isPureAcetylene) {
    innerConeLengthMultiplier = 0.2;
    outerEnvelopeWidthMultiplier = 0.75; // Wider
    outerEnvelopeLengthMultiplier = 1.6; // Much longer loose flame
  } else if (isCarburizing) {
    innerConeLengthMultiplier = 0.95; // Feather makes it look longer
    outerEnvelopeWidthMultiplier = 0.5;
    outerEnvelopeLengthMultiplier = 1.15;
  } else if (isNeutral) {
    innerConeLengthMultiplier = 0.6; // Sharp & crisp
    outerEnvelopeWidthMultiplier = 0.4;
    outerEnvelopeLengthMultiplier = 1.0;
  } else if (isOxidizing) {
    innerConeLengthMultiplier = 0.35; // Tiny sharp cone
    outerEnvelopeWidthMultiplier = 0.3; // Narrow
    outerEnvelopeLengthMultiplier = 0.75; // Shorter
  }

  return (
    <div className="rounded-2xl border border-[#2D3239] bg-[#16191D] p-5 shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border-b border-[#2D3239] pb-2">
        <h3 className="text-[10px] font-mono font-black tracking-widest text-[#9AA0A6] uppercase flex items-center gap-2">
          <Activity size={14} className="text-[#F5A623]" />
          Metallurgical Puddle Physics
        </h3>

        <div className="flex items-center gap-4 text-[10px] font-mono text-[#EDEDE8]">
          <div>Temp: <span className={`font-bold ${
            puddleTemperature > 1500 ? "text-amber-400 animate-pulse" :
            puddleTemperature > 600 ? "text-rose-500" : "text-[#6B7076]"
          }`}>{Math.round(puddleTemperature)}°C</span></div>
          
          <div>State: <span className="font-bold text-sky-400 uppercase">{puddleState.replace("-", " ")}</span></div>
        </div>
      </div>
      
      {/* WORKPIECE SPECIFICATIONS BANNER */}
      <div className="mb-4 bg-[#0D0F11]/60 border border-[#2D3239]/60 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-[#6B7076] uppercase tracking-wider font-bold">Material:</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-500/10 font-bold">Mild Steel (A36)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#6B7076] uppercase tracking-wider font-bold">Thickness:</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-950/40 text-[#F5A623] border border-amber-500/10 font-bold">3.0 mm (1/8" Ga)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#6B7076] uppercase tracking-wider font-bold">Root Opening:</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/10 font-bold">1.5 mm (1/16")</span>
        </div>
      </div>

      {/* Weld pool visualizer panel */}
      <div className="relative bg-[#05070a] h-32 rounded-lg border border-[#0D0F11] overflow-hidden flex items-center justify-center shadow-inner">
        {/* Solid steel plates */}
        <div className="absolute inset-0 flex">
          <div className="w-1/2 h-full bg-[#1C1F22] border-r border-[#0D0F11]" />
          <div className="w-1/2 h-full bg-[#1C1F22]" />
        </div>

        {/* Dynamic Heat Affected Zone (HAZ) */}
        <div 
          className="absolute w-24 h-24 rounded-full blur-2xl opacity-70 transition-all duration-100"
          style={{
            left: `calc(${torchOffset}% - 48px)`,
            background: puddleTemperature > 1400 
              ? "radial-gradient(circle, #fff 0%, #fbbf24 30%, #ef4444 60%, #450a0a 100%)" 
              : puddleTemperature > 600 
              ? "radial-gradient(circle, #ef4444 20%, #7f1d1d 60%, transparent 100%)" 
              : "transparent"
          }}
        />

        {/* Molten Liquid Puddle */}
        {puddleTemperature > 1400 && (
          <div 
            className="absolute rounded-full border border-amber-500/30 transition-all duration-100 z-10"
            style={{
              left: `calc(${torchOffset}% - 20px)`,
              width: "40px",
              height: "40px",
              background: puddleState === "soot-covered" 
                ? "#334155" 
                : puddleState === "oxidized"
                ? "#b45309" 
                : "radial-gradient(circle, #ffedd5 0%, #fcd34d 40%, #e2e8f0 80%)",
              boxShadow: "0 0 20px rgba(245, 158, 11, 0.6)",
            }}
          />
        )}

        {/* Surface Soot Deposits */}
        <div 
          className="absolute h-12 w-48 rounded-full bg-black/80 blur-md transition-opacity duration-300 z-20"
          style={{
            left: `calc(${torchOffset}% - 96px)`,
            opacity: Math.min(0.9, sootLevel / 100),
          }}
        />

        {/* Surface Oxide Scales */}
        <div 
          className="absolute h-10 w-28 rounded-full bg-orange-950/60 border border-amber-800/40 blur-sm transition-opacity duration-300 z-20"
          style={{
            left: `calc(${torchOffset}% - 56px)`,
            opacity: Math.min(0.8, oxideLevel / 100),
          }}
        />

        {/* Spark Particles */}
        {sparks.map((s) => (
          <div 
            key={s.id}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full z-30"
            style={{
              left: `calc(${s.x}% + ${s.vx * 3}px)`,
              top: `calc(50% + ${s.vy * 3}px)`,
              opacity: s.life,
              transform: `scale(${s.life})`,
            }}
          />
        ))}

        {/* Torch tip & Flame Visualizer (Working Distance & Offset Indicator) */}
        <div 
          className="absolute inset-y-0 pointer-events-none z-40 transition-all duration-100"
          style={{ 
            left: `${torchOffset}%`,
            width: "120px",
            transform: "translateX(-50%)"
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 120 128" className="overflow-visible">
            <defs>
              <linearGradient id="copperGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7c2d12" />
                <stop offset="30%" stopColor="#d97706" />
                <stop offset="70%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#7c2d12" />
              </linearGradient>
              <linearGradient id="flameOuterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={outerStartColor} />
                <stop offset="35%" stopColor={outerMidColor} />
                <stop offset="70%" stopColor={outerMidColor} />
                <stop offset="100%" stopColor={outerEndColor} />
              </linearGradient>
              <linearGradient id="innerConeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={innerConeStart} />
                <stop offset="50%" stopColor={innerConeMid} />
                <stop offset="100%" stopColor={innerConeStart} />
              </linearGradient>
            </defs>

            {/* Calculations for nozzle position based on distanceToWorkpiece (0.8mm to 12.0mm) */}
            {(() => {
              const centerY = 64; // Middle of 128px container
              const distInPixels = Math.max(4, distanceToWorkpiece * 5.0);
              const nozzleTipY = centerY - distInPixels;

              return (
                <g>
                  {/* Flame (Only visible when lit) */}
                  {lit && (
                    <g>
                      {/* Outer Glow Halo */}
                      <circle 
                        cx="60" 
                        cy={centerY} 
                        r={Math.max(10, (35 - distanceToWorkpiece * 1.5) * outerEnvelopeLengthMultiplier)} 
                        fill={isPureAcetylene ? "rgba(249, 115, 22, 0.25)" : "rgba(245, 158, 11, 0.25)"} 
                        style={{ filter: "blur(8px)" }} 
                      />

                      {/* Outer Flame Envelope path */}
                      <path 
                        d={`M 54 ${nozzleTipY} 
                            Q ${60 - Math.min(25, distInPixels * outerEnvelopeWidthMultiplier)} ${(nozzleTipY + centerY) / 2} ${60 - Math.min(25, distInPixels * outerEnvelopeWidthMultiplier * 1.2)} ${centerY} 
                            Q 60 ${centerY + (isPureAcetylene ? 25 : 10) * outerEnvelopeLengthMultiplier} ${60 + Math.min(25, distInPixels * outerEnvelopeWidthMultiplier * 1.2)} ${centerY} 
                            Q ${60 + Math.min(25, distInPixels * outerEnvelopeWidthMultiplier)} ${(nozzleTipY + centerY) / 2} 66 ${nozzleTipY} Z`} 
                        fill="url(#flameOuterGrad)" 
                        opacity="0.85"
                        style={{ filter: "blur(1px)" }}
                      />

                      {/* Inner Cone (Intense Blue/White) */}
                      <path 
                        d={`M 57 ${nozzleTipY} 
                            L 60 ${nozzleTipY + Math.min(24, distInPixels * innerConeLengthMultiplier)} 
                            L 63 ${nozzleTipY} Z`} 
                        fill="url(#innerConeGrad)" 
                        opacity={innerConeOpacity}
                      />
                    </g>
                  )}

                  {/* Brass/Copper Nozzle Body */}
                  {/* Main tube */}
                  <rect x="54" y="0" width="12" height={Math.max(0, nozzleTipY - 10)} fill="url(#copperGrad)" />
                  {/* Tapered collar */}
                  <path 
                    d={`M 54 ${Math.max(0, nozzleTipY - 10)} 
                        L 56 ${nozzleTipY} 
                        L 64 ${nozzleTipY} 
                        L 66 ${Math.max(0, nozzleTipY - 10)} Z`} 
                    fill="url(#copperGrad)" 
                    stroke="#451a03" 
                    strokeWidth="0.5" 
                  />

                  {/* Arc Center target guideline */}
                  <line 
                    x1="60" 
                    y1={nozzleTipY} 
                    x2="60" 
                    y2={centerY} 
                    stroke={lit ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)"} 
                    strokeWidth="0.75" 
                    strokeDasharray="2,2" 
                  />

                  {/* Tiny text identifier next to the torch */}
                  <text 
                    x="74" 
                    y={Math.max(16, nozzleTipY - 6)} 
                    fill="#6B7076" 
                    fontSize="7" 
                    fontFamily="monospace" 
                    fontWeight="bold"
                  >
                    TORCH TIP
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* Interaction Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div>
          <div className="flex justify-between items-center text-[10px] font-mono mb-2 min-h-[32px]">
            <span className="text-[#9AA0A6] mr-2">Working Distance (Torch to Puddle):</span>
            <span className={`font-bold whitespace-nowrap shrink-0 ${distanceToWorkpiece < 1.5 ? "text-rose-500 animate-pulse font-black" : "text-sky-400"}`}>
              {distanceToWorkpiece.toFixed(1)} mm
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={12.0}
            step={0.1}
            value={distanceToWorkpiece}
            onChange={(e) => setDistanceToWorkpiece(Number(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#6B7076] font-mono mt-1">
            <span className="text-red-500/80 font-bold">1.0mm Backfire</span>
            <span>Ideal: ~2.5mm</span>
            <span>12.0mm</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center text-[10px] font-mono mb-2 min-h-[32px]">
            <span className="text-[#9AA0A6] mr-2">Horizontal Torch Position:</span>
            <span className="font-bold text-[#F5A623] whitespace-nowrap shrink-0">{torchOffset}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={90}
            value={torchOffset}
            onChange={(e) => setTorchOffset(Number(e.target.value))}
            className="w-full accent-[#F5A623] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#6B7076] font-mono mt-1">
            <span>Left Seam</span>
            <span>Joint Center</span>
            <span>Right Seam</span>
          </div>
        </div>
      </div>

      {/* Temperature History Chart */}
      <div className="mt-5 border-t border-[#2D3239] pt-4">
        <div className="flex justify-between items-center mb-2.5">
          <h4 className="text-[10px] font-mono font-black tracking-widest text-[#9AA0A6] uppercase flex items-center gap-2">
            <TrendingUp size={14} className="text-[#F5A623]" />
            Temperature History (Last 30s)
          </h4>
          <div className="flex items-center gap-3 text-[9px] font-mono">
            <span className="flex items-center gap-1.5 text-rose-500 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              RECORDING
            </span>
            <span className="text-[#6B7076]">Target: 1400°C - 3300°C</span>
          </div>
        </div>
        <div className="relative w-full h-32 bg-[#0D0F11] rounded-lg border border-[#2D3239] p-2 pr-4">
          <ResponsiveContainer width="99%" height="100%">
            <LineChart data={tempHistory} margin={{ top: 12, right: 10, left: -15, bottom: -5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#475569"
                fontSize={8}
                fontFamily="monospace"
                tickLine={false}
                axisLine={false}
                interval={5}
              />
              <YAxis
                stroke="#475569"
                fontSize={8}
                fontFamily="monospace"
                tickLine={false}
                axisLine={false}
                domain={[0, 3500]}
                tickFormatter={(v) => `${v}°C`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={1400}
                stroke="#EF4444"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{
                  value: "MELTING POINT (1400°C)",
                  position: "top",
                  fill: "#EF4444",
                  fontSize: 7,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              />
              <Line
                type="monotone"
                dataKey="temp"
                stroke="#F5A623"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#FFF", stroke: "#F5A623", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chemical Report */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#2D3239] font-mono text-[9px]">
        <div className="p-2.5 bg-[#0D0F11] rounded-lg border border-[#2D3239] shadow-inner">
          <span className="text-[#6B7076] block uppercase tracking-tighter mb-1">Carbon Accrual</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-slate-900 rounded-full overflow-hidden">
               <div className="h-full bg-slate-400" style={{ width: `${sootLevel}%` }} />
            </div>
            <span className="font-bold text-slate-300">{sootLevel.toFixed(1)}%</span>
          </div>
          <p className="text-[8px] text-[#6B7076] mt-1 line-clamp-2">Diffuses carbon into puddle forming iron carbide ($Fe_3C$). Increases joint brittleness.</p>
        </div>
        <div className="p-2.5 bg-[#0D0F11] rounded-lg border border-[#2D3239] shadow-inner">
          <span className="text-[#6B7076] block uppercase tracking-tighter mb-1">Oxidation Slag</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-slate-900 rounded-full overflow-hidden">
               <div className="h-full bg-orange-600" style={{ width: `${oxideLevel}%` }} />
            </div>
            <span className="font-bold text-orange-500">{oxideLevel.toFixed(1)}%</span>
          </div>
          <p className="text-[8px] text-[#6B7076] mt-1 line-clamp-2">Produces ferric oxide scales ($FeO$). Results in porous, low-strength brittle joints.</p>
        </div>
        <div className="p-2.5 bg-[#0D0F11] rounded-lg border border-[#2D3239] shadow-inner">
          <span className="text-[#6B7076] block uppercase tracking-tighter mb-1">Thermodynamics</span>
          <span className="text-[10px] font-bold text-sky-400 uppercase">{puddleState.replace("-", " ")}</span>
          <p className="text-[8px] text-[#6B7076] mt-1 line-clamp-2">Neutral flame @ 2.5mm produces optimal molten pool with cohesive grain structure.</p>
        </div>
      </div>
    </div>
  );
}
