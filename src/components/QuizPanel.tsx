/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { QUIZ_QUESTIONS } from "../utils/data";
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, RefreshCw, Award, Eye } from "lucide-react";

interface QuizPanelProps {
  onSetRatioPreset: (preset: "acetylene" | "carburizing" | "neutral" | "oxidizing") => void;
}

export default function QuizPanel({ onSetRatioPreset }: QuizPanelProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answersSubmitted, setAnswersSubmitted] = useState<Record<number, number>>({});
  const [quizFinished, setQuizFinished] = useState(false);

  const question = QUIZ_QUESTIONS[currentIdx];

  const handleSelectOption = (idx: number) => {
    if (selectedAnswer !== null) return; // Answer already selected for this question
    setSelectedAnswer(idx);
    setShowExplanation(true);
    
    // Track answer
    const newAnswers = { ...answersSubmitted, [question.id]: idx };
    setAnswersSubmitted(newAnswers);

    // Update score
    if (idx === question.correctIndex) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
      // Retrieve already selected answer if any
      const nextId = QUIZ_QUESTIONS[currentIdx + 1].id;
      const prevAnswer = answersSubmitted[nextId];
      setSelectedAnswer(prevAnswer !== undefined ? prevAnswer : null);
      setShowExplanation(prevAnswer !== undefined);
    } else {
      setQuizFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      const prevId = QUIZ_QUESTIONS[currentIdx - 1].id;
      const prevAnswer = answersSubmitted[prevId];
      setSelectedAnswer(prevAnswer !== undefined ? prevAnswer : null);
      setShowExplanation(prevAnswer !== undefined);
    }
  };

  const previewFlameType = () => {
    if (question.targetFlame) {
      onSetRatioPreset(question.targetFlame as any);
    }
  };

  const restartQuiz = () => {
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnswersSubmitted({});
    setQuizFinished(false);
  };

  return (
    <div className="rounded-2xl border border-[#2D3239] bg-[#16191D] p-6 shadow-xl flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-[#2D3239] pb-3">
        <h2 className="text-white text-sm font-semibold font-display flex items-center gap-2">
          <Award className="w-4 h-4 text-[#F5A623]" />
          Topic Assessment & Flame Tuning Practice
        </h2>
        <span className="text-[10px] font-mono text-[#9AA0A6] bg-[#0D0F11] px-2.5 py-1 border border-[#2D3239] rounded-xl">
          {quizFinished ? "COMPLETED" : `QUESTION ${currentIdx + 1} / ${QUIZ_QUESTIONS.length}`}
        </span>
      </div>

      {quizFinished ? (
        <div className="text-center py-6 flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative">
            {/* Circular score display */}
            <div className="w-24 h-24 rounded-full border-4 border-[#2D3239] flex flex-col items-center justify-center bg-[#0D0F11] shadow-2xl">
              <span className="text-2xl font-bold text-[#EDEDE8] font-display">{score}</span>
              <span className="text-[9px] font-mono text-[#6B7076]">OUT OF {QUIZ_QUESTIONS.length}</span>
            </div>
            <Award className="w-6 h-6 text-yellow-400 absolute -bottom-1 -right-1" />
          </div>

          <div>
            <h3 className="text-[#EDEDE8] font-display font-bold text-sm">
              {score === QUIZ_QUESTIONS.length 
                ? "🏆 Perfect Score! Workshop Master" 
                : score >= QUIZ_QUESTIONS.length / 2 
                  ? "👍 Great job! Solid Foundation" 
                  : "📚 Let's study and try again!"}
            </h3>
            <p className="text-[11px] text-[#9AA0A6] max-w-sm mx-auto mt-1.5 leading-relaxed">
              Understanding flame characteristics and chemistry is essential for proper oxy-acetylene welding penetration and weld safety.
            </p>
          </div>

          <button
            onClick={restartQuiz}
            className="flex items-center gap-2 rounded-xl bg-[#F5A623] hover:bg-[#D97706] text-black font-display font-semibold text-xs py-2.5 px-6 transition duration-150 shadow-lg shadow-[#F5A623]/15"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            RESTART ASSESSMENT
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Question Text */}
          <div>
            <div className="text-[#EDEDE8] text-sm font-semibold leading-relaxed">
              {question.question}
            </div>
            {question.targetFlame && (
              <button
                onClick={previewFlameType}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-[#0D0F11] border border-[#2D3239] px-2.5 py-1 text-[10px] font-mono text-emerald-400 hover:text-white hover:border-emerald-500/40 transition-all"
                title="Loads this specific flame profile in the simulator to assist you"
              >
                <Eye className="w-3 h-3" />
                PREVIEW FLAME ON SIMULATOR
              </button>
            )}
          </div>

          {/* Options Grid */}
          <div className="flex flex-col gap-2">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrect = idx === question.correctIndex;
              const hasSelected = selectedAnswer !== null;

              let buttonClass = "border-[#2D3239] bg-[#0D0F11] text-[#9AA0A6] hover:border-[#4A7A9E] hover:bg-[#1C1F22] hover:text-[#EDEDE8]";
              let icon = null;

              if (hasSelected) {
                if (isCorrect) {
                  buttonClass = "border-emerald-500/30 bg-emerald-950/25 text-emerald-400";
                  icon = <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />;
                } else if (isSelected) {
                  buttonClass = "border-red-500/30 bg-red-950/25 text-red-400";
                  icon = <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
                } else {
                  buttonClass = "border-[#2D3239]/50 bg-[#0D0F11]/20 text-[#6B7076] opacity-40 pointer-events-none";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={hasSelected}
                  className={`flex items-center justify-between text-left rounded-xl border p-3.5 text-xs transition duration-150 ${buttonClass}`}
                >
                  <span className="leading-normal">{opt}</span>
                  {icon}
                </button>
              );
            })}
          </div>

          {/* Explanation panel */}
          {showExplanation && (
            <div className="rounded-xl bg-[#192735]/20 border border-[#4A7A9E]/30 p-4 animate-fade-in">
              <div className="text-[9px] font-mono text-blue-400 font-bold uppercase tracking-wide">
                Technical Explanation
              </div>
              <div className="text-[11px] text-[#9AA0A6] mt-1 leading-relaxed">
                {question.explanation}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center border-t border-[#2D3239] pt-3.5">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className={`flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-medium font-display transition duration-150 ${
                currentIdx === 0 
                  ? "text-[#6B7076] cursor-not-allowed" 
                  : "text-[#9AA0A6] hover:text-[#EDEDE8] hover:bg-[#1C1F22] border border-[#2D3239]"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              BACK
            </button>

            <button
              onClick={handleNext}
              disabled={selectedAnswer === null}
              className={`flex items-center gap-1.5 rounded-xl px-4.5 py-2 text-xs font-semibold font-display transition duration-150 ${
                selectedAnswer === null
                  ? "bg-[#0D0F11] border border-[#2D3239] text-[#6B7076] cursor-not-allowed"
                  : "bg-[#F5A623] hover:bg-[#D97706] text-black shadow-lg shadow-[#F5A623]/10"
              }`}
            >
              {currentIdx === QUIZ_QUESTIONS.length - 1 ? "FINISH" : "NEXT"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
