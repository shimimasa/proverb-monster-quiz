import React, { Suspense, useEffect } from 'react';
import { GameProvider } from '@contexts/GameContext';
import { AdminProvider } from '@contexts/AdminContext';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { LoadingScreen } from '@components/common/LoadingScreen';

// MainContentを動的インポート
const MainContent = React.lazy(() => 
  import('@components/common/MainContent').then(module => ({
    default: module.MainContent
  }))
);

function App() {
  // キーボードナビゲーション検出
  useEffect(() => {
    let isKeyboardNavigation = false;

    const handleMouseDown = () => {
      isKeyboardNavigation = false;
      document.body.classList.remove('keyboard-navigation-active');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        isKeyboardNavigation = true;
        document.body.classList.add('keyboard-navigation-active');
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <ErrorBoundary>
      {/* スキップリンク */}
      <a href="#main-content" className="skip-link">
        メインコンテンツへスキップ
      </a>
      
      <AdminProvider>
        <GameProvider>
          <Suspense fallback={<LoadingScreen />}>
            <MainContent />
          </Suspense>
        </GameProvider>
      </AdminProvider>
    </ErrorBoundary>
  );
}

export default App;