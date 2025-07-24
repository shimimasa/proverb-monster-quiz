import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProgressManager, LevelUpResult, ProgressStats } from '../../src/core/ProgressManager';
import { localStorageManager } from '../../src/loaders/localStorageManager';
import { UserProgress, GameSettings, Achievement, GameSession } from '../../src/types';

// localStorageManagerのモック
vi.mock('../../src/loaders/localStorageManager', () => ({
  localStorageManager: {
    loadUserProgress: vi.fn(),
    saveUserProgress: vi.fn(),
    loadAchievements: vi.fn(),
    saveAchievements: vi.fn(),
    loadGameSessions: vi.fn(),
    saveGameSession: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// モックデータ
const mockUserProgress: UserProgress = {
  level: 1,
  experience: 0,
  totalQuestions: 0,
  correctAnswers: 0,
  streak: 0,
  maxStreak: 0,
  achievements: [],
  settings: {
    soundEnabled: true,
    effectsVolume: 0.7,
    difficulty: '小学生',
    contentTypes: ['proverb'],
  },
};

describe('ProgressManager', () => {
  let progressManager: ProgressManager;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(localStorageManager.loadUserProgress).mockReturnValue(null);
    vi.mocked(localStorageManager.loadAchievements).mockReturnValue([]);
    vi.mocked(localStorageManager.loadGameSessions).mockReturnValue([]);
    vi.mocked(localStorageManager.get).mockReturnValue(null);
    vi.mocked(localStorageManager.set).mockReturnValue(undefined);
    
    progressManager = new ProgressManager();
  });

  describe('updateProgress', () => {
    it('正解時に進捗を更新する', () => {
      const result = progressManager.updateProgress(true);
      const progress = progressManager.getProgress();
      
      expect(progress.totalQuestions).toBe(1);
      expect(progress.correctAnswers).toBe(1);
      expect(progress.streak).toBe(1);
      expect(progress.experience).toBeGreaterThan(0);
    });

    it('不正解時にストリークがリセットされる', () => {
      progressManager.updateProgress(true);
      progressManager.updateProgress(true);
      progressManager.updateProgress(false);
      
      const progress = progressManager.getProgress();
      
      expect(progress.totalQuestions).toBe(3);
      expect(progress.correctAnswers).toBe(2);
      expect(progress.streak).toBe(0);
    });

    it('レベルアップ時にLevelUpResultを返す', () => {
      // 経験値を大量に獲得してレベルアップを発生させる
      let levelUpResult: LevelUpResult | null = null;
      
      for (let i = 0; i < 15; i++) {
        const result = progressManager.updateProgress(true);
        if (result) {
          levelUpResult = result;
          break;
        }
      }
      
      expect(levelUpResult).not.toBeNull();
      expect(levelUpResult?.newLevel).toBeGreaterThan(levelUpResult?.previousLevel || 0);
    });

    it('コンテンツタイプを追跡する', () => {
      progressManager.updateProgress(true, 'proverb');
      progressManager.updateProgress(true, 'proverb');
      progressManager.updateProgress(true, 'idiom');
      
      const stats = progressManager.getProgressStats();
      expect(stats.favoriteContentType).toBe('proverb');
    });
  });

  describe('レベルシステム', () => {
    it('経験値からレベルを正しく計算する', () => {
      // レベル1: 0 EXP
      expect(progressManager.calculateLevel(0)).toBe(1);
      expect(progressManager.calculateLevel(99)).toBe(1);
      
      // レベル2: 100 EXP
      expect(progressManager.calculateLevel(100)).toBe(2);
      expect(progressManager.calculateLevel(249)).toBe(2);
      
      // レベル3: 250 EXP (100 + 150)
      expect(progressManager.calculateLevel(250)).toBe(3);
    });

    it('次のレベルまでの経験値を計算する', () => {
      progressManager.addExperience(120); // レベル2、20/150
      
      const expInfo = progressManager.getExperienceForNextLevel();
      
      expect(expInfo.current).toBe(20);
      expect(expInfo.required).toBe(150);
      expect(expInfo.percentage).toBeCloseTo(13.33, 1);
    });

    it('ストリークボーナスが経験値に影響する', () => {
      const progress1 = progressManager.getProgress();
      progressManager.updateProgress(true);
      const exp1 = progressManager.getProgress().experience - progress1.experience;
      
      // ストリークを増やす
      for (let i = 0; i < 5; i++) {
        progressManager.updateProgress(true);
      }
      
      const progress2 = progressManager.getProgress();
      progressManager.updateProgress(true);
      const exp2 = progressManager.getProgress().experience - progress2.experience;
      
      expect(exp2).toBeGreaterThan(exp1);
    });
  });

  describe('アチーブメント', () => {
    it('条件を満たすとアチーブメントが解除される', () => {
      progressManager.updateProgress(true);
      
      const achievements = progressManager.getProgress().achievements;
      const firstCorrect = achievements.find(a => a.id === 'first_correct');
      
      expect(firstCorrect?.unlocked).toBe(true);
      expect(firstCorrect?.dateUnlocked).toBeInstanceOf(Date);
    });

    it('ストリークアチーブメントが正しく動作する', () => {
      for (let i = 0; i < 5; i++) {
        progressManager.updateProgress(true);
      }
      
      const achievements = progressManager.getProgress().achievements;
      const streak5 = achievements.find(a => a.id === 'streak_5');
      
      expect(streak5?.unlocked).toBe(true);
    });

    it('正解率アチーブメントが正しく動作する', () => {
      // 90%以上の正解率（9/10）
      for (let i = 0; i < 9; i++) {
        progressManager.updateProgress(true);
      }
      progressManager.updateProgress(false);
      progressManager.checkAchievements();
      
      const achievements = progressManager.getProgress().achievements;
      const perfectRate = achievements.find(a => a.id === 'perfect_rate');
      
      expect(perfectRate?.unlocked).toBe(true);
    });

    it('アチーブメント進捗を取得できる', () => {
      progressManager.updateProgress(true);
      
      const achievementProgress = progressManager.getAchievementProgress();
      
      expect(achievementProgress.total).toBeGreaterThan(0);
      expect(achievementProgress.unlocked).toBeGreaterThan(0);
      expect(achievementProgress.percentage).toBeGreaterThan(0);
      expect(achievementProgress.recent.length).toBeGreaterThanOrEqual(1);
      
      // 最近のアチーブメントが日付順にソートされていることを確認
      if (achievementProgress.recent.length > 1) {
        const dates = achievementProgress.recent.map(a => a.dateUnlocked?.getTime() || 0);
        expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
      }
    });
  });

  describe('統計情報', () => {
    it('進捗統計を正しく計算する', () => {
      // テストデータを設定
      for (let i = 0; i < 8; i++) {
        progressManager.updateProgress(true, 'proverb');
      }
      for (let i = 0; i < 2; i++) {
        progressManager.updateProgress(false);
      }
      
      const stats = progressManager.getProgressStats();
      
      expect(stats.accuracy).toBe(80); // 8/10
      expect(stats.bestStreak).toBeGreaterThanOrEqual(1);
      expect(stats.averageStreak).toBeGreaterThan(0);
      expect(stats.favoriteContentType).toBe('proverb');
    });

    it('日別の問題数を追跡する', () => {
      // 複数の問題を解く
      for (let i = 0; i < 5; i++) {
        progressManager.updateProgress(true);
      }
      
      const stats = progressManager.getProgressStats();
      
      expect(stats.questionsPerDay).toBeGreaterThan(0);
    });

    it('レベル進捗情報を取得できる', () => {
      progressManager.addExperience(50);
      
      const stats = progressManager.getProgressStats();
      
      expect(stats.levelProgress.current).toBe(50);
      expect(stats.levelProgress.required).toBe(100);
      expect(stats.levelProgress.percentage).toBe(50);
    });
  });

  describe('設定管理', () => {
    it('設定を更新できる', () => {
      const newSettings: Partial<GameSettings> = {
        soundEnabled: false,
        difficulty: '中学生',
      };
      
      progressManager.updateSettings(newSettings);
      const settings = progressManager.getSettings();
      
      expect(settings.soundEnabled).toBe(false);
      expect(settings.difficulty).toBe('中学生');
      expect(settings.effectsVolume).toBe(0.7); // 変更されていない
    });

    it('設定を保存する', () => {
      progressManager.updateSettings({ soundEnabled: false });
      
      expect(localStorageManager.saveUserProgress).toHaveBeenCalled();
    });
  });

  describe('セッション管理', () => {
    it('ゲームセッションを保存できる', () => {
      const session: GameSession = {
        id: 'test_session',
        startTime: new Date(),
        endTime: new Date(),
        questions: [],
        answers: [],
        score: 100,
        monstersUnlocked: [],
      };
      
      progressManager.saveGameSession(session);
      
      expect(localStorageManager.saveGameSession).toHaveBeenCalledWith(session);
    });

    it('最近のセッションを取得できる', () => {
      const mockSessions: GameSession[] = [
        {
          id: 'session_1',
          startTime: new Date(),
          questions: [],
          answers: [],
          score: 100,
          monstersUnlocked: [],
        },
        {
          id: 'session_2',
          startTime: new Date(),
          questions: [],
          answers: [],
          score: 200,
          monstersUnlocked: [],
        },
      ];
      
      vi.mocked(localStorageManager.loadGameSessions).mockReturnValue(mockSessions);
      
      const recent = progressManager.getRecentSessions(1);
      
      expect(recent).toHaveLength(1);
      expect(recent[0].id).toBe('session_1');
    });
  });

  describe('データの永続化', () => {
    it('進捗を保存する', () => {
      progressManager.updateProgress(true);
      
      expect(localStorageManager.saveUserProgress).toHaveBeenCalled();
      expect(localStorageManager.saveAchievements).toHaveBeenCalled();
    });

    it('起動時に進捗を読み込む', () => {
      const savedProgress: UserProgress = {
        ...mockUserProgress,
        level: 5,
        experience: 500,
      };
      
      vi.mocked(localStorageManager.loadUserProgress).mockReturnValue(savedProgress);
      
      const newManager = new ProgressManager();
      const progress = newManager.getProgress();
      
      expect(progress.level).toBe(5);
      expect(progress.experience).toBe(500);
    });
  });

  describe('リセット機能', () => {
    it('進捗をリセットできる', () => {
      progressManager.updateProgress(true);
      progressManager.updateProgress(true);
      
      progressManager.resetProgress();
      const progress = progressManager.getProgress();
      
      expect(progress.level).toBe(1);
      expect(progress.experience).toBe(0);
      expect(progress.totalQuestions).toBe(0);
      expect(progress.correctAnswers).toBe(0);
      expect(progress.streak).toBe(0);
    });
  });
});