import { useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { KeyCodes, announceToScreenReader } from '@/utils/accessibility';

interface UseGlobalKeyboardShortcutsOptions {
  enabled?: boolean;
  onHelp?: () => void;
}

/**
 * グローバルキーボードショートカットを管理するカスタムフック
 */
export const useGlobalKeyboardShortcuts = (options: UseGlobalKeyboardShortcutsOptions = {}) => {
  const { enabled = true, onHelp } = options;
  const { currentPage, navigateTo } = useGame();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // モーダルやフォーム入力中は無効化
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement) {
        return;
      }

      // Ctrl/Cmd + キーの組み合わせ
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd) {
        switch (e.key) {
          case 'q':
            e.preventDefault();
            navigateTo('quiz');
            announceToScreenReader('クイズ画面に移動しました');
            break;
          case 'm':
            e.preventDefault();
            navigateTo('collection');
            announceToScreenReader('モンスターコレクション画面に移動しました');
            break;
          case 's':
            e.preventDefault();
            navigateTo('stats');
            announceToScreenReader('統計画面に移動しました');
            break;
          case 'r':
            e.preventDefault();
            navigateTo('ranking');
            announceToScreenReader('ランキング画面に移動しました');
            break;
          case ',':
            e.preventDefault();
            navigateTo('settings');
            announceToScreenReader('設定画面に移動しました');
            break;
        }
      }

      // シングルキーショートカット
      switch (e.key) {
        case '?':
          if (e.shiftKey) {
            e.preventDefault();
            onHelp?.();
            announceToScreenReader('ヘルプを開きました');
          }
          break;
        case 'h':
          if (currentPage === 'quiz') {
            e.preventDefault();
            // ヒントを表示（将来実装）
            announceToScreenReader('ヒント機能は現在開発中です');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, currentPage, navigateTo, onHelp]);
};

/**
 * キーボードショートカットのヘルプ情報
 */
export const keyboardShortcuts = [
  { key: 'Ctrl/Cmd + Q', description: 'クイズ画面へ移動' },
  { key: 'Ctrl/Cmd + M', description: 'モンスターコレクションへ移動' },
  { key: 'Ctrl/Cmd + S', description: '統計画面へ移動' },
  { key: 'Ctrl/Cmd + R', description: 'ランキング画面へ移動' },
  { key: 'Ctrl/Cmd + ,', description: '設定画面へ移動' },
  { key: '?', description: 'ヘルプを表示' },
  { key: '1-4', description: 'クイズの選択肢を選択（クイズ画面）' },
  { key: 'Tab', description: '次の要素へフォーカス移動' },
  { key: 'Shift + Tab', description: '前の要素へフォーカス移動' },
  { key: 'Escape', description: 'モーダルやダイアログを閉じる' },
];