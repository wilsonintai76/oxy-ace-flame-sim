/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { 
  Flame, 
  BookOpen, 
  Target, 
  Settings, 
  ChevronRight, 
  Zap, 
  ShieldAlert,
  ArrowRight
} from "lucide-react";

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0B0D0F] text-[#EDEDE8] font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono tracking-widest uppercase mb-6">
            <Zap className="w-3 h-3" />
            FLAME DYNAMICS & INDUSTRIAL GAS WELDING SIMULATOR
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-[#9AA0A6]">
            Oxy-Acetylene <br /> 
            <span className="text-emerald-400">Combustion Lab</span>
          </h1>
          <p className="text-base md:text-lg text-[#9AA0A6] max-w-2xl mx-auto leading-relaxed">
            Master the thermodynamics and metallurgy of gas welding through interactive chemical analysis. 
            Calibrate gas flow ratios to achieve Neutral, Carburizing, and Oxidizing states in a high-fidelity virtual simulation environment.
          </p>
        </motion.div>

        {/* Action Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          onClick={onStart}
          className="group relative flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-display font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] mb-20 cursor-pointer"
        >
          ENTER SIMULATION
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <div className="absolute inset-0 rounded-2xl border-2 border-white/20 animate-pulse-slow" />
        </motion.button>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* Learning Objectives */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 rounded-3xl border border-[#2D3239] bg-[#16191D]/50 backdrop-blur-md p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-xl font-display font-bold">Learning Objectives</h2>
            </div>
            
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "Flame Morphology", desc: "Identify the Inner Cone, Acetylene Feather, and Outer Envelope." },
                { title: "Molar Ratios", desc: "Understand how O₂:C₂H₂ volume affects combustion chemistry." },
                { title: "Metallurgical Sync", desc: "Match flame types to specific materials like Mild Steel and Cast Iron." },
                { title: "Temperature Profile", desc: "Analyze thermal distribution across primary and secondary zones." }
              ].map((item, i) => (
                <li key={i} className="flex gap-3 group">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-0.5">{item.title}</h3>
                    <p className="text-xs text-[#9AA0A6] leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Quick Guide */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-[#2D3239] bg-[#16191D]/50 backdrop-blur-md p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-display font-bold">Quick Start</h2>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <span className="w-6 h-6 rounded-lg bg-[#2D3239] flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                <p className="text-xs text-[#9AA0A6] leading-relaxed">
                  Open the <span className="text-red-400">Acetylene valve</span> to 4.5 units and trigger the Piezo Spark.
                </p>
              </div>
              <div className="flex gap-4 items-start">
                <span className="w-6 h-6 rounded-lg bg-[#2D3239] flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                <p className="text-xs text-[#9AA0A6] leading-relaxed">
                  Gradually introduce <span className="text-blue-400">Oxygen</span> until the whitish feather disappears for a Neutral flame.
                </p>
              </div>
              <div className="flex gap-4 items-start">
                <span className="w-6 h-6 rounded-lg bg-[#2D3239] flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                <p className="text-xs text-[#9AA0A6] leading-relaxed">
                  Hover over the flame zones to inspect chemical properties and temperatures.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Safety Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-500/5 border border-amber-500/10"
        >
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <p className="text-[10px] font-mono text-amber-500/80 tracking-wide">
            SIMULATION NOTE: THIS TOOL EMULATES CHEMICAL THERMODYNAMICS. ALWAYS WEAR GRADE 5 FILTER LENSES IN PHYSICAL LABS.
          </p>
        </motion.div>

        {/* Footer */}
        <footer className="mt-20 text-[10px] font-mono text-[#4B5563] flex flex-col items-center gap-2">
          <p>© 2026 OXY-SYNC EDUCATIONAL PLATFORM</p>
          <div className="flex gap-4">
            <span className="hover:text-[#6B7076] cursor-pointer">LMS MODULE: WELD-101</span>
            <span className="hover:text-[#6B7076] cursor-pointer">DOCUMENTATION</span>
            <span className="hover:text-[#6B7076] cursor-pointer">SCORM v1.2 READY</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
