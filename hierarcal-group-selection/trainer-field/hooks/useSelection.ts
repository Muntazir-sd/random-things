import { useState, useEffect, useCallback } from 'react';
import { TreeViewProps } from '../types';

/**
 * Custom hook to manage selection state.
 *
 * Abstraction Layer:
 * This hook handles the complexity of supporting both 'single' and 'multi'
 * selection modes within the same component, normalizing the internal state
 * and dispatching the correct callbacks to the parent.
 */
export default function useSelection(
  mode: 'single' | 'multi',
  value: number | null,
  selectedIds: number[],
  onChange: (trainerId: number | null) => void,
  onMultiChange?: (ids: number[]) => void
) {
  // Internal state manages immediate UI updates for responsiveness.
  // Stores values as strings to match MUI TreeView requirements.
  const [selectedItems, setSelectedItems] = useState<string | string[]>(
    // eslint-disable-next-line no-nested-ternary
    mode === 'multi' ? selectedIds.map(String) : value ? String(value) : ''
  );

  // Sync internal state when parent props change (Controlled Component pattern).
  useEffect(() => {
    if (mode === 'multi') {
      setSelectedItems(selectedIds.map(String));
    } else {
      setSelectedItems(value ? String(value) : '');
    }
  }, [value, selectedIds, mode]);

  // Unified handler for TreeView selection changes.
  const handleSelectionChange = useCallback<TreeViewProps['onSelectionChange']>(
    (_event, itemIds) => {
      if (!itemIds) return;

      setSelectedItems(itemIds);

      // Branch logic based on mode to call the correct parent callback.
      if (mode === 'multi' && onMultiChange) {
        const ids = (itemIds as string[]).map(Number);
        onMultiChange(ids);
      } else if (mode === 'single') {
        const id = itemIds ? Number(itemIds) : null;
        onChange(id);
      }
    },
    [mode, onChange, onMultiChange]
  );

  const clearSelection = useCallback(() => {
    if (mode === 'single') {
      handleSelectionChange(null, '');
    } else if (onMultiChange) {
      onMultiChange([]);
    }
  }, [mode, handleSelectionChange, onMultiChange]);

  // Helper to convert internal string state back to numbers for external consumption.
  const getSelectedTrainerIds = useCallback((): number[] => {
    if (mode === 'single') {
      return selectedItems ? [Number(selectedItems)] : [];
    }
    return (selectedItems as string[]).map(Number);
  }, [mode, selectedItems]);

  // Helper to check selection status for a specific item ID.
  const isItemSelected = useCallback(
    (itemId: string): boolean => {
      if (mode === 'multi') {
        return (selectedItems as string[]).includes(itemId);
      }
      return selectedItems === itemId;
    },
    [mode, selectedItems]
  );

  return {
    selectedItems,
    handleSelectionChange,
    clearSelection,
    getSelectedTrainerIds,
    isItemSelected,
  };
}
