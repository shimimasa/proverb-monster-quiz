import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { correctAnswerVariants, incorrectAnswerVariants } from '@/utils/animations';
import { Particles } from '@components/common/Particles';
import { announceToScreenReader } from '@/utils/accessibility';

interface AnswerFeedbackProps {
  isCorrect: boolean;
  showFeedback: boolean;
}

export const AnswerFeedback: React.FC<AnswerFeedbackProps> = ({ isCorrect, showFeedback }) => {
  // 回答結果をスクリーンリーダーに通知
  useEffect(() => {
    if (showFeedback) {
      const message = isCorrect ? '正解です！' : '不正解です。';
      announceToScreenReader(message, 'assertive');
    }
  }, [showFeedback, isCorrect]);

  if (!showFeedback) return null;

  return (
    <>
      {/* Particles for correct answer */}
      {isCorrect && <Particles count={6} emoji="🎉" />}
      
      {/* Screen flash effect */}
      <motion.div
        className={`fixed inset-0 pointer-events-none z-50 ${
          isCorrect ? 'bg-green-500' : 'bg-red-500'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Feedback text */}
      <motion.div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ 
          scale: [0, 1.5, 1],
          rotate: [0, 10, 0]
        }}
        transition={{ duration: 0.6 }}
        role="status"
        aria-live="assertive"
      >
        <div className={`text-6xl font-bold ${
          isCorrect ? 'text-green-500' : 'text-red-500'
        } drop-shadow-lg`}>
          {isCorrect ? '正解！' : '不正解...'}
        </div>
      </motion.div>
    </>
  );
};