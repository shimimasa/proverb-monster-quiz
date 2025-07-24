import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorageManager, StorageError, StorageQuotaError } from '../../src/loaders/localStorageManager';
import { UserProgress, GameSettings, Monster, Achievement, GameSession } from '../../src/types';

// localStorageのモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  const mock = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
  
  // Object.keysがstore内のキーを返すように設定
  Object.defineProperty(mock, Symbol.for('nodejs.util.inspect.custom'), {
    value: () => store,
  });
  
  // for...inループとObject.keysが動作するように
  return new Proxy(mock, {
    ownKeys(target) {
      // Proxyのターゲットのキーとstoreのキーを結合
      const targetKeys = Object.keys(target);
      const storeKeys = Object.keys(store);
      const allKeys = [...new Set([...targetKeys, ...storeKeys])];
      // シンボルも含める
      const symbols = Object.getOwnPropertySymbols(target);
      return [...allKeys, ...symbols];
    },
    getOwnPropertyDescriptor(target, prop) {
      if (typeof prop === 'string' && prop in store) {
        return {
          enumerable: true,
          configurable: true,
          value: store[prop],
        };
      }
      return Object.getOwnPropertyDescriptor(target, prop);
    },
    has(target, prop) {
      return prop in store || prop in target;
    },
    get(target, prop) {
      if (typeof prop === 'string' && prop in store) {
        return store[prop];
      }
      return target[prop as keyof typeof target];
    },
  });
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// テスト用のモックデータ
const mockUserProgress: UserProgress = {
  level: 5,
  experience: 1200,
  totalQuestions: 50,
  correctAnswers: 35,
  streak: 3,
  maxStreak: 10,
  achievements: [],
  settings: {
    soundEnabled: true,
    effectsVolume: 0.7,
    difficulty: '小学生',
    contentTypes: ['proverb'],
  },
};

const mockGameSettings: GameSettings = {
  soundEnabled: false,
  effectsVolume: 0.5,
  difficulty: '中学生',
  contentTypes: ['proverb', 'idiom'],
};

const mockMonster: Monster = {
  id: 'monster_1',
  name: 'ことわざドラゴン',
  image: 'dragon.png',
  rarity: 'rare',
  sourceContent: {
    id: 1,
    text: '猿も木から落ちる',
    reading: 'さるもきからおちる',
    meaning: 'どんなに得意なことでも、時には失敗することがある',
    difficulty: '小学生',
    example_sentence: 'プロの料理人でも失敗することがある。',
    type: 'proverb',
  },
  unlocked: true,
  dateObtained: new Date('2025-01-20'),
};

