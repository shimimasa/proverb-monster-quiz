import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Monster } from '@/types';
import { MonsterRenderer } from '@/utils/monsterGeneratorV2';

interface MonsterCardV2Props {
  monster: Monster;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  onClick?: () => void;
  interactive?: boolean;
}

const sizeMap = {
  small: 100,
  medium: 150,
  large: 200
};

export function MonsterCardV2({ 
  monster, 
  size = 'medium', 
  showDetails = true,
  onClick,
  interactive = true 
}: MonsterCardV2Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  const pixelSize = sizeMap[size];
  
  useEffect(() => {
    // 非同期でSVGを生成
    const generateSVG = async () => {
      setIsLoading(true);
      try {
        const svg = MonsterRenderer.render(monster, pixelSize);
        setSvgContent(svg);
      } catch (error) {
        console.error('Failed to generate monster SVG:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    generateSVG();
  }, [monster, pixelSize]);
  
  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-orange-600'
  };
  
  const rarityGlow = {
    common: '',
    rare: 'shadow-blue-500/50',
    epic: 'shadow-purple-500/50',
    legendary: 'shadow-orange-500/50 animate-pulse'
  };
  
  const rarityBorder = {
    common: 'border-gray-300',
    rare: 'border-blue-500',
    epic: 'border-purple-500',
    legendary: 'border-gradient-to-r from-yellow-400 to-orange-600'
  };
  
  return (
    <motion.div
      className={`relative ${interactive ? 'cursor-pointer' : ''}`}
      onHoverStart={() => interactive && setIsHovered(true)}
      onHoverEnd={() => interactive && setIsHovered(false)}
      onClick={onClick}
      whileHover={interactive ? { scale: 1.05 } : {}}
      whileTap={interactive ? { scale: 0.95 } : {}}
    >
      <div className={`
        relative rounded-lg overflow-hidden
        border-2 ${rarityBorder[monster.rarity]}
        ${interactive ? `shadow-lg ${rarityGlow[monster.rarity]}` : ''}
        transition-all duration-300
      `}>
        {/* 背景グラデーション */}
        <div className={`
          absolute inset-0 
          bg-gradient-to-br ${rarityColors[monster.rarity]}
          opacity-20
        `} />
        
        {/* モンスター画像 */}
        <div className="relative p-4 flex items-center justify-center">
          {isLoading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
          ) : (
            <div 
              dangerouslySetInnerHTML={{ __html: svgContent }}
              className="monster-svg-container"
            />
          )}
          
          {/* ホバーエフェクト */}
          <AnimatePresence>
            {isHovered && interactive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/10 backdrop-blur-sm"
              />
            )}
          </AnimatePresence>
        </div>
        
        {/* レアリティインジケーター */}
        {monster.rarity === 'legendary' && (
          <div className="absolute top-2 right-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="text-2xl"
            >
              ⭐
            </motion.div>
          </div>
        )}
        
        {monster.rarity === 'epic' && (
          <div className="absolute top-2 right-2 text-xl">
            💎
          </div>
        )}
      </div>
      
      {/* モンスター情報 */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-center"
        >
          <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
            {monster.name}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {monster.sourceContent.text}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className={`
              text-xs px-2 py-1 rounded-full
              ${monster.rarity === 'common' ? 'bg-gray-200 text-gray-700' : ''}
              ${monster.rarity === 'rare' ? 'bg-blue-200 text-blue-700' : ''}
              ${monster.rarity === 'epic' ? 'bg-purple-200 text-purple-700' : ''}
              ${monster.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-200 to-orange-200 text-orange-700' : ''}
            `}>
              {monster.rarity === 'common' && '普通'}
              {monster.rarity === 'rare' && 'レア'}
              {monster.rarity === 'epic' && 'エピック'}
              {monster.rarity === 'legendary' && 'レジェンダリー'}
            </span>
          </div>
          {monster.dateObtained && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              獲得日: {new Date(monster.dateObtained).toLocaleDateString()}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// モンスター詳細モーダル
export function MonsterDetailModal({ monster, onClose }: { monster: Monster; onClose: () => void }) {
  const [svgContent, setSvgContent] = useState<string>('');
  
  useEffect(() => {
    const svg = MonsterRenderer.render(monster, 300);
    setSvgContent(svg);
  }, [monster]);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {monster.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        
        <div className="flex justify-center mb-6">
          <div 
            dangerouslySetInnerHTML={{ __html: svgContent }}
            className="monster-svg-container-large"
          />
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">出典</h3>
            <p className="text-gray-900 dark:text-gray-100">{monster.sourceContent.text}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {monster.sourceContent.reading}
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">意味</h3>
            <p className="text-gray-900 dark:text-gray-100">{monster.sourceContent.meaning}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">例文</h3>
            <p className="text-gray-900 dark:text-gray-100">{monster.sourceContent.example_sentence}</p>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${monster.rarity === 'common' ? 'bg-gray-200 text-gray-700' : ''}
              ${monster.rarity === 'rare' ? 'bg-blue-200 text-blue-700' : ''}
              ${monster.rarity === 'epic' ? 'bg-purple-200 text-purple-700' : ''}
              ${monster.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-200 to-orange-200 text-orange-700' : ''}
            `}>
              {monster.rarity === 'common' && '普通'}
              {monster.rarity === 'rare' && 'レア'}
              {monster.rarity === 'epic' && 'エピック'}
              {monster.rarity === 'legendary' && 'レジェンダリー'}
            </span>
            
            {monster.dateObtained && (
              <span className="text-sm text-gray-500 dark:text-gray-500">
                獲得日: {new Date(monster.dateObtained).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}