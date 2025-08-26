'use client';

import React, { createContext, useMemo } from 'react';
import usePaginatedQuery from '@/app/hooks/usePaginatedQuery';
import type { PaginatedQueryResponse } from '@/app/hooks/usePaginatedQuery';
import type { GetProgrameDataForCanvasResponse, IFilterOptions } from '@/types';
import { getProgrameDataForCanvasByProgrammeId } from '@/action/canvas';

type Ctx = {
  paginatedQuery: PaginatedQueryResponse<
    IFilterOptions & {
      batch_number?: string;
      created_by?: number;
      id?: number;
    },
    GetProgrameDataForCanvasResponse
  >;
};

export const ProgrammeRowsPaginatedContext = createContext<Ctx>({} as Ctx);

export default function ProgrammeRowsPaginatedProvider({
  children,
  programmeId,
  batchNumber,
  createdBy,
  initialLimit = 10,
}: {
  children: React.ReactNode;
  programmeId: number;
  batchNumber: string;
  createdBy: number;
  initialLimit?: number;
}) {
  const initialData: GetProgrameDataForCanvasResponse = useMemo(
    () => ({
      results: [],
      success: true,
      message: 'sucess',
      page: 1,
      limit: initialLimit,
      count: 0,
      totalCount: 0,
      totalPages: 0,
    }),
    [initialLimit]
  );

  const paginatedQuery = usePaginatedQuery({
    initialData,
    queryKey: `programmeRowsData-${programmeId}-${batchNumber}-${createdBy}`,
    queryFn: (params) =>
      getProgrameDataForCanvasByProgrammeId({
        options: {
          ...params,
          batch_number: batchNumber,
          created_by: createdBy,
          id: programmeId,
        },
      }),
  });

  return (
    <ProgrammeRowsPaginatedContext.Provider value={{ paginatedQuery }}>
      {children}
    </ProgrammeRowsPaginatedContext.Provider>
  );
}
