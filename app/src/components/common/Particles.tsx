import React from 'react';
import { motion } from 'framer-motion';
import { particleVariants } from '@/utils/animations';

interface ParticlesProps {
  count?: number;
  emoji?: string;
  colors?: string[];
}

export const Particles: React.FC<ParticlesProps> = ({
  count = 8,
  emoji,
  colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD', '#F4A460', '#98D8C8']
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2"
          variants={particleVariants}
          initial="initial"
          animate="animate"
          custom={i}
        >
          {emoji ? (
            <span className="text-2xl">{emoji}</span>
          ) : (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
};