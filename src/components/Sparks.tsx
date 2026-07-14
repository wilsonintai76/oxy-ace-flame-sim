/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";

interface SparkProps {
  baseX: number;
  baseY: number;
  intensity: number; // 0 to 1
}

/**
 * Renders high-speed combustion particles (sparks) that eject from the flame tip.
 */
export const Sparks: React.FC<SparkProps> = ({ baseX, baseY, intensity }) => {
  if (intensity <= 0) return null;

  // Generate a handful of persistent-but-reanimating sparks
  const sparkCount = Math.floor(intensity * 12) + 4;
  
  return (
    <g className="pointer-events-none">
      {Array.from({ length: sparkCount }).map((_, i) => {
        const angle = (Math.random() - 0.5) * 15; // narrow cone
        const speed = 100 + Math.random() * 300;
        const duration = 0.3 + Math.random() * 0.5;
        const delay = Math.random() * 2;

        return (
          <motion.circle
            key={i}
            cx={baseX}
            cy={baseY}
            r={1 + Math.random()}
            fill="url(#spark-grad)"
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: [0, speed],
              y: [0, angle * 5],
              opacity: [0, 1, 0.8, 0],
              scale: [0, 1.2, 0.5, 0],
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              delay: delay,
              ease: "easeOut",
            }}
          />
        );
      })}
    </g>
  );
};
