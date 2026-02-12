import React, { useCallback } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import { ITreeNode } from '../../makeHierarchicalTrainerOptions/types';
import highlightText from '../utils/highlightText';
import { TreeViewProps } from '../types';
import useReorderTree from '../hooks/useReorderTree';

/**
 * Renders the hierarchical tree structure of trainers.
 *
 * Features:
 * - Recursive rendering of nodes to arbitrary depth.
 * - Smart Reordering: Delegates sorting logic to `useReorderTree` to ensure
 *   selected branches appear at the top.
 * - Search Highlighting: Highlights matching text within node labels.
 */
const TreeView: React.FC<TreeViewProps> = ({
  treeNodes,
  selectedItems,
  onSelectionChange,
  expandedItems,
  onExpandedItemsChange,
  multiSelect,
  searchTerm,
  selectedId,
}) => {
  /**
   * UX Improvement:
   * We reorder the tree data so that the branch containing the currently selected
   * item is moved to the top of the list. This prevents the user from losing context
   * in large trees.
   */
  const reorderedTreeNodes = useReorderTree(treeNodes, selectedId);

  /**
   * Recursive function to generate TreeItems.
   */
  const renderTree = useCallback(
    (nodes: ITreeNode[]): React.ReactNode => {
      return nodes.map((node) => {
        const itemId = String(node.id);
        const label = (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">
              {highlightText(node.name, searchTerm)}
            </Typography>
            <Chip
              label={`Level ${node.level}`}
              size="small"
              color={
                // eslint-disable-next-line no-nested-ternary
                node.level === 1
                  ? 'primary'
                  : node.level === 2
                    ? 'secondary'
                    : 'default'
              }
              sx={{ height: 20, fontSize: '0.7rem', minWidth: 60 }}
            />
          </Box>
        );

        return (
          <TreeItem key={itemId} itemId={itemId} label={label}>
            {node.children?.length ? renderTree(node.children) : null}
          </TreeItem>
        );
      });
    },
    [searchTerm]
  );

  if (!treeNodes.length) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No trainers available
        </Typography>
      </Box>
    );
  }

  return (
    <SimpleTreeView
      checkboxSelection
      multiSelect={multiSelect}
      selectedItems={selectedItems}
      onSelectedItemsChange={onSelectionChange}
      expandedItems={expandedItems}
      onExpandedItemsChange={onExpandedItemsChange}
      sx={{
        height: '100%',
        p: 1,
        '& .MuiTreeItem-content': {
          py: 0.5,
          minHeight: 36,
          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
        },
      }}
    >
      {renderTree(reorderedTreeNodes)}
    </SimpleTreeView>
  );
};

export default TreeView;
