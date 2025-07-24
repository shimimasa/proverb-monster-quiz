import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsScreen } from '@/components/common/SettingsScreen';
import { GameProvider } from '@/contexts/GameContext';
import type { UserSettings, UserProgress, Achievement } from '@/types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock hooks
const mockUpdateSettings = vi.fn();
const mockResetProgress = vi.fn();
const mockResetCollection = vi.fn();
const mockExportAllData = vi.fn();
const mockImportAllData = vi.fn();

const mockSettings: UserSettings = {
  difficulty: '小学生',
  contentTypes: ['proverb', 'idiom'],
  soundEnabled: true,
  effectsVolume: 0.7,
};

const mockStats = {
  totalQuestions: 100,
  accuracy: 85.5,
  averageStreak: 3.2,
  daysPlayed: 10,
  levelProgress: {
    currentLevel: 5,
    currentExp: 250,
    expToNext: 150,
    progressPercentage: 62.5,
  },
  favoriteContentType: 'proverb' as const,
  bestStreak: 15,
  questionsPerDay: 10,
};

const mockAchievements: Achievement[] = [
  {
    id: 'first_correct',
    name: '初めての正解',
    description: '最初の問題に正解した',
    icon: '🎯',
    unlockedAt: new Date('2025-01-20'),
  },
  {
    id: 'correct_10',
    name: '10問正解',
    description: '合計10問正解した',
    icon: '🌟',
    unlockedAt: null,
  },
];

const mockProgress: UserProgress = {
  level: 5,
  experience: 250,
  totalQuestions: 100,
  totalCorrect: 85,
  currentStreak: 3,
  bestStreak: 15,
  lastPlayedDate: '2025-01-21',
  achievementIds: ['first_correct'],
  settings: mockSettings,
};

// Mock useGame hook
vi.mock('@/contexts/GameContext', () => ({
  GameProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useGame: () => ({
    progressManager: {
      getSettings: () => mockSettings,
      getStats: () => mockStats,
      getAchievements: () => mockAchievements,
      getProgress: () => mockProgress,
      updateSettings: mockUpdateSettings,
      resetProgress: mockResetProgress,
    },
    monsterManager: {
      resetCollection: mockResetCollection,
    },
    localStorageManager: {
      exportAllData: mockExportAllData,
      importAllData: mockImportAllData,
    },
  }),
}));

