import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Footer } from '@/components/common/Footer';

describe('Footer', () => {
  const mockOnNavigate = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('モバイルナビゲーションボタンが表示される', () => {
    render(<Footer currentPage="quiz" onNavigate={mockOnNavigate} />);

    expect(screen.getByRole('button', { name: 'クイズ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'モンスター' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ランキング' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '統計' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '設定' })).toBeInTheDocument();
  });

  it('現在のページがハイライトされる', () => {
    render(<Footer currentPage="collection" onNavigate={mockOnNavigate} />);

    const collectionButton = screen.getByRole('button', { name: 'モンスター' });
    expect(collectionButton).toHaveClass('text-blue-600');
    expect(collectionButton).toHaveAttribute('aria-current', 'page');

    const quizButton = screen.getByRole('button', { name: 'クイズ' });
    expect(quizButton).toHaveClass('text-gray-500');
    expect(quizButton).not.toHaveAttribute('aria-current');
  });

  it('ナビゲーションボタンクリックでonNavigateが呼ばれる', async () => {
    render(<Footer currentPage="quiz" onNavigate={mockOnNavigate} />);

    await user.click(screen.getByRole('button', { name: 'モンスター' }));
    expect(mockOnNavigate).toHaveBeenCalledWith('collection');

    await user.click(screen.getByRole('button', { name: '統計' }));
    expect(mockOnNavigate).toHaveBeenCalledWith('stats');

    await user.click(screen.getByRole('button', { name: '設定' }));
    expect(mockOnNavigate).toHaveBeenCalledWith('settings');
  });

  it('アイコンとラベルが正しく表示される', () => {
    render(<Footer currentPage="quiz" onNavigate={mockOnNavigate} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      // 各ボタンにアイコン（SVG）とテキストラベルが含まれている
      expect(button.querySelector('svg')).toBeInTheDocument();
      expect(button.textContent).toBeTruthy();
    });
  });

  it('アクセシビリティ: 適切なロールとラベルが設定されている', () => {
    render(<Footer currentPage="quiz" onNavigate={mockOnNavigate} />);

    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'モバイルナビゲーション' });
    expect(nav).toBeInTheDocument();
  });

  it('アクセシビリティ: キーボードナビゲーションが動作する', () => {
    render(<Footer currentPage="quiz" onNavigate={mockOnNavigate} />);

    const quizButton = screen.getByRole('button', { name: 'クイズ' });
    const monsterButton = screen.getByRole('button', { name: 'モンスター' });
    const settingsButton = screen.getByRole('button', { name: '設定' });

    // 最初のボタンにフォーカス
    quizButton.focus();
    expect(document.activeElement).toBe(quizButton);

    // 右矢印キーで次のボタンへ
    fireEvent.keyDown(quizButton, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(monsterButton);

    // 左矢印キーで前のボタンへ（ラップアラウンド）
    fireEvent.keyDown(quizButton, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(settingsButton);

    // 右矢印キーで最後から最初へ（ラップアラウンド）
    settingsButton.focus();
    fireEvent.keyDown(settingsButton, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(quizButton);

    // Homeキーで最初のボタンへ
    settingsButton.focus();
    fireEvent.keyDown(settingsButton, { key: 'Home' });
    expect(document.activeElement).toBe(quizButton);

    // Endキーで最後のボタンへ
    quizButton.focus();
    fireEvent.keyDown(quizButton, { key: 'End' });
    expect(document.activeElement).toBe(settingsButton);
  });

  it('アイコンにaria-hidden属性が設定されている', () => {
    render(<Footer currentPage="quiz" onNavigate={mockOnNavigate} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      const svg = button.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('レスポンシブ: デスクトップでは非表示', () => {
    // ビューポートサイズを変更してデスクトップ表示をシミュレート
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));

    render(<Footer currentPage="quiz" onNavigate={mockOnNavigate} />);

    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('md:hidden');
  });

  it('フッターは画面下部に固定される', () => {
    render(<Footer currentPage="quiz" onNavigate={mockOnNavigate} />);

    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0');
  });

  it('ボタンのレイアウトが適切', () => {
    render(<Footer currentPage="quiz" onNavigate={mockOnNavigate} />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('flex', 'items-center', 'justify-around');

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('flex', 'flex-col', 'items-center');
    });
  });

  it('ホバー効果が適用される', () => {
    render(<Footer currentPage="quiz" onNavigate={mockOnNavigate} />);

    const inactiveButton = screen.getByRole('button', { name: 'モンスター' });
    expect(inactiveButton).toHaveClass('hover:text-gray-700');
  });
});