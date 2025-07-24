import type { 
  LearningAnalytics, 
  DailyStats, 
  WeeklyTrend, 
  CategoryPerformance,
  LearningPattern,
  LearningInsight 
} from '@/types/analytics';
import type { ProgressManager } from '@/core/ProgressManager';
import type { LearningHistoryManager } from '@/core/LearningHistoryManager';

export async function generateLearningAnalytics(
  progressManager: ProgressManager,
  historyManager: LearningHistoryManager,
  period: 'week' | 'month' | 'all'
): Promise<LearningAnalytics> {
  const progress = progressManager.getProgress();
  const detailedStats = progressManager.getDetailedStats();
  const progressStats = progressManager.getProgressStats();
  const sessions = progressManager.getRecentSessions(period === 'all' ? 1000 : period === 'month' ? 30 : 7);
  
  // 日次統計を生成
  const dailyStats = generateDailyStats(sessions, period);
  
  // 週次トレンドを計算
  const weeklyTrends = generateWeeklyTrends(dailyStats);
  
  // カテゴリー別パフォーマンス
  const categoryPerformance = generateCategoryPerformance(detailedStats);
  
  // 学習パターンの分析
  const learningPatterns = analyzeLearningPatterns(sessions, dailyStats);
  
  // インサイトの生成
  const insights = generateInsights(
    progress,
    dailyStats,
    categoryPerformance,
    learningPatterns
  );
  
  // 概要データ
  const overview = {
    totalDays: dailyStats.length,
    totalQuestions: progress.totalQuestions,
    totalCorrect: progress.correctAnswers,
    overallAccuracy: progress.totalQuestions > 0 
      ? (progress.correctAnswers / progress.totalQuestions) * 100 
      : 0,
    totalStudyTime: calculateTotalStudyTime(sessions),
    currentStreak: calculateCurrentStreak(dailyStats),
    longestStreak: progress.maxStreak,
  };
  
  return {
    overview,
    dailyStats,
    weeklyTrends,
    categoryPerformance,
    learningPatterns,
    insights,
  };
}

function generateDailyStats(
  sessions: any[],
  period: 'week' | 'month' | 'all'
): DailyStats[] {
  const stats = new Map<string, DailyStats>();
  const today = new Date();
  const startDate = new Date(today);
  
  if (period === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === 'month') {
    startDate.setDate(startDate.getDate() - 30);
  } else {
    startDate.setDate(startDate.getDate() - 365);
  }
  
  // セッションから日次データを集計
  sessions.forEach(session => {
    const date = new Date(session.startTime).toISOString().split('T')[0];
    
    if (!stats.has(date)) {
      stats.set(date, {
        date,
        questionsAnswered: 0,
        correctAnswers: 0,
        accuracy: 0,
        studyTime: 0,
        contentTypes: [],
        streakCount: 0,
        monstersUnlocked: 0,
      });
    }
    
    const dayStats = stats.get(date)!;
    dayStats.questionsAnswered += session.questions.length;
    dayStats.correctAnswers += session.answers.filter((a: any) => a.isCorrect).length;
    
    if (session.endTime) {
      const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
      dayStats.studyTime += Math.round(duration / 60000); // 分に変換
    }
    
    // コンテンツタイプを追加
    session.questions.forEach((q: any) => {
      if (q.contentItem && !dayStats.contentTypes.includes(q.contentItem.type)) {
        dayStats.contentTypes.push(q.contentItem.type);
      }
    });
    
    dayStats.monstersUnlocked += session.monstersUnlocked?.length || 0;
  });
  
  // 正解率を計算
  stats.forEach(dayStats => {
    if (dayStats.questionsAnswered > 0) {
      dayStats.accuracy = (dayStats.correctAnswers / dayStats.questionsAnswered) * 100;
    }
  });
  
  return Array.from(stats.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function generateWeeklyTrends(dailyStats: DailyStats[]): WeeklyTrend[] {
  const trends: WeeklyTrend[] = [];
  const weeks = new Map<string, DailyStats[]>();
  
  // 日次データを週ごとにグループ化
  dailyStats.forEach(stat => {
    const date = new Date(stat.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // 日曜日開始
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, []);
    }
    weeks.get(weekKey)!.push(stat);
  });
  
  // 各週のトレンドを計算
  weeks.forEach((weekStats, weekStart) => {
    const totalQuestions = weekStats.reduce((sum, stat) => sum + stat.questionsAnswered, 0);
    const totalCorrect = weekStats.reduce((sum, stat) => sum + stat.correctAnswers, 0);
    const totalStudyTime = weekStats.reduce((sum, stat) => sum + stat.studyTime, 0);
    
    // 最もアクティブな日を特定
    const mostActiveDay = weekStats.reduce((prev, current) => 
      current.questionsAnswered > (prev?.questionsAnswered || 0) ? current : prev
    , weekStats[0]);
    
    // コンテンツタイプ分布
    const contentTypeDistribution: Record<string, number> = {
      proverb: 0,
      idiom: 0,
      four_character_idiom: 0,
    };
    
    weekStats.forEach(stat => {
      stat.contentTypes.forEach(type => {
        if (type in contentTypeDistribution) {
          contentTypeDistribution[type as keyof typeof contentTypeDistribution]++;
        }
      });
    });
    
    trends.push({
      weekStartDate: weekStart,
      totalQuestions,
      totalCorrect,
      averageAccuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
      totalStudyTime,
      mostActiveDay: new Date(mostActiveDay.date).toLocaleDateString('ja-JP', { weekday: 'long' }),
      contentTypeDistribution: contentTypeDistribution as any,
    });
  });
  
  return trends.sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));
}

