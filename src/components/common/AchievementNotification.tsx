import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Achievement } from '@/types';
import { FaTrophy, FaStar, FaAward, FaCheckCircle, FaFireAlt, FaBrain, FaDragon } from 'react-icons/fa';

interface AchievementNotificationProps {
  achievements: Achievement[];
  onClear: (achievementId: string) => void;
}

const getAchievementIcon = (achievementId: string) => {
  switch (achievementId) {
    case 'first_correct':
      return <FaCheckCircle className="text-2xl" />;
    case 'streak_5':
    case 'streak_10':
    case 'streak_20':
      return <FaFireAlt className="text-2xl" />;
    case 'correct_10':
    case 'correct_50':
      return <FaStar className="text-2xl" />;
    case 'correct_100':
    case 'correct_500':
      return <FaTrophy className="text-2xl" />;
    case 'accuracy_90':
      return <FaBrain className="text-2xl" />;
    case 'monsters_10':
    case 'monsters_50':
      return <FaDragon className="text-2xl" />;
    default:
      return <FaAward className="text-2xl" />;
  }
};

const getAchievementColor = (achievementId: string) => {
  if (achievementId.includes('500') || achievementId.includes('50')) {
    return 'from-yellow-400 to-orange-500';
  }
  if (achievementId.includes('100') || achievementId.includes('20')) {
    return 'from-purple-400 to-pink-500';
  }
  if (achievementId.includes('accuracy')) {
    return 'from-blue-400 to-cyan-500';
  }
  if (achievementId.includes('monsters')) {
    return 'from-green-400 to-emerald-500';
  }
  return 'from-gray-400 to-gray-600';
};

interface NotificationItem {
  achievement: Achievement;
  id: string;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({ 
  achievements, 
  onClear 
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [displayQueue, setDisplayQueue] = useState<NotificationItem[]>([]);

  // 新しいアチーブメントをキューに追加
  useEffect(() => {
    const newNotifications = achievements.map(achievement => ({
      achievement,
      id: `${achievement.id}-${Date.now()}`
    }));
    
    if (newNotifications.length > 0) {
      setNotifications(prev => [...prev, ...newNotifications]);
    }
  }, [achievements]);

  // キューから表示用の通知を管理
  useEffect(() => {
    if (notifications.length > 0 && displayQueue.length < 3) {
      const nextNotification = notifications[0];
      setNotifications(prev => prev.slice(1));
      setDisplayQueue(prev => [...prev, nextNotification]);

      // 5秒後に自動的に削除
      const timer = setTimeout(() => {
        setDisplayQueue(prev => prev.filter(n => n.id !== nextNotification.id));
        onClear(nextNotification.achievement.id);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notifications, displayQueue, onClear]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {displayQueue.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              delay: index * 0.1 
            }}
            className="pointer-events-auto"
          >
            <div className="relative overflow-hidden bg-white rounded-lg shadow-lg p-4 min-w-[320px] max-w-md">
              {/* 背景グラデーション */}
              <div className={`absolute inset-0 bg-gradient-to-r ${getAchievementColor(item.achievement.id)} opacity-10`} />
              
              {/* コンテンツ */}
              <div className="relative flex items-center gap-4">
                {/* アイコン */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r ${getAchievementColor(item.achievement.id)} flex items-center justify-center text-white shadow-md`}>
                  {getAchievementIcon(item.achievement.id)}
                </div>
                
                {/* テキスト */}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-sm">実績を獲得しました！</h3>
                  <p className="text-gray-600 font-medium">{item.achievement.name}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{item.achievement.description}</p>
                </div>
              </div>

              {/* プログレスバー（時間経過） */}
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-400 to-green-600"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};