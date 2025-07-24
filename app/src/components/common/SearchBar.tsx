import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { searchManager } from '../../core/SearchManager';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  suggestions?: boolean;
  initialValue?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = '検索...',
  onSearch,
  onClear,
  suggestions = true,
  initialValue = '',
  className = ''
}) => {
  const [query, setQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    onSearch(debouncedQuery);
    
    if (suggestions && debouncedQuery.length > 0) {
      const queries = searchManager.getSuggestedQueries(debouncedQuery, 5);
      setSuggestedQueries(queries);
    } else {
      setSuggestedQueries([]);
    }
  }, [debouncedQuery, onSearch, suggestions]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedSuggestionIndex(-1);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    setSuggestedQueries([]);
    setSelectedSuggestionIndex(-1);
    onClear?.();
  }, [onClear]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setSuggestedQueries([]);
    setIsFocused(false);
    onSearch(suggestion);
  }, [onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestedQueries.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestedQueries.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestedQueries[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSuggestedQueries([]);
        setSelectedSuggestionIndex(-1);
        break;
    }
  }, [suggestedQueries, selectedSuggestionIndex, handleSuggestionClick]);

  const showSuggestions = isFocused && suggestedQueries.length > 0;

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`
          relative flex items-center rounded-lg
          bg-surface dark:bg-surface-dark
          border-2 transition-colors duration-200
          ${isFocused 
            ? 'border-primary dark:border-primary-dark shadow-lg' 
            : 'border-gray-300 dark:border-gray-600'
          }
        `}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <FaSearch className="absolute left-3 text-gray-400 dark:text-gray-500" />
        
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            w-full py-3 pl-10 pr-10
            bg-transparent
            text-text-primary dark:text-text-primary-dark
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none
          `}
          aria-label="検索入力"
          role="searchbox"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={showSuggestions}
        />
        
        {query && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="検索をクリア"
          >
            <FaTimes className="text-gray-400 dark:text-gray-500" />
          </motion.button>
        )}
      </motion.div>

      {showSuggestions && (
        <motion.div
          id="search-suggestions"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`
            absolute z-50 w-full mt-2
            bg-surface dark:bg-surface-dark
            border-2 border-gray-200 dark:border-gray-700
            rounded-lg shadow-xl
            max-h-60 overflow-y-auto
          `}
          role="listbox"
        >
          {suggestedQueries.map((suggestion, index) => (
            <motion.button
              key={suggestion}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`
                w-full px-4 py-3 text-left
                hover:bg-gray-100 dark:hover:bg-gray-800
                transition-colors duration-150
                ${index === selectedSuggestionIndex 
                  ? 'bg-gray-100 dark:bg-gray-800' 
                  : ''
                }
              `}
              role="option"
              aria-selected={index === selectedSuggestionIndex}
            >
              <span className="text-text-primary dark:text-text-primary-dark">
                {suggestion}
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
};