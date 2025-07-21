import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '@/components/common/Header';
import { GameProvider } from '@/contexts/GameContext';
import type { UserProgress } from '@/types';

// Mock data
const mockProgress: UserProgress = {
  level: 5,
  experience: 250,
  totalQuestions: 100,
  totalCorrect: 80,
  currentStreak: 3,
  bestStreak: 10,
  lastPlayedDate: '2025-01-21',
  achievementIds: [],
  settings: {
    difficulty: '小学生',
    contentTypes: ['proverb'],
    soundEnabled: true,
    effectsVolume: 0.7,
  },
};

// Mock useGame hook
vi.mock('@/contexts/GameContext', () => ({
  GameProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useGame: () => ({
    progressManager: {
      getProgress: () => mockProgress,
    },
  }),
}));

describe('Header', () => {
  const mockOnNavigate = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('アプリケーションタイトルが表示される', () => {
    render(<Header currentPage="quiz" onNavigate={mockOnNavigate} />);

    expect(screen.getByText('ことだまモンスター')).toBeInTheDocument();
    expect(screen.getByText('📚')).toBeInTheDocument();
  });

  it('ユーザー統計が表示される（デスクトップ）', () => {
    render(<Header currentPage="quiz" onNavigate={mockOnNavigate} />);

    expect(screen.getByText('Lv.5')).toBeInTheDocument();
    expect(screen.getByText('80問正解')).toBeInTheDocument();
  });

  it('ナビゲーションボタンが表示される（デスクトップ）', () => {
    render(<Header currentPage="quiz" onNavigate={mockOnNavigate} />);

    expect(screen.getByRole('button', { name: 'クイズ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'コレクション' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ランキング' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '統計' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '設定' })).toBeInTheDocument();
  });

  it('現在のページがハイライトされる', () => {
    render(<Header currentPage="stats" onNavigate={mockOnNavigate} />);

    const statsButton = screen.getByRole('button', { name: '統計' });
    expect(statsButton).toHaveClass('text-blue-600');
    expect(statsButton).toHaveAttribute('aria-current', 'page');

    const quizButton = screen.getByRole('button', { name: 'クイズ' });
    expect(quizButton).toHaveClass('text-gray-600');
    expect(quizButton).not.toHaveAttribute('aria-current');
  });

  it('ナビゲーションボタンクリックでonNavigateが呼ばれる', async () => {
    render(<Header currentPage="quiz" onNavigate={mockOnNavigate} />);

    await user.click(screen.getByRole('button', { name: 'コレクション' }));
    expect(mockOnNavigate).toHaveBeenCalledWith('collection');

    await user.click(screen.getByRole('button', { name: '統計' }));
    expect(mockOnNavigate).toHaveBeenCalledWith('stats');
  });

  it('アクセシビリティ: 適切なロールとラベルが設定されている', () => {
    render(<Header currentPage="quiz" onNavigate={mockOnNavigate} />);

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'メインナビゲーション' });
    expect(nav).toBeInTheDocument();

    const statsRegion = screen.getByRole('region', { name: 'ユーザー統計' });
    expect(statsRegion).toBeInTheDocument();
  });

  it('アクセシビリティ: キーボードナビゲーションが動作する', () => {
    render(<Header currentPage="quiz" onNavigate={mockOnNavigate} />);

    const buttons = screen.getAllByRole('button');
    const quizButton = screen.getByRole('button', { name: 'クイズ' });
    const collectionButton = screen.getByRole('button', { name: 'コレクション' });

    // 最初のボタンにフォーカス
    quizButton.focus();
    expect(document.activeElement).toBe(quizButton);

    // 右矢印キーで次のボタンへ
    fireEvent.keyDown(quizButton, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(collectionButton);

    // 左矢印キーで前のボタンへ
    fireEvent.keyDown(collectionButton, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(quizButton);

    // Homeキーで最初のボタンへ
    const lastButton = buttons[buttons.length - 1];
    lastButton.focus();
    fireEvent.keyDown(lastButton, { key: 'Home' });
    expect(document.activeElement).toBe(buttons[0]);

    // Endキーで最後のボタンへ
    fireEvent.keyDown(buttons[0], { key: 'End' });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });

  it('アイコンにaria-hidden属性が設定されている', () => {
    render(<Header currentPage="quiz" onNavigate={mockOnNavigate} />);

    // 絵文字アイコン
    const emojiIcon = screen.getByText('📚');
    expect(emojiIcon).toHaveAttribute('aria-hidden', 'true');

    // React Iconsのアイコンもaria-hiddenが設定されているか確認
    const navButtons = screen.getAllByRole('button');
    navButtons.forEach(button => {
      const svg = button.querySelector('svg');
      if (svg) {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      }
    });
  });

  it('レスポンシブ: モバイルではナビゲーションが非表示', () => {
    // ビューポートサイズを変更してモバイル表示をシミュレート
    global.innerWidth = 375;
    global.dispatchEvent(new Event('resize'));

    render(<Header currentPage="quiz" onNavigate={mockOnNavigate} />);

    const nav = screen.getByRole('navigation', { name: 'メインナビゲーション' });
    expect(nav).toHaveClass('hidden', 'md:flex');
  });
});