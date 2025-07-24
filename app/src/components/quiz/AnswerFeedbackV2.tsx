import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import type { QuizQuestion } from '@/types';
import { SpeechButton } from '@/components/audio/AudioControls';
import { advancedAudioService } from '@/services/advancedAudioService';

interface AnswerFeedbackV2Props {
  isCorrect: boolean;
  question: QuizQuestion;
  onNext: () => void;
  autoRead?: boolean;
}

export const AnswerFeedbackV2: React.FC<AnswerFeedbackV2Props> = ({
  isCorrect,
  question,
  onNext,
  autoRead = true
}) => {
  const hasReadRef = useRef(false);
  const settings = advancedAudioService.getSettings();

  useEffect(() => {
    // 効果音再生
    advancedAudioService.playAdvancedSound(
      isCorrect ? 'correct' : 'incorrect',
      { variation: Math.floor(Math.random() * 3) }
    );

    // 自動読み上げ
    if (autoRead && settings.autoReadAnswers && !hasReadRef.current) {
      hasReadRef.current = true;
      
      const readAnswer = async () => {
        try {
          // 正解/不正解のメッセージ
          const resultMessage = isCorrect ? 
            '正解です！' : 
            '残念、不正解です。';
          
          await advancedAudioService.speakAdvanced(resultMessage, {
            emphasis: 'strong',
            pauseAfter: 500
          });

          // 正解の内容を読み上げ
          const correctAnswer = `正解は「${question.contentItem.text}」、${question.contentItem.reading}です。`;
          await advancedAudioService.speakAdvanced(correctAnswer, {
            rate: 0.9,
            contentItem: question.contentItem
          });

          // 意味の読み上げ
          await advancedAudioService.speakAdvanced(
            `意味は、${question.contentItem.meaning}`,
            { pauseBefore: 300 }
          );

          // モンスター獲得時の特別な読み上げ
          if (isCorrect && Math.random() < 0.3) { // 30%の確率でモンスター獲得
            await advancedAudioService.speakAdvanced(
              'おめでとう！新しいモンスターを獲得しました！',
              { emphasis: 'strong' }
            );
            advancedAudioService.playAdvancedSound('monsterGet');
          }
        } catch (error) {
          console.error('Failed to read answer:', error);
        }
      };

      readAnswer();
    }
  }, [isCorrect, question, autoRead, settings.autoReadAnswers]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto"
    >
      {/* 結果表示 */}
      <div className="flex items-center justify-center mb-6">
        {isCorrect ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="flex items-center gap-3"
          >
            <FaCheckCircle className="text-5xl text-green-500" />
            <h3 className="text-3xl font-bold text-green-600 dark:text-green-400">
              正解！
            </h3>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="flex items-center gap-3"
          >
            <FaTimesCircle className="text-5xl text-red-500" />
            <h3 className="text-3xl font-bold text-red-600 dark:text-red-400">
              不正解
            </h3>
          </motion.div>
        )}
      </div>

      {/* 正解内容 */}
      <div className="space-y-4 mb-6">
        {/* ことわざ・慣用句 */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {question.contentItem.text}
            </h4>
            <SpeechButton
              text={question.contentItem.text}
              contentItem={question.contentItem}
              size="small"
              variant="ghost"
            />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {question.contentItem.reading}
          </p>
        </div>

        {/* 意味 */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                意味
              </h5>
              <p className="text-gray-700 dark:text-gray-300">
                {question.contentItem.meaning}
              </p>
            </div>
            <SpeechButton
              text={question.contentItem.meaning}
              size="small"
              variant="ghost"
            />
          </div>
        </div>

        {/* 例文 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <h5 className="font-semibold text-blue-700 dark:text-blue-300 mb-1">
                例文
              </h5>
              <p className="text-gray-700 dark:text-gray-300">
                {question.contentItem.example_sentence}
              </p>
            </div>
            <SpeechButton
              text={question.contentItem.example_sentence}
              size="small"
              variant="ghost"
            />
          </div>
        </div>

        {/* 解説 */}
        {question.explanation && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <h5 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
              解説
            </h5>
            <p className="text-gray-700 dark:text-gray-300">
              {question.explanation}
            </p>
          </div>
        )}
      </div>

      {/* 次へボタン */}
      <div className="text-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNext}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors"
        >
          次の問題へ
        </motion.button>
      </div>

      {/* 学習のヒント */}
      {!isCorrect && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
        >
          <p className="text-sm text-amber-800 dark:text-amber-200">
            💡 ヒント: この表現は{question.contentItem.difficulty}レベルです。
            例文を声に出して読んでみると覚えやすくなります！
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};