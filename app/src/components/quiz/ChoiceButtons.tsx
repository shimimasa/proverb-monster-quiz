import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '@/hooks/useAudio';
import { KeyCodes, announceToScreenReader } from '@/utils/accessibility';
import { correctAnswerVariants, incorrectAnswerVariants } from '@/utils/animations';

interface ChoiceButtonsProps {
  choices: string[];
  onSelect: (index: number) => void;
  selectedAnswer: number | null;
  correctAnswer: number;
  isAnswered: boolean;
}

export const ChoiceButtons: React.FC<ChoiceButtonsProps> = ({
  choices,
  onSelect,
  selectedAnswer,
  correctAnswer,
  isAnswered,
}) => {
  const { playSound } = useAudio();
  const containerRef = useRef<HTMLDivElement>(null);
  // キーボードナビゲーション
  useEffect(() => {
    if (isAnswered) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
      const currentIndex = Array.from(buttons).findIndex(btn => btn === document.activeElement);

      // 数字キー（1-4）で直接選択
      if (e.key >= '1' && e.key <= '4') {
        const index = parseInt(e.key) - 1;
        if (index < choices.length) {
          e.preventDefault();
          onSelect(index);
          announceToScreenReader(`選択肢${index + 1}を選択しました: ${choices[index]}`);
        }
        return;
      }

      switch (e.key) {
        case KeyCodes.ARROW_UP:
        case KeyCodes.ARROW_LEFT:
          e.preventDefault();
          if (currentIndex > 0) {
            buttons[currentIndex - 1].focus();
          } else {
            buttons[buttons.length - 1].focus();
          }
          break;
        case KeyCodes.ARROW_DOWN:
        case KeyCodes.ARROW_RIGHT:
          e.preventDefault();
          if (currentIndex < buttons.length - 1) {
            buttons[currentIndex + 1].focus();
          } else {
            buttons[0].focus();
          }
          break;
      }
    };

    containerRef.current?.addEventListener('keydown', handleKeyDown);
    return () => containerRef.current?.removeEventListener('keydown', handleKeyDown);
  }, [choices, onSelect, isAnswered]);

  // 回答後のアナウンス
  useEffect(() => {
    if (isAnswered && selectedAnswer !== null) {
      const isCorrect = selectedAnswer === correctAnswer;
      const message = isCorrect 
        ? `正解です！正解は${choices[correctAnswer]}でした。`
        : `不正解です。正解は${choices[correctAnswer]}でした。`;
      announceToScreenReader(message, 'assertive');
    }
  }, [isAnswered, selectedAnswer, correctAnswer, choices]);

  const getButtonStyle = (index: number) => {
    if (!isAnswered) {
      return 'bg-white hover:bg-blue-50 border-2 border-gray-300 hover:border-blue-400';
    }

    if (index === correctAnswer) {
      return 'bg-green-100 border-2 border-green-500';
    }

    if (index === selectedAnswer && index !== correctAnswer) {
      return 'bg-red-100 border-2 border-red-500';
    }

    return 'bg-gray-100 border-2 border-gray-300 opacity-50';
  };

  return (
    <div 
      ref={containerRef}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      role="group"
      aria-label="選択肢"
    >
      {choices.map((choice, index) => {
        const choiceLabel = String.fromCharCode(65 + index);
        return (
          <motion.button
            key={index}
            onClick={() => {
              if (!isAnswered) {
                playSound('click');
                onSelect(index);
              }
            }}
            disabled={isAnswered}
            className={`p-4 rounded-lg text-left transition-all relative ${getButtonStyle(index)} ${
              !isAnswered ? 'cursor-pointer' : 'cursor-not-allowed'
            }`}
            whileHover={!isAnswered ? { scale: 1.02 } : {}}
            whileTap={!isAnswered ? { scale: 0.98 } : {}}
            variants={
              isAnswered && index === correctAnswer ? correctAnswerVariants :
              isAnswered && index === selectedAnswer && index !== correctAnswer ? incorrectAnswerVariants :
              undefined
            }
            initial="initial"
            animate={isAnswered ? "animate" : "initial"}
            aria-label={`選択肢${choiceLabel}: ${choice}`}
            aria-pressed={selectedAnswer === index}
            aria-describedby={isAnswered && index === correctAnswer ? `correct-${index}` : 
                             isAnswered && index === selectedAnswer && index !== correctAnswer ? `incorrect-${index}` : undefined}
          >
            <div className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold mr-3" aria-hidden="true">
                {choiceLabel}
              </span>
              <span className="text-gray-800">{choice}</span>
            </div>
            {isAnswered && index === correctAnswer && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white"
                  aria-hidden="true"
                >
                  ✓
                </motion.div>
                <span id={`correct-${index}`} className="sr-only">正解</span>
              </>
            )}
            {isAnswered && index === selectedAnswer && index !== correctAnswer && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white"
                  aria-hidden="true"
                >
                  ✗
                </motion.div>
                <span id={`incorrect-${index}`} className="sr-only">不正解</span>
              </>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};