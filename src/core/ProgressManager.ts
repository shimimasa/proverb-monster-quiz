import type { 
  UserProgress, 
  Achievement, 
  GameSettings, 
  GameSession,
  Difficulty,
  ContentType,
  ComboState,
  ComboBonus
} from '@types/index';
import { localStorageManager } from '../loaders/localStorageManager';

export interface LevelUpResult {
  previousLevel: number;
  newLevel: number;
  experienceGained: number;
  totalExperience: number;
}

export interface ProgressStats {
  accuracy: number;
  averageStreak: number;
  bestStreak: number;
  questionsPerDay: number;
  favoriteContentType: ContentType | null;
  levelProgress: {
    current: number;
    required: number;
    percentage: number;
  };
}

export class ProgressManager {
  private progress: UserProgress;
  private storageManager = localStorageManager;
  private readonly LEVEL_EXPERIENCE_BASE = 100;
  private readonly LEVEL_EXPERIENCE_MULTIPLIER = 1.5;
  private readonly COMBO_TIMEOUT_MS = 30000; // 30秒でコンボが切れる
  private streakHistory: number[] = [];
  private dailyQuestions: Map<string, number> = new Map();
  private contentTypeCount: Map<ContentType, number> = new Map();
  private comboState: ComboState;

  constructor() {
    this.progress = this.loadProgress();
    this.comboState = this.loadComboState();
    this.initializeTracking();
  }

  updateProgress(isCorrect: boolean, contentType?: ContentType): LevelUpResult | null {
    this.progress.totalQuestions++;
    this.updateDailyTracking();
    
    if (contentType) {
      this.updateContentTypeTracking(contentType);
    }
    
    let levelUpResult: LevelUpResult | null = null;
    
    if (isCorrect) {
      this.progress.correctAnswers++;
      this.progress.streak++;
      
      // コンボシステムの更新
      this.updateCombo(true);
      
      // 最大ストリークの更新
      if (this.progress.streak > this.progress.maxStreak) {
        this.progress.maxStreak = this.progress.streak;
      }
      
      const expGained = this.calculateExperienceGain();
      levelUpResult = this.addExperience(expGained);
    } else {
      if (this.progress.streak > 0) {
        this.streakHistory.push(this.progress.streak);
      }
      this.progress.streak = 0;
      
      // コンボリセット
      this.updateCombo(false);
    }

    const newAchievements = this.checkAchievements();
    this.saveProgress();
    
    return levelUpResult;
  }

  addExperience(amount: number): LevelUpResult | null {
    const previousLevel = this.progress.level;
    this.progress.experience += amount;
    const newLevel = this.calculateLevel(this.progress.experience);
    
    if (newLevel > previousLevel) {
      this.progress.level = newLevel;
      this.onLevelUp(newLevel);
      
      return {
        previousLevel,
        newLevel,
        experienceGained: amount,
        totalExperience: this.progress.experience,
      };
    }
    
    return null;
  }

  calculateLevel(experience: number): number {
    let level = 1;
    let requiredExp = this.LEVEL_EXPERIENCE_BASE;
    let totalRequired = 0;

    while (totalRequired + requiredExp <= experience) {
      totalRequired += requiredExp;
      level++;
      requiredExp = Math.floor(
        this.LEVEL_EXPERIENCE_BASE * 
        Math.pow(this.LEVEL_EXPERIENCE_MULTIPLIER, level - 1)
      );
    }

    return level;
  }

  getExperienceForNextLevel(): { current: number; required: number; percentage: number } {
    const currentLevelExp = this.getExperienceForLevel(this.progress.level);
    const nextLevelExp = this.getExperienceForLevel(this.progress.level + 1);
    const current = this.progress.experience - currentLevelExp;
    const required = nextLevelExp - currentLevelExp;
    
    return {
      current,
      required,
      percentage: (current / required) * 100,
    };
  }

  // ProgressBarコンポーネント用のメソッド（エイリアス）
  getLevelProgress(): { currentExp: number; expForNext: number; progressPercentage: number } {
    const expInfo = this.getExperienceForNextLevel();
    return {
      currentExp: expInfo.current,
      expForNext: expInfo.required,
      progressPercentage: expInfo.percentage,
    };
  }

  checkAchievements(): Achievement[] {
    const newAchievements: Achievement[] = [];

    this.progress.achievements.forEach(achievement => {
      if (!achievement.unlocked && this.checkAchievementCondition(achievement)) {
        achievement.unlocked = true;
        achievement.dateUnlocked = new Date();
        newAchievements.push(achievement);
      }
    });

    return newAchievements;
  }

  getProgress(): UserProgress {
    return { ...this.progress };
  }

  getSettings(): GameSettings {
    return { ...this.progress.settings };
  }

