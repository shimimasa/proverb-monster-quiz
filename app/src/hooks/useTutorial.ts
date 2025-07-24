import { useState, useCallback, useEffect } from 'react';
import type { TutorialStep } from '@/components/tutorial/TutorialEngine';

// チュートリアルの状態管理
interface TutorialState {
  isActive: boolean;
  steps: TutorialStep[];
  hasCompletedTutorial: boolean;
  tutorialHistory: string[]; // 完了したチュートリアルのID
}

// LocalStorageキー
const TUTORIAL_STORAGE_KEY = 'proverb-monster-tutorial';

// チュートリアル履歴の保存・読み込み
const loadTutorialHistory = (): string[] => {
  try {
    const data = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveTutorialHistory = (history: string[]) => {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save tutorial history:', error);
  }
};

// カスタムフック
export const useTutorial = () => {
  const [state, setState] = useState<TutorialState>({
    isActive: false,
    steps: [],
    hasCompletedTutorial: false,
    tutorialHistory: loadTutorialHistory(),
  });

  // チュートリアル開始
  const startTutorial = useCallback((steps: TutorialStep[], tutorialId?: string) => {
    // 既に完了している場合はスキップ
    if (tutorialId && state.tutorialHistory.includes(tutorialId)) {
      return;
    }

    setState(prev => ({
      ...prev,
      isActive: true,
      steps,
    }));
  }, [state.tutorialHistory]);

  // チュートリアル完了
  const completeTutorial = useCallback((tutorialId?: string) => {
    setState(prev => {
      const newHistory = tutorialId && !prev.tutorialHistory.includes(tutorialId)
        ? [...prev.tutorialHistory, tutorialId]
        : prev.tutorialHistory;

      // 履歴を保存
      if (newHistory !== prev.tutorialHistory) {
        saveTutorialHistory(newHistory);
      }

      return {
        ...prev,
        isActive: false,
        steps: [],
        hasCompletedTutorial: true,
        tutorialHistory: newHistory,
      };
    });
  }, []);

  // チュートリアルスキップ
  const skipTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      steps: [],
    }));
  }, []);

  // チュートリアルリセット（デバッグ用）
  const resetTutorial = useCallback(() => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    setState({
      isActive: false,
      steps: [],
      hasCompletedTutorial: false,
      tutorialHistory: [],
    });
  }, []);

  // 特定のチュートリアルが完了しているかチェック
  const hasCompletedTutorialId = useCallback((tutorialId: string) => {
    return state.tutorialHistory.includes(tutorialId);
  }, [state.tutorialHistory]);

  return {
    isActive: state.isActive,
    steps: state.steps,
    hasCompletedTutorial: state.hasCompletedTutorial,
    startTutorial,
    completeTutorial,
    skipTutorial,
    resetTutorial,
    hasCompletedTutorialId,
  };
};

// チュートリアルプロバイダー用のコンテキスト（必要に応じて）
import React, { createContext, useContext } from 'react';

interface TutorialContextValue {
  isActive: boolean;
  steps: TutorialStep[];
  hasCompletedTutorial: boolean;
  startTutorial: (steps: TutorialStep[], tutorialId?: string) => void;
  completeTutorial: (tutorialId?: string) => void;
  skipTutorial: () => void;
  resetTutorial: () => void;
  hasCompletedTutorialId: (tutorialId: string) => boolean;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tutorial = useTutorial();

  return (
    <TutorialContext.Provider value={tutorial}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorialContext = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorialContext must be used within TutorialProvider');
  }
  return context;
};