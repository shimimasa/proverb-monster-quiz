import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { AdminProvider } from '@/contexts/AdminContext';

// モック関数
const mockOnSuccess = vi.fn();
const mockOnCancel = vi.fn();

// コンポーネントをラップするヘルパー関数
const renderAdminLogin = () => {
  return render(
    <AdminProvider>
      <AdminLogin onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    </AdminProvider>
  );
};

describe('AdminLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('ログインフォームが正しく表示される', () => {
      renderAdminLogin();

      expect(screen.getByRole('heading', { name: '管理者ログイン' })).toBeInTheDocument();
      expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
      expect(screen.getByText('デフォルトパスワード: admin123')).toBeInTheDocument();
    });

    it('パスワード入力フィールドに初期フォーカスが当たる', () => {
      renderAdminLogin();
      
      const passwordInput = screen.getByLabelText('パスワード');
      expect(document.activeElement).toBe(passwordInput);
    });
  });

  describe('パスワード表示/非表示', () => {
    it('パスワードの表示/非表示を切り替えられる', async () => {
      const user = userEvent.setup();
      renderAdminLogin();

      const passwordInput = screen.getByLabelText('パスワード') as HTMLInputElement;
      const toggleButton = screen.getByRole('button', { name: '' }); // アイコンボタン

      // 初期状態はパスワード非表示
      expect(passwordInput.type).toBe('password');

      // クリックで表示に切り替え
      await user.click(toggleButton);
      expect(passwordInput.type).toBe('text');

      // 再度クリックで非表示に戻る
      await user.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });
  });

  describe('ログイン処理', () => {
    it('正しいパスワードでログインに成功する', async () => {
      const user = userEvent.setup();
      renderAdminLogin();

      const passwordInput = screen.getByLabelText('パスワード');
      const loginButton = screen.getByRole('button', { name: 'ログイン' });

      // パスワードを入力
      await user.type(passwordInput, 'admin123');
      
      // ログインボタンをクリック
      await user.click(loginButton);

      // ローディング状態の確認
      expect(screen.getByText('ログイン中...')).toBeInTheDocument();

      // 成功コールバックが呼ばれることを確認
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('間違ったパスワードでエラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      renderAdminLogin();

      const passwordInput = screen.getByLabelText('パスワード');
      const loginButton = screen.getByRole('button', { name: 'ログイン' });

      // 間違ったパスワードを入力
      await user.type(passwordInput, 'wrongpassword');
      await user.click(loginButton);

      // エラーメッセージの表示を確認
      await waitFor(() => {
        expect(screen.getByText('パスワードが正しくありません')).toBeInTheDocument();
      });

      // パスワードフィールドがクリアされることを確認
      expect(passwordInput).toHaveValue('');

      // 成功コールバックが呼ばれないことを確認
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('パスワードが空の場合はログインボタンが無効になる', () => {
      renderAdminLogin();

      const loginButton = screen.getByRole('button', { name: 'ログイン' });
      expect(loginButton).toBeDisabled();
    });

    it('ログイン中はフォームが無効になる', async () => {
      const user = userEvent.setup();
      renderAdminLogin();

      const passwordInput = screen.getByLabelText('パスワード');
      const loginButton = screen.getByRole('button', { name: 'ログイン' });

      await user.type(passwordInput, 'admin123');
      await user.click(loginButton);

      // ローディング中の確認
      expect(passwordInput).toBeDisabled();
      expect(screen.getByText('ログイン中...')).toBeInTheDocument();
    });
  });

  describe('キャンセル処理', () => {
    it('キャンセルボタンをクリックするとonCancelが呼ばれる', async () => {
      const user = userEvent.setup();
      renderAdminLogin();

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('ログイン中はキャンセルボタンが無効にならない', async () => {
      const user = userEvent.setup();
      renderAdminLogin();

      const passwordInput = screen.getByLabelText('パスワード');
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });

      await user.type(passwordInput, 'admin123');
      await user.click(screen.getByRole('button', { name: 'ログイン' }));

      // キャンセルボタンは有効のまま
      expect(cancelButton).not.toBeDisabled();
    });
  });

  describe('フォーム送信', () => {
    it('Enterキーでフォームを送信できる', async () => {
      const user = userEvent.setup();
      renderAdminLogin();

      const passwordInput = screen.getByLabelText('パスワード');
      
      await user.type(passwordInput, 'admin123');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定されている', () => {
      renderAdminLogin();

      const form = screen.getByRole('heading', { name: '管理者ログイン' }).closest('div');
      expect(form).toBeInTheDocument();

      const passwordInput = screen.getByLabelText('パスワード');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('タブ順序が適切に設定されている', async () => {
      const user = userEvent.setup();
      renderAdminLogin();

      // パスワード入力フィールドから開始
      expect(document.activeElement).toBe(screen.getByLabelText('パスワード'));

      // タブでログインボタンへ
      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'ログイン' }));

      // タブでキャンセルボタンへ
      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'キャンセル' }));
    });
  });
});