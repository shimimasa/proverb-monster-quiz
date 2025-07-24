import React from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaTimes } from 'react-icons/fa';
import { ContentItem } from '../../types';
import { MonsterImage } from '../monster/MonsterImage';

interface ContentPreviewProps {
  content: ContentItem;
  onClose: () => void;
}

export const ContentPreview: React.FC<ContentPreviewProps> = ({ content, onClose }) => {
  const getTypeLabel = (): string => {
    const labels = {
      proverb: 'ことわざ',
      four_character_idiom: '四字熟語',
      idiom: '慣用句'
    };
    return labels[content.type];
  };

  const getDifficultyColor = (): string => {
    const colors = {
      '小学生': 'bg-green-100 text-green-800',
      '中学生': 'bg-yellow-100 text-yellow-800',
      '高校生': 'bg-red-100 text-red-800'
    };
    return colors[content.difficulty] || 'bg-gray-100 text-gray-800';
  };

  // モンスターの仮想生成（実際の生成ロジックを使用）
  const generateMockMonster = () => {
    const rarities = ['common', 'rare', 'epic', 'legendary'] as const;
    const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];
    
    return {
      id: `preview-${content.id}`,
      name: content.text.slice(0, 10),
      image: '', // SVGは動的生成されるため空
      rarity: randomRarity,
      sourceContent: content,
      unlocked: true,
      dateObtained: new Date()
    };
  };

  const mockMonster = generateMockMonster();

  return (
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
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center">
              <FaEye className="mr-2" />
              コンテンツプレビュー
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
          <div className="grid md:grid-cols-2 gap-6">
            {/* 左側：コンテンツ情報 */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-500">タイプ</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                    {getTypeLabel()}
                  </span>
                  <span className={`px-2 py-1 rounded text-sm ${getDifficultyColor()}`}>
                    {content.difficulty}
                  </span>
                </div>

                <h3 className="text-2xl font-bold mb-2">{content.text}</h3>
                <p className="text-lg text-gray-600 mb-4">{content.reading}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">意味</h4>
                <p className="text-gray-700">{content.meaning}</p>
              </div>

              {content.example_sentence && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">例文</h4>
                  <p className="text-gray-700">{content.example_sentence}</p>
                </div>
              )}

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">クイズでの出題例</h4>
                <div className="space-y-2">
                  <p className="font-medium">問題：「{content.text}」の意味は？</p>
                  <div className="pl-4 space-y-1">
                    <p className="text-sm">A. {content.meaning}</p>
                    <p className="text-sm text-gray-500">B. （別の選択肢）</p>
                    <p className="text-sm text-gray-500">C. （別の選択肢）</p>
                    <p className="text-sm text-gray-500">D. （別の選択肢）</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 右側：モンスタープレビュー */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl">
                <h4 className="font-bold mb-4 text-center">獲得できるモンスター（例）</h4>
                <div className="flex justify-center">
                  <div className="relative">
                    <MonsterImage 
                      monster={mockMonster}
                      size="lg"
                      showAnimation={false}
                    />
                    <div className="absolute -bottom-2 left-0 right-0 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        mockMonster.rarity === 'legendary' ? 'bg-yellow-500 text-white' :
                        mockMonster.rarity === 'epic' ? 'bg-purple-500 text-white' :
                        mockMonster.rarity === 'rare' ? 'bg-blue-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {mockMonster.rarity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">データ情報</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">コンテンツID:</dt>
                    <dd className="font-mono">{content.id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">タイプ:</dt>
                    <dd className="font-mono">{content.type}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">文字数:</dt>
                    <dd>{content.text.length}文字</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">例文:</dt>
                    <dd>{content.example_sentence ? '有り' : '無し'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};