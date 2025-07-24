import React, { useEffect, useRef } from 'react';
import type { QuizQuestion } from '@types/index';
import { SpeechButton } from '@/components/audio/AudioControls';
import { advancedAudioService } from '@/services/advancedAudioService';
import { motion } from 'framer-motion';

interface QuestionDisplayV2Props {
  question: QuizQuestion;
  autoRead?: boolean;
  showSpeechButton?: boolean;
  onReadComplete?: () => void;
}

export const QuestionDisplayV2: React.FC<QuestionDisplayV2Props> = ({ 
  question, 
  autoRead = false,
  showSpeechButton = true,
  onReadComplete
}) => {
  const hasReadRef = useRef(false);
  const settings = advancedAudioService.getSettings();

  useEffect(() => {
    // 自動読み上げ
    if (autoRead && settings.autoReadQuestions && !hasReadRef.current) {
      hasReadRef.current = true;
      
      // 少し遅延させて画面遷移を待つ
      const timer = setTimeout(async () => {
        try {
          await advancedAudioService.speakAdvanced(question.question, {
            emphasis: 'moderate',
            pauseBefore: 500,
            pauseAfter: 300
          });
          onReadComplete?.();
        } catch (error) {
          console.error('Failed to read question:', error);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [question, autoRead, settings.autoReadQuestions, onReadComplete]);

  // 新しい問題になったらリセット
  useEffect(() => {
    hasReadRef.current = false;
  }, [question.id]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 relative"
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            問題
          </h2>
          {showSpeechButton && (
            <SpeechButton
              text={question.question}
              size="small"
              variant="ghost"
              className="opacity-70 hover:opacity-100 transition-opacity"
            />
          )}
        </div>
        
        <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
          {question.question}
        </p>

        {/* 難易度とタイプの表示 */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <span className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
            {question.contentItem.difficulty}
          </span>
          <span className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-700 dark:text-blue-300">
            {question.contentItem.type === 'proverb' && 'ことわざ'}
            {question.contentItem.type === 'idiom' && '慣用句'}
            {question.contentItem.type === 'four_character_idiom' && '四字熟語'}
          </span>
        </div>
      </div>

      {/* 音声可視化インジケーター */}
      {settings.soundEnabled && (
        <div className="absolute top-2 right-2">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-2 h-2 bg-blue-500 rounded-full"
          />
        </div>
      )}
    </motion.div>
  );
};