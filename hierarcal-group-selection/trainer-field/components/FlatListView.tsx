import React, { useEffect, useCallback } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import {
  List,
  RowComponentProps,
  useDynamicRowHeight,
  useListRef,
} from 'react-window';
import { IFlatOption } from '../../makeHierarchicalTrainerOptions/types';
import highlightText from '../utils/highlightText';
import { FlatListViewProps } from '../types';

/**
 * Renders a flattened list of trainers using Virtualization (react-window).
 *
 * Why Virtualization?
 * We are potentially rendering hundreds or thousands of nodes. Virtualization
 * ensures that only the visible rows are rendered to the DOM, keeping the
 * UI responsive and memory usage low.
 */
const FlatListView: React.FC<FlatListViewProps> = ({
  data,
  focusedIndex,
  onSelect,
  searchTerm,
  isItemSelected,
}) => {
  console.log(data);
  const listRef = useListRef(null);
  const rowHeight = useDynamicRowHeight({ defaultRowHeight: 50 });

  // Sync scroll position: Ensure the keyboard-focused item is always visible.
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToRow({
        index: focusedIndex,
        align: 'auto',
        behavior: 'auto',
      });
    }
  }, [focusedIndex]);

  const FlatListRow = useCallback(
    ({
      index,
      style,
      rowData,
    }: RowComponentProps<{
      rowData: IFlatOption[];
    }>) => {
      const item = rowData[index];
      if (!item) return null;

      const itemId = String(item.value);
      const isFocused = index === focusedIndex;
      const isSelected = isItemSelected(itemId);

      return (
        <Box
          id={`row-${index}`}
          style={style}
          onClick={() => onSelect(itemId, isSelected)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            fontSize: 14,
            borderBottom: '1px solid #f1f3f4',
            cursor: 'pointer',
            position: 'relative',
            // eslint-disable-next-line no-nested-ternary
            backgroundColor: isSelected
              ? '#e8f0fe'
              : isFocused
                ? '#f1f3f4'
                : '#fff',
            '&:hover': {
              backgroundColor: isSelected ? '#d2e3fc' : '#f8f9fa',
            },
          }}
        >
          {/* Left Selection Indicator */}
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              backgroundColor: isSelected ? '#1a73e8' : 'transparent',
            }}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ fontWeight: 500, color: '#202124' }}>
              {highlightText(item.label, searchTerm)}
            </Typography>

            {item.parentName && (
              <Typography sx={{ fontSize: 12, color: '#5f6368' }}>
                Reports to: {item.parentName} (Level {item.parentLevel})
              </Typography>
            )}
          </Box>

          <Chip
            label={highlightText(`Level ${item.level}`, searchTerm)}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              borderRadius: 1,
              backgroundColor: '#f1f3f4',
              color: '#5f6368',
            }}
          />
        </Box>
      );
    },
    [data, focusedIndex, isItemSelected, onSelect, searchTerm]
  );

  return (
    <List
      listRef={listRef}
      rowHeight={rowHeight}
      rowCount={data.length}
      rowComponent={FlatListRow}
      rowProps={{
        rowData: data,
      }}
      overscanCount={5}
    />
  );
};

export default FlatListView;
