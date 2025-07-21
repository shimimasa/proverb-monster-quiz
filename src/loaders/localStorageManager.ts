import { z } from 'zod';
import type { UserProgress, GameSettings, Monster, Achievement, GameSession } from '../types';

// ストレージキーの定義
const STORAGE_KEYS = {
  USER_PROGRESS: 'proverb_monster_user_progress',
  GAME_SETTINGS: 'proverb_monster_game_settings',
  MONSTER_COLLECTION: 'proverb_monster_collection',
  GAME_SESSIONS: 'proverb_monster_sessions',
  ACHIEVEMENTS: 'proverb_monster_achievements',
} as const;

// データ検証スキーマ
const GameSettingsSchema = z.object({
  soundEnabled: z.boolean(),
  effectsVolume: z.number().min(0).max(1),
  difficulty: z.enum(['小学生', '中学生', '高校生']),
  contentTypes: z.array(z.enum(['proverb', 'idiom', 'four_character_idiom'])),
});

const UserProgressSchema = z.object({
  level: z.number().min(1),
  experience: z.number().min(0),
  totalQuestions: z.number().min(0),
  correctAnswers: z.number().min(0),
  totalCorrect: z.number().min(0).optional(),
  streak: z.number().min(0),
  maxStreak: z.number().min(0),
  achievements: z.array(z.any()), // Achievementスキーマは複雑なので簡略化
  settings: GameSettingsSchema,
});

// エラークラス
export class StorageError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

export class StorageQuotaError extends StorageError {
  constructor(message: string) {
    super(message);
    this.name = 'StorageQuotaError';
  }
}

