import type { ContentItem, Monster, MonsterRarity, ContentType } from '@types/index';
import { localStorageManager } from '../loaders/localStorageManager';

export interface MonsterReward {
  type: 'experience' | 'coins' | 'item';
  amount: number;
  description: string;
}

export interface MonsterGenerationResult {
  monster: Monster;
  isNew: boolean;
  reward?: MonsterReward;
}

export class MonsterManager {
  private monsters: Map<string, Monster> = new Map();
  private monsterTemplates: MonsterTemplate[] = [];
  private storageManager = localStorageManager;

  constructor() {
    this.initializeMonsterTemplates();
    this.loadFromStorage();
  }

  // モンスターを生成または取得
  generateMonster(contentItem: ContentItem, comboBonus: number = 0): MonsterGenerationResult {
    const monsterId = `monster_${contentItem.type}_${contentItem.id}`;
    
    // 既存のモンスターをチェック
    const existingMonster = this.monsters.get(monsterId);
    if (existingMonster) {
      return {
        monster: existingMonster,
        isNew: false,
        reward: existingMonster.unlocked ? this.generateDuplicateReward(existingMonster) : undefined,
      };
    }
    
    // 新しいモンスターを生成（コンボボーナスを適用）
    const template = this.selectMonsterTemplate(contentItem, comboBonus);
    const monster: Monster = {
      id: monsterId,
      name: this.generateMonsterName(contentItem, template),
      image: template.imageUrl,
      rarity: template.rarity,
      sourceContent: contentItem,
      unlocked: false,
      dateObtained: undefined,
    };

    this.monsters.set(monsterId, monster);
    this.saveToStorage();
    
    return {
      monster,
      isNew: true,
    };
  }

  // モンスターをアンロック
  unlockMonster(monsterId: string): MonsterGenerationResult | null {
    const monster = this.monsters.get(monsterId);
    if (!monster) {
      return null;
    }
    
    if (monster.unlocked) {
      // 既にアンロック済みの場合は重複報酬
      return {
        monster,
        isNew: false,
        reward: this.generateDuplicateReward(monster),
      };
    }
    
    // 新規アンロック
    monster.unlocked = true;
    monster.dateObtained = new Date();
    this.saveToStorage();
    
    return {
      monster,
      isNew: true,
    };
  }

  getCollection(): Monster[] {
    return Array.from(this.monsters.values());
  }

  getUnlockedMonsters(): Monster[] {
    return this.getCollection().filter(monster => monster.unlocked);
  }

  getCollectionStats(): {
    total: number;
    unlocked: number;
    byRarity: Record<MonsterRarity, { total: number; unlocked: number }>;
    completionRate: number;
  } {
    const collection = this.getCollection();
    const unlocked = collection.filter(m => m.unlocked).length;
    
    // レアリティ別の統計
    const byRarity: Record<MonsterRarity, { total: number; unlocked: number }> = {
      common: { total: 0, unlocked: 0 },
      rare: { total: 0, unlocked: 0 },
      epic: { total: 0, unlocked: 0 },
      legendary: { total: 0, unlocked: 0 },
    };
    
    collection.forEach(monster => {
      byRarity[monster.rarity].total++;
      if (monster.unlocked) {
        byRarity[monster.rarity].unlocked++;
      }
    });
    
    return {
      total: collection.length,
      unlocked,
      byRarity,
      completionRate: collection.length > 0 ? (unlocked / collection.length) * 100 : 0,
    };
  }

  // モンスターをIDで取得
  getMonsterById(monsterId: string): Monster | null {
    return this.monsters.get(monsterId) || null;
  }

  // レアリティ別のモンスターを取得
  getMonstersByRarity(rarity: MonsterRarity): Monster[] {
    return this.getCollection().filter(monster => monster.rarity === rarity);
  }

  // コンテンツタイプ別のモンスターを取得
  getMonstersByContentType(type: ContentType): Monster[] {
    return this.getCollection().filter(monster => monster.sourceContent.type === type);
  }

