import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MonsterManager } from '../../src/core/MonsterManager';
import { localStorageManager } from '../../src/loaders/localStorageManager';
import { ContentItem, Monster, MonsterRarity } from '../../src/types';

// localStorageManagerのモック
vi.mock('../../src/loaders/localStorageManager', () => {
  const mockLoadMonsterCollection = vi.fn();
  const mockSaveMonsterCollection = vi.fn();
  
  return {
    localStorageManager: {
      loadMonsterCollection: mockLoadMonsterCollection,
      saveMonsterCollection: mockSaveMonsterCollection,
    },
  };
});

// モックデータ
const mockContentItem: ContentItem = {
  id: 1,
  text: "猿も木から落ちる",
  reading: "さるもきからおちる",
  meaning: "どんなに得意なことでも、時には失敗することがある",
  difficulty: "小学生",
  example_sentence: "プロの料理人でも失敗することがある。",
  type: "proverb",
};

const mockContentItem2: ContentItem = {
  id: 2,
  text: "虎穴に入らずんば虎子を得ず",
  reading: "こけつにいらずんばこじをえず",
  meaning: "危険を冒さなければ大きな成功は得られない",
  difficulty: "中学生",
  example_sentence: "新しい事業を始めるのはリスクがあるが、虎穴に入らずんば虎子を得ずだ。",
  type: "proverb",
};

