/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Shield, Cpu, RefreshCw, AlertTriangle, 
  CheckCircle, Flame, FileText, ChevronRight, HelpCircle, 
  X, Loader2, Gauge, Award, BookOpen, ChevronDown, Check
} from "lucide-react";

interface AIAssistantProps {
  lit: boolean;
  oxyCylinderOpen: boolean;
  aceCylinderOpen: boolean;
  oxyRegulatorPSI: number;
  aceRegulatorPSI: number;
  oxyTorchValve: number;
  aceTorchValve: number;
  o2Flow: number;
  c2h2Flow: number;
  ratio: number;
  distanceToWorkpiece: number;
  puddleTemperature: number;
  puddleState: string;
  sootLevel: number;
  oxideLevel: number;
}

interface SavedAudit {
  id: string;
  timestamp: string;
  flameType: string;
  grade: string;
  ratio: number;
  puddleState: string;
  queryType: string;
  report: string;
}

export default function AIAssistant({
  lit,
  oxyCylinderOpen,
  aceCylinderOpen,
  oxyRegulatorPSI,
  aceRegulatorPSI,
  oxyTorchValve,
  aceTorchValve,
  o2Flow,
  c2h2Flow,
  ratio,
  distanceToWorkpiece,
  puddleTemperature,
  puddleState,
  sootLevel,
  oxideLevel,
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadStage, setLoadStage] = useState(0);
  const [activeTab, setActiveTab] = useState<"analysis" | "history">("analysis");
  
  // Results states
  const [currentReport, setCurrentReport] = useState<string | null>(null);
  const [activeQueryType, setActiveQueryType] = useState<string | null>(null);
  const [savedAudits, setSavedAudits] = useState<SavedAudit[]>([]);

  const reportContainerRef = useRef<HTMLDivElement>(null);

  // --- Session Tracking for Post-Weld Process Audit ---
  const [isWeldActive, setIsWeldActive] = useState(false);
  const [hasNewReportAlert, setHasNewReportAlert] = useState(false);
  
  const activeSessionRef = useRef({
    startTime: 0,
    duration: 0,
    maxTemp: 0,
    totalDistance: 0,
    distanceTicks: 0,
    flameCounts: {
      "Pure Acetylene": 0,
      "Carburizing": 0,
      "Neutral (Ideal)": 0,
      "Oxidizing": 0,
      "Unignited Gas": 0
    },
    peakSoot: 0,
    peakOxide: 0,
    puddleStates: new Set<string>()
  });

  const [lastWeldSummary, setLastWeldSummary] = useState<{
    duration: number;
    maxTemp: number;
    avgDistance: number;
    flameCounts: Record<string, number>;
    peakSoot: number;
    peakOxide: number;
    puddleStates: string[];
    grade: string;
    score: number;
    dominantFlame: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem("oxy_last_weld_summary");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Load saved audits from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("oxy_metallurgy_audits");
      if (stored) {
        setSavedAudits(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load audits:", e);
    }
  }, []);

  // Classify current flame based on ratio and lit status
  const getFlameClass = () => {
    if (!lit) return { name: "Unignited Gas", color: "text-[#6B7076]", bg: "bg-[#16191D]", border: "border-[#2D3239]" };
    if (ratio === 0) return { name: "Pure Acetylene", color: "text-[#F5A623]", bg: "bg-amber-950/10", border: "border-amber-900/30" };
    if (ratio < 0.45) return { name: "Carburizing", color: "text-[#F5A623]", bg: "bg-amber-950/10", border: "border-amber-900/30" };
    if (ratio >= 0.45 && ratio <= 0.55) return { name: "Neutral (Ideal)", color: "text-emerald-400", bg: "bg-emerald-950/10", border: "border-emerald-900/30" };
    return { name: "Oxidizing", color: "text-[#7FB2D9]", bg: "bg-[#192735]", border: "border-indigo-900/40" };
  };

  const flameClass = getFlameClass();

  // Dynamic heuristic calculation for grade & scores to render live indicators
  const calculateHeuristicGrade = () => {
    if (!lit) return { score: 0, grade: "N/A", text: "No Combustion", color: "text-gray-500" };
    
    let score = 100;
    
    // Flame ratio impact
    if (ratio < 0.45) {
      // Carburizing
      const diff = 0.5 - ratio;
      score -= diff * 150; // lower ratio = lower score
    } else if (ratio > 0.55) {
      // Oxidizing
      const diff = ratio - 0.5;
      score -= diff * 180;
    }
    
    // Contaminants penalty
    score -= sootLevel * 0.4;
    score -= oxideLevel * 0.5;
    
    // Distance penalty (optimal distance is around 5.0 - 7.0mm)
    const distDiff = Math.abs(distanceToWorkpiece - 6.0);
    if (distDiff > 1.5) {
      score -= (distDiff - 1.5) * 8;
    }

    score = Math.max(10, Math.min(100, Math.round(score)));

    let grade = "A";
    let color = "text-emerald-400";
    if (score >= 90) { grade = "A"; color = "text-emerald-400"; }
    else if (score >= 80) { grade = "B"; color = "text-blue-400"; }
    else if (score >= 70) { grade = "C"; color = "text-amber-400"; }
    else if (score >= 55) { grade = "D"; color = "text-orange-400"; }
    else { grade = "F"; color = "text-red-500"; }

    return { score, grade, color, text: `${flameClass.name} State` };
  };

  const telemetry = calculateHeuristicGrade();

  // Track session details in real-time when lit is active
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (lit) {
      if (!isWeldActive) {
        setIsWeldActive(true);
        setHasNewReportAlert(false);
        activeSessionRef.current = {
          startTime: Date.now(),
          duration: 0,
          maxTemp: puddleTemperature,
          totalDistance: distanceToWorkpiece,
          distanceTicks: 1,
          flameCounts: {
            "Pure Acetylene": 0,
            "Carburizing": 0,
            "Neutral (Ideal)": 0,
            "Oxidizing": 0,
            "Unignited Gas": 0
          },
          peakSoot: sootLevel,
          peakOxide: oxideLevel,
          puddleStates: new Set<string>([puddleState])
        };
        const initialFlame = getFlameClass().name;
        if (initialFlame in activeSessionRef.current.flameCounts) {
          activeSessionRef.current.flameCounts[initialFlame as keyof typeof activeSessionRef.current.flameCounts] = 1;
        }
      } else {
        interval = setInterval(() => {
          const current = activeSessionRef.current;
          current.duration += 1;
          current.maxTemp = Math.max(current.maxTemp, puddleTemperature);
          current.totalDistance += distanceToWorkpiece;
          current.distanceTicks += 1;
          current.peakSoot = Math.max(current.peakSoot, sootLevel);
          current.peakOxide = Math.max(current.peakOxide, oxideLevel);
          current.puddleStates.add(puddleState);
          
          const currentFlame = getFlameClass().name;
          if (currentFlame in current.flameCounts) {
            current.flameCounts[currentFlame as keyof typeof current.flameCounts] += 1;
          }
        }, 1000);
      }
    } else {
      if (isWeldActive) {
        setIsWeldActive(false);
        const finalSession = activeSessionRef.current;
        
        // Ensure they were actually welding for at least 3 seconds
        if (finalSession.duration >= 3) {
          const avgDistance = finalSession.distanceTicks > 0 
            ? finalSession.totalDistance / finalSession.distanceTicks 
            : 6.0;

          let dominantFlame = "Neutral (Ideal)";
          let maxCount = -1;
          Object.entries(finalSession.flameCounts).forEach(([flame, count]) => {
            const numCount = count as number;
            if (numCount > maxCount) {
              maxCount = numCount;
              dominantFlame = flame;
            }
          });

          // Compute custom quality grade
          let score = 100;
          const totalTicks = finalSession.duration;
          const neutralPct = totalTicks > 0 ? (finalSession.flameCounts["Neutral (Ideal)"] / totalTicks) : 0;
          if (neutralPct < 0.8) {
            score -= (1 - neutralPct) * 45;
          }
          score -= finalSession.peakSoot * 0.35;
          score -= finalSession.peakOxide * 0.45;
          
          const distDiff = Math.abs(avgDistance - 6.0);
          if (distDiff > 1.5) {
            score -= (distDiff - 1.5) * 12;
          }
          
          score = Math.max(15, Math.min(100, Math.round(score)));
          let grade = "A";
          if (score >= 90) grade = "A";
          else if (score >= 80) grade = "B";
          else if (score >= 70) grade = "C";
          else if (score >= 55) grade = "D";
          else grade = "F";

          const summary = {
            duration: finalSession.duration,
            maxTemp: Math.round(finalSession.maxTemp),
            avgDistance: parseFloat(avgDistance.toFixed(1)),
            flameCounts: finalSession.flameCounts,
            peakSoot: parseFloat(finalSession.peakSoot.toFixed(1)),
            peakOxide: parseFloat(finalSession.peakOxide.toFixed(1)),
            puddleStates: Array.from(finalSession.puddleStates),
            grade,
            score,
            dominantFlame
          };

          setLastWeldSummary(summary);
          localStorage.setItem("oxy_last_weld_summary", JSON.stringify(summary));
          
          // Pop open and notify!
          setIsOpen(true);
          setHasNewReportAlert(true);
          setActiveTab("analysis");
        }
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lit, puddleTemperature, distanceToWorkpiece, sootLevel, oxideLevel, puddleState, isWeldActive]);

  // Rotating loading steps to keep student engaged with engineering jargon
  const loadingStages = [
    "🧬 Scanning torch gas ratios and pressure valves...",
    "⚡ Calculating dissociation kinetics and flame enthalpy...",
    "🔬 Simulating weld puddle thermal profile and grain HAZ...",
    "📝 Compiling metallurgical assessment report..."
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setInterval(() => {
        setLoadStage(prev => {
          if (prev < loadingStages.length - 1) return prev + 1;
          return prev;
        });
      }, 700);
    } else {
      setLoadStage(0);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  // Handle calling the API
  const runAudit = async (queryType: "full_audit" | "equations" | "carbon_steel" | "stainless" | "troubleshooting") => {
    if (isLoading) return;
    setIsLoading(true);
    setCurrentReport(null);
    setActiveQueryType(queryType);

    // Build the request body matching server expectation, passing the session summary if present
    const requestData = {
      torchState: {
        lit,
        oxyCylinderOpen,
        aceCylinderOpen,
        oxyRegulatorPSI,
        aceRegulatorPSI,
        oxyTorchValve,
        aceTorchValve,
        o2Flow,
        c2h2Flow,
        ratio,
        flameType: flameClass.name
      },
      metallurgicalState: {
        distanceToWorkpiece,
        puddleTemperature,
        puddleState,
        sootLevel,
        oxideLevel
      },
      queryType,
      weldSummary: lastWeldSummary
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      if (data.text) {
        setCurrentReport(data.text);
        
        // Save to local history
        const newAudit: SavedAudit = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          flameType: lastWeldSummary ? lastWeldSummary.dominantFlame : flameClass.name,
          grade: lastWeldSummary ? lastWeldSummary.grade : telemetry.grade,
          ratio: lastWeldSummary ? lastWeldSummary.avgDistance : ratio,
          puddleState: lastWeldSummary ? lastWeldSummary.puddleStates.join(", ") : puddleState,
          queryType: queryType,
          report: data.text
        };

        const updatedHistory = [newAudit, ...savedAudits].slice(0, 15); // limit to 15 entries
        setSavedAudits(updatedHistory);
        localStorage.setItem("oxy_metallurgy_audits", JSON.stringify(updatedHistory));
      } else {
        setCurrentReport("⚠️ FAILED TO GENERATE REPORT. Please check connection and try again.");
      }
    } catch (error) {
      console.error("Audit Generation Error:", error);
      setCurrentReport("⚠️ API ERROR: Failed to communicate with metallurgical expert server.");
    } finally {
      setIsLoading(false);
      // Auto scroll down to the report
      setTimeout(() => {
        reportContainerRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const clearHistory = () => {
    setSavedAudits([]);
    localStorage.removeItem("oxy_metallurgy_audits");
  };

  // Helper function to render bold text
  const parseBold = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    if (parts.length === 1) return text;
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-white font-semibold">{part}</strong>;
      }
      return part;
    });
  };

  // Advanced LaTeX/Chemistry formula parser and formatter
  const formatLatexFormula = (raw: string): React.ReactNode => {
    let s = raw;
    // Recursively strip out \text{...}
    while (s.includes("\\text{")) {
      s = s.replace(/\\text\{([^{}]+)\}/g, "$1");
    }
    s = s
      .replace(/\\longrightarrow/g, " ⟶ ")
      .replace(/\\rightarrow/g, " ⟶ ")
      .replace(/\\to/g, " ⟶ ")
      .replace(/\\quad/g, "   ")
      .replace(/\\qquad/g, "     ")
      .replace(/\\Delta/g, "Δ")
      .replace(/\\cdot/g, "·");

    const elements: React.ReactNode[] = [];
    let index = 0;
    
    while (index < s.length) {
      const char = s[index];
      
      if (char === '_') {
        index++; // skip '_'
        if (index < s.length && s[index] === '{') {
          index++; // skip '{'
          let content = "";
          while (index < s.length && s[index] !== '}') {
            content += s[index];
            index++;
          }
          index++; // skip '}'
          elements.push(<sub key={`sub-${index}`} className="text-[0.75em] leading-none align-sub font-semibold">{content}</sub>);
        } else if (index < s.length) {
          elements.push(<sub key={`sub-${index}`} className="text-[0.75em] leading-none align-sub font-semibold">{s[index]}</sub>);
          index++;
        }
      } else if (char === '^') {
        index++; // skip '^'
        if (index < s.length && s[index] === '{') {
          index++; // skip '{'
          let content = "";
          while (index < s.length && s[index] !== '}') {
            content += s[index];
            index++;
          }
          index++; // skip '}'
          elements.push(<sup key={`sup-${index}`} className="text-[0.75em] leading-none align-super font-semibold">{content}</sup>);
        } else if (index < s.length) {
          elements.push(<sup key={`sup-${index}`} className="text-[0.75em] leading-none align-super font-semibold">{s[index]}</sup>);
          index++;
        }
      } else {
        let text = "";
        while (index < s.length && s[index] !== '_' && s[index] !== '^') {
          text += s[index];
          index++;
        }
        elements.push(<span key={`text-${index}`}>{text}</span>);
      }
    }
    
    return <span className="inline-flex items-baseline flex-wrap justify-center font-sans">{elements}</span>;
  };

  // Helper to format plain-text chemical reactions by subscribing numbers after elements
  const formatPlainChemicalEquation = (eq: string): React.ReactNode => {
    let s = eq.replace(/->/g, " ⟶ ").replace(/→/g, " ⟶ ");
    
    // We split by elements and numbers to insert sub tags
    const parts: React.ReactNode[] = [];
    const regex = /([A-Z][a-z]?)(\d+)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(s)) !== null) {
      const preceding = s.substring(lastIndex, match.index);
      if (preceding) {
        parts.push(<span key={`prec-${lastIndex}`}>{preceding}</span>);
      }
      parts.push(<span key={`elem-${match.index}`}>{match[1]}</span>);
      parts.push(<sub key={`sub-${match.index}`} className="text-[0.75em] leading-none align-sub font-semibold">{match[2]}</sub>);
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < s.length) {
      parts.push(<span key={`end-${lastIndex}`}>{s.substring(lastIndex)}</span>);
    }

    return <span className="inline-flex items-baseline flex-wrap justify-center font-sans">{parts}</span>;
  };

  // Parse a line containing both standard text and LaTeX formulas ($...$ or $$...$$)
  const parseLineWithLatex = (line: string): React.ReactNode => {
    // 1. Handle block LaTeX math $$ ... $$
    const blockParts = line.split(/\$\$(.*?)\$\$/g);
    
    return blockParts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <div key={`block-${i}`} className="my-3 p-4 bg-[#0D0F11] border border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center font-sans text-xs text-emerald-400 shadow-inner overflow-x-auto">
            <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-widest text-emerald-500/60 mb-2.5">
              <span className="animate-pulse">⚛</span> Chemical Balance Equation
            </div>
            <div className="text-xs md:text-sm font-semibold tracking-wide select-all text-center">
              {formatLatexFormula(part)}
            </div>
          </div>
        );
      }
      
      // 2. Handle inline LaTeX math $ ... $
      const inlineParts = part.split(/\$(.*?)\$/g);
      return (
        <React.Fragment key={`inline-container-${i}`}>
          {inlineParts.map((subPart, j) => {
            if (j % 2 === 1) {
              return (
                <span key={`inline-${j}`} className="inline-block px-1.5 py-0.5 bg-[#0D0F11] border border-emerald-500/10 rounded-md font-sans text-[11px] text-emerald-400 mx-1">
                  {formatLatexFormula(subPart)}
                </span>
              );
            }
            return parseBold(subPart);
          })}
        </React.Fragment>
      );
    });
  };

  const formatReport = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    
    let currentTableRows: string[][] = [];
    let isInsideTable = false;

    const pushCurrentTable = (key: string) => {
      if (currentTableRows.length > 0) {
        // Filter out separator rows (e.g. |---|---| or |:---|:---|)
        const filteredRows = currentTableRows.filter(row => {
          const joined = row.join("").trim();
          return !/^[:\-\s|]+$/.test(joined) && joined.length > 0;
        });

        if (filteredRows.length > 0) {
          // Identify if we have a table with a separator line at index 1
          const hasSeparatorLine = currentTableRows.length > 1 && /^[:\-\s|]+$/.test(currentTableRows[1].join("").trim());
          const headerRow = hasSeparatorLine ? filteredRows[0] : null;
          const bodyRows = hasSeparatorLine ? filteredRows.slice(1) : filteredRows;

          elements.push(
            <div key={`table-${key}`} className="my-4 overflow-x-auto rounded-xl border border-[#2D3239] bg-[#0D0F11]/80 shadow-md">
              <table className="w-full text-left border-collapse text-[11px]">
                {headerRow && (
                  <thead>
                    <tr className="bg-[#1C1F22] border-b border-[#2D3239]">
                      {headerRow.map((cell, idx) => (
                        <th key={`th-${idx}`} className="p-2.5 font-bold text-white uppercase tracking-wider font-mono text-[9px] border-r border-[#2D3239]/40 last:border-0 min-w-[100px]">
                          {parseLineWithLatex(cell.trim())}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {bodyRows.map((row, rIdx) => (
                    <tr key={`tr-${rIdx}`} className="border-b border-[#2D3239]/40 last:border-0 hover:bg-[#1C1F22]/30 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={`td-${cIdx}`} className="p-2.5 text-[#9AA0A6] border-r border-[#2D3239]/40 last:border-0">
                          {parseLineWithLatex(cell.trim())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        currentTableRows = [];
      }
      isInsideTable = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check if it's a markdown table row (starts and ends with |)
      if (trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.length > 1) {
        isInsideTable = true;
        const cells = line.split("|").slice(1, -1);
        currentTableRows.push(cells);
        continue;
      } else if (isInsideTable) {
        pushCurrentTable(`idx-${i}`);
      }

      if (!trimmed) {
        elements.push(<div key={`empty-${i}`} className="h-2" />);
        continue;
      }

      // Headers starting with ### or ## or #
      if (trimmed.startsWith("###") || trimmed.startsWith("##") || trimmed.startsWith("#")) {
        const headerText = trimmed.replace(/^#+\s+/, "");
        elements.push(
          <h4 key={`h-${i}`} className="text-white font-bold text-xs mt-5 mb-2.5 border-b border-[#2D3239] pb-1.5 uppercase tracking-wider font-display flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
            {headerText}
          </h4>
        );
        continue;
      }

      // List items starting with "-" or "*" or "•"
      if (trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("•")) {
        const bulletText = trimmed.replace(/^[-\*•]\s+/, "");
        elements.push(
          <li key={`li-${i}`} className="text-[11px] text-[#9AA0A6] leading-relaxed ml-3 list-disc pl-1.5 mb-1.5">
            {parseLineWithLatex(bulletText)}
          </li>
        );
        continue;
      }

      // Check if it's a chemical reaction line without LaTeX formatting (contains chemical symbols and arrows)
      if (!trimmed.includes("$$") && !trimmed.includes("$") && (trimmed.includes("→") || trimmed.includes("->"))) {
        elements.push(
          <div key={`chem-${i}`} className="my-3 p-3 bg-[#0D0F11] border border-emerald-500/10 rounded-xl text-[10px] font-mono text-emerald-400 select-all flex items-center justify-center gap-2">
            <span className="text-emerald-500">⚛</span>
            <code>{formatPlainChemicalEquation(trimmed)}</code>
          </div>
        );
        continue;
      }

      // Regular paragraphs (using LaTeX parser to catch inline equations)
      elements.push(
        <div key={`p-${i}`} className="text-[11px] text-[#9AA0A6] leading-relaxed mb-2.5">
          {parseLineWithLatex(trimmed)}
        </div>
      );
    }

    if (isInsideTable) {
      pushCurrentTable("end");
    }

    return elements;
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.96 }}
            className="w-96 md:w-[450px] h-[600px] bg-[#16191D] border border-[#2D3239] rounded-3xl shadow-2xl overflow-hidden flex flex-col mb-4"
          >
            {/* Header / Hologram style */}
            <div className="p-4 bg-[#1C1F22] border-b border-[#2D3239] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white">AI Metallurgy & Flame Auditor</h3>
                  <p className="text-[9px] text-[#6B7076] font-mono uppercase tracking-widest">CLOUD ENGINE • LLAMA ARCHITECTURE</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#2D3239] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-[#6B7076]" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-[#0D0F11] p-1 border-b border-[#2D3239]">
              <button
                onClick={() => setActiveTab("analysis")}
                className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "analysis" 
                    ? "bg-[#16191D] text-emerald-400 border border-[#2D3239]" 
                    : "text-[#6B7076] hover:text-[#9AA0A6]"
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                Real-Time Scanner
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "history" 
                    ? "bg-[#16191D] text-emerald-400 border border-[#2D3239]" 
                    : "text-[#6B7076] hover:text-[#9AA0A6]"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Audit Log ({savedAudits.length})
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-[#2D3239]">
              {activeTab === "analysis" ? (
                <>
                  {isWeldActive ? (
                    /* Live Session Logging Active Card */
                    <div className="rounded-2xl border border-red-500/30 bg-[#0D0F11] p-4 relative overflow-hidden animate-pulse">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping shrink-0" />
                          <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">LIVE WELD RECORDING ACTIVE</span>
                        </div>
                        <span className="text-[9px] font-mono text-[#6B7076]">SESSION LOG</span>
                      </div>
                      
                      <p className="text-[11px] text-[#9AA0A6] mt-3 leading-relaxed">
                        The AI assistant is tracking flame stability, puddle temperature profile, gas combustion chemistry ratios, and physical torch manipulation in the background. 
                      </p>
                      
                      <div className="mt-4 pt-3 border-t border-[#2D3239] grid grid-cols-3 gap-2 text-[10px] font-mono">
                        <div>
                          <span className="text-[#6B7076] block text-[8px] uppercase">Peak Temp</span>
                          <span className="text-[#EDEDE8] block mt-0.5">{Math.round(puddleTemperature)}°C</span>
                        </div>
                        <div>
                          <span className="text-[#6B7076] block text-[8px] uppercase">Flame Class</span>
                          <span className="text-emerald-400 block mt-0.5 truncate uppercase">{flameClass.name}</span>
                        </div>
                        <div>
                          <span className="text-[#6B7076] block text-[8px] uppercase">Current Gap</span>
                          <span className="text-[#EDEDE8] block mt-0.5">{distanceToWorkpiece.toFixed(1)}mm</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-center text-[9px] font-mono text-[#6B7076] uppercase tracking-wider bg-red-500/5 py-1.5 rounded-lg border border-red-500/10">
                        🛑 Extinguish the flame to finalize and audit the process run!
                      </div>
                    </div>
                  ) : lastWeldSummary ? (
                    /* Completed session dashboard */
                    <div className="space-y-4">
                      {hasNewReportAlert && (
                        <motion.div 
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-center text-[10px] font-mono font-bold tracking-wide flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          ✨ NEW RUN CONCLUDED! PROCESS REPORT READY
                        </motion.div>
                      )}

                      {/* METRIC CARD */}
                      <div className="rounded-2xl border border-[#2D3239] bg-[#0D0F11] p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[8px] font-mono text-[#6B7076] uppercase tracking-widest block">Flame Atmosphere</span>
                            <span className="text-xs font-bold font-display text-emerald-400 mt-0.5 block truncate max-w-[200px]">
                              {lastWeldSummary.dominantFlame}
                            </span>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[8px] font-mono text-[#6B7076] uppercase tracking-widest block">Process Run Grade</span>
                            <div className="flex items-baseline justify-end gap-1 mt-0.5">
                              <span className="text-xl font-bold font-mono text-emerald-400">{lastWeldSummary.grade}</span>
                              <span className="text-[10px] font-mono text-[#6B7076]">({lastWeldSummary.score}/100)</span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar Score */}
                        <div className="mt-3.5 space-y-1.5">
                          <div className="flex justify-between text-[9px] font-mono text-[#6B7076]">
                            <span>Process Stability & Execution</span>
                            <span>{lastWeldSummary.score}%</span>
                          </div>
                          <div className="h-1.5 bg-[#16191D] rounded-full overflow-hidden border border-[#2D3239]/40">
                            <div 
                              className={`h-full rounded-full bg-emerald-500`}
                              style={{ width: `${lastWeldSummary.score}%` }}
                            />
                          </div>
                        </div>

                        {/* Quick Specs Grid */}
                        <div className="mt-4 pt-3.5 border-t border-[#2D3239] grid grid-cols-3 gap-2 text-[10px] font-mono">
                          <div>
                            <span className="text-[#6B7076] block text-[8px] uppercase">Run Duration</span>
                            <span className="text-[#EDEDE8] block mt-0.5">{lastWeldSummary.duration} seconds</span>
                          </div>
                          <div>
                            <span className="text-[#6B7076] block text-[8px] uppercase">Peak Temp</span>
                            <span className="text-[#EDEDE8] block mt-0.5">{lastWeldSummary.maxTemp}°C</span>
                          </div>
                          <div>
                            <span className="text-[#6B7076] block text-[8px] uppercase">Average Gap</span>
                            <span className="text-[#EDEDE8] block mt-0.5">{lastWeldSummary.avgDistance} mm</span>
                          </div>
                        </div>

                        {/* Contaminants Grid */}
                        <div className="mt-2 pt-2 border-t border-[#2D3239]/40 grid grid-cols-2 gap-2 text-[10px] font-mono">
                          <div>
                            <span className="text-[#6B7076] block text-[8px] uppercase">Peak Soot Buildup</span>
                            <span className="text-amber-500 block mt-0.5">{lastWeldSummary.peakSoot}%</span>
                          </div>
                          <div>
                            <span className="text-[#6B7076] block text-[8px] uppercase">Peak Oxide Scaling</span>
                            <span className="text-red-400 block mt-0.5">{lastWeldSummary.peakOxide}%</span>
                          </div>
                        </div>
                      </div>

                      {/* ACTIVE AUDIT TRIGGER */}
                      <div className="space-y-3">
                        <div className="text-[9px] font-mono text-[#6B7076] uppercase tracking-widest pl-1">
                          Post-Weld Metallurgy Audits
                        </div>

                        {/* Big Audit Button */}
                        <button
                          onClick={() => runAudit("full_audit")}
                          disabled={isLoading}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-900/30 disabled:text-emerald-500/50 text-black py-3 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          Compile Full Process Audit
                        </button>

                        {/* Secondary Query Chips */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            onClick={() => runAudit("equations")}
                            disabled={isLoading}
                            className="py-2.5 px-3 bg-[#0D0F11] border border-[#2D3239] hover:border-emerald-500/30 rounded-xl text-[10px] text-left text-white transition-all flex flex-col gap-1 cursor-pointer group"
                          >
                            <span className="text-emerald-400 font-mono text-[9px] uppercase tracking-wider group-hover:text-white transition-colors flex items-center gap-1">
                              <span>⚛</span> Chemical Equations
                            </span>
                            <span className="text-[#6B7076] text-[8px] leading-tight">View chemical zone dissociation formula.</span>
                          </button>

                          <button
                            onClick={() => runAudit("carbon_steel")}
                            disabled={isLoading}
                            className="py-2.5 px-3 bg-[#0D0F11] border border-[#2D3239] hover:border-emerald-500/30 rounded-xl text-[10px] text-left text-white transition-all flex flex-col gap-1 cursor-pointer group"
                          >
                            <span className="text-emerald-400 font-mono text-[9px] uppercase tracking-wider group-hover:text-white transition-colors flex items-center gap-1">
                              <span>🛡️</span> Carbon Steel Impact
                            </span>
                            <span className="text-[#6B7076] text-[8px] leading-tight">Carburization, HAZ, and hardening.</span>
                          </button>

                          <button
                            onClick={() => runAudit("stainless")}
                            disabled={isLoading}
                            className="py-2.5 px-3 bg-[#0D0F11] border border-[#2D3239] hover:border-emerald-500/30 rounded-xl text-[10px] text-left text-white transition-all flex flex-col gap-1 cursor-pointer group"
                          >
                            <span className="text-[#7FB2D9] font-mono text-[9px] uppercase tracking-wider group-hover:text-white transition-colors flex items-center gap-1">
                              <span>⚓</span> Stainless Sensitivity
                            </span>
                            <span className="text-[#6B7076] text-[8px] leading-tight">Intergranular carbide precipitation.</span>
                          </button>

                          <button
                            onClick={() => runAudit("troubleshooting")}
                            disabled={isLoading}
                            className="py-2.5 px-3 bg-[#0D0F11] border border-[#2D3239] hover:border-[#F5A623]/30 rounded-xl text-[10px] text-left text-white transition-all flex flex-col gap-1 cursor-pointer group"
                          >
                            <span className="text-[#F5A623] font-mono text-[9px] uppercase tracking-wider group-hover:text-white transition-colors flex items-center gap-1">
                              <span>🛠️</span> Defect Correction
                            </span>
                            <span className="text-[#6B7076] text-[8px] leading-tight">Specific troubleshooting steps.</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* No weld summary logged yet placeholder */
                    <div className="rounded-2xl border border-dashed border-[#2D3239] p-8 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Academic Session Auditor</h4>
                        <p className="text-[11px] text-[#6B7076] leading-relaxed max-w-[280px]">
                          Light the welding torch in the simulator to begin. The AI assistant will automatically record your parameters and compile a custom post-weld metallurgy audit once the flame is extinguished.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* LOADING STATE DISPLAY */}
                  <AnimatePresence>
                    {isLoading && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.02] p-5 flex flex-col items-center justify-center text-center space-y-4"
                      >
                        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                        <div className="space-y-1">
                          <p className="text-xs text-white font-mono uppercase tracking-wider">AI Analysis in Progress</p>
                          <p className="text-[10px] text-[#9AA0A6] font-mono transition-all duration-350">
                            {loadingStages[loadStage]}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* CURRENT REPORT CONTAINER */}
                  <div ref={reportContainerRef}>
                    {currentReport && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-[#2D3239] bg-[#0D0F11]/40 p-5 space-y-4"
                      >
                        <div className="flex justify-between items-center border-b border-[#2D3239] pb-3">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                              {activeQueryType === "full_audit" ? "LAB DIAGNOSTIC AUDIT" : 
                               activeQueryType === "equations" ? "REACTION EQUATIONS ANALYSIS" :
                               activeQueryType === "carbon_steel" ? "STEEL METALLURGICAL REPORT" :
                               activeQueryType === "stainless" ? "ALLOY DEGRADATION REPORT" : "TROUBLESHOOTING CHECKLIST"}
                            </h4>
                          </div>
                          
                          {lit && (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                              GRADE {telemetry.grade}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 font-sans selection:bg-emerald-500 selection:text-black">
                          {formatReport(currentReport)}
                        </div>

                        <div className="text-[9px] text-[#6B7076] font-mono text-center pt-3 border-t border-[#2D3239]">
                          This report is compiled based on real-time simulated parameters. Double-check all cylinder gauges.
                        </div>
                      </motion.div>
                    )}
                  </div>
                </>
              ) : (
                /* HISTORY TAB */
                <div className="space-y-4">
                  <div className="flex justify-between items-center pl-1">
                    <span className="text-[10px] font-mono text-[#6B7076] uppercase tracking-widest">
                      Audit Records History
                    </span>
                    {savedAudits.length > 0 && (
                      <button
                        onClick={clearHistory}
                        className="text-[9px] font-mono text-[#E06C75] hover:underline cursor-pointer"
                      >
                        Clear All Log
                      </button>
                    )}
                  </div>

                  {savedAudits.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#2D3239] p-10 flex flex-col items-center justify-center text-center space-y-3">
                      <FileText className="w-8 h-8 text-[#4B5563]" />
                      <p className="text-xs text-[#6B7076] font-display">No metallurgical audits logged yet.</p>
                      <p className="text-[10px] text-[#4B5563] leading-relaxed max-w-[200px]">
                        Run an audit in the scanner tab to save historical records here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedAudits.map((item) => (
                        <div 
                          key={item.id}
                          className="rounded-xl border border-[#2D3239] bg-[#0D0F11]/60 p-4 space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-white font-display uppercase">{item.flameType}</span>
                                <span className="w-1 h-1 bg-[#4B5563] rounded-full" />
                                <span className="text-[9px] font-mono text-[#6B7076]">{item.timestamp}</span>
                              </div>
                              <span className="text-[9px] font-mono text-[#6B7076] uppercase tracking-wider block">
                                QUERY: {item.queryType.replace("_", " ")}
                              </span>
                            </div>

                            <span className={`text-sm font-bold font-mono px-2 py-0.5 rounded bg-[#16191D] border border-[#2D3239] ${
                              item.grade === "A" || item.grade === "B" ? "text-emerald-400" :
                              item.grade === "C" ? "text-amber-400" : "text-red-400"
                            }`}>
                              {item.grade}
                            </span>
                          </div>

                          <div className="text-[10px] text-[#9AA0A6] leading-relaxed max-h-32 overflow-y-auto bg-[#0D0F11] border border-[#1C1F22] p-2.5 rounded-lg scrollbar-thin scrollbar-thumb-[#2D3239]">
                            {formatReport(item.report)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Structured Footer Note (NO inputs) */}
            <div className="p-3 bg-[#1C1F22] border-t border-[#2D3239] flex items-center justify-center gap-2 text-[9px] font-mono text-[#6B7076]">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Oxy-Acetylene Metallurgy Lab Assistant • Non-Spammable Academic Mode</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-colors cursor-pointer relative group"
      >
        <Sparkles className="w-6 h-6 text-black" />
        {!isOpen && (
          <div className="absolute right-full mr-3 whitespace-nowrap bg-[#1C1F22] border border-[#2D3239] px-3 py-1.5 rounded-lg text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            🔬 AI METALLURGY AUDITOR
          </div>
        )}
      </motion.button>
    </div>
  );
}