  updateSettings(settings: Partial<GameSettings>): void {
    this.progress.settings = {
      ...this.progress.settings,
      ...settings,
    };
    this.saveProgress();
  }

  resetProgress(): void {
    this.progress = this.createDefaultProgress();
    this.saveProgress();
  }

  // 統計情報の取得
  getProgressStats(): ProgressStats {
    const accuracy = this.getAccuracyRate();
    const bestStreak = Math.max(this.progress.maxStreak, this.progress.streak);
    const averageStreak = this.calculateAverageStreak();
    const questionsPerDay = this.calculateQuestionsPerDay();
    const favoriteContentType = this.getFavoriteContentType();
    const levelProgress = this.getExperienceForNextLevel();
    
    return {
      accuracy,
      averageStreak,
      bestStreak,
      questionsPerDay,
      favoriteContentType,
      levelProgress,
    };
  }

  // 詳細な統計情報の取得
  getDetailedStats(): {
    byDifficulty: Record<Difficulty, { attempts: number; correct: number; accuracy: number }>;
    byContentType: Record<ContentType, { attempts: number; correct: number; accuracy: number }>;
    timeSpent: number;
    averageSessionDuration: number;
    longestSession: number;
  } {
    const sessions = this.getRecentSessions(100);
    const byDifficulty: Record<Difficulty, { attempts: number; correct: number; accuracy: number }> = {
      '小学生': { attempts: 0, correct: 0, accuracy: 0 },
      '中学生': { attempts: 0, correct: 0, accuracy: 0 },
      '高校生': { attempts: 0, correct: 0, accuracy: 0 }
    };
    
    const byContentType: Record<ContentType, { attempts: number; correct: number; accuracy: number }> = {
      'proverb': { attempts: 0, correct: 0, accuracy: 0 },
      'four_character_idiom': { attempts: 0, correct: 0, accuracy: 0 },
      'idiom': { attempts: 0, correct: 0, accuracy: 0 }
    };

    let totalDuration = 0;
    let longestSession = 0;

    sessions.forEach(session => {
      if (session.endTime) {
        const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
        totalDuration += duration;
        longestSession = Math.max(longestSession, duration);
      }
    });

    // コンテンツタイプ別の統計を計算
    this.contentTypeCount.forEach((count, type) => {
      if (byContentType[type]) {
        byContentType[type].attempts = count;
      }
    });

    // 正答率を計算
    Object.keys(byContentType).forEach(type => {
      const stats = byContentType[type as ContentType];
      if (stats.attempts > 0) {
        stats.accuracy = (stats.correct / stats.attempts) * 100;
      }
    });

    Object.keys(byDifficulty).forEach(diff => {
      const stats = byDifficulty[diff as Difficulty];
      if (stats.attempts > 0) {
        stats.accuracy = (stats.correct / stats.attempts) * 100;
      }
    });

    return {
      byDifficulty,
      byContentType,
      timeSpent: totalDuration,
      averageSessionDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
      longestSession
    };
  }

  // セッション情報の保存
  saveGameSession(session: GameSession): void {
    this.storageManager.saveGameSession(session);
  }

  // 最近のセッションを取得
  getRecentSessions(limit: number = 10): GameSession[] {
    return this.storageManager.loadGameSessions().slice(0, limit);
  }

