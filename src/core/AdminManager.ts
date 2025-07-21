import { ContentItem, ContentType } from '../types';
import { ContentFormData, ContentValidationError, ImportResult, ImportError } from '../types/admin';
import { localStorageManager } from '../loaders/localStorageManager';
import { z } from 'zod';

/**
 * 管理者機能マネージャー
 * コンテンツの追加・編集・削除とバリデーション機能を提供
 */
export class AdminManager {
  private static readonly ADMIN_PASSWORD_KEY = 'admin_password_hash';
  private static readonly DEFAULT_PASSWORD = 'admin123'; // 本番環境では環境変数から取得
  private static readonly CUSTOM_CONTENT_KEY = 'custom_content';

  /**
   * パスワード認証
   */
  public authenticate(password: string): boolean {
    // 簡易的なハッシュ（本番環境では適切なハッシュ関数を使用）
    const hash = this.simpleHash(password);
    const storedHash = localStorageManager.get(AdminManager.ADMIN_PASSWORD_KEY) || 
                      this.simpleHash(AdminManager.DEFAULT_PASSWORD);
    
    return hash === storedHash;
  }

  /**
   * パスワード変更
   */
  public changePassword(oldPassword: string, newPassword: string): boolean {
    if (!this.authenticate(oldPassword)) {
      return false;
    }
    
    const newHash = this.simpleHash(newPassword);
    localStorageManager.set(AdminManager.ADMIN_PASSWORD_KEY, newHash);
    return true;
  }

  /**
   * コンテンツのバリデーション
   */
  public validateContent(data: ContentFormData): ContentValidationError[] {
    const errors: ContentValidationError[] = [];

    // 必須フィールドのチェック
    if (!data.text || data.text.trim().length === 0) {
      errors.push({ field: 'text', message: 'テキストは必須です' });
    }

    if (!data.reading || data.reading.trim().length === 0) {
      errors.push({ field: 'reading', message: '読み方は必須です' });
    }

    if (!data.meaning || data.meaning.trim().length === 0) {
      errors.push({ field: 'meaning', message: '意味は必須です' });
    }

    // 文字数制限
    if (data.text && data.text.length > 100) {
      errors.push({ field: 'text', message: 'テキストは100文字以内で入力してください' });
    }

    if (data.meaning && data.meaning.length > 500) {
      errors.push({ field: 'meaning', message: '意味は500文字以内で入力してください' });
    }

    if (data.example_sentence && data.example_sentence.length > 500) {
      errors.push({ field: 'example_sentence', message: '例文は500文字以内で入力してください' });
    }

    // ひらがなチェック（読み方）
    const hiraganaRegex = /^[ぁ-んー\s]+$/;
    if (data.reading && !hiraganaRegex.test(data.reading)) {
      errors.push({ field: 'reading', message: '読み方はひらがなで入力してください' });
    }

    // 四字熟語の文字数チェック
    if (data.type === 'four_character_idiom' && data.text) {
      const kanjiOnly = data.text.replace(/[^\u4e00-\u9faf]/g, '');
      if (kanjiOnly.length !== 4) {
        errors.push({ field: 'text', message: '四字熟語は漢字4文字で構成される必要があります' });
      }
    }

    return errors;
  }

  /**
   * カスタムコンテンツの追加
   */
  public addContent(data: ContentFormData): { success: boolean; errors?: ContentValidationError[]; id?: number } {
    const errors = this.validateContent(data);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    const customContent = this.getCustomContent();
    const contentByType = customContent[data.type] || [];
    
    // IDの生成（既存の最大ID + 10000）
    const maxId = contentByType.reduce((max, item) => Math.max(max, item.id), 10000);
    const newContent: ContentItem = {
      id: maxId + 1,
      text: data.text.trim(),
      reading: data.reading.trim(),
      meaning: data.meaning.trim(),
      difficulty: data.difficulty,
      example_sentence: data.example_sentence?.trim() || '',
      type: data.type
    };

    // 重複チェック
    const isDuplicate = contentByType.some(item => 
      item.text === newContent.text || 
      (item.reading === newContent.reading && item.meaning === newContent.meaning)
    );

    if (isDuplicate) {
      return { 
        success: false, 
        errors: [{ field: 'text', message: '同じ内容のコンテンツが既に存在します' }] 
      };
    }

    contentByType.push(newContent);
    customContent[data.type] = contentByType;
    this.saveCustomContent(customContent);

    return { success: true, id: newContent.id };
  }

