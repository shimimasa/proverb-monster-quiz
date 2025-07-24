import React from 'react';
import { motion } from 'framer-motion';
import { buttonVariants } from '@/utils/animations';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  ripple?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  children,
  ripple = true,
  className = '',
  onClick,
  ...props
}) => {
  const [ripples, setRipples] = React.useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ripple) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      
      setRipples(prev => [...prev, { x, y, id }]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
    }
    
    onClick?.(e);
  };

  const baseClasses = 'relative overflow-hidden font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={handleClick}
      variants={buttonVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      {...props}
    >
      {children}
      
      {/* Ripple effects */}
      {ripples.map(({ x, y, id }) => (
        <motion.span
          key={id}
          className="absolute bg-white/30 rounded-full pointer-events-none"
          style={{
            left: x,
            top: y,
            width: 10,
            height: 10,
            x: '-50%',
            y: '-50%'
          }}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 8, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
    </motion.button>
  );
};