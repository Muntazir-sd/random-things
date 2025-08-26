'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import {
  DataGrid,
  GridColDef,
  GridRowModesModel,
  GridRowModes,
  GridActionsCellItem,
  GridEventListener,
  GridRowId,
  GridRowEditStopReasons,
  GridRowSelectionModel,
  GridPaginationModel,
  useGridApiRef,
} from '@mui/x-data-grid';
import { Alert, Button, LinearProgress, Tooltip } from '@mui/material';

import { AppActionType, IFieldConfig, BaseRow } from '@/types';
import { createProgrammeDataForCanvasByProgrammeId } from '@/action/canvas';
import { useQueryClient } from '@tanstack/react-query';
import useSnakberContext from '@/context/AppProvider/useSnakberContext';

import IconButtonModal from '@/components/IconButtonModel';
import { GetCurrentUserContext } from '@/context/User/GetCurrentUserContext';
import { ProgrammeConfigContext } from './ProgrammeConfigContext';
import BuildColumns from './BuildColumns';
import GridToolbarX from './GridToolbarX';
import { ProgrammeRowsPaginatedContext } from './ProgrammeRowContext';
import normalizeRowsUsingSchema from './inferAndNormalize';
import ConfirmRowDelete from './ConfirmRowDelete';

/**
 * Cast client-side values to the server's expected shape based on field input type.
 * @param {IFieldConfig['input_type']} type - Field input type
 * @param {*} value - Current value from the grid
 * @returns {*} Normalized value for server payload
 */
const toServerValue = (type: IFieldConfig['input_type'], value: any): any => {
  switch (type) {
    case 'checkbox': {
      if (value == null || value === '') return [];
      return Array.isArray(value) ? value : [value];
    }
    case 'number':
      return value === '' || value == null ? null : Number(value);
    case 'date':
      return value || null; // assume yyyy-mm-dd
    default:
      return value;
  }
};

/**
 * Convert a row object into a server payload keyed by `field_name`.
 * @param {BaseRow} row - Grid row
 * @param {IFieldConfig[]} schema - Field configuration schema
 * @returns {Record<string, unknown>} Server-ready key/value map
 */
const toServerRow = (
  row: BaseRow,
  schema: IFieldConfig[]
): Record<string, unknown> => {
  return schema.reduce<Record<string, unknown>>((accumulator, field) => {
    const key = field.field_name;
    if (!key) return accumulator;
    const value = (row as any)[key];
    accumulator[key] = toServerValue(field.input_type, value);
    return accumulator;
  }, {});
};

/**
 * Generate a temporary id for local-only rows (not saved to server yet).
 * @returns {string} temp id
 */
