import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MonsterImage } from './MonsterImage';
import { Particles } from '@components/common/Particles';
import { monsterAppearVariants } from '@/utils/animations';
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
  const [showParticles, setShowParticles] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);

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

  const rarityParticleEmojis = {
    common: '✨',
    rare: '💎',
    epic: '🌟',
    legendary: '👑',
  };

  const handleCollect = () => {
    setIsCollecting(true);
    setTimeout(() => {
      onCollect();
    }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center relative overflow-hidden"
    >
      {/* Background glow effect */}
      {isNew && (
        <motion.div
          className={`absolute inset-0 bg-gradient-to-r ${rarityColors[monster.rarity]} opacity-20`}
          animate={{
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      {/* Particles for new monsters */}
      {isNew && showParticles && (
        <Particles 
          count={monster.rarity === 'legendary' ? 12 : 8} 
          emoji={rarityParticleEmojis[monster.rarity]}
        />
      )}

      <motion.h2 
        className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 relative z-10"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {isNew ? 'モンスターゲット！' : 'すでに持っているモンスター'}
      </motion.h2>
      
      <motion.div
        variants={monsterAppearVariants}
        initial="hidden"
        animate={["visible", isNew ? "celebrate" : ""]}
        className="relative inline-block z-10"
      >
        <div className="w-32 h-32 mb-4">
          <MonsterImage 
            monster={monster} 
            size={128} 
            className="mx-auto"
            showAnimation={true}
          />
        </div>
        {isNew && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              delay: 0.5,
              type: "spring",
              stiffness: 200,
              damping: 10
            }}
            className="absolute -top-2 -right-2"
          >
            <div className="bg-yellow-400 rounded-full p-2 shadow-lg">
              <span className="text-2xl">⭐</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.h3 
        className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {monster.name}
      </motion.h3>
      
      <motion.p 
        className={`inline-block px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${rarityColors[monster.rarity]} text-white mb-4 relative z-10`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.7, type: "spring" }}
      >
        {rarityLabels[monster.rarity]}
      </motion.p>

      <motion.p 
        className="text-gray-600 dark:text-gray-400 mb-4 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        「{monster.sourceContent.text}」から生まれたモンスター
      </motion.p>

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
        onClick={handleCollect}
        disabled={isCollecting}
        className={`px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all relative z-10 ${
          isCollecting ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        {isCollecting ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            ✨
          </motion.span>
        ) : (
          isNew ? 'コレクションに追加する' : '次の問題へ'
        )}
      </motion.button>
    </motion.div>
  );
};