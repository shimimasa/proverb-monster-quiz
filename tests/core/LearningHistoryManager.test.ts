import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LearningHistoryManager } from '../../src/core/LearningHistoryManager';
import { localStorageManager } from '../../src/loaders/localStorageManager';
import type { ContentType, LearningHistory } from '../../src/types';

// LocalStorageManagerをモック
vi.mock('../../src/loaders/localStorageManager', () => ({
  localStorageManager: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  }
}));

describe('LearningHistoryManager', () => {
  let manager: LearningHistoryManager;
  let mockLocalStorage: Record<string, string> = {};
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage = {};
    
    // LocalStorageManagerのモック実装
    vi.mocked(localStorageManager.get).mockImplementation((key: string) => {
      return mockLocalStorage[key] || null;
    });
    
    vi.mocked(localStorageManager.set).mockImplementation((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });
    
    vi.mocked(localStorageManager.remove).mockImplementation((key: string) => {
      delete mockLocalStorage[key];
    });
    
    // 日付を固定
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));
    
    manager = new LearningHistoryManager();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('セッション管理', () => {
    it('新しいセッションを開始できる', () => {
      manager.startSession(5);
      
      expect(localStorageManager.set).toHaveBeenCalledWith(
        'current_session',
        expect.stringContaining('startTime')
      );
      
      const savedSession = JSON.parse(mockLocalStorage['current_session']);
      expect(savedSession.startLevel).toBe(5);
      expect(savedSession.questionsAnswered).toBe(0);
      expect(savedSession.correctAnswers).toBe(0);
    });

    it('アクティブなセッションがない場合、回答記録でエラーをスローする', () => {
      expect(() => {
        manager.recordAnswer('proverb', true);
      }).toThrowError('No active session');
    });

    it('セッションを終了し、履歴に保存できる', () => {
      manager.startSession(5);
      manager.recordAnswer('proverb', true);
      manager.recordAnswer('proverb', false);
      
      // 時間を30分進める
      vi.advanceTimersByTime(30 * 60 * 1000);
      
      manager.endSession(6);
      
      expect(localStorageManager.remove).toHaveBeenCalledWith('current_session');
      expect(localStorageManager.set).toHaveBeenCalledWith(
        'learning_history',
        expect.any(String)
      );
      
      const savedHistory = JSON.parse(mockLocalStorage['learning_history']);
      expect(savedHistory).toHaveLength(1);
      expect(savedHistory[0].questionsAnswered).toBe(2);
      expect(savedHistory[0].correctAnswers).toBe(1);
      expect(savedHistory[0].sessionDuration).toBe(30);
      expect(savedHistory[0].levelProgress.from).toBe(5);
      expect(savedHistory[0].levelProgress.to).toBe(6);
    });
  });

  describe('回答の記録', () => {
    beforeEach(() => {
      manager.startSession(5);
    });

    it('正解を記録できる', () => {
      manager.recordAnswer('proverb', true);
      
      const savedSession = JSON.parse(mockLocalStorage['current_session']);
      expect(savedSession.questionsAnswered).toBe(1);
      expect(savedSession.correctAnswers).toBe(1);
      expect(savedSession.contentBreakdown.proverb.total).toBe(1);
      expect(savedSession.contentBreakdown.proverb.correct).toBe(1);
    });

    it('不正解を記録できる', () => {
      manager.recordAnswer('idiom', false);
      
      const savedSession = JSON.parse(mockLocalStorage['current_session']);
      expect(savedSession.questionsAnswered).toBe(1);
      expect(savedSession.correctAnswers).toBe(0);
      expect(savedSession.contentBreakdown.idiom.total).toBe(1);
      expect(savedSession.contentBreakdown.idiom.correct).toBe(0);
    });

    it('複数のコンテンツタイプの回答を記録できる', () => {
      manager.recordAnswer('proverb', true);
      manager.recordAnswer('idiom', false);
      manager.recordAnswer('four_character_idiom', true);
      
      const savedSession = JSON.parse(mockLocalStorage['current_session']);
      expect(savedSession.questionsAnswered).toBe(3);
      expect(savedSession.correctAnswers).toBe(2);
      expect(savedSession.contentBreakdown.proverb.total).toBe(1);
      expect(savedSession.contentBreakdown.idiom.total).toBe(1);
      expect(savedSession.contentBreakdown.four_character_idiom.total).toBe(1);
    });
  });

  describe('モンスターアンロックの記録', () => {
    it('モンスターアンロックを記録できる', () => {
      manager.startSession(5);
      manager.recordMonsterUnlock();
      manager.recordMonsterUnlock();
      
      const savedSession = JSON.parse(mockLocalStorage['current_session']);
      expect(savedSession.monstersUnlocked).toBe(2);
    });

    it('アクティブなセッションがない場合エラーをスローする', () => {
      expect(() => {
        manager.recordMonsterUnlock();
      }).toThrowError('No active session');
    });
  });

  describe('履歴の管理', () => {
    it('同じ日の複数のセッションを統合する', () => {
      // 最初のセッション
      manager.startSession(5);
      manager.recordAnswer('proverb', true);
      manager.endSession(5);
      
      // 2時間後に2回目のセッション
      vi.advanceTimersByTime(2 * 60 * 60 * 1000);
      
      manager.startSession(5);
      manager.recordAnswer('idiom', true);
      manager.recordAnswer('idiom', false);
      manager.endSession(6);
      
      const savedHistory = JSON.parse(mockLocalStorage['learning_history']);
      expect(savedHistory).toHaveLength(1);
      expect(savedHistory[0].questionsAnswered).toBe(3);
      expect(savedHistory[0].correctAnswers).toBe(2);
      expect(savedHistory[0].contentBreakdown.proverb.total).toBe(1);
      expect(savedHistory[0].contentBreakdown.idiom.total).toBe(2);
    });

    it('古い履歴を自動的に削除する', () => {
      // 91日前の履歴を作成
      const oldDate = new Date('2023-10-15T10:00:00.000Z');
      const oldHistory: LearningHistory = {
        date: oldDate,
        questionsAnswered: 10,
        correctAnswers: 8,
        accuracy: 80,
        contentBreakdown: {
          proverb: { total: 10, correct: 8 },
          idiom: { total: 0, correct: 0 },
          four_character_idiom: { total: 0, correct: 0 }
        },
        sessionDuration: 20,
        monstersUnlocked: 2,
        levelProgress: { from: 1, to: 2 }
      };
      
      mockLocalStorage['learning_history'] = JSON.stringify([oldHistory]);
      
      // 新しいマネージャーインスタンスを作成
      const newManager = new LearningHistoryManager();
      newManager.startSession(5);
      newManager.endSession(5);
      
      const savedHistory = JSON.parse(mockLocalStorage['learning_history']);
      expect(savedHistory).toHaveLength(1);
      expect(new Date(savedHistory[0].date).getTime()).toBeGreaterThan(oldDate.getTime());
    });
  });

  describe('統計情報の取得', () => {
    beforeEach(() => {
      // テスト用の履歴データを作成
      const histories: LearningHistory[] = [
        // 7日前
        {
          date: new Date('2024-01-08T10:00:00.000Z'),
          questionsAnswered: 20,
          correctAnswers: 15,
          accuracy: 75,
          contentBreakdown: {
            proverb: { total: 10, correct: 8 },
            idiom: { total: 5, correct: 3 },
            four_character_idiom: { total: 5, correct: 4 }
          },
          sessionDuration: 30,
          monstersUnlocked: 3,
          levelProgress: { from: 1, to: 2 }
        },
        // 3日前
        {
          date: new Date('2024-01-12T10:00:00.000Z'),
          questionsAnswered: 15,
          correctAnswers: 12,
          accuracy: 80,
          contentBreakdown: {
            proverb: { total: 8, correct: 7 },
            idiom: { total: 7, correct: 5 },
            four_character_idiom: { total: 0, correct: 0 }
          },
          sessionDuration: 25,
          monstersUnlocked: 2,
          levelProgress: { from: 2, to: 3 }
        },
        // 今日
        {
          date: new Date('2024-01-15T10:00:00.000Z'),
          questionsAnswered: 10,
          correctAnswers: 9,
          accuracy: 90,
          contentBreakdown: {
            proverb: { total: 5, correct: 5 },
            idiom: { total: 3, correct: 2 },
            four_character_idiom: { total: 2, correct: 2 }
          },
          sessionDuration: 15,
          monstersUnlocked: 1,
          levelProgress: { from: 3, to: 3 }
        }
      ];
      
      mockLocalStorage['learning_history'] = JSON.stringify(histories);
      manager = new LearningHistoryManager();
    });

    it('週間統計を正しく計算する', () => {
      const stats = manager.getStats();
      
      expect(stats.weeklyStats.totalQuestions).toBe(45);
      expect(stats.weeklyStats.totalCorrect).toBe(36);
      expect(stats.weeklyStats.averageAccuracy).toBe(80);
      expect(stats.weeklyStats.totalStudyTime).toBe(70);
    });

    it('日別履歴を正しく取得する', () => {
      const stats = manager.getStats();
      
      expect(stats.dailyHistory).toHaveLength(3);
      expect(stats.dailyHistory[0].questionsAnswered).toBe(20);
      expect(stats.dailyHistory[2].questionsAnswered).toBe(10);
    });

    it('カテゴリー別パフォーマンスを正しく計算する', () => {
      const stats = manager.getStats();
      
      const proverbPerformance = stats.categoryPerformance.find(c => c.type === 'proverb');
      expect(proverbPerformance).toBeDefined();
      expect(proverbPerformance!.totalQuestions).toBe(23);
      expect(proverbPerformance!.correctAnswers).toBe(20);
      expect(proverbPerformance!.accuracy).toBe(87);
    });

    it('最もアクティブな曜日を特定する', () => {
      const stats = manager.getStats();
      
      // この例では月曜日が最もアクティブ（20問）
      expect(stats.weeklyStats.mostActiveDay).toBeTruthy();
    });
  });

  describe('データのエクスポート', () => {
    it('履歴データをJSON形式でエクスポートできる', () => {
      manager.startSession(5);
      manager.recordAnswer('proverb', true);
      manager.endSession(5);
      
      const exported = manager.exportHistory();
      const parsed = JSON.parse(exported);
      
      expect(parsed.exportDate).toBeDefined();
      expect(parsed.history).toHaveLength(1);
      expect(parsed.stats).toBeDefined();
    });
  });

  describe('既存セッションの復元', () => {
    it('保存されたセッションを復元できる', () => {
      const sessionData = {
        startTime: new Date('2024-01-15T09:00:00.000Z').toISOString(),
        questionsAnswered: 5,
        correctAnswers: 4,
        contentBreakdown: {
          proverb: { total: 3, correct: 3 },
          idiom: { total: 2, correct: 1 },
          four_character_idiom: { total: 0, correct: 0 }
        },
        monstersUnlocked: 1,
        startLevel: 5
      };
      
      mockLocalStorage['current_session'] = JSON.stringify(sessionData);
      
      const newManager = new LearningHistoryManager();
      newManager.recordAnswer('proverb', true);
      
      const savedSession = JSON.parse(mockLocalStorage['current_session']);
      expect(savedSession.questionsAnswered).toBe(6);
      expect(savedSession.correctAnswers).toBe(5);
    });
  });

  describe('追加のメソッド', () => {
    beforeEach(() => {
      const histories: LearningHistory[] = [
        {
          date: new Date('2024-01-10T10:00:00.000Z'),
          questionsAnswered: 20,
          correctAnswers: 18,
          accuracy: 90,
          contentBreakdown: {
            proverb: { total: 10, correct: 9 },
            idiom: { total: 10, correct: 9 },
            four_character_idiom: { total: 0, correct: 0 }
          },
          sessionDuration: 30,
          monstersUnlocked: 2,
          levelProgress: { from: 3, to: 4 }
        },
        {
          date: new Date('2024-01-15T10:00:00.000Z'),
          questionsAnswered: 15,
          correctAnswers: 12,
          accuracy: 80,
          contentBreakdown: {
            proverb: { total: 5, correct: 4 },
            idiom: { total: 5, correct: 4 },
            four_character_idiom: { total: 5, correct: 4 }
          },
          sessionDuration: 20,
          monstersUnlocked: 1,
          levelProgress: { from: 4, to: 5 }
        }
      ];
      
      mockLocalStorage['learning_history'] = JSON.stringify(histories);
      manager = new LearningHistoryManager();
    });

    it('最近のセッションを取得できる', () => {
      const sessions = manager.getRecentSessions(10);
      
      expect(sessions).toHaveLength(2);
      expect(sessions[0].totalQuestions).toBe(15);
      expect(sessions[0].level).toBe(5);
      expect(sessions[1].totalQuestions).toBe(20);
    });

    it('指定した日数の日別統計を取得できる', () => {
      const dailyStats = manager.getDailyStats(7);
      
      expect(dailyStats).toHaveLength(7);
      
      // 1月10日のデータ
      const jan10 = dailyStats.find(d => d.date === '2024-01-10');
      expect(jan10).toBeDefined();
      expect(jan10!.sessions).toBe(1);
      expect(jan10!.totalQuestions).toBe(20);
      expect(jan10!.accuracy).toBe(90);
      
      // 1月15日のデータ
      const jan15 = dailyStats.find(d => d.date === '2024-01-15');
      expect(jan15).toBeDefined();
      expect(jan15!.sessions).toBe(1);
      expect(jan15!.totalQuestions).toBe(15);
    });

    it('コンテンツタイプ別の統計を取得できる', () => {
      const contentStats = manager.getContentTypeStats();
      
      expect(contentStats.proverb.attempts).toBe(15);
      expect(contentStats.proverb.correct).toBe(13);
      expect(contentStats.proverb.accuracy).toBe(87);
      
      expect(contentStats.idiom.attempts).toBe(15);
      expect(contentStats.idiom.correct).toBe(13);
      
      expect(contentStats.four_character_idiom.attempts).toBe(5);
      expect(contentStats.four_character_idiom.correct).toBe(4);
      expect(contentStats.four_character_idiom.accuracy).toBe(80);
    });

    it('存在しない日付の統計もゼロで初期化される', () => {
      const dailyStats = manager.getDailyStats(30);
      
      // データが存在しない日もゼロで含まれる
      const emptyDays = dailyStats.filter(d => d.sessions === 0);
      expect(emptyDays.length).toBeGreaterThan(20);
      
      emptyDays.forEach(day => {
        expect(day.totalQuestions).toBe(0);
        expect(day.correctAnswers).toBe(0);
        expect(day.accuracy).toBe(0);
        expect(day.totalDuration).toBe(0);
      });
    });
  });
});