import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaMedal, FaCrown, FaArrowUp, FaCalendarDay, FaCalendarWeek, FaInfinity } from 'react-icons/fa';
import type { RankingNotification } from '@/types';

interface Props {
  notification: RankingNotification | null;
  onClose: () => void;
}

export const RankingNotificationToast: React.FC<Props> = ({ notification, onClose }) => {
  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'first_place':
        return <FaCrown className="text-yellow-400 text-3xl" />;
      case 'top_3':
        return <FaMedal className="text-orange-400 text-3xl" />;
      case 'top_10':
        return <FaTrophy className="text-blue-600 text-3xl" />;
      case 'rank_up':
        return <FaArrowUp className="text-green-500 text-3xl" />;
      default:
        return <FaTrophy className="text-purple-600 text-3xl" />;
    }
  };

  const getCategoryIcon = () => {
    switch (notification.category) {
      case 'daily':
        return <FaCalendarDay className="text-sm" />;
      case 'weekly':
        return <FaCalendarWeek className="text-sm" />;
      case 'all_time':
        return <FaInfinity className="text-sm" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'first_place':
        return 'bg-gradient-to-r from-yellow-400 to-orange-400';
      case 'top_3':
        return 'bg-gradient-to-r from-orange-400 to-red-400';
      case 'top_10':
        return 'bg-gradient-to-r from-blue-500 to-purple-500';
      case 'rank_up':
        return 'bg-gradient-to-r from-green-500 to-teal-500';
      default:
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="fixed top-20 right-4 z-50"
      >
        <div className={`${getBackgroundColor()} text-white rounded-xl shadow-2xl p-6 min-w-[320px]`}>
          <div className="flex items-start space-x-4">
            {/* アイコン */}
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 0.5,
                delay: 0.3
              }}
            >
              {getIcon()}
            </motion.div>
            
            {/* コンテンツ */}
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">ランキング更新！</h3>
              <p className="text-sm opacity-90 mb-2">{notification.message}</p>
              
              {/* ランク情報 */}
              <div className="flex items-center space-x-2 text-sm">
                {getCategoryIcon()}
                <span className="font-semibold">
                  {notification.previousRank && notification.previousRank > 0
                    ? `${notification.previousRank}位 → ${notification.newRank}位`
                    : `${notification.newRank}位`}
                </span>
              </div>
            </div>
            
            {/* 閉じるボタン */}
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* プログレスバー */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 5, ease: "linear" }}
            onAnimationComplete={onClose}
            className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 origin-left"
          />
        </div>
        
        {/* 背景のキラキラエフェクト */}
        <div className="absolute inset-0 -z-10">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                x: Math.random() * 100 - 50,
                y: Math.random() * 100 - 50
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};