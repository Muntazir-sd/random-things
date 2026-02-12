/* eslint-disable no-nested-ternary */

'use client';

import * as React from 'react';
import { Paper, Box, Typography } from '@mui/material';

// Hooks
import useTrainerData from './hooks/useTrainerData';
import useSelection from './hooks/useSelection';
import useExpansion from './hooks/useExpansion';
import useSearch from './hooks/useSearch';
import useKeyboardNav from './hooks/useKeyboardNav';

// Components
import SearchHeader from './components/SearchHeader';
import TreeView from './components/TreeView';
import FlatListView from './components/FlatListView';
import SelectionSummary from './components/SelectionSummary';
import StatsFooter from './components/StatsFooter';

// Types
import { TrainerFieldProps } from './types';

/**
 * Main container component for the Trainer selection interface.
 *
 * This component acts as a Controller, orchestrating specialized hooks to manage:
 * 1. Data Transformation (Flat DB records -> Hierarchical Tree)
 * 2. User Selection (Single vs Multi-select modes)
 * 3. Search & Filtering (Switching between Tree and List views)
 * 4. UX States (Expansion persistence, Keyboard navigation)
 */
export default function TrainerField({
  trainers,
  loading = false,
  value,
  onChange,
  mode = 'single',
  selectedIds = [],
  onMultiChange,
}: TrainerFieldProps) {
  /**
   * Data Layer:
   * Handles the expensive operation of building the tree structure and flat options.
   * Results are memoized to ensure performance during re-renders.
   */
  const { treeNodes, flatOptions, adminNodeIds, isLoading } = useTrainerData(
    trainers,
    loading
  );

  /**
   * Selection Layer:
   * Abstracts the logic for handling selection updates, supporting both
   * single-value and multi-value props through a unified interface.
   */
  const {
    selectedItems,
    handleSelectionChange,
    clearSelection,
    getSelectedTrainerIds,
    isItemSelected,
  } = useSelection(mode, value, selectedIds, onChange, onMultiChange);

  /**
   * Search Layer:
   * Manages the search input state and the derived filtered dataset.
   * Controls the 'viewMode' to automatically switch to a flat list when searching.
   */
  const {
    searchTerm,
    debouncedSearchTerm,
    viewMode,
    setViewMode,
    filteredFlatData,
    handleSearchChange,
    clearSearch,
  } = useSearch(flatOptions);

  /**
   * Expansion Layer:
   * Manages the expanded/collapsed state of tree nodes.
   * - Persists state to localStorage.
   * - Auto-expands nodes when filtering or selecting items deep in the hierarchy.
   */
  const selectedId =
    mode === 'multi'
      ? (selectedItems as string[])[0] || null
      : (selectedItems as string) || null;

  const { expandedItems, handleExpandedItemsChange } = useExpansion(
    treeNodes,
    adminNodeIds,
    selectedId,
    debouncedSearchTerm
  );

  /**
   * Keyboard Navigation Layer:
   * Provides accessibility support for the Flat List View.
   * Intercepts keyboard events to manage focus and selection.
   */
  const { focusedIndex, setFocusedIndex, handleKeyDown } = useKeyboardNav(
    filteredFlatData,
    viewMode,
    (itemId, isSelected) => {
      if (mode === 'multi') {
        const current = selectedItems as string[];
        const newSelection = isSelected
          ? current.filter((id) => id !== itemId)
          : [...current, itemId];
        handleSelectionChange(null, newSelection);
      } else {
        handleSelectionChange(null, isSelected ? '' : itemId);
      }
    },
    isItemSelected
  );

  /**
   * Auto-Scroll Effect:
   * Ensures the focused item in the flat list is kept in sync with the selection,
   * keeping the active item visible when switching views.
   */
  React.useEffect(() => {
    if (viewMode !== 'flat' || !filteredFlatData.length || !selectedId) return;

    const index = filteredFlatData.findIndex(
      (item) => String(item.value) === selectedId
    );

    if (index !== -1) {
      setFocusedIndex(index);
    }
  }, [selectedId, viewMode, filteredFlatData, setFocusedIndex]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid #e0e0e0',
        bgcolor: '#fff',
      }}
    >
      <SearchHeader
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onClearSearch={clearSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        loading={isLoading}
      />

      {/* Main Content Area - Supports keyboard focus and navigation */}
      <Box
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="listbox"
        aria-activedescendant={`row-${focusedIndex}`}
        sx={{
          height: 400,
          borderRadius: 1,
          border: '1px solid #e0e0e0',
          bgcolor: '#fff',
          overflow: 'auto',
          outline: 'none',
        }}
      >
        {viewMode === 'tree' ? (
          <TreeView
            treeNodes={treeNodes}
            selectedItems={selectedItems}
            onSelectionChange={handleSelectionChange}
            expandedItems={expandedItems}
            onExpandedItemsChange={handleExpandedItemsChange}
            multiSelect={mode === 'multi'}
            searchTerm={debouncedSearchTerm}
            selectedId={selectedId}
          />
        ) : filteredFlatData.length > 0 ? (
          <FlatListView
            data={filteredFlatData}
            focusedIndex={focusedIndex}
            onSelect={(itemId, isSelected) => {
              if (mode === 'multi') {
                const current = selectedItems as string[];
                const newSelection = isSelected
                  ? current.filter((id) => id !== itemId)
                  : [...current, itemId];
                handleSelectionChange(null, newSelection);
              } else {
                handleSelectionChange(null, isSelected ? '' : itemId);
              }
            }}
            searchTerm={debouncedSearchTerm}
            isItemSelected={isItemSelected}
          />
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography variant="body2">
              No results found for &quot;{debouncedSearchTerm}&quot;
            </Typography>
          </Box>
        )}
      </Box>

      <SelectionSummary
        selectedIds={getSelectedTrainerIds()}
        onClear={clearSelection}
        mode={mode}
      />

      <StatsFooter
        viewMode={viewMode}
        treeNodesCount={treeNodes.length}
        flatOptionsCount={flatOptions.length}
        filteredCount={filteredFlatData.length}
        mode={mode}
      />
    </Paper>
  );
}
