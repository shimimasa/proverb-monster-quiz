import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
      {/* 背景のアニメーション星 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-300 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center">
        {/* メインロゴアニメーション */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="mb-8"
        >
          {/* モンスターアイコン */}
          <svg width="120" height="120" viewBox="0 0 64 64" className="mx-auto">
            <defs>
              <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#FDE68A", stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: "#F59E0B", stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            
            <motion.ellipse
              cx="32"
              cy="36"
              rx="18"
              ry="16"
              fill="url(#bgGradient)"
              stroke="#D97706"
              strokeWidth="1.5"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* 目 */}
            <circle cx="26" cy="32" r="5" fill="#FFFFFF" />
            <circle cx="38" cy="32" r="5" fill="#FFFFFF" />
            <motion.circle
              cx="26.5"
              cy="32.5"
              r="3"
              fill="#1F2937"
              animate={{
                x: [-1, 1, -1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.circle
              cx="38.5"
              cy="32.5"
              r="3"
              fill="#1F2937"
              animate={{
                x: [-1, 1, -1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* 口 */}
            <motion.path
              d="M 24 38 Q 32 42 40 38"
              stroke="#1F2937"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              animate={{
                d: ["M 24 38 Q 32 42 40 38", "M 24 38 Q 32 44 40 38", "M 24 38 Q 32 42 40 38"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </svg>
        </motion.div>

        {/* タイトルアニメーション */}
        <motion.h1
          className="text-4xl md:text-5xl font-bold text-white mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          ことだまモンスター
        </motion.h1>
        
        <motion.p
          className="text-xl text-yellow-300 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          クイズ
        </motion.p>

        {/* ローディングバー */}
        <motion.div
          className="w-64 h-2 bg-white/20 rounded-full overflow-hidden mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{
              duration: 2,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* ローディングテキスト */}
        <motion.p
          className="mt-4 text-white/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ゲームを準備中
          </motion.span>
          <motion.span
            className="inline-block ml-1"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          >
            ...
          </motion.span>
        </motion.p>

        {/* ヒントテキスト */}
        <motion.div
          className="mt-8 text-sm text-white/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <p>💡 ヒント: ことわざを覚えてモンスターを集めよう！</p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingScreen;