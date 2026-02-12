import React from 'react';
import {
  IDashboardTrainer,
  IFlatOption,
  ITreeNode,
} from '../makeHierarchicalTrainerOptions/types';
import { ViewModeType } from './constants';

export interface TrainerFieldProps {
  trainers: IDashboardTrainer[];
  loading?: boolean;
  /** Currently selected value (Single Select Mode). */
  value: number | null;
  /** Callback for value changes (Single Select Mode). */
  onChange: (trainerId: number | null) => void;
  mode?: 'single' | 'multi';
  /** Currently selected values (Multi Select Mode). */
  selectedIds?: number[];
  /** Callback for value changes (Multi Select Mode). */
  onMultiChange?: (ids: number[]) => void;
}

export interface SelectionSummaryProps {
  selectedIds: number[];
  selectedTrainers: Map<number, string>;
  onClear: () => void;
  mode: 'single' | 'multi';
}

export interface FlatListViewProps {
  data: IFlatOption[];
  focusedIndex: number;
  onSelect: (itemId: string, isSelected: boolean) => void;
  searchTerm: string;
  isItemSelected: (itemId: string) => boolean;
}

export interface FlatListRowProps {
  index: number;
  style: React.CSSProperties;
  data: IFlatOption[];
  selectedItems: string | string[];
  mode: 'single' | 'multi';
  focusedIndex: number;
  onSelect: (itemId: string, isSelected: boolean) => void;
  highlightText: (text: string, highlight: string) => React.ReactNode;
  searchTerm: string;
}

export interface TreeViewProps {
  treeNodes: ITreeNode[];
  selectedItems: string | string[];
  onSelectionChange: (
    event: React.SyntheticEvent | null,
    itemIds: string | string[] | null
  ) => void;
  expandedItems: string[];
  onExpandedItemsChange: (
    event: React.SyntheticEvent | null,
    itemIds: string[]
  ) => void;
  multiSelect: boolean;
  searchTerm: string;
  selectedId: string | null;
}

export interface StatsFooterProps {
  viewMode: ViewModeType;
  treeNodesCount: number;
  flatOptionsCount: number;
  filteredCount: number;
  mode: 'single' | 'multi';
}

export interface SearchHeaderProps {
  searchTerm: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  viewMode: ViewModeType;
  onViewModeChange: (mode: ViewModeType) => void;
  loading?: boolean;
}
