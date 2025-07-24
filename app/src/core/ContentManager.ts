import type { ContentItem, ContentType, Difficulty } from '@types/index';
import { dataLoader, DataLoader } from '../loaders/dataLoader';

export class ContentManager {
  private contentCache: Map<ContentType, ContentItem[]> = new Map();
  private dataLoader: DataLoader;
  private usedQuestions: Map<ContentType, Set<number>> = new Map();

  constructor(loader?: DataLoader) {
    this.dataLoader = loader || dataLoader;
  }

  async loadContent(type: ContentType): Promise<ContentItem[]> {
    if (this.contentCache.has(type)) {
      return this.contentCache.get(type)!;
    }

    try {
      const content = await this.dataLoader.loadContent(type);
      this.contentCache.set(type, content);
      return content;
    } catch (error) {
      console.error(`Error loading content for ${type}:`, error);
      return [];
    }
  }

  getRandomQuestion(
    type: ContentType,
    difficulty?: Difficulty,
    avoidRepeat: boolean = true
  ): ContentItem | null {
    const content = this.contentCache.get(type) || [];
    
    let filteredContent = content;
    if (difficulty) {
      filteredContent = content.filter(item => item.difficulty === difficulty);
    }

    if (filteredContent.length === 0) {
      return null;
    }

    // 重複回避機能
    if (avoidRepeat) {
      const usedIds = this.usedQuestions.get(type) || new Set();
      const availableContent = filteredContent.filter(item => !usedIds.has(item.id));
      
      // 全て使用済みの場合はリセット
      if (availableContent.length === 0) {
        this.resetUsedQuestions(type);
        return this.getRandomQuestion(type, difficulty, false);
      }
      
      filteredContent = availableContent;
    }

    const randomIndex = Math.floor(Math.random() * filteredContent.length);
    const selected = filteredContent[randomIndex];
    
    // 使用済みとして記録
    if (avoidRepeat) {
      this.markQuestionAsUsed(type, selected.id);
    }
    
    return selected;
  }

  // 混合モードでのランダム問題取得
  getRandomQuestionMixed(
    types: ContentType[],
    weights?: { [key in ContentType]?: number },
    difficulty?: Difficulty,
    avoidRepeat: boolean = true
  ): ContentItem | null {
    if (types.length === 0) {
      return null;
    }

    // デフォルトの重み付け（均等）
    const defaultWeight = 100 / types.length;
    const typeWeights = types.map(type => ({
      type,
      weight: weights?.[type] || defaultWeight
    }));

    // 累積重みを計算
    let totalWeight = 0;
    const cumulativeWeights = typeWeights.map(tw => {
      totalWeight += tw.weight;
      return { type: tw.type, cumWeight: totalWeight };
    });

    // ランダムにタイプを選択
    const random = Math.random() * totalWeight;
    const selectedType = cumulativeWeights.find(cw => random <= cw.cumWeight)?.type || types[0];

    // 選択されたタイプから問題を取得
    return this.getRandomQuestion(selectedType, difficulty, avoidRepeat);
  }

  generateChoices(correct: ContentItem, type: ContentType, count: number = 4): string[] {
    const content = this.contentCache.get(type) || [];
    const choices: string[] = [correct.meaning];

    // 同じ難易度の選択肢を優先的に選ぶ
    const sameDifficulty = content.filter(
      item => item.id !== correct.id && item.difficulty === correct.difficulty
    );
    const otherDifficulty = content.filter(
      item => item.id !== correct.id && item.difficulty !== correct.difficulty
    );
    
    // 同じ難易度から選択肢を追加
    const addChoicesFrom = (items: ContentItem[]) => {
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      for (const item of shuffled) {
        if (choices.length >= count) break;
        if (!choices.includes(item.meaning)) {
          choices.push(item.meaning);
        }
      }
    };
    
    addChoicesFrom(sameDifficulty);
    if (choices.length < count) {
      addChoicesFrom(otherDifficulty);
    }

    // シャッフル
    return this.shuffleArray(choices);
  }

  // 全てのコンテンツタイプを読み込む
  async loadAllContent(): Promise<void> {
    const types: ContentType[] = ['proverb', 'idiom', 'four_character_idiom'];
    await Promise.all(types.map(type => this.loadContent(type)));
  }

  // 特定の難易度のコンテンツ数を取得
  getContentCount(type: ContentType, difficulty?: Difficulty): number {
    const content = this.contentCache.get(type) || [];
    if (!difficulty) {
      return content.length;
    }
    return content.filter(item => item.difficulty === difficulty).length;
  }

  // 難易度別の統計を取得
  getContentStats(type: ContentType): Record<Difficulty, number> {
    const content = this.contentCache.get(type) || [];
    const stats: Record<Difficulty, number> = {
      '小学生': 0,
      '中学生': 0,
      '高校生': 0,
    };
    
    content.forEach(item => {
      stats[item.difficulty]++;
    });
    
    return stats;
  }

  // すべてのコンテンツを取得
  getAllContent(): ContentItem[] {
    const allContent: ContentItem[] = [];
    const types: ContentType[] = ['proverb', 'idiom', 'four_character_idiom'];
    
    types.forEach(type => {
      const content = this.contentCache.get(type) || [];
      allContent.push(...content);
    });
    
    return allContent;
  }

  // キャッシュをクリア
  clearCache(): void {
    this.contentCache.clear();
    this.usedQuestions.clear();
    this.dataLoader.clearCache();
  }

  // 特定タイプの使用済み問題をリセット
  private resetUsedQuestions(type: ContentType): void {
    this.usedQuestions.set(type, new Set());
  }

  // 問題を使用済みとしてマーク
  private markQuestionAsUsed(type: ContentType, id: number): void {
    if (!this.usedQuestions.has(type)) {
      this.usedQuestions.set(type, new Set());
    }
    this.usedQuestions.get(type)!.add(id);
  }

  // 配列をシャッフル
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // 使用済み質問の管理
  private markQuestionAsUsed(type: ContentType, id: number): void {
    if (!this.usedQuestions.has(type)) {
      this.usedQuestions.set(type, new Set());
    }
    this.usedQuestions.get(type)!.add(id);
  }

  private resetUsedQuestions(type: ContentType): void {
    this.usedQuestions.delete(type);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}