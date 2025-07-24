import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLock, FaStar, FaCalendar } from 'react-icons/fa';
import { MonsterImage } from './MonsterImage';
import type { Monster } from '@types/index';

interface MonsterCardProps {
  monster: Monster;
  highlighted?: boolean;
}

export const MonsterCard: React.FC<MonsterCardProps> = ({ monster, highlighted = false }) => {
  const [showDetails, setShowDetails] = useState(false);

  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600',
  };

  const rarityBorders = {
    common: 'border-gray-300',
    rare: 'border-blue-400',
    epic: 'border-purple-400',
    legendary: 'border-yellow-400',
  };

  const rarityGlows = {
    common: '',
    rare: 'shadow-blue-300',
    epic: 'shadow-purple-300',
    legendary: 'shadow-yellow-300 shadow-lg',
  };

  const rarityLabels = {
    common: 'コモン',
    rare: 'レア',
    epic: 'エピック',
    legendary: 'レジェンダリー',
  };

  const contentTypeLabels = {
    proverb: 'ことわざ',
    idiom: '慣用句',
    four_character_idiom: '四字熟語',
  };

  if (!monster.unlocked) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-gray-100 rounded-lg p-4 text-center border-2 border-gray-300 relative overflow-hidden"
        role="article"
        aria-label="未発見のモンスター"
      >
        <div className="absolute top-2 right-2">
          <FaLock className="text-gray-400 text-sm" />
        </div>
        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-300 rounded-full mx-auto mb-3 flex items-center justify-center">
          <span className="text-2xl md:text-3xl text-gray-500">?</span>
        </div>
        <p className="text-xs md:text-sm text-gray-500 font-medium">未発見</p>
        <div className={`h-1 w-full bg-gradient-to-r ${rarityColors[monster.rarity]} opacity-30 mt-2 -mx-4 px-4`} />
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDetails(true)}
        className={`bg-white dark:bg-gray-800 rounded-lg p-4 text-center cursor-pointer shadow-md hover:shadow-lg transition-all border-2 relative overflow-hidden ${
          highlighted ? 'ring-2 ring-primary ring-offset-2' : ''
        } ${
          rarityBorders[monster.rarity]
        } ${rarityGlows[monster.rarity]}`}
        role="button"
        aria-label={`${monster.name}、${rarityLabels[monster.rarity]}、${contentTypeLabels[monster.sourceContent.type]}モンスター。クリックで詳細を表示`}
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowDetails(true);
          }
        }}
      >
        {/* Rarity indicator */}
        {monster.rarity === 'legendary' && (
          <div className="absolute top-2 right-2">
            <FaStar className="text-yellow-500 text-sm animate-pulse" />
          </div>
        )}
        
        <div className="mx-auto mb-3">
          <MonsterImage 
            monster={monster} 
            size={80} 
            className="mx-auto"
            showAnimation={true}
          />
        </div>
        
        <h3 className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200 truncate px-1">
          {monster.name}
        </h3>
        
        {/* Content type indicator */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {contentTypeLabels[monster.sourceContent.type]}
        </div>
        
        {/* Highlight indicator */}
        {highlighted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0 left-0 w-2 h-2 bg-primary rounded-full"
          />
        )}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetails(false)}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="monster-detail-title"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl"
            >
              {/* Monster Image */}
              <div className="relative">
                <div className="w-32 h-32 mx-auto mb-4">
                  <MonsterImage 
                    monster={monster} 
                    size={128} 
                    className="mx-auto"
                    showAnimation={false}
                  />
                </div>
                {monster.rarity === 'legendary' && (
                  <motion.div
                    className="absolute top-0 right-1/2 transform translate-x-16"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <FaStar className="text-yellow-500 text-2xl" />
                  </motion.div>
                )}
              </div>
              
              {/* Monster Name */}
              <h2 id="monster-detail-title" className="text-xl font-bold text-gray-800 text-center mb-3">
                {monster.name}
              </h2>
              
              {/* Rarity and Type Badges */}
              <div className="flex justify-center items-center space-x-2 mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${
                  rarityColors[monster.rarity]
                } text-white`}>
                  {rarityLabels[monster.rarity]}
                </span>
                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700">
                  {contentTypeLabels[monster.sourceContent.type]}
                </span>
              </div>
              
              {/* Source Content */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2 font-medium">元となった{contentTypeLabels[monster.sourceContent.type]}:</p>
                <p className="font-bold text-gray-800 text-lg">
                  {monster.sourceContent.text}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {monster.sourceContent.reading}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {monster.sourceContent.meaning}
                  </p>
                </div>
                {monster.sourceContent.example_sentence && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">例文:</p>
                    <p className="text-sm text-gray-700 italic">
                      {monster.sourceContent.example_sentence}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Additional Info */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center">
                  <FaCalendar className="mr-1" />
                  獲得日: {monster.dateObtained ? new Date(monster.dateObtained).toLocaleDateString('ja-JP') : '不明'}
                </span>
                <span className="text-gray-400">
                  {monster.sourceContent.difficulty}
                </span>
              </div>
              
              {/* Close Button */}
              <button
                onClick={() => setShowDetails(false)}
                className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all font-medium"
                aria-label="モンスター詳細を閉じる"
              >
                閉じる
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};