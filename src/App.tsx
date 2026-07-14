/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import { flameAudio } from "./utils/audio";
import { SimMode, FlameParams, PuddleState, Spark } from "./types";
import FlameCanvas from "./components/FlameCanvas";
import TorchControlPanel from "./components/TorchControlPanel";
import TorchSequenceGuide from "./components/TorchSequenceGuide";
import QuizPanel from "./components/QuizPanel";
import FlameReferenceDetails from "./components/FlameReferenceDetails";
import UserSettingsPanel from "./components/UserSettingsPanel";
import InteractiveTutorial from "./components/InteractiveTutorial";
import LandingPage from "./components/LandingPage";
import AIAssistant from "./components/AIAssistant";
import CylinderManifold from "./components/CylinderManifold";
import WeldPuddle from "./components/WeldPuddle";
import { Flame, Shield, Award, Settings, BookOpen, VolumeX, HelpCircle, LogOut } from "lucide-react";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const CARB = { feather: 110, coneLen: 18, coneWidth: 12, envLen: 230, envWidth: 46, coreColor: "#FFFFFF", coreOpacity: 0.98 };
const NEUTRAL = { feather: 0, coneLen: 26, coneWidth: 14, envLen: 165, envWidth: 34, coreColor: "#FFFFFF", coreOpacity: 0.98 };
const OXID = { feather: 0, coneLen: 11, coneWidth: 8, envLen: 95, envWidth: 20, coreColor: "#FFFFFF", coreOpacity: 0.98 };

function interpParams(ratio: number): FlameParams {
  if (ratio <= 0.5) {
    const t = ratio / 0.5;
    return {
      feather: lerp(CARB.feather, NEUTRAL.feather, t),
      coneLen: lerp(CARB.coneLen, NEUTRAL.coneLen, t),
      coneWidth: lerp(CARB.coneWidth, NEUTRAL.coneWidth, t),
      envLen: lerp(CARB.envLen, NEUTRAL.envLen, t),
      envWidth: lerp(CARB.envWidth, NEUTRAL.envWidth, t),
      coreColor: CARB.coreColor,
      coreOpacity: lerp(CARB.coreOpacity, NEUTRAL.coreOpacity, t),
    };
  }
  const t = (ratio - 0.5) / 0.5;
  return {
    feather: lerp(NEUTRAL.feather, OXID.feather, t),
    coneLen: lerp(NEUTRAL.coneLen, OXID.coneLen, t),
    coneWidth: lerp(NEUTRAL.coneWidth, OXID.coneWidth, t),
    envLen: lerp(NEUTRAL.envLen, OXID.envLen, t),
    envWidth: lerp(NEUTRAL.envWidth, OXID.envWidth, t),
    coreColor: NEUTRAL.coreColor,
    coreOpacity: lerp(NEUTRAL.coreOpacity, OXID.coreOpacity, t),
  };
}

