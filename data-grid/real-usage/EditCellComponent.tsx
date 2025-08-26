import React from 'react';
import { Autocomplete, Chip, MenuItem, Select, TextField } from '@mui/material';
import { GridRenderEditCellParams, useGridApiContext } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers';
import formatDateToISO from '@/utils/toLocalISODate';
import toSafeDate from '@/utils/withSafeTime';
import { IFieldConfig } from '@/types';

/**
 * Renders a custom editor inside a cell, based on the fieldConfig.
 * @param params - DataGrid-provided props containing rowId, field name, current value
 * @param fieldConfig - configuration dictating which input type to use
 */
export default function EditCellComponent({
  params,
  fieldConfig,
}: {
  params: GridRenderEditCellParams;
  fieldConfig: IFieldConfig;
}) {
  const apiRef = useGridApiContext();
  const { value } = params;

  const checkboxRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLInputElement>(null);
  const numberRef = React.useRef<HTMLInputElement>(null);
  const dateRef = React.useRef<HTMLInputElement>(null);
  const textRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (params.hasFocus) {
      setTimeout(() => {
        if (fieldConfig.input_type === 'checkbox' && checkboxRef.current) {
          checkboxRef.current.focus();
        } else if (
          fieldConfig.input_type === 'dropdown' &&
          dropdownRef.current
        ) {
          dropdownRef.current.focus();
        } else if (fieldConfig.input_type === 'number' && numberRef.current) {
          numberRef.current.focus();
        } else if (fieldConfig.input_type === 'date' && dateRef.current) {
          dateRef.current.focus();
        } else if (fieldConfig.input_type === 'textbox' && textRef.current) {
          textRef.current.focus();
        }
      }, 0);
    }
  }, [params.hasFocus, fieldConfig.input_type]);

  // 1. Multi-select (checkbox)
  if (fieldConfig.input_type === 'checkbox') {
    const allOptions =
      fieldConfig.field_values?.map((val) => ({ label: val, value: val })) ||
      [];
    const valueObjects = Array.isArray(value)
      ? value.map(
          (val) =>
            allOptions.find((opt) => opt.value === val) || {
              label: val,
              value: val,
            }
        )
      : [];
    return (
      <Autocomplete
        multiple
        size="small"
        options={allOptions}
        value={valueObjects}
        getOptionLabel={(option) => option.label}
        filterSelectedOptions
        disableCloseOnSelect
        isOptionEqualToValue={(opt, val) => opt.value === val.value}
        sx={{
          '.MuiOutlinedInput-root': {
            p: '2px 4px',
            minHeight: 36,
            alignItems: 'center',
            fontSize: 14,
            background: 'transparent',
            borderRadius: 0,
          },
          width: '100%',
        }}
        renderInput={(paramsInput) => (
          <TextField
            {...paramsInput}
            id={`${params.id}`}
            inputRef={checkboxRef}
            autoFocus={params.hasFocus}
            tabIndex={params.hasFocus ? 0 : -1}
            sx={{
              input: { fontSize: 14 },
              p: 0,
              m: 0,
              border: 'none',
            }}
          />
        )}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              label={option.label}
              variant="filled"
              key={option.value}
            />
          ))
        }
        onChange={(_, newValue) => {
          apiRef.current.setEditCellValue({
            id: params.id,
            field: params.field,
            value: newValue.map((item) => item.value),
          });
        }}
      />
    );
  }

  // 2. Dropdown (single select)
  if (fieldConfig.input_type === 'dropdown') {
    return (
      <Select
        value={value || ''}
        id={`${params.id}`}
        inputRef={dropdownRef}
        autoFocus={params.hasFocus}
        tabIndex={params.hasFocus ? 0 : -1}
        onChange={(e) => {
          apiRef.current.setEditCellValue({
            id: params.id,
            field: params.field,
            value: e.target.value,
          });
        }}
        fullWidth
        renderValue={(ele) => ele}
      >
        {fieldConfig.field_values?.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    );
  }

  // 3. Number field
  if (fieldConfig.input_type === 'number') {
    return (
      <TextField
        type="number"
        value={value ?? ''}
        id={`${params.id}`}
        inputRef={numberRef}
        autoFocus={params.hasFocus}
        tabIndex={params.hasFocus ? 0 : -1}
        onChange={(e) => {
          apiRef.current.setEditCellValue({
            id: params.id,
            field: params.field,
            value: e.target.value === '' ? null : Number(e.target.value),
          });
        }}
        sx={{
          '& input[type=number]': {
            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
              display: 'none',
            },
          },
        }}
        fullWidth
      />
    );
  }

  // 4. Date field
  if (fieldConfig.input_type === 'date') {
    return (
      <DatePicker
        format="dd/MMM/yyyy"
        formatDensity="spacious"
        value={value ? toSafeDate(value) : null}
        onChange={(date) => {
          const isoDate =
            date instanceof Date && !Number.isNaN(date.getTime())
              ? formatDateToISO(date || new Date())
              : '';
          apiRef.current.setEditCellValue({
            id: params.id,
            field: params.field,
            value: isoDate,
          });
        }}
        slotProps={{
          textField: {
            id: `${params.id}`,
            inputRef: dateRef,
            fullWidth: true,
            size: 'medium',
            autoFocus: params.hasFocus,
            tabIndex: params.hasFocus ? 0 : -1,
          },
        }}
      />
    );
  }

  // 5. Text field (default)
  return (
    <TextField
      value={value ?? ''}
      id={`${params.id}`}
      inputRef={textRef}
      autoFocus={params.hasFocus}
      tabIndex={params.hasFocus ? 0 : -1}
      onChange={(e) => {
        apiRef.current.setEditCellValue({
          id: params.id,
          field: params.field,
          value: e.target.value,
        });
      }}
      fullWidth
      size="medium"
    />
  );
}