  /**
   * カスタムコンテンツの更新
   */
  public updateContent(data: ContentFormData): { success: boolean; errors?: ContentValidationError[] } {
    if (!data.id) {
      return { success: false, errors: [{ field: 'id', message: 'IDが指定されていません' }] };
    }

    const errors = this.validateContent(data);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    const customContent = this.getCustomContent();
    const contentByType = customContent[data.type] || [];
    const index = contentByType.findIndex(item => item.id === data.id);

    if (index === -1) {
      return { success: false, errors: [{ field: 'id', message: '指定されたコンテンツが見つかりません' }] };
    }

    // 重複チェック（自分自身を除く）
    const isDuplicate = contentByType.some((item, i) => 
      i !== index && (
        item.text === data.text.trim() || 
        (item.reading === data.reading.trim() && item.meaning === data.meaning.trim())
      )
    );

    if (isDuplicate) {
      return { 
        success: false, 
        errors: [{ field: 'text', message: '同じ内容のコンテンツが既に存在します' }] 
      };
    }

    contentByType[index] = {
      ...contentByType[index],
      text: data.text.trim(),
      reading: data.reading.trim(),
      meaning: data.meaning.trim(),
      difficulty: data.difficulty,
      example_sentence: data.example_sentence?.trim() || '',
    };

    customContent[data.type] = contentByType;
    this.saveCustomContent(customContent);

    return { success: true };
  }

  /**
   * カスタムコンテンツの削除
   */
  public deleteContent(id: number, type: ContentType): boolean {
    const customContent = this.getCustomContent();
    const contentByType = customContent[type] || [];
    const filteredContent = contentByType.filter(item => item.id !== id);

    if (filteredContent.length === contentByType.length) {
      return false; // 削除対象が見つからなかった
    }

    customContent[type] = filteredContent;
    this.saveCustomContent(customContent);
    return true;
  }

  /**
   * CSVデータのインポート
   */
  public importCSV(csvData: string, type: ContentType): ImportResult {
    const lines = csvData.trim().split('\n');
    const errors: ImportError[] = [];
    let success = 0;
    let failed = 0;

    // ヘッダー行をスキップ
    const dataLines = lines.slice(1);
    const importData: ContentFormData[] = [];

    dataLines.forEach((line, index) => {
      const row = index + 2; // 行番号（ヘッダーを含む）
      const columns = this.parseCSVLine(line);

      if (columns.length < 4) {
        errors.push({ row, field: 'format', message: '列数が不足しています' });
        failed++;
        return;
      }

      const data: ContentFormData = {
        text: columns[0],
        reading: columns[1],
        meaning: columns[2],
        difficulty: this.parseDifficulty(columns[3]),
        example_sentence: columns[4] || '',
        type
      };

      const validationErrors = this.validateContent(data);
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => {
          errors.push({ row, field: error.field, message: error.message });
        });
        failed++;
      } else {
        importData.push(data);
      }
    });

    // バリデーションが通ったデータを一括追加
    importData.forEach(data => {
      const result = this.addContent(data);
      if (result.success) {
        success++;
      } else {
        failed++;
      }
    });

    return { success, failed, errors };
  }

  /**
   * カスタムコンテンツのエクスポート
   */
  public exportCustomContent(type?: ContentType): string {
    const customContent = this.getCustomContent();
    const contentToExport = type 
      ? { [type]: customContent[type] || [] }
      : customContent;

    return JSON.stringify(contentToExport, null, 2);
  }

  /**
   * カスタムコンテンツの取得
   */
  public getCustomContent(): Record<ContentType, ContentItem[]> {
    const stored = localStorageManager.get(AdminManager.CUSTOM_CONTENT_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return this.getEmptyContent();
      }
    }
    return this.getEmptyContent();
  }

  /**
   * すべてのカスタムコンテンツを取得
   */
  public getAllCustomContent(): ContentItem[] {
    const customContent = this.getCustomContent();
    return [
      ...(customContent.proverb || []),
      ...(customContent.four_character_idiom || []),
      ...(customContent.idiom || [])
    ];
  }

  private getEmptyContent(): Record<ContentType, ContentItem[]> {
    return {
      proverb: [],
      four_character_idiom: [],
      idiom: []
    };
  }

  private saveCustomContent(content: Record<ContentType, ContentItem[]>): void {
    localStorageManager.set(AdminManager.CUSTOM_CONTENT_KEY, JSON.stringify(content));
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  private parseDifficulty(value: string): '小学生' | '中学生' | '高校生' {
    const normalized = value.trim();
    if (normalized === '中学生' || normalized === '高校生') {
      return normalized;
    }
    return '小学生'; // デフォルト
  }
}