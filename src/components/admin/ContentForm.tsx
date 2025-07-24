import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ContentFormData, ContentValidationError } from '../../types/admin';
import { FaSave, FaTimes } from 'react-icons/fa';

interface ContentFormProps {
  initialData?: ContentFormData;
  onSubmit: (data: ContentFormData) => void;
  onCancel: () => void;
  errors?: ContentValidationError[];
  isLoading?: boolean;
}

export const ContentForm: React.FC<ContentFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  errors = [],
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ContentFormData>({
    text: '',
    reading: '',
    meaning: '',
    difficulty: '小学生',
    example_sentence: '',
    type: 'proverb',
    ...initialData
  });

  const getErrorMessage = (field: keyof ContentFormData): string | undefined => {
    return errors.find(e => e.field === field)?.message;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    field: keyof ContentFormData,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* コンテンツタイプ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          タイプ <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.type}
          onChange={(e) => handleChange('type', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          disabled={isLoading || !!initialData}
        >
          <option value="proverb">ことわざ</option>
          <option value="four_character_idiom">四字熟語</option>
          <option value="idiom">慣用句</option>
        </select>
      </div>

      {/* テキスト */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {formData.type === 'proverb' ? 'ことわざ' : 
           formData.type === 'four_character_idiom' ? '四字熟語' : '慣用句'}
          <span className="text-red-500"> *</span>
        </label>
        <input
          type="text"
          value={formData.text}
          onChange={(e) => handleChange('text', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
            getErrorMessage('text') ? 'border-red-500' : ''
          }`}
          placeholder="例: 猿も木から落ちる"
          disabled={isLoading}
        />
        {getErrorMessage('text') && (
          <p className="text-red-500 text-sm mt-1">{getErrorMessage('text')}</p>
        )}
      </div>

      {/* 読み方 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          読み方（ひらがな） <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.reading}
          onChange={(e) => handleChange('reading', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
            getErrorMessage('reading') ? 'border-red-500' : ''
          }`}
          placeholder="例: さるもきからおちる"
          disabled={isLoading}
        />
        {getErrorMessage('reading') && (
          <p className="text-red-500 text-sm mt-1">{getErrorMessage('reading')}</p>
        )}
      </div>

      {/* 意味 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          意味 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.meaning}
          onChange={(e) => handleChange('meaning', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
            getErrorMessage('meaning') ? 'border-red-500' : ''
          }`}
          placeholder="例: どんなに得意なことでも、時には失敗することがある"
          rows={3}
          disabled={isLoading}
        />
        {getErrorMessage('meaning') && (
          <p className="text-red-500 text-sm mt-1">{getErrorMessage('meaning')}</p>
        )}
      </div>

      {/* 難易度 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          難易度 <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.difficulty}
          onChange={(e) => handleChange('difficulty', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          disabled={isLoading}
        >
          <option value="小学生">小学生</option>
          <option value="中学生">中学生</option>
          <option value="高校生">高校生</option>
        </select>
      </div>

      {/* 例文 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          例文（任意）
        </label>
        <textarea
          value={formData.example_sentence || ''}
          onChange={(e) => handleChange('example_sentence', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
            getErrorMessage('example_sentence') ? 'border-red-500' : ''
          }`}
          placeholder="例: プロの料理人でも失敗することがある。猿も木から落ちるというものだ。"
          rows={2}
          disabled={isLoading}
        />
        {getErrorMessage('example_sentence') && (
          <p className="text-red-500 text-sm mt-1">{getErrorMessage('example_sentence')}</p>
        )}
      </div>

      {/* ボタン */}
      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <FaSave />
          <span>{initialData ? '更新' : '追加'}</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
        >
          <FaTimes />
          <span>キャンセル</span>
        </button>
      </div>
    </form>
  );
};