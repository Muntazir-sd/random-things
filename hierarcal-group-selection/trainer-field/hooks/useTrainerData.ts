import { useMemo } from 'react';
import createTrainerHierarchy from '@/utils/makeHierarchicalTrainerOptions/hierarchyBuilder';
import {
  IDashboardTrainer,
  IFlatOption,
  ITreeNode,
} from '../../makeHierarchicalTrainerOptions/types';

interface UseTrainerDataReturn {
  treeNodes: ITreeNode[];
  flatOptions: IFlatOption[];
  // trainerMap: Map<number, string>;
  adminNodeIds: string[];
  isLoading: boolean;
}

/**
 * Custom hook to transform raw trainer data into usable UI structures.
 *
 * Responsibilities:
 * 1. Converts flat database records into a nested Tree structure.
 * 2. Generates an enriched Flat list optimized for searching.
 * 3. Identifies top-level Admin nodes to support default tree expansion.
 *
 * @param trainers - Raw array of trainer objects.
 * @param loading - External loading state.
 * @param excludeUserId - Specific trainer that we dont want to display but is used in creating a hirarchy.
 */
export default function useTrainerData(
  trainers: IDashboardTrainer[],
  loading: boolean,
  excludeUserId?: number
): UseTrainerDataReturn {
  // Memoize the hierarchy build process as it is computationally expensive (O(n log n)).
  // We use the helper utility 'createTrainerHierarchy' to keep the hook logic clean.
  const { treeNodes, flatOptions } = useMemo(() => {
    if (!trainers.length || loading) {
      return { treeNodes: [], flatOptions: [] };
    }

    try {
      const { tree, flatList } = createTrainerHierarchy(
        trainers,
        excludeUserId
      );
      return { treeNodes: tree, flatOptions: flatList };
    } catch (error) {
      console.error('Error building trainer hierarchy:', error);
      return { treeNodes: [], flatOptions: [] };
    }
  }, [trainers, loading]);

  // Extract Admin IDs (top-level nodes) to determine default expansion state.
  const adminNodeIds = useMemo(
    () =>
      treeNodes
        .filter((node) => node.level === 1)
        .map((node) => String(node.id)),
    [treeNodes]
  );

  return {
    treeNodes,
    flatOptions,
    adminNodeIds,
    isLoading: loading || trainers.length === 0,
  };
}
