import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaQuestionCircle, FaCheckCircle, FaPercentage, 
  FaClock, FaFire, FaTrophy, FaCalendarAlt
} from 'react-icons/fa';
import type { LearningAnalytics } from '@/types/analytics';

interface Props {
  overview: LearningAnalytics['overview'];
}

export const OverviewCards: React.FC<Props> = ({ overview }) => {
  const cards = [
    {
      id: 'total-questions',
      title: '総問題数',
      value: overview.totalQuestions.toLocaleString(),
      icon: FaQuestionCircle,
      color: 'blue',
      gradient: 'from-blue-400 to-blue-600',
    },
    {
      id: 'correct-answers',
      title: '正解数',
      value: overview.totalCorrect.toLocaleString(),
      icon: FaCheckCircle,
      color: 'green',
      gradient: 'from-green-400 to-green-600',
    },
    {
      id: 'accuracy',
      title: '正解率',
      value: `${overview.overallAccuracy.toFixed(1)}%`,
      icon: FaPercentage,
      color: 'purple',
      gradient: 'from-purple-400 to-purple-600',
    },
    {
      id: 'study-time',
      title: '総学習時間',
      value: `${Math.floor(overview.totalStudyTime / 60)}時間${overview.totalStudyTime % 60}分`,
      icon: FaClock,
      color: 'orange',
      gradient: 'from-orange-400 to-orange-600',
    },
    {
      id: 'current-streak',
      title: '現在の連続記録',
      value: `${overview.currentStreak}日`,
      icon: FaFire,
      color: 'red',
      gradient: 'from-red-400 to-red-600',
    },
    {
      id: 'longest-streak',
      title: '最長連続記録',
      value: `${overview.longestStreak}日`,
      icon: FaTrophy,
      color: 'yellow',
      gradient: 'from-yellow-400 to-yellow-600',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className={`h-2 bg-gradient-to-r ${card.gradient}`} />
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`text-2xl text-${card.color}-500`} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {card.title}
              </p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {card.value}
              </p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};