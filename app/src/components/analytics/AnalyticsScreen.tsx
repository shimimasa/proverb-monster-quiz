import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaChartLine, FaCalendar, FaTrophy, FaLightbulb, 
  FaDownload, FaFilter, FaClock, FaFire,
  FaBullseye, FaChartPie, FaUserGraduate
} from 'react-icons/fa';
import { OverviewCards } from './OverviewCards';
import { ProgressChart } from './ProgressChart';
import { CategoryRadarChart } from './CategoryRadarChart';
import { StudyHeatmap } from './StudyHeatmap';
import { InsightsList } from './InsightsList';
import { SimpleLoading } from '@/components/common/LoadingScreen';
import type { LearningAnalytics, ReportConfig } from '@/types/analytics';
import { generateLearningAnalytics } from '@/utils/analyticsGenerator';
import { exportAnalyticsReport } from '@/utils/reportExporter';

export const AnalyticsScreen: React.FC = () => {
  const { progressManager, learningHistoryManager } = useGame();
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'insights'>('overview');
  const [isExporting, setIsExporting] = useState(false);

  // 分析データの読み込み
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const data = await generateLearningAnalytics(
          progressManager,
          learningHistoryManager,
          selectedPeriod
        );
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedPeriod, progressManager, learningHistoryManager]);

  // レポートエクスポート
  const handleExportReport = async (format: 'pdf' | 'csv') => {
    if (!analytics) return;
    
    setIsExporting(true);
    try {
      const config: ReportConfig = {
        period: selectedPeriod === 'all' ? 'custom' : selectedPeriod,
        includeGraphs: format === 'pdf',
        includeInsights: true,
        format
      };
      
      await exportAnalyticsReport(analytics, config);
    } catch (error) {
      console.error('Failed to export report:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading || !analytics) {
    return <SimpleLoading size="large" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* ヘッダー */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            <FaChartLine className="inline mr-2" />
            学習分析
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            あなたの学習進捗とパフォーマンスを分析します
          </p>
        </header>

        {/* 期間選択とエクスポート */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div className="flex gap-2">
            {(['week', 'month', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {period === 'week' && '週間'}
                {period === 'month' && '月間'}
                {period === 'all' && '全期間'}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleExportReport('pdf')}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <FaDownload />
              PDFレポート
            </button>
            <button
              onClick={() => handleExportReport('csv')}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <FaDownload />
              CSVデータ
            </button>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 mb-6">
          <div className="flex gap-2">
            {[
              { id: 'overview', label: '概要', icon: FaChartPie },
              { id: 'progress', label: '進捗', icon: FaChartLine },
              { id: 'insights', label: 'インサイト', icon: FaLightbulb }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* コンテンツ */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* 概要カード */}
              <OverviewCards overview={analytics.overview} />
              
              {/* グラフセクション */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* 進捗チャート */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    学習進捗
                  </h3>
                  <ProgressChart dailyStats={analytics.dailyStats} />
                </div>
                
                {/* カテゴリー別パフォーマンス */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    カテゴリー別成績
                  </h3>
                  <CategoryRadarChart performance={analytics.categoryPerformance} />
                </div>
              </div>
              
              {/* 学習パターン */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  学習パターン
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <FaClock className="text-3xl text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">最も生産的な時間</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">
                      {analytics.learningPatterns.mostProductiveHour}時
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <FaUserGraduate className="text-3xl text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">平均学習時間</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">
                      {analytics.learningPatterns.averageSessionDuration}分
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <FaBullseye className="text-3xl text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">継続スコア</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">
                      {analytics.learningPatterns.consistencyScore}%
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* 学習ヒートマップ */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  <FaCalendar className="inline mr-2" />
                  学習カレンダー
                </h3>
                <StudyHeatmap dailyStats={analytics.dailyStats} />
              </div>
              
              {/* 週次トレンド */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  週次トレンド
                </h3>
                <div className="space-y-4">
                  {analytics.weeklyTrends.map((trend, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">
                            {new Date(trend.weekStartDate).toLocaleDateString('ja-JP')}の週
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            最もアクティブな日: {trend.mostActiveDay}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            {trend.averageAccuracy.toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">平均正解率</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">問題数: </span>
                          <span className="font-medium">{trend.totalQuestions}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">正解数: </span>
                          <span className="font-medium">{trend.totalCorrect}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">学習時間: </span>
                          <span className="font-medium">{trend.totalStudyTime}分</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <InsightsList insights={analytics.insights} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};