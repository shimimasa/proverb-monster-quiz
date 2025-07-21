import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaTrophy, FaGem, FaLevelUpAlt } from 'react-icons/fa';

interface LevelUpResult {
  previousLevel: number;
  newLevel: number;
  experienceGained: number;
  totalExperience: number;
}

interface LevelUpNotificationProps {
  levelUpResult: LevelUpResult | null;
  onClose: () => void;
}

// パーティクルのタイプ
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

export const LevelUpNotification: React.FC<LevelUpNotificationProps> = ({ 
  levelUpResult, 
  onClose 
}) => {
  const [displayLevel, setDisplayLevel] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);

  // レベル数字のカウントアップアニメーション
  useEffect(() => {
    if (!levelUpResult) return;

    const startLevel = levelUpResult.previousLevel;
    const endLevel = levelUpResult.newLevel;
    const duration = 1000; // 1秒でカウントアップ
    const steps = 20;
    const increment = (endLevel - startLevel) / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayLevel(endLevel);
        clearInterval(timer);
      } else {
        setDisplayLevel(Math.floor(startLevel + increment * currentStep));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [levelUpResult]);

  // パーティクルエフェクトの生成
  useEffect(() => {
    if (!levelUpResult) return;

    const newParticles: Particle[] = [];
    const colors = ['#FFD700', '#FFA500', '#FF69B4', '#00CED1', '#9370DB'];
    
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 20 + 10,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    setParticles(newParticles);
  }, [levelUpResult]);

  // 自動クローズタイマー
  useEffect(() => {
    if (!levelUpResult) return;

    const timer = setTimeout(() => {
      onClose();
    }, 5000); // 5秒後に自動的に閉じる

    setAutoCloseTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [levelUpResult, onClose]);

  const handleClick = () => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
    }
    onClose();
  };

  if (!levelUpResult) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={handleClick}
      >
        {/* 背景のオーバーレイ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black"
        />

        {/* パーティクルエフェクト */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                left: `${particle.x}%`,
                top: `${particle.y}%`,
              }}
              animate={{
                x: particle.vx * 500,
                y: particle.vy * 500,
                opacity: [1, 0],
              }}
              transition={{
                duration: 3,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        {/* メインコンテンツ */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 text-white max-w-md w-full mx-4 shadow-2xl"
        >
          {/* 上部の装飾 */}
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="bg-yellow-400 rounded-full p-3"
            >
              <FaStar className="text-3xl text-white" />
            </motion.div>
          </div>

          {/* レベルアップテキスト */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-6"
          >
            <h2 className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
              <FaLevelUpAlt className="text-yellow-300" />
              LEVEL UP!
            </h2>
            <div className="text-6xl font-bold">
              <motion.span
                key={displayLevel}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {displayLevel || levelUpResult.newLevel}
              </motion.span>
            </div>
          </motion.div>

          {/* 獲得情報 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-3 mb-6"
          >
            <div className="flex items-center justify-between bg-white/20 rounded-lg p-3">
              <span className="flex items-center gap-2">
                <FaTrophy className="text-yellow-300" />
                獲得経験値
              </span>
              <span className="font-bold text-xl">+{levelUpResult.experienceGained} EXP</span>
            </div>
            
            <div className="flex items-center justify-between bg-white/20 rounded-lg p-3">
              <span className="flex items-center gap-2">
                <FaGem className="text-cyan-300" />
                累計経験値
              </span>
              <span className="font-bold text-xl">{levelUpResult.totalExperience} EXP</span>
            </div>
          </motion.div>

          {/* 新機能解放のお知らせ（レベルに応じて表示） */}
          {levelUpResult.newLevel % 5 === 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center text-sm bg-yellow-400/30 rounded-lg p-3"
            >
              🎉 新しい実績が解放されました！
            </motion.div>
          )}

          {/* クリックで閉じる案内 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-xs mt-4 text-white/60"
          >
            クリックして続ける
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};