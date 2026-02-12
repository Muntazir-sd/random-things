import React, { useState, useMemo } from 'react';
import { IFlatOption } from '../../makeHierarchicalTrainerOptions/types';
import useDebounce from '@/app/hooks/useDebounce';
import { ViewModeType } from '../constants';

/**
 * Custom hook to handle search functionality and view mode switching.
 *
 * Behavior:
 * 1. Debounces search input to prevent performance issues with large lists.
 * 2. Automatically switches the view mode:
 *    - To 'flat' when a user starts typing (to show filtered results).
 *    - To 'tree' when the search is cleared (to show hierarchy).
 */
export default function useSearch(flatOptions: IFlatOption[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewModeType>('tree');

  // Debounce input by 300ms to avoid filtering on every keystroke.
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredFlatData = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return flatOptions;

    const searchLower = debouncedSearchTerm.toLowerCase();

    // Filter logic: Match against Label (Name), Level (e.g., "Level 2"), or ID.
    return flatOptions.filter(
      (item) =>
        item.label.toLowerCase().includes(searchLower) ||
        `Level ${item.level}`
          .replace(/\s/g, '')
          .toLowerCase()
          .includes(searchLower.replace(/\s/g, '')) ||
        String(item.value).includes(debouncedSearchTerm)
    );
  }, [flatOptions, debouncedSearchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setSearchTerm(value);

    // Auto-switch view logic
    setViewMode(value.trim() ? 'flat' : 'tree');
  };

  const clearSearch = () => {
    setSearchTerm('');
    setViewMode('tree');
  };

  return {
    searchTerm,
    debouncedSearchTerm,
    viewMode,
    setViewMode,
    filteredFlatData,
    handleSearchChange,
    clearSearch,
  };
}
