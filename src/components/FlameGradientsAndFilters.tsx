/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

/**
 * Encapsulates SVG Gradients, Radial Patterns, Metal Textures, 
 * and Glow Filters for the Oxy-Acetylene Flame Simulation.
 */
export default function FlameGradientsAndFilters() {
  return (
    <defs>
      {/* Outer Envelope Gradients - matching the ethereal electric blue from the photos */}
      <radialGradient id="envelope-grad-neutral" cx="5%" cy="50%" r="95%">
        <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.85" />
        <stop offset="20%" stopColor="#3B82F6" stopOpacity="0.5" />
        <stop offset="60%" stopColor="#1D4ED8" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="envelope-grad-oxidizing" cx="5%" cy="50%" r="90%">
        <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
        <stop offset="30%" stopColor="#1E40AF" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="envelope-grad-carburizing" cx="5%" cy="50%" r="95%">
        <stop offset="0%" stopColor="#A5B4FC" stopOpacity="0.8" />
        <stop offset="35%" stopColor="#4F46E5" stopOpacity="0.4" />
        <stop offset="80%" stopColor="#312E81" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </radialGradient>

      {/* Pure Acetylene - more orange/yellow body with smoke tendency */}
      <linearGradient id="acetylene-grad" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
        <stop offset="15%" stopColor="#FEF3C7" stopOpacity="0.9" />
        <stop offset="40%" stopColor="#F59E0B" stopOpacity="0.75" />
        <stop offset="80%" stopColor="#B45309" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </linearGradient>

      {/* Acetylene Feather - a greenish-white to orange-tinged feather typical of carburizing flames */}
      <linearGradient id="feather-grad" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
        <stop offset="35%" stopColor="#E0F2FE" stopOpacity="0.85" />
        <stop offset="70%" stopColor="#FFF7ED" stopOpacity="0.75" />
        <stop offset="92%" stopColor="#FED7AA" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
      </linearGradient>

      {/* Inner Core - extremely intense pure white with blue fringe */}
      <radialGradient id="core-grad-neutral" cx="10%" cy="50%" r="90%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
        <stop offset="30%" stopColor="#E0F2FE" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.2" />
      </radialGradient>

      <radialGradient id="core-grad-oxidizing" cx="5%" cy="50%" r="95%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
        <stop offset="40%" stopColor="#BFDBFE" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.3" />
      </radialGradient>

      <radialGradient id="core-grad-carburizing" cx="15%" cy="50%" r="85%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
        <stop offset="45%" stopColor="#F0F9FF" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0.4" />
      </radialGradient>

      {/* Nozzle Metal - deeper shading */}
      <linearGradient id="nozzle-body" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#374151" />
        <stop offset="35%" stopColor="#6B7280" />
        <stop offset="50%" stopColor="#1F2937" />
        <stop offset="65%" stopColor="#111827" />
        <stop offset="100%" stopColor="#030712" />
      </linearGradient>

      <linearGradient id="nozzle-tip" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#92400E" />
        <stop offset="35%" stopColor="#D97706" />
        <stop offset="50%" stopColor="#78350F" />
        <stop offset="65%" stopColor="#451A03" />
        <stop offset="100%" stopColor="#000000" />
      </linearGradient>

      <linearGradient id="nozzleMetal" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#8c512a" />
        <stop offset="50%" stopColor="#e29b61" />
        <stop offset="100%" stopColor="#6d3916" />
      </linearGradient>

      {/* Spark Gradient */}
      <radialGradient id="spark-grad">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="30%" stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
      </radialGradient>

      {/* Mirage / Heat Distortion Filter */}
      <filter id="mirage" x="-20%" y="-100%" width="140%" height="300%">
        <feTurbulence type="fractalNoise" baseFrequency="0.01 0.04" numOctaves="2" seed="1" result="noise">
          <animate attributeName="seed" values="1;500;1" dur="4s" repeatCount="indefinite" />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
        <feGaussianBlur stdDeviation="0.5" />
      </filter>

      {/* Filters */}
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <filter id="strong-bloom" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="6" result="blur1" />
        <feGaussianBlur stdDeviation="12" result="blur2" />
        <feMerge>
          <feMergeNode in="blur2" />
          <feMergeNode in="blur1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="core-glow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -10" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="cone-halo" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 12 -2" result="halo" />
        <feComposite in="halo" in2="SourceGraphic" operator="out" />
      </filter>

      {/* Soot / Smoke Texture Filter */}
      <filter id="soot-texture" x="-50%" y="-50%" width="200%" height="200%">
        <feTurbulence type="fractalNoise" baseFrequency="0.05 0.1" numOctaves="4" result="noise" seed="1" />
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="mask" />
        <feComposite in="SourceGraphic" in2="mask" operator="in" />
      </filter>

      <radialGradient id="smoke-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#0a0a0a" stopOpacity="0.9" />
        <stop offset="70%" stopColor="#000000" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </radialGradient>

      {/* Heat Haze Displacement */}
      <filter id="heat-haze">
        <feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="3" result="noise">
          <animate attributeName="baseFrequency" values="0.02 0.05; 0.025 0.06; 0.02 0.05" dur="4s" repeatCount="indefinite" />
          <animate attributeName="seed" values="1; 100; 1" dur="10s" repeatCount="indefinite" />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
      </filter>

      {/* Flame Turbulence for realistic organic movement */}
      <filter id="flameTurbulence" x="-100%" y="-100%" width="300%" height="300%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04 0.06" numOctaves="3" seed="1" result="noise">
          <animate attributeName="seed" values="1;200;1" dur="1.2s" repeatCount="indefinite" />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
        <feGaussianBlur stdDeviation="0.1" />
      </filter>

      {/* Intense Core Flicker - extremely subtle to preserve core shape */}
      <filter id="coreFlicker" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.3 0.3" numOctaves="1" seed="1" result="noise">
          <animate attributeName="seed" values="1;50;1" dur="0.5s" repeatCount="indefinite" />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  );
}
