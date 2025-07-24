import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFire } from 'react-icons/fa';
import { ComboState, ComboBonus } from '../../types';

interface ComboDisplayProps {
  comboState: ComboState;
  comboBonus: ComboBonus;
  showBreakAnimation?: boolean;
}

export const ComboDisplay: React.FC<ComboDisplayProps> = ({
  comboState,
  comboBonus,
  showBreakAnimation = false
}) => {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (comboBonus.message) {
      setShowMessage(true);
      const timer = setTimeout(() => setShowMessage(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [comboBonus.message, comboState.currentCombo]);

  if (comboState.currentCombo === 0 && !showBreakAnimation) {
    return null;
  }

  const getFireCount = () => {
    if (comboBonus.effectType === 'super_fire') return 3;
    if (comboBonus.effectType === 'fire') return 2;
    return 1;
  };

  return (
    <div className="fixed top-20 right-4 z-40">
      <AnimatePresence>
        {comboState.currentCombo > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative"
          >
            {/* コンボカウンター */}
            <div className={`
              bg-gradient-to-r rounded-lg shadow-lg p-4 min-w-[150px] text-center
              ${comboBonus.effectType === 'super_fire' 
                ? 'from-red-500 to-orange-500' 
                : comboBonus.effectType === 'fire' 
                ? 'from-orange-400 to-yellow-500'
                : 'from-blue-400 to-purple-500'
              }
            `}>
              <motion.div
                key={comboState.currentCombo}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-white"
              >
                <div className="text-sm font-bold opacity-90">COMBO</div>
                <div className="text-4xl font-bold">{comboState.currentCombo}</div>
                
                {/* 倍率表示 */}
                {comboBonus.experienceMultiplier > 1 && (
                  <div className="text-sm mt-1">
                    EXP x{comboBonus.experienceMultiplier}
                  </div>
                )}
              </motion.div>
            </div>

            {/* 炎エフェクト */}
            {comboState.isOnFire && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                {[...Array(getFireCount())].map((_, i) => (
                  <motion.div
                    key={i}
                    data-testid="fire-icon"
                    initial={{ y: 0 }}
                    animate={{ y: [-5, -10, -5] }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: 'easeInOut'
                    }}
                  >
                    <FaFire 
                      className={`
                        ${comboBonus.effectType === 'super_fire' 
                          ? 'text-red-500' 
                          : 'text-orange-500'
                        }
                      `}
                      size={20 + i * 2}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* パーティクルエフェクト */}
            {comboState.currentCombo % 5 === 0 && comboState.currentCombo > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-300 rounded-full"
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{
                      x: Math.cos((i / 6) * Math.PI * 2) * 50,
                      y: Math.sin((i / 6) * Math.PI * 2) * 50,
                      opacity: 0
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* コンボメッセージ */}
        <AnimatePresence>
          {showMessage && comboBonus.message && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
            >
              <div className={`
                px-4 py-2 rounded-full font-bold text-white shadow-lg
                ${comboBonus.effectType === 'super_fire'
                  ? 'bg-gradient-to-r from-red-500 to-pink-500'
                  : comboBonus.effectType === 'fire'
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }
              `}>
                {comboBonus.message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* コンボブレイクアニメーション */}
        {showBreakAnimation && (
          <motion.div
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="text-red-500 font-bold text-xl">
              COMBO BREAK
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* タイムゲージ（30秒） */}
      {comboState.currentCombo > 0 && comboState.lastCorrectTime && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 to-blue-400"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 30, ease: 'linear' }}
          />
        </motion.div>
      )}
    </div>
  );
};