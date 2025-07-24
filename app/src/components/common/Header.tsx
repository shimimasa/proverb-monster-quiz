import React, { useEffect, useRef } from 'react';
import { FaTrophy, FaBook, FaCog, FaStar, FaChartLine } from 'react-icons/fa';
import { useGame } from '@/contexts/GameContext';
import { KeyCodes, trapFocus } from '@/utils/accessibility';

interface HeaderProps {
  currentPage: string;
  onNavigate?: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const { progressManager } = useGame();
  const progress = progressManager.getProgress();
  const navRef = useRef<HTMLElement>(null);
  const navItems = [
    { id: 'quiz', icon: FaBook, label: 'クイズ' },
    { id: 'collection', icon: FaTrophy, label: 'コレクション' },
    { id: 'ranking', icon: FaTrophy, label: 'ランキング' },
    { id: 'stats', icon: FaChartLine, label: '統計' },
    { id: 'analytics', icon: FaChartLine, label: '分析' },
    { id: 'settings', icon: FaCog, label: '設定' },
    ...(import.meta.env.DEV ? [
      { id: 'monster-test', icon: FaStar, label: 'モンスターV2' },
      { id: 'tutorial-test', icon: FaBook, label: 'チュートリアル' },
      { id: 'audio-test', icon: FaStar, label: '音声システム' }
    ] : [])
  ];

  // キーボードナビゲーション
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!navRef.current) return;

      const buttons = navRef.current.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
      const currentIndex = Array.from(buttons).findIndex(btn => btn === document.activeElement);

      switch (e.key) {
        case KeyCodes.ARROW_LEFT:
          e.preventDefault();
          if (currentIndex > 0) {
            buttons[currentIndex - 1].focus();
          }
          break;
        case KeyCodes.ARROW_RIGHT:
          e.preventDefault();
          if (currentIndex < buttons.length - 1) {
            buttons[currentIndex + 1].focus();
          }
          break;
        case KeyCodes.HOME:
          e.preventDefault();
          buttons[0]?.focus();
          break;
        case KeyCodes.END:
          e.preventDefault();
          buttons[buttons.length - 1]?.focus();
          break;
      }
    };

    navRef.current?.addEventListener('keydown', handleKeyDown);
    return () => navRef.current?.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <header className="app-header bg-white shadow-md" role="banner">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-3xl" aria-hidden="true">📚</div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              ことだまモンスター
            </h1>
          </div>
          
          {/* User stats */}
          <div className="hidden md:flex items-center space-x-4 text-sm" role="region" aria-label="ユーザー統計">
            <div className="flex items-center space-x-1">
              <FaStar className="text-yellow-500" aria-hidden="true" />
              <span className="font-medium">Lv.{progress.level}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FaChartLine className="text-green-500" aria-hidden="true" />
              <span className="font-medium">{progress.totalCorrect}問正解</span>
            </div>
          </div>
          
          {/* Navigation - Desktop */}
          <nav 
            ref={navRef}
            className="hidden md:flex items-center space-x-6" 
            role="navigation" 
            aria-label="メインナビゲーション"
          >
            {navItems.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => onNavigate?.(id)}
                className={`flex items-center space-x-2 transition-colors ${
                  currentPage === id 
                    ? 'text-blue-600 font-medium' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
                aria-current={currentPage === id ? 'page' : undefined}
                aria-label={label}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};