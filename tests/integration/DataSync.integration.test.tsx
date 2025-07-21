import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameProvider } from '@/contexts/GameContext';
import App from '@/App';
import { LocalStorageManager } from '@/core/LocalStorageManager';
import { ContentManager } from '@/core/ContentManager';
import { MonsterManager } from '@/core/MonsterManager';
import { ProgressManager } from '@/core/ProgressManager';

// LocalStorageのモック
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key],
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Framer Motionのモック
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('データ同期統合テスト', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it('マネージャー間でデータが正しく同期される', async () => {
    const user = userEvent.setup();
    
    // 初期データを設定
    const contentManager = new ContentManager();
    const monsterManager = new MonsterManager();
    const progressManager = new ProgressManager();
    
    // データを初期化
    await contentManager.initialize();
    
    render(
      <GameProvider>
        <App />
      </GameProvider>
    );
    
    // 設定画面で初期設定
    const nameInput = screen.getByLabelText('プレイヤー名');
    await user.clear(nameInput);
    await user.type(nameInput, 'データ同期テスター');
    
    const saveButton = screen.getByRole('button', { name: '設定を保存' });
    await user.click(saveButton);
    
    // クイズ画面に遷移
    await waitFor(() => {
      expect(screen.getByText(/第1問/)).toBeInTheDocument();
    });
    
    // 問題に回答
    const choices = screen.getAllByRole('button', { name: /^[1-4]\. / });
    await user.click(choices[0]);
    
    await waitFor(() => {
      expect(screen.getByTestId('result-modal')).toBeInTheDocument();
    });
    
    // データが更新されていることを確認
    const savedProgress = LocalStorageManager.getUserProgress();
    expect(savedProgress?.totalQuestions).toBe(1);
    expect(savedProgress?.playerName).toBe('データ同期テスター');
    
    // モンスターデータも同期されている
    const monsterData = LocalStorageManager.getMonsterData();
    expect(monsterData).toBeDefined();
  });

  it('localStorageとメモリ上のデータが一致する', async () => {
    const user = userEvent.setup();
    
    // 既存データを設定
    const initialData = {
      playerName: '同期確認ユーザー',
      level: 2,
      experience: 250,
      totalCorrect: 8,
      totalQuestions: 10,
      currentStreak: 2,
      maxStreak: 5,
      unlockedMonsters: [
        { monsterId: 'mon_001', obtainedAt: new Date().toISOString(), count: 1 },
      ],
      lastPlayedDate: new Date().toISOString(),
      settings: {
        soundEnabled: true,
        volume: 0.7,
        difficulty: 'normal' as const,
        contentTypes: ['proverb', 'idiom'] as const[],
      },
    };
    LocalStorageManager.saveUserProgress(initialData);
    
    render(
      <GameProvider>
        <App />
      </GameProvider>
    );
    
    // 設定画面で設定を確認
    const settingsLink = screen.getByRole('link', { name: '設定' });
    await user.click(settingsLink);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '設定' })).toBeInTheDocument();
    });
    
    // 表示されているデータが保存データと一致
    const nameInput = screen.getByLabelText('プレイヤー名');
    expect(nameInput).toHaveValue('同期確認ユーザー');
    
    const volumeSlider = screen.getByLabelText('音量');
    expect(volumeSlider).toHaveValue('0.7');
    
    // コンテンツタイプの選択状態
    expect(screen.getByLabelText('ことわざ')).toBeChecked();
    expect(screen.getByLabelText('四字熟語')).toBeChecked();
    expect(screen.getByLabelText('慣用句')).not.toBeChecked();
    
    // 統計タブで詳細を確認
    const statsTab = screen.getByRole('tab', { name: '統計' });
    await user.click(statsTab);
    
    expect(screen.getByText('レベル 2')).toBeInTheDocument();
    expect(screen.getByText('250 / 500 XP')).toBeInTheDocument();
    expect(screen.getByText('総プレイ数: 10問')).toBeInTheDocument();
    expect(screen.getByText('正解数: 8問')).toBeInTheDocument();
  });

  it('複数のタブ/ウィンドウ間でのデータ同期をシミュレート', async () => {
    const user = userEvent.setup();
    
    // 最初のインスタンス
    render(
      <GameProvider>
        <App />
      </GameProvider>
    );
    
    // 初期設定
    const nameInput = screen.getByLabelText('プレイヤー名');
    await user.clear(nameInput);
    await user.type(nameInput, 'マルチタブユーザー');
    
    const saveButton = screen.getByRole('button', { name: '設定を保存' });
    await user.click(saveButton);
    
    // localStorageを直接更新（別タブでの変更をシミュレート）
    const currentData = LocalStorageManager.getUserProgress();
    if (currentData) {
      currentData.level = 5;
      currentData.experience = 1000;
      currentData.totalCorrect = 50;
      currentData.totalQuestions = 60;
      LocalStorageManager.saveUserProgress(currentData);
    }
    
    // storageイベントを発火
    const storageEvent = new StorageEvent('storage', {
      key: 'kotodama-user-progress',
      newValue: JSON.stringify(currentData),
      oldValue: null,
      storageArea: window.localStorage,
    });
    window.dispatchEvent(storageEvent);
    
    // UIが更新されることを確認
    await waitFor(() => {
      const header = screen.getByRole('banner');
      expect(header).toContainHTML('Lv.5');
    });
  });

  it('データ破損時の復旧処理が正しく動作する', async () => {
    // 破損したデータを設定
    mockLocalStorage.setItem('kotodama-user-progress', '{"invalid": json}');
    
    render(
      <GameProvider>
        <App />
      </GameProvider>
    );
    
    // エラーが表示されずに初期画面が表示される
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '設定' })).toBeInTheDocument();
    });
    
    // デフォルト値で初期化されている
    const nameInput = screen.getByLabelText('プレイヤー名');
    expect(nameInput).toHaveValue('');
  });

  it('設定変更が全画面に即座に反映される', async () => {
    const user = userEvent.setup();
    
    // 初期データ
    const initialData = {
      playerName: '設定反映テスター',
      level: 1,
      experience: 0,
      totalCorrect: 0,
      totalQuestions: 0,
      currentStreak: 0,
      maxStreak: 0,
      unlockedMonsters: [],
      lastPlayedDate: new Date().toISOString(),
      settings: {
        soundEnabled: true,
        volume: 0.5,
        difficulty: 'normal' as const,
        contentTypes: ['proverb'] as const[],
      },
    };
    LocalStorageManager.saveUserProgress(initialData);
    
    render(
      <GameProvider>
        <App />
      </GameProvider>
    );
    
    // クイズ画面を確認
    await waitFor(() => {
      expect(screen.getByText(/第1問/)).toBeInTheDocument();
    });
    
    // 音声ボタンが表示されている
    expect(screen.getByRole('button', { name: '問題を読み上げる' })).toBeInTheDocument();
    
    // 設定画面へ移動
    const settingsLink = screen.getByRole('link', { name: '設定' });
    await user.click(settingsLink);
    
    // サウンドを無効化
    const soundToggle = screen.getByLabelText('効果音');
    await user.click(soundToggle);
    
    const saveButton = screen.getByRole('button', { name: '設定を保存' });
    await user.click(saveButton);
    
    // クイズ画面に戻る
    const quizLink = screen.getByRole('link', { name: 'クイズ' });
    await user.click(quizLink);
    
    // 音声ボタンが非表示になっている
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '問題を読み上げる' })).not.toBeInTheDocument();
    });
  });

  it('アチーブメント達成時のデータ更新が正しく行われる', async () => {
    const user = userEvent.setup();
    
    // アチーブメント達成間近のデータ
    const initialData = {
      playerName: 'アチーブメントハンター',
      level: 1,
      experience: 0,
      totalCorrect: 9, // 10問正解でアチーブメント
      totalQuestions: 15,
      currentStreak: 0,
      maxStreak: 3,
      unlockedMonsters: [],
      lastPlayedDate: new Date().toISOString(),
      settings: {
        soundEnabled: true,
        volume: 0.5,
        difficulty: 'normal' as const,
        contentTypes: ['proverb'] as const[],
      },
      achievements: {
        firstCorrect: { unlocked: true, unlockedAt: new Date().toISOString() },
        tenCorrect: { unlocked: false, progress: 9 },
      },
    };
    LocalStorageManager.saveUserProgress(initialData);
    
    render(
      <GameProvider>
        <App />
      </GameProvider>
    );
    
    // クイズ画面で問題に回答
    await waitFor(() => {
      expect(screen.getByText(/第\d+問/)).toBeInTheDocument();
    });
    
    const choices = screen.getAllByRole('button', { name: /^[1-4]\. / });
    await user.click(choices[0]);
    
    // アチーブメント達成の通知が表示される可能性
    await waitFor(() => {
      expect(screen.getByTestId('result-modal')).toBeInTheDocument();
    });
    
    // 次へ進む
    const nextButton = screen.getByRole('button', { name: '次の問題へ' });
    await user.click(nextButton);
    
    // 設定画面の実績タブで確認
    const settingsLink = screen.getByRole('link', { name: '設定' });
    await user.click(settingsLink);
    
    const achievementsTab = screen.getByRole('tab', { name: '実績' });
    await user.click(achievementsTab);
    
    // アチーブメントの進捗が更新されている
    const savedData = LocalStorageManager.getUserProgress();
    expect(savedData?.achievements?.tenCorrect?.progress).toBeGreaterThanOrEqual(10);
  });
});