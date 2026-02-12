/**
 * Domain interface representing a Trainer from the database.
 */
export interface IDashboardTrainer {
  trainer_id: number;
  trainer_name: string;
  reporting_to: number | null;
  /**
   * Numeric hierarchy level.
   * 1 = Admin, 2 = Supervisor, 3 = Trainer, etc.
   * Supports arbitrary depth.
   */
  level: number;
}

/**
 * Recursive structure for rendering the Tree View.
 */
export interface ITreeNode {
  id: number;
  name: string;
  /** Numeric level (1 = root). */
  level: number;
  children?: ITreeNode[];
  parentId: number | null;
}

/**
 * Flattened structure optimized for virtualization and searching.
 */
export interface IFlatOption {
  value: number;
  /** Indented label for display */
  label: string;
  /** Depth in the tree (0-based or 1-based depending on usage) */
  level: number;
  parentId: number | null;

  /**
   * Enriched Data: Name of the immediate parent.
   * Pre-calculated to allow O(1) access during rendering.
   */
  parentName?: string;
  /** Enriched Data: Level of the immediate parent. */
  parentLevel?: number;
}

/**
 * Return type for the hierarchy builder utility.
 */
export interface HierarchyResult {
  tree: ITreeNode[];
  flatList: IFlatOption[];
}
