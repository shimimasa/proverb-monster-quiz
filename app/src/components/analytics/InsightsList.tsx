import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaTrophy, FaLightbulb, FaExclamationTriangle, 
  FaCheckCircle, FaArrowRight 
} from 'react-icons/fa';
import type { LearningInsight } from '@/types/analytics';

interface Props {
  insights: LearningInsight[];
}

export const InsightsList: React.FC<Props> = ({ insights }) => {
  const getIcon = (type: LearningInsight['type']) => {
    switch (type) {
      case 'achievement':
        return FaTrophy;
      case 'suggestion':
        return FaLightbulb;
      case 'warning':
        return FaExclamationTriangle;
      case 'milestone':
        return FaCheckCircle;
      default:
        return FaLightbulb;
    }
  };

  const getColorClasses = (type: LearningInsight['type'], priority: LearningInsight['priority']) => {
    const baseColors = {
      achievement: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      suggestion: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      warning: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      milestone: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    };

    const iconColors = {
      achievement: 'text-yellow-600',
      suggestion: 'text-blue-600',
      warning: 'text-red-600',
      milestone: 'text-green-600',
    };

    return {
      container: baseColors[type],
      icon: iconColors[type],
    };
  };

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
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  };

  const sortedInsights = [...insights].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  if (insights.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <FaLightbulb className="text-4xl text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          現在、特にお伝えするインサイトはありません。
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {sortedInsights.map((insight) => {
        const Icon = getIcon(insight.type);
        const colors = getColorClasses(insight.type, insight.priority);

        return (
          <motion.div
            key={insight.id}
            variants={itemVariants}
            className={`rounded-lg border-2 p-4 ${colors.container}`}
          >
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 p-3 rounded-full bg-white dark:bg-gray-800 ${colors.icon}`}>
                <Icon className="text-xl" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {insight.title}
                  </h3>
                  {insight.priority === 'high' && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                      重要
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  {insight.description}
                </p>
                
                {insight.actionable && insight.action && (
                  <button
                    onClick={() => {
                      // TODO: アクションの実行
                      console.log('Action:', insight.action);
                    }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {insight.action.label}
                    <FaArrowRight className="text-xs" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};