describe('MonsterManager', () => {
  let monsterManager: MonsterManager;

  beforeEach(() => {
    vi.clearAllMocks();
    // 新しいインスタンスを作成する前に、モックをリセット
    vi.mocked(localStorageManager.loadMonsterCollection).mockReturnValue([]);
    vi.mocked(localStorageManager.saveMonsterCollection).mockClear();
    monsterManager = new MonsterManager();
  });

  describe('generateMonster', () => {
    it('新しいモンスターを生成できる', () => {
      const result = monsterManager.generateMonster(mockContentItem);
      
      expect(result.isNew).toBe(true);
      expect(result.monster).toMatchObject({
        id: 'monster_proverb_1',
        rarity: expect.any(String),
        sourceContent: mockContentItem,
        unlocked: false,
      });
      expect(result.monster.name).toContain('猿');
      expect(result.reward).toBeUndefined();
    });

    it('既存のモンスターは再生成しない', () => {
      const result1 = monsterManager.generateMonster(mockContentItem);
      const result2 = monsterManager.generateMonster(mockContentItem);
      
      expect(result1.isNew).toBe(true);
      expect(result2.isNew).toBe(false);
      expect(result2.monster.id).toBe(result1.monster.id);
    });

    it('アンロック済みの重複モンスターは報酬を提供する', () => {
      const result1 = monsterManager.generateMonster(mockContentItem);
      monsterManager.unlockMonster(result1.monster.id);
      
      const result2 = monsterManager.generateMonster(mockContentItem);
      
      expect(result2.isNew).toBe(false);
      expect(result2.reward).toBeDefined();
      expect(result2.reward?.type).toMatch(/experience|coins/);
    });
  });

  describe('unlockMonster', () => {
    it('モンスターをアンロックできる', () => {
      const generateResult = monsterManager.generateMonster(mockContentItem);
      const unlockResult = monsterManager.unlockMonster(generateResult.monster.id);
      
      expect(unlockResult).not.toBeNull();
      expect(unlockResult!.isNew).toBe(true);
      expect(unlockResult!.monster.unlocked).toBe(true);
      expect(unlockResult!.monster.dateObtained).toBeInstanceOf(Date);
    });

    it('既にアンロック済みのモンスターは報酬を返す', () => {
      const generateResult = monsterManager.generateMonster(mockContentItem);
      monsterManager.unlockMonster(generateResult.monster.id);
      
      const secondUnlock = monsterManager.unlockMonster(generateResult.monster.id);
      
      expect(secondUnlock).not.toBeNull();
      expect(secondUnlock!.isNew).toBe(false);
      expect(secondUnlock!.reward).toBeDefined();
    });

    it('存在しないモンスターIDはnullを返す', () => {
      const result = monsterManager.unlockMonster('invalid_id');
      
      expect(result).toBeNull();
    });
  });

  describe('getCollection', () => {
    it('全てのモンスターを取得できる', () => {
      monsterManager.generateMonster(mockContentItem);
      monsterManager.generateMonster(mockContentItem2);
      
      const collection = monsterManager.getCollection();
      
      expect(collection).toHaveLength(2);
      expect(collection.map(m => m.id)).toContain('monster_proverb_1');
      expect(collection.map(m => m.id)).toContain('monster_proverb_2');
    });

    it('アンロック済みモンスターのみ取得できる', () => {
      const result1 = monsterManager.generateMonster(mockContentItem);
      const result2 = monsterManager.generateMonster(mockContentItem2);
      
      monsterManager.unlockMonster(result1.monster.id);
      
      const unlocked = monsterManager.getUnlockedMonsters();
      
      expect(unlocked).toHaveLength(1);
      expect(unlocked[0].id).toBe(result1.monster.id);
    });
  });

  describe('getCollectionStats', () => {
    it('コレクション統計を取得できる', () => {
      const result1 = monsterManager.generateMonster(mockContentItem);
      const result2 = monsterManager.generateMonster(mockContentItem2);
      
      monsterManager.unlockMonster(result1.monster.id);
      
      const stats = monsterManager.getCollectionStats();
      
      expect(stats.total).toBe(2);
      expect(stats.unlocked).toBe(1);
      expect(stats.completionRate).toBe(50);
      expect(stats.byRarity).toBeDefined();
    });

    it('レアリティ別の統計が正しい', () => {
      // 複数のモンスターを生成してレアリティ分布を確認
      for (let i = 0; i < 10; i++) {
        const content: ContentItem = { ...mockContentItem, id: i };
        monsterManager.generateMonster(content);
      }
      
      const stats = monsterManager.getCollectionStats();
      const totalByRarity = 
        stats.byRarity.common.total +
        stats.byRarity.rare.total +
        stats.byRarity.epic.total +
        stats.byRarity.legendary.total;
      
      expect(totalByRarity).toBe(10);
    });
  });

  describe('getMonsterById', () => {
    it('IDでモンスターを取得できる', () => {
      const result = monsterManager.generateMonster(mockContentItem);
      const monster = monsterManager.getMonsterById(result.monster.id);
      
      expect(monster).not.toBeNull();
      expect(monster?.id).toBe(result.monster.id);
    });

    it('存在しないIDはnullを返す', () => {
      const monster = monsterManager.getMonsterById('invalid_id');
      
      expect(monster).toBeNull();
    });
  });

  describe('getMonstersByRarity', () => {
    it('レアリティ別にモンスターを取得できる', () => {
      // モックを使用してレアリティを固定
      const managerWithMock = new MonsterManager();
      
      // 複数のモンスターを生成
      for (let i = 0; i < 5; i++) {
        const content: ContentItem = { ...mockContentItem, id: i };
        managerWithMock.generateMonster(content);
      }
      
      const collection = managerWithMock.getCollection();
      const commonMonsters = managerWithMock.getMonstersByRarity('common');
      const rareMonsters = managerWithMock.getMonstersByRarity('rare');
      
      // 少なくとも1つのモンスターが生成されていることを確認
      expect(collection.length).toBeGreaterThan(0);
      expect(commonMonsters.length + rareMonsters.length).toBeLessThanOrEqual(collection.length);
    });
  });

  describe('getMonstersByContentType', () => {
    it('コンテンツタイプ別にモンスターを取得できる', () => {
      const proverbContent = { ...mockContentItem, type: 'proverb' as const };
      const idiomContent = { ...mockContentItem, id: 2, type: 'idiom' as const };
      
      monsterManager.generateMonster(proverbContent);
      monsterManager.generateMonster(idiomContent);
      
      const proverbMonsters = monsterManager.getMonstersByContentType('proverb');
      const idiomMonsters = monsterManager.getMonstersByContentType('idiom');
      
      expect(proverbMonsters).toHaveLength(1);
      expect(idiomMonsters).toHaveLength(1);
      expect(proverbMonsters[0].sourceContent.type).toBe('proverb');
      expect(idiomMonsters[0].sourceContent.type).toBe('idiom');
    });
  });

  describe('getRecentlyUnlockedMonsters', () => {
    it('最近アンロックしたモンスターを取得できる', async () => {
      const results = [];
      
      // 時間差でアンロック
      for (let i = 0; i < 3; i++) {
        const content: ContentItem = { ...mockContentItem, id: i };
        const result = monsterManager.generateMonster(content);
        results.push(result);
        
        await new Promise(resolve => setTimeout(resolve, 10));
        monsterManager.unlockMonster(result.monster.id);
      }
      
      const recent = monsterManager.getRecentlyUnlockedMonsters(2);
      
      expect(recent).toHaveLength(2);
      expect(recent[0].id).toBe(results[2].monster.id); // 最新
      expect(recent[1].id).toBe(results[1].monster.id); // 2番目に新しい
    });
  });

  describe('getCompletionProgress', () => {
    it('完成度の進捗を計算できる', () => {
      // 10体生成、5体アンロック
      for (let i = 0; i < 10; i++) {
        const content: ContentItem = { ...mockContentItem, id: i };
        const result = monsterManager.generateMonster(content);
        
        if (i < 5) {
          monsterManager.unlockMonster(result.monster.id);
        }
      }
      
      const progress = monsterManager.getCompletionProgress();
      
      expect(progress.percentage).toBe(50);
      expect(progress.nextMilestone).toBe(75);
      expect(progress.monstersToNextMilestone).toBe(3); // 75%に到達するには8体必要、現在5体
    });

    it('100%完成時の進捗', () => {
      const result = monsterManager.generateMonster(mockContentItem);
      monsterManager.unlockMonster(result.monster.id);
      
      const progress = monsterManager.getCompletionProgress();
      
      expect(progress.percentage).toBe(100);
      expect(progress.nextMilestone).toBe(100);
      expect(progress.monstersToNextMilestone).toBe(0);
    });
  });

  describe('ストレージ連携', () => {
    it('コレクションを保存する', () => {
      monsterManager.generateMonster(mockContentItem);
      
      expect(localStorageManager.saveMonsterCollection).toHaveBeenCalled();
    });

    it('起動時にコレクションを読み込む', () => {
      const savedMonster: Monster = {
        id: 'saved_monster',
        name: '保存済みモンスター',
        image: 'saved.png',
        rarity: 'rare',
        sourceContent: mockContentItem,
        unlocked: true,
        dateObtained: new Date(),
      };
      
      vi.mocked(localStorageManager.loadMonsterCollection).mockReturnValue([savedMonster]);
      
      const newManager = new MonsterManager();
      const monster = newManager.getMonsterById('saved_monster');
      
      expect(monster).not.toBeNull();
      expect(monster?.name).toBe('保存済みモンスター');
    });
  });

  describe('デバッグ機能', () => {
    it('コレクションをリセットできる', () => {
      monsterManager.generateMonster(mockContentItem);
      monsterManager.generateMonster(mockContentItem2);
      
      monsterManager.resetCollection();
      
      expect(monsterManager.getCollection()).toHaveLength(0);
    });

    it('全モンスターを即座にアンロックできる', () => {
      monsterManager.generateMonster(mockContentItem);
      monsterManager.generateMonster(mockContentItem2);
      
      monsterManager.unlockAllMonsters();
      
      const unlocked = monsterManager.getUnlockedMonsters();
      expect(unlocked).toHaveLength(2);
    });
  });

  describe('レアリティシステム', () => {
    it('難易度によってレアリティ分布が変わる', () => {
      const difficulties = ['小学生', '中学生', '高校生'] as const;
      const results: Record<string, Record<MonsterRarity, number>> = {};
      
      // 各難易度で100体ずつ生成してレアリティ分布を確認
      difficulties.forEach(difficulty => {
        const manager = new MonsterManager();
        results[difficulty] = { common: 0, rare: 0, epic: 0, legendary: 0 };
        
        for (let i = 0; i < 100; i++) {
          const content: ContentItem = { ...mockContentItem, id: i, difficulty };
          const result = manager.generateMonster(content);
          results[difficulty][result.monster.rarity]++;
        }
      });
      
      // 高難易度ほどレアモンスターが出やすい傾向を確認
      expect(results['小学生'].common).toBeGreaterThan(results['高校生'].common);
      expect(results['小学生'].legendary).toBeLessThanOrEqual(results['高校生'].legendary);
    });
  });
});