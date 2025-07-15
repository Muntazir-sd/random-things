'use client';

import {
  FormLabel,
  IconButton,
  SxProps,
  TextFieldProps,
  TextFieldVariants,
  Theme,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { MobileTimePicker, MobileTimePickerProps } from '@mui/x-date-pickers';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import React from 'react';
import { addMinutes, setHours, setMinutes, subMinutes } from 'date-fns';

interface TimeFieldProps<T extends FieldValues>
  extends Omit<MobileTimePickerProps<Date>, 'value' | 'onChange'> {
  control: Control<T>;
  name: FieldPath<T>;
  label: React.ReactNode;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
  labelSx?: SxProps<Theme>;
  disabled?: boolean;
  textFieldProps?: TextFieldProps;
  variant?: TextFieldVariants | undefined;
  minTime?: Date;
  maxTime?: Date;
}

export default function TimeField<T extends FieldValues>({
  control,
  name,
  label,
  size = 'small',
  fullWidth = true,
  sx,
  labelSx,
  disabled,
  textFieldProps,
  variant = 'standard',
  minTime,
  maxTime,
  ...rest
}: TimeFieldProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <>
      <FormLabel
        sx={{
          color: 'common.black',
          fontWeight: 600,
          width: '100%',
          display: 'inline-block',
          paddingBlock: 1,
          ...labelSx,
        }}
        htmlFor={name}
      >
        {label}
      </FormLabel>
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState: { error } }) => {
          const currentTime = field.value
            ? new Date(`1970-01-01T${field.value}:00`)
            : null;
          const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (!currentTime) return;

            let updated = currentTime;
            const minuteStep = e.shiftKey ? 15 : 5;
            const bigStep = 30;
            const hrs = currentTime.getHours();

            switch (e.key) {
              case 'ArrowUp': {
                // +1 hour, wrap 23→0
                updated = setHours(currentTime, (hrs + 1) % 24);
                break;
              }
              case 'ArrowDown': {
                // -1 hour, wrap 0→23
                updated = setHours(currentTime, (hrs + 23) % 24);
                break;
              }
              case 'ArrowRight': {
                // +minuteStep minutes
                updated = addMinutes(currentTime, minuteStep);
                break;
              }
              case 'ArrowLeft': {
                // -minuteStep minutes
                updated = subMinutes(currentTime, minuteStep);
                break;
              }
              case 'PageUp': {
                updated = addMinutes(currentTime, bigStep);
                break;
              }
              case 'PageDown': {
                updated = subMinutes(currentTime, bigStep);
                break;
              }
              case 'Home': {
                updated = setHours(setMinutes(currentTime, 0), 0);
                break;
              }
              case 'End': {
                // last valid minute of the day
                updated = setHours(setMinutes(currentTime, 59), 23);
                break;
              }
              case ' ': // space
              case 'Spacebar': {
                // toggle AM/PM
                const newHour = hrs < 12 ? hrs + 12 : hrs - 12;
                updated = setHours(currentTime, newHour);
                break;
              }
              default:
                return; // let other keys through
            }

            e.preventDefault();
            // optional: clamp between minTime/maxTime if you have them
            if (minTime && updated < minTime) updated = minTime;
            if (maxTime && updated > maxTime) updated = maxTime;

            field.onChange(updated.toTimeString().slice(0, 5));
          };
          return (
            <MobileTimePicker
              {...rest}
              minutesStep={5}
              ampmInClock
              formatDensity="spacious"
              orientation={isMobile ? 'portrait' : 'landscape'}
              defaultValue={new Date('1970-01-10T10:10:00')}
              value={
                field.value ? new Date(`1970-01-01T${field.value}:00`) : null
              }
              onChange={(dt) =>
                field.onChange(dt?.toTimeString().slice(0, 5) || '')
              }
              disabled={disabled}
              slotProps={{
                textField: {
                  fullWidth,
                  size,
                  id: name,
                  error: !!error,
                  helperText: error?.message,
                  variant,
                  sx,
                  ...textFieldProps,
                  onKeyDown: handleKeyDown,
                  InputProps: {
                    endAdornment: (
                      <IconButton size="small">
                        <AccessTimeOutlinedIcon />
                      </IconButton>
                    ),
                  },
                },
              }}
            />
          );
        }}
      />
    </>
  );
}
