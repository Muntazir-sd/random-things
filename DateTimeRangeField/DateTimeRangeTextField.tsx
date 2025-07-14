'use client';

import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  useMediaQuery,
  FormHelperText,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useTheme } from '@mui/material/styles';
import { Clear as ClearIcon } from '@mui/icons-material';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import {
  DateTimeRange,
  formatDateTime,
  isInvalidRange,
  parseRangeString,
  toRangeString,
} from './dateTimeRangeUtils';

export interface DateTimeRangePickerFieldProps<T extends FieldValues>
  extends Omit<React.ComponentProps<typeof TextField>, 'value' | 'onChange'> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  disabled?: boolean;
  minDateTime?: Date;
  maxDateTime?: Date;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  helperText?: React.ReactNode;
  dateFormat?: string;
  delimiter?: string;
}

export function DateTimeRangePickerField<T extends FieldValues>({
  control,
  name,
  label = 'Date/Time Range',
  disabled = false,
  minDateTime,
  maxDateTime,
  placeholder = 'Select date & time range',
  required = false,
  error,
  helperText,
  dateFormat = 'dd MMM yyyy, pp',
  delimiter = '|',
  ...textFieldProps
}: DateTimeRangePickerFieldProps<T>) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [open, setOpen] = React.useState(false);
  // Store the dialog draft value
  const [draft, setDraft] = React.useState<DateTimeRange>([null, null]);

  // Store value to sync draft when dialog opens
  const valueRef = React.useRef<DateTimeRange>([null, null]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        // Always derive value from form field
        const value: DateTimeRange = parseRangeString(field.value, delimiter);
        valueRef.current = value; // Save for openDialog

        const getFieldDisplay = () => {
          if (!value[0] || !value[1]) return '';
          return `${formatDateTime(value[0], dateFormat)} → ${formatDateTime(value[1], dateFormat)}`;
        };

        const invalidRange = isInvalidRange(draft);

        const showError =
          error ??
          (!!fieldState.error ||
            (!disabled &&
              ((required && (!value[0] || !value[1])) ||
                isInvalidRange(value))));

        const errorText =
          helperText ||
          fieldState.error?.message ||
          // eslint-disable-next-line no-nested-ternary
          (!value[0] || !value[1]
            ? 'Select start and end'
            : isInvalidRange(value)
              ? 'End cannot be before start'
              : '');

        const openDialog = () => {
          if (!disabled) {
            setDraft(value);
            setOpen(true);
          }
        };
        const closeDialog = () => setOpen(false);
        const handleChange = (idx: 0 | 1, d: Date | null) => {
          setDraft(idx === 0 ? [d, draft[1]] : [draft[0], d]);
        };
        const handleOk = () => {
          setOpen(false);
          if (draft[0] && draft[1] && !invalidRange) {
            field.onChange(toRangeString(draft, delimiter));
          }
        };
        const handleClear = (e: React.MouseEvent) => {
          e.stopPropagation();
          field.onChange('');
        };
        const handleFieldKeyDown = (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') openDialog();
        };

        return (
          <>
            <TextField
              label={label}
              value={getFieldDisplay()}
              onClick={openDialog}
              onKeyDown={handleFieldKeyDown}
              fullWidth
              InputProps={{
                readOnly: true,
                endAdornment:
                  value[0] && value[1] && !disabled ? (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClear}
                        edge="end"
                        size="small"
                        tabIndex={-1}
                        aria-label="Clear"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
              }}
              placeholder={placeholder}
              disabled={disabled}
              required={required}
              error={showError}
              helperText={showError ? errorText : undefined}
              inputProps={{
                tabIndex: 0,
                style: { cursor: disabled ? 'not-allowed' : 'pointer' },
              }}
              {...textFieldProps}
            />
            <Dialog
              open={open}
              onClose={closeDialog}
              maxWidth="sm"
              fullWidth
              aria-labelledby="range-dialog-title"
            >
              <DialogTitle id="range-dialog-title">{label}</DialogTitle>
              <DialogContent>
                <Stack
                  direction={isDesktop ? 'row' : 'column'}
                  spacing={2}
                  mt={1}
                  alignItems={isDesktop ? 'flex-end' : 'stretch'}
                >
                  <DateTimePicker
                    label="Start"
                    value={draft[0]}
                    onChange={(d) => handleChange(0, d)}
                    maxDateTime={draft[1] || maxDateTime}
                    minDateTime={minDateTime}
                    slotProps={{
                      textField: { fullWidth: true, autoFocus: true, required },
                    }}
                    disablePast
                    format={dateFormat}
                  />
                  <DateTimePicker
                    label="End"
                    value={draft[1]}
                    onChange={(d) => handleChange(1, d)}
                    minDateTime={draft[0] || minDateTime}
                    maxDateTime={maxDateTime}
                    slotProps={{ textField: { fullWidth: true, required } }}
                    disablePast
                    format={dateFormat}
                  />
                </Stack>
                {draft[0] && draft[1] && draft[1] < draft[0] && (
                  <FormHelperText error sx={{ mt: 1 }}>
                    End cannot be before start
                  </FormHelperText>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={closeDialog} color="secondary">
                  Cancel
                </Button>
                <Button
                  onClick={handleOk}
                  variant="contained"
                  disabled={!draft[0] || !draft[1] || draft[1] < draft[0]}
                >
                  OK
                </Button>
              </DialogActions>
            </Dialog>
          </>
        );
      }}
    />
  );
}
