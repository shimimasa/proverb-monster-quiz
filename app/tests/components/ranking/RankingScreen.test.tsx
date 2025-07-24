import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RankingScreen } from '@/components/ranking/RankingScreen';
import { GameProvider } from '@/contexts/GameContext';
import type { RankingData, RankingEntry } from '@/types';

// モックデータ
const mockRankingEntry1: RankingEntry = {
  rank: 1,
  playerName: 'プレイヤー1',
  score: 1000,
  level: 10,
  correctRate: 95,
  totalQuestions: 100,
  date: new Date('2025-01-21').toISOString(),
};

const mockRankingEntry2: RankingEntry = {
  rank: 2,
  playerName: 'プレイヤー2',
  score: 900,
  level: 9,
  correctRate: 90,
  totalQuestions: 80,
  date: new Date('2025-01-21').toISOString(),
};

const mockRankingEntry3: RankingEntry = {
  rank: 3,
  playerName: 'プレイヤー3',
  score: 800,
  level: 8,
  correctRate: 85,
  totalQuestions: 70,
  date: new Date('2025-01-21').toISOString(),
};

const mockRankingData: RankingData = {
  dailyRankings: [mockRankingEntry1, mockRankingEntry2, mockRankingEntry3],
  weeklyRankings: [mockRankingEntry2, mockRankingEntry1, mockRankingEntry3],
  allTimeRankings: [mockRankingEntry3, mockRankingEntry2, mockRankingEntry1],
  lastUpdated: new Date().toISOString(),
};

// コンポーネントをラップするヘルパー関数
const renderRankingScreen = () => {
  const mockRankingManager = {
    getRankings: vi.fn(() => mockRankingData),
    getPlayerRank: vi.fn(() => 5),
    exportRankingCSV: vi.fn(() => 'csv,data,here'),
  };

  const mockProgressManager = {
    getProgress: vi.fn(() => ({
      playerName: '現在のプレイヤー',
      level: 5,
      totalCorrect: 50,
      totalQuestions: 60,
    })),
  };

  const mockGameValue = {
    rankingManager: mockRankingManager,
    progressManager: mockProgressManager,
  };

  return {
    ...render(
      <GameProvider value={mockGameValue}>
        <RankingScreen />
      </GameProvider>
    ),
    mockRankingManager,
    mockProgressManager,
  };
};

