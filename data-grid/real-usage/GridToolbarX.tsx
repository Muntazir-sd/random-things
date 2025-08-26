'use client';

import * as React from 'react';
import {
  Tooltip,
  IconButton,
  Badge,
  InputAdornment,
  styled,
  TextField,
} from '@mui/material';
import {
  Toolbar,
  QuickFilter,
  QuickFilterTrigger,
  QuickFilterControl,
  QuickFilterClear,
  ColumnsPanelTrigger,
  FilterPanelTrigger,
  ToolbarButton,
  ToolbarPropsOverrides,
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FilterListIcon from '@mui/icons-material/FilterList';
import CancelIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { GridToolbarProps } from '@mui/x-data-grid/internals';
import GridDataDownloadCsv from '../feature/GridDataDownloadCsv';
import GridBatchAttendanceDataDownloadCsv from '../feature/GridBatchAttendanceDataDownloadCsv';

type OwnerState = { expanded: boolean };

export const StyledQuickFilter = styled(QuickFilter)({
  display: 'grid',
  alignItems: 'center',
});
export const StyledToolbarButton = styled(ToolbarButton)<{
  ownerState: OwnerState;
}>(({ theme, ownerState }) => ({
  gridArea: '1 / 1',
  width: 'min-content',
  height: 'min-content',
  zIndex: 1,
  opacity: ownerState.expanded ? 0 : 1,
  pointerEvents: ownerState.expanded ? 'none' : 'auto',
  transition: theme.transitions.create(['opacity']),
}));
export const StyledTextField = styled(TextField)<{ ownerState: OwnerState }>(
  ({ theme, ownerState }) => ({
    gridArea: '1 / 1',
    overflowX: 'clip',
    width: ownerState.expanded ? 260 : 'var(--trigger-width)',
    opacity: ownerState.expanded ? 1 : 0,
    transition: theme.transitions.create(['width', 'opacity']),
  })
);

type Props = GridToolbarProps & ToolbarPropsOverrides;

/**
 * Custom toolbar demonstrates using handlers and state props:
 * - `handleAddRecord` for new rows
 * - `handleSaveAll` toggles enabled based on `dirtyRows`
 * - built-in column & filter panels with badges
 * - QuickFilter with animated expand/collapse
 */
export default function GridToolbarX(props: Props) {
  const {
    onAdd,
    onSaveAll,
    hasDirty,
    programmeId,
    programmeName,
    createdBy,
    batchNumber,
  } = props;

  return (
    <Toolbar>
      <Tooltip title="Add record">
        <IconButton onClick={onAdd}>
          <AddIcon />
        </IconButton>
      </Tooltip>

      <GridBatchAttendanceDataDownloadCsv
        programmeName={programmeName}
        id={programmeId}
        batchNumber={batchNumber}
        createdBy={createdBy}
      />

      <Tooltip title="Save all changes">
        <span>
          <IconButton
            onClick={onSaveAll}
            disabled={!hasDirty}
            sx={{ color: hasDirty ? 'success.dark' : 'grey.400' }}
          >
            <SaveIcon color="inherit" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Columns">
        <ColumnsPanelTrigger render={<ToolbarButton />}>
          <ViewColumnIcon fontSize="small" />
        </ColumnsPanelTrigger>
      </Tooltip>

      <FilterPanelTrigger
        render={(triggerProps, state) => (
          <Tooltip title="Filters" enterDelay={0}>
            <ToolbarButton {...triggerProps} color="default">
              <Badge
                badgeContent={state.filterCount}
                color="primary"
                variant="dot"
              >
                <FilterListIcon fontSize="small" />
              </Badge>
            </ToolbarButton>
          </Tooltip>
        )}
      />

      <GridDataDownloadCsv
        programmeName={programmeName}
        id={programmeId}
        batchNumber={batchNumber}
        createdBy={createdBy}
      />

      <StyledQuickFilter>
        <QuickFilterTrigger
          render={(triggerProps, state) => (
            <Tooltip title="Search" enterDelay={0}>
              <StyledToolbarButton
                {...triggerProps}
                ownerState={{ expanded: state.expanded }}
                color="default"
                aria-disabled={state.expanded}
              >
                <SearchIcon fontSize="small" />
              </StyledToolbarButton>
            </Tooltip>
          )}
        />
        <QuickFilterControl
          render={({ ref, ...controlProps }, state) => (
            <StyledTextField
              {...controlProps}
              ownerState={{ expanded: state.expanded }}
              inputRef={ref}
              aria-label="Search"
              placeholder="Search..."
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: state.value ? (
                    <InputAdornment position="end">
                      <QuickFilterClear
                        edge="end"
                        size="small"
                        aria-label="Clear search"
                      >
                        <CancelIcon fontSize="small" />
                      </QuickFilterClear>
                    </InputAdornment>
                  ) : null,
                  ...controlProps.slotProps?.input,
                },
                ...controlProps.slotProps,
              }}
            />
          )}
        />
      </StyledQuickFilter>
    </Toolbar>
  );
}
