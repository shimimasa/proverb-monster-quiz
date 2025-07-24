import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataLoader, DataLoadError, DataValidationError } from '../../src/loaders/dataLoader';
import { ContentType } from '../../src/types';

// モックデータ
const mockProverbData = [
  {
    id: 1,
    text: "猿も木から落ちる",
    reading: "さるもきからおちる",
    meaning: "どんなに得意なことでも、時には失敗することがある",
    difficulty: "小学生",
    example_sentence: "プロの料理人でも失敗することがある。猿も木から落ちるというものだ。",
  },
  {
    id: 2,
    text: "石の上にも三年",
    reading: "いしのうえにもさんねん",
    meaning: "つらいことでも辛抱して続ければ、いつかは成し遂げられる",
    difficulty: "小学生",
    example_sentence: "石の上にも三年というように、努力を続ければきっと上達するよ。",
  },
];

describe('DataLoader', () => {
  let dataLoader: DataLoader;

  beforeEach(() => {
    // 各テストの前に新しいインスタンスを作成
    dataLoader = new DataLoader();
    // fetch のモックをリセット
    vi.resetAllMocks();
  });

  describe('loadContent', () => {
    it('正常にことわざデータを読み込める', async () => {
      // fetch のモック
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockProverbData,
      });

      const result = await dataLoader.loadContent('proverb');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 1,
        text: "猿も木から落ちる",
        type: 'proverb',
      });
    });

    it('キャッシュされたデータを返す', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockProverbData,
      });

      // 1回目の読み込み
      await dataLoader.loadContent('proverb');
      
      // 2回目の読み込み（キャッシュから）
      const result = await dataLoader.loadContent('proverb');

      // fetchは1回しか呼ばれない
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
    });

    it('HTTPエラー時にDataLoadErrorをスロー', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(dataLoader.loadContent('proverb')).rejects.toThrow(DataLoadError);
      await expect(dataLoader.loadContent('proverb')).rejects.toThrow('Failed to load proverbs.json: 404 Not Found');
    });

    it('不正なデータ形式でDataValidationErrorをスロー', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ invalid: 'data' }],
      });

      await expect(dataLoader.loadContent('proverb')).rejects.toThrow(DataValidationError);
    });

    it('レガシー形式のデータも処理できる', async () => {
      const legacyData = {
        proverbs: mockProverbData,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => legacyData,
      });

      const result = await dataLoader.loadContent('proverb');

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('proverb');
    });
  });

  describe('loadAllContent', () => {
    it('全てのコンテンツタイプを読み込む', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProverbData,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        });

      const result = await dataLoader.loadAllContent();

      expect(result.size).toBe(3);
      expect(result.get('proverb')).toHaveLength(2);
      expect(result.get('idiom')).toHaveLength(0); // エラーの場合は空配列
      expect(result.get('four_character_idiom')).toHaveLength(0);
    });
  });

  describe('キャッシュ管理', () => {
    it('clearCacheで全てのキャッシュをクリア', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockProverbData,
      });

      // データを読み込んでキャッシュ
      await dataLoader.loadContent('proverb');
      
      // キャッシュをクリア
      dataLoader.clearCache();
      
      // 再度読み込み（fetchが再度呼ばれる）
      await dataLoader.loadContent('proverb');

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('clearCacheForTypeで特定のキャッシュのみクリア', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockProverbData,
      });

      // データを読み込んでキャッシュ
      await dataLoader.loadContent('proverb');
      
      // 特定のキャッシュをクリア
      dataLoader.clearCacheForType('proverb');
      
      // 再度読み込み
      await dataLoader.loadContent('proverb');

      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});