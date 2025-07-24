import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ContentManager } from '@core/ContentManager';
import { QuizEngine } from '@core/QuizEngine';
import { MonsterManager } from '@core/MonsterManager';
import { ProgressManager } from '@core/ProgressManager';
import { DataLoader } from '@/loaders/dataLoader';
import { LocalStorageManager } from '@/loaders/localStorageManager';
import { errorHandler, useErrorHandler, ErrorInfo } from '@/utils/errorHandler';
import type { 
  ContentType, 
  QuizQuestion, 
  Monster, 
  UserProgress,
  ContentItem,
  QuizResult,
  MonsterGenerationResult,
  LevelUpResult,
  Achievement,
  RankingNotification
} from '@types/index';
import { rankingManager } from '@core/RankingManager';
import { learningHistoryManager } from '@core/LearningHistoryManager';

interface GameContextType {
  // Managers
  contentManager: ContentManager;
  quizEngine: QuizEngine;
  monsterManager: MonsterManager;
  progressManager: ProgressManager;
  localStorageManager: LocalStorageManager;
  
  // State
  currentQuestion: QuizQuestion | null;
  currentMonster: Monster | null;
  lastQuizResult: QuizResult | null;
  monsterGenerationResult: MonsterGenerationResult | null;
  levelUpResult: LevelUpResult | null;
  newAchievements: Achievement[];
  rankingNotifications: RankingNotification[];
  isAnswered: boolean;
  selectedAnswer: number | null;
  showExplanation: boolean;
  isLoading: boolean;
  error: ErrorInfo | null;
  
  // Actions
  loadNewQuestion: (type?: ContentType) => Promise<void>;
  submitAnswer: (choiceIndex: number) => void;
  nextQuestion: () => void;
  collectMonster: () => void;
  clearNotifications: () => void;
  clearAchievement: (achievementId: string) => void;
  clearRankingNotification: () => void;
  clearError: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  // Initialize managers with dependencies
  const [dataLoader] = useState(() => new DataLoader());
  const [localStorageManager] = useState(() => new LocalStorageManager());
  const [contentManager] = useState(() => new ContentManager(dataLoader));
  const [quizEngine] = useState(() => new QuizEngine());
  const [monsterManager] = useState(() => new MonsterManager(localStorageManager));
  const [progressManager] = useState(() => new ProgressManager(localStorageManager));

  // Game state
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [currentMonster, setCurrentMonster] = useState<Monster | null>(null);
  const [lastQuizResult, setLastQuizResult] = useState<QuizResult | null>(null);
  const [monsterGenerationResult, setMonsterGenerationResult] = useState<MonsterGenerationResult | null>(null);
  const [levelUpResult, setLevelUpResult] = useState<LevelUpResult | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [rankingNotifications, setRankingNotifications] = useState<RankingNotification[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);

  // Error handler
  const handleError = useCallback((errorInfo: ErrorInfo) => {
    setError(errorInfo);
    setIsLoading(false);
  }, []);

  useErrorHandler(handleError);

