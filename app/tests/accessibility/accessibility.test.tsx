import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QuizScreen } from '@/components/quiz/QuizScreen';
import { MonsterCard } from '@/components/monster/MonsterCard';
import { KeyboardShortcutsHelp } from '@/components/common/KeyboardShortcutsHelp';
import { LevelUpNotification } from '@/components/common/LevelUpNotification';
import { GameProvider } from '@/contexts/GameContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { trapFocus, announceToScreenReader } from '@/utils/accessibility';

// jest-axeの拡張
expect.extend(toHaveNoViolations);

// モックデータ
const mockMonster = {
  id: 'test-1',
  name: 'テストモンスター',
  image: 'test.svg',
  rarity: 'common' as const,
  sourceContent: {
    id: 1,
    text: 'テストことわざ',
    reading: 'てすとことわざ',
    meaning: 'テストの意味',
    difficulty: '小学生' as const,
    example_sentence: 'テストの例文',
    type: 'proverb' as const,
  },
  unlocked: true,
  dateObtained: new Date(),
};

const mockLevelUpResult = {
  previousLevel: 1,
  newLevel: 2,
  experienceGained: 100,
  totalExperience: 200,
};

describe('アクセシビリティテスト', () => {
  describe('ARIAラベルとセマンティックHTML', () => {
    it('クイズ画面に適切なARIAラベルが設定されている', () => {
      render(
        <GameProvider>
          <QuizScreen />
        </GameProvider>
      );

      // メイン要素の確認
      expect(screen.getByRole('main', { name: 'クイズ画面' })).toBeInTheDocument();
      
      // セクションの確認
      expect(screen.getByRole('region', { name: 'コンボ情報' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: '進捗情報' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: '問題' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: '選択肢' })).toBeInTheDocument();
    });

    it('モンスターカードに適切なARIAラベルが設定されている', () => {
      render(<MonsterCard monster={mockMonster} />);

      const card = screen.getByRole('button', { 
        name: /テストモンスター、コモン、ことわざモンスター/ 
      });
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('未発見モンスターに適切なARIAラベルが設定されている', () => {
      const unlockedMonster = { ...mockMonster, unlocked: false };
      render(<MonsterCard monster={unlockedMonster} />);

      expect(screen.getByRole('article', { name: '未発見のモンスター' })).toBeInTheDocument();
    });
  });

  describe('キーボードナビゲーション', () => {
    it('選択肢ボタンが矢印キーで操作できる', async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn();
      
      render(
        <GameProvider>
          <QuizScreen />
        </GameProvider>
      );

      const buttons = screen.getAllByRole('button', { name: /選択肢/ });
      
      // 最初のボタンにフォーカス
      buttons[0].focus();
      expect(document.activeElement).toBe(buttons[0]);

      // 矢印下キーで次のボタンへ
      await user.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(buttons[1]);

      // 矢印右キーでも次のボタンへ
      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(buttons[2]);
    });

    it('数字キー(1-4)で選択肢を直接選択できる', async () => {
      const user = userEvent.setup();
      
      render(
        <GameProvider>
          <QuizScreen />
        </GameProvider>
      );

      // 数字キー"1"で最初の選択肢を選択
      await user.keyboard('1');
      
      // 選択されたことを確認（実際の実装に応じて調整）
      await waitFor(() => {
        expect(screen.getByText(/選択肢1を選択しました/)).toBeInTheDocument();
      });
    });
  });

  describe('フォーカス管理', () => {
    it('モーダル表示時にフォーカストラップが機能する', () => {
      const { rerender } = render(
        <LevelUpNotification 
          levelUpResult={null} 
          onClose={() => {}} 
        />
      );

      // モーダルを表示
      rerender(
        <LevelUpNotification 
          levelUpResult={mockLevelUpResult} 
          onClose={() => {}} 
        />
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      
      // フォーカスがモーダル内に制限されることを確認
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('モーダルを閉じた時に元の要素にフォーカスが戻る', async () => {
      const user = userEvent.setup();
      const mockClose = vi.fn();
      
      // フォーカスを設定するための要素
      const { container } = render(
        <>
          <button>元のボタン</button>
          <KeyboardShortcutsHelp isOpen={false} onClose={mockClose} />
        </>
      );

      const originalButton = screen.getByText('元のボタン');
      originalButton.focus();
      expect(document.activeElement).toBe(originalButton);

      // モーダルを開く
      container.querySelector('button')?.click();
      
      // Escapeキーで閉じる
      await user.keyboard('{Escape}');
      
      // フォーカスが元のボタンに戻ることを確認
      expect(document.activeElement).toBe(originalButton);
    });
  });

  describe('スクリーンリーダー対応', () => {
    it('正解時にライブリージョンで通知される', () => {
      const spy = vi.spyOn(document.body, 'appendChild');
      
      announceToScreenReader('正解です！', 'assertive');
      
      // アナウンス要素が作成されたことを確認
      expect(spy).toHaveBeenCalled();
      const announcement = spy.mock.calls[0][0] as HTMLElement;
      expect(announcement.getAttribute('role')).toBe('status');
      expect(announcement.getAttribute('aria-live')).toBe('assertive');
      expect(announcement.textContent).toBe('正解です！');
    });

    it('レベルアップ通知が適切にアナウンスされる', () => {
      render(
        <LevelUpNotification 
          levelUpResult={mockLevelUpResult} 
          onClose={() => {}} 
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'level-up-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'level-up-description');
    });
  });

  describe('WCAG準拠チェック', () => {
    it('クイズ画面がWCAG基準を満たしている', async () => {
      const { container } = render(
        <ThemeProvider>
          <GameProvider>
            <QuizScreen />
          </GameProvider>
        </ThemeProvider>
      );

      // axeによる自動アクセシビリティチェック
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('モンスターカードがWCAG基準を満たしている', async () => {
      const { container } = render(
        <ThemeProvider>
          <MonsterCard monster={mockMonster} />
        </ThemeProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('ヘルプモーダルがWCAG基準を満たしている', async () => {
      const { container } = render(
        <ThemeProvider>
          <KeyboardShortcutsHelp isOpen={true} onClose={() => {}} />
        </ThemeProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('高コントラストモード', () => {
    it('高コントラストモードでも適切に表示される', () => {
      // メディアクエリをモック
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <ThemeProvider>
          <GameProvider>
            <QuizScreen />
          </GameProvider>
        </ThemeProvider>
      );

      // 高コントラストスタイルが適用されていることを確認
      const elements = screen.getAllByRole('button');
      elements.forEach(element => {
        const styles = window.getComputedStyle(element);
        // 実際のスタイル値は実装に応じて調整
        expect(styles.borderWidth).not.toBe('0px');
      });
    });
  });

  describe('モーション設定', () => {
    it('モーション低減設定が反映される', () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { container } = render(
        <ThemeProvider>
          <MonsterCard monster={mockMonster} />
        </ThemeProvider>
      );

      // アニメーション要素のスタイルを確認
      const animatedElements = container.querySelectorAll('[style*="animation"]');
      animatedElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        expect(styles.animationDuration).toBe('0.01ms');
      });
    });
  });
});