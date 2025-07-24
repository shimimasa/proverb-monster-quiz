import { ContentItem, Monster } from '../types';
import { ContentManager } from './ContentManager';
import { MonsterManager } from './MonsterManager';

export interface SearchOptions {
  query: string;
  contentTypes?: Array<'proverb' | 'idiom' | 'four_character_idiom'>;
  difficulties?: Array<'小学生' | '中学生' | '高校生'>;
  includeReadings?: boolean;
  includeMeanings?: boolean;
}

export interface FilterOptions {
  contentTypes?: Array<'proverb' | 'idiom' | 'four_character_idiom'>;
  difficulties?: Array<'小学生' | '中学生' | '高校生'>;
  rarities?: Array<'common' | 'rare' | 'epic' | 'legendary'>;
  unlocked?: boolean | null;
  favorite?: boolean;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  matches: {
    field: string;
    indices: Array<[number, number]>;
  }[];
}

class SearchManager {
  private contentManager: ContentManager;
  private monsterManager: MonsterManager;

  constructor() {
    this.contentManager = new ContentManager();
    this.monsterManager = new MonsterManager();
  }

  private normalizeText(text: string): string {
    // ひらがな・カタカナの正規化
    return text
      .toLowerCase()
      .replace(/[\u3041-\u3096]/g, (match) => 
        String.fromCharCode(match.charCodeAt(0) + 0x60)
      );
  }

  private calculateScore(
    query: string, 
    text: string, 
    fieldWeight: number = 1.0
  ): number {
    const normalizedQuery = this.normalizeText(query);
    const normalizedText = this.normalizeText(text);
    
    let score = 0;
    
    // 完全一致
    if (normalizedText === normalizedQuery) {
      score += 100 * fieldWeight;
    }
    // 前方一致
    else if (normalizedText.startsWith(normalizedQuery)) {
      score += 80 * fieldWeight;
    }
    // 部分一致
    else if (normalizedText.includes(normalizedQuery)) {
      const position = normalizedText.indexOf(normalizedQuery);
      score += (60 - position * 2) * fieldWeight;
    }
    
    return Math.max(0, score);
  }

  private findMatches(query: string, text: string): Array<[number, number]> {
    const normalizedQuery = this.normalizeText(query);
    const normalizedText = this.normalizeText(text);
    const matches: Array<[number, number]> = [];
    
    let startIndex = 0;
    let matchIndex = normalizedText.indexOf(normalizedQuery, startIndex);
    
    while (matchIndex !== -1) {
      matches.push([matchIndex, matchIndex + query.length]);
      startIndex = matchIndex + 1;
      matchIndex = normalizedText.indexOf(normalizedQuery, startIndex);
    }
    
    return matches;
  }

  searchContent(options: SearchOptions): SearchResult<ContentItem>[] {
    const { 
      query, 
      contentTypes, 
      difficulties,
      includeReadings = true,
      includeMeanings = true
    } = options;
    
    if (!query || query.trim().length === 0) {
      return [];
    }
    
    const results: SearchResult<ContentItem>[] = [];
    const allContent = this.contentManager.getAllContent();
    
    for (const item of allContent) {
      // コンテンツタイプフィルター
      if (contentTypes && contentTypes.length > 0 && !contentTypes.includes(item.type)) {
        continue;
      }
      
      // 難易度フィルター
      if (difficulties && difficulties.length > 0 && !difficulties.includes(item.difficulty)) {
        continue;
      }
      
      let totalScore = 0;
      const matches: SearchResult<ContentItem>['matches'] = [];
      
      // テキスト検索
      const textScore = this.calculateScore(query, item.text, 1.0);
      if (textScore > 0) {
        totalScore += textScore;
        matches.push({
          field: 'text',
          indices: this.findMatches(query, item.text)
        });
      }
      
      // 読み仮名検索
      if (includeReadings && item.reading) {
        const readingScore = this.calculateScore(query, item.reading, 0.8);
        if (readingScore > 0) {
          totalScore += readingScore;
          matches.push({
            field: 'reading',
            indices: this.findMatches(query, item.reading)
          });
        }
      }
      
      // 意味検索
      if (includeMeanings && item.meaning) {
        const meaningScore = this.calculateScore(query, item.meaning, 0.6);
        if (meaningScore > 0) {
          totalScore += meaningScore;
          matches.push({
            field: 'meaning',
            indices: this.findMatches(query, item.meaning)
          });
        }
      }
      
      if (totalScore > 0) {
        results.push({
          item,
          score: totalScore,
          matches
        });
      }
    }
    
    // スコアの高い順にソート
    return results.sort((a, b) => b.score - a.score);
  }

