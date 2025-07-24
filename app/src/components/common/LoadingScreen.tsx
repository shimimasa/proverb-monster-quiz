import React from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
  progress?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'ことだまモンスターを召喚中...', 
  progress 
}) => {
  const [showInitialAnimation, setShowInitialAnimation] = React.useState(true);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowInitialAnimation(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // 初回起動時のカスタムローディング画面
  if (showInitialAnimation) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center z-50">
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
                duration: 2.5,
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
  }

  // 通常のローディング画面
  const monsterVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: [0.8, 1.1, 1],
      opacity: 1,
      transition: {
        duration: 1,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut"
      }
    }
  };

  const textVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: [0, 1, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const dotsVariants = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const dotVariants = {
    initial: { y: 0 },
    animate: {
      y: [-10, 0],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center z-50">
      <div className="text-center">
        {/* モンスターアイコン */}
        <motion.div
          variants={monsterVariants}
          initial="initial"
          animate="animate"
          className="mb-8"
        >
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-6xl">👾</span>
          </div>
        </motion.div>

        {/* ローディングメッセージ */}
        <motion.h2
          variants={textVariants}
          initial="initial"
          animate="animate"
          className="text-2xl font-bold text-gray-800 mb-4"
        >
          {message}
        </motion.h2>

        {/* プログレスバー（オプション） */}
        {progress !== undefined && (
          <div className="w-64 mx-auto mb-6">
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">{Math.round(progress)}%</p>
          </div>
        )}

        {/* アニメーションドット */}
        <motion.div
          variants={dotsVariants}
          animate="animate"
          className="flex justify-center space-x-2"
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              variants={dotVariants}
              className="w-3 h-3 bg-purple-500 rounded-full"
            />
          ))}
        </motion.div>

        {/* ヒントテキスト */}
        <div className="mt-8 max-w-md mx-auto">
          <p className="text-sm text-gray-600 italic">
            💡 ヒント: ことわざの意味を理解すると、モンスターとの絆が深まります！
          </p>
        </div>
      </div>
    </div>
  );
};

// シンプルなスピナーローディング
export const SimpleLoading: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({ 
  size = 'medium' 
}) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-purple-200 border-t-purple-600`} />
    </div>
  );
};

// インラインローディング（ボタン内など）
export const InlineLoading: React.FC<{ text?: string }> = ({ text = '処理中' }) => {
  return (
    <span className="inline-flex items-center">
      <svg
        className="animate-spin -ml-1 mr-2 h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text}...
    </span>
  );
};