  // アチーブメントの進捗を取得
  getAchievementProgress(): {
    total: number;
    unlocked: number;
    percentage: number;
    recent: Achievement[];
  } {
    const total = this.progress.achievements.length;
    const unlocked = this.progress.achievements.filter(a => a.unlocked).length;
    const recent = this.progress.achievements
      .filter(a => a.unlocked && a.dateUnlocked)
      .sort((a, b) => {
        const dateA = a.dateUnlocked?.getTime() || 0;
        const dateB = b.dateUnlocked?.getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, 3);
    
    return {
      total,
      unlocked,
      percentage: total > 0 ? (unlocked / total) * 100 : 0,
      recent,
    };
  }

  saveProgress(): void {
    try {
      this.storageManager.saveUserProgress(this.progress);
      this.storageManager.saveAchievements(this.progress.achievements);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }

  loadProgress(): UserProgress {
    try {
      const savedProgress = this.storageManager.loadUserProgress();
      if (savedProgress) {
        // アチーブメントを別途読み込み
        const achievements = this.storageManager.loadAchievements();
        if (achievements.length > 0) {
          savedProgress.achievements = achievements;
        }
        return savedProgress;
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }

    return this.createDefaultProgress();
  }

  private calculateExperienceGain(): number {
    const baseExp = 10;
    const streakBonus = Math.min(this.progress.streak * 2, 20);
    const levelBonus = Math.floor(this.progress.level / 5) * 5;
    const baseTotal = baseExp + streakBonus + levelBonus;
    
    // コンボボーナスを適用
    return Math.floor(baseTotal * this.comboState.comboMultiplier);
  }

  private getExperienceForLevel(level: number): number {
    let totalExp = 0;
    for (let i = 1; i < level; i++) {
      totalExp += Math.floor(
        this.LEVEL_EXPERIENCE_BASE * 
        Math.pow(this.LEVEL_EXPERIENCE_MULTIPLIER, i - 1)
      );
    }
    return totalExp;
  }

  private checkAchievementCondition(achievement: Achievement): boolean {
    const { type, value } = achievement.condition;

    switch (type) {
      case 'correct_answers':
        return this.progress.correctAnswers >= value;
      case 'streak':
        return this.progress.streak >= value;
      case 'perfect_score':
        return this.getAccuracyRate() >= value;
      default:
        return false;
    }
  }

  private getAccuracyRate(): number {
    if (this.progress.totalQuestions === 0) return 0;
    return (this.progress.correctAnswers / this.progress.totalQuestions) * 100;
  }

  private onLevelUp(newLevel: number): void {
    console.log(`Level up! You are now level ${newLevel}`);
    // Additional level up logic can be added here
  }

  private createDefaultProgress(): UserProgress {
    return {
      level: 1,
      experience: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      streak: 0,
      maxStreak: 0,
      achievements: this.createDefaultAchievements(),
      settings: this.createDefaultSettings(),
    };
  }

  private initializeTracking(): void {
    // 日別問題数の初期化
    const today = this.getDateKey(new Date());
    const sessions = this.storageManager.loadGameSessions();
    
    sessions.forEach(session => {
      if (session.startTime) {
        const dateKey = this.getDateKey(new Date(session.startTime));
        const count = this.dailyQuestions.get(dateKey) || 0;
        this.dailyQuestions.set(dateKey, count + session.questions.length);
      }
    });
  }

  private updateDailyTracking(): void {
    const today = this.getDateKey(new Date());
    const count = this.dailyQuestions.get(today) || 0;
    this.dailyQuestions.set(today, count + 1);
  }

  private updateContentTypeTracking(type: ContentType): void {
    const count = this.contentTypeCount.get(type) || 0;
    this.contentTypeCount.set(type, count + 1);
  }

  private calculateAverageStreak(): number {
    const allStreaks = [...this.streakHistory];
    if (this.progress.streak > 0) {
      allStreaks.push(this.progress.streak);
    }
    
    if (allStreaks.length === 0) return 0;
    
    const sum = allStreaks.reduce((a, b) => a + b, 0);
    return sum / allStreaks.length;
  }

  private calculateQuestionsPerDay(): number {
    if (this.dailyQuestions.size === 0) return 0;
    
    const totalQuestions = Array.from(this.dailyQuestions.values())
      .reduce((sum, count) => sum + count, 0);
    
    return totalQuestions / this.dailyQuestions.size;
  }

  private getFavoriteContentType(): ContentType | null {
    if (this.contentTypeCount.size === 0) return null;
    
    let maxCount = 0;
    let favorite: ContentType | null = null;
    
    this.contentTypeCount.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        favorite = type;
      }
    });
    
    return favorite;
  }

  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private createDefaultAchievements(): Achievement[] {
    return [
      {
        id: 'first_correct',
        name: '初めての正解',
        description: '最初の問題に正解する',
        icon: '🎯',
        condition: { type: 'correct_answers', value: 1 },
        unlocked: false,
      },
      {
        id: 'streak_5',
        name: '5問連続正解',
        description: '5問連続で正解する',
        icon: '🔥',
        condition: { type: 'streak', value: 5 },
        unlocked: false,
      },
      {
        id: 'streak_10',
        name: '10問連続正解',
        description: '10問連続で正解する',
        icon: '💥',
        condition: { type: 'streak', value: 10 },
        unlocked: false,
      },
      {
        id: 'streak_20',
        name: 'コンボマスター',
        description: '20問連続で正解する',
        icon: '⚡',
        condition: { type: 'streak', value: 20 },
        unlocked: false,
      },
      {
        id: 'answers_10',
        name: 'ビギナー',
        description: '10問正解する',
        icon: '🌱',
        condition: { type: 'correct_answers', value: 10 },
        unlocked: false,
      },
      {
        id: 'answers_50',
        name: 'ことわざマスター',
        description: '50問正解する',
        icon: '👑',
        condition: { type: 'correct_answers', value: 50 },
        unlocked: false,
      },
      {
        id: 'answers_100',
        name: 'ことわざ博士',
        description: '100問正解する',
        icon: '🎓',
        condition: { type: 'correct_answers', value: 100 },
        unlocked: false,
      },
      {
        id: 'answers_500',
        name: '伝説の賢者',
        description: '500問正解する',
        icon: '🧿',
        condition: { type: 'correct_answers', value: 500 },
        unlocked: false,
      },
      {
        id: 'perfect_rate',
        name: 'パーフェクト',
        description: '正解率90%以上を達成',
        icon: '⭐',
        condition: { type: 'perfect_score', value: 90 },
        unlocked: false,
      },
      {
        id: 'monsters_10',
        name: 'モンスターコレクター',
        description: '10体のモンスターを集める',
        icon: '👾',
        condition: { type: 'monsters_collected', value: 10 },
        unlocked: false,
      },
      {
        id: 'monsters_50',
        name: 'モンスターマニア',
        description: '50体のモンスターを集める',
        icon: '🏆',
        condition: { type: 'monsters_collected', value: 50 },
        unlocked: false,
      },
    ];
  }