describe('LocalStorageManager', () => {
  let storageManager: LocalStorageManager;

  beforeEach(() => {
    localStorageMock.clear();
    storageManager = new LocalStorageManager();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('基本機能', () => {
    it('localStorageが利用可能か確認できる', () => {
      const isAvailable = storageManager.isAvailable();
      expect(isAvailable).toBe(true);
    });

    it('ストレージサイズを取得できる', () => {
      localStorageMock.setItem('test_key', 'a'.repeat(1000));
      
      const { used, percentage } = storageManager.getStorageSize();
      
      expect(used).toBeGreaterThan(1000);
      expect(percentage).toBeGreaterThan(0);
      expect(percentage).toBeLessThan(100);
    });
  });

  describe('ユーザー進捗の管理', () => {
    it('ユーザー進捗を保存・読み込みできる', () => {
      storageManager.saveUserProgress(mockUserProgress);
      const loaded = storageManager.loadUserProgress();
      
      expect(loaded).toEqual(mockUserProgress);
    });

    it('不正なユーザー進捗データは保存エラーになる', () => {
      const invalidProgress = { ...mockUserProgress, level: -1 };
      
      expect(() => {
        storageManager.saveUserProgress(invalidProgress as any);
      }).toThrow(StorageError);
    });

    it('破損したデータは読み込み時にnullを返す', () => {
      localStorageMock.setItem('proverb_monster_user_progress', '{"invalid": json}');
      
      const loaded = storageManager.loadUserProgress();
      
      expect(loaded).toBeNull();
    });
  });

  describe('ゲーム設定の管理', () => {
    it('ゲーム設定を保存・読み込みできる', () => {
      storageManager.saveGameSettings(mockGameSettings);
      const loaded = storageManager.loadGameSettings();
      
      expect(loaded).toEqual(mockGameSettings);
    });

    it('不正な設定データは保存エラーになる', () => {
      const invalidSettings = { ...mockGameSettings, effectsVolume: 1.5 };
      
      expect(() => {
        storageManager.saveGameSettings(invalidSettings);
      }).toThrow(StorageError);
    });
  });

  describe('モンスターコレクションの管理', () => {
    it('モンスターコレクションを保存・読み込みできる', () => {
      const monsters = [mockMonster];
      
      storageManager.saveMonsterCollection(monsters);
      const loaded = storageManager.loadMonsterCollection();
      
      expect(loaded).toHaveLength(1);
      expect(loaded[0]).toMatchObject({
        id: 'monster_1',
        name: 'ことわざドラゴン',
      });
    });

    it('空のコレクションを読み込める', () => {
      const loaded = storageManager.loadMonsterCollection();
      
      expect(loaded).toEqual([]);
    });
  });

  describe('ゲームセッションの管理', () => {
    it('ゲームセッションを保存できる', () => {
      const session: GameSession = {
        id: 'session_1',
        startTime: new Date(),
        endTime: new Date(),
        questions: [],
        answers: [],
        score: 100,
        monstersUnlocked: ['monster_1'],
      };
      
      storageManager.saveGameSession(session);
      const loaded = storageManager.loadGameSessions();
      
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe('session_1');
    });

    it('最新10セッションのみ保持する', () => {
      // 15個のセッションを保存
      for (let i = 0; i < 15; i++) {
        const session: GameSession = {
          id: `session_${i}`,
          startTime: new Date(),
          questions: [],
          answers: [],
          score: i * 10,
          monstersUnlocked: [],
        };
        storageManager.saveGameSession(session);
      }
      
      const loaded = storageManager.loadGameSessions();
      
      expect(loaded).toHaveLength(10);
      expect(loaded[0].id).toBe('session_14'); // 最新
      expect(loaded[9].id).toBe('session_5'); // 10番目に新しい
    });
  });

  describe('データのバックアップと復元', () => {
    it('全データをエクスポートできる', () => {
      storageManager.saveUserProgress(mockUserProgress);
      storageManager.saveGameSettings(mockGameSettings);
      storageManager.saveMonsterCollection([mockMonster]);
      
      const exported = storageManager.exportAllData();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveProperty('userProgress');
      expect(parsed).toHaveProperty('gameSettings');
      expect(parsed).toHaveProperty('monsterCollection');
      expect(parsed).toHaveProperty('exportDate');
    });

    it('エクスポートしたデータをインポートできる', () => {
      // データを設定してエクスポート
      storageManager.saveUserProgress(mockUserProgress);
      const exported = storageManager.exportAllData();
      
      // データをクリアしてインポート
      storageManager.clearAllData();
      expect(storageManager.loadUserProgress()).toBeNull();
      
      storageManager.importAllData(exported);
      const loaded = storageManager.loadUserProgress();
      
      expect(loaded).toEqual(mockUserProgress);
    });

    it('不正なJSONのインポートはエラーになる', () => {
      expect(() => {
        storageManager.importAllData('invalid json');
      }).toThrow(StorageError);
    });
  });

  describe('データの削除', () => {
    it('特定のデータをクリアできる', () => {
      storageManager.saveUserProgress(mockUserProgress);
      storageManager.saveGameSettings(mockGameSettings);
      
      storageManager.clearData('USER_PROGRESS');
      
      expect(storageManager.loadUserProgress()).toBeNull();
      expect(storageManager.loadGameSettings()).toEqual(mockGameSettings);
    });

    it('全データをクリアできる', () => {
      storageManager.saveUserProgress(mockUserProgress);
      storageManager.saveGameSettings(mockGameSettings);
      storageManager.saveMonsterCollection([mockMonster]);
      
      storageManager.clearAllData();
      
      expect(storageManager.loadUserProgress()).toBeNull();
      expect(storageManager.loadGameSettings()).toBeNull();
      expect(storageManager.loadMonsterCollection()).toEqual([]);
    });
  });

  describe('データ修復機能', () => {
    it('破損したユーザー進捗データを修復できる', () => {
      // 破損したデータを設定
      const corruptedProgress = {
        level: -5, // 不正な値
        experience: 'invalid', // 型が違う
        totalQuestions: 10,
        correctAnswers: 5,
      };
      localStorageMock.setItem('proverb_monster_user_progress', JSON.stringify(corruptedProgress));
      
      const { repaired, failed } = storageManager.repairData();
      
      expect(repaired).toContain('userProgress');
      expect(failed).toHaveLength(0);
      
      const repairedProgress = storageManager.loadUserProgress();
      expect(repairedProgress).not.toBeNull();
      expect(repairedProgress!.level).toBe(1);
      expect(repairedProgress!.totalQuestions).toBe(10);
    });

    it('破損したゲーム設定を修復できる', () => {
      const corruptedSettings = {
        soundEnabled: 'yes', // boolean型でない
        effectsVolume: 2.0, // 範囲外
      };
      localStorageMock.setItem('proverb_monster_game_settings', JSON.stringify(corruptedSettings));
      
      const { repaired, failed } = storageManager.repairData();
      
      expect(repaired).toContain('gameSettings');
      
      const repairedSettings = storageManager.loadGameSettings();
      expect(repairedSettings).not.toBeNull();
      expect(repairedSettings!.soundEnabled).toBe(true);
      expect(repairedSettings!.effectsVolume).toBe(0.5);
    });
  });

  describe('エラーハンドリング', () => {
    it('localStorageが使用できない場合はStorageErrorを投げる', () => {
      // localStorageを使用不可にする
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = () => {
        throw new Error('Storage disabled');
      };
      
      expect(() => {
        storageManager.saveUserProgress(mockUserProgress);
      }).toThrow(StorageError);
      
      // 元に戻す
      localStorageMock.setItem = originalSetItem;
    });

    it('容量超過時はStorageQuotaErrorを投げる', () => {
      // isAvailableが成功するように設定
      const storageManagerWithMock = new LocalStorageManager();
      
      // setItemメソッドを直接モック
      vi.spyOn(storageManagerWithMock as any, 'isAvailable').mockReturnValue(true);
      
      // QuotaExceededErrorをシミュレート
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = () => {
        const error = new DOMException('Quota exceeded');
        Object.defineProperty(error, 'name', { value: 'QuotaExceededError' });
        throw error;
      };
      
      expect(() => {
        storageManagerWithMock.saveUserProgress(mockUserProgress);
      }).toThrow(StorageQuotaError);
      
      // 元に戻す
      localStorageMock.setItem = originalSetItem;
    });
  });
});