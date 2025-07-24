import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useGame } from '@contexts/GameContext';
import { QuestionDisplay, ChoiceButtons, ComboDisplay } from '@components/optimized';
import { ProgressBar } from '@components/optimized';
import { MonsterReward } from '@components/monster/MonsterReward';
import { AnswerFeedback } from './AnswerFeedback';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFire, FaStar, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { useAudio } from '@/hooks/useAudio';
import { SimpleLoading } from '@components/common/LoadingScreen';
import { streakVariants } from '@/utils/animations';

export const QuizScreen: React.FC = () => {
  const {
    currentQuestion,
    currentMonster,
    monsterGenerationResult,
    levelUpResult,
    lastQuizResult,
    newAchievements,
    isAnswered,
    selectedAnswer,
    showExplanation,
    submitAnswer,
    nextQuestion,
    collectMonster,
    clearNotifications,
    progressManager,
  } = useGame();

  const progress = progressManager.getProgress();
  const comboState = progressManager.getComboState();
  const comboBonus = progressManager.getComboBonus();
  const { speak, stopSpeaking, isSpeaking, playSound, isEnabled } = useAudio();
  const [showComboBreak, setShowComboBreak] = useState(false);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);

  // Clear notifications after showing them
  useEffect(() => {
    if (levelUpResult || newAchievements.length > 0) {
      const timer = setTimeout(() => {
        clearNotifications();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [levelUpResult, newAchievements, clearNotifications]);

  // 問題文の自動読み上げ
  useEffect(() => {
    if (currentQuestion && !isAnswered && isEnabled) {
      speak(currentQuestion.question);
    }
    return () => {
      stopSpeaking();
    };
  }, [currentQuestion, isAnswered, isEnabled, speak, stopSpeaking]);

  // 正解/不正解時の効果音とコンボブレイク処理
  useEffect(() => {
    if (isAnswered && lastQuizResult) {
      playSound(lastQuizResult.isCorrect ? 'correct' : 'incorrect');
      
      // アンサーフィードバック表示
      setShowAnswerFeedback(true);
      setTimeout(() => setShowAnswerFeedback(false), 1000);
      
      // コンボブレイクの処理
      if (!lastQuizResult.isCorrect && comboState.currentCombo > 0) {
        setShowComboBreak(true);
        setTimeout(() => setShowComboBreak(false), 1000);
      }
    }
  }, [isAnswered, lastQuizResult, playSound, comboState.currentCombo]);

  // レベルアップ時の効果音
  useEffect(() => {
    if (levelUpResult) {
      playSound('levelUp');
    }
  }, [levelUpResult, playSound]);

  // アチーブメント獲得時の効果音
  useEffect(() => {
    if (newAchievements.length > 0) {
      playSound('achievement');
    }
  }, [newAchievements, playSound]);

  if (!currentQuestion) {
    return <SimpleLoading size="large" />;
  }

  return (
    <main className="space-y-6 relative" role="main" aria-label="クイズ画面">
      {/* Answer Feedback */}
      <AnswerFeedback 
        isCorrect={lastQuizResult?.isCorrect || false}
        showFeedback={showAnswerFeedback}
      />

      {/* Combo Display */}
      <section aria-label="コンボ情報" aria-live="polite">
        <ComboDisplay 
          comboState={comboState} 
          comboBonus={comboBonus}
          showBreakAnimation={showComboBreak}
        />
      </section>

      {/* Notifications */}
      <AnimatePresence>
        {levelUpResult && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
            role="alert"
            aria-live="polite"
          >
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-4 rounded-lg shadow-lg">
              <div className="flex items-center space-x-3">
                <FaStar className="text-2xl" aria-hidden="true" />
                <div>
                  <p className="font-bold text-lg">レベルアップ！</p>
                  <p className="text-sm">レベル {levelUpResult.newLevel} に到達しました！</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {newAchievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ delay: index * 0.2 }}
            className="fixed top-32 right-4 z-50"
            style={{ top: `${128 + index * 80}px` }}
            role="alert"
            aria-live="polite"
          >
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg shadow-lg">
              <p className="font-bold">
                <span aria-hidden="true">🏆</span> 実績解除！
              </p>
              <p className="text-sm">{achievement.name}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Progress Info */}
      <section className="bg-white rounded-lg shadow-md p-6 quiz-progress" aria-label="進捗情報">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800" aria-label={`現在レベル${progress.level}`}>
              レベル {progress.level}
            </h3>
            <p className="text-sm text-gray-600" aria-label={`正解数${progress.totalCorrect}、問題数${progress.totalQuestions}`}>
              正解数: {progress.totalCorrect} / {progress.totalQuestions}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">連続正解</p>
            <motion.div 
              className="flex items-center justify-end space-x-1"
              variants={streakVariants}
              initial="idle"
              animate={progress.currentStreak > 0 ? "active" : "idle"}
              key={progress.currentStreak}
            >
              <p className="text-2xl font-bold text-orange-500">
                {progress.currentStreak}
              </p>
              <FaFire className="text-orange-500 text-xl" aria-hidden="true" />
            </motion.div>
          </div>
        </div>
        <ProgressBar progress={progressManager} />
      </section>

      {/* Content Type Indicator */}
      {currentQuestion && (
        <section className="bg-white rounded-lg shadow-md p-4" aria-label="コンテンツタイプ">
          <div className="flex items-center justify-center space-x-3">
            <span className="text-2xl" aria-hidden="true">
              {currentQuestion.contentItem.type === 'proverb' && '📖'}
              {currentQuestion.contentItem.type === 'idiom' && '💬'}
              {currentQuestion.contentItem.type === 'four_character_idiom' && '🈲'}
            </span>
            <div className="text-center">
              <p className="text-sm text-gray-600">現在の出題タイプ</p>
              <p className="text-lg font-semibold text-gray-800">
                {currentQuestion.contentItem.type === 'proverb' && 'ことわざ'}
                {currentQuestion.contentItem.type === 'idiom' && '慣用句'}
                {currentQuestion.contentItem.type === 'four_character_idiom' && '四字熟語'}
              </p>
            </div>
            {progress.settings.contentTypes.length > 1 && (
              <div className="ml-4 pl-4 border-l border-gray-200">
                <p className="text-xs text-gray-500">混合モード</p>
                <div className="flex space-x-1 mt-1">
                  {progress.settings.contentTypes.includes('proverb') && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded" title="ことわざ">📖</span>
                  )}
                  {progress.settings.contentTypes.includes('idiom') && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded" title="慣用句">💬</span>
                  )}
                  {progress.settings.contentTypes.includes('four_character_idiom') && (
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded" title="四字熟語">🈲</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Question with Audio Control */}
      <section className="relative question-display" aria-label="問題">
        <QuestionDisplay question={currentQuestion} />
        {isEnabled && (
          <button
            onClick={useCallback(() => {
              if (isSpeaking) {
                stopSpeaking();
              } else {
                speak(currentQuestion.question);
              }
            }, [isSpeaking, stopSpeaking, speak, currentQuestion])}
            className="absolute top-4 right-4 p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
            aria-label={isSpeaking ? "読み上げを停止" : "問題を読み上げる"}
          >
            {isSpeaking ? (
              <FaVolumeMute className="text-blue-600 text-xl" />
            ) : (
              <FaVolumeUp className="text-blue-600 text-xl" />
            )}
          </button>
        )}
      </section>

      {/* Choices */}
      <section className="choice-buttons" aria-label="選択肢" role="group">
        <ChoiceButtons
          choices={currentQuestion.choices}
          onSelect={submitAnswer}
          selectedAnswer={selectedAnswer}
          correctAnswer={currentQuestion.correctAnswer}
          isAnswered={isAnswered}
        />
      </section>

      {/* Explanation */}
      {showExplanation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg p-6 ${
            selectedAnswer === currentQuestion.correctAnswer
              ? 'bg-green-50 border-2 border-green-300'
              : 'bg-red-50 border-2 border-red-300'
          }`}
        >
          <h3 className="text-lg font-semibold mb-2">
            {selectedAnswer === currentQuestion.correctAnswer ? '正解！' : '不正解...'}
          </h3>
          <p className="text-gray-700 whitespace-pre-line">
            {currentQuestion.explanation}
          </p>
          
          {/* Show reward info for correct answers */}
          {lastQuizResult?.isCorrect && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                獲得経験値: +{10 + Math.min(progress.currentStreak * 2, 20)} EXP
                {progress.currentStreak > 1 && (
                  <span className="text-orange-500 ml-2">
                    (ストリークボーナス +{Math.min(progress.currentStreak * 2, 20)})
                  </span>
                )}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Monster Reward */}
      {monsterGenerationResult && currentMonster && (
        <MonsterReward 
          monster={currentMonster}
          isNew={!monsterGenerationResult.isDuplicate}
          reward={monsterGenerationResult.reward}
          onCollect={useCallback(() => {
            collectMonster();
            playSound('monsterGet');
            nextQuestion();
          }, [collectMonster, playSound, nextQuestion])}
        />
      )}

      {/* Next Button */}
      {isAnswered && !currentMonster && (
        <div className="text-center">
          <button
            onClick={useCallback(() => {
              playSound('click');
              nextQuestion();
            }, [playSound, nextQuestion])}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            次の問題へ
          </button>
        </div>
      )}
    </main>
  );
};