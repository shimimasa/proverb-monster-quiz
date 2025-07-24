import { RankingEntry, RankingData, RankingNotification, UserProgress } from '../types';
import { localStorageManager } from '../loaders/localStorageManager';

export class RankingManager {
  private static readonly RANKING_KEY = 'quiz_rankings';
  private static readonly MAX_ENTRIES_PER_CATEGORY = 100;
  private static readonly TOP_RANKS_FOR_NOTIFICATION = [1, 3, 10];

  private rankingData: RankingData;

  constructor() {
    this.rankingData = this.loadRankings();
  }

  private loadRankings(): RankingData {
    const savedData = localStorageManager.get(RankingManager.RANKING_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      return {
        ...parsed,
        lastUpdated: new Date(parsed.lastUpdated),
        dailyRankings: this.parseRankingEntries(parsed.dailyRankings),
        weeklyRankings: this.parseRankingEntries(parsed.weeklyRankings),
        allTimeRankings: this.parseRankingEntries(parsed.allTimeRankings),
      };
    }

    return {
      dailyRankings: [],
      weeklyRankings: [],
      allTimeRankings: [],
      lastUpdated: new Date(),
    };
  }

  private parseRankingEntries(entries: any[]): RankingEntry[] {
    return entries.map(entry => ({
      ...entry,
      dateAchieved: new Date(entry.dateAchieved),
    }));
  }

  private saveRankings(): void {
    localStorageManager.set(RankingManager.RANKING_KEY, JSON.stringify(this.rankingData));
  }

  public submitScore(
    playerName: string,
    progress: UserProgress,
    monstersCollected: number
  ): RankingNotification[] {
    const now = new Date();
    const score = this.calculateScore(progress, monstersCollected);
    
    const newEntry: RankingEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerName,
      score,
      level: progress.level,
      correctAnswers: progress.correctAnswers,
      totalQuestions: progress.totalQuestions,
      accuracy: progress.totalQuestions > 0 
        ? Math.round((progress.correctAnswers / progress.totalQuestions) * 100) 
        : 0,
      monstersCollected,
      dateAchieved: now,
    };

    const notifications: RankingNotification[] = [];

    // デイリーランキングの更新
    this.cleanupDailyRankings();
    const dailyNotification = this.updateRanking(
      newEntry,
      this.rankingData.dailyRankings,
      'daily'
    );
    if (dailyNotification) notifications.push(dailyNotification);

    // ウィークリーランキングの更新
    this.cleanupWeeklyRankings();
    const weeklyNotification = this.updateRanking(
      newEntry,
      this.rankingData.weeklyRankings,
      'weekly'
    );
    if (weeklyNotification) notifications.push(weeklyNotification);

    // 全期間ランキングの更新
    const allTimeNotification = this.updateRanking(
      newEntry,
      this.rankingData.allTimeRankings,
      'all_time'
    );
    if (allTimeNotification) notifications.push(allTimeNotification);

    this.rankingData.lastUpdated = now;
    this.saveRankings();

