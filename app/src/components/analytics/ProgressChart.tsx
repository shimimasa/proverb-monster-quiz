import React, { useMemo } from 'react';
import type { DailyStats } from '@/types/analytics';

interface Props {
  dailyStats: DailyStats[];
}

export const ProgressChart: React.FC<Props> = ({ dailyStats }) => {
  const chartData = useMemo(() => {
    // 最新7日分のデータを取得
    const recentStats = dailyStats.slice(-7);
    
    // 最大値を計算（グラフのスケール調整用）
    const maxQuestions = Math.max(...recentStats.map(s => s.questionsAnswered), 10);
    
    return {
      stats: recentStats,
      maxQuestions,
      barHeight: 200, // グラフの高さ
    };
  }, [dailyStats]);

  if (chartData.stats.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        データがありません
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* グラフエリア */}
      <div className="relative h-64">
        {/* Y軸ラベル */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
          <span>{chartData.maxQuestions}</span>
          <span>{Math.round(chartData.maxQuestions * 0.75)}</span>
          <span>{Math.round(chartData.maxQuestions * 0.5)}</span>
          <span>{Math.round(chartData.maxQuestions * 0.25)}</span>
          <span>0</span>
        </div>
        
        {/* グラフ本体 */}
        <div className="ml-8 h-full flex items-end justify-between gap-2">
          {chartData.stats.map((stat, index) => {
            const totalHeight = (stat.questionsAnswered / chartData.maxQuestions) * chartData.barHeight;
            const correctHeight = (stat.correctAnswers / chartData.maxQuestions) * chartData.barHeight;
            const date = new Date(stat.date);
            const dayLabel = date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
            
            return (
              <div key={stat.date} className="flex-1 flex flex-col items-center">
                {/* バー */}
                <div className="relative w-full max-w-12">
                  {/* 総問題数バー */}
                  <div
                    className="absolute bottom-0 w-full bg-gray-200 dark:bg-gray-600 rounded-t transition-all duration-500"
                    style={{ height: `${totalHeight}px` }}
                  />
                  {/* 正解数バー */}
                  <div
                    className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-500"
                    style={{ height: `${correctHeight}px` }}
                  />
                  {/* ツールチップ */}
                  <div className="absolute bottom-0 w-full h-full group">
                    <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      <div>問題数: {stat.questionsAnswered}</div>
                      <div>正解: {stat.correctAnswers}</div>
                      <div>正解率: {stat.accuracy.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
                
                {/* 日付ラベル */}
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  {dayLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 凡例 */}
      <div className="mt-4 flex justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded" />
          <span className="text-gray-600 dark:text-gray-400">総問題数</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded" />
          <span className="text-gray-600 dark:text-gray-400">正解数</span>
        </div>
      </div>
    </div>
  );
};