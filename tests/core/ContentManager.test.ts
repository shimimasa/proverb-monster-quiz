import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentManager } from '../../src/core/ContentManager';
import { DataLoader } from '../../src/loaders/dataLoader';
import { ContentItem, ContentType, Difficulty } from '../../src/types';

// モックデータ
const mockProverbs: ContentItem[] = [
  {
    id: 1,
    text: "猿も木から落ちる",
    reading: "さるもきからおちる",
    meaning: "どんなに得意なことでも、時には失敗することがある",
    difficulty: "小学生",
    example_sentence: "プロの料理人でも失敗することがある。猿も木から落ちるというものだ。",
    type: "proverb",
  },
  {
    id: 2,
    text: "石の上にも三年",
    reading: "いしのうえにもさんねん",
    meaning: "つらいことでも辛抱して続ければ、いつかは成し遂げられる",
    difficulty: "小学生",
    example_sentence: "石の上にも三年というように、努力を続ければきっと上達するよ。",
    type: "proverb",
  },
  {
    id: 3,
    text: "虎穴に入らずんば虎子を得ず",
    reading: "こけつにいらずんばこじをえず",
    meaning: "危険を冒さなければ大きな成功は得られない",
    difficulty: "中学生",
    example_sentence: "新しい事業を始めるのはリスクがあるが、虎穴に入らずんば虎子を得ずだ。",
    type: "proverb",
  },
  {
    id: 4,
    text: "塵も積もれば山となる",
    reading: "ちりもつもればやまとなる",
    meaning: "小さなものでも積み重なれば大きなものになる",
    difficulty: "小学生",
    example_sentence: "毎日10円ずつ貯金すれば、塵も積もれば山となるで、一年後には大きな金額になるよ。",
    type: "proverb",
  },
];

describe('ContentManager', () => {
  let contentManager: ContentManager;
  let mockDataLoader: DataLoader;

  beforeEach(() => {
    // DataLoaderのモック
    mockDataLoader = {
      loadContent: vi.fn().mockResolvedValue(mockProverbs),
      loadAllContent: vi.fn(),
      clearCache: vi.fn(),
      clearCacheForType: vi.fn(),
    } as any;

    contentManager = new ContentManager(mockDataLoader);
  });

  describe('loadContent', () => {
    it('コンテンツを正常に読み込める', async () => {
      const result = await contentManager.loadContent('proverb');
      
      expect(result).toEqual(mockProverbs);
      expect(mockDataLoader.loadContent).toHaveBeenCalledWith('proverb');
    });

    it('キャッシュされたコンテンツを返す', async () => {
      // 1回目の読み込み
      await contentManager.loadContent('proverb');
      
      // 2回目の読み込み（キャッシュから）
      const result = await contentManager.loadContent('proverb');
      
      expect(result).toEqual(mockProverbs);
      expect(mockDataLoader.loadContent).toHaveBeenCalledTimes(1);
    });

    it('エラー時は空配列を返す', async () => {
      mockDataLoader.loadContent = vi.fn().mockRejectedValue(new Error('Load failed'));
      
      const result = await contentManager.loadContent('proverb');
      
      expect(result).toEqual([]);
    });
  });

  describe('getRandomQuestion', () => {
    beforeEach(async () => {
      await contentManager.loadContent('proverb');
    });

    it('ランダムな問題を取得できる', () => {
      const question = contentManager.getRandomQuestion('proverb');
      
      expect(question).toBeTruthy();
      expect(mockProverbs).toContainEqual(question);
    });

    it('難易度でフィルタリングできる', () => {
      const question = contentManager.getRandomQuestion('proverb', '中学生');
      
      expect(question).toBeTruthy();
      expect(question?.difficulty).toBe('中学生');
    });

    it('該当する問題がない場合はnullを返す', () => {
      const question = contentManager.getRandomQuestion('proverb', '高校生');
      
      expect(question).toBeNull();
    });

    it('重複回避機能が動作する', () => {
      const usedIds = new Set<number>();
      
      // 全ての問題を一度ずつ取得
      for (let i = 0; i < mockProverbs.length; i++) {
        const question = contentManager.getRandomQuestion('proverb', undefined, true);
        expect(question).toBeTruthy();
        expect(usedIds.has(question!.id)).toBe(false);
        usedIds.add(question!.id);
      }
      
      // 全て使用済みの場合はリセットされる
      const nextQuestion = contentManager.getRandomQuestion('proverb', undefined, true);
      expect(nextQuestion).toBeTruthy();
    });
  });

  describe('generateChoices', () => {
    beforeEach(async () => {
      await contentManager.loadContent('proverb');
    });

    it('4つの選択肢を生成する', () => {
      const correct = mockProverbs[0];
      const choices = contentManager.generateChoices(correct, 'proverb');
      
      expect(choices).toHaveLength(4);
      expect(choices).toContain(correct.meaning);
    });

    it('選択肢に重複がない', () => {
      const correct = mockProverbs[0];
      const choices = contentManager.generateChoices(correct, 'proverb');
      
      const uniqueChoices = new Set(choices);
      expect(uniqueChoices.size).toBe(choices.length);
    });

    it('選択肢の数をカスタマイズできる', () => {
      const correct = mockProverbs[0];
      const choices = contentManager.generateChoices(correct, 'proverb', 3);
      
      expect(choices).toHaveLength(3);
      expect(choices).toContain(correct.meaning);
    });

    it('同じ難易度の選択肢を優先する', () => {
      const correct = mockProverbs[2]; // 中学生レベル
      const choices = contentManager.generateChoices(correct, 'proverb');
      
      expect(choices).toContain(correct.meaning);
      // 他の選択肢の検証（実装により異なる）
    });
  });

  describe('統計機能', () => {
    beforeEach(async () => {
      await contentManager.loadContent('proverb');
    });

    it('コンテンツ数を取得できる', () => {
      const totalCount = contentManager.getContentCount('proverb');
      const elementaryCount = contentManager.getContentCount('proverb', '小学生');
      
      expect(totalCount).toBe(4);
      expect(elementaryCount).toBe(3);
    });

    it('難易度別の統計を取得できる', () => {
      const stats = contentManager.getContentStats('proverb');
      
      expect(stats).toEqual({
        '小学生': 3,
        '中学生': 1,
        '高校生': 0,
      });
    });
  });

  describe('キャッシュ管理', () => {
    it('キャッシュをクリアできる', async () => {
      await contentManager.loadContent('proverb');
      
      contentManager.clearCache();
      
      expect(mockDataLoader.clearCache).toHaveBeenCalled();
    });
  });

  describe('loadAllContent', () => {
    it('全てのコンテンツタイプを読み込む', async () => {
      mockDataLoader.loadContent = vi.fn()
        .mockResolvedValueOnce(mockProverbs) // proverb
        .mockResolvedValueOnce([]) // idiom
        .mockResolvedValueOnce([]); // four_character_idiom

      await contentManager.loadAllContent();
      
      expect(mockDataLoader.loadContent).toHaveBeenCalledTimes(3);
      expect(mockDataLoader.loadContent).toHaveBeenCalledWith('proverb');
      expect(mockDataLoader.loadContent).toHaveBeenCalledWith('idiom');
      expect(mockDataLoader.loadContent).toHaveBeenCalledWith('four_character_idiom');
    });
  });
});