import { ProgressManager } from './ProgressManager';
import { MonsterManager } from './MonsterManager';
import { RankingManager } from './RankingManager';
import { LearningHistoryManager } from './LearningHistoryManager';
import { ContentType, GameSettings, Achievement } from '../types';

/**
 * データエクスポート管理クラス
 * 各種ゲームデータをJSON/CSV形式でエクスポートする機能を提供
 */
export class DataExportManager {
  private progressManager: ProgressManager;
  private monsterManager: MonsterManager;
  private rankingManager: RankingManager;
  private learningHistoryManager: LearningHistoryManager;

  constructor(
    progressManager: ProgressManager,
    monsterManager: MonsterManager,
    rankingManager: RankingManager,
    learningHistoryManager: LearningHistoryManager
  ) {
    this.progressManager = progressManager;
    this.monsterManager = monsterManager;
    this.rankingManager = rankingManager;
    this.learningHistoryManager = learningHistoryManager;
  }

  /**
   * 全データをJSON形式でエクスポート
   */
  public exportAllDataAsJSON(): string {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      progress: this.progressManager.getProgress(),
      monsters: this.monsterManager.getCollection(),
      rankings: this.rankingManager.getRankings(),
      learningHistory: this.learningHistoryManager.getFullHistory(),
      settings: this.progressManager.getProgress().settings,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 学習履歴をCSV形式でエクスポート
   */
  public exportLearningHistoryCSV(): string {
    const sessions = this.learningHistoryManager.getRecentSessions(1000);
    const headers = [
      '日時',
      '問題タイプ',
      'コンテンツ',
      '正解/不正解',
      '回答時間(秒)',
      '選択肢',
      '正解'
    ];

    const rows = sessions.flatMap(session => 
      session.answers.map((answer, index) => {
        const question = session.questions[index];
        return [
          new Date(answer.answeredAt).toLocaleString('ja-JP'),
          question.contentItem.type,
          question.contentItem.text,
          answer.isCorrect ? '正解' : '不正解',
          (answer.timeSpent / 1000).toFixed(1),
          question.choices[answer.selectedChoice],
          question.choices[question.correctAnswer]
        ];
      })
    );

    return this.convertToCSV(headers, rows);
  }

  /**
   * モンスターコレクションをCSV形式でエクスポート
   */
  public exportMonsterCollectionCSV(): string {
    const monsters = this.monsterManager.getCollection();
    const headers = [
      'ID',
      '名前',
      'レアリティ',
      '取得日',
      'ソースコンテンツ',
      'タイプ'
    ];

    const rows = monsters
      .filter(monster => monster.unlocked)
      .map(monster => [
        monster.id,
        monster.name,
        this.getRarityJapanese(monster.rarity),
        monster.dateObtained ? new Date(monster.dateObtained).toLocaleString('ja-JP') : '未取得',
        monster.sourceContent.text,
        this.getContentTypeJapanese(monster.sourceContent.type)
      ]);

    return this.convertToCSV(headers, rows);
  }

  /**
   * ランキングデータをCSV形式でエクスポート
   */
  public exportRankingCSV(category: 'daily' | 'weekly' | 'all_time'): string {
    return this.rankingManager.exportRankingCSV(category);
  }

  /**
   * 統計情報をCSV形式でエクスポート
   */
  public exportStatisticsCSV(): string {
    const progress = this.progressManager.getProgress();
    const detailedStats = this.progressManager.getDetailedStats();
    const dailyStats = this.learningHistoryManager.getDailyStats(30);
    
    const headers = ['項目', '値'];
    const rows = [
      ['レベル', progress.level.toString()],
      ['経験値', progress.experience.toString()],
      ['総問題数', progress.totalQuestions.toString()],
      ['正解数', progress.correctAnswers.toString()],
      ['正答率', `${detailedStats.accuracy}%`],
      ['連続正解数', progress.streak.toString()],
      ['最大連続正解数', detailedStats.maxStreak.toString()],
      ['獲得モンスター数', detailedStats.monstersUnlocked.toString()],
      ['総プレイ時間', `${Math.floor(detailedStats.totalPlayTime / 60)}分`],
      ['平均回答時間', `${detailedStats.averageAnswerTime.toFixed(1)}秒`],
      ['アチーブメント達成数', detailedStats.achievementsUnlocked.toString()],
    ];

    // 日別統計を追加
    dailyStats.forEach(stat => {
      rows.push([
        `${stat.date}の正解数`,
        stat.correctAnswers.toString()
      ]);
    });

    return this.convertToCSV(headers, rows);
  }

  /**
   * アチーブメントをCSV形式でエクスポート
   */
  public exportAchievementsCSV(): string {
    const achievements = this.progressManager.getProgress().achievements;
    const headers = [
      'ID',
      '名前',
      '説明',
      '達成状態',
      '達成日'
    ];

    const rows = achievements.map(achievement => [
      achievement.id,
      achievement.name,
      achievement.description,
      achievement.unlocked ? '達成' : '未達成',
      achievement.dateUnlocked 
        ? new Date(achievement.dateUnlocked).toLocaleString('ja-JP') 
        : '-'
    ]);

    return this.convertToCSV(headers, rows);
  }

  /**
   * コンテンツ別統計をCSV形式でエクスポート
   */
  public exportContentTypeStatsCSV(): string {
    const stats = this.learningHistoryManager.getContentTypeStats();
    const headers = [
      'コンテンツタイプ',
      '総問題数',
      '正解数',
      '正答率',
      '平均回答時間'
    ];

    const rows = Object.entries(stats).map(([type, stat]) => [
      this.getContentTypeJapanese(type as ContentType),
      stat.totalQuestions.toString(),
      stat.correctAnswers.toString(),
      `${stat.accuracy}%`,
      `${stat.averageAnswerTime.toFixed(1)}秒`
    ]);

    return this.convertToCSV(headers, rows);
  }

  /**
   * 設定データをJSON形式でエクスポート
   */
  public exportSettingsJSON(): string {
    const settings = this.progressManager.getProgress().settings;
    const exportData = {
      exportDate: new Date().toISOString(),
      settings: settings
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * CSVフォーマットに変換
   */
  private convertToCSV(headers: string[], rows: (string | number)[][]): string {
    const csvHeaders = headers.map(h => this.escapeCSV(h)).join(',');
    const csvRows = rows.map(row => 
      row.map(cell => this.escapeCSV(cell.toString())).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }

  /**
   * CSV用に文字列をエスケープ
   */
  private escapeCSV(str: string): string {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * レアリティを日本語に変換
   */
  private getRarityJapanese(rarity: string): string {
    const rarityMap: Record<string, string> = {
      common: 'コモン',
      rare: 'レア',
      epic: 'エピック',
      legendary: 'レジェンド'
    };
    return rarityMap[rarity] || rarity;
  }

  /**
   * コンテンツタイプを日本語に変換
   */
  private getContentTypeJapanese(type: ContentType): string {
    const typeMap: Record<ContentType, string> = {
      proverb: 'ことわざ',
      four_character_idiom: '四字熟語',
      idiom: '慣用句'
    };
    return typeMap[type] || type;
  }

  /**
   * ダウンロード用のファイル名を生成
   */
  public generateFileName(prefix: string, extension: string): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '');
    return `${prefix}_${dateStr}_${timeStr}.${extension}`;
  }
}