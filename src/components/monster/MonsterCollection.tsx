import React, { useState, useMemo } from 'react';
import { useGame } from '@contexts/GameContext';
import { MonsterCard } from './MonsterCard';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaFilter, FaSort } from 'react-icons/fa';
import type { MonsterRarity, ContentType } from '@types/index';

type SortOption = 'name' | 'rarity' | 'date' | 'type';
type FilterOption = 'all' | 'unlocked' | 'locked';

export const MonsterCollection: React.FC = () => {
  const { monsterManager, progressManager } = useGame();
  const [filterRarity, setFilterRarity] = useState<MonsterRarity | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<FilterOption>('all');
  const [filterType, setFilterType] = useState<ContentType | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [showFilters, setShowFilters] = useState(false);
  
  const allMonsters = monsterManager.getAllMonsters();
  const stats = monsterManager.getCollectionStats();
  const completionInfo = monsterManager.getCompletionProgress();
  
  // Filter and sort monsters
  const filteredAndSortedMonsters = useMemo(() => {
    let filtered = allMonsters;
    
    // Apply filters
    if (filterRarity !== 'all') {
      filtered = filtered.filter(m => m.rarity === filterRarity);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(m => filterStatus === 'unlocked' ? m.unlocked : !m.unlocked);
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(m => m.sourceContent.type === filterType);
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rarity':
          const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        case 'date':
          if (!a.dateObtained && !b.dateObtained) return 0;
          if (!a.dateObtained) return 1;
          if (!b.dateObtained) return -1;
          return b.dateObtained.getTime() - a.dateObtained.getTime();
        case 'type':
          return a.sourceContent.type.localeCompare(b.sourceContent.type);
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [allMonsters, filterRarity, filterStatus, filterType, sortBy]);

  const rarityOptions: Array<{ value: MonsterRarity | 'all'; label: string; color: string }> = [
    { value: 'all', label: 'すべて', color: 'gray' },
    { value: 'common', label: 'コモン', color: 'gray' },
    { value: 'rare', label: 'レア', color: 'blue' },
    { value: 'epic', label: 'エピック', color: 'purple' },
    { value: 'legendary', label: 'レジェンダリー', color: 'yellow' },
  ];

  const statusOptions: Array<{ value: FilterOption; label: string }> = [
    { value: 'all', label: 'すべて' },
    { value: 'unlocked', label: '獲得済み' },
    { value: 'locked', label: '未獲得' },
  ];

  const typeOptions: Array<{ value: ContentType | 'all'; label: string }> = [
    { value: 'all', label: 'すべて' },
    { value: 'proverb', label: 'ことわざ' },
    { value: 'idiom', label: '慣用句' },
    { value: 'four_character_idiom', label: '四字熟語' },
  ];

  const sortOptions: Array<{ value: SortOption; label: string }> = [
    { value: 'date', label: '獲得日順' },
    { value: 'name', label: '名前順' },
    { value: 'rarity', label: 'レアリティ順' },
    { value: 'type', label: 'タイプ順' },
  ];

  return (
    <div className="space-y-6">
      {/* Collection Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            モンスターコレクション
          </h2>
          <FaTrophy className="text-3xl text-yellow-500" />
        </div>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>完成度</span>
            <span>{completionInfo.percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 to-green-600"
              initial={{ width: 0 }}
              animate={{ width: `${completionInfo.percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">獲得数</p>
            <p className="text-2xl font-bold text-blue-600">{stats.unlocked}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">コモン</p>
            <p className="text-xl font-semibold text-gray-600">{stats.byRarity.common}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">レア</p>
            <p className="text-xl font-semibold text-blue-600">{stats.byRarity.rare}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">エピック+</p>
            <p className="text-xl font-semibold text-purple-600">
              {stats.byRarity.epic + stats.byRarity.legendary}
            </p>
          </div>
        </div>
        
        {/* Next Milestone */}
        {completionInfo.nextMilestone && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              次のマイルストーン（{completionInfo.nextMilestone}%）まで
              <span className="font-semibold text-gray-800 ml-1">
                あと{completionInfo.monstersToNext}体
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Filter and Sort Controls */}
      <div className="bg-white rounded-lg shadow-md">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <FaFilter className="text-gray-600" />
            <span className="font-medium text-gray-700">フィルター & ソート</span>
          </div>
          <motion.div
            animate={{ rotate: showFilters ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            ▼
          </motion.div>
        </button>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0 space-y-4 border-t">
                {/* Rarity Filter */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">レアリティ</p>
                  <div className="flex flex-wrap gap-2">
                    {rarityOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setFilterRarity(option.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          filterRarity === option.value
                            ? option.value === 'all' 
                              ? 'bg-gray-600 text-white'
                              : `bg-${option.color}-500 text-white`
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Status Filter */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">獲得状態</p>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setFilterStatus(option.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          filterStatus === option.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Type Filter */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">タイプ</p>
                  <div className="flex flex-wrap gap-2">
                    {typeOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setFilterType(option.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          filterType === option.value
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Sort Options */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">並び順</p>
                  <div className="flex flex-wrap gap-2">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          sortBy === option.value
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 px-2">
        {filteredAndSortedMonsters.length}体のモンスターを表示中
      </div>

      {/* Monster Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <AnimatePresence>
          {filteredAndSortedMonsters.map((monster, index) => (
            <motion.div
              key={monster.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <MonsterCard monster={monster} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredAndSortedMonsters.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-600 text-lg">
            該当するモンスターが見つかりません
          </p>
          <button
            onClick={() => {
              setFilterRarity('all');
              setFilterStatus('all');
              setFilterType('all');
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            フィルターをリセット
          </button>
        </div>
      )}
    </div>
  );
};