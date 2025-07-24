import React from 'react';
import { motion } from 'framer-motion';
import { skeletonVariants } from '@/utils/animations';

interface SkeletonLoaderProps {
  width?: string;
  height?: string;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = '20px',
  className = '',
  variant = 'text',
  count = 1
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700 overflow-hidden relative';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const renderSkeleton = () => (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        variants={skeletonVariants}
        animate="animate"
      />
    </div>
  );

  if (count === 1) {
    return renderSkeleton();
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </div>
  );
};

// Preset skeleton components
export const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
    <SkeletonLoader width="60%" height="24px" />
    <SkeletonLoader count={3} />
    <div className="flex space-x-4">
      <SkeletonLoader width="100px" height="36px" variant="rectangular" />
      <SkeletonLoader width="100px" height="36px" variant="rectangular" />
    </div>
  </div>
);

export const SkeletonMonsterCard: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
    <SkeletonLoader width="100%" height="150px" variant="rectangular" className="mb-3" />
    <SkeletonLoader width="80%" height="20px" className="mb-2" />
    <SkeletonLoader width="60%" height="16px" />
  </div>
);

export const SkeletonQuizQuestion: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <SkeletonLoader width="40%" height="20px" className="mb-4" />
      <SkeletonLoader count={2} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
          <SkeletonLoader />
        </div>
      ))}
    </div>
  </div>
);