  // 最近獲得したモンスターを取得
  getRecentlyUnlockedMonsters(limit: number = 10): Monster[] {
    return this.getUnlockedMonsters()
      .filter(monster => monster.dateObtained)
      .sort((a, b) => {
        const dateA = a.dateObtained?.getTime() || 0;
        const dateB = b.dateObtained?.getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  }

  // 図鑑の完成度を計算
  getCompletionProgress(): {
    percentage: number;
    nextMilestone: number;
    monstersToNextMilestone: number;
  } {
    const stats = this.getCollectionStats();
    const percentage = stats.completionRate;
    
    // マイルストーン: 25%, 50%, 75%, 100%
    const milestones = [25, 50, 75, 100];
    const nextMilestone = milestones.find(m => m > percentage) || 100;
    const monstersToNextMilestone = Math.ceil((nextMilestone / 100) * stats.total) - stats.unlocked;
    
    return {
      percentage,
      nextMilestone,
      monstersToNextMilestone: Math.max(0, monstersToNextMilestone),
    };
  }

  private loadFromStorage(): void {
    try {
      const collection = this.storageManager.loadMonsterCollection();
      collection.forEach(monsterData => {
        const monster: Monster = {
          ...monsterData,
          dateObtained: monsterData.dateObtained
            ? new Date(monsterData.dateObtained)
            : undefined,
        };
        this.monsters.set(monster.id, monster);
      });
    } catch (error) {
      console.error('Error loading monster collection:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.monsters.values());
      this.storageManager.saveMonsterCollection(data);
    } catch (error) {
      console.error('Error saving monster collection:', error);
    }
  }

  // 重複獲得時の報酬を生成
  private generateDuplicateReward(monster: Monster): MonsterReward {
    const rarityMultipliers: Record<MonsterRarity, number> = {
      common: 1,
      rare: 2,
      epic: 3,
      legendary: 5,
    };
    
    const multiplier = rarityMultipliers[monster.rarity];
    const rewardTypes: MonsterReward[] = [
      {
        type: 'experience',
        amount: 50 * multiplier,
        description: `${monster.name}の経験値ボーナス`,
      },
      {
        type: 'coins',
        amount: 100 * multiplier,
        description: `${monster.name}のコインボーナス`,
      },
    ];
    
    // ランダムに報酬を選択
    return rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
  }

  private selectMonsterTemplate(contentItem: ContentItem, comboBonus: number = 0): MonsterTemplate {
    const difficulty = contentItem.difficulty;
    const rarityWeights = this.getRarityWeights(difficulty, comboBonus);
    
    const templates = this.monsterTemplates.filter(
      t => t.contentType === contentItem.type || t.contentType === 'any'
    );

    const rarity = this.selectRarity(rarityWeights);
    const rarityTemplates = templates.filter(t => t.rarity === rarity);
    
    if (rarityTemplates.length === 0) {
      return templates[0];
    }

    const randomIndex = Math.floor(Math.random() * rarityTemplates.length);
    return rarityTemplates[randomIndex];
  }

  private getRarityWeights(difficulty: string, comboBonus: number = 0): Record<MonsterRarity, number> {
    const baseWeights: Record<string, Record<MonsterRarity, number>> = {
      '小学生': { common: 0.6, rare: 0.3, epic: 0.08, legendary: 0.02 },
      '中学生': { common: 0.5, rare: 0.35, epic: 0.12, legendary: 0.03 },
      '高校生': { common: 0.4, rare: 0.4, epic: 0.15, legendary: 0.05 },
    };
    
    const weights = baseWeights[difficulty] || baseWeights['小学生'];
    
    // コンボボーナスを適用（レアモンスターの出現率を上げる）
    if (comboBonus > 0) {
      const adjustedWeights = { ...weights };
      
      // コンボボーナスの分だけcommonの確率を減らし、他に振り分ける
      const reduction = Math.min(adjustedWeights.common * comboBonus, adjustedWeights.common * 0.5);
      adjustedWeights.common -= reduction;
      
      // 減らした分を他のレアリティに振り分け
      adjustedWeights.rare += reduction * 0.5;
      adjustedWeights.epic += reduction * 0.3;
      adjustedWeights.legendary += reduction * 0.2;
      
      return adjustedWeights;
    }
    
    return weights;
  }

  private selectRarity(weights: Record<MonsterRarity, number>): MonsterRarity {
    const random = Math.random();
    let cumulative = 0;
    
    for (const [rarity, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (random < cumulative) {
        return rarity as MonsterRarity;
      }
    }
    
    return 'common';
  }

  private generateMonsterName(
    contentItem: ContentItem,
    template: MonsterTemplate
  ): string {
    const keywords = contentItem.text.split(/[のをはがで]/)[0];
    return `${keywords}${template.nameSuffix}`;
  }

  private initializeMonsterTemplates(): void {
    this.monsterTemplates = [
      // Common monsters
      {
        id: 'common_1',
        rarity: 'common',
        contentType: 'any',
        imageUrl: '/assets/monsters/common_1.png',
        nameSuffix: 'スライム',
      },
      {
        id: 'common_2',
        rarity: 'common',
        contentType: 'any',
        imageUrl: '/assets/monsters/common_2.png',
        nameSuffix: 'バード',
      },
      // Rare monsters
      {
        id: 'rare_1',
        rarity: 'rare',
        contentType: 'any',
        imageUrl: '/assets/monsters/rare_1.png',
        nameSuffix: 'ドラゴン',
      },
      {
        id: 'rare_2',
        rarity: 'rare',
        contentType: 'any',
        imageUrl: '/assets/monsters/rare_2.png',
        nameSuffix: 'ナイト',
      },
      // Epic monsters
      {
        id: 'epic_1',
        rarity: 'epic',
        contentType: 'any',
        imageUrl: '/assets/monsters/epic_1.png',
        nameSuffix: 'フェニックス',
      },
      // Legendary monsters
      {
        id: 'legendary_1',
        rarity: 'legendary',
        contentType: 'any',
        imageUrl: '/assets/monsters/legendary_1.png',
        nameSuffix: '神',
      },
    ];
  }
  // モンスターコレクションをリセット（テスト用）
  resetCollection(): void {
    this.monsters.clear();
    this.saveToStorage();
  }

  // 全モンスターを即座にアンロック（デバッグ用）
  unlockAllMonsters(): void {
    this.monsters.forEach(monster => {
      monster.unlocked = true;
      monster.dateObtained = new Date();
    });
    this.saveToStorage();
  }
}

interface MonsterTemplate {
  id: string;
  rarity: MonsterRarity;
  contentType: ContentType | 'any';
  imageUrl: string;
  nameSuffix: string;
}