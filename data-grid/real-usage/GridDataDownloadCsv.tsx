/* eslint-disable no-nested-ternary */

'use client';

import React from 'react';
import { Tooltip, IconButton, CircularProgress } from '@mui/material';
import { GridDownloadIcon } from '@mui/x-data-grid';
import { CSVLink } from 'react-csv';
import { useQuery } from '@tanstack/react-query';
import generateFileName from '@/utils/generateFileName';
import { getDownloadProgrammeData } from '@/action/batch.action';

type Status = 'loading' | 'success' | 'empty' | 'error';

type ProgrammeDownloadResponse = { data: any[] } | { error: string };

export default function GridDataDownloadCsv({
  id,
  programmeName,
  batchNumber,
  createdBy,
}: {
  id: number;
  programmeName: string;
  batchNumber: string;
  createdBy: number;
}) {
  const {
    data: res,
    isPending,
    isFetching,
    isRefetching,
  } = useQuery<ProgrammeDownloadResponse>({
    queryKey: ['GridDataDownloadCsv', id, batchNumber, createdBy],
    queryFn: async () => {
      const response = await getDownloadProgrammeData({
        id,
        formdata: { batch_number: batchNumber, created_by: createdBy },
      });
      return response;
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const loading = isPending || isFetching || isRefetching;

  let status: Status = 'loading';
  let message = '';
  let rows: any[] = [];

  if (loading) {
    status = 'loading';
  } else if (res && 'error' in res) {
    status = 'error';
    message = res.error || 'Failed to fetch data';
  } else if (!res || !('data' in res) || res.data.length === 0) {
    status = 'empty';
    message = 'No data available for this programme';
  } else {
    status = 'success';
    rows = res.data;
    message = 'Data fetched successfully';
  }

  const canDownload = status === 'success' && rows.length > 0;

  const tooltipTitle =
    status === 'loading'
      ? 'Fetching data...'
      : status === 'empty'
        ? message
        : status === 'error'
          ? message
          : 'Download Raw Data';

  return canDownload ? (
    <CSVLink data={rows} filename={generateFileName(programmeName, 'csv')}>
      <Tooltip title={tooltipTitle}>
        <IconButton aria-label="Download Raw Data">
          <GridDownloadIcon />
        </IconButton>
      </Tooltip>
    </CSVLink>
  ) : (
    <Tooltip title={tooltipTitle}>
      <span>
        <IconButton disabled aria-label="Download Raw Data">
          {status === 'loading' ? (
            <CircularProgress size={18} />
          ) : (
            <GridDownloadIcon />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
}
