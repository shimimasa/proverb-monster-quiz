import React, { useEffect, useRef, useState } from 'react';
import { FaTrophy, FaBook, FaCog, FaChartLine, FaUserShield } from 'react-icons/fa';
import { KeyCodes } from '@/utils/accessibility';
import { useAdmin } from '@contexts/AdminContext';
import { AdminPanel } from '../admin/AdminPanel';

interface FooterProps {
  currentPage: string;
  onNavigate?: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ currentPage, onNavigate }) => {
  const navRef = useRef<HTMLElement>(null);
  const { isAdmin } = useAdmin();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);
  
  const navItems = [
    { id: 'quiz', icon: FaBook, label: 'クイズ' },
    { id: 'collection', icon: FaTrophy, label: 'モンスター' },
    { id: 'ranking', icon: FaTrophy, label: 'ランキング' },
    { id: 'stats', icon: FaChartLine, label: '統計' },
    { id: 'settings', icon: FaCog, label: '設定' },
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
          } else {
            buttons[buttons.length - 1].focus(); // ラップアラウンド
          }
          break;
        case KeyCodes.ARROW_RIGHT:
          e.preventDefault();
          if (currentIndex < buttons.length - 1) {
            buttons[currentIndex + 1].focus();
          } else {
            buttons[0].focus(); // ラップアラウンド
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

  // 管理者パネル表示のための隠しコマンド
  const handleLogoClick = () => {
    setAdminClickCount(prev => prev + 1);
    if (adminClickCount >= 4) {
      setShowAdminPanel(true);
      setAdminClickCount(0);
    }
    // 3秒後にカウントをリセット
    setTimeout(() => setAdminClickCount(0), 3000);
  };

  return (
    <>
      <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200" role="contentinfo">
        <nav 
          ref={navRef}
          className="flex items-center justify-around py-2" 
          role="navigation" 
          aria-label="モバイルナビゲーション"
        >
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onNavigate?.(id)}
              className={`flex flex-col items-center p-2 transition-colors ${
                currentPage === id
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-current={currentPage === id ? 'page' : undefined}
              aria-label={label}
            >
              <Icon className="text-xl mb-1" aria-hidden="true" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
          
          {/* 管理者ボタン（管理者のみ表示） */}
          {isAdmin && (
            <button
              onClick={() => setShowAdminPanel(true)}
              className="flex flex-col items-center p-2 transition-colors text-purple-600 hover:text-purple-700"
              aria-label="管理者パネル"
            >
              <FaUserShield className="text-xl mb-1" aria-hidden="true" />
              <span className="text-xs">管理者</span>
            </button>
          )}
        </nav>
        
        {/* 隠しロゴボタン（管理者パネルアクセス用） */}
        <div className="text-center py-1 border-t border-gray-100">
          <button
            onClick={handleLogoClick}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            © 2024 ことだまモンスタークイズ
          </button>
        </div>
      </footer>

      {/* 管理者パネル */}
      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}
    </>
  );
};