function generateCategoryPerformance(detailedStats: any): CategoryPerformance[] {
  const { byContentType } = detailedStats;
  const performance: CategoryPerformance[] = [];
  
  Object.entries(byContentType).forEach(([type, stats]: [string, any]) => {
    if (stats.attempts > 0) {
      performance.push({
        contentType: type as any,
        totalAttempts: stats.attempts,
        correctAnswers: stats.correct,
        accuracy: stats.accuracy,
        averageResponseTime: 0, // TODO: 実装
        improvementRate: 0, // TODO: 前週比を計算
        weakAreas: [], // TODO: 苦手分野を特定
      });
    }
  });
  
  return performance;
}

function analyzeLearningPatterns(
  sessions: any[],
  dailyStats: DailyStats[]
): LearningPattern {
  // 時間帯別のパフォーマンスを分析
  const hourlyPerformance = new Map<number, { total: number; correct: number }>();
  
  sessions.forEach(session => {
    const hour = new Date(session.startTime).getHours();
    if (!hourlyPerformance.has(hour)) {
      hourlyPerformance.set(hour, { total: 0, correct: 0 });
    }
    
    const perf = hourlyPerformance.get(hour)!;
    perf.total += session.questions.length;
    perf.correct += session.answers.filter((a: any) => a.isCorrect).length;
  });
  
  // 最も生産的な時間を特定
  let mostProductiveHour = 0;
  let maxProductivity = 0;
  
  hourlyPerformance.forEach((perf, hour) => {
    const productivity = perf.total > 0 ? (perf.correct / perf.total) * perf.total : 0;
    if (productivity > maxProductivity) {
      maxProductivity = productivity;
      mostProductiveHour = hour;
    }
  });
  
  // 平均セッション時間
  const totalDuration = sessions.reduce((sum, session) => {
    if (session.endTime) {
      return sum + (new Date(session.endTime).getTime() - new Date(session.startTime).getTime());
    }
    return sum;
  }, 0);
  
  const averageSessionDuration = sessions.length > 0 
    ? Math.round(totalDuration / sessions.length / 60000) 
    : 0;
  
  // 継続スコアを計算（連続学習日数の割合）
  const activeDays = dailyStats.filter(stat => stat.questionsAnswered > 0).length;
  const totalDays = dailyStats.length;
  const consistencyScore = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;
  
  return {
    mostProductiveHour,
    averageSessionDuration,
    preferredContentTypes: [], // TODO: 実装
    consistencyScore,
    breakPattern: consistencyScore > 80 ? 'rare' : consistencyScore > 50 ? 'moderate' : 'frequent',
  };
}

