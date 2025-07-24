import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaEdit, FaSave, FaExclamationTriangle } from 'react-icons/fa';
import { ContentItem, ContentType } from '../../types';

interface BulkEditModalProps {
  contents: ContentItem[];
  onSave: (updates: Partial<ContentItem>[]) => void;
  onClose: () => void;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({ contents, onSave, onClose }) => {
  const [difficulty, setDifficulty] = useState<string>('');
  const [addPrefix, setAddPrefix] = useState('');
  const [addSuffix, setAddSuffix] = useState('');
  const [replaceFrom, setReplaceFrom] = useState('');
  const [replaceTo, setReplaceTo] = useState('');
  const [selectedField, setSelectedField] = useState<'text' | 'meaning' | 'example_sentence'>('text');

  const handleApply = () => {
    const updates: Partial<ContentItem>[] = contents.map(content => {
      const update: Partial<ContentItem> = { id: content.id };
      
      // 難易度の一括変更
      if (difficulty) {
        update.difficulty = difficulty as '小学生' | '中学生' | '高校生';
      }
      
      // プレフィックス・サフィックスの追加
      if (addPrefix || addSuffix) {
        const fieldValue = content[selectedField] || '';
        update[selectedField] = `${addPrefix}${fieldValue}${addSuffix}`;
      }
      
      // 文字列の置換
      if (replaceFrom && selectedField) {
        const fieldValue = content[selectedField] || '';
        update[selectedField] = fieldValue.replace(new RegExp(replaceFrom, 'g'), replaceTo);
      }
      
      return update;
    });
    
    onSave(updates);
  };

  const getPreviewText = (content: ContentItem): string => {
    let text = content[selectedField] || '';
    
    // プレビュー表示
    if (addPrefix || addSuffix) {
      text = `${addPrefix}${text}${addSuffix}`;
    }
    
    if (replaceFrom) {
      text = text.replace(new RegExp(replaceFrom, 'g'), replaceTo);
    }
    
    return text;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center">
                <FaEdit className="mr-2" />
                一括編集（{contents.length}件）
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* コンテンツ */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="space-y-6">
              {/* 難易度の一括変更 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-3">難易度の一括変更</h3>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">変更しない</option>
                  <option value="小学生">小学生</option>
                  <option value="中学生">中学生</option>
                  <option value="高校生">高校生</option>
                </select>
              </div>

              {/* テキスト編集 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-3">テキスト編集</h3>
                
                {/* フィールド選択 */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    編集対象フィールド
                  </label>
                  <select
                    value={selectedField}
                    onChange={(e) => setSelectedField(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="text">テキスト</option>
                    <option value="meaning">意味</option>
                    <option value="example_sentence">例文</option>
                  </select>
                </div>

                {/* プレフィックス・サフィックス */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      先頭に追加
                    </label>
                    <input
                      type="text"
                      value={addPrefix}
                      onChange={(e) => setAddPrefix(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="例: 【重要】"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      末尾に追加
                    </label>
                    <input
                      type="text"
                      value={addSuffix}
                      onChange={(e) => setAddSuffix(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="例: （編集済）"
                    />
                  </div>
                </div>

                {/* 文字列置換 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      検索文字列
                    </label>
                    <input
                      type="text"
                      value={replaceFrom}
                      onChange={(e) => setReplaceFrom(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="置換元の文字列"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      置換文字列
                    </label>
                    <input
                      type="text"
                      value={replaceTo}
                      onChange={(e) => setReplaceTo(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="置換後の文字列"
                    />
                  </div>
                </div>
              </div>

              {/* プレビュー */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-bold mb-3 flex items-center">
                  <FaExclamationTriangle className="mr-2 text-yellow-600" />
                  変更プレビュー（最初の3件）
                </h3>
                <div className="space-y-2 text-sm">
                  {contents.slice(0, 3).map((content, index) => (
                    <div key={index} className="p-2 bg-white rounded border">
                      <div className="font-medium">{content.text}</div>
                      {(addPrefix || addSuffix || replaceFrom) && (
                        <div className="text-gray-600 mt-1">
                          {selectedField}: {content[selectedField]} → 
                          <span className="text-orange-600 font-medium ml-1">
                            {getPreviewText(content)}
                          </span>
                        </div>
                      )}
                      {difficulty && (
                        <div className="text-gray-600 mt-1">
                          難易度: {content.difficulty} → 
                          <span className="text-orange-600 font-medium ml-1">{difficulty}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {contents.length > 3 && (
                    <div className="text-gray-500 text-center">
                      他{contents.length - 3}件...
                    </div>
                  )}
                </div>
              </div>

              {/* 警告メッセージ */}
              <div className="bg-red-50 p-3 rounded-lg flex items-start">
                <FaExclamationTriangle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  この操作は取り消すことができません。変更を適用する前に、プレビューで内容を確認してください。
                </p>
              </div>

              {/* アクションボタン */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleApply}
                  disabled={!difficulty && !addPrefix && !addSuffix && !replaceFrom}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <FaSave className="mr-2" />
                  変更を適用
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};