describe('SettingsScreen', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn((key) => key === 'playerName' ? 'テストプレイヤー' : null),
      setItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Mock window methods
    window.confirm = vi.fn(() => false);
    window.alert = vi.fn();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('初期表示で設定タブが表示される', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('設定')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '設定' })).toHaveClass('bg-blue-600');
    expect(screen.getByText('プレイヤー名')).toBeInTheDocument();
    expect(screen.getByText('難易度')).toBeInTheDocument();
    expect(screen.getByText('出題内容')).toBeInTheDocument();
    expect(screen.getByText('サウンド')).toBeInTheDocument();
  });

  it('タブ切り替えが正しく動作する', async () => {
    render(<SettingsScreen />);

    // 統計タブへ切り替え
    const statsTab = screen.getByRole('button', { name: '統計' });
    await user.click(statsTab);

    expect(statsTab).toHaveClass('bg-blue-600');
    expect(screen.getByText('統計情報')).toBeInTheDocument();
    expect(screen.getByText('総問題数')).toBeInTheDocument();

    // 実績タブへ切り替え
    const achievementsTab = screen.getByRole('button', { name: '実績' });
    await user.click(achievementsTab);

    expect(achievementsTab).toHaveClass('bg-blue-600');
    expect(screen.getByText('実績')).toBeInTheDocument();
    expect(screen.getByText('初めての正解')).toBeInTheDocument();
  });

  describe('設定タブ', () => {
    it('プレイヤー名を変更できる', async () => {
      render(<SettingsScreen />);

      const nameInput = screen.getByPlaceholderText('名前を入力してください');
      expect(nameInput).toHaveValue('テストプレイヤー');

      await user.clear(nameInput);
      await user.type(nameInput, '新しい名前');

      expect(localStorage.setItem).toHaveBeenCalledWith('playerName', '新しい名前');
    });

    it('難易度を変更できる', async () => {
      render(<SettingsScreen />);

      const middleschoolRadio = screen.getByLabelText('中学生');
      await user.click(middleschoolRadio);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ difficulty: '中学生' });
    });

    it('コンテンツタイプを切り替えできる', async () => {
      render(<SettingsScreen />);

      // 四字熟語を追加
      const fourCharCheckbox = screen.getByLabelText('四字熟語');
      await user.click(fourCharCheckbox);

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        contentTypes: ['proverb', 'idiom', 'four_character_idiom'],
      });

      // 慣用句を削除
      const idiomCheckbox = screen.getByLabelText('慣用句');
      await user.click(idiomCheckbox);

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        contentTypes: ['proverb'],
      });
    });

    it('少なくとも1つのコンテンツタイプは選択されている必要がある', async () => {
      // 1つだけ選択されている状態をシミュレート
      mockSettings.contentTypes = ['proverb'];
      render(<SettingsScreen />);

      const proverbCheckbox = screen.getByLabelText('ことわざ');
      await user.click(proverbCheckbox);

      // updateSettingsが呼ばれないことを確認
      expect(mockUpdateSettings).not.toHaveBeenCalled();
    });

    it('サウンド設定を変更できる', async () => {
      render(<SettingsScreen />);

      const soundCheckbox = screen.getByLabelText('効果音を有効にする');
      await user.click(soundCheckbox);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ soundEnabled: false });
    });

    it('音量を調整できる', async () => {
      render(<SettingsScreen />);

      const volumeSlider = screen.getByRole('slider');
      fireEvent.change(volumeSlider, { target: { value: '0.5' } });

      expect(mockUpdateSettings).toHaveBeenCalledWith({ effectsVolume: 0.5 });
    });

    it('サウンドが無効時は音量スライダーが無効になる', () => {
      mockSettings.soundEnabled = false;
      render(<SettingsScreen />);

      const volumeSlider = screen.getByRole('slider');
      expect(volumeSlider).toBeDisabled();
    });

    it('データエクスポートが動作する', async () => {
      mockExportAllData.mockResolvedValue(JSON.stringify({ test: 'data' }));
      
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      render(<SettingsScreen />);

      const exportButton = screen.getByText('データをエクスポート');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockExportAllData).toHaveBeenCalled();
        expect(mockLink.click).toHaveBeenCalled();
        expect(mockLink.download).toMatch(/kotodama-monster-backup-\d{4}-\d{2}-\d{2}\.json/);
      });
    });

    it('データインポートが動作する', async () => {
      const file = new File(['{"test": "data"}'], 'test.json', { type: 'application/json' });
      mockImportAllData.mockResolvedValue(undefined);

      render(<SettingsScreen />);

      const fileInput = screen.getByLabelText('データをインポート').querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();

      await user.upload(fileInput as HTMLInputElement, file);

      await waitFor(() => {
        expect(mockImportAllData).toHaveBeenCalledWith('{"test": "data"}');
        expect(window.alert).toHaveBeenCalledWith('データのインポートに成功しました。');
      });
    });

    it('進捗リセットの確認ダイアログが表示される', async () => {
      render(<SettingsScreen />);

      const resetButton = screen.getByText('進捗をリセット');
      await user.click(resetButton);

      expect(window.confirm).toHaveBeenCalledWith(
        '本当に進捗をリセットしますか？この操作は取り消せません。'
      );
      expect(mockResetProgress).not.toHaveBeenCalled();
    });

    it('進捗リセットを確認すると実行される', async () => {
      window.confirm = vi.fn(() => true);
      const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});

      render(<SettingsScreen />);

      const resetButton = screen.getByText('進捗をリセット');
      await user.click(resetButton);

      expect(mockResetProgress).toHaveBeenCalled();
      expect(mockResetCollection).toHaveBeenCalled();
      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  describe('統計タブ', () => {
    it('統計情報が表示される', async () => {
      render(<SettingsScreen />);

      await user.click(screen.getByRole('button', { name: '統計' }));

      expect(screen.getByText('100')).toBeInTheDocument(); // 総問題数
      expect(screen.getByText('85.5%')).toBeInTheDocument(); // 正解率
      expect(screen.getByText('3.2')).toBeInTheDocument(); // 平均ストリーク
      expect(screen.getByText('10')).toBeInTheDocument(); // プレイ日数
      expect(screen.getByText('Lv.5')).toBeInTheDocument(); // レベル
      expect(screen.getByText('ことわざ')).toBeInTheDocument(); // お気に入りタイプ
      expect(screen.getByText('15連続')).toBeInTheDocument(); // 最高ストリーク
      expect(screen.getByText('10.0問')).toBeInTheDocument(); // 1日あたりの問題数
    });

    it('レベル進捗バーがアニメーション表示される', async () => {
      render(<SettingsScreen />);

      await user.click(screen.getByRole('button', { name: '統計' }));

      const progressBar = screen.getByText('250 EXP').parentElement?.parentElement?.querySelector('.bg-gradient-to-r');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: '62.5%' });
    });
  });

  describe('実績タブ', () => {
    it('実績一覧が表示される', async () => {
      render(<SettingsScreen />);

      await user.click(screen.getByRole('button', { name: '実績' }));

      expect(screen.getByText('初めての正解')).toBeInTheDocument();
      expect(screen.getByText('最初の問題に正解した')).toBeInTheDocument();
      expect(screen.getByText('10問正解')).toBeInTheDocument();
      expect(screen.getByText('合計10問正解した')).toBeInTheDocument();
    });

    it('獲得済み実績には日付とチェックマークが表示される', async () => {
      render(<SettingsScreen />);

      await user.click(screen.getByRole('button', { name: '実績' }));

      const unlockedAchievement = screen.getByText('初めての正解').parentElement?.parentElement;
      expect(unlockedAchievement).toHaveClass('bg-yellow-50');
      expect(screen.getByText('2025/01/20に獲得')).toBeInTheDocument();
    });

    it('未獲得実績は灰色で表示される', async () => {
      render(<SettingsScreen />);

      await user.click(screen.getByRole('button', { name: '実績' }));

      const lockedAchievement = screen.getByText('10問正解').parentElement?.parentElement;
      expect(lockedAchievement).toHaveClass('bg-gray-50');
    });

    it('実績の獲得進捗が表示される', async () => {
      render(<SettingsScreen />);

      await user.click(screen.getByRole('button', { name: '実績' }));

      expect(screen.getByText('獲得済み実績')).toBeInTheDocument();
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });
  });
});