const makeTempId = (): string =>
  `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export default function DynamicDataGrid({
  programmeId,
  batchNumber,
  createdBy,
  onEditingChange,
}: {
  programmeId: number;
  batchNumber: string;
  createdBy: number;
  onEditingChange: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const apiRef = useGridApiRef();

  // ---------- configuration (columns) ----------
  const {
    fieldConfigs: fieldSchema,
    programmeName,
    isLoading: isConfigLoading,
    errorMessage: configErrorMessage,
    refetch: refetchConfig,
  } = React.use(ProgrammeConfigContext);

  // ---------- server rows (pagination) ----------
  const {
    paginatedQuery: {
      data: pagedRowsResult,
      isLoading: isRowsLoading,
      page,
      limit,
      setQueryParam,
    },
  } = React.use(ProgrammeRowsPaginatedContext);
  const { data: currData } = React.use(GetCurrentUserContext);

  const isLoading = isConfigLoading;
  const errorMessage = configErrorMessage;
  const refetch = () => refetchConfig();

  const { dispatch } = useSnakberContext();
  const queryClient = useQueryClient();

  /**
   * Normalize server results to consistent objects keyed by `field_name`.
   */
  const gridNormalizedRows = React.useMemo(() => {
    return normalizeRowsUsingSchema(
      pagedRowsResult.results ?? [],
      fieldSchema,
      { stableKeyCandidates: ['id'] }
    );
  }, [pagedRowsResult?.results, fieldSchema]);

  /**
   * Snapshot original rows from server to detect changes later.
   * Map<rowId, originalRow>
   */
  const originalRowSnapshotByIdRef = React.useRef<Map<GridRowId, BaseRow>>(
    new Map()
  );

  React.useEffect(() => {
    gridNormalizedRows.forEach((row) => {
      if (!originalRowSnapshotByIdRef.current.has(row.id)) {
        originalRowSnapshotByIdRef.current.set(row.id, { ...row });
      }
    });
  }, [gridNormalizedRows]);

  /**
   * Cross-page local state for unsaved work:
   * - draftRowsById: edits/new rows pending save
   * - pendingDeletionIds: ids marked for delete (optimistic)
   */
  const [draftRowsById, setDraftRowsById] = React.useState<
    Map<GridRowId, BaseRow>
  >(new Map());
  const [pendingDeletionIds, setPendingDeletionIds] = React.useState<
    Set<GridRowId>
  >(new Set());

  /**
   * DataGrid per-row edit/view modes.
   */
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>(
    {}
  );

  /**
   * Is any row currently in edit mode?
   */
  const isAnyRowInEdit = React.useMemo(
    () =>
      Object.values(rowModesModel).some((m) => m?.mode === GridRowModes.Edit),
    [rowModesModel]
  );

  /**
   * Notify parent whenever edit state toggles
   */
  React.useEffect(() => {
    onEditingChange?.(isAnyRowInEdit);
  }, [isAnyRowInEdit, onEditingChange]);

  /**
   * Row selection model (kept compatible with the rest of your app).
   */
  const [rowSelectionModel, setRowSelectionModel] =
    React.useState<GridRowSelectionModel>({ ids: new Set(), type: 'include' });

  /**
   * Compute the rows shown in the grid from:
   * - local new rows (not deleted)
   * - current page rows, overridden by drafts (not deleted)
   */
  const gridRows = React.useMemo(() => {
    const localNewRows = Array.from(draftRowsById.values()).filter(
      (row) => row.isNew && !pendingDeletionIds.has(row.id)
    );
    const currentPageRows = gridNormalizedRows
      .filter((row) => !pendingDeletionIds.has(row.id))
      .map((row) => draftRowsById.get(row.id) ?? row);
    return [...localNewRows, ...currentPageRows];
  }, [draftRowsById, pendingDeletionIds, gridNormalizedRows]);

  /**
   * Adjust rowCount for server pagination to reflect local adds/deletes.
   */
  const computedRowCount = React.useMemo(() => {
    const localNewCount = Array.from(draftRowsById.values()).filter(
      (row) => row.isNew
    ).length;
    const deletedExistingCount = Array.from(pendingDeletionIds).filter(
      (rowId) => !draftRowsById.get(rowId)?.isNew
    ).length;
    return (
      (pagedRowsResult.totalCount ?? 0) + localNewCount - deletedExistingCount
    );
  }, [draftRowsById, pendingDeletionIds, pagedRowsResult.totalCount]);

  /**
   * Keep edit active when focus leaves the row (DataGrid default ends edit).
   * @type {GridEventListener<'rowEditStop'>}
   */
  const handleRowEditStop: GridEventListener<'rowEditStop'> = (
    params,
    event
  ) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  /**
   * Enter edit mode for a row and capture a draft snapshot if needed.
   * @param {GridRowId} rowId
   */
  const startEditRow = (rowId: GridRowId) => () => {
    setRowModesModel((prevModel) => ({
      ...prevModel,
      [rowId]: { mode: GridRowModes.Edit },
    }));
    setDraftRowsById((prevDrafts) => {
      if (prevDrafts.has(rowId)) return prevDrafts;
      const currentRow = gridRows.find((row) => row.id === rowId);
      return currentRow
        ? new Map(prevDrafts).set(rowId, { ...currentRow })
        : prevDrafts;
    });
  };

  /**
   * Save a single row: commit, diff vs original, send minimal payload.
   * @param {GridRowId} rowId
   */
  const saveSingleRow = (rowId: GridRowId) => async () => {
    apiRef.current?.stopRowEditMode({ id: rowId, ignoreModifications: false });
    await new Promise(requestAnimationFrame);

    const latestRow = apiRef.current?.getRow(rowId) as BaseRow | undefined;
    if (!latestRow) return;

    let submittedData:
      | Array<{ _action: 'insert' } & Record<string, unknown>>
      | Array<{ _action: 'update'; id: GridRowId } & Record<string, unknown>> =
      [];

    if (latestRow.isNew) {
      submittedData = [
        { _action: 'insert', ...toServerRow(latestRow, fieldSchema) },
      ];
    } else {
      const originalRow = originalRowSnapshotByIdRef.current.get(rowId);
      const currentPayload = toServerRow(latestRow, fieldSchema);
      const originalPayload = originalRow
        ? toServerRow(originalRow, fieldSchema)
        : null;

      if (
        !originalPayload ||
        JSON.stringify(currentPayload) !== JSON.stringify(originalPayload)
      ) {
        submittedData = [{ _action: 'update', id: rowId, ...currentPayload }];
      }
    }

    if (submittedData.length === 0) {
      setDraftRowsById((prevDrafts) => {
        const nextDrafts = new Map(prevDrafts);
        nextDrafts.delete(rowId);
        return nextDrafts;
      });
      return;
    }

    const response = await createProgrammeDataForCanvasByProgrammeId(
      programmeId,
      { batch_number: batchNumber, submittedData }
    );

    if ('error' in response) {
      dispatch({
        type: AppActionType.ADD_ALERT,
        payload: { message: response.message || response.error, type: 'error' },
      });
      return;
    }

    setDraftRowsById((prevDrafts) => {
      const nextDrafts = new Map(prevDrafts);
      nextDrafts.delete(rowId);
      return nextDrafts;
    });
    originalRowSnapshotByIdRef.current.delete(rowId);

    queryClient.invalidateQueries({
      queryKey: [
        `programmeRowsData-${programmeId}-${batchNumber}-${createdBy}`,
      ],
    });
    queryClient.invalidateQueries({ queryKey: ['getAllBatchDetails'] });
    queryClient.invalidateQueries({
      queryKey: [`getBatchDetailsByUserId-${currData.data.userid}`],
    });
    queryClient.invalidateQueries({
      queryKey: ['GridBatchAttendanceDataDownloadCsv'],
    });
    queryClient.invalidateQueries({
      queryKey: ['GridDataDownloadCsv'],
    });

    dispatch({
      type: AppActionType.ADD_ALERT,
      payload: { message: 'Row saved', type: 'success' },
    });
  };

  /**
   * Delete handler for a row (local-only vs server-backed; optimistic).
   * @param {GridRowId} rowId
   */
  const deleteRowHandler = (rowId: GridRowId) => async () => {
    const currentMode = rowModesModel[rowId]?.mode;
    if (currentMode === GridRowModes.Edit) {
      apiRef.current?.stopRowEditMode({ id: rowId, ignoreModifications: true });
      await new Promise(requestAnimationFrame);
    }

    const rowInGrid = apiRef.current?.getRow(rowId) as BaseRow | undefined;
    const isLocalNew = Boolean(
      draftRowsById.get(rowId)?.isNew || rowInGrid?.isNew
    );

    if (isLocalNew) {
      setDraftRowsById((prevDrafts) => {
        const nextDrafts = new Map(prevDrafts);
        nextDrafts.delete(rowId);
        return nextDrafts;
      });
      setPendingDeletionIds((prevIds) => {
        const nextIds = new Set(prevIds);
        nextIds.delete(rowId);
        return nextIds;
      });
      setRowModesModel((prevModel) => {
        const nextModel = { ...prevModel };
        delete nextModel[rowId];
        return nextModel;
      });
      return;
    }

    setDraftRowsById((prevDrafts) => {
      const nextDrafts = new Map(prevDrafts);
      nextDrafts.delete(rowId);
      return nextDrafts;
    });
    setPendingDeletionIds((prevIds) => {
      const nextIds = new Set(prevIds);
      nextIds.add(rowId);
      return nextIds;
    });

    const submittedData = [{ _action: 'delete' as const, id: rowId }];
    const response = await createProgrammeDataForCanvasByProgrammeId(
      programmeId,
      { batch_number: batchNumber, submittedData }
    );

    if ('error' in response) {
      setPendingDeletionIds((prevIds) => {
        const nextIds = new Set(prevIds);
        nextIds.delete(rowId);
        return nextIds;
      });
      dispatch({
        type: AppActionType.ADD_ALERT,
        payload: { message: response.message || response.error, type: 'error' },
      });
      return;
    }

    originalRowSnapshotByIdRef.current.delete(rowId);

    queryClient.invalidateQueries({
      queryKey: [
        `programmeRowsData-${programmeId}-${batchNumber}-${createdBy}`,
      ],
    });
    queryClient.invalidateQueries({ queryKey: ['getAllBatchDetails'] });
    queryClient.invalidateQueries({
      queryKey: [`getBatchDetailsByUserId-${currData.data.userid}`],
    });
    queryClient.invalidateQueries({
      queryKey: ['GridBatchAttendanceDataDownloadCsv'],
    });
    queryClient.invalidateQueries({
      queryKey: ['GridDataDownloadCsv'],
    });

    dispatch({
      type: AppActionType.ADD_ALERT,
      payload: { message: 'Row deleted', type: 'success' },
    });
  };

  /**
   * Cancel editing a row and revert UI state.
   * @param {GridRowId} rowId
   */
  const cancelEditRow = (rowId: GridRowId) => () => {
    setRowModesModel((prevModel) => ({
      ...prevModel,
      [rowId]: { mode: GridRowModes.View, ignoreModifications: true },
    }));
    setDraftRowsById((prevDrafts) => {
      const nextDrafts = new Map(prevDrafts);
      nextDrafts.delete(rowId);
      return nextDrafts;
    });
    setPendingDeletionIds((prevIds) => {
      const nextIds = new Set(prevIds);
      nextIds.delete(rowId);
      return nextIds;
    });
  };

  /**
   * DataGrid hook: invoked when a row edit produces an updated row object.
   *
   * - Updates local draft state with the new row.
   * - Persists the row immediately by calling `saveSingleRow`.
   * - `saveSingleRow` will trigger global success/error messages via snackbar context.
   *
   * @param {BaseRow} newRow - The row object after edit.
   * @returns {Promise<BaseRow>} Resolves to the updated row once save is complete.
   */
  const onProcessRowUpdate = async (newRow: BaseRow) => {
    const updatedRow: BaseRow = { ...newRow };
    setDraftRowsById((prevDrafts) =>
      new Map(prevDrafts).set(updatedRow.id, updatedRow)
    );

    await saveSingleRow(updatedRow.id)();

    return updatedRow;
  };

  /**
   * Handle DataGrid row modes model change.
   * @param {GridRowModesModel} newModel
   */
  const handleRowModesModelChange = (newModel: GridRowModesModel) => {
    setRowModesModel(newModel);
  };

  /**
   * Create a blank local-only row and enter edit mode.
   */
  function addBlankRow() {
    const tempId = makeTempId();
    const emptyRow: BaseRow = { id: tempId, isNew: true } as BaseRow;

    fieldSchema.forEach((field) => {
      const key = field.field_name;
      switch (field.input_type) {
        case 'textbox':
          emptyRow[key] = '';
          break;
        case 'number':
          emptyRow[key] = null;
          break;
        case 'dropdown':
          emptyRow[key] = field.field_values?.[0] || '';
          break;
        case 'date':
          // eslint-disable-next-line prefer-destructuring
          emptyRow[key] = new Date().toISOString().split('T')[0];
          break;
        case 'checkbox':
          emptyRow[key] = [];
          break;
        default:
          emptyRow[key] = '';
      }
    });

    setDraftRowsById((prevDrafts) => new Map(prevDrafts).set(tempId, emptyRow));
    setRowModesModel((prevModel) => ({
      ...prevModel,
      [tempId]: {
        mode: GridRowModes.Edit,
        fieldToFocus: fieldSchema[0]?.field_name,
      },
    }));
  }

  /**
   * Save all pending changes (inserts, updates, deletes) in a single request.
   */
  const saveAllChanges = async () => {
    const editingIds = apiRef.current?.state?.editRows
      ? (Object.keys(apiRef.current.state.editRows) as GridRowId[])
      : Object.entries(rowModesModel)
          .filter(([, model]) => model?.mode === GridRowModes.Edit)
          .map(([id]) => id as GridRowId);

    await Promise.all(
      editingIds.map(
        (rowId) =>
          new Promise<void>((resolve) => {
            apiRef.current?.stopRowEditMode({
              id: rowId,
              ignoreModifications: false,
            });
            requestAnimationFrame(() => resolve());
          })
      )
    );

    const latestDrafts = new Map<GridRowId, BaseRow>();
    gridRows.forEach((row) => {
      const latestRow = apiRef.current?.getRow(row.id) as BaseRow | undefined;
      if (latestRow) latestDrafts.set(row.id, latestRow);
    });

    const latestDraftRows = Array.from(latestDrafts.values());
    const deletedIds = Array.from(pendingDeletionIds);

    const [insertPayloads, updatePayloads] = latestDraftRows.reduce<
      [any[], any[]]
    >(
      (payloads, row) => {
        const [inserts, updates] = payloads;
        if (row.isNew) {
          inserts.push({ _action: 'insert', ...toServerRow(row, fieldSchema) });
        } else {
          const originalRow = originalRowSnapshotByIdRef.current.get(row.id);
          const currentPayload = toServerRow(row, fieldSchema);
          const originalPayload = originalRow
            ? toServerRow(originalRow, fieldSchema)
            : null;
          if (
            !originalPayload ||
            JSON.stringify(currentPayload) !== JSON.stringify(originalPayload)
          ) {
            updates.push({ _action: 'update', id: row.id, ...currentPayload });
          }
        }
        return payloads;
      },
      [[], []]
    );

    const deletePayloads = deletedIds
      .filter((rowId) => !latestDrafts.get(rowId)?.isNew)
      .map((rowId) => ({ _action: 'delete', id: rowId }));

    const submittedData = [
      ...insertPayloads,
      ...updatePayloads,
      ...deletePayloads,
    ];

    if (submittedData.length === 0) return;

    const response = await createProgrammeDataForCanvasByProgrammeId(
      programmeId,
      { batch_number: batchNumber, submittedData }
    );

    if ('error' in response) {
      dispatch({
        type: AppActionType.ADD_ALERT,
        payload: { message: response.message || response.error, type: 'error' },
      });
      return;
    }

    dispatch({
      type: AppActionType.ADD_ALERT,
      payload: { message: 'Form Submitted Successfully', type: 'success' },
    });

    setRowModesModel((prevModel) =>
      editingIds.reduce<GridRowModesModel>(
        (nextModel, rowId) => {
          nextModel[rowId] = { mode: GridRowModes.View };
          return nextModel;
        },
        { ...prevModel }
      )
    );

    setDraftRowsById(new Map());
    setPendingDeletionIds(new Set());
    originalRowSnapshotByIdRef.current.clear();

    queryClient.invalidateQueries({
      queryKey: [
        `programmeRowsData-${programmeId}-${batchNumber}-${createdBy}`,
      ],
    });
    queryClient.invalidateQueries({ queryKey: ['getAllBatchDetails'] });
    queryClient.invalidateQueries({
      queryKey: [`getBatchDetailsByUserId-${currData.data.userid}`],
    });
    queryClient.invalidateQueries({
      queryKey: ['GridBatchAttendanceDataDownloadCsv'],
    });
    queryClient.invalidateQueries({
      queryKey: ['GridDataDownloadCsv'],
    });
  };

  /**
   * Build DataGrid columns from schema + actions column.
   * @returns {GridColDef[]}
   */
  const columns = React.useMemo<GridColDef[]>(() => {
    const baseColumns = BuildColumns(fieldSchema);

    const actionsColumn: GridColDef = {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      cellClassName: 'actions',
      getActions: ({ id }) => {
        const isInEdit = rowModesModel[id]?.mode === GridRowModes.Edit;
        if (isInEdit) {
          return [
            <Tooltip
              title="Save This Row"
              key={`${id}-save`}
              sx={{ color: 'success.dark' }}
            >
              <GridActionsCellItem
                icon={<SaveIcon />}
                label="Save"
                onClick={() => saveSingleRow(id)()}
                material={{ sx: { color: 'success.dark' } }}
                color="inherit"
              />
            </Tooltip>,
            <Tooltip title="Cancel This Row" key={`${id}-cancel`}>
              <GridActionsCellItem
                icon={<CancelIcon />}
                label="Cancel"
                onClick={() => cancelEditRow(id)()}
                color="inherit"
              />
            </Tooltip>,
          ];
        }
        return [
          <Tooltip title="Edit This Row" key={`${id}-edit`}>
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={() => startEditRow(id)()}
              color="inherit"
            />
          </Tooltip>,
          <Tooltip title="Save This Row" key={`${id}-delete`}>
            <IconButtonModal
              iconWithTooltip={<DeleteIcon />}
              tooltipText="Delete This Row"
              modalFooter={false}
              iconSize="small"
              content={
                <ConfirmRowDelete onConfirm={() => deleteRowHandler(id)()} />
              }
            />
          </Tooltip>,
        ];
      },
    };

    return [...baseColumns, actionsColumn];
  }, [fieldSchema, rowModesModel]);

  /**
   * Derive DataGrid pagination model from server page/limit.
   */
  const paginationModel = React.useMemo(
    () => ({ page: Math.max(0, (page ?? 1) - 1), pageSize: limit ?? 10 }),
    [page, limit]
  );

  /**
   * Handle pagination updates (server-mode).
   * @param {GridPaginationModel} model
   */
  const handlePaginationModelChange = React.useCallback(
    (model: GridPaginationModel) => {
      if (model.pageSize !== limit) setQueryParam('limit', model.pageSize);
      if (model.page + 1 !== page) setQueryParam('page', model.page + 1);
    },
    [page, limit, setQueryParam]
  );

  if (isLoading) return <LinearProgress variant="query" />;

  if (errorMessage) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={refetch}>
            Retry
          </Button>
        }
        sx={{ mt: 1 }}
      >
        {errorMessage}
      </Alert>
    );
  }

  if (!fieldSchema.length) {
    return (
      <Alert
        severity="info"
        action={
          <Button color="inherit" size="small" onClick={refetch}>
            Reload
          </Button>
        }
        sx={{ mt: 1 }}
      >
        No fields configured for {programmeName || 'this programme'}.
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        height: 500,
        width: '100%',
        '& .actions': { color: 'text.secondary' },
        '& .textPrimary': { color: 'text.primary' },
      }}
    >
      <DataGrid
        apiRef={apiRef}
        rows={gridRows}
        columns={columns}
        getRowId={(row) => row.id}
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={handleRowModesModelChange}
        onRowEditStart={({ id }) => {
          setDraftRowsById((prevDrafts) => {
            if (prevDrafts.has(id)) return prevDrafts;
            const currentRow = gridRows.find((row) => row.id === id);
            return currentRow
              ? new Map(prevDrafts).set(id, { ...currentRow })
              : prevDrafts;
          });
        }}
        onRowEditStop={handleRowEditStop}
        processRowUpdate={onProcessRowUpdate}
        loading={isRowsLoading}
        slots={{ toolbar: GridToolbarX }}
        slotProps={{
          toolbar: {
            onAdd: addBlankRow,
            onSaveAll: saveAllChanges,
            hasDirty: draftRowsById.size > 0,
            setRowModesModel,
            // keep prop name to avoid breaking GridToolbarX
            fieldConfigs: fieldSchema,

            // for Download Csv
            programmeId,
            programmeName,
            batchNumber,
            createdBy,
          },
        }}
        initialState={{
          sorting: { sortModel: [{ field: 'id', sort: 'asc' }] },
        }}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        paginationMode="server"
        rowCount={computedRowCount}
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        checkboxSelection
        disableRowSelectionOnClick
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={(newSelection) => {
          setRowSelectionModel(newSelection);
        }}
        showToolbar
      />
    </Box>
  );
}
