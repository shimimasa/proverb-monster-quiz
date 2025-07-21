import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaMedal, FaCrown, FaStar, FaDownload, FaCalendarDay, FaCalendarWeek, FaInfinity } from 'react-icons/fa';
import { useGame } from '@/contexts/GameContext';
import type { RankingEntry, RankingData } from '@/types';

type RankingCategory = 'daily' | 'weekly' | 'all_time';

export const RankingScreen: React.FC = () => {
  const { rankingManager, progressManager } = useGame();
  const [selectedCategory, setSelectedCategory] = useState<RankingCategory>('daily');
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [playerRank, setPlayerRank] = useState<number>(0);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    // ランキングデータを取得
    const data = rankingManager.getRankings();
    setRankingData(data);

    // プレイヤーのランクを取得
    const progress = progressManager.getProgress();
    const rank = rankingManager.getPlayerRank(progress.playerName, selectedCategory);
    setPlayerRank(rank);
  }, [selectedCategory, rankingManager, progressManager]);

  const getRankings = (): RankingEntry[] => {
    if (!rankingData) return [];
    
    switch (selectedCategory) {
      case 'daily':
        return rankingData.dailyRankings;
      case 'weekly':
        return rankingData.weeklyRankings;
      case 'all_time':
        return rankingData.allTimeRankings;
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaCrown className="text-yellow-400" />;
      case 2:
        return <FaMedal className="text-gray-400" />;
      case 3:
        return <FaMedal className="text-orange-400" />;
      default:
        return <span className="text-gray-600">#{rank}</span>;
    }
  };

  const getCategoryIcon = (category: RankingCategory) => {
    switch (category) {
      case 'daily':
        return <FaCalendarDay />;
      case 'weekly':
        return <FaCalendarWeek />;
      case 'all_time':
        return <FaInfinity />;
    }
  };

  const getCategoryLabel = (category: RankingCategory) => {
    switch (category) {
      case 'daily':
        return 'デイリー';
      case 'weekly':
        return 'ウィークリー';
      case 'all_time':
        return '全期間';
    }
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const csv = rankingManager.exportRankingCSV(selectedCategory);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.href = url;
      link.download = `ranking_${selectedCategory}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const rankings = getRankings();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto p-4"
    >
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <FaTrophy className="text-yellow-400 mr-3" />
            ランキング
          </h1>
          
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            <FaDownload />
            <span>CSV出力</span>
          </button>
        </div>

        {/* カテゴリー選択 */}
        <div className="flex space-x-2 mb-6">
          {(['daily', 'weekly', 'all_time'] as RankingCategory[]).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getCategoryIcon(category)}
              <span>{getCategoryLabel(category)}</span>
            </button>
          ))}
        </div>

        {/* プレイヤーのランク表示 */}
        {playerRank > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaStar className="text-blue-600 text-2xl" />
                <div>
                  <p className="text-sm text-gray-600">あなたの順位</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {playerRank}位
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {progressManager.getProgress().playerName}
                </p>
                <p className="text-lg font-semibold">
                  スコア: {rankings.find(r => r.playerName === progressManager.getProgress().playerName)?.score || 0}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ランキングリスト */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {rankings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 text-gray-500"
              >
                <FaTrophy className="text-6xl mb-4 mx-auto opacity-20" />
                <p>まだランキングデータがありません</p>
                <p className="text-sm mt-2">クイズに挑戦してランキングに載ろう！</p>
              </motion.div>
            ) : (
              rankings.map((entry, index) => {
                const rank = index + 1;
                const isPlayer = entry.playerName === progressManager.getProgress().playerName;
                
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center space-x-4 p-4 rounded-lg transition-colors ${
                      isPlayer
                        ? 'bg-blue-50 border-2 border-blue-300'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {/* ランク */}
                    <div className="w-12 text-center text-2xl font-bold">
                      {getRankIcon(rank)}
                    </div>

                    {/* プレイヤー情報 */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className={`font-semibold ${isPlayer ? 'text-blue-600' : 'text-gray-800'}`}>
                          {entry.playerName}
                        </p>
                        {isPlayer && <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">YOU</span>}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Lv.{entry.level}</span>
                        <span>正答率: {entry.accuracy}%</span>
                        <span>モンスター: {entry.monstersCollected}体</span>
                      </div>
                    </div>

                    {/* スコア */}
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">{entry.score.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.dateAchieved).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* 最終更新日時 */}
        {rankingData && (
          <p className="text-center text-sm text-gray-500 mt-6">
            最終更新: {new Date(rankingData.lastUpdated).toLocaleString('ja-JP')}
          </p>
        )}
      </div>

      {/* スコア計算の説明 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">スコア計算方法</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>正解数 × 100</span>
            <span className="font-semibold">基本スコア</span>
          </div>
          <div className="flex justify-between">
            <span>正答率 × 1000</span>
            <span className="font-semibold">正確性ボーナス</span>
          </div>
          <div className="flex justify-between">
            <span>レベル × 50</span>
            <span className="font-semibold">レベルボーナス</span>
          </div>
          <div className="flex justify-between">
            <span>モンスター数 × 25</span>
            <span className="font-semibold">コレクションボーナス</span>
          </div>
          <div className="flex justify-between">
            <span>連続正解数 × 10</span>
            <span className="font-semibold">コンボボーナス</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};