  searchMonsters(query: string, filters?: FilterOptions): SearchResult<Monster>[] {
    if (!query || query.trim().length === 0) {
      return this.filterMonsters(filters);
    }
    
    const results: SearchResult<Monster>[] = [];
    const allMonsters = this.monsterManager.getAllMonsters();
    
    for (const monster of allMonsters) {
      // フィルター適用
      if (!this.applyMonsterFilters(monster, filters)) {
        continue;
      }
      
      let totalScore = 0;
      const matches: SearchResult<Monster>['matches'] = [];
      
      // モンスター名検索
      const nameScore = this.calculateScore(query, monster.name, 1.0);
      if (nameScore > 0) {
        totalScore += nameScore;
        matches.push({
          field: 'name',
          indices: this.findMatches(query, monster.name)
        });
      }
      
      // 関連コンテンツのテキスト検索
      if (monster.sourceContent) {
        const contentScore = this.calculateScore(query, monster.sourceContent.text, 0.5);
        if (contentScore > 0) {
          totalScore += contentScore;
          matches.push({
            field: 'sourceContent',
            indices: this.findMatches(query, monster.sourceContent.text)
          });
        }
      }
      
      if (totalScore > 0) {
        results.push({
          item: monster,
          score: totalScore,
          matches
        });
      }
    }
    
    return results.sort((a, b) => b.score - a.score);
  }

  filterContent(filters: FilterOptions): ContentItem[] {
    const allContent = this.contentManager.getAllContent();
    
    return allContent.filter(item => {
      // コンテンツタイプフィルター
      if (filters.contentTypes && filters.contentTypes.length > 0) {
        if (!filters.contentTypes.includes(item.type)) {
          return false;
        }
      }
      
      // 難易度フィルター
      if (filters.difficulties && filters.difficulties.length > 0) {
        if (!filters.difficulties.includes(item.difficulty)) {
          return false;
        }
      }
      
      return true;
    });
  }

  private filterMonsters(filters?: FilterOptions): SearchResult<Monster>[] {
    if (!filters) {
      return this.monsterManager.getAllMonsters().map(monster => ({
        item: monster,
        score: 0,
        matches: []
      }));
    }
    
    const allMonsters = this.monsterManager.getAllMonsters();
    return allMonsters
      .filter(monster => this.applyMonsterFilters(monster, filters))
      .map(monster => ({
        item: monster,
        score: 0,
        matches: []
      }));
  }

  private applyMonsterFilters(monster: Monster, filters?: FilterOptions): boolean {
    if (!filters) return true;
    
    // レアリティフィルター
    if (filters.rarities && filters.rarities.length > 0) {
      if (!filters.rarities.includes(monster.rarity)) {
        return false;
      }
    }
    
    // 取得状況フィルター
    if (filters.unlocked !== null && filters.unlocked !== undefined) {
      if (filters.unlocked !== monster.unlocked) {
        return false;
      }
    }
    
    // お気に入りフィルター（将来実装用）
    if (filters.favorite !== undefined) {
      // TODO: お気に入り機能実装時に対応
    }
    
    // コンテンツタイプフィルター（関連コンテンツ経由）
    if (filters.contentTypes && filters.contentTypes.length > 0 && monster.sourceContent) {
      if (!filters.contentTypes.includes(monster.sourceContent.type)) {
        return false;
      }
    }
    
    // 難易度フィルター（関連コンテンツ経由）
    if (filters.difficulties && filters.difficulties.length > 0 && monster.sourceContent) {
      if (!filters.difficulties.includes(monster.sourceContent.difficulty)) {
        return false;
      }
    }
    
    return true;
  }

  getSuggestedQueries(partialQuery: string, limit: number = 5): string[] {
    const normalizedQuery = this.normalizeText(partialQuery);
    const suggestions = new Set<string>();
    
    // コンテンツから候補を抽出
    const allContent = this.contentManager.getAllContent();
    for (const item of allContent) {
      if (this.normalizeText(item.text).includes(normalizedQuery)) {
        suggestions.add(item.text);
      }
      if (item.reading && this.normalizeText(item.reading).includes(normalizedQuery)) {
        suggestions.add(item.reading);
      }
    }
    
    // モンスター名から候補を抽出
    const allMonsters = this.monsterManager.getAllMonsters();
    for (const monster of allMonsters) {
      if (this.normalizeText(monster.name).includes(normalizedQuery)) {
        suggestions.add(monster.name);
      }
    }
    
    return Array.from(suggestions).slice(0, limit);
  }
}

export const searchManager = new SearchManager();