  private createDefaultSettings(): GameSettings {
    return {
      soundEnabled: true,
      effectsVolume: 0.7,
      difficulty: '小学生',
      contentTypes: ['proverb'],
    };
  }

  // コンボシステム関連のメソッド
  private loadComboState(): ComboState {
    const saved = this.storageManager.get('combo_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        lastCorrectTime: parsed.lastCorrectTime ? new Date(parsed.lastCorrectTime) : null
      };
    }
    return this.createDefaultComboState();
  }

  private createDefaultComboState(): ComboState {
    return {
      currentCombo: 0,
      maxCombo: 0,
      lastCorrectTime: null,
      comboMultiplier: 1.0,
      isOnFire: false
    };
  }

  private saveComboState(): void {
    this.storageManager.set('combo_state', JSON.stringify(this.comboState));
  }

  private updateCombo(isCorrect: boolean): void {
    const now = new Date();
    
    if (isCorrect) {
      // タイムアウトチェック
      if (this.comboState.lastCorrectTime) {
        const timeDiff = now.getTime() - this.comboState.lastCorrectTime.getTime();
        if (timeDiff > this.COMBO_TIMEOUT_MS) {
          // コンボがタイムアウトした
          this.comboState.currentCombo = 0;
        }
      }
      
      // コンボカウントアップ
      this.comboState.currentCombo++;
      this.comboState.lastCorrectTime = now;
      
      // 最大コンボ更新
      if (this.comboState.currentCombo > this.comboState.maxCombo) {
        this.comboState.maxCombo = this.comboState.currentCombo;
      }
      
      // コンボボーナス計算
      this.updateComboBonus();
    } else {
      // 不正解でコンボリセット
      if (this.comboState.currentCombo > 0) {
        this.comboState.currentCombo = 0;
        this.comboState.comboMultiplier = 1.0;
        this.comboState.isOnFire = false;
      }
    }
    
    this.saveComboState();
  }

  private updateComboBonus(): void {
    const combo = this.comboState.currentCombo;
    
    if (combo >= 20) {
      this.comboState.comboMultiplier = 2.0;
      this.comboState.isOnFire = true;
    } else if (combo >= 10) {
      this.comboState.comboMultiplier = 1.5;
      this.comboState.isOnFire = true;
    } else if (combo >= 5) {
      this.comboState.comboMultiplier = 1.2;
      this.comboState.isOnFire = true;
    } else if (combo >= 3) {
      this.comboState.comboMultiplier = 1.1;
      this.comboState.isOnFire = false;
    } else {
      this.comboState.comboMultiplier = 1.0;
      this.comboState.isOnFire = false;
    }
  }

  public getComboState(): ComboState {
    return { ...this.comboState };
  }

  public getComboBonus(): ComboBonus {
    const combo = this.comboState.currentCombo;
    
    if (combo >= 20) {
      return {
        experienceMultiplier: 2.0,
        rareMonsterChanceBonus: 0.3,
        message: 'スーパーコンボ！！',
        effectType: 'super_fire'
      };
    } else if (combo >= 10) {
      return {
        experienceMultiplier: 1.5,
        rareMonsterChanceBonus: 0.2,
        message: 'すごいコンボ！',
        effectType: 'fire'
      };
    } else if (combo >= 5) {
      return {
        experienceMultiplier: 1.2,
        rareMonsterChanceBonus: 0.1,
        message: 'コンボ継続中！',
        effectType: 'fire'
      };
    } else if (combo >= 3) {
      return {
        experienceMultiplier: 1.1,
        rareMonsterChanceBonus: 0.05,
        message: 'コンボ！',
        effectType: 'normal'
      };
    } else {
      return {
        experienceMultiplier: 1.0,
        rareMonsterChanceBonus: 0,
        message: '',
        effectType: 'normal'
      };
    }
  }
}