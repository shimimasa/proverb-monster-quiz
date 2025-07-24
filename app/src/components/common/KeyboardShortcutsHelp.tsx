import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaKeyboard } from 'react-icons/fa';
import { keyboardShortcuts } from '@/hooks/useGlobalKeyboardShortcuts';
import { trapFocus } from '@/utils/accessibility';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // フォーカス管理
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    // 現在のフォーカスを保存
    previousFocusRef.current = document.activeElement as HTMLElement;

    // フォーカストラップを設定
    const cleanup = trapFocus(modalRef.current);

    // Escapeキーで閉じる
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cleanup();
      document.removeEventListener('keydown', handleKeyDown);
      // フォーカスを元に戻す
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
        >
          {/* 背景オーバーレイ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
          />

          {/* モーダルコンテンツ */}
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            tabIndex={-1}
          >
            {/* ヘッダー */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 id="shortcuts-title" className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <FaKeyboard className="text-blue-500" aria-hidden="true" />
                キーボードショートカット
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="閉じる"
              >
                <FaTimes className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* コンテンツ */}
            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                以下のキーボードショートカットを使用して、より効率的に操作できます。
              </p>

              <div className="space-y-2">
                {keyboardShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <kbd className="px-3 py-1 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  アクセシビリティ機能
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• タブキーでフォーカス移動が可能です</li>
                  <li>• モーダルやダイアログではフォーカスが自動的に管理されます</li>
                  <li>• スクリーンリーダーに対応しています</li>
                  <li>• 高コントラストモードに対応しています</li>
                </ul>
              </div>
            </div>

            {/* フッター */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
              >
                閉じる
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};