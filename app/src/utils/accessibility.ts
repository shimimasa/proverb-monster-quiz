/**
 * アクセシビリティ関連のユーティリティ関数
 */

/**
 * キーボードナビゲーション用のキーコード
 */
export const KeyCodes = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const;

/**
 * フォーカス可能な要素のセレクター
 */
export const FOCUSABLE_ELEMENTS = 
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * フォーカストラップを実装するヘルパー関数
 */
export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== KeyCodes.TAB) return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);

  // 最初の要素にフォーカス
  firstFocusable?.focus();

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

/**
 * スクリーンリーダー向けのアナウンス
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  
  announcement.textContent = message;
  document.body.appendChild(announcement);

  // アナウンス後に削除
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * モーション設定の確認
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * ハイコントラストモードの確認
 */
export const prefersHighContrast = () => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * カラーコントラスト比の計算
 */
export const calculateContrastRatio = (color1: string, color2: string): number => {
  // 簡易的な実装（実際にはより複雑な計算が必要）
  const getLuminance = (color: string) => {
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length < 3) return 0;
    
    const [r, g, b] = rgb.map(val => {
      const sRGB = parseInt(val) / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * WCAG AA基準（4.5:1）を満たすかチェック
 */
export const meetsWCAGAA = (color1: string, color2: string): boolean => {
  return calculateContrastRatio(color1, color2) >= 4.5;
};

/**
 * WCAG AAA基準（7:1）を満たすかチェック
 */
export const meetsWCAGAAA = (color1: string, color2: string): boolean => {
  return calculateContrastRatio(color1, color2) >= 7;
};