function generateInsights(
  progress: any,
  dailyStats: DailyStats[],
  categoryPerformance: CategoryPerformance[],
  learningPatterns: LearningPattern
): LearningInsight[] {
  const insights: LearningInsight[] = [];
  
  // 連続記録に関するインサイト
  if (progress.currentStreak >= 7) {
    insights.push({
      id: 'streak-achievement',
      type: 'achievement',
      title: `${progress.currentStreak}日連続学習中！`,
      description: '素晴らしい継続力です。この調子で頑張りましょう！',
      icon: '🔥',
      priority: 'high',
      actionable: false,
    });
  }
  
  // パフォーマンスに関するインサイト
  const weakestCategory = categoryPerformance.reduce((prev, current) => 
    current.accuracy < (prev?.accuracy || 100) ? current : prev
  , categoryPerformance[0]);
  
  if (weakestCategory && weakestCategory.accuracy < 70) {
    insights.push({
      id: 'weak-category',
      type: 'suggestion',
      title: `${getContentTypeName(weakestCategory.contentType)}の練習が必要です`,
      description: `正解率が${weakestCategory.accuracy.toFixed(1)}%と低めです。集中的に練習しましょう。`,
      icon: '💡',
      priority: 'medium',
      actionable: true,
      action: {
        label: '練習を開始',
        type: 'practice',
        payload: { contentType: weakestCategory.contentType },
      },
    });
  }
  
  // 学習パターンに関するインサイト
  if (learningPatterns.consistencyScore < 50) {
    insights.push({
      id: 'consistency-warning',
      type: 'warning',
      title: '学習頻度が低下しています',
      description: '毎日少しずつでも継続することが大切です。目標を設定しましょう。',
      icon: '⚠️',
      priority: 'high',
      actionable: true,
      action: {
        label: '目標を設定',
        type: 'setting',
        payload: { section: 'goals' },
      },
    });
  }
  
  // マイルストーン
  if (progress.totalQuestions >= 100 && progress.totalQuestions % 100 === 0) {
    insights.push({
      id: `milestone-${progress.totalQuestions}`,
      type: 'milestone',
      title: `${progress.totalQuestions}問達成！`,
      description: '大きなマイルストーンを達成しました。おめでとうございます！',
      icon: '🎆',
      priority: 'medium',
      actionable: false,
    });
  }
  
  return insights;
}

function calculateTotalStudyTime(sessions: any[]): number {
  return sessions.reduce((total, session) => {
    if (session.endTime) {
      const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
      return total + Math.round(duration / 60000);
    }
    return total;
  }, 0);
}

function calculateCurrentStreak(dailyStats: DailyStats[]): number {
  const today = new Date().toISOString().split('T')[0];
  let streak = 0;
  
  // 今日から遡って連続日数をカウント
  for (let i = dailyStats.length - 1; i >= 0; i--) {
    const stat = dailyStats[i];
    const statDate = new Date(stat.date);
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - (dailyStats.length - 1 - i));
    
    if (stat.date === expectedDate.toISOString().split('T')[0] && stat.questionsAnswered > 0) {
      streak++;
    } else if (streak > 0) {
      break; // 連続が途切れた
    }
  }
  
  return streak;
}

function getContentTypeName(type: string): string {
  const names: Record<string, string> = {
    proverb: 'ことわざ',
    idiom: '慣用句',
    four_character_idiom: '四字熟語',
  };
  return names[type] || type;
}