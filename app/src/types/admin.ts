/**
 * 管理者機能関連の型定義
 */

export interface AdminUser {
  isAuthenticated: boolean;
  lastLoginAt?: Date;
}

export interface ContentFormData {
  id?: number;
  text: string;
  reading: string;
  meaning: string;
  difficulty: '小学生' | '中学生' | '高校生';
  example_sentence?: string;
  type: 'proverb' | 'idiom' | 'four_character_idiom';
}

export interface ContentFilter {
  type?: 'all' | 'proverb' | 'idiom' | 'four_character_idiom';
  difficulty?: 'all' | '小学生' | '中学生' | '高校生';
  searchText?: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ContentValidationError {
  field: keyof ContentFormData;
  message: string;
}

export type AdminAction = 
  | { type: 'LOGIN'; payload: { password: string } }
  | { type: 'LOGOUT' }
  | { type: 'ADD_CONTENT'; payload: ContentFormData }
  | { type: 'UPDATE_CONTENT'; payload: ContentFormData }
  | { type: 'DELETE_CONTENT'; payload: { id: number; type: string } }
  | { type: 'IMPORT_CONTENT'; payload: { data: ContentFormData[]; type: string } };