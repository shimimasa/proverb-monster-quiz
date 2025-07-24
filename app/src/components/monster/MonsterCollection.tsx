import React, { useState, useMemo, useCallback } from 'react';
import { useGame } from '@contexts/GameContext';
import { MonsterCard } from './MonsterCard';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaFilter, FaSort } from 'react-icons/fa';
import { SearchBar } from '../common/SearchBar';
import { FilterPanel } from '../common/FilterPanel';
import { searchManager, SearchResult, FilterOptions } from '../../core/SearchManager';
import type { MonsterRarity, ContentType, Monster } from '@types/index';

type SortOption = 'name' | 'rarity' | 'date' | 'type';

export const MonsterCollection: React.FC = () => {
  const { monsterManager, progressManager } = useGame();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const allMonsters = monsterManager.getAllMonsters();
  const stats = monsterManager.getCollectionStats();
  const completionInfo = monsterManager.getCompletionProgress();
  
  // Search and filter monsters
  const searchResults = useMemo(() => {
    if (searchQuery) {
      return searchManager.searchMonsters(searchQuery, filters);
    }
    return null;
  }, [searchQuery, filters]);
  
  // Get filtered monsters
  const filteredMonsters = useMemo(() => {
    if (searchResults) {
      return searchResults.map(result => result.item);
    }
    
    // Apply filters without search
    const allFiltered = searchManager.searchMonsters('', filters);
    return allFiltered.map(result => result.item);
  }, [searchResults, filters]);
  
  // Sort monsters
  const sortedMonsters = useMemo(() => {
    const sorted = [...filteredMonsters].sort((a, b) => {
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
          return new Date(b.dateObtained).getTime() - new Date(a.dateObtained).getTime();
        case 'type':
          return a.sourceContent.type.localeCompare(b.sourceContent.type);
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [filteredMonsters, sortBy]);
  
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);
  
  const handleFiltersChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
  }, []);
  
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

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

      {/* Search Bar */}
      <div className="bg-white dark:bg-surface-dark rounded-lg shadow-md p-4">
        <SearchBar
          placeholder="モンスター名や関連することわざで検索..."
          onSearch={handleSearch}
          onClear={clearSearch}
          initialValue={searchQuery}
        />
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Filter Panel */}
        <div className="lg:w-1/3">
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            showContentTypes={true}
            showDifficulties={true}
            showRarities={true}
            showUnlocked={true}
          />
        </div>
        
        {/* Sort Controls */}
        <div className="flex-1 bg-white dark:bg-surface-dark rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">並び順</h3>
            <FaSort className="text-gray-500" />
          </div>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  sortBy === option.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400 px-2">
        {sortedMonsters.length}体のモンスターを表示中
        {searchQuery && <span className="ml-2">(「{searchQuery}」の検索結果)</span>}
      </div>

      {/* Monster Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <AnimatePresence>
          {sortedMonsters.map((monster, index) => (
            <motion.div
              key={monster.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
            >
              <MonsterCard 
                monster={monster}
                highlighted={searchQuery && searchResults?.some(r => r.item.id === monster.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {sortedMonsters.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {searchQuery ? '検索結果が見つかりません' : '該当するモンスターが見つかりません'}
          </p>
          <div className="mt-4 space-x-2">
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                検索をクリア
              </button>
            )}
            <button
              onClick={() => {
                setFilters({});
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              すべてリセット
            </button>
          </div>
        </div>
      )}
    </div>
  );
};