    return notifications;
  }

  private calculateScore(progress: UserProgress, monstersCollected: number): number {
    const baseScore = progress.correctAnswers * 100;
    const accuracyBonus = Math.round(
      (progress.correctAnswers / Math.max(progress.totalQuestions, 1)) * 1000
    );
    const levelBonus = progress.level * 50;
    const monsterBonus = monstersCollected * 25;
    const streakBonus = progress.streak * 10;

    return baseScore + accuracyBonus + levelBonus + monsterBonus + streakBonus;
  }

  private updateRanking(
    entry: RankingEntry,
    rankings: RankingEntry[],
    category: 'daily' | 'weekly' | 'all_time'
  ): RankingNotification | null {
    const previousRank = rankings.findIndex(r => r.playerName === entry.playerName) + 1;
    
    // 既存のエントリを削除（同じプレイヤー名）
    const filteredRankings = rankings.filter(r => r.playerName !== entry.playerName);
    
    // 新しいエントリを追加してソート
    filteredRankings.push(entry);
    filteredRankings.sort((a, b) => b.score - a.score);
    
    // 最大エントリ数を超えたら削除
    if (filteredRankings.length > RankingManager.MAX_ENTRIES_PER_CATEGORY) {
      filteredRankings.splice(RankingManager.MAX_ENTRIES_PER_CATEGORY);
    }
    
    // ランキングを更新
    rankings.length = 0;
    rankings.push(...filteredRankings);
    
    // 新しいランクを取得
    const newRank = rankings.findIndex(r => r.id === entry.id) + 1;
    
    // 通知を生成
    if (newRank === 0) return null; // ランキング外
    
    let notificationType: RankingNotification['type'] = 'new_record';
    let message = '';
    
    if (newRank === 1) {
      notificationType = 'first_place';
      message = `${this.getCategoryName(category)}ランキング1位獲得！`;
    } else if (newRank <= 3) {
      notificationType = 'top_3';
      message = `${this.getCategoryName(category)}ランキング${newRank}位にランクイン！`;
    } else if (newRank <= 10) {
      notificationType = 'top_10';
      message = `${this.getCategoryName(category)}ランキングTOP10入り！`;
    } else if (previousRank === 0 || newRank < previousRank) {
      notificationType = 'rank_up';
      message = previousRank === 0
        ? `${this.getCategoryName(category)}ランキング${newRank}位にランクイン！`
        : `${this.getCategoryName(category)}ランキング${previousRank}位→${newRank}位に上昇！`;
    } else {
      return null; // ランクダウンの場合は通知しない
    }
    
    return {
      type: notificationType,
      previousRank: previousRank || undefined,
      newRank,
      category,
      message,
    };
  }

  private getCategoryName(category: 'daily' | 'weekly' | 'all_time'): string {
    switch (category) {
      case 'daily':
        return 'デイリー';
      case 'weekly':
        return 'ウィークリー';
      case 'all_time':
        return '全期間';
    }
  }

  private cleanupDailyRankings(): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    this.rankingData.dailyRankings = this.rankingData.dailyRankings.filter(
      entry => entry.dateAchieved >= today
    );
  }

  private cleanupWeeklyRankings(): void {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    this.rankingData.weeklyRankings = this.rankingData.weeklyRankings.filter(
      entry => entry.dateAchieved >= weekAgo
    );
  }

  public getRankings(): RankingData {
    this.cleanupDailyRankings();
    this.cleanupWeeklyRankings();
    return { ...this.rankingData };
  }

  public getPlayerRank(playerName: string, category: 'daily' | 'weekly' | 'all_time'): number {
    const rankings = this.getRankingsByCategory(category);
    const index = rankings.findIndex(r => r.playerName === playerName);
    return index === -1 ? 0 : index + 1;
  }

  private getRankingsByCategory(category: 'daily' | 'weekly' | 'all_time'): RankingEntry[] {
    switch (category) {
      case 'daily':
        return this.rankingData.dailyRankings;
      case 'weekly':
        return this.rankingData.weeklyRankings;
      case 'all_time':
        return this.rankingData.allTimeRankings;
    }
  }

  public exportRankingData(): string {
    const exportData = {
      exportDate: new Date().toISOString(),
      rankings: this.rankingData,
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  public exportRankingCSV(category: 'daily' | 'weekly' | 'all_time'): string {
    const rankings = this.getRankingsByCategory(category);
    const headers = [
      '順位',
      'プレイヤー名',
      'スコア',
      'レベル',
      '正解数',
      '総問題数',
      '正答率',
      'モンスター数',
      '達成日時',
    ];
    
    const rows = rankings.map((entry, index) => [
      index + 1,
      entry.playerName,
      entry.score,
      entry.level,
      entry.correctAnswers,
      entry.totalQuestions,
      `${entry.accuracy}%`,
      entry.monstersCollected,
      entry.dateAchieved.toLocaleString('ja-JP'),
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');
    
    return csvContent;
  }
}

export const rankingManager = new RankingManager();