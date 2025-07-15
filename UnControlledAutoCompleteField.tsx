import React from 'react';
import {
  Autocomplete,
  FormLabel,
  Skeleton,
  TextField,
  TextFieldProps as MuiTextFieldProps,
  SxProps,
  Theme,
} from '@mui/material';

interface Option {
  label: string;
  value: string | number;
}

interface UnControlledAutoCompleteFieldProps {
  name: string;
  label?: string;
  options: Option[];
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  isLoading?: boolean;
  TextFieldProps?: MuiTextFieldProps;
  formLabelSx?: SxProps<Theme>;
}

export default function UnControlledAutoCompleteField({
  name,
  label,
  options,
  value,
  onChange,
  isLoading = false,
  TextFieldProps,
  formLabelSx = {},
}: UnControlledAutoCompleteFieldProps) {
  if (isLoading) {
    return <Skeleton variant="rectangular" width="100%" height="40px" />;
  }

  const selectedOption = options.find((opt) => opt.value === value) || null;

  return (
    <>
      {label && (
        <FormLabel
          htmlFor={name}
          sx={{
            color: 'common.black',
            fontWeight: 600,
            display: 'block',
            paddingBlock: 1,
            ...formLabelSx,
          }}
        >
          {label}
        </FormLabel>
      )}

      <Autocomplete
        value={selectedOption}
        onChange={(_, newValue) => {
          onChange(newValue?.value ?? null);
        }}
        options={options}
        size="small"
        fullWidth
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, val) => option.value === val.value}
        renderInput={(params) => (
          <TextField
            {...params}
            id={name}
            variant="standard"
            placeholder="--Search--"
            fullWidth
            size="small"
            {...TextFieldProps}
          />
        )}
      />
    </>
  );
}
