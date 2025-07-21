import { useEffect, useCallback } from 'react';
import { KeyCodes } from '@/utils/accessibility';

interface UseKeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: (e: KeyboardEvent) => void;
  enabled?: boolean;
}

/**
 * キーボードナビゲーション用のカスタムフック
 */
export const useKeyboardNavigation = (options: UseKeyboardNavigationOptions) => {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    switch (e.key) {
      case KeyCodes.ESCAPE:
        onEscape?.();
        break;
      case KeyCodes.ENTER:
        onEnter?.();
        break;
      case KeyCodes.ARROW_UP:
        onArrowUp?.();
        break;
      case KeyCodes.ARROW_DOWN:
        onArrowDown?.();
        break;
      case KeyCodes.ARROW_LEFT:
        onArrowLeft?.();
        break;
      case KeyCodes.ARROW_RIGHT:
        onArrowRight?.();
        break;
      case KeyCodes.TAB:
        onTab?.(e);
        break;
    }
  }, [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
};

/**
 * フォーカス管理用のカスタムフック
 */
export const useFocusManagement = (containerRef: React.RefObject<HTMLElement>) => {
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    const selector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(selector));
  }, [containerRef]);

  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    elements[0]?.focus();
  }, [getFocusableElements]);

  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    elements[elements.length - 1]?.focus();
  }, [getFocusableElements]);

  const focusNext = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = elements.findIndex(el => el === document.activeElement);
    
    if (currentIndex < elements.length - 1) {
      elements[currentIndex + 1].focus();
    } else {
      elements[0]?.focus(); // Loop to beginning
    }
  }, [getFocusableElements]);

  const focusPrevious = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = elements.findIndex(el => el === document.activeElement);
    
    if (currentIndex > 0) {
      elements[currentIndex - 1].focus();
    } else {
      elements[elements.length - 1]?.focus(); // Loop to end
    }
  }, [getFocusableElements]);

  return {
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    getFocusableElements,
  };
};