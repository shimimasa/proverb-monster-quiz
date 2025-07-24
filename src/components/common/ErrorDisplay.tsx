import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaExclamationCircle, 
  FaWifi, 
  FaDatabase, 
  FaRedo,
  FaBug,
  FaHdd
} from 'react-icons/fa';

export type ErrorType = 
  | 'network' 
  | 'data' 
  | 'storage' 
  | 'validation' 
  | 'general';

interface ErrorDisplayProps {
  type: ErrorType;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

const errorConfigs = {
  network: {
    icon: FaWifi,
    title: 'ネットワークエラー',
    message: 'インターネット接続を確認してください。',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  data: {
    icon: FaDatabase,
    title: 'データ読み込みエラー',
    message: 'データの読み込みに失敗しました。',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  storage: {
    icon: FaHdd,
    title: 'ストレージエラー',
    message: 'ストレージの容量が不足している可能性があります。',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  validation: {
    icon: FaBug,
    title: 'データ検証エラー',
    message: 'データの形式が正しくありません。',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  general: {
    icon: FaExclamationCircle,
    title: 'エラーが発生しました',
    message: '予期しないエラーが発生しました。',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  type,
  message,
  onRetry,
  className = '',
}) => {
  const config = errorConfigs[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white rounded-lg shadow-md p-6 ${className}`}
    >
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-16 h-16 ${config.bgColor} rounded-full mb-4`}>
          <Icon className={`text-3xl ${config.color}`} />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {config.title}
        </h3>
        
        <p className="text-gray-600 mb-6">
          {message || config.message}
        </p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaRedo />
            <span>再試行</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Inline error message component
interface ErrorMessageProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  type = 'error',
  className = '',
}) => {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  const icons = {
    error: <FaExclamationCircle className="text-red-500" />,
    warning: <FaExclamationCircle className="text-yellow-500" />,
    info: <FaExclamationCircle className="text-blue-500" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`flex items-center space-x-2 p-3 rounded-lg border ${styles[type]} ${className}`}
    >
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
    </motion.div>
  );
};

// Loading error placeholder
interface LoadingErrorProps {
  onRetry?: () => void;
}

export const LoadingError: React.FC<LoadingErrorProps> = ({ onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-pulse">
        <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
        <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
        <div className="w-24 h-4 bg-gray-200 rounded"></div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          再読み込み
        </button>
      )}
    </div>
  );
};