// LocalStorageマネージャークラス
export class LocalStorageManager {
  private readonly prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix;
  }

  // ストレージの利用可能性をチェック
  isAvailable(): boolean {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  // ストレージ容量の確認（概算）
  getStorageSize(): { used: number; percentage: number } {
    let used = 0;
    
    try {
      // Object.keys を使用してlocalStorageのキーを取得
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }
      
      // localStorageの一般的な容量制限は5MB（5 * 1024 * 1024 bytes）
      const maxSize = 5 * 1024 * 1024;
      const percentage = (used / maxSize) * 100;
      
      return { used, percentage };
    } catch (error) {
      throw new StorageError('Failed to calculate storage size', error);
    }
  }

  // データの保存（自動圧縮機能付き）
  private setItem(key: string, value: any): void {
    if (!this.isAvailable()) {
      throw new StorageError('LocalStorage is not available');
    }

    try {
      const serialized = JSON.stringify(value);
      const fullKey = this.prefix + key;
      
      // 大きなデータは圧縮を試みる
      if (serialized.length > 50000) {
        console.warn(`Large data detected for key ${key}: ${serialized.length} bytes`);
      }
      
      localStorage.setItem(fullKey, serialized);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new StorageQuotaError('LocalStorage quota exceeded');
      }
      throw new StorageError(`Failed to save data for key: ${key}`, error);
    }
  }

  // データの取得
  private getItem<T>(key: string): T | null {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const fullKey = this.prefix + key;
      const item = localStorage.getItem(fullKey);
      
      if (!item) {
        return null;
      }
      
      return JSON.parse(item);
    } catch (error) {
      console.error(`Failed to parse data for key: ${key}`, error);
      return null;
    }
  }

  // データの削除
  private removeItem(key: string): void {
    if (!this.isAvailable()) {
      return;
    }

    const fullKey = this.prefix + key;
    localStorage.removeItem(fullKey);
  }

  // ユーザー進捗の保存
  saveUserProgress(progress: UserProgress): void {
    try {
      // データ検証
      const validated = UserProgressSchema.parse(progress);
      this.setItem(STORAGE_KEYS.USER_PROGRESS, validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new StorageError('Invalid user progress data', error);
      }
      throw error;
    }
  }

  // ユーザー進捗の読み込み
  loadUserProgress(): UserProgress | null {
    const data = this.getItem<UserProgress>(STORAGE_KEYS.USER_PROGRESS);
    
    if (!data) {
      return null;
    }

    try {
      return UserProgressSchema.parse(data);
    } catch (error) {
      console.error('Corrupted user progress data, returning null', error);
      return null;
    }
  }

  // ゲーム設定の保存
  saveGameSettings(settings: GameSettings): void {
    try {
      const validated = GameSettingsSchema.parse(settings);
      this.setItem(STORAGE_KEYS.GAME_SETTINGS, validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new StorageError('Invalid game settings data', error);
      }
      throw error;
    }
  }

  // ゲーム設定の読み込み
  loadGameSettings(): GameSettings | null {
    const data = this.getItem<GameSettings>(STORAGE_KEYS.GAME_SETTINGS);
    
    if (!data) {
      return null;
    }

    try {
      return GameSettingsSchema.parse(data);
    } catch (error) {
      console.error('Corrupted game settings data, returning null', error);
      return null;
    }
  }

  // モンスターコレクションの保存
  saveMonsterCollection(monsters: Monster[]): void {
    this.setItem(STORAGE_KEYS.MONSTER_COLLECTION, monsters);
  }

  // モンスターコレクションの読み込み
  loadMonsterCollection(): Monster[] {
    const data = this.getItem<Monster[]>(STORAGE_KEYS.MONSTER_COLLECTION);
    return data || [];
  }

  // ゲームセッションの保存（最新10セッションのみ保持）
  saveGameSession(session: GameSession): void {
    const sessions = this.loadGameSessions();
    sessions.unshift(session);
    
    // 最新10セッションのみ保持
    const recentSessions = sessions.slice(0, 10);
    this.setItem(STORAGE_KEYS.GAME_SESSIONS, recentSessions);
  }

  // ゲームセッションの読み込み
  loadGameSessions(): GameSession[] {
    const data = this.getItem<GameSession[]>(STORAGE_KEYS.GAME_SESSIONS);
    return data || [];
  }

  // アチーブメントの保存
  saveAchievements(achievements: Achievement[]): void {
    this.setItem(STORAGE_KEYS.ACHIEVEMENTS, achievements);
  }

  // アチーブメントの読み込み
  loadAchievements(): Achievement[] {
    const data = this.getItem<Achievement[]>(STORAGE_KEYS.ACHIEVEMENTS);
    return data || [];
  }

  // 全データのバックアップ
  exportAllData(): string {
    const data = {
      userProgress: this.loadUserProgress(),
      gameSettings: this.loadGameSettings(),
      monsterCollection: this.loadMonsterCollection(),
      gameSessions: this.loadGameSessions(),
      achievements: this.loadAchievements(),
      exportDate: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  }

  // バックアップからの復元
  importAllData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.userProgress) {
        this.saveUserProgress(data.userProgress);
      }
      if (data.gameSettings) {
        this.saveGameSettings(data.gameSettings);
      }
      if (data.monsterCollection) {
        this.saveMonsterCollection(data.monsterCollection);
      }
      if (data.gameSessions) {
        data.gameSessions.forEach((session: GameSession) => {
          this.saveGameSession(session);
        });
      }
      if (data.achievements) {
        this.saveAchievements(data.achievements);
      }
    } catch (error) {
      throw new StorageError('Failed to import data', error);
    }
  }

  // 特定のキーのデータをクリア
  clearData(key: keyof typeof STORAGE_KEYS): void {
    this.removeItem(STORAGE_KEYS[key]);
  }

  // 全データのクリア
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.removeItem(key);
    });
  }

  // データの修復機能
  repairData(): { repaired: string[]; failed: string[] } {
    const repaired: string[] = [];
    const failed: string[] = [];

    // ユーザー進捗の修復
    try {
      const progress = this.getItem<any>(STORAGE_KEYS.USER_PROGRESS);
      if (progress && !UserProgressSchema.safeParse(progress).success) {
        // デフォルト値で修復
        const defaultProgress: UserProgress = {
          level: 1,
          experience: 0,
          totalQuestions: progress.totalQuestions || 0,
          correctAnswers: progress.correctAnswers || 0,
          streak: 0,
          maxStreak: 0,
          achievements: [],
          settings: {
            soundEnabled: true,
            effectsVolume: 0.5,
            difficulty: '小学生',
            contentTypes: ['proverb'],
          },
        };
        this.saveUserProgress(defaultProgress);
        repaired.push('userProgress');
      }
    } catch (error) {
      failed.push('userProgress');
    }

    // ゲーム設定の修復
    try {
      const settings = this.getItem<any>(STORAGE_KEYS.GAME_SETTINGS);
      if (settings && !GameSettingsSchema.safeParse(settings).success) {
        const defaultSettings: GameSettings = {
          soundEnabled: true,
          effectsVolume: 0.5,
          difficulty: '小学生',
          contentTypes: ['proverb'],
        };
        this.saveGameSettings(defaultSettings);
        repaired.push('gameSettings');
      }
    } catch (error) {
      failed.push('gameSettings');
    }

    return { repaired, failed };
  }
}

// シングルトンインスタンス
export const localStorageManager = new LocalStorageManager();