import { describe, it, expect, beforeEach, vi } from 'vitest';
import { searchManager } from '../../src/core/SearchManager';
import { contentManager } from '../../src/core/ContentManager';
import { monsterManager } from '../../src/core/MonsterManager';
import type { ContentItem, Monster } from '../../src/types';

vi.mock('../../src/core/ContentManager');
vi.mock('../../src/core/MonsterManager');

describe('SearchManager', () => {
  const mockContentItems: ContentItem[] = [
    {
      id: 1,
      text: '猿も木から落ちる',
      reading: 'さるもきからおちる',
      meaning: 'どんなに得意なことでも失敗することがある',
      difficulty: '小学生',
      example_sentence: 'プロでも失敗する。猿も木から落ちる。',
      type: 'proverb'
    },
    {
      id: 2,
      text: '一石二鳥',
      reading: 'いっせきにちょう',
      meaning: '一つの行為で二つの利益を得る',
      difficulty: '中学生',
      example_sentence: '買い物ついでに図書館に寄る。一石二鳥だ。',
      type: 'four_character_idiom'
    },
    {
      id: 3,
      text: '手を焼く',
      reading: 'てをやく',
      meaning: '扱いに困る、世話に苦労する',
      difficulty: '高校生',
      example_sentence: '子育てに手を焼いている。',
      type: 'idiom'
    }
  ];

  const mockMonsters: Monster[] = [
    {
      id: 'monster_1',
      name: 'サルモ',
      image: 'monkey.svg',
      rarity: 'common',
      sourceContent: mockContentItems[0],
      unlocked: true,
      dateObtained: new Date('2024-01-01')
    },
    {
      id: 'monster_2',
      name: 'ニチョウ',
      image: 'bird.svg',
      rarity: 'rare',
      sourceContent: mockContentItems[1],
      unlocked: true,
      dateObtained: new Date('2024-01-02')
    },
    {
      id: 'monster_3',
      name: 'ヤキテ',
      image: 'fire.svg',
      rarity: 'epic',
      sourceContent: mockContentItems[2],
      unlocked: false
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contentManager.getAllContent).mockReturnValue(mockContentItems);
    vi.mocked(monsterManager.getAllMonsters).mockReturnValue(mockMonsters);
  });

  describe('searchContent', () => {
    it('空のクエリで空配列を返す', () => {
      const results = searchManager.searchContent({ query: '' });
      expect(results).toEqual([]);
    });

    it('テキストの完全一致で検索できる', () => {
      const results = searchManager.searchContent({ query: '猿も木から落ちる' });
      expect(results).toHaveLength(1);
      expect(results[0].item.id).toBe(1);
      expect(results[0].score).toBeGreaterThan(0);
    });

    it('部分一致で検索できる', () => {
      const results = searchManager.searchContent({ query: '猿' });
      expect(results).toHaveLength(1);
      expect(results[0].item.text).toContain('猿');
    });

    it('読み仮名で検索できる', () => {
      const results = searchManager.searchContent({ 
        query: 'さる',
        includeReadings: true 
      });
      expect(results).toHaveLength(1);
      expect(results[0].item.reading).toContain('さる');
    });

    it('意味で検索できる', () => {
      const results = searchManager.searchContent({ 
        query: '失敗',
        includeMeanings: true 
      });
      expect(results).toHaveLength(1);
      expect(results[0].item.meaning).toContain('失敗');
    });

    it('コンテンツタイプでフィルターできる', () => {
      const results = searchManager.searchContent({ 
        query: '',
        contentTypes: ['proverb']
      });
      expect(results).toHaveLength(0); // 空のクエリなので0件

      const allProverbs = searchManager.searchContent({ 
        query: 'る',
        contentTypes: ['proverb']
      });
      expect(allProverbs.every(r => r.item.type === 'proverb')).toBe(true);
    });

    it('難易度でフィルターできる', () => {
      const results = searchManager.searchContent({ 
        query: '石',
        difficulties: ['中学生']
      });
      expect(results).toHaveLength(1);
      expect(results[0].item.difficulty).toBe('中学生');
    });

    it('ひらがな・カタカナを正規化して検索できる', () => {
      const hiraganaResults = searchManager.searchContent({ query: 'さる' });
      const katakanaResults = searchManager.searchContent({ query: 'サル' });
      expect(hiraganaResults.length).toBe(katakanaResults.length);
    });

    it('スコアの高い順にソートされる', () => {
      const results = searchManager.searchContent({ 
        query: '手',
        includeMeanings: true 
      });
      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
        }
      }
    });
  });

  describe('searchMonsters', () => {
    it('空のクエリですべてのモンスターを返す（フィルターなし）', () => {
      const results = searchManager.searchMonsters('', {});
      expect(results).toHaveLength(mockMonsters.length);
    });

    it('モンスター名で検索できる', () => {
      const results = searchManager.searchMonsters('サルモ');
      expect(results).toHaveLength(1);
      expect(results[0].item.name).toBe('サルモ');
    });

    it('関連コンテンツのテキストで検索できる', () => {
      const results = searchManager.searchMonsters('一石二鳥');
      expect(results).toHaveLength(1);
      expect(results[0].item.sourceContent.text).toBe('一石二鳥');
    });

    it('レアリティでフィルターできる', () => {
      const results = searchManager.searchMonsters('', {
        rarities: ['rare', 'epic']
      });
      expect(results).toHaveLength(2);
      expect(results.every(r => ['rare', 'epic'].includes(r.item.rarity))).toBe(true);
    });

    it('取得状況でフィルターできる', () => {
      const unlockedResults = searchManager.searchMonsters('', {
        unlocked: true
      });
      expect(unlockedResults).toHaveLength(2);
      expect(unlockedResults.every(r => r.item.unlocked)).toBe(true);

      const lockedResults = searchManager.searchMonsters('', {
        unlocked: false
      });
      expect(lockedResults).toHaveLength(1);
      expect(lockedResults.every(r => !r.item.unlocked)).toBe(true);
    });

    it('コンテンツタイプでフィルターできる', () => {
      const results = searchManager.searchMonsters('', {
        contentTypes: ['idiom']
      });
      expect(results).toHaveLength(1);
      expect(results[0].item.sourceContent.type).toBe('idiom');
    });

    it('複数のフィルターを組み合わせられる', () => {
      const results = searchManager.searchMonsters('', {
        rarities: ['common', 'rare'],
        unlocked: true,
        contentTypes: ['proverb', 'four_character_idiom']
      });
      expect(results).toHaveLength(2);
    });
  });

  describe('filterContent', () => {
    it('すべてのコンテンツを返す（フィルターなし）', () => {
      const results = searchManager.filterContent({});
      expect(results).toHaveLength(mockContentItems.length);
    });

    it('コンテンツタイプでフィルターできる', () => {
      const results = searchManager.filterContent({
        contentTypes: ['proverb', 'idiom']
      });
      expect(results).toHaveLength(2);
      expect(results.every(item => ['proverb', 'idiom'].includes(item.type))).toBe(true);
    });

    it('難易度でフィルターできる', () => {
      const results = searchManager.filterContent({
        difficulties: ['小学生', '中学生']
      });
      expect(results).toHaveLength(2);
      expect(results.every(item => ['小学生', '中学生'].includes(item.difficulty))).toBe(true);
    });
  });

  describe('getSuggestedQueries', () => {
    it('部分一致する候補を返す', () => {
      const suggestions = searchManager.getSuggestedQueries('猿', 5);
      expect(suggestions).toContain('猿も木から落ちる');
    });

    it('読み仮名からも候補を返す', () => {
      const suggestions = searchManager.getSuggestedQueries('いっせき', 5);
      expect(suggestions).toContain('いっせきにちょう');
    });

    it('モンスター名からも候補を返す', () => {
      const suggestions = searchManager.getSuggestedQueries('サル', 5);
      expect(suggestions).toContain('サルモ');
    });

    it('指定された件数以下の候補を返す', () => {
      const suggestions = searchManager.getSuggestedQueries('', 3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('正規化して検索する', () => {
      const hiragana = searchManager.getSuggestedQueries('さる', 5);
      const katakana = searchManager.getSuggestedQueries('サル', 5);
      // 両方とも同じような結果を返すはず
      expect(hiragana.length).toBeGreaterThan(0);
      expect(katakana.length).toBeGreaterThan(0);
    });
  });

  describe('検索結果のマッチ情報', () => {
    it('マッチした位置情報を含む', () => {
      const results = searchManager.searchContent({ query: '猿' });
      expect(results[0].matches).toBeDefined();
      expect(results[0].matches.length).toBeGreaterThan(0);
      expect(results[0].matches[0].field).toBe('text');
      expect(results[0].matches[0].indices).toBeDefined();
    });

    it('複数フィールドでマッチした場合、すべてのマッチ情報を含む', () => {
      const results = searchManager.searchContent({ 
        query: '手',
        includeReadings: true,
        includeMeanings: true
      });
      const handResult = results.find(r => r.item.text === '手を焼く');
      expect(handResult).toBeDefined();
      if (handResult) {
        const fields = handResult.matches.map(m => m.field);
        expect(fields).toContain('text');
      }
    });
  });
});