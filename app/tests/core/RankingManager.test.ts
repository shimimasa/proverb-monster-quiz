import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RankingManager } from '../../src/core/RankingManager';
import { localStorageManager } from '../../src/loaders/localStorageManager';
import type { UserProgress, RankingEntry } from '../../src/types';

// LocalStorageManagerをモック
vi.mock('../../src/loaders/localStorageManager', () => ({
  localStorageManager: {
    get: vi.fn(),
    set: vi.fn(),
  }
}));

describe('RankingManager', () => {
  let rankingManager: RankingManager;
  let mockLocalStorage: Record<string, string> = {};
  
  const createUserProgress = (overrides?: Partial<UserProgress>): UserProgress => ({
    level: 5,
    experience: 500,
    totalQuestions: 100,
    correctAnswers: 80,
    streak: 10,
    maxStreak: 15,
    lastPlayDate: new Date().toISOString(),
    playerName: 'テストプレイヤー',
    ...overrides
  });

  beforeEach(() => {
    mockLocalStorage = {};
    vi.clearAllMocks();
    
    // LocalStorageManagerのモック実装
    vi.mocked(localStorageManager.get).mockImplementation((key: string) => {
      return mockLocalStorage[key] || null;
    });
    
    vi.mocked(localStorageManager.set).mockImplementation((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });
    
    rankingManager = new RankingManager();
  });

  describe('初期化', () => {
    it('保存されたランキングデータがない場合、空のランキングで初期化される', () => {
      const rankings = rankingManager.getRankings();
      
      expect(rankings.dailyRankings).toEqual([]);
      expect(rankings.weeklyRankings).toEqual([]);
      expect(rankings.allTimeRankings).toEqual([]);
      expect(rankings.lastUpdated).toBeInstanceOf(Date);
    });

    it('保存されたランキングデータがある場合、それを読み込む', () => {
      const mockData = {
        dailyRankings: [{
          id: 'test-1',
          playerName: 'プレイヤー1',
          score: 1000,
          level: 5,
          correctAnswers: 50,
          totalQuestions: 60,
          accuracy: 83,
          monstersCollected: 10,
          dateAchieved: new Date().toISOString()
        }],
        weeklyRankings: [],
        allTimeRankings: [],
        lastUpdated: new Date().toISOString()
      };
      
      mockLocalStorage['quiz_rankings'] = JSON.stringify(mockData);
      rankingManager = new RankingManager();
      
      const rankings = rankingManager.getRankings();
      expect(rankings.dailyRankings).toHaveLength(1);
      expect(rankings.dailyRankings[0].playerName).toBe('プレイヤー1');
    });
  });

  describe('スコア計算', () => {
    it('正しくスコアを計算する', () => {
      const progress = createUserProgress({
        correctAnswers: 50,
        totalQuestions: 60,
        level: 10,
        streak: 5
      });
      const monstersCollected = 20;
      
      // スコア計算: 基本(50*100) + 正答率ボーナス(833) + レベル(10*50) + モンスター(20*25) + 連続(5*10)
      const expectedScore = 5000 + 833 + 500 + 500 + 50;
      
      const notifications = rankingManager.submitScore('テストプレイヤー', progress, monstersCollected);
      const rankings = rankingManager.getRankings();
      
      expect(rankings.allTimeRankings[0].score).toBe(expectedScore);
    });
  });

  describe('スコア登録', () => {
    it('新規プレイヤーのスコアを全カテゴリーに登録する', () => {
      const progress = createUserProgress();
      const notifications = rankingManager.submitScore('新規プレイヤー', progress, 15);
      
      const rankings = rankingManager.getRankings();
      
      expect(rankings.dailyRankings).toHaveLength(1);
      expect(rankings.weeklyRankings).toHaveLength(1);
      expect(rankings.allTimeRankings).toHaveLength(1);
      
      expect(rankings.dailyRankings[0].playerName).toBe('新規プレイヤー');
      expect(rankings.weeklyRankings[0].playerName).toBe('新規プレイヤー');
      expect(rankings.allTimeRankings[0].playerName).toBe('新規プレイヤー');
    });

    it('同じプレイヤーの新しいスコアで既存のエントリを更新する', () => {
      const progress1 = createUserProgress({ correctAnswers: 50 });
      const progress2 = createUserProgress({ correctAnswers: 80 });
      
      rankingManager.submitScore('プレイヤーA', progress1, 10);
      rankingManager.submitScore('プレイヤーA', progress2, 20);
      
      const rankings = rankingManager.getRankings();
      
      expect(rankings.allTimeRankings).toHaveLength(1);
      expect(rankings.allTimeRankings[0].correctAnswers).toBe(80);
    });

    it('スコア順に正しくソートされる', () => {
      const players = [
        { name: 'プレイヤー1', correctAnswers: 30 },
        { name: 'プレイヤー2', correctAnswers: 50 },
        { name: 'プレイヤー3', correctAnswers: 40 }
      ];
      
      players.forEach(player => {
        const progress = createUserProgress({ correctAnswers: player.correctAnswers });
        rankingManager.submitScore(player.name, progress, 10);
      });
      
      const rankings = rankingManager.getRankings();
      
      expect(rankings.allTimeRankings[0].playerName).toBe('プレイヤー2');
      expect(rankings.allTimeRankings[1].playerName).toBe('プレイヤー3');
      expect(rankings.allTimeRankings[2].playerName).toBe('プレイヤー1');
    });
  });

  describe('ランキング通知', () => {
    it('1位獲得時に適切な通知を返す', () => {
      const progress = createUserProgress();
      const notifications = rankingManager.submitScore('チャンピオン', progress, 50);
      
      const firstPlaceNotifications = notifications.filter(n => n.type === 'first_place');
      expect(firstPlaceNotifications).toHaveLength(3); // daily, weekly, all_time
      expect(firstPlaceNotifications[0].newRank).toBe(1);
      expect(firstPlaceNotifications[0].message).toContain('1位獲得');
    });

    it('トップ3入りで適切な通知を返す', () => {
      // 先に2人のプレイヤーを登録
      for (let i = 1; i <= 2; i++) {
        const progress = createUserProgress({ correctAnswers: 100 - i * 10 });
        rankingManager.submitScore(`プレイヤー${i}`, progress, 30);
      }
      
      // 3位のプレイヤーを登録
      const progress = createUserProgress({ correctAnswers: 70 });
      const notifications = rankingManager.submitScore('新プレイヤー', progress, 25);
      
      const top3Notifications = notifications.filter(n => n.type === 'top_3');
      expect(top3Notifications.length).toBeGreaterThan(0);
      expect(top3Notifications[0].newRank).toBe(3);
    });

    it('ランクアップ時に適切な通知を返す', () => {
      // 先に低スコアで登録
      const progress1 = createUserProgress({ correctAnswers: 30 });
      rankingManager.submitScore('成長プレイヤー', progress1, 10);
      
      // 他のプレイヤーを追加
      for (let i = 1; i <= 3; i++) {
        const progress = createUserProgress({ correctAnswers: 40 + i * 10 });
        rankingManager.submitScore(`他プレイヤー${i}`, progress, 15);
      }
      
      // 高スコアで再登録
      const progress2 = createUserProgress({ correctAnswers: 80 });
      const notifications = rankingManager.submitScore('成長プレイヤー', progress2, 30);
      
      const rankUpNotifications = notifications.filter(n => n.type === 'rank_up' || n.type === 'top_3' || n.type === 'first_place');
      expect(rankUpNotifications.length).toBeGreaterThan(0);
    });
  });

  describe('ランキングのクリーンアップ', () => {
    it('デイリーランキングから古いエントリを削除する', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const mockData = {
        dailyRankings: [
          {
            id: 'old-entry',
            playerName: '昨日のプレイヤー',
            score: 1000,
            level: 5,
            correctAnswers: 50,
            totalQuestions: 60,
            accuracy: 83,
            monstersCollected: 10,
            dateAchieved: yesterday.toISOString()
          }
        ],
        weeklyRankings: [],
        allTimeRankings: [],
        lastUpdated: new Date().toISOString()
      };
      
      mockLocalStorage['quiz_rankings'] = JSON.stringify(mockData);
      rankingManager = new RankingManager();
      
      const rankings = rankingManager.getRankings();
      expect(rankings.dailyRankings).toHaveLength(0);
    });

    it('ウィークリーランキングから1週間以上前のエントリを削除する', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      const mockData = {
        dailyRankings: [],
        weeklyRankings: [
          {
            id: 'old-entry',
            playerName: '2週間前のプレイヤー',
            score: 1000,
            level: 5,
            correctAnswers: 50,
            totalQuestions: 60,
            accuracy: 83,
            monstersCollected: 10,
            dateAchieved: twoWeeksAgo.toISOString()
          }
        ],
        allTimeRankings: [],
        lastUpdated: new Date().toISOString()
      };
      
      mockLocalStorage['quiz_rankings'] = JSON.stringify(mockData);
      rankingManager = new RankingManager();
      
      const rankings = rankingManager.getRankings();
      expect(rankings.weeklyRankings).toHaveLength(0);
    });
  });

  describe('プレイヤーランク取得', () => {
    it('ランキングに存在するプレイヤーの正しいランクを返す', () => {
      const players = ['プレイヤーA', 'プレイヤーB', 'プレイヤーC'];
      
      players.forEach((name, index) => {
        const progress = createUserProgress({ correctAnswers: 90 - index * 20 });
        rankingManager.submitScore(name, progress, 20);
      });
      
      expect(rankingManager.getPlayerRank('プレイヤーA', 'all_time')).toBe(1);
      expect(rankingManager.getPlayerRank('プレイヤーB', 'all_time')).toBe(2);
      expect(rankingManager.getPlayerRank('プレイヤーC', 'all_time')).toBe(3);
    });

    it('ランキングに存在しないプレイヤーは0を返す', () => {
      expect(rankingManager.getPlayerRank('存在しないプレイヤー', 'all_time')).toBe(0);
    });
  });

  describe('データエクスポート', () => {
    it('JSON形式でランキングデータをエクスポートできる', () => {
      const progress = createUserProgress();
      rankingManager.submitScore('エクスポートテスト', progress, 25);
      
      const exportedData = rankingManager.exportRankingData();
      const parsed = JSON.parse(exportedData);
      
      expect(parsed.exportDate).toBeDefined();
      expect(parsed.rankings).toBeDefined();
      expect(parsed.rankings.allTimeRankings).toHaveLength(1);
    });

    it('CSV形式でランキングデータをエクスポートできる', () => {
      const players = [
        { name: 'プレイヤー1', correctAnswers: 80, monsters: 20 },
        { name: 'プレイヤー2', correctAnswers: 70, monsters: 15 }
      ];
      
      players.forEach(player => {
        const progress = createUserProgress({ 
          correctAnswers: player.correctAnswers,
          playerName: player.name 
        });
        rankingManager.submitScore(player.name, progress, player.monsters);
      });
      
      const csv = rankingManager.exportRankingCSV('all_time');
      const lines = csv.split('\n');
      
      expect(lines[0]).toContain('順位,プレイヤー名,スコア');
      expect(lines[1]).toContain('1,プレイヤー1');
      expect(lines[2]).toContain('2,プレイヤー2');
    });
  });

  describe('最大エントリ数の制限', () => {
    it('カテゴリーごとに最大100エントリまでに制限される', () => {
      // 101人のプレイヤーを登録
      for (let i = 1; i <= 101; i++) {
        const progress = createUserProgress({ 
          correctAnswers: 101 - i,
          playerName: `プレイヤー${i}`
        });
        rankingManager.submitScore(`プレイヤー${i}`, progress, 10);
      }
      
      const rankings = rankingManager.getRankings();
      
      expect(rankings.dailyRankings).toHaveLength(100);
      expect(rankings.weeklyRankings).toHaveLength(100);
      expect(rankings.allTimeRankings).toHaveLength(100);
      
      // 最下位のプレイヤーが含まれていないことを確認
      const lastPlayerInRanking = rankings.allTimeRankings.find(r => r.playerName === 'プレイヤー101');
      expect(lastPlayerInRanking).toBeUndefined();
    });
  });
});