import React, { useMemo } from 'react';
import type { DailyStats } from '@/types/analytics';

interface Props {
  dailyStats: DailyStats[];
}

export const StudyHeatmap: React.FC<Props> = ({ dailyStats }) => {
  const heatmapData = useMemo(() => {
    // 過去52週間分のデータを生成
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364); // 52週間前
    
    // 日付ごとのデータをマップ化
    const dataMap = new Map(
      dailyStats.map(stat => [stat.date, stat])
    );
    
    // 各日のデータを生成
    const weeks: DailyStats[][] = [];
    let currentWeek: DailyStats[] = [];
    const currentDate = new Date(startDate);
    
    // 最初の日曜日まで空セルを追加
    const firstDayOfWeek = currentDate.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null as any);
    }
    
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = dataMap.get(dateStr) || {
        date: dateStr,
        questionsAnswered: 0,
        correctAnswers: 0,
        accuracy: 0,
        studyTime: 0,
        contentTypes: [],
        streakCount: 0,
        monstersUnlocked: 0,
      };
      
      currentWeek.push(dayData);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 最後の週を追加
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null as any);
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [dailyStats]);
  
  // アクティビティレベルを計算
  const getActivityLevel = (questionsAnswered: number): number => {
    if (questionsAnswered === 0) return 0;
    if (questionsAnswered < 5) return 1;
    if (questionsAnswered < 10) return 2;
    if (questionsAnswered < 20) return 3;
    return 4;
  };
  
  // セルの色を取得
  const getCellColor = (level: number): string => {
    const colors = [
      'bg-gray-100 dark:bg-gray-700',
      'bg-green-200 dark:bg-green-900',
      'bg-green-300 dark:bg-green-700',
      'bg-green-400 dark:bg-green-600',
      'bg-green-500 dark:bg-green-500',
    ];
    return colors[level];
  };
  
  const monthLabels = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];
  
  const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];
  
  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        {/* 曜日ラベル */}
        <div className="flex gap-1 mb-1">
          <div className="w-8" /> {/* スペーサー */}
          {dayLabels.map((day, index) => (
            <div
              key={day}
              className="w-3 h-3 text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center"
              style={{ visibility: index % 2 === 1 ? 'visible' : 'hidden' }}
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* ヒートマップ */}
        <div className="flex gap-1">
          {/* 月ラベル */}
          <div className="flex flex-col justify-between text-xs text-gray-600 dark:text-gray-400 pr-1">
            {monthLabels.map((month, index) => {
              // 約4週間ごとに表示
              const showLabel = index === 0 || heatmapData.some((week, weekIndex) => {
                if (weekIndex % 4 !== 0) return false;
                const firstDay = week.find(day => day);
                if (!firstDay) return false;
                const date = new Date(firstDay.date);
                return date.getMonth() === index;
              });
              
              return (
                <div
                  key={month}
                  className="h-12 flex items-center"
                  style={{ visibility: showLabel ? 'visible' : 'hidden' }}
                >
                  {month}
                </div>
              );
            })}
          </div>
          
          {/* セル */}
          <div className="flex gap-1">
            {heatmapData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return <div key={dayIndex} className="w-3 h-3" />;
                  }
                  
                  const level = getActivityLevel(day.questionsAnswered);
                  const date = new Date(day.date);
                  const dateStr = date.toLocaleDateString('ja-JP');
                  
                  return (
                    <div
                      key={day.date}
                      className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-blue-400 ${getCellColor(level)}`}
                      title={`${dateStr}\n問題数: ${day.questionsAnswered}\n正解率: ${day.accuracy.toFixed(1)}%`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        
        {/* 凡例 */}
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-600 dark:text-gray-400">
          <span>少</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className={`w-3 h-3 rounded-sm ${getCellColor(level)}`}
              />
            ))}
          </div>
          <span>多</span>
        </div>
      </div>
    </div>
  );
};