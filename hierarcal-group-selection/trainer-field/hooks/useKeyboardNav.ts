import React, { useState, useEffect, useCallback } from 'react';
import { IFlatOption } from '../../makeHierarchicalTrainerOptions/types';

/**
 * Custom hook for keyboard accessibility in the Flat List view.
 *
 * Accessibility Features:
 * - Arrow Up/Down: Navigates the focus highlight through the list.
 * - Enter: Selects the currently focused item.
 * - State Management: Resets focus when the list data changes (e.g., after filtering).
 */
export default function useKeyboardNav(
  filteredData: IFlatOption[],
  viewMode: 'tree' | 'flat',
  onSelect: (itemId: string, isSelected: boolean) => void,
  isItemSelected: (itemId: string) => boolean
) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Reset focus to the top whenever the underlying data changes (e.g. search filter).
  useEffect(() => {
    setFocusedIndex(0);
  }, [filteredData]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Keyboard nav is only active in Flat view and when items exist.
      if (viewMode !== 'flat' || !filteredData.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault(); // Prevent native browser scrolling
          setFocusedIndex((prev) =>
            Math.min(prev + 1, filteredData.length - 1)
          );
          break;
        case 'ArrowUp':
          e.preventDefault(); // Prevent native browser scrolling
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredData[focusedIndex]) {
            const item = filteredData[focusedIndex];
            const itemId = String(item.value);
            // Toggle selection state
            onSelect(itemId, isItemSelected(itemId));
          }
          break;
        default:
          break; // Do nothing for other keys
      }
    },
    [viewMode, filteredData, focusedIndex, onSelect, isItemSelected]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
  };
}
