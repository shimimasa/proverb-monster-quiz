import { Variants } from 'framer-motion';

// ページ遷移アニメーション
export const pageTransitions: Record<string, Variants> = {
  slideLeft: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 }
  },
  slideRight: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 }
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  scale: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.2, opacity: 0 }
  },
  slideUp: {
    initial: { y: 50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -50, opacity: 0 }
  }
};

// ボタンアニメーション
export const buttonVariants: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

// カードアニメーション
export const cardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    rotateX: -15
  },
  visible: { 
    opacity: 1, 
    y: 0,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  },
  hover: {
    y: -5,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

// モンスター出現アニメーション
export const monsterAppearVariants: Variants = {
  hidden: { 
    scale: 0,
    rotate: -180,
    opacity: 0
  },
  visible: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: "spring",
      duration: 0.8,
      bounce: 0.4
    }
  },
  celebrate: {
    scale: [1, 1.2, 1],
    rotate: [0, 10, -10, 0],
    transition: {
      duration: 0.5,
      repeat: 2
    }
  }
};

// 正解アニメーション
export const correctAnswerVariants: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.2, 1],
    backgroundColor: ["#ffffff", "#10b981", "#ffffff"],
    transition: {
      duration: 0.6,
      times: [0, 0.5, 1]
    }
  }
};

// 不正解アニメーション
export const incorrectAnswerVariants: Variants = {
  initial: { x: 0 },
  animate: {
    x: [-10, 10, -10, 10, 0],
    backgroundColor: ["#ffffff", "#ef4444", "#ffffff"],
    transition: {
      duration: 0.5,
      times: [0, 0.2, 0.4, 0.6, 1]
    }
  }
};

// パーティクルアニメーション設定
export const particleVariants: Variants = {
  initial: {
    opacity: 1,
    scale: 0
  },
  animate: (i: number) => ({
    opacity: [1, 1, 0],
    scale: [0, 1, 1],
    x: Math.cos(i * 45 * Math.PI / 180) * 100,
    y: Math.sin(i * 45 * Math.PI / 180) * 100 - 50,
    transition: {
      duration: 1,
      ease: "easeOut"
    }
  })
};

// リップルエフェクト
export const rippleVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0.5
  },
  animate: {
    scale: 4,
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

// スケルトンローディング
export const skeletonVariants: Variants = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 1.5,
      ease: "linear",
      repeat: Infinity
    }
  }
};

// フリップカードアニメーション
export const flipVariants: Variants = {
  front: {
    rotateY: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  back: {
    rotateY: 180,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

// ストリークアニメーション
export const streakVariants: Variants = {
  idle: {
    scale: 1,
    rotate: 0
  },
  active: {
    scale: [1, 1.3, 1.1],
    rotate: [0, -5, 5, 0],
    transition: {
      duration: 0.5,
      times: [0, 0.3, 0.7, 1]
    }
  },
  break: {
    scale: 0.8,
    opacity: 0.5,
    transition: {
      duration: 0.3
    }
  }
};

// レベルアップアニメーション
export const levelUpVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
    rotate: -180
  },
  animate: {
    scale: [0, 1.5, 1],
    opacity: [0, 1, 1],
    rotate: [0, 360, 360],
    transition: {
      duration: 1,
      times: [0, 0.6, 1],
      ease: "easeOut"
    }
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.3
    }
  }
};