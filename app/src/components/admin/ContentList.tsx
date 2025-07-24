import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentItem, ContentType } from '../../types';
import { ContentFilter } from '../../types/admin';
import { FaEdit, FaTrash, FaSearch, FaFilter } from 'react-icons/fa';

interface ContentListProps {
  contents: ContentItem[];
  onEdit: (content: ContentItem) => void;
  onDelete: (content: ContentItem) => void;
  isCustomContent?: (content: ContentItem) => boolean;
}

export const ContentList: React.FC<ContentListProps> = ({
  contents,
  onEdit,
  onDelete,
  isCustomContent = () => true
}) => {
  const [filter, setFilter] = useState<ContentFilter>({
    type: 'all',
    difficulty: 'all',
    searchText: ''
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ContentItem | null>(null);

  const filteredContents = useMemo(() => {
    return contents.filter(content => {
      // タイプフィルター
      if (filter.type !== 'all' && content.type !== filter.type) {
        return false;
      }

      // 難易度フィルター
      if (filter.difficulty !== 'all' && content.difficulty !== filter.difficulty) {
        return false;
      }

      // テキスト検索
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        return (
          content.text.toLowerCase().includes(searchLower) ||
          content.reading.toLowerCase().includes(searchLower) ||
          content.meaning.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [contents, filter]);

  const handleDelete = (content: ContentItem) => {
    onDelete(content);
    setShowDeleteConfirm(null);
  };

  const getTypeLabel = (type: ContentType): string => {
    const labels: Record<ContentType, string> = {
      proverb: 'ことわざ',
      four_character_idiom: '四字熟語',
      idiom: '慣用句'
    };
    return labels[type];
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case '小学生': return 'bg-green-100 text-green-800';
      case '中学生': return 'bg-yellow-100 text-yellow-800';
      case '高校生': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* フィルター */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* タイプフィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaFilter className="inline mr-1" />
              タイプ
            </label>
            <select
              value={filter.type || 'all'}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">すべて</option>
              <option value="proverb">ことわざ</option>
              <option value="four_character_idiom">四字熟語</option>
              <option value="idiom">慣用句</option>
            </select>
          </div>

          {/* 難易度フィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaFilter className="inline mr-1" />
              難易度
            </label>
            <select
              value={filter.difficulty || 'all'}
              onChange={(e) => setFilter(prev => ({ ...prev, difficulty: e.target.value as any }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">すべて</option>
              <option value="小学生">小学生</option>
              <option value="中学生">中学生</option>
              <option value="高校生">高校生</option>
            </select>
          </div>

          {/* 検索 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaSearch className="inline mr-1" />
              検索
            </label>
            <input
              type="text"
              value={filter.searchText || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, searchText: e.target.value }))}
              placeholder="テキスト、読み、意味で検索"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="text-sm text-gray-600">
          検索結果: {filteredContents.length}件
        </div>
      </div>

      {/* コンテンツリスト */}
      <div className="space-y-2">
        <AnimatePresence>
          {filteredContents.map((content) => {
            const canEdit = isCustomContent(content);
            
            return (
              <motion.div
                key={`${content.type}-${content.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg font-medium">{content.text}</span>
                      <span className="text-sm text-gray-500">({content.reading})</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(content.difficulty)}`}>
                        {content.difficulty}
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        {getTypeLabel(content.type)}
                      </span>
                      {canEdit && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          カスタム
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700">{content.meaning}</p>
                    {content.example_sentence && (
                      <p className="text-sm text-gray-500 mt-1">例: {content.example_sentence}</p>
                    )}
                  </div>

                  {canEdit && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => onEdit(content)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="編集"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(content)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="削除"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 削除確認ダイアログ */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-bold mb-4">削除の確認</h3>
              <p className="mb-2">以下のコンテンツを削除しますか？</p>
              <p className="font-medium mb-4">{showDeleteConfirm.text}</p>
              <p className="text-sm text-gray-600 mb-6">この操作は取り消せません。</p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  削除する
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};