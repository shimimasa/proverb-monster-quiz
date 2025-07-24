import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { FilterOptions } from '../../core/SearchManager';

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  showContentTypes?: boolean;
  showDifficulties?: boolean;
  showRarities?: boolean;
  showUnlocked?: boolean;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  showContentTypes = true,
  showDifficulties = true,
  showRarities = false,
  showUnlocked = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['contentTypes']));

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  const handleContentTypeToggle = useCallback((type: 'proverb' | 'idiom' | 'four_character_idiom') => {
    const currentTypes = filters.contentTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    onFiltersChange({
      ...filters,
      contentTypes: newTypes.length > 0 ? newTypes : undefined
    });
  }, [filters, onFiltersChange]);

  const handleDifficultyToggle = useCallback((difficulty: '小学生' | '中学生' | '高校生') => {
    const currentDifficulties = filters.difficulties || [];
    const newDifficulties = currentDifficulties.includes(difficulty)
      ? currentDifficulties.filter(d => d !== difficulty)
      : [...currentDifficulties, difficulty];
    
    onFiltersChange({
      ...filters,
      difficulties: newDifficulties.length > 0 ? newDifficulties : undefined
    });
  }, [filters, onFiltersChange]);

  const handleRarityToggle = useCallback((rarity: 'common' | 'rare' | 'epic' | 'legendary') => {
    const currentRarities = filters.rarities || [];
    const newRarities = currentRarities.includes(rarity)
      ? currentRarities.filter(r => r !== rarity)
      : [...currentRarities, rarity];
    
    onFiltersChange({
      ...filters,
      rarities: newRarities.length > 0 ? newRarities : undefined
    });
  }, [filters, onFiltersChange]);

  const handleUnlockedChange = useCallback((value: boolean | null) => {
    onFiltersChange({
      ...filters,
      unlocked: value
    });
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  const activeFilterCount = 
    (filters.contentTypes?.length || 0) +
    (filters.difficulties?.length || 0) +
    (filters.rarities?.length || 0) +
    (filters.unlocked !== null && filters.unlocked !== undefined ? 1 : 0);

  return (
    <div className={`bg-surface dark:bg-surface-dark rounded-lg shadow-md ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg"
        aria-expanded={isExpanded}
        aria-controls="filter-content"
      >
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-600 dark:text-gray-400" />
          <span className="font-medium text-text-primary dark:text-text-primary-dark">
            フィルター
          </span>
          {activeFilterCount > 0 && (
            <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="filter-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:text-primary-dark transition-colors"
                >
                  すべてクリア
                </button>
              )}

              {showContentTypes && (
                <FilterSection
                  title="コンテンツタイプ"
                  isExpanded={expandedSections.has('contentTypes')}
                  onToggle={() => toggleSection('contentTypes')}
                >
                  <div className="space-y-2">
                    <FilterCheckbox
                      label="ことわざ"
                      checked={filters.contentTypes?.includes('proverb') || false}
                      onChange={() => handleContentTypeToggle('proverb')}
                    />
                    <FilterCheckbox
                      label="四字熟語"
                      checked={filters.contentTypes?.includes('four_character_idiom') || false}
                      onChange={() => handleContentTypeToggle('four_character_idiom')}
                    />
                    <FilterCheckbox
                      label="慣用句"
                      checked={filters.contentTypes?.includes('idiom') || false}
                      onChange={() => handleContentTypeToggle('idiom')}
                    />
                  </div>
                </FilterSection>
              )}

              {showDifficulties && (
                <FilterSection
                  title="難易度"
                  isExpanded={expandedSections.has('difficulties')}
                  onToggle={() => toggleSection('difficulties')}
                >
                  <div className="space-y-2">
                    <FilterCheckbox
                      label="小学生"
                      checked={filters.difficulties?.includes('小学生') || false}
                      onChange={() => handleDifficultyToggle('小学生')}
                    />
                    <FilterCheckbox
                      label="中学生"
                      checked={filters.difficulties?.includes('中学生') || false}
                      onChange={() => handleDifficultyToggle('中学生')}
                    />
                    <FilterCheckbox
                      label="高校生"
                      checked={filters.difficulties?.includes('高校生') || false}
                      onChange={() => handleDifficultyToggle('高校生')}
                    />
                  </div>
                </FilterSection>
              )}

              {showRarities && (
                <FilterSection
                  title="レアリティ"
                  isExpanded={expandedSections.has('rarities')}
                  onToggle={() => toggleSection('rarities')}
                >
                  <div className="space-y-2">
                    <FilterCheckbox
                      label="コモン"
                      checked={filters.rarities?.includes('common') || false}
                      onChange={() => handleRarityToggle('common')}
                    />
                    <FilterCheckbox
                      label="レア"
                      checked={filters.rarities?.includes('rare') || false}
                      onChange={() => handleRarityToggle('rare')}
                    />
                    <FilterCheckbox
                      label="エピック"
                      checked={filters.rarities?.includes('epic') || false}
                      onChange={() => handleRarityToggle('epic')}
                    />
                    <FilterCheckbox
                      label="レジェンダリー"
                      checked={filters.rarities?.includes('legendary') || false}
                      onChange={() => handleRarityToggle('legendary')}
                    />
                  </div>
                </FilterSection>
              )}

              {showUnlocked && (
                <FilterSection
                  title="取得状況"
                  isExpanded={expandedSections.has('unlocked')}
                  onToggle={() => toggleSection('unlocked')}
                >
                  <div className="space-y-2">
                    <FilterRadio
                      label="すべて"
                      checked={filters.unlocked === null || filters.unlocked === undefined}
                      onChange={() => handleUnlockedChange(null)}
                      name="unlocked"
                    />
                    <FilterRadio
                      label="取得済み"
                      checked={filters.unlocked === true}
                      onChange={() => handleUnlockedChange(true)}
                      name="unlocked"
                    />
                    <FilterRadio
                      label="未取得"
                      checked={filters.unlocked === false}
                      onChange={() => handleUnlockedChange(false)}
                      name="unlocked"
                    />
                  </div>
                </FilterSection>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface FilterSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  isExpanded,
  onToggle,
  children
}) => {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2 hover:text-primary transition-colors"
        aria-expanded={isExpanded}
      >
        <span className="font-medium text-sm">{title}</span>
        {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-2 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface FilterCheckboxProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

const FilterCheckbox: React.FC<FilterCheckboxProps> = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-primary rounded focus:ring-primary"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
};

interface FilterRadioProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  name: string;
}

const FilterRadio: React.FC<FilterRadioProps> = ({ label, checked, onChange, name }) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-primary focus:ring-primary"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
};