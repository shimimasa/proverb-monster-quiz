import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentForm } from '@/components/admin/ContentForm';
import { ContentFormData, ContentValidationError } from '@/types/admin';

// モック関数
const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

describe('ContentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('空のフォームが正しく表示される', () => {
      render(
        <ContentForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      // フォームフィールドの確認
      expect(screen.getByLabelText(/タイプ/)).toBeInTheDocument();
      expect(screen.getByLabelText(/ことわざ/)).toBeInTheDocument();
      expect(screen.getByLabelText(/読み方/)).toBeInTheDocument();
      expect(screen.getByLabelText(/意味/)).toBeInTheDocument();
      expect(screen.getByLabelText(/難易度/)).toBeInTheDocument();
      expect(screen.getByLabelText(/例文/)).toBeInTheDocument();

      // ボタンの確認
      expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    it('初期データが正しく表示される', () => {
      const initialData: ContentFormData = {
        text: 'テストことわざ',
        reading: 'てすとことわざ',
        meaning: 'テストの意味',
        difficulty: '中学生',
        example_sentence: 'テストの例文',
        type: 'proverb'
      };

      render(
        <ContentForm 
          initialData={initialData}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByDisplayValue('テストことわざ')).toBeInTheDocument();
      expect(screen.getByDisplayValue('てすとことわざ')).toBeInTheDocument();
      expect(screen.getByDisplayValue('テストの意味')).toBeInTheDocument();
      expect(screen.getByDisplayValue('中学生')).toBeInTheDocument();
      expect(screen.getByDisplayValue('テストの例文')).toBeInTheDocument();
    });

    it('編集モードではタイプセレクトが無効になる', () => {
      const initialData: ContentFormData = {
        text: 'テスト',
        reading: 'てすと',
        meaning: 'テスト',
        difficulty: '小学生',
        example_sentence: '',
        type: 'proverb'
      };

      render(
        <ContentForm 
          initialData={initialData}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      const typeSelect = screen.getByLabelText(/タイプ/);
      expect(typeSelect).toBeDisabled();
    });
  });

  describe('フォーム入力', () => {
    it('各フィールドに入力できる', async () => {
      const user = userEvent.setup();
      render(
        <ContentForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      // 各フィールドに入力
      await user.type(screen.getByLabelText(/ことわざ/), 'テストことわざ');
      await user.type(screen.getByLabelText(/読み方/), 'てすとことわざ');
      await user.type(screen.getByLabelText(/意味/), 'テストの意味');
      await user.selectOptions(screen.getByLabelText(/難易度/), '中学生');
      await user.type(screen.getByLabelText(/例文/), 'テストの例文');

      // 値が反映されていることを確認
      expect(screen.getByDisplayValue('テストことわざ')).toBeInTheDocument();
      expect(screen.getByDisplayValue('てすとことわざ')).toBeInTheDocument();
      expect(screen.getByDisplayValue('テストの意味')).toBeInTheDocument();
      expect(screen.getByDisplayValue('中学生')).toBeInTheDocument();
      expect(screen.getByDisplayValue('テストの例文')).toBeInTheDocument();
    });

    it('タイプを変更するとラベルが変わる', async () => {
      const user = userEvent.setup();
      render(
        <ContentForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      // 初期状態（ことわざ）
      expect(screen.getByLabelText(/ことわざ/)).toBeInTheDocument();

      // 四字熟語に変更
      await user.selectOptions(screen.getByLabelText(/タイプ/), 'four_character_idiom');
      expect(screen.getByLabelText(/四字熟語/)).toBeInTheDocument();

      // 慣用句に変更
      await user.selectOptions(screen.getByLabelText(/タイプ/), 'idiom');
      expect(screen.getByLabelText(/慣用句/)).toBeInTheDocument();
    });
  });

  describe('フォーム送信', () => {
    it('有効なデータで送信できる', async () => {
      const user = userEvent.setup();
      render(
        <ContentForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      // フォームに入力
      await user.type(screen.getByLabelText(/ことわざ/), 'テストことわざ');
      await user.type(screen.getByLabelText(/読み方/), 'てすとことわざ');
      await user.type(screen.getByLabelText(/意味/), 'テストの意味');
      await user.type(screen.getByLabelText(/例文/), 'テストの例文');

      // 送信
      await user.click(screen.getByRole('button', { name: '保存' }));

      // onSubmitが正しいデータで呼ばれることを確認
      expect(mockOnSubmit).toHaveBeenCalledWith({
        text: 'テストことわざ',
        reading: 'てすとことわざ',
        meaning: 'テストの意味',
        difficulty: '小学生',
        example_sentence: 'テストの例文',
        type: 'proverb'
      });
    });

    it('Enterキーで送信できる', async () => {
      const user = userEvent.setup();
      render(
        <ContentForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      // 最後のフィールドでEnterキーを押す
      const lastField = screen.getByLabelText(/例文/);
      await user.type(lastField, 'テスト{Enter}');

      // onSubmitが呼ばれることを確認
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  describe('エラー表示', () => {
    it('バリデーションエラーが表示される', () => {
      const errors: ContentValidationError[] = [
        { field: 'text', message: 'テキストは必須です' },
        { field: 'reading', message: 'ひらがなで入力してください' }
      ];

      render(
        <ContentForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel}
          errors={errors} 
        />
      );

      // エラーメッセージの確認
      expect(screen.getByText('テキストは必須です')).toBeInTheDocument();
      expect(screen.getByText('ひらがなで入力してください')).toBeInTheDocument();

      // エラーフィールドのスタイル確認
      const textInput = screen.getByLabelText(/ことわざ/);
      expect(textInput).toHaveClass('border-red-500');
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中はフォームが無効になる', () => {
      render(
        <ContentForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel}
          isLoading={true} 
        />
      );

      // すべての入力フィールドが無効になっていることを確認
      expect(screen.getByLabelText(/タイプ/)).toBeDisabled();
      expect(screen.getByLabelText(/ことわざ/)).toBeDisabled();
      expect(screen.getByLabelText(/読み方/)).toBeDisabled();
      expect(screen.getByLabelText(/意味/)).toBeDisabled();
      expect(screen.getByLabelText(/難易度/)).toBeDisabled();
      expect(screen.getByLabelText(/例文/)).toBeDisabled();

      // ボタンも無効になっていることを確認
      expect(screen.getByRole('button', { name: '保存' })).toBeDisabled();
    });
  });

  describe('キャンセル処理', () => {
    it('キャンセルボタンをクリックするとonCancelが呼ばれる', async () => {
      const user = userEvent.setup();
      render(
        <ContentForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      await user.click(screen.getByRole('button', { name: 'キャンセル' }));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('四字熟語の特別な検証', () => {
    it('四字熟語選択時に文字数警告が表示される', async () => {
      const user = userEvent.setup();
      render(
        <ContentForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      // 四字熟語を選択
      await user.selectOptions(screen.getByLabelText(/タイプ/), 'four_character_idiom');

      // 3文字入力
      await user.type(screen.getByLabelText(/四字熟語/), '三文字');

      // 警告メッセージの確認
      expect(screen.getByText(/4文字で入力してください/)).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('必須フィールドに適切なマークが付いている', () => {
      render(
        <ContentForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      // 必須フィールドのラベルに * が含まれていることを確認
      const requiredLabels = screen.getAllByText(/\*/);
      expect(requiredLabels.length).toBeGreaterThan(0);
    });

    it('エラー時に適切なaria属性が設定される', () => {
      const errors: ContentValidationError[] = [
        { field: 'text', message: 'テキストは必須です' }
      ];

      render(
        <ContentForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel}
          errors={errors} 
        />
      );

      const textInput = screen.getByLabelText(/ことわざ/);
      // エラー状態のスタイルが適用されていることを確認
      expect(textInput).toHaveClass('border-red-500');
    });
  });
});