  // Initialize
  useEffect(() => {
    const initializeGame = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Load all content types
        await contentManager.loadAllContent();
        
        // Initialize progress manager (loads from localStorage automatically)
        const progress = progressManager.getProgress();
        
        // Start learning session
        learningHistoryManager.startSession(progress.level);
        
        // Load first question (mixed mode)
        await loadNewQuestion();
      } catch (error) {
        errorHandler.handleError(error, { context: 'initialization' });
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeGame();
    
    // End session when window is closed
    const handleBeforeUnload = () => {
      const progress = progressManager.getProgress();
      learningHistoryManager.endSession(progress.level);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const loadNewQuestion = async (type?: ContentType) => {
    setIsLoading(true);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCurrentMonster(null);
    setError(null);

    try {
      // Get user settings
      const settings = progressManager.getSettings();
      const enabledTypes = settings.contentTypes;
      
      // If no specific type is specified, randomly select from enabled types
      let selectedType: ContentType;
      if (type) {
        selectedType = type;
      } else if (enabledTypes.length > 0) {
        selectedType = enabledTypes[Math.floor(Math.random() * enabledTypes.length)];
      } else {
        // Default to proverb if no types are enabled
        selectedType = 'proverb';
      }
      
      // Load content if not cached
      const content = await contentManager.loadContent(selectedType);
      if (content.length === 0) {
        throw new Error('利用可能なコンテンツがありません');
      }
      
      // Generate question
      const contentItem = contentManager.getRandomQuestion(selectedType, settings.difficulty);
      if (!contentItem) {
        throw new Error('問題の生成に失敗しました');
      }

      const choices = contentManager.generateChoices(contentItem, selectedType);
      const question = quizEngine.generateQuestion(contentItem, choices);
      
      setCurrentQuestion(question);
    } catch (error) {
      errorHandler.handleError(error, { context: 'loadNewQuestion', type });
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = (choiceIndex: number) => {
    if (!currentQuestion || isAnswered) return;

    setSelectedAnswer(choiceIndex);
    setIsAnswered(true);
    
    // Check answer with QuizEngine
    const quizResult = quizEngine.checkAnswer(currentQuestion.id, choiceIndex);
    setLastQuizResult(quizResult);
    
    // Update progress and check for level up and achievements
    const levelUp = progressManager.updateProgress(quizResult.isCorrect);
    if (levelUp) {
      setLevelUpResult(levelUp);
    }
    
    // Check for new achievements
    const achievements = progressManager.checkAchievements();
    const currentAchievementIds = new Set(newAchievements.map(a => a.id));
    const newlyUnlocked = achievements.filter(a => {
      // 新しくアンロックされた実績のみを抽出
      if (!a.unlockedAt) return false;
      // 既に通知済みでないか確認
      if (currentAchievementIds.has(a.id)) return false;
      // アンロック時刻が現在時刻に近いか確認（5秒以内）
      const unlockedTime = new Date(a.unlockedAt).getTime();
      const currentTime = Date.now();
      return currentTime - unlockedTime < 5000;
    });
    
    if (newlyUnlocked.length > 0) {
      setNewAchievements(prev => [...prev, ...newlyUnlocked]);
    }

    // Record answer in learning history
    learningHistoryManager.recordAnswer(
      currentQuestion.contentItem.type,
      quizResult.isCorrect
    );

    if (quizResult.isCorrect) {
      // Get combo bonus for rare monster chance
      const comboBonus = progressManager.getComboBonus();
      
      // Generate monster for correct answer with combo bonus
      const result = monsterManager.generateMonster(
        currentQuestion.contentItem,
        comboBonus.rareMonsterChanceBonus
      );
      setMonsterGenerationResult(result);
      setCurrentMonster(result.monster);
      
      // Record monster unlock
      if (result.isNew) {
        learningHistoryManager.recordMonsterUnlock();
      }
      
      // Submit score to ranking
      const playerName = localStorage.getItem('playerName');
      if (playerName) {
        const progress = progressManager.getProgress();
        const monstersCollected = monsterManager.getCollection().filter(m => m.unlocked).length;
        const notifications = rankingManager.submitScore(playerName, progress, monstersCollected);
        if (notifications.length > 0) {
          setRankingNotifications(notifications);
        }
      }
    }

    setShowExplanation(true);
  };

  const collectMonster = () => {
    if (currentMonster && monsterGenerationResult) {
      // Monster is already unlocked when generated
      // This function can be used to trigger UI updates
    }
  };

  const nextQuestion = () => {
    // Clear current question state
    if (currentQuestion) {
      quizEngine.clearQuestion(currentQuestion.id);
    }
    
    // Clear notifications
    setLevelUpResult(null);
    setMonsterGenerationResult(null);
    
    // Load new question with mixed mode (automatic content type selection)
    loadNewQuestion();
  };
  
  const clearNotifications = () => {
    setLevelUpResult(null);
    setNewAchievements([]);
    setMonsterGenerationResult(null);
  };

  const clearAchievement = (achievementId: string) => {
    setNewAchievements(prev => prev.filter(a => a.id !== achievementId));
  };

  const clearRankingNotification = () => {
    setRankingNotifications([]);
  };

  const clearError = () => {
    setError(null);
  };

  const contextValue: GameContextType = {
    contentManager,
    quizEngine,
    monsterManager,
    progressManager,
    localStorageManager,
    currentQuestion,
    currentMonster,
    lastQuizResult,
    monsterGenerationResult,
    levelUpResult,
    newAchievements,
    rankingNotifications,
    isAnswered,
    selectedAnswer,
    showExplanation,
    isLoading,
    error,
    loadNewQuestion,
    submitAnswer,
    nextQuestion,
    collectMonster,
    clearNotifications,
    clearAchievement,
    clearRankingNotification,
    clearError,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};