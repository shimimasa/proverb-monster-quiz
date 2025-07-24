import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatsScreen } from '@/components/stats/StatsScreen';
import { learningHistoryManager } from '@/core/LearningHistoryManager';
import { LearningStats } from '@/types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children, data }: any) => (
    <div data-testid="area-chart" data-chart-data={JSON.stringify(data)}>{children}</div>
  ),
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>{children}</div>
  ),
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>{children}</div>
  ),
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Area: () => null,
  Line: () => null,
  Bar: () => null,
  Pie: ({ data }: any) => <div data-testid="pie" data-pie-data={JSON.stringify(data)} />,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

// Mock learningHistoryManager
vi.mock('@/core/LearningHistoryManager', () => ({
  learningHistoryManager: {
    getStats: vi.fn(),
    exportHistory: vi.fn(),
  },
}));

const mockStats: LearningStats = {
  totalQuestions: 100,
  totalCorrect: 80,
  overallAccuracy: 80,
  weeklyStats: {
    totalQuestions: 50,
    correctAnswers: 40,
    averageAccuracy: 80,
    totalStudyTime: 120,
    mostActiveDay: '月曜日',
    dateRange: {
      start: new Date('2025-01-14'),
      end: new Date('2025-01-20'),
    },
  },
  monthlyTrends: [
    { month: '2024年12月', questionsAnswered: 100, accuracy: 75 },
    { month: '2025年1月', questionsAnswered: 150, accuracy: 80 },
  ],
  categoryPerformance: [
    {
      type: 'proverb',
      totalQuestions: 50,
      correctAnswers: 40,
      accuracy: 80,
      averageTime: 2,
    },
    {
      type: 'idiom',
      totalQuestions: 30,
      correctAnswers: 24,
      accuracy: 80,
      averageTime: 1.5,
    },
    {
      type: 'four_character_idiom',
      totalQuestions: 20,
      correctAnswers: 16,
      accuracy: 80,
      averageTime: 3,
    },
  ],
  dailyHistory: [
    {
      date: new Date('2025-01-19'),
      questionsAnswered: 20,
      correctAnswers: 16,
      accuracy: 80,
      studyTime: 30,
    },
    {
      date: new Date('2025-01-20'),
      questionsAnswered: 30,
      correctAnswers: 24,
      accuracy: 80,
      studyTime: 45,
    },
  ],
  streakInfo: {
    currentStreak: 5,
    longestStreak: 10,
    lastStudyDate: new Date('2025-01-20'),
  },
};

