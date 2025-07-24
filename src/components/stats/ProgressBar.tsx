import React from 'react';
import { motion } from 'framer-motion';
import type { ProgressManager } from '@core/ProgressManager';

interface ProgressBarProps {
  progress: ProgressManager;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const levelProgress = progress.getLevelProgress();
  const percentage = levelProgress.progressPercentage;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>経験値</span>
        <span>{levelProgress.currentExp} / {levelProgress.expForNext}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};