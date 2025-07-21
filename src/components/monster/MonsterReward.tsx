import React from 'react';
import { motion } from 'framer-motion';
import { MonsterImage } from './MonsterImage';
import type { Monster } from '@types/index';
import { FaCoins } from 'react-icons/fa';

interface MonsterRewardProps {
  monster: Monster;
  isNew: boolean;
  reward?: {
    experience: number;
    coins: number;
  };
  onCollect: () => void;
}

export const MonsterReward: React.FC<MonsterRewardProps> = ({ monster, isNew, reward, onCollect }) => {
  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600',
  };

  const rarityLabels = {
    common: 'コモン',
    rare: 'レア',
    epic: 'エピック',
    legendary: 'レジェンダリー',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-lg shadow-lg p-8 text-center"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {isNew ? 'モンスターゲット！' : 'すでに持っているモンスター'}
      </h2>
      
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="relative inline-block"
      >
        <div className="w-32 h-32 mb-4">
          <MonsterImage 
            monster={monster} 
            size={128} 
            className="mx-auto"
            showAnimation={true}
          />
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute -top-2 -right-2"
        >
          <div className="bg-yellow-400 rounded-full p-2">
            <span className="text-2xl">⭐</span>
          </div>
        </motion.div>
      </motion.div>

      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {monster.name}
      </h3>
      
      <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${rarityColors[monster.rarity]} text-white mb-4`}>
        {rarityLabels[monster.rarity]}
      </p>

      <p className="text-gray-600 mb-4">
        「{monster.sourceContent.text}」から生まれたモンスター
      </p>

      {/* Show duplicate reward if applicable */}
      {!isNew && reward && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-100 rounded-lg p-4 mb-4"
        >
          <p className="text-sm text-gray-600 mb-2">代わりに以下の報酬を獲得：</p>
          <div className="flex justify-center items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="text-green-500 font-semibold">+{reward.experience} EXP</span>
            </div>
            <div className="flex items-center space-x-1">
              <FaCoins className="text-yellow-500" />
              <span className="text-yellow-600 font-semibold">+{reward.coins}</span>
            </div>
          </div>
        </motion.div>
      )}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCollect}
        className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-shadow"
      >
        {isNew ? 'コレクションに追加する' : '次の問題へ'}
      </motion.button>
    </motion.div>
  );
};