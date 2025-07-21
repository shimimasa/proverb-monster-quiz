import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import {
  FaChartLine, FaClock, FaTrophy, FaFire, FaCalendar,
  FaBook, FaGraduationCap, FaDownload, FaStar
} from 'react-icons/fa';
import { learningHistoryManager } from '../../core/LearningHistoryManager';
import { LearningStats } from '../../types';
import { ChartAccessibility, TableCaption } from '../common/ChartAccessibility';

const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  tertiary: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899'
};

const CONTENT_TYPE_COLORS = {
  proverb: COLORS.primary,
  idiom: COLORS.secondary,
  four_character_idiom: COLORS.tertiary
};

const CONTENT_TYPE_NAMES = {
  proverb: 'ことわざ',
  idiom: '慣用句',
  four_character_idiom: '四字熟語'
};

export const StatsScreen: React.FC = () => {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const data = learningHistoryManager.getStats();
    setStats(data);
  };

  const handleExport = () => {
    const data = learningHistoryManager.exportHistory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `learning_history_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-4xl"
        >
          📊
        </motion.div>
      </div>
    );
  }

  // Prepare chart data
  const dailyChartData = stats.dailyHistory.map(entry => ({
    date: entry.date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
    questions: entry.questionsAnswered,
    correct: entry.correctAnswers,
    accuracy: entry.accuracy
  }));

  const categoryPieData = stats.categoryPerformance
    .filter(cat => cat.totalQuestions > 0)
    .map(cat => ({
      name: CONTENT_TYPE_NAMES[cat.type],
      value: cat.totalQuestions,
      accuracy: cat.accuracy
    }));

  const monthlyTrendData = stats.monthlyTrends.map(trend => ({
    month: trend.month.split(' ')[1], // Extract month only
    accuracy: trend.accuracy,
    questions: trend.questionsAnswered
  }));

  return (
    <main className="space-y-6" role="main" aria-label="統計画面">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-3">
          <FaChartLine className="text-blue-500" aria-hidden="true" />
          学習統計
        </h1>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6" role="region" aria-label="サマリー情報">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">週間正答率</p>
                <p className="text-2xl font-bold">{stats.weeklyStats.averageAccuracy}%</p>
              </div>
              <FaGraduationCap className="text-3xl opacity-80" aria-hidden="true" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">週間問題数</p>
                <p className="text-2xl font-bold">{stats.weeklyStats.totalQuestions}</p>
              </div>
              <FaBook className="text-3xl opacity-80" aria-hidden="true" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">学習時間</p>
                <p className="text-2xl font-bold">{stats.weeklyStats.totalStudyTime}分</p>
              </div>
              <FaClock className="text-3xl opacity-80" aria-hidden="true" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">最も活発</p>
                <p className="text-lg font-bold">{stats.weeklyStats.mostActiveDay || '-'}</p>
              </div>
              <FaFire className="text-3xl opacity-80" aria-hidden="true" />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Period Selector */}
      <section className="bg-white rounded-lg shadow-md p-4" aria-label="期間選択">
        <div className="flex justify-between items-center">
          <div className="flex gap-2" role="group" aria-label="表示期間">
            <button
              onClick={() => setSelectedPeriod('daily')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedPeriod === 'daily'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-pressed={selectedPeriod === 'daily'}
            >
              日別
            </button>
            <button
              onClick={() => setSelectedPeriod('weekly')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedPeriod === 'weekly'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-pressed={selectedPeriod === 'weekly'}
            >
              週間
            </button>
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedPeriod === 'monthly'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-pressed={selectedPeriod === 'monthly'}
            >
              月別
            </button>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="学習データをエクスポート"
          >
            <FaDownload aria-hidden="true" />
            データエクスポート
          </button>
        </div>
      </section>

      {/* Charts */}
      <AnimatePresence mode="wait">
        {selectedPeriod === 'daily' && (
          <motion.div
            key="daily"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Daily Progress Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaCalendar className="text-blue-500" aria-hidden="true" />
                日別学習進捗
              </h2>
              <ChartAccessibility
                chartType="area"
                data={dailyChartData}
                title="日別学習進捗チャート"
                description="日ごとの問題数と正解数の推移を表示"
              />
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyChartData} aria-label="日別学習進捗チャート">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="questions"
                    stackId="1"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.6}
                    name="問題数"
                  />
                  <Area
                    type="monotone"
                    dataKey="correct"
                    stackId="2"
                    stroke={COLORS.secondary}
                    fill={COLORS.secondary}
                    fillOpacity={0.6}
                    name="正解数"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Accuracy Line Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">正答率推移</h2>
              <ChartAccessibility
                chartType="line"
                data={dailyChartData}
                title="正答率推移チャート"
                description="日ごとの正答率の推移を表示"
              />
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyChartData} aria-label="正答率推移チャート">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke={COLORS.purple}
                    strokeWidth={3}
                    dot={{ fill: COLORS.purple }}
                    name="正答率"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {selectedPeriod === 'weekly' && (
          <motion.div
            key="weekly"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Category Performance */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">カテゴリ別成績</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <ChartAccessibility
                    chartType="pie"
                    data={categoryPieData}
                    title="カテゴリ別問題数分布"
                    description="各カテゴリの問題数の割合を表示"
                  />
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart aria-label="カテゴリ別問題数分布">
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}問`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={Object.values(CONTENT_TYPE_COLORS)[index % Object.values(CONTENT_TYPE_COLORS).length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <ChartAccessibility
                    chartType="bar"
                    data={stats.categoryPerformance}
                    title="カテゴリ別正答率"
                    description="各カテゴリの正答率を表示"
                  />
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.categoryPerformance} aria-label="カテゴリ別正答率">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="type" 
                      tickFormatter={(value) => CONTENT_TYPE_NAMES[value]}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === '正答率') return `${value}%`;
                        return value;
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="accuracy" 
                      fill={COLORS.secondary} 
                      name="正答率"
                    />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Weekly Performance Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">カテゴリ別詳細</h2>
              <div className="overflow-x-auto">
                <table className="w-full" role="table" aria-label="カテゴリ別成績詳細">
                  <TableCaption>
                    各カテゴリの問題数、正解数、正答率、平均時間を表示
                  </TableCaption>
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">カテゴリ</th>
                      <th className="text-center py-2">問題数</th>
                      <th className="text-center py-2">正解数</th>
                      <th className="text-center py-2">正答率</th>
                      <th className="text-center py-2">平均時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.categoryPerformance.map((cat) => (
                      <tr key={cat.type} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium">{CONTENT_TYPE_NAMES[cat.type]}</td>
                        <td className="text-center">{cat.totalQuestions}</td>
                        <td className="text-center">{cat.correctAnswers}</td>
                        <td className="text-center">
                          <span className={`font-bold ${
                            cat.accuracy >= 80 ? 'text-green-600' :
                            cat.accuracy >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {cat.accuracy}%
                          </span>
                        </td>
                        <td className="text-center">{cat.averageTime}分</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {selectedPeriod === 'monthly' && (
          <motion.div
            key="monthly"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">月別トレンド</h2>
            <ChartAccessibility
              chartType="line"
              data={monthlyTrendData}
              title="月別トレンドチャート"
              description="月ごとの正答率と問題数の推移を表示"
            />
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthlyTrendData} aria-label="月別トレンドチャート">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="accuracy"
                  stroke={COLORS.purple}
                  strokeWidth={3}
                  name="正答率 (%)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="questions"
                  stroke={COLORS.primary}
                  strokeWidth={3}
                  name="問題数"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};