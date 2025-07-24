import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWifi, FaExclamationTriangle } from 'react-icons/fa';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export const OfflineNotification: React.FC = () => {
  const { isOnline } = useNetworkStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white py-2 px-4 shadow-md"
        >
          <div className="container mx-auto flex items-center justify-center space-x-2">
            <FaExclamationTriangle className="text-lg" />
            <span className="text-sm font-medium">
              オフラインモードで実行中 - 一部の機能が制限されています
            </span>
            <FaWifi className="text-lg opacity-50" />
          </div>
        </motion.div>
      )}
      
      {/* Success notification when coming back online */}
      {isOnline && (
        <motion.div
          initial={false}
          animate={{ opacity: 0 }}
          transition={{ duration: 3 }}
          className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white py-2 px-4 shadow-md pointer-events-none"
        >
          <div className="container mx-auto flex items-center justify-center space-x-2">
            <FaWifi className="text-lg" />
            <span className="text-sm font-medium">
              オンラインに復帰しました
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};