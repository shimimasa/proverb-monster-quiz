export type ContentType = 'proverb' | 'idiom' | 'four_character_idiom';
export type Difficulty = '小学生' | '中学生' | '高校生';
export type MonsterRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ContentItem {
  id: number;
  text: string;
  reading: string;
  meaning: string;
  difficulty: Difficulty;
  example_sentence: string;
  type: ContentType;
}

export interface QuizQuestion {
  id: number;
  question: string;
  choices: string[];
  correctAnswer: number;
  explanation: string;
  contentItem: ContentItem;
}

export interface Monster {
  id: string;
  name: string;
  image: string;
  rarity: MonsterRarity;
  sourceContent: ContentItem;
  unlocked: boolean;
  dateObtained?: Date;
}

export interface UserProgress {
  level: number;
  experience: number;
  totalQuestions: number;
  correctAnswers: number;
  totalCorrect?: number; // correctAnswersのエイリアス（互換性のため）
  streak: number;
  maxStreak: number;
  achievements: Achievement[];
  settings: GameSettings;
}

export interface ComboState {
  currentCombo: number;
  maxCombo: number;
  lastCorrectTime: Date | null;
  comboMultiplier: number;
  isOnFire: boolean; // 5連続以上で炎エフェクト
}

export interface ComboBonus {
  experienceMultiplier: number;
  rareMonsterChanceBonus: number;
  message: string;
  effectType: 'normal' | 'fire' | 'super_fire';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: AchievementCondition;
  unlocked: boolean;
  dateUnlocked?: Date;
}

export interface AchievementCondition {
  type: 'correct_answers' | 'streak' | 'monsters_collected' | 'perfect_score';
  value: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  effectsVolume: number;
  difficulty: Difficulty;
  contentTypes: ContentType[];
}

export interface GameSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  questions: QuizQuestion[];
  answers: UserAnswer[];
  score: number;
  monstersUnlocked: string[];
}

export interface UserAnswer {
  questionId: number;
  selectedChoice: number;
  isCorrect: boolean;
  timeSpent: number;
}

export interface RankingEntry {
  id: string;
  playerName: string;
  score: number;
  level: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  monstersCollected: number;
  dateAchieved: Date;
}

export interface RankingData {
  dailyRankings: RankingEntry[];
  weeklyRankings: RankingEntry[];
  allTimeRankings: RankingEntry[];
  lastUpdated: Date;
}

export interface RankingNotification {
  type: 'new_record' | 'rank_up' | 'top_10' | 'top_3' | 'first_place';
  previousRank?: number;
  newRank: number;
  category: 'daily' | 'weekly' | 'all_time';
  message: string;
}

export interface LearningHistory {
  date: Date;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  contentBreakdown: {
    proverb: { total: number; correct: number };
    idiom: { total: number; correct: number };
    four_character_idiom: { total: number; correct: number };
  };
  sessionDuration: number; // in minutes
  monstersUnlocked: number;
  levelProgress: { from: number; to: number };
}

export interface LearningStats {
  dailyHistory: LearningHistory[];
  weeklyStats: {
    totalQuestions: number;
    totalCorrect: number;
    averageAccuracy: number;
    mostActiveDay: string;
    totalStudyTime: number;
  };
  monthlyTrends: {
    month: string;
    accuracy: number;
    questionsAnswered: number;
  }[];
  categoryPerformance: {
    type: ContentType;
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    averageTime: number;
  }[];
}