import { ITreeNode } from '../../makeHierarchicalTrainerOptions/types';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'trainer-tree-expansion';

/**
 * Custom hook to manage the expansion state of the Tree View.
 *
 * Key Features:
 * 1. Persistence: Saves expanded nodes to localStorage to preserve state across reloads.
 * 2. Auto-Expansion (Selection): Automatically expands the hierarchy path to a selected item.
 * 3. Auto-Expansion (Search): Expands all branches that contain search term matches.
 */
export default function useExpansion(
  treeNodes: ITreeNode[],
  adminNodeIds: string[],
  selectedId: string | null,
  searchTerm: string
) {
  // Initialize state from localStorage if available.
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist state changes to localStorage.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expandedItems));
  }, [expandedItems]);

  // Initial Load: Expand all Admins (top level) if no previous state exists.
  useEffect(() => {
    if (adminNodeIds.length > 0 && expandedItems.length === 0) {
      setExpandedItems(adminNodeIds);
    }
  }, [adminNodeIds, expandedItems]);

  /**
   * Pre-calculate Parent Map (Child ID -> Parent ID).
   *
   * Why:
   * To automatically expand the tree to show a selected item, we need to know its ancestors.
   * Since the tree structure is recursive and potentially deep (arbitrary levels),
   * a flat lookup map allows us to trace the path from any node back to the root efficiently.
   */
  const parentMap = useMemo(() => {
    const map = new Map<string, string>();

    const build = (nodes: ITreeNode[], parentId?: string) => {
      nodes.forEach((node) => {
        if (parentId) {
          map.set(String(node.id), parentId);
        }
        if (node.children?.length) {
          build(node.children, String(node.id));
        }
      });
    };

    build(treeNodes);
    return map;
  }, [treeNodes]);

  /**
   * Auto-Expansion Logic for Selection.
   *
   * When `selectedId` changes, we trace up the `parentMap` to find all ancestor IDs
   * and ensure they are added to the `expandedItems` list so the user can see their selection.
   */
  useEffect(() => {
    if (!selectedId) return;

    const ancestors: string[] = [];
    let currentId = selectedId;

    // Traverse upwards until we hit a root (no parent in map)
    while (parentMap.has(currentId)) {
      const parentId = parentMap.get(currentId)!;
      ancestors.push(parentId);
      currentId = parentId;
    }

    if (ancestors.length) {
      setExpandedItems((prev) => [...new Set([...prev, ...ancestors])]);
    }
  }, [selectedId, parentMap]);

  // Search Logic: Recursively find nodes matching the search term and expand their parents.
  useEffect(() => {
    if (!searchTerm.trim()) return;

    const matchingIds = new Set<string>();
    const collectMatchingBranches = (
      nodes: ITreeNode[],
      parentIds: string[] = []
    ) => {
      nodes.forEach((node) => {
        const matches =
          node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `level ${node.level}`.includes(searchTerm.toLowerCase()) ||
          String(node.id).includes(searchTerm);

        if (matches) {
          parentIds.forEach((id) => matchingIds.add(id));
          matchingIds.add(String(node.id));
        }

        if (node.children) {
          collectMatchingBranches(node.children, [
            ...parentIds,
            String(node.id),
          ]);
        }
      });
    };

    collectMatchingBranches(treeNodes);
    setExpandedItems(Array.from(matchingIds));
  }, [searchTerm, treeNodes]);

  const handleExpandedItemsChange = useCallback(
    (event: React.SyntheticEvent | null, itemIds: string[]) => {
      setExpandedItems(itemIds);
    },
    []
  );

  return {
    expandedItems,
    setExpandedItems,
    handleExpandedItemsChange,
  };
}
