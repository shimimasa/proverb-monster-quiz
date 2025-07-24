import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { AdminProvider } from '@/contexts/AdminContext';
import { GameProvider } from '@/contexts/GameContext';
import { ContentFormData } from '@/types/admin';

// モック関数
const mockOnClose = vi.fn();

// モックデータ
const mockContent = {
  id: 1,
  text: 'テストことわざ',
  reading: 'てすとことわざ',
  meaning: 'テストの意味',
  difficulty: '小学生' as const,
  example_sentence: 'テストの例文',
  type: 'proverb' as const,
};

// コンポーネントをラップするヘルパー関数
const renderAdminPanel = (isAdmin = false) => {
  // AdminContextのモック値を設定
  const mockAdminValue = {
    isAdmin,
    login: vi.fn((password: string) => password === 'admin123'),
    logout: vi.fn(),
    adminManager: {
      getAllCustomContent: vi.fn(() => []),
      addContent: vi.fn(() => ({ success: true })),
      updateContent: vi.fn(() => ({ success: true })),
      deleteContent: vi.fn(() => true),
      exportToCSV: vi.fn(() => 'csv data'),
    },
  };

  return render(
    <GameProvider>
      <AdminProvider value={mockAdminValue}>
        <AdminPanel onClose={mockOnClose} />
      </AdminProvider>
    </GameProvider>
  );
};

describe('AdminPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('認証状態による表示', () => {
    it('未認証の場合はログイン画面が表示される', () => {
      renderAdminPanel(false);
      
      expect(screen.getByRole('heading', { name: '管理者ログイン' })).toBeInTheDocument();
    });

    it('認証済みの場合は管理画面が表示される', () => {
      renderAdminPanel(true);
      
      expect(screen.getByRole('heading', { name: '管理者パネル' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: '管理者ログイン' })).not.toBeInTheDocument();
    });
  });

  describe('タブ切り替え', () => {
    it('各タブをクリックして切り替えられる', async () => {
      const user = userEvent.setup();
      renderAdminPanel(true);

      // デフォルトは一覧タブ
      expect(screen.getByRole('tab', { name: '一覧' })).toHaveAttribute('aria-selected', 'true');

      // 追加タブをクリック
      await user.click(screen.getByRole('tab', { name: '追加' }));
      expect(screen.getByRole('tab', { name: '追加' })).toHaveAttribute('aria-selected', 'true');

      // インポート/エクスポートタブをクリック
      await user.click(screen.getByRole('tab', { name: 'インポート/エクスポート' }));
      expect(screen.getByRole('tab', { name: 'インポート/エクスポート' })).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('コンテンツ操作', () => {
    it('新規コンテンツを追加できる', async () => {
      const user = userEvent.setup();
      const { container } = renderAdminPanel(true);

      // 追加タブに切り替え
      await user.click(screen.getByRole('tab', { name: '追加' }));

      // フォームに入力
      await user.type(screen.getByLabelText('テキスト'), 'テストことわざ');
      await user.type(screen.getByLabelText('読み方'), 'てすとことわざ');
      await user.type(screen.getByLabelText('意味'), 'テストの意味');
      await user.selectOptions(screen.getByLabelText('難易度'), '小学生');
      await user.type(screen.getByLabelText('例文'), 'テストの例文');

      // 送信
      await user.click(screen.getByRole('button', { name: '追加' }));

      // 一覧タブに戻ることを確認
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: '一覧' })).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('編集モードに切り替えられる', async () => {
      const user = userEvent.setup();
      renderAdminPanel(true);

      // コンテンツが表示されるまで待つ
      await waitFor(() => {
        expect(screen.getByText('コンテンツ一覧')).toBeInTheDocument();
      });

      // TODO: ContentListコンポーネントのモック化が必要
      // 編集ボタンをクリック
      // const editButton = screen.getByRole('button', { name: /編集/ });
      // await user.click(editButton);
    });
  });

  describe('ログアウト処理', () => {
    it('ログアウトボタンをクリックするとログアウトして閉じる', async () => {
      const user = userEvent.setup();
      const mockLogout = vi.fn();
      
      // カスタムモックを使用
      vi.mock('@/contexts/AdminContext', () => ({
        useAdmin: () => ({
          isAdmin: true,
          logout: mockLogout,
          adminManager: {
            getAllCustomContent: vi.fn(() => []),
          },
        }),
      }));

      renderAdminPanel(true);

      const logoutButton = screen.getByRole('button', { name: 'ログアウト' });
      await user.click(logoutButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('閉じるボタン', () => {
    it('閉じるボタンをクリックするとonCloseが呼ばれる', async () => {
      const user = userEvent.setup();
      renderAdminPanel(true);

      const closeButton = screen.getByRole('button', { name: '閉じる' });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('エラーハンドリング', () => {
    it('コンテンツ追加でエラーが発生した場合、エラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      
      // エラーを返すモックを設定
      const mockAdminValue = {
        isAdmin: true,
        login: vi.fn(),
        logout: vi.fn(),
        adminManager: {
          getAllCustomContent: vi.fn(() => []),
          addContent: vi.fn(() => ({ 
            success: false, 
            errors: [{ path: ['text'], message: 'テキストは必須です' }] 
          })),
          updateContent: vi.fn(),
          deleteContent: vi.fn(),
          exportToCSV: vi.fn(),
        },
      };

      render(
        <GameProvider>
          <AdminProvider value={mockAdminValue}>
            <AdminPanel onClose={mockOnClose} />
          </AdminProvider>
        </GameProvider>
      );

      // 追加タブに切り替え
      await user.click(screen.getByRole('tab', { name: '追加' }));

      // 不完全なフォームを送信
      await user.click(screen.getByRole('button', { name: '追加' }));

      // エラーメッセージの表示を確認
      await waitFor(() => {
        expect(screen.getByText(/テキストは必須です/)).toBeInTheDocument();
      });
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定されている', () => {
      renderAdminPanel(true);

      // タブリストの確認
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();

      // 各タブの確認
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
      });
    });

    it('モーダルとして適切な属性が設定されている', () => {
      renderAdminPanel(true);

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');
    });
  });
});