export default function App() {
  const [showLanding, setShowLanding] = useState<boolean>(true);
  
  // --- Lab Infrastructure State ---
  const [oxyCylinderOpen, setOxyCylinderOpen] = useState(false);
  const [aceCylinderOpen, setAceCylinderOpen] = useState(false);
  const [oxyRegulatorPSI, setOxyRegulatorPSI] = useState(0);
  const [aceRegulatorPSI, setAceRegulatorPSI] = useState(0);
  
  // Torch Valves (Needle Valves)
  const [oxyTorchValve, setOxyTorchValve] = useState(0); // 0 to 100%
  const [aceTorchValve, setAceTorchValve] = useState(0); // 0 to 100%

  const [lit, setLit] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [sparking, setSparking] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<SimMode>("interactive");
  const [showFeather, setShowFeather] = useState<boolean>(true);
  const [activeTutorialStep, setActiveTutorialStep] = useState<number | null>(null);
  const [systemError, setSystemError] = useState("");

  // --- Metallurgical Simulation State ---
  const [distanceToWorkpiece, setDistanceToWorkpiece] = useState(6.0);
  const [torchOffset, setTorchOffset] = useState(50);
  const [puddleTemperature, setPuddleTemperature] = useState(25);
  const [puddleState, setPuddleState] = useState<PuddleState>("cold");
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [sootLevel, setSootLevel] = useState(0);
  const [oxideLevel, setOxideLevel] = useState(0);

  // Computed Gas Flows
  const c2h2Flow = useMemo(() => {
    if (!aceCylinderOpen) return 0;
    return (aceRegulatorPSI / 15) * (aceTorchValve / 10);
  }, [aceCylinderOpen, aceRegulatorPSI, aceTorchValve]);

  const o2Flow = useMemo(() => {
    if (!oxyCylinderOpen) return 0;
    return (oxyRegulatorPSI / 40) * (oxyTorchValve / 10);
  }, [oxyCylinderOpen, oxyRegulatorPSI, oxyTorchValve]);

  // Dynamic calculated ratio: O2 / (O2 + C2H2)
  const ratio = useMemo(() => {
    const total = o2Flow + c2h2Flow;
    if (total === 0) return 0.5;
    return o2Flow / total;
  }, [o2Flow, c2h2Flow]);

  const params = useMemo(() => interpParams(ratio), [ratio]);

  // Cylinder state linking: closing a cylinder drops regulator output to 0
  useEffect(() => {
    if (!aceCylinderOpen) {
      setAceRegulatorPSI(0);
    }
  }, [aceCylinderOpen]);

  useEffect(() => {
    if (!oxyCylinderOpen) {
      setOxyRegulatorPSI(0);
    }
  }, [oxyCylinderOpen]);

  // Handle direct ratio input
  const handleSetRatioDirect = (newRatio: number) => {
    // If they drag the flame handle, we adjust valves assuming regulators are at nominal working pressure (30 & 5)
    const nominalOxy = 30;
    const nominalAce = 5;
    
    // Total intensity factor
    const intensity = 1.0; 
    
    // We want ratio = o2 / (o2 + ace)
    // ratio * o2 + ratio * ace = o2
    // ratio * ace = o2 * (1 - ratio)
    // ace = o2 * (1 - ratio) / ratio
    
    // Let's just solve for a target total flow of 10
    const targetO2 = newRatio * 10;
    const targetAce = (1 - newRatio) * 10;
    
    // Set valves to match if regulators are open
    if (oxyRegulatorPSI > 0) setOxyTorchValve((targetO2 / (oxyRegulatorPSI / 40)) * 10);
    if (aceRegulatorPSI > 0) setAceTorchValve((targetAce / (aceRegulatorPSI / 15)) * 10);
  };

  const handleSetRatioPreset = (preset: "acetylene" | "carburizing" | "neutral" | "oxidizing") => {
    // Ensure cylinders and regulators are set to safe working pressures
    setOxyCylinderOpen(true);
    setAceCylinderOpen(true);
    setOxyRegulatorPSI(30);
    setAceRegulatorPSI(5);
    setLit(true);

    switch (preset) {
      case "acetylene":
        setAceTorchValve(100);
        setOxyTorchValve(0);
        break;
      case "carburizing":
        setAceTorchValve(100);
        setOxyTorchValve(21);
        break;
      case "neutral":
        setAceTorchValve(90);
        setOxyTorchValve(40);
        break;
      case "oxidizing":
        setAceTorchValve(90);
        setOxyTorchValve(80);
        break;
    }
  };

  // Spark Action
  const handleStrikeSpark = () => {
    setSparking(true);
    if (c2h2Flow > 0.5) {
      if (o2Flow > 3.0) {
        flameAudio.playPop(300, 0.9);
        setSystemError("Excess oxygen blew out the spark! Light pure acetylene first.");
      } else {
        setLit(true);
        setSystemError("");
      }
    } else {
      setSystemError("Ignition Failed! Open the acetylene valve first.");
    }
    setTimeout(() => setSparking(false), 450);
  };

  // Normal Shutdown Sequence / Extinguish
  const handleExtinguish = () => {
    setLit(false);
    setAceTorchValve(0);
    setOxyTorchValve(0);
  };

  // --- Real-time Thermal Physics Loop ---
  useEffect(() => {
    let animationFrame: number;
    const updatePhysics = () => {
      if (!lit) {
        setPuddleTemperature((prev) => Math.max(25, prev - 3));
        setPuddleState("cold");
      } else {
        // Safety: If acetylene is cut off, flame extinguishes immediately
        if (c2h2Flow < 0.15) {
          setLit(false);
          flameAudio.playExtinguish(isMuted);
          return;
        }

        // Distance efficiency factor
        const distError = Math.abs(distanceToWorkpiece - 2.5);
        const heatEfficiency = Math.max(0.1, 1 - distError / 10);

        // Heat input based on flow and ratio
        const totalHeatInput = (c2h2Flow * 120 + o2Flow * 80);
        // Realistic flame temperature curve depending on oxygen-to-acetylene mixture ratio
        let baseTargetMax = 25;
        if (ratio === 0) {
          baseTargetMax = 800; // Cool smoky pure acetylene flame
        } else if (ratio < 0.35) {
          // Severely carburizing
          const t = ratio / 0.35;
          baseTargetMax = 800 + t * 500; // 800 to 1300°C
        } else if (ratio < 0.45) {
          // Carburizing
          const t = (ratio - 0.35) / 0.10;
          baseTargetMax = 1300 + t * 500; // 1300 to 1800°C
        } else if (ratio >= 0.45 && ratio <= 0.55) {
          // Neutral peak (3150°C)
          const distFromPeak = Math.abs(ratio - 0.5);
          baseTargetMax = 3150 - (distFromPeak * 10) * 1350; // drops off if not exactly neutral
        } else if (ratio <= 0.70) {
          // Oxidizing
          const t = (ratio - 0.55) / 0.15;
          baseTargetMax = 3150 - t * 1150; // 3150 down to 2000°C
        } else {
          // Extreme oxygen cooling
          const t = Math.min(1, (ratio - 0.70) / 0.30);
          baseTargetMax = 2000 - t * 1500; // down to 500°C
        }

        // Temperature ceiling drops off with distance (at 12mm, max temperature is ~20% of base)
        const maxTempFactor = Math.max(0.15, 1 - distError / 12);
        const targetMaxTemp = Math.round(baseTargetMax * maxTempFactor);
        const effectiveHeat = totalHeatInput * heatEfficiency;

        setPuddleTemperature((prev) => {
          const tempDiff = targetMaxTemp - prev;
          if (tempDiff > 0) {
            // Smooth thermal inertia (takes a few seconds to fully heat up)
            const heatingRate = Math.min(12, 1 + effectiveHeat * 0.003);
            return Math.min(targetMaxTemp, prev + heatingRate);
          } else if (tempDiff < 0) {
            // Smooth cooling down
            const coolingRate = Math.min(15, 2 + Math.abs(tempDiff) * 0.03);
            return Math.max(targetMaxTemp, prev - coolingRate);
          }
          return prev;
        });

        // Metallurgy
        if (puddleTemperature > 1400) {
          if (ratio < 0.45) {
            setPuddleState("soot-covered");
            setSootLevel((prev) => Math.min(100, prev + 0.5));
          } else if (ratio > 0.55) {
            setPuddleState("oxidized");
            setOxideLevel((prev) => Math.min(100, prev + 0.8));
            if (Math.random() < 0.2) {
              setSparks((prev) => [
                ...prev,
                { id: Math.random(), x: torchOffset, y: 35, vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 8 - 2, life: 1.0 }
              ]);
            }
          } else {
            setPuddleState("molten");
            setSootLevel((prev) => Math.max(0, prev - 0.5));
            setOxideLevel((prev) => Math.max(0, prev - 0.4));
          }
        } else if (puddleTemperature > 600) {
          setPuddleState("red-hot");
        }
      }

      // Sparks physics
      setSparks((old) => old.map(s => ({ ...s, x: s.x + s.vx * 0.1, y: s.y + s.vy * 0.1, vy: s.vy + 0.4, life: s.life - 0.03 })).filter(s => s.life > 0));

      // Safety: Backfire
      if (lit && (distanceToWorkpiece < 0.8 || (c2h2Flow + o2Flow < 1.0 && Math.random() < 0.02))) {
        setLit(false);
        flameAudio.playPop(90, 1.0);
        setSystemError("TORCH BACKFIRE! The tip touched the molten pool or gas velocity was too low.");
      }

      animationFrame = requestAnimationFrame(updatePhysics);
    };

    animationFrame = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animationFrame);
  }, [lit, c2h2Flow, o2Flow, ratio, distanceToWorkpiece, puddleTemperature, torchOffset, isMuted]);

  // Audio syncer
  useEffect(() => {
    flameAudio.setLit(lit);
    flameAudio.setMute(isMuted);
    flameAudio.updateFlame(c2h2Flow, o2Flow, ratio);
  }, [lit, isMuted, c2h2Flow, o2Flow, ratio]);

  if (showLanding) {
    return <LandingPage onStart={() => setShowLanding(false)} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0B0D0F] text-[#EDEDE8] font-sans selection:bg-[#F5A623] selection:text-black relative overflow-x-hidden">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.5)_100%)] z-0 opacity-40" />
      
      {/* MAIN LAYOUT WRAPPER */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 py-6 md:px-6 flex flex-col gap-6">

        {/* HEADER / NAVIGATION BENTO CARD */}
        <header className="rounded-2xl border border-[#2D3239] bg-[#16191D] p-6 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-[#2A2114] p-3 border border-amber-900/30">
              <Flame className="w-6 h-6 text-[#F5A623] animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.3em] text-[#F5A623] font-mono font-bold uppercase">THERMODYNAMICS & METALLURGY SUITE</div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#EDEDE8] font-display mt-0.5">
                Oxy-Acetylene <span className="text-[#F5A623]">Combustion Lab</span>
              </h1>
              <div className="text-[10px] font-mono text-[#9AA0A6] mt-1">
                FLAME DYNAMICS & INDUSTRIAL GAS WELDING SIMULATOR
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Guided Walkthrough Trigger */}
            <button
              onClick={() => {
                setActiveMode("interactive");
                setActiveTutorialStep(1);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[#2A2114] border border-amber-500/30 px-4 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-950/40 hover:border-amber-400 transition-all cursor-pointer shadow-lg shadow-amber-950/20"
            >
              <HelpCircle className="w-4 h-4 animate-bounce text-amber-400" />
              GUIDED WALKTHROUGH
            </button>

            {/* Tab Selection */}
            <nav className="flex gap-1.5 bg-[#0D0F11] p-1 rounded-xl border border-[#2D3239]">
            <button
              onClick={() => setActiveMode("interactive")}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium font-display transition-all duration-150 cursor-pointer ${
                activeMode === "interactive"
                  ? "bg-[#2D3239] text-[#EDEDE8] shadow"
                  : "text-[#9AA0A6] hover:text-[#EDEDE8]"
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-blue-400" />
              Interactive Lab
            </button>
            <button
              onClick={() => setActiveMode("sequence")}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium font-display transition-all duration-150 cursor-pointer ${
                activeMode === "sequence"
                  ? "bg-[#2D3239] text-[#EDEDE8] shadow"
                  : "text-[#9AA0A6] hover:text-[#EDEDE8]"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Safety Guide
            </button>
            <button
              onClick={() => setActiveMode("quiz")}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium font-display transition-all duration-150 cursor-pointer ${
                activeMode === "quiz"
                  ? "bg-[#2D3239] text-[#EDEDE8] shadow"
                  : "text-[#9AA0A6] hover:text-[#EDEDE8]"
              }`}
            >
              <Award className="w-3.5 h-3.5 text-yellow-400" />
              Review Quiz
            </button>
          </nav>

          <button 
            onClick={() => setShowLanding(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all cursor-pointer group"
            title="Return to Landing Page"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-[11px] font-bold font-display hidden sm:inline uppercase tracking-wider">Exit Lab</span>
          </button>
          </div>
        </header>

        {/* GUIDED TUTORIAL CONTAINER */}
        {activeTutorialStep !== null && (
          <InteractiveTutorial
            currentStep={activeTutorialStep}
            onStepChange={setActiveTutorialStep}
            ratio={ratio}
            onSetRatioPreset={handleSetRatioPreset}
            onSetRatioDirect={handleSetRatioDirect}
            lit={lit}
            setLit={setLit}
          />
        )}

        {/* BENTO GRID COLUMNS */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT BENTO RAIL: THE SIMULATION & CONTROLS (Takes 7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Flame Canvas Box */}
            <section className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-mono text-[#6B7076] uppercase tracking-widest">
                  Real-Time Flame Rendering Stage
                </span>
                {isMuted && lit && (
                  <button 
                    onClick={() => setIsMuted(false)}
                    className="text-[10px] font-mono text-[#F5A623] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <VolumeX className="w-3 h-3" />
                    Turn on sound to hear flame hiss
                  </button>
                )}
              </div>
              <FlameCanvas
                lit={lit}
                c2h2Flow={c2h2Flow}
                o2Flow={o2Flow}
                ratio={ratio}
                params={params}
                sparking={sparking}
                onRatioChange={handleSetRatioDirect}
                showFeather={showFeather}
                activeTutorialStep={activeTutorialStep}
              />
            </section>

            {/* Cylinder & Regulator Manifold */}
            <section className="flex flex-col gap-2.5">
              <span className="text-[10px] font-mono text-[#6B7076] uppercase tracking-widest px-1">
                Gas Infrastructure (Cylinders & Regulators)
              </span>
              <CylinderManifold
                oxyCylinderOpen={oxyCylinderOpen}
                setOxyCylinderOpen={setOxyCylinderOpen}
                aceCylinderOpen={aceCylinderOpen}
                setAceCylinderOpen={setAceCylinderOpen}
                oxyRegulatorPSI={oxyRegulatorPSI}
                setOxyRegulatorPSI={setOxyRegulatorPSI}
                aceRegulatorPSI={aceRegulatorPSI}
                setAceRegulatorPSI={setAceRegulatorPSI}
                showBlastWarning={aceRegulatorPSI > 15}
              />
            </section>

            {/* Control Valves & Presets Box */}
            <section className="flex flex-col gap-2.5">
              <span className="text-[10px] font-mono text-[#6B7076] uppercase tracking-widest px-1">
                Torch Mixing Chamber & Needle Valves
              </span>
              <TorchControlPanel
                oxyTorchValve={oxyTorchValve}
                setOxyTorchValve={setOxyTorchValve}
                aceTorchValve={aceTorchValve}
                setAceTorchValve={setAceTorchValve}
                c2h2Flow={c2h2Flow}
                o2Flow={o2Flow}
                lit={lit}
                setLit={setLit}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                onSpark={handleStrikeSpark}
                onExtinguish={handleExtinguish}
                ratio={ratio}
                setRatioDirect={handleSetRatioDirect}
                onSetRatioPreset={handleSetRatioPreset}
                activeTutorialStep={activeTutorialStep}
              />
            </section>
          </div>

          {/* RIGHT BENTO RAIL: DYNAMIC SECTIONS & REFERENCE INFO (Takes 5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* System Messages */}
            {systemError && (
              <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-4 flex gap-3 text-amber-200 text-xs font-mono animate-pulse shadow-lg">
                <HelpCircle className="w-5 h-5 shrink-0" />
                <span>{systemError}</span>
              </div>
            )}

            {/* Weld Puddle Physics */}
            <section className="flex flex-col gap-2.5">
              <span className="text-[10px] font-mono text-[#6B7076] uppercase tracking-widest px-1">
                Metallurgical Interaction Sandbox
              </span>
              <WeldPuddle
                puddleTemperature={puddleTemperature}
                puddleState={puddleState}
                torchOffset={torchOffset}
                setTorchOffset={setTorchOffset}
                distanceToWorkpiece={distanceToWorkpiece}
                setDistanceToWorkpiece={setDistanceToWorkpiece}
                sootLevel={sootLevel}
                oxideLevel={oxideLevel}
                sparks={sparks}
                lit={lit}
                ratio={ratio}
                c2h2Flow={c2h2Flow}
                o2Flow={o2Flow}
              />
            </section>
            
            {/* Dynamic Switch based on Active Navigation Header */}
            <section className="transition-all duration-200">
              {activeMode === "interactive" && (
                <div className="flex flex-col gap-6">
                  <FlameReferenceDetails />
                  <UserSettingsPanel
                    showFeather={showFeather}
                    setShowFeather={setShowFeather}
                  />
                </div>
              )}

              {activeMode === "sequence" && (
                <TorchSequenceGuide
                  c2h2Flow={c2h2Flow}
                  o2Flow={o2Flow}
                  lit={lit}
                  onSpark={handleStrikeSpark}
                  onExtinguish={handleExtinguish}
                  setOxyCylinderOpen={setOxyCylinderOpen}
                  setAceCylinderOpen={setAceCylinderOpen}
                  setOxyRegulatorPSI={setOxyRegulatorPSI}
                  setAceRegulatorPSI={setAceRegulatorPSI}
                  setAceTorchValve={setAceTorchValve}
                  setOxyTorchValve={setOxyTorchValve}
                  setLit={setLit}
                />
              )}

              {activeMode === "quiz" && (
                <QuizPanel onSetRatioPreset={handleSetRatioPreset} />
              )}
            </section>

            {/* ACCESSIBLE TECHNICAL TIP CORNER */}
            <div className="rounded-2xl border border-[#2D3239] bg-[#16191D] p-5 flex gap-4 items-start shadow-xl">
              <div className="p-2.5 rounded-xl bg-[#192735]/20 border border-blue-900/20 shrink-0">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-[#EDEDE8] font-display font-bold text-xs">Instructor Note · Gas Welding Safety</h4>
                <p className="text-[10px] text-[#9AA0A6] mt-1.5 leading-relaxed">
                  In actual welding practice, cylinders are pressurized up to **2200 psi (Oxygen)** and **250 psi (Acetylene)**. Regulators drop this to working pressures of **5 to 10 psi**. Safety is paramount! Never allow grease/oil near Oxygen valves as it can spontaneously ignite in high-pressure pure oxygen environments.
                </p>
              </div>
            </div>

          </div>

        </main>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#2D3239] bg-[#0A0D10]/40 px-6 py-5 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[10px] font-mono text-[#6B7076] text-center sm:text-left">
          <div>
            © 2026 Oxy-Acetylene Combustion Lab • High-Fidelity Gas Dynamics & Metallurgy Suite
          </div>
          <div>
            Built with React 19 & Tailwind CSS v4 • Web Audio Procedural Synthesis
          </div>
        </div>
      </footer>

      <AIAssistant
        lit={lit}
        oxyCylinderOpen={oxyCylinderOpen}
        aceCylinderOpen={aceCylinderOpen}
        oxyRegulatorPSI={oxyRegulatorPSI}
        aceRegulatorPSI={aceRegulatorPSI}
        oxyTorchValve={oxyTorchValve}
        aceTorchValve={aceTorchValve}
        o2Flow={o2Flow}
        c2h2Flow={c2h2Flow}
        ratio={ratio}
        distanceToWorkpiece={distanceToWorkpiece}
        puddleTemperature={puddleTemperature}
        puddleState={puddleState}
        sootLevel={sootLevel}
        oxideLevel={oxideLevel}
      />
    </div>
  );
}
