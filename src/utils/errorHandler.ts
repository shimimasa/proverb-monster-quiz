import { 
  DataLoadError, 
  DataValidationError, 
  StorageError, 
  StorageQuotaError 
} from '@/loaders/dataLoader';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorInfo {
  message: string;
  type: string;
  severity: ErrorSeverity;
  recoverable: boolean;
  timestamp: Date;
  context?: Record<string, any>;
}

class ErrorHandler {
  private errorListeners: ((error: ErrorInfo) => void)[] = [];
  private errorLog: ErrorInfo[] = [];
  private maxLogSize = 50;

  // Register error listener
  public addErrorListener(listener: (error: ErrorInfo) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }

  // Handle and categorize errors
  public handleError(error: unknown, context?: Record<string, any>): ErrorInfo {
    const errorInfo = this.categorizeError(error, context);
    this.logError(errorInfo);
    this.notifyListeners(errorInfo);
    return errorInfo;
  }

  // Categorize error based on type
  private categorizeError(error: unknown, context?: Record<string, any>): ErrorInfo {
    // Storage quota error
    if (error instanceof StorageQuotaError) {
      return {
        message: 'ストレージの容量が不足しています。不要なデータを削除してください。',
        type: 'storage_quota',
        severity: 'high',
        recoverable: true,
        timestamp: new Date(),
        context,
      };
    }

    // Storage error
    if (error instanceof StorageError) {
      return {
        message: 'データの保存に失敗しました。',
        type: 'storage',
        severity: 'medium',
        recoverable: true,
        timestamp: new Date(),
        context,
      };
    }

    // Data validation error
    if (error instanceof DataValidationError) {
      return {
        message: 'データの形式が正しくありません。',
        type: 'validation',
        severity: 'medium',
        recoverable: false,
        timestamp: new Date(),
        context,
      };
    }

    // Data load error
    if (error instanceof DataLoadError) {
      return {
        message: 'データの読み込みに失敗しました。',
        type: 'data_load',
        severity: 'high',
        recoverable: true,
        timestamp: new Date(),
        context,
      };
    }

    // Network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        message: 'ネットワークエラーが発生しました。接続を確認してください。',
        type: 'network',
        severity: 'medium',
        recoverable: true,
        timestamp: new Date(),
        context,
      };
    }

    // Generic error
    const message = error instanceof Error ? error.message : '予期しないエラーが発生しました。';
    return {
      message,
      type: 'general',
      severity: 'low',
      recoverable: true,
      timestamp: new Date(),
      context,
    };
  }

  // Log error
  private logError(errorInfo: ErrorInfo): void {
    this.errorLog.push(errorInfo);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[ErrorHandler]', errorInfo);
    }
  }

  // Notify all listeners
  private notifyListeners(errorInfo: ErrorInfo): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(errorInfo);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
  }

  // Get error log
  public getErrorLog(): ErrorInfo[] {
    return [...this.errorLog];
  }

  // Clear error log
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  // Get user-friendly error message
  public static getUserMessage(error: unknown): string {
    if (error instanceof StorageQuotaError) {
      return 'ストレージの容量が不足しています。';
    }
    if (error instanceof StorageError) {
      return 'データの保存に失敗しました。';
    }
    if (error instanceof DataValidationError) {
      return 'データの形式が正しくありません。';
    }
    if (error instanceof DataLoadError) {
      return 'データの読み込みに失敗しました。';
    }
    if (error instanceof Error) {
      return error.message;
    }
    return '予期しないエラーが発生しました。';
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

// Utility function for async error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    errorHandler.handleError(error, context);
    return null;
  }
}

// React hook for error handling
import { useEffect } from 'react';

export function useErrorHandler(
  handler: (error: ErrorInfo) => void
): void {
  useEffect(() => {
    return errorHandler.addErrorListener(handler);
  }, [handler]);
}