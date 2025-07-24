import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import type { GameSettings, UserProgress } from '@/types';

// チュートリアルステップの定義
export interface TutorialStep {
  id: string;
  target?: string; // CSS selector
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlight?: boolean;
  interactive?: boolean;
  validation?: (state: any) => boolean;
  action?: () => void;
  skipCondition?: (state: any) => boolean;
  delay?: number;
}

// チュートリアルエンジンのProps
interface TutorialEngineProps {
  steps: TutorialStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  gameState?: any; // ゲーム状態（検証用）
}

// スポットライト効果のコンポーネント
const SpotlightOverlay: React.FC<{
  targetRect: DOMRect | null;
  onClick?: () => void;
}> = ({ targetRect, onClick }) => {
  if (!targetRect) return null;

  const padding = 10;
  const borderRadius = 8;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9998] pointer-events-none"
      style={{ isolation: 'isolate' }}
    >
      {/* 背景のオーバーレイ */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: onClick ? 'auto' : 'none' }}
        onClick={onClick}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.x - padding}
              y={targetRect.y - padding}
              width={targetRect.width + padding * 2}
              height={targetRect.height + padding * 2}
              rx={borderRadius}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
        />
      </svg>
      
      {/* ハイライトボーダー */}
      <motion.div
        className="absolute border-2 border-blue-500 rounded-lg"
        style={{
          left: targetRect.x - padding,
          top: targetRect.y - padding,
          width: targetRect.width + padding * 2,
          height: targetRect.height + padding * 2,
        }}
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(59, 130, 246, 0.5)',
            '0 0 0 10px rgba(59, 130, 246, 0)',
          ],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
    </motion.div>
  );
};

