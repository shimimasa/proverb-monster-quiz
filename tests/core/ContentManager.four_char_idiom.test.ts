import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentManager } from '@/core/ContentManager';
import { DataLoader } from '@/loaders/dataLoader';
import type { ContentItem } from '@/types';

// Mock data for four character idioms
const mockFourCharIdioms: ContentItem[] = [
  {
    id: 1,
    text: '一石二鳥',
    reading: 'いっせきにちょう',
    meaning: '一つのことをして、同時に二つの利益を得ること。',
    difficulty: '小学生',
    type: 'four_character_idiom',
  },
  {
    id: 2,
    text: '十人十色',
    reading: 'じゅうにんといろ',
    meaning: '人の考えや好みは、それぞれ違うということ。',
    difficulty: '小学生',
    type: 'four_character_idiom',
  },
  {
    id: 3,
    text: '三日坊主',
    reading: 'みっかぼうず',
    meaning: '飽きっぽくて、長続きしないこと。',
    difficulty: '小学生',
    type: 'four_character_idiom',
  },
  {
    id: 4,
    text: '一生懸命',
    reading: 'いっしょうけんめい',
    meaning: '命がけで物事をするほど、真剣に取り組むこと。',
    difficulty: '小学生',
    type: 'four_character_idiom',
  },
  {
    id: 5,
    text: '大器晩成',
    reading: 'たいきばんせい',
    meaning: '偉大な人物は、大成するのが遅いということ。',
    difficulty: '中学生',
    type: 'four_character_idiom',
  },
];

// Mock DataLoader
class MockDataLoader extends DataLoader {
  constructor() {
    super('/mock');
  }
  
  async loadContent(type: string): Promise<ContentItem[]> {
    if (type === 'four_character_idiom') {
      return mockFourCharIdioms;
    }
    return [];
  }
}

describe('ContentManager - Four Character Idioms', () => {
  let contentManager: ContentManager;
  let mockDataLoader: MockDataLoader;
  
  beforeEach(() => {
    mockDataLoader = new MockDataLoader();
    contentManager = new ContentManager(mockDataLoader);
  });
  
  describe('四字熟語データの読み込み', () => {
    it('四字熟語データを正しく読み込める', async () => {
      const content = await contentManager.loadContent('four_character_idiom');
      
      expect(content).toHaveLength(5);
      expect(content[0]).toMatchObject({
        id: 1,
        text: '一石二鳥',
        reading: 'いっせきにちょう',
        meaning: '一つのことをして、同時に二つの利益を得ること。',
        difficulty: '小学生',
        type: 'four_character_idiom',
      });
    });
    
    it('キャッシュからデータを取得できる', async () => {
      const loadContentSpy = vi.spyOn(mockDataLoader, 'loadContent');
      
      // 初回読み込み
      await contentManager.loadContent('four_character_idiom');
      expect(loadContentSpy).toHaveBeenCalledTimes(1);
      
      // 2回目はキャッシュから
      const cachedContent = await contentManager.loadContent('four_character_idiom');
      expect(loadContentSpy).toHaveBeenCalledTimes(1);
      expect(cachedContent).toHaveLength(5);
    });
  });
  
  describe('四字熟語のランダム問題生成', () => {
    beforeEach(async () => {
      await contentManager.loadContent('four_character_idiom');
    });
    
    it('ランダムな四字熟語を取得できる', () => {
      const question = contentManager.getRandomQuestion('four_character_idiom');
      
      expect(question).toBeDefined();
      expect(question?.type).toBe('four_character_idiom');
      expect(question?.text).toMatch(/^[\u4e00-\u9fa5]{4}$/); // 4文字の漢字
    });
    
    it('難易度でフィルタリングできる', () => {
      const easyQuestions: ContentItem[] = [];
      for (let i = 0; i < 20; i++) {
        const question = contentManager.getRandomQuestion('four_character_idiom', '小学生');
        if (question) easyQuestions.push(question);
      }
      
      expect(easyQuestions.length).toBeGreaterThan(0);
      expect(easyQuestions.every(q => q.difficulty === '小学生')).toBe(true);
    });
    
    it('重複回避機能が動作する', () => {
      const usedIds = new Set<number>();
      
      // 全ての問題を取得
      for (let i = 0; i < mockFourCharIdioms.length; i++) {
        const question = contentManager.getRandomQuestion('four_character_idiom', undefined, true);
        expect(question).toBeDefined();
        if (question) {
          expect(usedIds.has(question.id)).toBe(false);
          usedIds.add(question.id);
        }
      }
      
      expect(usedIds.size).toBe(mockFourCharIdioms.length);
    });
  });
  
  describe('四字熟語の選択肢生成', () => {
    beforeEach(async () => {
      await contentManager.loadContent('four_character_idiom');
    });
    
    it('正解を含む4つの選択肢を生成できる', () => {
      const correct = mockFourCharIdioms[0];
      const choices = contentManager.generateChoices(correct, 'four_character_idiom', 4);
      
      expect(choices).toHaveLength(4);
      expect(choices).toContain(correct.meaning);
      
      // 全ての選択肢が意味である
      choices.forEach(choice => {
        expect(typeof choice).toBe('string');
        expect(choice.length).toBeGreaterThan(0);
      });
    });
    
    it('同じ難易度の選択肢を優先的に選ぶ', () => {
      const correct = mockFourCharIdioms.find(item => item.difficulty === '小学生')!;
      const choices = contentManager.generateChoices(correct, 'four_character_idiom', 4);
      
      // 選択肢の中に小学生レベルの四字熟語の意味が含まれていることを確認
      const easyMeanings = mockFourCharIdioms
        .filter(item => item.difficulty === '小学生')
        .map(item => item.meaning);
      
      const matchingChoices = choices.filter(choice => easyMeanings.includes(choice));
      expect(matchingChoices.length).toBeGreaterThan(0);
    });
  });
  
  describe('四字熟語の統計情報', () => {
    beforeEach(async () => {
      await contentManager.loadContent('four_character_idiom');
    });
    
    it('コンテンツ数を取得できる', () => {
      const totalCount = contentManager.getContentCount('four_character_idiom');
      expect(totalCount).toBe(5);
      
      const easyCount = contentManager.getContentCount('four_character_idiom', '小学生');
      expect(easyCount).toBe(4);
      
      const mediumCount = contentManager.getContentCount('four_character_idiom', '中学生');
      expect(mediumCount).toBe(1);
    });
    
    it('難易度別の統計を取得できる', () => {
      const stats = contentManager.getContentStats('four_character_idiom');
      
      expect(stats).toEqual({
        '小学生': 4,
        '中学生': 1,
        '高校生': 0,
      });
    });
  });
  
  describe('混合モード対応', () => {
    it('全てのコンテンツタイプを読み込める', async () => {
      await contentManager.loadAllContent();
      
      // 四字熟語が読み込まれていることを確認
      const fourCharIdiom = contentManager.getRandomQuestion('four_character_idiom');
      expect(fourCharIdiom).toBeDefined();
      expect(fourCharIdiom?.type).toBe('four_character_idiom');
    });
  });
});