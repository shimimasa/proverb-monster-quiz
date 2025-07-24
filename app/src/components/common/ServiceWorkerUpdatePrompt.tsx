import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSync, FaTimes } from 'react-icons/fa';

interface ServiceWorkerUpdatePromptProps {
  registration: ServiceWorkerRegistration | null;
}

export const ServiceWorkerUpdatePrompt: React.FC<ServiceWorkerUpdatePromptProps> = ({ 
  registration 
}) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (registration && registration.waiting) {
      setShowPrompt(true);
    }
  }, [registration]);

  const handleUpdate = () => {
    if (!registration || !registration.waiting) return;

    setIsUpdating(true);

    // Tell the service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Listen for the controlling service worker changing
    // and reload the page
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                新しいバージョンが利用可能です
              </h3>
              <button
                onClick={handleDismiss}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="閉じる"
              >
                <FaTimes />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              アプリケーションの新しいバージョンが利用可能です。更新すると最新の機能と改善が適用されます。
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                <FaSync className={isUpdating ? 'animate-spin' : ''} />
                <span>{isUpdating ? '更新中...' : '今すぐ更新'}</span>
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                後で
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};