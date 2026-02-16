import {
  IDashboardTrainer,
  ITreeNode,
  IFlatOption,
  HierarchyResult,
} from './types';

/**
 * Converts a database record into a UI Tree Node.
 */
function toTreeNode(trainer: IDashboardTrainer): ITreeNode {
  return {
    id: trainer.trainer_id,
    name: trainer.trainer_name,
    level: trainer.level,
    parentId: trainer.reporting_to,
  };
}

/**
 * Enriches a flat option with the name and level of its immediate parent.
 *
 * Performance Note:
 * This is performed once during the build phase (O(N)).
 * It allows the FlatListView to render rows in O(1) without needing
 * to traverse the tree or perform lookups during scroll events.
 */
function enrichFlatOption(
  option: IFlatOption,
  trainerMap: Map<number, IDashboardTrainer>
): IFlatOption {
  if (option.parentId) {
    const parent = trainerMap.get(option.parentId);
    if (parent) {
      option.parentName = parent.trainer_name;
      option.parentLevel = parent.level;
    }
  }
  return option;
}

/**
 * Builds the hierarchical structure from a flat list of trainers.
 *
 * Algorithm:
 * 1. Indexing: Create a map of all trainers for O(1) access.
 * 2. Grouping: Create an adjacency list (parent -> children).
 * 3. Tree Construction: Recursively build the tree starting from roots.
 * 4. Flattening: Simultaneously build a flat list optimized for search.
 * 5. Exclusion Handling: Remove the excluded trainer from the final list.
 * 6. Orphan Handling: Identify and attach disconnected nodes to the root level.
 */
export default function createTrainerHierarchy(
  trainers: IDashboardTrainer[],
  excludeUserId?: number
): HierarchyResult {
  // 1. Lookup maps
  const trainerMap = new Map(trainers.map((t) => [t.trainer_id, t]));
  const childrenMap = new Map<number, IDashboardTrainer[]>();

  // 2. Group by parentId (0 = root or null)
  trainers.forEach((trainer) => {
    const parentId = trainer.reporting_to ?? 0;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(trainer);
  });

  const tree: ITreeNode[] = [];
  const flatList: IFlatOption[] = [];

  // 3. Recursive builder
  const buildTree = (
    parentId: number | null,
    depth: number = 0
  ): ITreeNode[] => {
    const children = childrenMap.get(parentId ?? 0) || [];

    return children
      .sort((a, b) => {
        // Sort by level first, then name
        if (a.level !== b.level) return a.level - b.level;
        return a.trainer_name.localeCompare(b.trainer_name);
      })
      .map((child) => {
        const node = toTreeNode(child);
        const childNodes = buildTree(child.trainer_id, depth + 1);

        if (childNodes.length > 0) {
          node.children = childNodes;
        }

        // Create base flat option
        const flatOption: IFlatOption = {
          value: child.trainer_id,
          label: child.trainer_name,
          level: child.level,
          parentId: child.reporting_to,
        };

        // Enrich with parent info immediately
        flatList.push(enrichFlatOption(flatOption, trainerMap));

        return node;
      });
  };

  // 4. Start with root nodes (those with parentId 0 or null)
  let rootCandidates = childrenMap.get(0) || [];
 
  // 5. Exclusion Handling:
  // If an `excludeUserId` is provided:
  // - Remove the excluded trainer from the root candidates.
  // - Promote the excluded trainer's direct children to root level.
  // - Ensure no duplicates are introduced when merging.
  //
  // This preserves the visible hierarchy while preventing the excluded
  // trainer from appearing in the final tree structure.
  if (excludeUserId !== undefined) {
    // Remove the excluded user from roots
    rootCandidates = rootCandidates.filter(
      (t) => t.trainer_id !== excludeUserId
    );
    // Add the excluded user's direct children as additional roots
    const excludedUserChildren = childrenMap.get(excludeUserId) || [];
    const existingIds = new Set(rootCandidates.map((t) => t.trainer_id));
    const newChildren = excludedUserChildren.filter(
      (child) => !existingIds.has(child.trainer_id)
    );
    rootCandidates = [...rootCandidates, ...newChildren];
  }
 
  const roots = rootCandidates.sort((a, b) =>
    a.trainer_name.localeCompare(b.trainer_name)
  );

  roots.forEach((root) => {
    const rootNode = toTreeNode(root);
    const childNodes = buildTree(root.trainer_id, 1);

    if (childNodes.length > 0) {
      rootNode.children = childNodes;
    }

    tree.push(rootNode);

    // Add root to flat list (no parent enrichment needed)
    flatList.push({
      value: root.trainer_id,
      label: root.trainer_name,
      level: root.level,
      parentId: root.reporting_to,
    });
  });

  // 6. Orphan handling – any trainer not yet added becomes a root.
  // This ensures data integrity even if the database has broken relationships.
  const addedIds = new Set(flatList.map((item) => item.value));
  let orphans = trainers.filter((t) => !addedIds.has(t.trainer_id));

 // Prevent the excluded trainer from being reintroduced during orphan handling.
  if (excludeUserId !== undefined) {
    orphans = orphans.filter((t) => t.trainer_id !== excludeUserId);
  }

  orphans.forEach((orphan) => {
    const node = toTreeNode(orphan);
    tree.push(node);

    flatList.push(
      enrichFlatOption(
        {
          value: orphan.trainer_id,
          label: orphan.trainer_name,
          level: orphan.level,
          parentId: orphan.reporting_to,
        },
        trainerMap
      )
    );
  });

  return { tree, flatList };
}
