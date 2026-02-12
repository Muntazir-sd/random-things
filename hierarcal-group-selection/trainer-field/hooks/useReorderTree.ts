import { useMemo } from 'react';
import { ITreeNode } from '../../makeHierarchicalTrainerOptions/types';

/**
 * Custom hook to reorder the tree structure.
 *
 * Purpose:
 * Improves User Experience (UX) by moving the branch containing the currently
 * selected item to the top of the list. This ensures the user's selection
 * is immediately visible without needing to scroll, which is critical for
 * deep or large hierarchies.
 *
 * Optimization:
 * Uses a two-pass approach to avoid repeated recursive searching during the sort phase.
 * 1. Pass 1: Identify the full path of ancestor IDs for the selected node.
 * 2. Pass 2: Sort nodes at every level, prioritizing those in the identified path.
 *
 * @param treeNodes - The original hierarchical data.
 * @param selectedId - The ID of the currently selected node.
 */
export default function useReorderTree(
  treeNodes: ITreeNode[],
  selectedId: string | null
) {
  return useMemo(() => {
    // Optimization: If nothing is selected, return the original tree order immediately.
    if (!selectedId) return treeNodes;

    // Set used for O(1) lookups during the sort phase.
    const selectedPath = new Set<string>();

    /**
     * Step 1: Path Discovery.
     * Performs a Depth-First Search (DFS) to find the selected node.
     * Once found, marks all nodes in the traversal path as "active".
     */
    const findPath = (nodes: ITreeNode[]): boolean => {
      return nodes.some((node) => {
        // Check if this node is the target
        if (String(node.id) === selectedId) {
          selectedPath.add(String(node.id));
          return true;
        }

        // Recursively check children
        if (node.children?.length) {
          if (findPath(node.children)) {
            // If the target is found in this branch, add current node to path (it's an ancestor)
            selectedPath.add(String(node.id));
            return true;
          }
        }
        return false;
      });
    };

    findPath(treeNodes);

    /**
     * Step 2: Reordering.
     * Recursively sorts nodes at every level. Nodes that are part of the
     * 'selectedPath' are moved to the top (-1), ensuring the active branch bubbles up.
     */
    const reorder = (nodes: ITreeNode[]): ITreeNode[] => {
      return [...nodes]
        .sort((a, b) => {
          const aInPath = selectedPath.has(String(a.id));
          const bInPath = selectedPath.has(String(b.id));

          // Prioritize nodes that lead to the selection
          if (aInPath && !bInPath) return -1;
          if (!aInPath && bInPath) return 1;
          return 0; // Maintain original relative order for peers
        })
        .map((node) => ({
          ...node,
          // Recursively reorder children to ensure deep sorting
          children: node.children ? reorder(node.children) : node.children,
        }));
    };

    return reorder(treeNodes);
  }, [treeNodes, selectedId]);
}
