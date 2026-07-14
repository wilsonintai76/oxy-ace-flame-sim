/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FlameParams {
  feather: number;
  coneLen: number;
  coneWidth: number;
  envLen: number;
  envWidth: number;
  coreColor: string;
  coreOpacity: number;
}

export interface ZoneInfo {
  key: string;
  label: string;
  alt: string;
  description: string;
  temperature: string;
  chemicalBehavior: string;
  ratioRange: string;
  bullets: string[];
  use: string;
  color: string;
  accentColor: string;
}

export type SimMode = "interactive" | "sequence" | "quiz";

export type PuddleState = "cold" | "red-hot" | "molten" | "oxidized" | "soot-covered";

export interface Spark {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface SequenceStep {
  id: number;
  title: string;
  instruction: string;
  actionRequired: string;
  tip: string;
  status: "pending" | "current" | "success" | "error";
  check: (state: { o2Flow: number; c2h2Flow: number; lit: boolean; sparkles: boolean }) => boolean;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  targetFlame?: string; // key of target zone
}