describe('StatsScreen', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    (learningHistoryManager.getStats as any).mockReturnValue(mockStats);
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('統計情報を正しく表示する', async () => {
    render(<StatsScreen />);

    await waitFor(() => {
      expect(screen.getByText('学習統計')).toBeInTheDocument();
    });

    // サマリーカードの確認
    expect(screen.getByText('週間正答率')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('週間問題数')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('学習時間')).toBeInTheDocument();
    expect(screen.getByText('120分')).toBeInTheDocument();
    expect(screen.getByText('最も活発')).toBeInTheDocument();
    expect(screen.getByText('月曜日')).toBeInTheDocument();
  });

  it('期間セレクターが正しく動作する', async () => {
    render(<StatsScreen />);

    await waitFor(() => {
      expect(screen.getByText('週間')).toBeInTheDocument();
    });

    // デフォルトは週間表示
    const weeklyButton = screen.getByRole('button', { name: '週間' });
    expect(weeklyButton).toHaveAttribute('aria-pressed', 'true');

    // 日別表示に切り替え
    const dailyButton = screen.getByRole('button', { name: '日別' });
    await user.click(dailyButton);
    
    expect(dailyButton).toHaveAttribute('aria-pressed', 'true');
    expect(weeklyButton).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('日別学習進捗')).toBeInTheDocument();

    // 月別表示に切り替え
    const monthlyButton = screen.getByRole('button', { name: '月別' });
    await user.click(monthlyButton);
    
    expect(monthlyButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('月別トレンド')).toBeInTheDocument();
  });

  it('日別表示でチャートが表示される', async () => {
    render(<StatsScreen />);

    await waitFor(() => {
      expect(screen.getByText('日別')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '日別' }));

    // チャートの存在確認
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    
    // アクセシビリティ: チャートの代替テキスト確認
    expect(screen.getByText('日別学習進捗チャート')).toBeInTheDocument();
    expect(screen.getByText('正答率推移チャート')).toBeInTheDocument();
  });

  it('週間表示でカテゴリ別成績が表示される', async () => {
    render(<StatsScreen />);

    await waitFor(() => {
      expect(screen.getByText('カテゴリ別成績')).toBeInTheDocument();
    });

    // チャートの存在確認
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();

    // テーブルの確認
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-label', 'カテゴリ別成績詳細');
    
    // テーブルヘッダー
    expect(screen.getByText('カテゴリ')).toBeInTheDocument();
    expect(screen.getByText('問題数')).toBeInTheDocument();
    expect(screen.getByText('正解数')).toBeInTheDocument();
    expect(screen.getByText('正答率')).toBeInTheDocument();
    expect(screen.getByText('平均時間')).toBeInTheDocument();

    // テーブルデータ
    expect(screen.getByText('ことわざ')).toBeInTheDocument();
    expect(screen.getByText('慣用句')).toBeInTheDocument();
    expect(screen.getByText('四字熟語')).toBeInTheDocument();
  });

  it('データエクスポート機能が動作する', async () => {
    const mockExportData = JSON.stringify({ test: 'data' });
    (learningHistoryManager.exportHistory as any).mockReturnValue(mockExportData);

    // リンク要素の作成をモック
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

    render(<StatsScreen />);

    await waitFor(() => {
      expect(screen.getByText('データエクスポート')).toBeInTheDocument();
    });

    const exportButton = screen.getByRole('button', { name: '学習データをエクスポート' });
    await user.click(exportButton);

    // エクスポート処理の確認
    expect(learningHistoryManager.exportHistory).toHaveBeenCalled();
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockLink.download).toMatch(/learning_history_\d{4}-\d{2}-\d{2}\.json/);
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('ローディング状態を表示する', () => {
    (learningHistoryManager.getStats as any).mockReturnValue(null);
    
    render(<StatsScreen />);

    // ローディング表示の確認
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('アクセシビリティ: キーボード操作が可能', async () => {
    render(<StatsScreen />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '日別' })).toBeInTheDocument();
    });

    // Tabキーでボタン間を移動
    const dailyButton = screen.getByRole('button', { name: '日別' });
    const weeklyButton = screen.getByRole('button', { name: '週間' });
    const monthlyButton = screen.getByRole('button', { name: '月別' });

    dailyButton.focus();
    expect(document.activeElement).toBe(dailyButton);

    // Enterキーで選択
    fireEvent.keyDown(dailyButton, { key: 'Enter' });
    expect(dailyButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('アクセシビリティ: 適切なARIA属性が設定されている', async () => {
    render(<StatsScreen />);

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    // メイン要素のaria-label
    expect(screen.getByRole('main')).toHaveAttribute('aria-label', '統計画面');

    // リージョンのaria-label
    expect(screen.getByRole('region', { name: 'サマリー情報' })).toBeInTheDocument();
    
    // セクションのaria-label
    const periodSelector = screen.getByLabelText('期間選択');
    expect(periodSelector).toBeInTheDocument();

    // グループのaria-label
    expect(screen.getByRole('group', { name: '表示期間' })).toBeInTheDocument();
  });

  it('正答率に応じて色分けされる', async () => {
    render(<StatsScreen />);

    await waitFor(() => {
      expect(screen.getByText('カテゴリ別詳細')).toBeInTheDocument();
    });

    // 80%以上は緑色
    const highAccuracy = screen.getAllByText('80%')[0];
    expect(highAccuracy).toHaveClass('text-green-600');
  });
});