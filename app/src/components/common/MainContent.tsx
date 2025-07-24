import React, { useState, lazy, Suspense, useEffect } from 'react';
import { Header } from '@components/common/Header';
import { Footer } from '@components/common/Footer';
import { ErrorDisplay } from '@components/common/ErrorDisplay';
import { AchievementNotification } from '@components/common/AchievementNotification';
import { LevelUpNotification } from '@components/common/LevelUpNotification';
import { RankingNotificationToast } from '@components/ranking/RankingNotificationToast';
import { useGame } from '@/contexts/GameContext';
import { useTutorial, shouldShowTutorial } from '@/contexts/TutorialContext';
import { mainMenuTutorialSteps, quizTutorialSteps } from '@/hooks/useTutorialSteps';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransitions } from '@/utils/animations';

// ルートコンポーネントを動的インポート
const QuizScreen = lazy(() => 
  import('@components/quiz/QuizScreen').then(module => ({
    default: module.QuizScreen
  }))
);

const MonsterCollection = lazy(() => 
  import('@components/monster/MonsterCollection').then(module => ({
    default: module.MonsterCollection
  }))
);

const SettingsScreen = lazy(() => 
  import('@components/common/SettingsScreen').then(module => ({
    default: module.SettingsScreen
  }))
);

const RankingScreen = lazy(() => 
  import('@components/ranking/RankingScreen').then(module => ({
    default: module.RankingScreen
  }))
);

const StatsScreen = lazy(() => 
  import('@components/stats/StatsScreen').then(module => ({
    default: module.StatsScreen
  }))
);

const ExportScreen = lazy(() => 
  import('@components/export/ExportScreen').then(module => ({
    default: module.ExportScreen
  }))
);

const AnalyticsScreen = lazy(() => 
  import('@components/analytics/AnalyticsScreen').then(module => ({
    default: module.AnalyticsScreen
  }))
);

const MonsterTestScreen = lazy(() => 
  import('@components/screens/MonsterTestScreen').then(module => ({
    default: module.MonsterTestScreen
  }))
);

const TutorialTestScreen = lazy(() => 
  import('@components/screens/TutorialTestScreen').then(module => ({
    default: module.TutorialTestScreen
  }))
);

const AudioTestScreen = lazy(() => 
  import('@components/screens/AudioTestScreen').then(module => ({
    default: module.AudioTestScreen
  }))
);

// ページローディングコンポーネント
const PageLoading: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <p className="ml-4 text-gray-600">読み込み中...</p>
  </div>
);

type PageType = 'quiz' | 'collection' | 'ranking' | 'stats' | 'settings' | 'export' | 'analytics' | 'monster-test' | 'tutorial-test' | 'audio-test';

export const MainContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('quiz');
  const [previousPage, setPreviousPage] = useState<PageType>('quiz');
  const { 
    isLoading, 
    error, 
    clearError, 
    newAchievements, 
    clearAchievement,
    levelUpResult,
    clearNotifications,
    rankingNotifications,
    clearRankingNotification
  } = useGame();
  const { startTutorial, isTutorialActive } = useTutorial();
  const [hasShownMainTutorial, setHasShownMainTutorial] = useState(false);
  const [hasShownQuizTutorial, setHasShownQuizTutorial] = useState(false);

  // ページ遷移時のアニメーション選択
  const getPageTransition = () => {
    const pageOrder = ['quiz', 'collection', 'ranking', 'stats', 'analytics', 'settings', 'export'];
    const currentIndex = pageOrder.indexOf(currentPage);
    const previousIndex = pageOrder.indexOf(previousPage);
    
    if (currentIndex > previousIndex) {
      return pageTransitions.slideLeft;
    } else if (currentIndex < previousIndex) {
      return pageTransitions.slideRight;
    }
    return pageTransitions.fade;
  };

  // ページ変更時の処理
  const handleNavigate = (page: PageType) => {
    setPreviousPage(currentPage);
    setCurrentPage(page);
  };

  // Auto-start tutorial for first-time users
  useEffect(() => {
    if (shouldShowTutorial() && !isLoading && !hasShownMainTutorial && !isTutorialActive) {
      // Small delay to ensure all elements are rendered
      setTimeout(() => {
        startTutorial(mainMenuTutorialSteps);
        setHasShownMainTutorial(true);
      }, 500);
    }
  }, [isLoading, startTutorial, hasShownMainTutorial, isTutorialActive]);

  // Start quiz tutorial when navigating to quiz page for the first time
  useEffect(() => {
    if (currentPage === 'quiz' && shouldShowTutorial() && !hasShownQuizTutorial && !isTutorialActive) {
      // Delay to ensure quiz screen is fully rendered
      setTimeout(() => {
        startTutorial(quizTutorialSteps);
        setHasShownQuizTutorial(true);
      }, 500);
    }
  }, [currentPage, startTutorial, hasShownQuizTutorial, isTutorialActive]);

  const renderContent = () => {
    const content = (() => {
      switch (currentPage) {
        case 'quiz':
          return <QuizScreen />;
        case 'collection':
          return <MonsterCollection />;
        case 'ranking':
          return <RankingScreen />;
        case 'stats':
          return <StatsScreen />;
        case 'settings':
          return <SettingsScreen onNavigate={handleNavigate} />;
        case 'export':
          return <ExportScreen />;
        case 'analytics':
          return <AnalyticsScreen />;
        case 'monster-test':
          return <MonsterTestScreen />;
        case 'tutorial-test':
          return <TutorialTestScreen />;
        case 'audio-test':
          return <AudioTestScreen />;
        default:
          return <QuizScreen />;
      }
    })();
    
    return (
      <Suspense fallback={<PageLoading />}>
        {content}
      </Suspense>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-6xl"
        >
          📚
        </motion.div>
        <p className="ml-4 text-xl text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />
      
      {/* アチーブメント通知 */}
      <AchievementNotification 
        achievements={newAchievements} 
        onClear={clearAchievement} 
      />
      
      {/* レベルアップ通知 */}
      <LevelUpNotification
        levelUpResult={levelUpResult}
        onClose={() => clearNotifications()}
      />
      
      {/* ランキング通知 */}
      <RankingNotificationToast
        notification={rankingNotifications[0] || null}
        onClose={clearRankingNotification}
      />
      
      <main id="main-content" className="flex-1 container mx-auto px-4 py-6 pb-20 md:pb-8" tabIndex={-1}>
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto mb-4"
            >
              <ErrorDisplay
                type={error.type === 'network' ? 'network' : 
                      error.type === 'storage' || error.type === 'storage_quota' ? 'storage' :
                      error.type === 'validation' ? 'validation' :
                      error.type === 'data_load' ? 'data' : 'general'}
                message={error.message}
                onRetry={() => {
                  clearError();
                  window.location.reload();
                }}
              />
            </motion.div>
          )}
          
          <motion.div
            key={currentPage}
            variants={getPageTransition()}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="max-w-4xl mx-auto"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <Footer currentPage={currentPage} onNavigate={handleNavigate} />
    </div>
  );
};