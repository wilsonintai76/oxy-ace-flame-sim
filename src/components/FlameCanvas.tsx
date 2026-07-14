/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FlameParams } from "../types";
import { Sparkles, Info } from "lucide-react";
import FlameGradientsAndFilters from "./FlameGradientsAndFilters";
import { Sparks } from "./Sparks";

interface FlameCanvasProps {
  lit: boolean;
  c2h2Flow: number; // 0 to 10
  o2Flow: number;   // 0 to 10
  ratio: number;    // 0 to 1
  params: FlameParams;
  sparking: boolean;
  onRatioChange?: (newRatio: number) => void;
  showFeather?: boolean;
  activeTutorialStep?: number | null;
}

export default function FlameCanvas({
  lit,
  c2h2Flow,
  o2Flow,
  ratio,
  params,
  sparking,
  onRatioChange,
  showFeather = true,
  activeTutorialStep = null,
}: FlameCanvasProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [draggingHandle, setDraggingHandle] = useState<"inner" | "envelope" | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const totalFlow = c2h2Flow + o2Flow;

  const tipX = 90;
  const tipY = 110;

  // Global Pointer Dragging Effect for Flame Handles
  useEffect(() => {
    if (!draggingHandle || !onRatioChange) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const clickXInSvg = ((e.clientX - rect.left) / rect.width) * 450; // ViewBox width is 450

      if (draggingHandle === "inner") {
        // coneLen ranges from 26 (ratio=1.0) to 60 (ratio=0.0).
        // x-coordinate of inner cone tip is tipX + 15 + coneLen = 105 + coneLen
        const coneLen = Math.max(26, Math.min(60, clickXInSvg - 105));
        let newRatio = 0.5;
        if (coneLen > 46) {
          // ratio is in [0, 0.5]
          newRatio = 0.5 * (60 - coneLen) / 14;
        } else {
          // ratio is in [0.5, 1.0]
          newRatio = 0.5 + 0.5 * (46 - coneLen) / 20;
        }
        newRatio = Math.max(0.01, Math.min(0.99, newRatio)); // Keep tiny safety boundary
        onRatioChange(newRatio);
      } else if (draggingHandle === "envelope") {
        // envLen ranges from 70 (ratio=1.0) to 150 (ratio=0.0).
        // x-coordinate of envelope tip is tipX + envLen = 90 + envLen
        const envLen = Math.max(70, Math.min(150, clickXInSvg - 90));
        let newRatio = 0.5;
        if (envLen > 130) {
          // ratio is in [0, 0.5]
          newRatio = 0.5 * (150 - envLen) / 20;
        } else {
          // ratio is in [0.5, 1.0]
          newRatio = 0.5 + 0.5 * (130 - envLen) / 60;
        }
        newRatio = Math.max(0.01, Math.min(0.99, newRatio)); // Keep tiny safety boundary
        onRatioChange(newRatio);
      }
    };

    const handlePointerUp = () => {
      setDraggingHandle(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingHandle, onRatioChange]);

  // Real-time calculated flame metrics for display
  const flameTemp = useMemo(() => {
    if (!lit) return 0;
    if (o2Flow === 0) return 800; // soft yellow flame
    if (ratio < 0.34) {
      // Carburizing: lerp from 800 to 3040
      const t = ratio / 0.34;
      return Math.round(800 + (3040 - 800) * t);
    } else if (ratio <= 0.5) {
      // Carburizing to Neutral: lerp from 3040 to 3200
      const t = (ratio - 0.34) / 0.16;
      return Math.round(3040 + (3200 - 3040) * t);
    } else {
      // Neutral to Oxidizing: lerp from 3200 to 3500
      const t = (ratio - 0.5) / 0.5;
      return Math.round(3200 + (3500 - 3200) * t);
    }
  }, [lit, ratio, o2Flow]);

  // Is it pure acetylene?
  const isPureAcetylene = lit && o2Flow === 0 && c2h2Flow > 0;

  // Helper to draw inner cone path: pointed needle for Oxidizing, beautiful rounded bullet for Neutral/Carburizing
  const getInnerCorePath = () => {
    const w = params.coneWidth;
    const L = params.coneLen;
    const base = tipX + 20;
    if (ratio > 0.55) {
      // POINTED INNER CORE (Oxidizing): extremely sharp and intense
      return `M ${base} ${tipY - w / 2}
              L ${base + L} ${tipY}
              L ${base} ${tipY + w / 2}
              Z`;
    } else {
      // ROUNDED INNER CORE (Neutral & Carburizing): perfectly rounded bullet
      return `M ${base} ${tipY - w / 2}
              A ${L * 0.7} ${w / 2} 0 0 1 ${base + L} ${tipY}
              A ${L * 0.7} ${w / 2} 0 0 1 ${base} ${tipY + w / 2}
              Z`;
    }
  };

  // Info card text for hovered zone
  const getZoneTooltip = (zone: string) => {
    switch (zone) {
      case "nozzle":
        return {
          title: "Torch Tip / Nozzle",
          desc: "Precision copper alloy tip that mixes and directs fuel gases. Essential for stable flame geometry and heat concentration.",
          detail: "Critical for preventing flashback and maintaining steady thermal energy input to the workpiece.",
        };
      case "inner":
        return {
          title: "Inner Cone (Heat Engine)",
          desc: isPureAcetylene 
            ? "Luminous yellow carbon particles forming soot." 
            : "Primary combustion zone. Highest heat intensity. Crucial for melting base metal quickly.",
          detail: `Temp ~${flameTemp}°C. Position this tip ~3mm from the metal for maximum penetration and fusion.`,
        };
      case "feather":
        return {
          title: "Acetylene Feather (Carbon Source)",
          desc: "Intermediate cone of unburnt carbon. Presence indicates a reducing (carburizing) atmosphere.",
          detail: "Important for: Hard-facing and welding high-carbon steels where adding carbon to the weld pool is desirable.",
        };
      case "envelope":
        return {
          title: "Outer Envelope (Atmospheric Shield)",
          desc: "Secondary combustion zone where gases react with surrounding air. Provides a protective blanket.",
          detail: "Critical Importance: Prevents oxidation and nitrogen contamination of the molten weld pool during fusion.",
        };
      case "inner_handle":
        return {
          title: "Inner Cone Adjustment Handle",
          desc: "Drag this handle left or right to interactively stretch or shrink the Inner Core. This dynamically updates the Oxygen-to-Acetylene ratio.",
          detail: "Drag left (towards the tip) to increase Oxygen and create an Oxidizing flame, or right to make a Carburizing flame.",
        };
      case "envelope_handle":
        return {
          title: "Outer Envelope Adjustment Handle",
          desc: "Drag this handle left or right to interactively stretch or shrink the Outer Envelope of the flame.",
          detail: "This lets you dynamically experiment with the shape and length of the atmospheric shielding envelope.",
        };
      default:
        return null;
    }
  };

  const activeTooltip = hoveredZone ? getZoneTooltip(hoveredZone) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative rounded-2xl border border-[#2D3239] bg-[#0A0A0A] p-5 overflow-hidden shadow-inner select-none">
        {/* Cinematic Background Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_50%,_rgba(59,130,246,0.05)_0%,_transparent_70%)] pointer-events-none" />
        {lit && (
          <motion.div 
            animate={{ 
              opacity: [0.03, 0.08, 0.03],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_25%_50%,_rgba(245,166,35,0.1)_0%,_transparent_60%)] pointer-events-none" 
          />
        )}
        
        {/* Status Indicators */}
        <div className="absolute top-2 left-4 flex gap-2 z-10">
          <div className="flex items-center gap-1.5 rounded-full bg-[#16191D]/90 px-2.5 py-1 border border-[#2D3239] text-[10px] font-mono text-[#9AA0A6]">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${lit ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            STATUS: {lit ? "IGNITED" : "OFFLINE"}
          </div>
          {lit && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#16191D]/90 px-2.5 py-1 border border-[#2D3239] text-[10px] font-mono text-[#F5A623]">
              TEMP: {flameTemp}°C
            </div>
          )}
        </div>

        {/* Floating Interactive Guide Toggle / Flame Profile HUD */}
        {lit ? (
          <div className="absolute top-2 right-4 bg-[#111317]/95 border border-[#2D3239] px-3.5 py-1.5 rounded-xl flex flex-col items-end shadow-xl backdrop-blur-sm z-10 transition-all duration-300">
            <span className="text-[9px] font-mono text-[#8B949E] tracking-widest uppercase">Flame Profile</span>
            <span className={`text-xs font-bold font-display uppercase tracking-tight ${
              isPureAcetylene 
                ? "text-amber-500" 
                : ratio < 0.45 
                  ? "text-purple-400 font-medium" 
                  : ratio > 0.55 
                    ? "text-[#7FB2D9]" 
                    : "text-emerald-400"
            }`}>
              {isPureAcetylene 
                ? "Pure Acetylene (Smoky)" 
                : ratio < 0.45 
                  ? "Carburizing (Reducing)" 
                  : ratio > 0.55 
                    ? "Oxidizing (Excess O₂)" 
                    : "Neutral (Balanced)"}
            </span>
          </div>
        ) : (
          <div className="absolute top-2 right-4 text-[10px] font-mono text-[#6B7076] hidden sm:block">
            💡 Hover over flame zones to inspect chemical properties
          </div>
        )}

        {/* Main Canvas SVG */}
        <div className="w-full flex justify-center py-6">
          <svg
            ref={svgRef}
            viewBox="0 0 450 260"
            className="w-full max-w-[550px] h-auto drop-shadow-2xl relative"
          >
            {/* SVG Gradients and Filters */}
            <FlameGradientsAndFilters />
            
            {/* Base Flare (Intense point of origin) */}
            {lit && (
              <motion.circle
                animate={{ 
                  r: [3, 5, 3],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ duration: 0.1, repeat: Infinity }}
                cx={tipX + 15} cy={tipY} r="4"
                fill="#FFFFFF"
                filter="blur(2px)"
                className="pointer-events-none"
              />
            )}

            {/* Soot / Smoke Particles (Carburizing indicator) */}
            {lit && (ratio < 0.75 || isPureAcetylene) && (
              <g className="pointer-events-none">
                {/* 1. Wispy Soot Haze */}
                <motion.ellipse
                  animate={{ 
                    opacity: [0.05 * (1 - ratio), 0.15 * (1 - ratio), 0.05 * (1 - ratio)],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  cx={tipX + 150} cy={tipY - 40}
                  rx="120" ry="60"
                  fill="#000000"
                  filter="blur(30px)"
                />

                {/* 2. Individual Soot Clumps */}
                {[...Array(isPureAcetylene ? 24 : 12)].map((_, i) => (
                  <motion.circle
                    key={`smoke-${i}`}
                    initial={{ 
                      cx: tipX + 40 + Math.random() * 60, 
                      cy: tipY + (Math.random() - 0.5) * 20, 
                      r: 1 + Math.random() * 4,
                      opacity: 0 
                    }}
                    animate={{ 
                      cx: [null, tipX + 150 + Math.random() * 100, tipX + 400 + Math.random() * 200],
                      cy: [null, tipY - 20 - Math.random() * 30, tipY - 150 - Math.random() * 150],
                      opacity: [0, 0.7 * (1 - ratio), 0.3 * (1 - ratio), 0],
                      scale: [1, 3, 6],
                      rotate: [0, Math.random() * 360]
                    }}
                    transition={{ 
                      duration: 3 + Math.random() * 3, 
                      repeat: Infinity, 
                      delay: i * 0.2,
                      ease: "easeOut" 
                    }}
                    fill="url(#smoke-grad)"
                    filter="url(#soot-texture)"
                  />
                ))}

                {/* 3. Fast rising hot soot streaks */}
                {[...Array(6)].map((_, i) => (
                  <motion.rect
                    key={`streak-${i}`}
                    width={2 + Math.random() * 2}
                    height={10 + Math.random() * 20}
                    initial={{ 
                      x: tipX + 80 + Math.random() * 100,
                      y: tipY - 20,
                      opacity: 0
                    }}
                    animate={{ 
                      y: [null, tipY - 300],
                      x: [null, tipX + 200 + (Math.random() - 0.5) * 200],
                      opacity: [0, 0.4 * (1 - ratio), 0]
                    }}
                    transition={{ 
                      duration: 1.5 + Math.random() * 1.5, 
                      repeat: Infinity, 
                      delay: i * 0.8,
                      ease: "linear"
                    }}
                    fill="#000"
                    filter="blur(4px)"
                  />
                ))}
              </g>
            )}

            {/* Ambient Heat Glow (Aura) */}
            {lit && (
              <motion.ellipse
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: [0.1, 0.2, 0.15],
                  scale: [1, 1.05, 1],
                  cx: 150 + totalFlow * 5
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                cx="160" cy="120"
                rx={100 + totalFlow * 15}
                ry={50 + totalFlow * 8}
                fill={isPureAcetylene ? "#F5A623" : "#3B82F6"}
                fillOpacity="0.1"
                filter="blur(40px)"
              />
            )}

            {/* Spark Sparks Flying out on Strike */}
            {sparking && (
              <g filter="url(#glow)">
                <circle cx={tipX + 15} cy={tipY - 5} r="2" fill="#F5A623" className="animate-ping" />
                <line x1={tipX} y1={tipY} x2={tipX + 80} y2={tipY - 30} stroke="#FBBF24" strokeWidth="2" strokeDasharray="3,15" className="animate-pulse" />
                <line x1={tipX} y1={tipY} x2={tipX + 90} y2={tipY + 25} stroke="#F5A623" strokeWidth="1.5" strokeDasharray="2,12" className="animate-pulse" />
                <line x1={tipX} y1={tipY} x2={tipX + 110} y2={tipY - 2} stroke="#EF4444" strokeWidth="1" strokeDasharray="5,10" className="animate-pulse" />
                <circle cx={tipX + 45} cy={tipY + 12} r="1.5" fill="#EF4444" />
                <circle cx={tipX + 60} cy={tipY - 18} r="1" fill="#FFFFFF" />
              </g>
            )}

            {/* FLAME GRAPHICS */}
            {lit && (
              <motion.g 
                animate={{ 
                  x: [0, -0.2, 0.2, 0, 0.1, -0.1, 0],
                  y: [0, 0.1, -0.1, 0.2, -0.2, 0, 0.1]
                }}
                transition={{ duration: 0.25, repeat: Infinity, ease: "linear" }}
                filter="url(#mirage)"
              >
                {/* 1. Pure Acetylene Flame (Orange, smoky, very large, animated) */}
                {isPureAcetylene && (
                  <g className="flame-glow-orange cursor-pointer" filter="url(#flameTurbulence)"
                     onMouseEnter={() => setHoveredZone("inner")}
                     onMouseLeave={() => setHoveredZone(null)}>
                    {/* Outer wavy soot-plume */}
                    <path
                      d={`M ${tipX + 20} ${tipY - 10} 
                          C ${tipX + 100} ${tipY - 45}, ${tipX + 180} ${tipY - 60}, ${tipX + 280} ${tipY - 12} 
                          C ${tipX + 320} ${tipY - 2}, ${tipX + 350} ${tipY + 5}, ${tipX + 330} ${tipY + 12} 
                          C ${tipX + 260} ${tipY + 65}, ${tipX + 160} ${tipY + 45}, ${tipX + 20} ${tipY + 10} Z`}
                      fill="url(#acetylene-grad)"
                    >
                      <animate attributeName="d" 
                        values={`
                          M ${tipX + 20} ${tipY - 10} C ${tipX + 100} ${tipY - 45}, ${tipX + 180} ${tipY - 60}, ${tipX + 280} ${tipY - 12} C ${tipX + 320} ${tipY - 2}, ${tipX + 350} ${tipY + 5}, ${tipX + 330} ${tipY + 12} C ${tipX + 260} ${tipY + 65}, ${tipX + 160} ${tipY + 45}, ${tipX + 20} ${tipY + 10} Z;
                          M ${tipX + 20} ${tipY - 8} C ${tipX + 90} ${tipY - 50}, ${tipX + 195} ${tipY - 52}, ${tipX + 270} ${tipY - 6} C ${tipX + 315} ${tipY + 4}, ${tipX + 345} ${tipY - 2}, ${tipX + 325} ${tipY + 15} C ${tipX + 250} ${tipY + 58}, ${tipX + 165} ${tipY + 40}, ${tipX + 20} ${tipY + 8} Z;
                          M ${tipX + 20} ${tipY - 10} C ${tipX + 100} ${tipY - 45}, ${tipX + 180} ${tipY - 60}, ${tipX + 280} ${tipY - 12} C ${tipX + 320} ${tipY - 2}, ${tipX + 350} ${tipY + 5}, ${tipX + 330} ${tipY + 12} C ${tipX + 260} ${tipY + 65}, ${tipX + 160} ${tipY + 45}, ${tipX + 20} ${tipY + 10} Z
                        `} 
                        dur="0.25s" repeatCount="indefinite" />
                    </path>
                    {/* Inner core - pure acetylene has a blurry yellow-white core */}
                    <ellipse cx={tipX + 30} cy={tipY} rx="15" ry="6" fill="#FFFFFF" opacity="0.9" />
                  </g>
                )}

                {/* 2. Mixed Gas Flame (O2 + C2H2) */}
                {!isPureAcetylene && (
                  <g>
                    {/* OUTER ENVELOPE (Translucent plume) */}
                    <g filter="url(#flameTurbulence)">
                    <motion.path
                      d={`M ${tipX + 20} ${tipY} 
                          C ${tipX + 20 + params.envLen * 0.3} ${tipY - params.envWidth * 0.5}, ${tipX + 20 + params.envLen} ${tipY - params.envWidth * 0.25}, ${tipX + 20 + params.envLen} ${tipY}
                          C ${tipX + 20 + params.envLen} ${tipY + params.envWidth * 0.25}, ${tipX + 20 + params.envLen * 0.3} ${tipY + params.envWidth * 0.5}, ${tipX + 20} ${tipY} Z`}
                      fill={ratio < 0.45 ? "url(#envelope-grad-carburizing)" : ratio > 0.55 ? "url(#envelope-grad-oxidizing)" : "url(#envelope-grad-neutral)"}
                      animate={{ 
                        opacity: [0.65, 0.75, 0.65],
                        scaleY: [1, 1.03, 0.97, 1],
                      }}
                      transition={{ duration: 0.1, repeat: Infinity, ease: "linear" }}
                      style={{ mixBlendMode: "screen", filter: "blur(5px)" }}
                      className={`flame-glow-blue cursor-pointer transition-all duration-300 hover:opacity-90 ${
                        activeTutorialStep === 7 ? "stroke-[#3B82F6] stroke-2 drop-shadow-[0_0_15px_#3B82F6]" : ""
                      }`}
                      onMouseEnter={() => setHoveredZone("envelope")}
                      onMouseLeave={() => setHoveredZone(null)}
                    />
                    </g>

                    {/* Base Glow Halo */}
                    <circle 
                      cx={tipX + 20} cy={tipY} r="25" 
                      fill={ratio > 0.55 ? "rgba(59, 130, 246, 0.4)" : "rgba(59, 130, 246, 0.25)"}
                      style={{ filter: "blur(15px)", mixBlendMode: "screen" }}
                    />

                    {/* ACETYLENE FEATHER (Visible in Carburizing ratio <= 0.5) */}
                    {showFeather && params.feather > 2 && (
                      <motion.path
                        d={`M ${tipX + 20} ${tipY} 
                            C ${tipX + 20 + params.coneLen + params.feather * 0.4} ${tipY - params.coneWidth * 0.95}, ${tipX + 20 + params.coneLen + params.feather * 0.9} ${tipY - params.coneWidth * 0.55}, ${tipX + 20 + params.coneLen + params.feather} ${tipY}
                            C ${tipX + 20 + params.coneLen + params.feather * 0.9} ${tipY + params.coneWidth * 0.55}, ${tipX + 20 + params.coneLen + params.feather * 0.4} ${tipY + params.coneWidth * 0.95}, ${tipX + 20} ${tipY} Z`}
                        fill="url(#feather-grad)"
                        animate={{ 
                          opacity: [0.85, 0.95, 0.85],
                          scaleY: [1, 1.04, 0.96, 1] 
                        }}
                        transition={{ duration: 0.15, repeat: Infinity, ease: "linear" }}
                        style={{ mixBlendMode: "screen", filter: "blur(1.5px)" }}
                        className={`flame-glow-orange cursor-pointer transition-all duration-300 ${
                          activeTutorialStep === 6 ? "stroke-[#F5A623] stroke-2 drop-shadow-[0_0_15px_#F5A623]" : ""
                        }`}
                        onMouseEnter={() => setHoveredZone("feather")}
                        onMouseLeave={() => setHoveredZone(null)}
                      />
                    )}

                    {/* INNER CORE (Highly luminous cone) */}
                    <g>
                      {/* High-contrast halo for edge definition */}
                      <path
                        d={getInnerCorePath()}
                        fill="#FFFFFF"
                        filter="url(#cone-halo)"
                        opacity="0.6"
                        className="pointer-events-none"
                      />
                      
                      {/* Main Core Body - removed blurring core-glow filter to keep the edge of the inner cone perfectly sharp */}
                      <g>
                        <motion.path
                          d={getInnerCorePath()}
                          fill={ratio < 0.45 ? "url(#core-grad-carburizing)" : ratio > 0.55 ? "url(#core-grad-oxidizing)" : "url(#core-grad-neutral)"}
                          filter="url(#coreFlicker)"
                          animate={{ 
                            opacity: [params.coreOpacity, params.coreOpacity - 0.02, params.coreOpacity],
                            scaleX: [1, 1.003, 1]
                          }}
                          transition={{ duration: 0.1, repeat: Infinity }}
                          style={{ mixBlendMode: "plus-lighter" }}
                          className={`flame-glow-white cursor-pointer transition-all duration-300 hover:scale-105 origin-left ${
                            activeTutorialStep === 5 ? "stroke-[#FFF] stroke-2 drop-shadow-[0_0_15px_#FFF] scale-105" : ""
                          }`}
                          onMouseEnter={() => setHoveredZone("inner")}
                          onMouseLeave={() => setHoveredZone(null)}
                        />
                      </g>
                    </g>

                    {/* COMBUSTION PARTICLES (SPARKS) */}
                    <Sparks 
                      baseX={tipX + 20 + params.coneLen} 
                      baseY={tipY} 
                      intensity={lit ? (ratio > 0.6 ? 0.8 : 0.3) : 0} 
                    />
                  </g>
                )}

                {/* VISUAL INTERACTIVE DRAG-AND-DROP HANDLES */}
                {!isPureAcetylene && (
                  <g>
                    {/* 1. Inner Cone Handle */}
                    <g 
                      className={`${activeTutorialStep === 8 || activeTutorialStep === 5 ? "animate-pulse" : ""} select-none`}
                      onMouseEnter={() => setHoveredZone("inner_handle")}
                      onMouseLeave={() => setHoveredZone(null)}
                    >
                      {/* Floating Text Label above the handle */}
                      <text
                        x={tipX + 20 + params.coneLen}
                        y={tipY - 18}
                        fontSize="7"
                        fill="#F5A623"
                        fontFamily="Space Grotesk, sans-serif"
                        fontWeight="bold"
                        textAnchor="middle"
                        letterSpacing="0.5"
                        className="opacity-90 select-none pointer-events-none tracking-wider font-mono bg-[#0A0A0A]"
                        opacity={hoveredZone === "inner_handle" || draggingHandle === "inner" ? "1" : "0.75"}
                      >
                        ◀ ADJUST CORE ▶
                      </text>

                      {/* Vertical indicator line */}
                      <line
                        x1={tipX + 20 + params.coneLen}
                        y1={tipY - 12}
                        x2={tipX + 20 + params.coneLen}
                        y2={tipY + 12}
                        stroke="#F5A623"
                        strokeWidth="1.2"
                        strokeDasharray="2,2"
                        opacity={draggingHandle === "inner" || activeTutorialStep === 8 || hoveredZone === "inner_handle" ? "1" : "0.5"}
                      />
                      {/* Visual Ring Grip */}
                      <circle
                        cx={tipX + 20 + params.coneLen}
                        cy={tipY}
                        r="5"
                        fill="#0D0F11"
                        stroke="#F5A623"
                        strokeWidth="1.8"
                        className={`transition-all duration-150 cursor-ew-resize ${
                          draggingHandle === "inner" ? "scale-125 fill-[#F5A623]" : "hover:scale-120 hover:stroke-white"
                        }`}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDraggingHandle("inner");
                        }}
                      />
                      {/* Inner dot for center-point visibility */}
                      <circle cx={tipX + 20 + params.coneLen} cy={tipY} r="1" fill={draggingHandle === "inner" ? "#000" : "#F5A623"} className="pointer-events-none" />
                      
                      {/* Larger invisible touch target */}
                      <circle
                        cx={tipX + 20 + params.coneLen}
                        cy={tipY}
                        r="16"
                        fill="transparent"
                        className="cursor-ew-resize"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDraggingHandle("inner");
                        }}
                      />
                    </g>

                    {/* 2. Outer Envelope Handle */}
                    <g 
                      className={`${activeTutorialStep === 8 || activeTutorialStep === 7 ? "animate-pulse" : ""} select-none`}
                      onMouseEnter={() => setHoveredZone("envelope_handle")}
                      onMouseLeave={() => setHoveredZone(null)}
                    >
                      {/* Floating Text Label above the handle */}
                      <text
                        x={tipX + 20 + params.envLen}
                        y={tipY - 28}
                        fontSize="7"
                        fill="#93C5FD"
                        fontFamily="Space Grotesk, sans-serif"
                        fontWeight="bold"
                        textAnchor="middle"
                        letterSpacing="0.5"
                        className="opacity-90 select-none pointer-events-none tracking-wider font-mono bg-[#0A0A0A]"
                        opacity={hoveredZone === "envelope_handle" || draggingHandle === "envelope" ? "1" : "0.75"}
                      >
                        ◀ ADJUST SHROUD ▶
                      </text>

                      {/* Vertical indicator line */}
                      <line
                        x1={tipX + 20 + params.envLen}
                        y1={tipY - 22}
                        x2={tipX + 20 + params.envLen}
                        y2={tipY + 22}
                        stroke="#3B82F6"
                        strokeWidth="1.2"
                        strokeDasharray="2,2"
                        opacity={draggingHandle === "envelope" || activeTutorialStep === 8 || hoveredZone === "envelope_handle" ? "1" : "0.5"}
                      />
                      {/* Visual Ring Grip */}
                      <circle
                        cx={tipX + 20 + params.envLen}
                        cy={tipY}
                        r="5"
                        fill="#0D0F11"
                        stroke="#3B82F6"
                        strokeWidth="1.8"
                        className={`transition-all duration-150 cursor-ew-resize ${
                          draggingHandle === "envelope" ? "scale-125 fill-[#3B82F6]" : "hover:scale-120 hover:stroke-white"
                        }`}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDraggingHandle("envelope");
                        }}
                      />
                      {/* Inner dot for center-point visibility */}
                      <circle cx={tipX + 20 + params.envLen} cy={tipY} r="1" fill={draggingHandle === "envelope" ? "#000" : "#3B82F6"} className="pointer-events-none" />

                      {/* Larger invisible touch target */}
                      <circle
                        cx={tipX + 20 + params.envLen}
                        cy={tipY}
                        r="16"
                        fill="transparent"
                        className="cursor-ew-resize"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDraggingHandle("envelope");
                        }}
                      />
                    </g>
                  </g>
                )}
              </motion.g>
            )}

            {/* METAL TORCH NOZZLE ASSEMBLY (Professional Brass Tip) */}
            <g className="cursor-pointer group" 
               onMouseEnter={() => setHoveredZone("nozzle")} 
               onMouseLeave={() => setHoveredZone(null)}>
              {/* Main Brass Body */}
              <rect
                x="0"
                y={tipY - 10}
                width="100"
                height="20"
                rx="2"
                fill="url(#nozzleMetal)"
                stroke="#4a260e"
                strokeWidth="1.5"
                className="transition-all duration-300 group-hover:brightness-110"
              />
              {/* Nozzle Tip Ring */}
              <rect 
                x="100" 
                y={tipY - 11} 
                width="10" 
                height="22" 
                rx="1" 
                fill="#522b11" 
                stroke="#3F1D0B" 
                strokeWidth="0.5"
              />
              
              {/* Heat glow on tip edge */}
              {lit && (
                <motion.path
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  d={`M 107,${tipY - 5.5} L 110,${tipY - 6} L 110,${tipY + 6} L 107,${tipY + 5.5} Z`}
                  fill="#EF4444"
                  filter="blur(1.5px)"
                  className="pointer-events-none"
                />
              )}
              
              {/* Nozzle opening edge */}
              <line x1="110" y1={tipY - 6} x2="110" y2={tipY + 6} stroke="#3F1D0B" strokeWidth="2" />
              
              {/* Charring / Soot on tip */}
              {lit && ratio < 0.8 && (
                <rect 
                  x="105" y={tipY - 8} width="5" height="16" 
                  fill="#000" 
                  fillOpacity={0.7 * (1 - ratio)} 
                  className="pointer-events-none"
                  filter="blur(1px)"
                />
              )}
            </g>

            {/* Workbench Surface / Reflection */}
            <rect x="0" y="240" width="1000" height="40" fill="#0D0F11" />
            <line x1="0" y1="240" x2="1000" y2="240" stroke="#1F2937" strokeWidth="0.5" />
            
            {lit && (
              <motion.rect 
                animate={{ opacity: [0.05, 0.1, 0.08] }}
                transition={{ duration: 2, repeat: Infinity }}
                x="0" y="240" width="1000" height="20" 
                fill={isPureAcetylene ? "url(#acetylene-grad)" : "url(#envelope-grad-neutral)"}
                fillOpacity="0.1"
                filter="blur(15px)"
              />
            )}

            {/* INTERACTIVE HOTSPOT HOT TEXT LABELS */}
            {lit && (
              <g className="pointer-events-none select-none">
                {/* 1. Inner Cone Label - flipped to point right so it never crops on left margin */}
                {!isPureAcetylene && (
                  <g>
                    <line
                      x1={tipX + 20 + params.coneLen / 2}
                      y1={tipY - params.coneWidth / 2}
                      x2={tipX + 20 + params.coneLen / 2 + 25}
                      y2={tipY - 55}
                      stroke={hoveredZone === "inner" ? "#F5A623" : "#475569"}
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                    <circle cx={tipX + 20 + params.coneLen / 2 + 25} cy={tipY - 55} r="2" fill="#475569" />
                    <text
                      x={tipX + 20 + params.coneLen / 2 + 30}
                      y={tipY - 51}
                      fontSize="10"
                      fill={hoveredZone === "inner" ? "#FFFFFF" : "#94A3B8"}
                      fontFamily="Space Grotesk, sans-serif"
                      fontWeight="500"
                      textAnchor="start"
                    >
                      {ratio < 0.45 
                        ? "BRIGHT INNER CORE" 
                        : ratio > 0.55 
                          ? "POINTED INNER CORE" 
                          : "ROUNDED INNER CORE"}
                    </text>
                  </g>
                )}

                {/* 2. Acetylene Feather Label (Carburizing) */}
                {!isPureAcetylene && params.feather > 5 && (
                  <g>
                    <line
                      x1={tipX + 20 + params.coneLen + params.feather * 0.5}
                      y1={tipY + params.coneWidth * 0.55}
                      x2={tipX + 20 + params.coneLen + params.feather * 0.7}
                      y2={tipY + 50}
                      stroke={hoveredZone === "feather" ? "#FFFFFF" : "#475569"}
                      strokeWidth="1"
                      strokeDasharray="2,2"
                      opacity="0.6"
                    />
                    <circle cx={tipX + 20 + params.coneLen + params.feather * 0.7} cy={tipY + 50} r="2" fill="#475569" />
                    <text
                      x={tipX + 20 + params.coneLen + params.feather * 0.7 + 5}
                      y={tipY + 54}
                      fontSize="10"
                      fill={hoveredZone === "feather" ? "#FFF" : "#94A3B8"}
                      fontFamily="Space Grotesk, sans-serif"
                      fontWeight="500"
                    >
                      ACETYLENE FEATHER
                    </text>
                  </g>
                )}

                {/* 3. Outer Envelope Label */}
                {!isPureAcetylene && (
                  <g>
                    <line
                      x1={tipX + 20 + params.envLen * 0.7}
                      y1={tipY + params.envWidth * 0.35}
                      x2={tipX + 20 + params.envLen * 0.7 + 40}
                      y2={tipY + 90}
                      stroke={hoveredZone === "envelope" ? "#7FB2D9" : "#475569"}
                      strokeWidth="1"
                      strokeDasharray="2,2"
                      opacity="0.6"
                    />
                    <circle cx={tipX + 20 + params.envLen * 0.7 + 40} cy={tipY + 90} r="2" fill="#475569" />
                    <text
                      x={tipX + 20 + params.envLen * 0.7 + 44}
                      y={tipY + 93}
                      fontSize="10"
                      fill={hoveredZone === "envelope" ? "#FFFFFF" : "#94A3B8"}
                      fontFamily="Space Grotesk, sans-serif"
                      fontWeight="500"
                    >
                      {ratio < 0.45 
                        ? "OUTER ENVELOPE (LONG)" 
                        : ratio > 0.55 
                          ? "SMALL OUTER ENVELOPE" 
                          : "OUTER ENVELOPE"}
                    </text>
                  </g>
                )}

                {/* 4. Pure Acetylene Yellow Plume Label */}
                {isPureAcetylene && (
                  <g>
                    <line x1={tipX + 140} y1={tipY - 25} x2={tipX + 140} y2={tipY - 60} stroke="#475569" strokeWidth="1" strokeDasharray="2,2" />
                    <text x={tipX + 140} y={tipY - 65} fontSize="10" fill="#FBBF24" fontFamily="Space Grotesk, sans-serif" fontWeight="500" textAnchor="middle">
                      PURE ACETYLENE (SMOKY YELLOW FLAME)
                    </text>
                  </g>
                )}
              </g>
            )}
          </svg>
        </div>

        {/* Dynamic Flame Info Tooltip Panel */}
        <div className="mt-2 min-h-[64px] rounded-xl border border-[#2D3239] bg-[#0D0F11] p-3 flex items-start gap-2.5 transition-all duration-300">
          <Info className="w-4 h-4 text-[#9AA0A6] mt-0.5 shrink-0" />
          {activeTooltip ? (
            <div>
              <div className="text-xs font-semibold text-[#EDEDE8] font-display flex items-center gap-1.5">
                {activeTooltip.title}
                <span className="text-[10px] text-emerald-400 font-mono">Interactive Zone</span>
              </div>
              <div className="text-[11px] text-[#9AA0A6] mt-0.5">{activeTooltip.desc}</div>
              <div className="text-[10px] text-[#6B7076] font-mono mt-1 italic">{activeTooltip.detail}</div>
            </div>
          ) : (
            <div className="text-[#9AA0A6] text-[11px] flex flex-col justify-center h-full">
              <span>{lit ? "💡 Point or hover over any section of the flame, or the copper torch tip, to analyze chemical, heat, and physical properties." : "🔥 Click 'Strike Spark' or open Acetylene + ignite to fire up the simulator."}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