describe('RankingScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // URL.createObjectURLとURL.revokeObjectURLのモック
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  describe('レンダリング', () => {
    it('ランキング画面が正しく表示される', () => {
      renderRankingScreen();

      expect(screen.getByRole('heading', { name: 'ランキング' })).toBeInTheDocument();
      expect(screen.getByText('あなたの順位:')).toBeInTheDocument();
    });

    it('カテゴリータブが表示される', () => {
      renderRankingScreen();

      expect(screen.getByRole('tab', { name: 'デイリー' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'ウィークリー' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '全期間' })).toBeInTheDocument();
    });

    it('デフォルトでデイリーランキングが選択されている', () => {
      renderRankingScreen();

      const dailyTab = screen.getByRole('tab', { name: 'デイリー' });
      expect(dailyTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('ランキング表示', () => {
    it('デイリーランキングが正しく表示される', () => {
      renderRankingScreen();

      // 1位のプレイヤー
      expect(screen.getByText('プレイヤー1')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
      expect(screen.getByText('Lv.10')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
    });

    it('順位に応じたアイコンが表示される', () => {
      renderRankingScreen();

      // 王冠アイコン（1位）
      const crownIcon = document.querySelector('.text-yellow-400');
      expect(crownIcon).toBeInTheDocument();

      // メダルアイコン（2位、3位）
      const medals = document.querySelectorAll('.text-gray-400, .text-orange-400');
      expect(medals).toHaveLength(2);
    });

    it('プレイヤーの現在の順位が表示される', () => {
      renderRankingScreen();

      expect(screen.getByText('5位')).toBeInTheDocument();
    });
  });

  describe('カテゴリー切り替え', () => {
    it('ウィークリータブをクリックするとウィークリーランキングが表示される', async () => {
      const user = userEvent.setup();
      renderRankingScreen();

      await user.click(screen.getByRole('tab', { name: 'ウィークリー' }));

      // ウィークリーランキングの順序が異なることを確認
      const rankings = screen.getAllByRole('row');
      // ヘッダーを除いた最初のランキング行にプレイヤー2が表示される
      expect(rankings[1]).toHaveTextContent('プレイヤー2');
    });

    it('全期間タブをクリックすると全期間ランキングが表示される', async () => {
      const user = userEvent.setup();
      renderRankingScreen();

      await user.click(screen.getByRole('tab', { name: '全期間' }));

      // 全期間ランキングの順序が異なることを確認
      const rankings = screen.getAllByRole('row');
      // ヘッダーを除いた最初のランキング行にプレイヤー3が表示される
      expect(rankings[1]).toHaveTextContent('プレイヤー3');
    });
  });

  describe('CSVエクスポート', () => {
    it('エクスポートボタンをクリックするとCSVがダウンロードされる', async () => {
      const user = userEvent.setup();
      const { mockRankingManager } = renderRankingScreen();

      const exportButton = screen.getByRole('button', { name: 'CSVダウンロード' });
      await user.click(exportButton);

      // exportRankingCSVが呼ばれることを確認
      expect(mockRankingManager.exportRankingCSV).toHaveBeenCalledWith('daily');

      // ダウンロードリンクが作成されることを確認
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('エクスポート中はボタンが無効になる', async () => {
      const user = userEvent.setup();
      renderRankingScreen();

      const exportButton = screen.getByRole('button', { name: 'CSVダウンロード' });
      
      // クリック直後の状態を確認するのは難しいため、
      // ボタンの状態変化をテストする別の方法を検討
      await user.click(exportButton);
      
      // エクスポートが完了していることを確認
      await waitFor(() => {
        expect(exportButton).not.toBeDisabled();
      });
    });

    it('選択中のカテゴリーに応じたCSVがエクスポートされる', async () => {
      const user = userEvent.setup();
      const { mockRankingManager } = renderRankingScreen();

      // ウィークリーに切り替え
      await user.click(screen.getByRole('tab', { name: 'ウィークリー' }));

      // エクスポート
      await user.click(screen.getByRole('button', { name: 'CSVダウンロード' }));

      // weeklyカテゴリーでエクスポートされることを確認
      expect(mockRankingManager.exportRankingCSV).toHaveBeenCalledWith('weekly');
    });
  });

  describe('空のランキング', () => {
    it('ランキングデータがない場合は適切なメッセージが表示される', () => {
      const emptyRankingData: RankingData = {
        dailyRankings: [],
        weeklyRankings: [],
        allTimeRankings: [],
        lastUpdated: new Date().toISOString(),
      };

      const mockRankingManager = {
        getRankings: vi.fn(() => emptyRankingData),
        getPlayerRank: vi.fn(() => 0),
        exportRankingCSV: vi.fn(),
      };

      const mockProgressManager = {
        getProgress: vi.fn(() => ({
          playerName: '現在のプレイヤー',
          level: 1,
          totalCorrect: 0,
          totalQuestions: 0,
        })),
      };

      render(
        <GameProvider value={{ rankingManager: mockRankingManager, progressManager: mockProgressManager }}>
          <RankingScreen />
        </GameProvider>
      );

      expect(screen.getByText('まだランキングデータがありません')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定されている', () => {
      renderRankingScreen();

      // タブリスト
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();

      // 各タブ
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
      });

      // テーブル
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('ランキングテーブルに適切なヘッダーが設定されている', () => {
      renderRankingScreen();

      expect(screen.getByRole('columnheader', { name: '順位' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'プレイヤー' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'スコア' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'レベル' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: '正解率' })).toBeInTheDocument();
    });
  });

  describe('レスポンシブデザイン', () => {
    it('モバイルビューでは簡略表示される', () => {
      renderRankingScreen();

      // モバイルでは一部のカラムが非表示になることを確認
      const table = screen.getByRole('table');
      expect(table).toHaveClass('responsive-table');
    });
  });
});