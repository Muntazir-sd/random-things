'use client';

import DateField from '@/components/SimpleDateField';
import SubmitButton from '@/components/SubmitButton';
import batchCreateSchema, {
  BatchCreateType,
} from '@/validation/batchCreate.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  FormLabel,
  Grid2,
  TextField,
  Typography,
} from '@mui/material';
import { redirect } from 'next/navigation';
import React, { use, useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { GetCurrentUserContext } from '@/context/User/GetCurrentUserContext';
import { createBatchDetails } from '@/action/batch.action';
import { AppActionType } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import useSnakberContext from '@/context/AppProvider/useSnakberContext';
import CreateBranchField from '@/components/BranchField/CreateBranchField';
import CreateProgrammeField from '@/components/ProgrammeField/CreateProgrammeField';
import CaptchaVerifier from '@/components/CaptchaVerifier';
import { eachDayOfInterval, formatISO, parseISO } from 'date-fns';
import TimeField from '@/components/SimpleTimeField';
import UnControlledAutoCompleteField from '@/components/UnControlledAutoCompleteField';

export default function CreateBatchForm() {
  const { data } = use(GetCurrentUserContext);
  const queryClient = useQueryClient();
  const { dispatch } = useSnakberContext();
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');

  const {
    control,
    handleSubmit,
    setValue,
    trigger,
    watch,
    reset,
    formState: { isValid, isSubmitted, isSubmitting, errors },
  } = useForm<BatchCreateType>({
    defaultValues: {
      branch_id: undefined,
      programme_id: undefined,
      batch_description: '',
      batch_start_date: '',
      batch_end_date: '',
      batch_status: true,
      created_by: data.data.userid,
      default_start_time: '',
      default_end_time: '',
      schedules: [],
    },
    resolver: zodResolver(batchCreateSchema),
  });

  function timeStringToDate(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
  console.log('value', watch());

  const startDate = watch('batch_start_date');
  const endDate = watch('batch_end_date');
  const defaultStart = watch('default_start_time');
  const defaultEnd = watch('default_end_time');
  const schedules = watch('schedules');

  // Field array for schedules
  const { fields, append, replace } = useFieldArray({
    control,
    name: 'schedules',
  });

  // Generate schedule when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const days = eachDayOfInterval({
        start: parseISO(startDate),
        end: parseISO(endDate),
      });

      // Create default schedule for all days
      const defaultSchedule = days.map((d) => ({
        date: formatISO(d, { representation: 'date' }),
        start_time: defaultStart,
        end_time: defaultEnd,
      }));

      // Merge with existing custom schedules
      const mergedSchedules = defaultSchedule.map((day) => {
        const custom = schedules.find((s) => s.date === day.date);
        return custom || day;
      });

      replace(mergedSchedules);

      // Calculate available dates for customization
      const datesInRange = days.map((d) =>
        formatISO(d, { representation: 'date' })
      );
      const customDates = new Set(
        schedules
          .filter(
            (s) => s.start_time !== defaultStart || s.end_time !== defaultEnd
          )
          .map((s) => s.date)
      );

      setAvailableDates(datesInRange.filter((date) => !customDates.has(date)));
    }
  }, [startDate, endDate, replace]);

  // Apply default times to all schedules with UI refresh
  const applyDefaultsToAll = () => {
    const updatedSchedules = fields.map((schedule) => ({
      ...schedule,
      start_time: defaultStart,
      end_time: defaultEnd,
    }));

    replace(updatedSchedules);

    // Force UI refresh
    dispatch({
      type: AppActionType.ADD_ALERT,
      payload: {
        message: 'Default times applied to all dates',
        type: 'success',
      },
    });
  };

  console.log('errors', errors);

  async function onSubmit(formdata: BatchCreateType) {
    const response = await createBatchDetails(formdata);
    if ('error' in response) {
      dispatch({
        type: AppActionType.ADD_ALERT,
        payload: {
          message: response.message ? response.message : response.error,
          type: 'error',
        },
      });
      setShowCaptcha(false);
      if (response?.captchaRequired) {
        setShowCaptcha(true);
      }
    } else {
      dispatch({
        type: AppActionType.ADD_ALERT,
        payload: {
          message: 'Form Submitted Successfully',
          type: 'success',
        },
      });
      reset();
      setShowCaptcha(false);
      queryClient.invalidateQueries({
        queryKey: ['getAllBatchDetails'],
      });
      queryClient.invalidateQueries({
        queryKey: ['getBatchDetailsByUserId'],
      });
      redirect('/dashboard/batch');
    }
  }

  // Filter schedules to show only custom ones (different from default)
  const customSchedules = schedules.filter(
    (schedule) =>
      schedule.start_time !== defaultStart || schedule.end_time !== defaultEnd
  );

  // Check if date range is selected
  const isDateRangeSelected = startDate && endDate;

  // Add custom date handler
  const handleAddCustomDate = () => {
    if (!selectedDate) return;

    const existingIndex = schedules.findIndex((s) => s.date === selectedDate);

    const newSchedule = {
      date: selectedDate,
      start_time: '',
      end_time: '',
    };

    if (existingIndex !== -1) {
      // If the date exists, update it
      const updatedSchedules = [...schedules];
      updatedSchedules[existingIndex] = newSchedule;
      replace(updatedSchedules);
    } else {
      // Otherwise, append it
      append(newSchedule);
    }

    setSelectedDate('');
  };

  return (
    <Grid2
      container
      component={'form'}
      onSubmit={handleSubmit(onSubmit)}
      spacing={2}
      justifyContent={'center'}
      padding={2}
      boxShadow={'0px 4px 4px 0px rgba(0, 0, 0, 0.25)'}
      bgcolor={'common.white'}
      borderRadius={3}
    >
      <Grid2 size={{ xs: 12, sm: 6 }}>
        <FormLabel
          sx={{
            color: 'common.black',
            fontWeight: 600,
            width: '100%',
            display: 'inline-block',
            paddingBlock: 1,
          }}
          htmlFor={'batchnumber'}
        >
          Batch Number
        </FormLabel>
        <TextField
          fullWidth
          id={'batchnumber'}
          variant="standard"
          type="text"
          size="small"
          placeholder="Auto generated"
          disabled
        />
      </Grid2>
      <Grid2 size={{ xs: 12, sm: 6 }}>
        <CreateBranchField name="branch_id" setValue={setValue} />
      </Grid2>
      <Grid2 size={{ xs: 12, sm: 6 }}>
        <CreateProgrammeField name="programme_id" setValue={setValue} />
      </Grid2>
      {/* <Grid2 size={{ xs: 12, sm: 6 }}>
        <SimpleTextField
          control={control}
          label="Batch Description"
          name="batch_description"
          placeholder="BatchDescription..."
          multiline
        />
      </Grid2> */}
      <Grid2 size={{ xs: 12, sm: 6 }}>
        <DateField
          control={control}
          label="Batch Start Date"
          name="batch_start_date"
          fullWidth
        />
      </Grid2>
      <Grid2 size={{ xs: 12, sm: 6 }}>
        <DateField
          control={control}
          label="Batch End Date"
          name="batch_end_date"
          fullWidth
          minDate={
            watch('batch_start_date')
              ? new Date(watch('batch_start_date'))
              : undefined
          }
        />
      </Grid2>
      <Grid2 size={{ xs: 12, sm: 6 }}></Grid2>
      {/* Default Times Section */}
      <Grid2 container size={12} spacing={2} alignItems="center">
        <Grid2 size={{ xs: 12, md: 4 }}>
          <FormLabel sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
            Default Schedule
          </FormLabel>
          <TimeField
            control={control}
            name="default_start_time"
            label="Start"
            disabled={!isDateRangeSelected}
            format="hh:mm a"
          />

          <TimeField
            control={control}
            name="default_end_time"
            label="End"
            disabled={!isDateRangeSelected}
            format="hh:mm a"
            minTime={
              watch('default_start_time')
                ? timeStringToDate(watch('default_start_time'))
                : undefined
            }
          />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={applyDefaultsToAll}
            sx={{ mt: 2 }}
            disabled={!isDateRangeSelected}
          >
            Apply to All
          </Button>
        </Grid2>
      </Grid2>

      {/* Schedule List Header */}
      <Grid2 size={12}>
        <Typography variant="h6" fontWeight={600} mt={2}>
          Custom Schedule Overrides
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Only dates with custom times are shown here
        </Typography>
      </Grid2>

      {/* Custom Schedule Items */}
      {customSchedules.map((item, idx) => {
        const scheduleIdx = schedules.findIndex((s) => s.date === item.date);
        return (
          <Grid2 size={12} key={`${item.date}-${idx}`}>
            <Box
              p={2}
              mb={2}
              border={1}
              borderRadius={2}
              borderColor="divider"
              bgcolor="background.paper"
            >
              <Grid2 container spacing={2} alignItems="center">
                <Grid2 size={{ xs: 12, md: 3 }}>
                  <DateField
                    control={control}
                    label="Date"
                    name={`schedules.${scheduleIdx}.date`}
                    fullWidth
                    minDate={parseISO(startDate)}
                    maxDate={parseISO(endDate)}
                    readOnly
                  />
                </Grid2>

                <Grid2 size={{ xs: 12, md: 4 }}>
                  <TimeField
                    control={control}
                    name={`schedules.${scheduleIdx}.start_time`}
                    label="Start"
                    disabled={!isDateRangeSelected}
                    format="hh:mm a"
                  />

                  <TimeField
                    control={control}
                    name={`schedules.${scheduleIdx}.end_time`}
                    label="End"
                    disabled={!isDateRangeSelected}
                    format="hh:mm a"
                    minTime={
                      watch(`schedules.${scheduleIdx}.start_time`)
                        ? timeStringToDate(
                            watch(`schedules.${scheduleIdx}.start_time`)
                          )
                        : undefined
                    }
                  />
                </Grid2>

                <Grid2
                  size={{ xs: 12, md: 3 }}
                  display="flex"
                  justifyContent="flex-end"
                >
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      // Reset to default times
                      setValue(
                        `schedules.${scheduleIdx}.start_time`,
                        defaultStart
                      );
                      setValue(`schedules.${scheduleIdx}.end_time`, defaultEnd);
                    }}
                    fullWidth
                  >
                    Reset to Default
                  </Button>
                </Grid2>
              </Grid2>
            </Box>
          </Grid2>
        );
      })}

      {/* Add Schedule Section */}
      <Grid2 size={12}>
        <UnControlledAutoCompleteField
          name="select-date-to-customize"
          value={selectedDate}
          onChange={(value) => setSelectedDate(value as string)}
          label="Select Date to Customize"
          options={availableDates.map((date) => ({
            label: new Date(date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }),
            value: date,
          }))}
          isLoading={!isDateRangeSelected}
        />

        <Button
          variant="outlined"
          onClick={handleAddCustomDate}
          disabled={!selectedDate}
          fullWidth
        >
          Add Date
        </Button>
      </Grid2>
      <Grid2 size={{ xs: 12, sm: 6 }}>
        {showCaptcha && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'end',
              flexDirection: 'column',
            }}
          >
            <CaptchaVerifier
              setValue={setValue}
              trigger={trigger}
              name="captchaToken"
              error={errors.captchaToken?.message}
            />
          </Box>
        )}
      </Grid2>
      <Grid2 size={12}>
        <SubmitButton
          isSubmitted={isSubmitted}
          isSubmitting={isSubmitting}
          isValid={isValid}
          variant="contained"
          sx={{
            backgroundColor: 'secondary.dark',
            color: 'common.white',
            display: 'flex',
            justifySelf: 'end',
            paddingInline: 5,
            paddingBlock: 1,
          }}
          title="Save"
        />
      </Grid2>
    </Grid2>
  );
}
