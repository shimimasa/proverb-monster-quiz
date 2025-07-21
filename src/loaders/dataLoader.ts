import { z } from 'zod';
import type { ContentItem, ContentType } from '../types';

// データ検証用のスキーマ定義
const ContentItemSchema = z.object({
  id: z.number(),
  text: z.string(),
  reading: z.string(),
  meaning: z.string(),
  difficulty: z.enum(['小学生', '中学生', '高校生'] as const),
  example_sentence: z.string().optional(),
  type: z.enum(['proverb', 'idiom', 'four_character_idiom'] as const).optional(),
});

const ContentDataSchema = z.object({
  proverbs: z.array(ContentItemSchema).optional(),
  idioms: z.array(ContentItemSchema).optional(),
  four_character_idioms: z.array(ContentItemSchema).optional(),
});

// エラークラス
export class DataLoadError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'DataLoadError';
  }
}

export class DataValidationError extends Error {
  constructor(message: string, public validationErrors?: z.ZodError) {
    super(message);
    this.name = 'DataValidationError';
  }
}

export class StorageError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

export class StorageQuotaError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'StorageQuotaError';
  }
}

// データローダークラス
export class DataLoader {
  private cache: Map<string, ContentItem[]> = new Map();
  private readonly baseUrl: string;

  constructor(baseUrl: string = '/data') {
    this.baseUrl = baseUrl;
  }

  // コンテンツタイプに対応するファイル名を取得
  private getFileName(type: ContentType): string {
    switch (type) {
      case 'proverb':
        return 'proverbs.json';
      case 'idiom':
        return 'idioms.json';
      case 'four_character_idiom':
        return 'four_character_idioms.json';
      default:
        throw new Error(`Unknown content type: ${type}`);
    }
  }

  // JSONファイルを読み込み
  async loadContent(type: ContentType): Promise<ContentItem[]> {
    // キャッシュチェック
    const cached = this.cache.get(type);
    if (cached) {
      return cached;
    }

    const fileName = this.getFileName(type);
    const url = `${this.baseUrl}/${fileName}`;

    try {
      // データ取得
      const response = await fetch(url);
      if (!response.ok) {
        throw new DataLoadError(
          `Failed to load ${fileName}: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      
      // データ検証
      const validatedData = this.validateData(data, type);
      
      // キャッシュに保存
      this.cache.set(type, validatedData);
      
      return validatedData;
    } catch (error) {
      if (error instanceof DataLoadError || error instanceof DataValidationError) {
        throw error;
      }
      throw new DataLoadError(`Error loading ${fileName}`, error);
    }
  }

  // データの検証と変換
  private validateData(data: unknown, type: ContentType): ContentItem[] {
    try {
      // ファイル形式の検証
      let items: any[];
      
      if (Array.isArray(data)) {
        // 配列形式の場合（新しい形式）
        items = data;
      } else if (data && typeof data === 'object') {
        // オブジェクト形式の場合（レガシー形式）
        const validated = ContentDataSchema.parse(data);
        switch (type) {
          case 'proverb':
            items = validated.proverbs || [];
            break;
          case 'idiom':
            items = validated.idioms || [];
            break;
          case 'four_character_idiom':
            items = validated.four_character_idioms || [];
            break;
          default:
            items = [];
        }
      } else {
        throw new DataValidationError('Invalid data format');
      }

      // 各アイテムの検証と型付け
      const validatedItems: ContentItem[] = items.map((item, index) => {
        try {
          const validated = ContentItemSchema.parse(item);
          // typeフィールドがない場合は追加
          return {
            ...validated,
            type: validated.type || type,
          } as ContentItem;
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new DataValidationError(
              `Validation error in item at index ${index}: ${error.message}`,
              error
            );
          }
          throw error;
        }
      });

      return validatedItems;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new DataValidationError('Data validation failed', error);
      }
      throw error;
    }
  }

  // 全てのコンテンツタイプを読み込み
  async loadAllContent(): Promise<Map<ContentType, ContentItem[]>> {
    const contentTypes: ContentType[] = ['proverb', 'idiom', 'four_character_idiom'];
    const result = new Map<ContentType, ContentItem[]>();
    
    const promises = contentTypes.map(async (type) => {
      try {
        const content = await this.loadContent(type);
        result.set(type, content);
      } catch (error) {
        console.warn(`Failed to load ${type}:`, error);
        // 失敗しても他のコンテンツの読み込みは続行
        result.set(type, []);
      }
    });

    await Promise.all(promises);
    return result;
  }

  // キャッシュをクリア
  clearCache(): void {
    this.cache.clear();
  }

  // 特定のコンテンツタイプのキャッシュをクリア
  clearCacheForType(type: ContentType): void {
    this.cache.delete(type);
  }
}

// シングルトンインスタンス
export const dataLoader = new DataLoader();