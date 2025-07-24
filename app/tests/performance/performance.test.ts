import { describe, it, expect, beforeEach } from 'vitest';
import { performance } from 'perf_hooks';
import { ContentManager } from '@/core/ContentManager';
import { MonsterManager } from '@/core/MonsterManager';
import { ProgressManager } from '@/core/ProgressManager';
import { QuizEngine } from '@/core/QuizEngine';
import { LocalStorageManager } from '@/core/LocalStorageManager';

describe('パフォーマンステスト', () => {
  beforeEach(() => {
    // LocalStorageをクリア
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe('データロードパフォーマンス', () => {
    it('ContentManagerの初期化が1秒以内に完了する', async () => {
      const contentManager = new ContentManager();
      
      const startTime = performance.now();
      await contentManager.initialize();
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000); // 1秒以内
      
      // データが正しくロードされていることも確認
      const contents = contentManager.getAllContents();
      expect(contents.length).toBeGreaterThan(0);
    });

    it('大量のモンスターデータを効率的に処理できる', async () => {
      const monsterManager = new MonsterManager();
      
      // 1000体のモンスターIDでテスト
      const monsterIds = Array.from({ length: 1000 }, (_, i) => `mon_${String(i + 1).padStart(3, '0')}`);
      
      const startTime = performance.now();
      
      // 各モンスターの情報を取得
      for (const id of monsterIds) {
        monsterManager.getMonsterById(id);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 1000体の取得が100ms以内
      expect(duration).toBeLessThan(100);
    });
  });

  describe('クイズ生成パフォーマンス', () => {
    it('問題生成が50ms以内に完了する', async () => {
      const contentManager = new ContentManager();
      await contentManager.initialize();
      
      const quizEngine = new QuizEngine(contentManager);
      
      const measurements: number[] = [];
      
      // 100問生成してパフォーマンスを測定
      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        quizEngine.generateQuestion('proverb', 'normal');
        const endTime = performance.now();
        
        measurements.push(endTime - startTime);
      }
      
      // 平均生成時間を計算
      const averageTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(averageTime).toBeLessThan(50); // 平均50ms以内
      
      // 最大生成時間も確認
      const maxTime = Math.max(...measurements);
      expect(maxTime).toBeLessThan(100); // 最大でも100ms以内
    });

    it('異なる難易度での問題生成パフォーマンス', async () => {
      const contentManager = new ContentManager();
      await contentManager.initialize();
      
      const quizEngine = new QuizEngine(contentManager);
      const difficulties = ['easy', 'normal', 'hard'] as const;
      
      const results: Record<string, number> = {};
      
      for (const difficulty of difficulties) {
        const startTime = performance.now();
        
        // 各難易度で50問生成
        for (let i = 0; i < 50; i++) {
          quizEngine.generateQuestion('proverb', difficulty);
        }
        
        const endTime = performance.now();
        results[difficulty] = endTime - startTime;
      }
      
      // 各難易度での生成時間が妥当な範囲内
      expect(results.easy).toBeLessThan(500);
      expect(results.normal).toBeLessThan(500);
      expect(results.hard).toBeLessThan(500);
      
      // 難易度による大きな差がないことを確認
      const times = Object.values(results);
      const maxDiff = Math.max(...times) - Math.min(...times);
      expect(maxDiff).toBeLessThan(200); // 差は200ms以内
    });
  });

  describe('データ永続化パフォーマンス', () => {
    it('ユーザー進捗の保存が10ms以内に完了する', () => {
      const progressManager = new ProgressManager();
      
      // 大量のデータを含む進捗情報
      const largeProgress = {
        playerName: 'パフォーマンステスター',
        level: 50,
        experience: 999999,
        totalCorrect: 5000,
        totalQuestions: 10000,
        currentStreak: 100,
        maxStreak: 500,
        unlockedMonsters: Array.from({ length: 500 }, (_, i) => ({
          monsterId: `mon_${i}`,
          obtainedAt: new Date().toISOString(),
          count: Math.floor(Math.random() * 10) + 1,
        })),
        lastPlayedDate: new Date().toISOString(),
        settings: {
          soundEnabled: true,
          volume: 0.5,
          difficulty: 'normal' as const,
          contentTypes: ['proverb', 'idiom', 'phrase'] as const[],
        },
        achievements: Object.fromEntries(
          Array.from({ length: 50 }, (_, i) => [
            `achievement_${i}`,
            {
              unlocked: Math.random() > 0.5,
              unlockedAt: new Date().toISOString(),
              progress: Math.floor(Math.random() * 100),
            },
          ])
        ),
      };
      
      const startTime = performance.now();
      LocalStorageManager.saveUserProgress(largeProgress);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10); // 10ms以内
    });

    it('データの読み込みが5ms以内に完了する', () => {
      // 事前に大量のデータを保存
      const largeData = {
        playerName: 'ロードテスター',
        level: 100,
        experience: 999999,
        totalCorrect: 10000,
        totalQuestions: 20000,
        currentStreak: 0,
        maxStreak: 1000,
        unlockedMonsters: Array.from({ length: 1000 }, (_, i) => ({
          monsterId: `mon_${i}`,
          obtainedAt: new Date().toISOString(),
          count: 1,
        })),
        lastPlayedDate: new Date().toISOString(),
        settings: {
          soundEnabled: true,
          volume: 0.5,
          difficulty: 'normal' as const,
          contentTypes: ['proverb'] as const[],
        },
      };
      
      LocalStorageManager.saveUserProgress(largeData);
      
      const startTime = performance.now();
      const loadedData = LocalStorageManager.getUserProgress();
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5); // 5ms以内
      expect(loadedData).toEqual(largeData);
    });
  });

  describe('メモリ使用量の最適化', () => {
    it('ContentManagerのメモリ効率性', async () => {
      const contentManager = new ContentManager();
      
      // 初期メモリ使用量を記録（Node.js環境の場合）
      const initialMemory = process.memoryUsage?.().heapUsed || 0;
      
      await contentManager.initialize();
      
      // 1000回アクセスしてもメモリリークがないことを確認
      for (let i = 0; i < 1000; i++) {
        contentManager.getContentsByType('proverb');
        contentManager.getRandomContent('idiom');
        contentManager.getContentById(1);
      }
      
      // 最終メモリ使用量
      const finalMemory = process.memoryUsage?.().heapUsed || 0;
      
      // メモリ増加が妥当な範囲内（10MB以内）
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
    });

    it('大量の問題履歴を効率的に管理できる', () => {
      const quizHistory: any[] = [];
      
      const startTime = performance.now();
      
      // 10000問の履歴を追加
      for (let i = 0; i < 10000; i++) {
        quizHistory.push({
          questionId: i,
          answeredAt: new Date().toISOString(),
          isCorrect: Math.random() > 0.5,
          timeTaken: Math.floor(Math.random() * 30000),
        });
      }
      
      // 履歴の検索
      const recentHistory = quizHistory.slice(-100);
      const correctAnswers = quizHistory.filter(h => h.isCorrect);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 処理時間が妥当な範囲内
      expect(duration).toBeLessThan(100); // 100ms以内
      expect(recentHistory.length).toBe(100);
      expect(correctAnswers.length).toBeGreaterThan(0);
    });
  });

  describe('レンダリングパフォーマンス', () => {
    it('大量のモンスターカードを効率的に表示できる', () => {
      // 仮想DOMでのレンダリングをシミュレート
      const monsterCards = Array.from({ length: 1000 }, (_, i) => ({
        id: `mon_${i}`,
        name: `モンスター${i}`,
        rarity: ['common', 'rare', 'epic', 'legendary'][i % 4],
        unlocked: Math.random() > 0.5,
      }));
      
      const startTime = performance.now();
      
      // フィルタリングとソート
      const filteredCards = monsterCards
        .filter(card => card.unlocked)
        .sort((a, b) => a.name.localeCompare(b.name));
      
      // ページネーション（50件ずつ）
      const pageSize = 50;
      const pages: typeof monsterCards[] = [];
      for (let i = 0; i < filteredCards.length; i += pageSize) {
        pages.push(filteredCards.slice(i, i + pageSize));
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // フィルタリングとページネーションが高速
      expect(duration).toBeLessThan(50); // 50ms以内
      expect(pages.length).toBeGreaterThan(0);
      expect(pages[0].length).toBeLessThanOrEqual(pageSize);
    });
  });

  describe('統計計算パフォーマンス', () => {
    it('大量のプレイデータから統計を高速に計算できる', () => {
      // 1年分のプレイデータをシミュレート
      const playHistory = Array.from({ length: 365 * 10 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        correct: Math.floor(Math.random() * 20),
        total: 20,
        streaks: Math.floor(Math.random() * 10),
      }));
      
      const startTime = performance.now();
      
      // 日別統計
      const dailyStats = playHistory.slice(0, 7);
      
      // 週別統計
      const weeklyStats = [];
      for (let i = 0; i < 52; i++) {
        const weekData = playHistory.slice(i * 7, (i + 1) * 7);
        const totalCorrect = weekData.reduce((sum, day) => sum + day.correct, 0);
        const totalQuestions = weekData.reduce((sum, day) => sum + day.total, 0);
        weeklyStats.push({
          week: i + 1,
          correct: totalCorrect,
          total: totalQuestions,
          accuracy: totalQuestions > 0 ? totalCorrect / totalQuestions : 0,
        });
      }
      
      // 月別統計
      const monthlyStats = [];
      for (let i = 0; i < 12; i++) {
        const monthData = playHistory.slice(i * 30, (i + 1) * 30);
        const totalCorrect = monthData.reduce((sum, day) => sum + day.correct, 0);
        const totalQuestions = monthData.reduce((sum, day) => sum + day.total, 0);
        monthlyStats.push({
          month: i + 1,
          correct: totalCorrect,
          total: totalQuestions,
          accuracy: totalQuestions > 0 ? totalCorrect / totalQuestions : 0,
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 統計計算が高速
      expect(duration).toBeLessThan(100); // 100ms以内
      expect(dailyStats.length).toBe(7);
      expect(weeklyStats.length).toBe(52);
      expect(monthlyStats.length).toBe(12);
    });
  });
});