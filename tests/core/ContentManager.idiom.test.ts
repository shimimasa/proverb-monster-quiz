import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentManager } from '@/core/ContentManager';
import { DataLoader } from '@/loaders/dataLoader';
import type { ContentItem } from '@/types';

// Mock data for idioms
const mockIdioms: ContentItem[] = [
  {
    id: 1,
    text: '頭が痛い',
    reading: 'あたまがいたい',
    meaning: '心配事で、どうしたらよいか分からず悩むこと。',
    difficulty: '小学生',
    type: 'idiom',
  },
  {
    id: 2,
    text: '頭が下がる',
    reading: 'あたまがさがる',
    meaning: '感心して、尊敬の気持ちを持つこと。',
    difficulty: '小学生',
    type: 'idiom',
  },
  {
    id: 3,
    text: '顔が広い',
    reading: 'かおがひろい',
    meaning: '知り合いが多く、交際範囲が広いこと。',
    difficulty: '小学生',
    type: 'idiom',
  },
  {
    id: 4,
    text: '顔に泥を塗る',
    reading: 'かおにどろをぬる',
    meaning: '人の名誉や評判を傷つけること。',
    difficulty: '中学生',
    type: 'idiom',
  },
  {
    id: 5,
    text: '目がない',
    reading: 'めがない',
    meaning: '大好きで、夢中になってしまうこと。',
    difficulty: '小学生',
    type: 'idiom',
  },
  {
    id: 6,
    text: '手を貸す',
    reading: 'てをかす',
    meaning: '手伝う。助ける。',
    difficulty: '小学生',
    type: 'idiom',
  },
];

// Mock DataLoader
class MockDataLoader extends DataLoader {
  constructor() {
    super('/mock');
  }
  
  async loadContent(type: string): Promise<ContentItem[]> {
    if (type === 'idiom') {
      return mockIdioms;
    }
    return [];
  }
}

describe('ContentManager - Idioms', () => {
  let contentManager: ContentManager;
  let mockDataLoader: MockDataLoader;
  
  beforeEach(() => {
    mockDataLoader = new MockDataLoader();
    contentManager = new ContentManager(mockDataLoader);
  });
  
  describe('慣用句データの読み込み', () => {
    it('慣用句データを正しく読み込める', async () => {
      const content = await contentManager.loadContent('idiom');
      
      expect(content).toHaveLength(6);
      expect(content[0]).toMatchObject({
        id: 1,
        text: '頭が痛い',
        reading: 'あたまがいたい',
        meaning: '心配事で、どうしたらよいか分からず悩むこと。',
        difficulty: '小学生',
        type: 'idiom',
      });
    });
    
    it('キャッシュからデータを取得できる', async () => {
      const loadContentSpy = vi.spyOn(mockDataLoader, 'loadContent');
      
      // 初回読み込み
      await contentManager.loadContent('idiom');
      expect(loadContentSpy).toHaveBeenCalledTimes(1);
      
      // 2回目はキャッシュから
      const cachedContent = await contentManager.loadContent('idiom');
      expect(loadContentSpy).toHaveBeenCalledTimes(1);
      expect(cachedContent).toHaveLength(6);
    });
  });
  
  describe('慣用句のランダム問題生成', () => {
    beforeEach(async () => {
      await contentManager.loadContent('idiom');
    });
    
    it('ランダムな慣用句を取得できる', () => {
      const question = contentManager.getRandomQuestion('idiom');
      
      expect(question).toBeDefined();
      expect(question?.type).toBe('idiom');
      expect(question?.text).toContain('が'); // 慣用句の特徴
    });
    
    it('難易度でフィルタリングできる', () => {
      const easyQuestions: ContentItem[] = [];
      for (let i = 0; i < 20; i++) {
        const question = contentManager.getRandomQuestion('idiom', '小学生');
        if (question) easyQuestions.push(question);
      }
      
      expect(easyQuestions.length).toBeGreaterThan(0);
      expect(easyQuestions.every(q => q.difficulty === '小学生')).toBe(true);
    });
    
    it('重複回避機能が動作する', () => {
      const usedIds = new Set<number>();
      
      // 全ての問題を取得
      for (let i = 0; i < mockIdioms.length; i++) {
        const question = contentManager.getRandomQuestion('idiom', undefined, true);
        expect(question).toBeDefined();
        if (question) {
          expect(usedIds.has(question.id)).toBe(false);
          usedIds.add(question.id);
        }
      }
      
      expect(usedIds.size).toBe(mockIdioms.length);
    });
  });
  
  describe('慣用句の選択肢生成', () => {
    beforeEach(async () => {
      await contentManager.loadContent('idiom');
    });
    
    it('正解を含む4つの選択肢を生成できる', () => {
      const correct = mockIdioms[0];
      const choices = contentManager.generateChoices(correct, 'idiom', 4);
      
      expect(choices).toHaveLength(4);
      expect(choices).toContain(correct.meaning);
      
      // 全ての選択肢が意味である
      choices.forEach(choice => {
        expect(typeof choice).toBe('string');
        expect(choice.length).toBeGreaterThan(0);
      });
    });
    
    it('同じ難易度の選択肢を優先的に選ぶ', () => {
      const correct = mockIdioms.find(item => item.difficulty === '小学生')!;
      const choices = contentManager.generateChoices(correct, 'idiom', 4);
      
      // 選択肢の中に小学生レベルの慣用句の意味が含まれていることを確認
      const easyMeanings = mockIdioms
        .filter(item => item.difficulty === '小学生')
        .map(item => item.meaning);
      
      const matchingChoices = choices.filter(choice => easyMeanings.includes(choice));
      expect(matchingChoices.length).toBeGreaterThan(0);
    });
  });
  
  describe('慣用句の統計情報', () => {
    beforeEach(async () => {
      await contentManager.loadContent('idiom');
    });
    
    it('コンテンツ数を取得できる', () => {
      const totalCount = contentManager.getContentCount('idiom');
      expect(totalCount).toBe(6);
      
      const easyCount = contentManager.getContentCount('idiom', '小学生');
      expect(easyCount).toBe(5);
      
      const mediumCount = contentManager.getContentCount('idiom', '中学生');
      expect(mediumCount).toBe(1);
    });
    
    it('難易度別の統計を取得できる', () => {
      const stats = contentManager.getContentStats('idiom');
      
      expect(stats).toEqual({
        '小学生': 5,
        '中学生': 1,
        '高校生': 0,
      });
    });
  });
  
  describe('慣用句の特徴的なパターン', () => {
    beforeEach(async () => {
      await contentManager.loadContent('idiom');
    });
    
    it('体の部位を使った慣用句が含まれる', () => {
      const bodyParts = ['頭', '顔', '目', '耳', '鼻', '口', '手', '足', '肩', '腕'];
      const questions: ContentItem[] = [];
      
      for (let i = 0; i < 10; i++) {
        const question = contentManager.getRandomQuestion('idiom');
        if (question) questions.push(question);
      }
      
      const bodyPartIdioms = questions.filter(q => 
        bodyParts.some(part => q.text.includes(part))
      );
      
      expect(bodyPartIdioms.length).toBeGreaterThan(0);
    });
  });
  
  describe('混合モード対応', () => {
    it('全てのコンテンツタイプを読み込める', async () => {
      await contentManager.loadAllContent();
      
      // 慣用句が読み込まれていることを確認
      const idiom = contentManager.getRandomQuestion('idiom');
      expect(idiom).toBeDefined();
      expect(idiom?.type).toBe('idiom');
    });
  });
});