import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import React from 'react';

// エラーを投げるコンポーネント
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>正常なコンテンツ</div>;
};

// カスタムfallbackコンポーネント
const CustomFallback = (error: Error, errorInfo: any, reset: () => void) => (
  <div>
    <h1>カスタムエラー画面</h1>
    <p>{error.message}</p>
    <button onClick={reset}>リセット</button>
  </div>
);

describe('ErrorBoundary', () => {
  // console.errorのモック
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('正常動作', () => {
    it('エラーがない場合は子コンポーネントをレンダリングする', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('正常なコンテンツ')).toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    it('エラーが発生した場合、デフォルトのエラー画面を表示する', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('heading', { name: 'エラーが発生しました' })).toBeInTheDocument();
      expect(screen.getByText(/申し訳ございません/)).toBeInTheDocument();
      expect(console.error).toHaveBeenCalled();
    });

    it('エラーメッセージが表示される', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // 詳細を開く
      const detailsElement = screen.getByText('エラーの詳細');
      fireEvent.click(detailsElement);

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('カスタムfallbackが提供された場合、それを使用する', () => {
      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('heading', { name: 'カスタムエラー画面' })).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  describe('リカバリー機能', () => {
    it('「もう一度試す」ボタンをクリックすると、エラー状態がリセットされる', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // エラー画面が表示されている
      expect(screen.getByRole('heading', { name: 'エラーが発生しました' })).toBeInTheDocument();

      // リセットボタンをクリック
      await user.click(screen.getByRole('button', { name: 'もう一度試す' }));

      // エラーを投げないコンポーネントに再レンダリング
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // 正常なコンテンツが表示される
      expect(screen.getByText('正常なコンテンツ')).toBeInTheDocument();
    });

    it('「ページを再読み込み」ボタンをクリックすると、window.location.reloadが呼ばれる', async () => {
      const user = userEvent.setup();
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      await user.click(screen.getByRole('button', { name: 'ページを再読み込み' }));
      expect(mockReload).toHaveBeenCalledTimes(1);
    });

    it('「ホームに戻る」ボタンをクリックすると、ホームページにナビゲートする', async () => {
      const user = userEvent.setup();
      const mockHref = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { 
          set href(value: string) {
            mockHref(value);
          }
        },
        writable: true,
      });

      // import.meta.env.BASE_URLのモック
      vi.stubGlobal('import.meta.env', { BASE_URL: '/' });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      await user.click(screen.getByRole('button', { name: 'ホームに戻る' }));
      expect(mockHref).toHaveBeenCalledWith('/');
    });
  });

  describe('エラー詳細の表示', () => {
    it('エラー詳細は初期状態では閉じている', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const details = screen.getByRole('group');
      expect(details).not.toHaveAttribute('open');
    });

    it('詳細をクリックすると、エラースタックが表示される', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const summary = screen.getByText('エラーの詳細');
      fireEvent.click(summary);

      // エラーメッセージが表示される
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('エラーアイコンが表示される', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // FaExclamationTriangleアイコンが含まれるコンテナを確認
      const iconContainer = screen.getByRole('heading', { name: 'エラーが発生しました' })
        .parentElement?.querySelector('.bg-red-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('すべてのボタンに適切なラベルが設定されている', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: 'もう一度試す' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ページを再読み込み' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ホームに戻る' })).toBeInTheDocument();
    });
  });

  describe('コンポーネントライフサイクル', () => {
    it('componentDidCatchが呼ばれる', () => {
      const spy = vi.spyOn(ErrorBoundary.prototype, 'componentDidCatch');
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('getDerivedStateFromErrorが適切な状態を返す', () => {
      const error = new Error('Test error');
      const state = ErrorBoundary.getDerivedStateFromError(error);

      expect(state).toEqual({
        hasError: true,
        error: error,
        errorInfo: null,
      });
    });
  });
});