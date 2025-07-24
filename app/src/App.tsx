import React, { Suspense, useEffect, useState } from 'react';
import { GameProvider } from '@contexts/GameContext';
import { AdminProvider } from '@contexts/AdminContext';
import { ThemeProvider } from '@contexts/ThemeContext';
import { TutorialProvider } from '@contexts/TutorialContext';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { TutorialOverlay } from '@components/common/TutorialOverlay';
import { ServiceWorkerUpdatePrompt } from '@components/common/ServiceWorkerUpdatePrompt';
import { OfflineNotification } from '@components/common/OfflineNotification';
import { InstallPrompt, UpdatePrompt } from '@components/pwa/InstallPrompt';
import { getInitialLoadingMessage } from '@/hooks/useLoadingTips';
import { useGlobalKeyboardShortcuts } from '@/hooks/useGlobalKeyboardShortcuts';
import { KeyboardShortcutsHelp } from '@components/common/KeyboardShortcutsHelp';

// MainContentを動的インポート
const MainContent = React.lazy(() => 
  import('@components/common/MainContent').then(module => ({
    default: module.MainContent
  }))
);

function App() {
  const [loadingMessage] = useState(() => getInitialLoadingMessage());
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Service Worker update listener
  useEffect(() => {
    const handleSwUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<ServiceWorkerRegistration>;
      setSwRegistration(customEvent.detail);
    };

    window.addEventListener('sw-update', handleSwUpdate);
    return () => {
      window.removeEventListener('sw-update', handleSwUpdate);
    };
  }, []);

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

  // グローバルキーボードショートカット
  useGlobalKeyboardShortcuts({
    onHelp: () => setShowHelp(true)
  });

  return (
    <ErrorBoundary>
      {/* スキップリンク */}
      <a href="#main-content" className="skip-link">
        メインコンテンツへスキップ
      </a>
      
      <ThemeProvider>
        <TutorialProvider>
          <AdminProvider>
            <GameProvider>
              <Suspense fallback={<LoadingScreen message={loadingMessage} />}>
                <OfflineNotification />
                <MainContent />
                <TutorialOverlay />
                <ServiceWorkerUpdatePrompt registration={swRegistration} />
                <KeyboardShortcutsHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />
                <InstallPrompt />
                <UpdatePrompt />
              </Suspense>
            </GameProvider>
          </AdminProvider>
        </TutorialProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;