// ツールチップコンポーネント
const TutorialTooltip: React.FC<{
  step: TutorialStep;
  targetRect: DOMRect | null;
  onNext: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}> = ({ step, targetRect, onNext, onSkip, currentStep, totalSteps }) => {
  const position = step.position || 'bottom';
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!targetRect || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 20;
    let x = 0;
    let y = 0;

    if (position === 'center') {
      x = window.innerWidth / 2 - tooltipRect.width / 2;
      y = window.innerHeight / 2 - tooltipRect.height / 2;
    } else {
      // 位置計算
      switch (position) {
        case 'top':
          x = targetRect.x + targetRect.width / 2 - tooltipRect.width / 2;
          y = targetRect.y - tooltipRect.height - padding;
          break;
        case 'bottom':
          x = targetRect.x + targetRect.width / 2 - tooltipRect.width / 2;
          y = targetRect.y + targetRect.height + padding;
          break;
        case 'left':
          x = targetRect.x - tooltipRect.width - padding;
          y = targetRect.y + targetRect.height / 2 - tooltipRect.height / 2;
          break;
        case 'right':
          x = targetRect.x + targetRect.width + padding;
          y = targetRect.y + targetRect.height / 2 - tooltipRect.height / 2;
          break;
      }

      // 画面端の調整
      x = Math.max(padding, Math.min(x, window.innerWidth - tooltipRect.width - padding));
      y = Math.max(padding, Math.min(y, window.innerHeight - tooltipRect.height - padding));
    }

    setTooltipPosition({ x, y });
  }, [targetRect, position]);

  return (
    <motion.div
      ref={tooltipRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md"
      style={{
        left: tooltipPosition.x,
        top: tooltipPosition.y,
        pointerEvents: 'auto',
      }}
    >
      {/* 矢印 */}
      {position !== 'center' && targetRect && (
        <div
          className={`absolute w-4 h-4 bg-white dark:bg-gray-800 transform rotate-45 ${
            position === 'top' ? 'bottom-[-8px] left-1/2 -translate-x-1/2' :
            position === 'bottom' ? 'top-[-8px] left-1/2 -translate-x-1/2' :
            position === 'left' ? 'right-[-8px] top-1/2 -translate-y-1/2' :
            'left-[-8px] top-1/2 -translate-y-1/2'
          }`}
        />
      )}

      {/* コンテンツ */}
      <div className="relative">
        {/* プログレス */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ステップ {currentStep + 1} / {totalSteps}
          </span>
          <button
            onClick={onSkip}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            スキップ
          </button>
        </div>

        {/* ステップコンテンツ */}
        <div className="text-gray-900 dark:text-gray-100">
          {step.content}
        </div>

        {/* アクションボタン */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onNext}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            次へ
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ポインターインジケーター
const PointerIndicator: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <motion.div
    className="fixed z-[10000] pointer-events-none"
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0, opacity: 0 }}
    style={{ left: x - 20, top: y - 20 }}
  >
    <motion.div
      className="relative"
      animate={{
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r="15"
          fill="rgba(59, 130, 246, 0.3)"
          stroke="rgba(59, 130, 246, 0.8)"
          strokeWidth="2"
        />
        <circle
          cx="20"
          cy="20"
          r="5"
          fill="rgba(59, 130, 246, 0.8)"
        />
      </svg>
    </motion.div>
  </motion.div>
);

// メインのチュートリアルエンジンコンポーネント
export const TutorialEngine: React.FC<TutorialEngineProps> = ({
  steps,
  onComplete,
  onSkip,
  gameState,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [showPointer, setShowPointer] = useState(false);
  const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 });
  const currentStep = steps[currentStepIndex];

  // ターゲット要素の取得と監視
  useEffect(() => {
    if (!currentStep?.target) {
      setTargetRect(null);
      return;
    }

    const updateTargetRect = () => {
      const element = document.querySelector(currentStep.target!);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    };

    // 初期設定
    const timer = setTimeout(updateTargetRect, currentStep.delay || 100);

    // ResizeObserverで要素の変更を監視
    const element = document.querySelector(currentStep.target);
    let resizeObserver: ResizeObserver | null = null;

    if (element) {
      resizeObserver = new ResizeObserver(updateTargetRect);
      resizeObserver.observe(element);
    }

    // スクロール時の更新
    window.addEventListener('scroll', updateTargetRect);
    window.addEventListener('resize', updateTargetRect);

    return () => {
      clearTimeout(timer);
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', updateTargetRect);
      window.removeEventListener('resize', updateTargetRect);
    };
  }, [currentStep]);

  // ポインター表示
  useEffect(() => {
    if (currentStep?.target && targetRect) {
      setShowPointer(true);
      setPointerPosition({
        x: targetRect.x + targetRect.width / 2,
        y: targetRect.y + targetRect.height / 2,
      });

      const timer = setTimeout(() => setShowPointer(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, targetRect]);

  // ステップのアクション実行
  useEffect(() => {
    if (currentStep?.action) {
      currentStep.action();
    }
  }, [currentStep]);

  // 次のステップへ
  const handleNext = useCallback(() => {
    if (currentStep?.validation && !currentStep.validation(gameState)) {
      // バリデーション失敗時の処理
      return;
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onComplete?.();
    }
  }, [currentStepIndex, steps.length, currentStep, gameState, onComplete]);

  // スキップ処理
  const handleSkip = useCallback(() => {
    onSkip?.();
    onComplete?.();
  }, [onSkip, onComplete]);

  // スキップ条件のチェック
  useEffect(() => {
    if (currentStep?.skipCondition && currentStep.skipCondition(gameState)) {
      handleNext();
    }
  }, [currentStep, gameState, handleNext]);

  if (!currentStep) return null;

  return createPortal(
    <AnimatePresence>
      {/* スポットライト効果 */}
      {currentStep.highlight && targetRect && (
        <SpotlightOverlay
          targetRect={targetRect}
          onClick={currentStep.interactive ? undefined : handleNext}
        />
      )}

      {/* ツールチップ */}
      <TutorialTooltip
        step={currentStep}
        targetRect={targetRect}
        onNext={handleNext}
        onSkip={handleSkip}
        currentStep={currentStepIndex}
        totalSteps={steps.length}
      />

      {/* ポインターインジケーター */}
      {showPointer && (
        <PointerIndicator x={pointerPosition.x} y={pointerPosition.y} />
      )}
    </AnimatePresence>,
    document.body
  );
};

// チュートリアルステップビルダー（ヘルパー関数）
export const createTutorialStep = (
  id: string,
  content: React.ReactNode,
  options?: Partial<TutorialStep>
): TutorialStep => ({
  id,
  content,
  highlight: true,
  interactive: true,
  ...options,
});

// プリセットチュートリアルステップ
export const welcomeTutorialSteps: TutorialStep[] = [
  createTutorialStep(
    'welcome',
    <div>
      <h3 className="text-lg font-bold mb-2">ことだまモンスターへようこそ！</h3>
      <p>日本語の知識を学びながら、モンスターを集める冒険に出かけましょう。</p>
    </div>,
    { position: 'center', highlight: false }
  ),
  createTutorialStep(
    'quiz-button',
    <div>
      <h3 className="text-lg font-bold mb-2">クイズを始める</h3>
      <p>ここをクリックしてクイズに挑戦しましょう。正解するとモンスターが手に入ります！</p>
    </div>,
    { target: '[data-tutorial="quiz-button"]', position: 'bottom' }
  ),
  createTutorialStep(
    'collection',
    <div>
      <h3 className="text-lg font-bold mb-2">コレクション</h3>
      <p>獲得したモンスターはここで確認できます。すべて集めることができるかな？</p>
    </div>,
    { target: '[data-tutorial="collection-button"]', position: 'bottom' }
  ),
  createTutorialStep(
    'progress',
    <div>
      <h3 className="text-lg font-bold mb-2">あなたの進捗</h3>
      <p>レベルや経験値はここに表示されます。たくさん問題を解いてレベルアップしよう！</p>
    </div>,
    { target: '[data-tutorial="progress-bar"]', position: 'top' }
  ),
];