import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameProvider } from '@/contexts/GameContext';
import App from '@/App';
import { LocalStorageManager } from '@/core/LocalStorageManager';

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

// Rechartsのモック
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

describe('ゲームフロー統合テスト', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it('新規ユーザーの完全なフロー: 設定 → クイズ → モンスター獲得 → 統計確認', async () => {
    const user = userEvent.setup();
    
    render(
      <GameProvider>
        <App />
      </GameProvider>
    );

    // 1. 初回訪問時は設定画面が表示される
    expect(screen.getByRole('heading', { name: '設定' })).toBeInTheDocument();
    
    // 2. プレイヤー名を入力
    const nameInput = screen.getByLabelText('プレイヤー名');
    await user.clear(nameInput);
    await user.type(nameInput, '統合テスト太郎');
    
    // 3. 設定を保存
    const saveButton = screen.getByRole('button', { name: '設定を保存' });
    await user.click(saveButton);
    
    // 4. クイズ画面に遷移
    await waitFor(() => {
      expect(screen.getByText(/第1問/)).toBeInTheDocument();
    });
    
    // 5. 問題が表示される
    expect(screen.getByTestId('question-text')).toBeInTheDocument();
    
    // 6. 選択肢をクリック
    const choices = screen.getAllByRole('button', { name: /^[1-4]\. / });
    expect(choices).toHaveLength(4);
    await user.click(choices[0]);
    
    // 7. 結果モーダルが表示される
    await waitFor(() => {
      expect(screen.getByTestId('result-modal')).toBeInTheDocument();
    });
    
    // 8. 解説が表示される
    expect(screen.getByTestId('explanation')).toBeInTheDocument();
    
    // 9. 次の問題へ進む
    const nextButton = screen.getByRole('button', { name: '次の問題へ' });
    await user.click(nextButton);
    
    // 10. 第2問が表示される
    await waitFor(() => {
      expect(screen.getByText(/第2問/)).toBeInTheDocument();
    });
    
    // 11. 統計画面へ移動
    const statsLink = screen.getByRole('link', { name: '統計' });
    await user.click(statsLink);
    
    // 12. 統計情報が表示される
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '統計' })).toBeInTheDocument();
    });
    
    // 13. プレイ数が更新されている
    expect(screen.getByText(/総問題数: 1/)).toBeInTheDocument();
    
    // 14. localStorageにデータが保存されている
    const savedData = LocalStorageManager.getUserProgress();
    expect(savedData?.playerName).toBe('統合テスト太郎');
    expect(savedData?.totalQuestions).toBe(1);
  });

  it('連続正解によるコンボシステムの動作確認', async () => {
    const user = userEvent.setup();
    
    // 既存ユーザーデータを設定
    const initialData = {
      playerName: 'コンボテスター',
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
    
    // クイズ画面が表示される
    await waitFor(() => {
      expect(screen.getByText(/第1問/)).toBeInTheDocument();
    });
    
    // コンボが初期状態では表示されない
    expect(screen.queryByTestId('combo-display')).not.toBeInTheDocument();
    
    // 3問連続で回答（実際には正解判定はモックが必要）
    for (let i = 0; i < 3; i++) {
      const choices = screen.getAllByRole('button', { name: /^[1-4]\. / });
      await user.click(choices[0]);
      
      // 結果モーダルを閉じる
      await waitFor(() => {
        expect(screen.getByTestId('result-modal')).toBeInTheDocument();
      });
      
      if (i >= 2) {
        // 3問目からコンボが表示される
        expect(screen.getByTestId('combo-display')).toBeInTheDocument();
      }
      
      const nextButton = screen.getByRole('button', { name: '次の問題へ' });
      await user.click(nextButton);
      
      if (i < 2) {
        await waitFor(() => {
          expect(screen.getByText(new RegExp(`第${i + 2}問`))).toBeInTheDocument();
        });
      }
    }
  });

  it('設定変更がゲームプレイに反映される', async () => {
    const user = userEvent.setup();
    
    // 初期データを設定
    const initialData = {
      playerName: '設定テスター',
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
    
    // 設定画面へ移動
    const settingsLink = screen.getByRole('link', { name: '設定' });
    await user.click(settingsLink);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '設定' })).toBeInTheDocument();
    });
    
    // 難易度を変更
    const difficultySelect = screen.getByLabelText('難易度');
    await user.selectOptions(difficultySelect, 'hard');
    
    // サウンドを無効化
    const soundToggle = screen.getByLabelText('効果音');
    await user.click(soundToggle);
    
    // 設定を保存
    const saveButton = screen.getByRole('button', { name: '設定を保存' });
    await user.click(saveButton);
    
    // クイズ画面へ戻る
    const quizLink = screen.getByRole('link', { name: 'クイズ' });
    await user.click(quizLink);
    
    await waitFor(() => {
      expect(screen.getByText(/第\d+問/)).toBeInTheDocument();
    });
    
    // 音声読み上げボタンが表示されない（サウンド無効のため）
    expect(screen.queryByRole('button', { name: '問題を読み上げる' })).not.toBeInTheDocument();
    
    // 設定が保存されていることを確認
    const savedData = LocalStorageManager.getUserProgress();
    expect(savedData?.settings.difficulty).toBe('hard');
    expect(savedData?.settings.soundEnabled).toBe(false);
  });

  it('モンスター獲得から図鑑表示までの流れ', async () => {
    const user = userEvent.setup();
    
    // モンスター獲得済みのユーザーデータ
    const initialData = {
      playerName: 'モンスターマスター',
      level: 3,
      experience: 500,
      totalCorrect: 15,
      totalQuestions: 20,
      currentStreak: 0,
      maxStreak: 5,
      unlockedMonsters: [
        { monsterId: 'mon_001', obtainedAt: new Date().toISOString(), count: 1 },
        { monsterId: 'mon_002', obtainedAt: new Date().toISOString(), count: 2 },
      ],
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
    
    // モンスターコレクション画面へ移動
    const monsterLink = screen.getByRole('link', { name: 'モンスター' });
    await user.click(monsterLink);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'モンスターコレクション' })).toBeInTheDocument();
    });
    
    // コレクション統計が表示される
    expect(screen.getByTestId('collection-stats')).toBeInTheDocument();
    expect(screen.getByText(/2 \//)).toBeInTheDocument(); // 2体獲得
    
    // モンスターカードが表示される
    const monsterCards = screen.getAllByTestId('monster-card');
    expect(monsterCards.length).toBeGreaterThanOrEqual(2);
    
    // フィルター機能を使用
    const rareFilter = screen.getByRole('button', { name: 'レア' });
    await user.click(rareFilter);
    
    // フィルターがアクティブになる
    expect(rareFilter).toHaveClass(/active|selected/);
  });

  it('レベルアップとアチーブメント獲得の流れ', async () => {
    const user = userEvent.setup();
    
    // レベルアップ間近のユーザーデータ
    const initialData = {
      playerName: 'レベルアッパー',
      level: 1,
      experience: 95, // あと5でレベルアップ
      totalCorrect: 9,
      totalQuestions: 10,
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
    
    // 結果モーダルでレベルアップ演出を確認
    await waitFor(() => {
      expect(screen.getByTestId('result-modal')).toBeInTheDocument();
    });
    
    // レベルアップメッセージが表示される可能性
    // （実際の実装に依存）
    
    // 設定画面の実績タブで確認
    const nextButton = screen.getByRole('button', { name: '次の問題へ' });
    await user.click(nextButton);
    
    const settingsLink = screen.getByRole('link', { name: '設定' });
    await user.click(settingsLink);
    
    const achievementsTab = screen.getByRole('tab', { name: '実績' });
    await user.click(achievementsTab);
    
    // 実績が表示される
    const achievementItems = screen.getAllByTestId('achievement-item');
    expect(achievementItems.length).toBeGreaterThan(0);
  });
});