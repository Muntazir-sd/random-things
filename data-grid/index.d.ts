import { IFieldConfig, BaseRow } from '@/types';
import { GridRowModesModel } from '@mui/x-data-grid';
import React from 'react';

// Extend GridSlots to include toolbar props
declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides {
    onAdd: () => void;
    onSaveAll: () => void;
    hasDirty: boolean;

    setRows: React.Dispatch<React.SetStateAction<BaseRow[]>>;
    setRowModesModel: React.Dispatch<React.SetStateAction<GridRowModesModel>>;
    fieldConfigs: IFieldConfig[];

    // for download csv
    programmeId: number;
    programmeName: string;
    createdBy: number;
    batchNumber: string;
  }
}
