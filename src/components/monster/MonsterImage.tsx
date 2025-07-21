import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { generateMonsterSVG } from '@/utils/monsterGenerator';
import type { Monster } from '@types/index';

interface MonsterImageProps {
  monster: Monster;
  size?: number;
  className?: string;
  showAnimation?: boolean;
  lazy?: boolean;
}

export const MonsterImage: React.FC<MonsterImageProps> = ({ 
  monster, 
  size = 80, 
  className = '',
  showAnimation = true,
  lazy = true
}) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(!lazy);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lazy) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy]);

  useEffect(() => {
    if (!isVisible) return;
    
    // SVGを生成
    try {
      const svg = generateMonsterSVG(monster, size);
      setSvgContent(svg);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to generate monster SVG:', error);
      setIsLoading(false);
    }
  }, [monster, size, isVisible]);

  if (!isVisible || isLoading) {
    return (
      <div 
        ref={containerRef}
        className={`flex items-center justify-center ${className}`} 
        style={{ width: size, height: size }}
      >
        <div className="animate-pulse bg-gray-300 rounded-full" style={{ width: size * 0.8, height: size * 0.8 }} />
      </div>
    );
  }

  if (!svgContent) {
    // フォールバック表示
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <span className="text-4xl">🐲</span>
      </div>
    );
  }

  const animationVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    },
    hover: {
      scale: 1.1,
      rotate: [0, -5, 5, -5, 0],
      transition: {
        rotate: {
          duration: 0.5,
          ease: "easeInOut"
        }
      }
    },
    tap: {
      scale: 0.9
    }
  };

  return (
    <motion.div
      className={`inline-block ${className}`}
      variants={showAnimation ? animationVariants : {}}
      initial={showAnimation ? "initial" : false}
      animate={showAnimation ? "animate" : false}
      whileHover={showAnimation ? "hover" : {}}
      whileTap={showAnimation ? "tap" : {}}
      dangerouslySetInnerHTML={{ __html: svgContent }}
      style={{ width: size, height: size }}
    />
  );
};