import { LearningHistory, LearningStats, ContentType, UserAnswer } from '../types';
import { localStorageManager } from '../loaders/localStorageManager';

export class LearningHistoryManager {
  private static readonly HISTORY_KEY = 'learning_history';
  private static readonly SESSION_KEY = 'current_session';
  private static readonly MAX_DAILY_HISTORY = 90; // 3 months

  private history: LearningHistory[] = [];
  private currentSession: {
    startTime: Date;
    questionsAnswered: number;
    correctAnswers: number;
    contentBreakdown: {
      proverb: { total: number; correct: number };
      idiom: { total: number; correct: number };
      four_character_idiom: { total: number; correct: number };
    };
    monstersUnlocked: number;
    startLevel: number;
  } | null = null;

  constructor() {
    this.loadHistory();
    this.loadCurrentSession();
  }

  private loadHistory(): void {
    const savedHistory = localStorageManager.get(LearningHistoryManager.HISTORY_KEY);
    if (savedHistory) {
      this.history = JSON.parse(savedHistory).map((entry: any) => ({
        ...entry,
        date: new Date(entry.date)
      }));
    }
  }

  private loadCurrentSession(): void {
    const savedSession = localStorageManager.get(LearningHistoryManager.SESSION_KEY);
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      this.currentSession = {
        ...parsed,
        startTime: new Date(parsed.startTime)
      };
    }
  }

  private saveHistory(): void {
    // Keep only recent history
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - LearningHistoryManager.MAX_DAILY_HISTORY);
    
    this.history = this.history.filter(entry => entry.date >= cutoffDate);
    
    localStorageManager.set(
      LearningHistoryManager.HISTORY_KEY,
      JSON.stringify(this.history)
    );
  }

  private saveCurrentSession(): void {
    if (this.currentSession) {
      localStorageManager.set(
        LearningHistoryManager.SESSION_KEY,
        JSON.stringify(this.currentSession)
      );
    }
  }

  public startSession(currentLevel: number): void {
    this.currentSession = {
      startTime: new Date(),
      questionsAnswered: 0,
      correctAnswers: 0,
      contentBreakdown: {
        proverb: { total: 0, correct: 0 },
        idiom: { total: 0, correct: 0 },
        four_character_idiom: { total: 0, correct: 0 }
      },
      monstersUnlocked: 0,
      startLevel: currentLevel
    };
    this.saveCurrentSession();
  }

  public recordAnswer(contentType: ContentType, isCorrect: boolean): void {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.currentSession.questionsAnswered++;
    if (isCorrect) {
      this.currentSession.correctAnswers++;
    }

    this.currentSession.contentBreakdown[contentType].total++;
    if (isCorrect) {
      this.currentSession.contentBreakdown[contentType].correct++;
    }

    this.saveCurrentSession();
  }

  public recordMonsterUnlock(): void {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.currentSession.monstersUnlocked++;
    this.saveCurrentSession();
  }

  public endSession(currentLevel: number): void {
    if (!this.currentSession) {
      return;
    }

    const sessionDuration = Math.round(
      (new Date().getTime() - this.currentSession.startTime.getTime()) / 60000
    );

    const todayEntry: LearningHistory = {
      date: new Date(),
      questionsAnswered: this.currentSession.questionsAnswered,
      correctAnswers: this.currentSession.correctAnswers,
      accuracy: this.currentSession.questionsAnswered > 0
        ? Math.round((this.currentSession.correctAnswers / this.currentSession.questionsAnswered) * 100)
        : 0,
      contentBreakdown: this.currentSession.contentBreakdown,
      sessionDuration,
      monstersUnlocked: this.currentSession.monstersUnlocked,
      levelProgress: {
        from: this.currentSession.startLevel,
        to: currentLevel
      }
    };

    // Merge with today's existing entry if exists
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingIndex = this.history.findIndex(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    if (existingIndex >= 0) {
      const existing = this.history[existingIndex];
      this.history[existingIndex] = {
        ...existing,
        questionsAnswered: existing.questionsAnswered + todayEntry.questionsAnswered,
        correctAnswers: existing.correctAnswers + todayEntry.correctAnswers,
        accuracy: Math.round(
          ((existing.correctAnswers + todayEntry.correctAnswers) /
            (existing.questionsAnswered + todayEntry.questionsAnswered)) * 100
        ),
        contentBreakdown: {
          proverb: {
            total: existing.contentBreakdown.proverb.total + todayEntry.contentBreakdown.proverb.total,
            correct: existing.contentBreakdown.proverb.correct + todayEntry.contentBreakdown.proverb.correct
          },
          idiom: {
            total: existing.contentBreakdown.idiom.total + todayEntry.contentBreakdown.idiom.total,
            correct: existing.contentBreakdown.idiom.correct + todayEntry.contentBreakdown.idiom.correct
          },
          four_character_idiom: {
            total: existing.contentBreakdown.four_character_idiom.total + todayEntry.contentBreakdown.four_character_idiom.total,
            correct: existing.contentBreakdown.four_character_idiom.correct + todayEntry.contentBreakdown.four_character_idiom.correct
          }
        },
        sessionDuration: existing.sessionDuration + todayEntry.sessionDuration,
        monstersUnlocked: existing.monstersUnlocked + todayEntry.monstersUnlocked,
        levelProgress: {
          from: existing.levelProgress.from,
          to: todayEntry.levelProgress.to
        }
      };
    } else {
      this.history.push(todayEntry);
    }

    this.saveHistory();
    this.currentSession = null;
    localStorageManager.remove(LearningHistoryManager.SESSION_KEY);
  }

  public getStats(): LearningStats {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Daily history (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailyHistory = this.history
      .filter(entry => entry.date >= thirtyDaysAgo)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Weekly stats
    const weeklyData = this.history.filter(entry => entry.date >= weekAgo);
    const weeklyStats = {
      totalQuestions: weeklyData.reduce((sum, entry) => sum + entry.questionsAnswered, 0),
      totalCorrect: weeklyData.reduce((sum, entry) => sum + entry.correctAnswers, 0),
      averageAccuracy: 0,
      mostActiveDay: '',
      totalStudyTime: weeklyData.reduce((sum, entry) => sum + entry.sessionDuration, 0)
    };

    if (weeklyStats.totalQuestions > 0) {
      weeklyStats.averageAccuracy = Math.round(
        (weeklyStats.totalCorrect / weeklyStats.totalQuestions) * 100
      );
    }

    // Find most active day
    const dayActivity = new Map<string, number>();
    weeklyData.forEach(entry => {
      const dayName = entry.date.toLocaleDateString('ja-JP', { weekday: 'long' });
      dayActivity.set(dayName, (dayActivity.get(dayName) || 0) + entry.questionsAnswered);
    });
    
    let maxActivity = 0;
    dayActivity.forEach((activity, day) => {
      if (activity > maxActivity) {
        maxActivity = activity;
        weeklyStats.mostActiveDay = day;
      }
    });

    // Monthly trends
    const monthlyTrends = this.calculateMonthlyTrends();

    // Category performance
    const categoryPerformance = this.calculateCategoryPerformance();

    return {
      dailyHistory,
      weeklyStats,
      monthlyTrends,
      categoryPerformance
    };
  }

  private calculateMonthlyTrends(): LearningStats['monthlyTrends'] {
    const monthlyData = new Map<string, { questions: number; correct: number }>();

    this.history.forEach(entry => {
      const monthKey = entry.date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
      const existing = monthlyData.get(monthKey) || { questions: 0, correct: 0 };
      monthlyData.set(monthKey, {
        questions: existing.questions + entry.questionsAnswered,
        correct: existing.correct + entry.correctAnswers
      });
    });

    const trends: LearningStats['monthlyTrends'] = [];
    monthlyData.forEach((data, month) => {
      trends.push({
        month,
        accuracy: data.questions > 0 ? Math.round((data.correct / data.questions) * 100) : 0,
        questionsAnswered: data.questions
      });
    });

    // Sort by date and take last 6 months
    return trends
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6);
  }

  private calculateCategoryPerformance(): LearningStats['categoryPerformance'] {
    const performance: Record<ContentType, {
      totalQuestions: number;
      correctAnswers: number;
      totalTime: number;
      sessions: number;
    }> = {
      proverb: { totalQuestions: 0, correctAnswers: 0, totalTime: 0, sessions: 0 },
      idiom: { totalQuestions: 0, correctAnswers: 0, totalTime: 0, sessions: 0 },
      four_character_idiom: { totalQuestions: 0, correctAnswers: 0, totalTime: 0, sessions: 0 }
    };

    this.history.forEach(entry => {
      Object.entries(entry.contentBreakdown).forEach(([type, data]) => {
        const contentType = type as ContentType;
        performance[contentType].totalQuestions += data.total;
        performance[contentType].correctAnswers += data.correct;
        if (data.total > 0) {
          performance[contentType].totalTime += entry.sessionDuration * (data.total / entry.questionsAnswered);
          performance[contentType].sessions++;
        }
      });
    });

    return Object.entries(performance).map(([type, data]) => ({
      type: type as ContentType,
      totalQuestions: data.totalQuestions,
      correctAnswers: data.correctAnswers,
      accuracy: data.totalQuestions > 0 
        ? Math.round((data.correctAnswers / data.totalQuestions) * 100) 
        : 0,
      averageTime: data.sessions > 0 
        ? Math.round(data.totalTime / data.sessions) 
        : 0
    }));
  }

  public exportHistory(): string {
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      history: this.history,
      stats: this.getStats()
    }, null, 2);
  }

  public getRecentSessions(limit: number = 100): any[] {
    // Convert history entries to session-like format
    return this.history
      .slice(-limit)
      .reverse()
      .map(entry => ({
        startTime: entry.date,
        endTime: new Date(entry.date.getTime() + entry.sessionDuration * 60000),
        totalQuestions: entry.questionsAnswered,
        correctAnswers: entry.correctAnswers,
        level: entry.levelProgress.to
      }));
  }

  public getDailyStats(days: number): any[] {
    const now = new Date();
    const startDate = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    
    const dailyMap = new Map<string, {
      sessions: number;
      totalQuestions: number;
      correctAnswers: number;
      totalDuration: number;
    }>();
    
    // Initialize all days with zero values
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dailyMap.set(dateKey, {
        sessions: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        totalDuration: 0
      });
    }
    
    // Fill with actual data
    this.history
      .filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= now;
      })
      .forEach(entry => {
        const entryDate = new Date(entry.date);
        const dateKey = entryDate.toISOString().split('T')[0];
        const existing = dailyMap.get(dateKey);
        if (existing) {
          existing.sessions++;
          existing.totalQuestions += entry.questionsAnswered;
          existing.correctAnswers += entry.correctAnswers;
          existing.totalDuration += entry.sessionDuration;
        }
      });
    
    return Array.from(dailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, stats]) => ({
        date,
        sessions: stats.sessions,
        totalQuestions: stats.totalQuestions,
        correctAnswers: stats.correctAnswers,
        accuracy: stats.totalQuestions > 0 
          ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
          : 0,
        totalDuration: stats.totalDuration
      }));
  }

  public getContentTypeStats(): Record<ContentType, {
    attempts: number;
    correct: number;
    accuracy: number;
  }> {
    const stats: Record<ContentType, {
      attempts: number;
      correct: number;
      accuracy: number;
    }> = {
      proverb: { attempts: 0, correct: 0, accuracy: 0 },
      idiom: { attempts: 0, correct: 0, accuracy: 0 },
      four_character_idiom: { attempts: 0, correct: 0, accuracy: 0 }
    };
    
    this.history.forEach(entry => {
      Object.entries(entry.contentBreakdown).forEach(([type, data]) => {
        const contentType = type as ContentType;
        stats[contentType].attempts += data.total;
        stats[contentType].correct += data.correct;
      });
    });
    
    // Calculate accuracy
    Object.keys(stats).forEach(type => {
      const typeStats = stats[type as ContentType];
      if (typeStats.attempts > 0) {
        typeStats.accuracy = Math.round((typeStats.correct / typeStats.attempts) * 100);
      }
    });
    
    return stats;
  }
}

export const learningHistoryManager = new LearningHistoryManager();