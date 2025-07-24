import type { ContentType, Difficulty } from './index';

// 日次統計
export interface DailyStats {
  date: string;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  studyTime: number; // 分単位
  contentTypes: ContentType[];
  streakCount: number;
  monstersUnlocked: number;
}

// 週次トレンド
export interface WeeklyTrend {
  weekStartDate: string;
  totalQuestions: number;
  totalCorrect: number;
  averageAccuracy: number;
  totalStudyTime: number;
  mostActiveDay: string;
  contentTypeDistribution: Record<ContentType, number>;
}

// カテゴリー別パフォーマンス
export interface CategoryPerformance {
  contentType: ContentType;
  totalAttempts: number;
  correctAnswers: number;
  accuracy: number;
  averageResponseTime: number;
  improvementRate: number; // 前週比
  weakAreas: string[]; // 苦手な内容
}

// 学習パターン
export interface LearningPattern {
  mostProductiveHour: number; // 0-23
  averageSessionDuration: number; // 分単位
  preferredContentTypes: ContentType[];
  consistencyScore: number; // 0-100
  breakPattern: 'frequent' | 'moderate' | 'rare';
}

// 学習インサイト
export interface LearningInsight {
  id: string;
  type: 'achievement' | 'suggestion' | 'warning' | 'milestone';
  title: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  action?: {
    label: string;
    type: 'navigate' | 'setting' | 'practice';
    payload?: any;
  };
}

// 学習分析データ
export interface LearningAnalytics {
  overview: {
    totalDays: number;
    totalQuestions: number;
    totalCorrect: number;
    overallAccuracy: number;
    totalStudyTime: number;
    currentStreak: number;
    longestStreak: number;
  };
  dailyStats: DailyStats[];
  weeklyTrends: WeeklyTrend[];
  categoryPerformance: CategoryPerformance[];
  learningPatterns: LearningPattern;
  insights: LearningInsight[];
}

// レポート設定
export interface ReportConfig {
  period: 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
  includeGraphs: boolean;
  includeInsights: boolean;
  format: 'pdf' | 'csv' | 'json';
}

// グラフデータ
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

// ヒートマップデータ
export interface HeatmapData {
  date: string;
  value: number;
  level: 0 | 1 | 2 | 3 | 4; // GitHubスタイルのレベル
}

// 目標設定
export interface LearningGoal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  metric: 'questions' | 'accuracy' | 'time' | 'streak';
  target: number;
  current: number;
  achieved: boolean;
  createdAt: string;
  deadline: string;
}

// 学習セッション詳細
export interface StudySession {
  id: string;
  startTime: string;
  endTime: string;
  duration: number; // 分単位
  questionsAnswered: number;
  correctAnswers: number;
  contentTypes: ContentType[];
  averageResponseTime: number;
  focusScore: number; // 0-100
}