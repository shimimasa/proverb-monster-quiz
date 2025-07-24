import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

describe('混合モード統合テスト', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it('複数のコンテンツタイプを混合して出題できる', async () => {
    const user = userEvent.setup();
    
    // 全てのコンテンツタイプを有効にした設定
    const userData = {
      playerName: '混合モードテスター',
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
        contentTypes: ['proverb', 'idiom', 'four_character_idiom'] as const[],
      },
    };
    LocalStorageManager.saveUserProgress(userData);
    
    render(
      <GameProvider>
        <App />
      </GameProvider>
    );
    
    // クイズ画面が表示される
    await waitFor(() => {
      expect(screen.getByText(/第1問/)).toBeInTheDocument();
    });
    
    // 異なるコンテンツタイプが出題されることを確認
    const contentTypes = new Set<string>();
    
    for (let i = 0; i < 10; i++) {
      // 問題文を確認
      const questionText = screen.getByTestId('question-text');
      const questionContent = questionText.textContent || '';
      
      // コンテンツタイプを推測
      if (questionContent.includes('ことわざ')) {
        contentTypes.add('proverb');
      } else if (questionContent.includes('慣用句')) {
        contentTypes.add('idiom');
      } else if (questionContent.includes('四字熟語')) {
        contentTypes.add('four_character_idiom');
      }
      
      // 回答して次へ
      const choices = screen.getAllByRole('button', { name: /^[1-4]\. / });
      await user.click(choices[0]);
      
      await waitFor(() => {
        expect(screen.getByTestId('result-modal')).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: '次の問題へ' }));
      
      if (i < 9) {
        await waitFor(() => {
          expect(screen.getByText(new RegExp(`第${i + 2}問`))).toBeInTheDocument();
        });
      }
    }
    
    // 複数のコンテンツタイプが出題されたことを確認
    expect(contentTypes.size).toBeGreaterThan(1);
  });

  it('設定で選択したコンテンツタイプのみが出題される', async () => {
    const user = userEvent.setup();
    
    // 四字熟語のみを有効にした設定
    const userData = {
      playerName: '四字熟語専門家',
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
        contentTypes: ['four_character_idiom'] as const[],
      },
    };
    LocalStorageManager.saveUserProgress(userData);
    
    render(
      <GameProvider>
        <App />
      </GameProvider>
    );
    
    // クイズ画面が表示される
    await waitFor(() => {
      expect(screen.getByText(/第1問/)).toBeInTheDocument();
    });
    
    // 5問チェックして全て四字熟語であることを確認
    for (let i = 0; i < 5; i++) {
      const questionText = screen.getByTestId('question-text');
      expect(questionText.textContent).toContain('四字熟語');
      
      // 回答して次へ
      const choices = screen.getAllByRole('button', { name: /^[1-4]\. / });
      await user.click(choices[0]);
      
      await waitFor(() => {
        expect(screen.getByTestId('result-modal')).toBeInTheDocument();
      });
      
      // 解説も四字熟語形式であることを確認
      const explanation = screen.getByTestId('explanation');
      expect(explanation.textContent).toContain('【四字熟語】');
      
      if (i < 4) {
        await user.click(screen.getByRole('button', { name: '次の問題へ' }));
        await waitFor(() => {
          expect(screen.getByText(new RegExp(`第${i + 2}問`))).toBeInTheDocument();
        });
      }
    }
  });

  it('設定画面でコンテンツタイプを変更すると即座に反映される', async () => {
    const user = userEvent.setup();
    
    // 初期設定：ことわざのみ
    const userData = {
      playerName: 'コンテンツ切り替えテスター',
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
    LocalStorageManager.saveUserProgress(userData);
    
    render(
      <GameProvider>
        <App />
      </GameProvider>
    );
    
    // 最初の問題がことわざであることを確認
    await waitFor(() => {
      expect(screen.getByText(/第1問/)).toBeInTheDocument();
    });
    
    const firstQuestionText = screen.getByTestId('question-text');
    expect(firstQuestionText.textContent).toContain('ことわざ');
    
    // 設定画面へ移動
    await user.click(screen.getByRole('link', { name: '設定' }));
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '設定' })).toBeInTheDocument();
    });
    
    // 慣用句と四字熟語を追加
    await user.click(screen.getByLabelText('慣用句'));
    await user.click(screen.getByLabelText('四字熟語'));
    
    // 設定を保存
    await user.click(screen.getByRole('button', { name: '設定を保存' }));
    
    // クイズ画面に戻る
    await user.click(screen.getByRole('link', { name: 'クイズ' }));
    
    // 新しい問題が表示される
    await waitFor(() => {
      expect(screen.getByText(/第\d+問/)).toBeInTheDocument();
    });
    
    // 複数回問題を確認して、異なるタイプが出題されることを確認
    const seenTypes = new Set<string>();
    
    for (let i = 0; i < 10; i++) {
      const questionText = screen.getByTestId('question-text');
      const content = questionText.textContent || '';
      
      if (content.includes('ことわざ')) seenTypes.add('proverb');
      if (content.includes('慣用句')) seenTypes.add('idiom');
      if (content.includes('四字熟語')) seenTypes.add('four_character_idiom');
      
      // 次の問題へ
      const choices = screen.getAllByRole('button', { name: /^[1-4]\. / });
      await user.click(choices[0]);
      
      await waitFor(() => {
        expect(screen.getByTestId('result-modal')).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: '次の問題へ' }));
      
      if (i < 9) {
        await waitFor(() => {
          expect(screen.getByText(/第\d+問/)).toBeInTheDocument();
        });
      }
    }
    
    // 複数のタイプが出題されたことを確認
    expect(seenTypes.size).toBeGreaterThan(1);
  });

  it('コンテンツタイプごとに適切な解説が表示される', async () => {
    const user = userEvent.setup();
    
    // 全タイプ有効
    const userData = {
      playerName: '解説確認テスター',
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
        contentTypes: ['proverb', 'idiom', 'four_character_idiom'] as const[],
      },
    };
    LocalStorageManager.saveUserProgress(userData);
    
    render(
      <GameProvider>
        <App />
      </GameProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/第1問/)).toBeInTheDocument();
    });
    
    // 回答して解説を確認
    const choices = screen.getAllByRole('button', { name: /^[1-4]\. / });
    await user.click(choices[0]);
    
    await waitFor(() => {
      expect(screen.getByTestId('result-modal')).toBeInTheDocument();
    });
    
    const explanation = screen.getByTestId('explanation');
    const explanationText = explanation.textContent || '';
    
    // 解説に適切なラベルが含まれることを確認
    expect(explanationText).toMatch(/【(ことわざ|慣用句|四字熟語)】/);
    
    // 読み方が含まれることを確認
    expect(explanationText).toMatch(/（.+）/);
    
    // 意味が含まれることを確認
    expect(explanationText).toContain('📖 意味：');
    
    // 難易度が含まれることを確認
    expect(explanationText).toContain('📊 難易度：');
  });
});