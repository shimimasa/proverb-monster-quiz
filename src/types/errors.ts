// エラー関連の型定義を分離
export class DataLoadError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'DataLoadError';
  }
}

export class DataValidationError extends Error {
  constructor(message: string, public validationErrors?: any) {
    super(message);
    this.name = 'DataValidationError';
  }
}

export class StorageError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

export class StorageQuotaError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'StorageQuotaError';
  }
}