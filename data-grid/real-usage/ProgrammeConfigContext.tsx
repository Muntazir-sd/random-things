'use client';

import { createContext, ReactNode, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IFieldConfig } from '@/types';
import getProgrameConfigFieldsForCanvasByProgrammeId from '@/action/canvas';

type NormalizedConfig = {
  fieldConfigs: IFieldConfig[];
  programmeName?: string;
};

interface IProgrammeConfigContextProps {
  fieldConfigs: IFieldConfig[];
  programmeName?: string;
  isLoading: boolean;
  errorMessage: string | null;
  refetch: () => void;
}

interface IProgrammeConfigProviderProps {
  children: ReactNode;
  programmeId: number;
  batchNumber: string;
}

export const ProgrammeConfigContext =
  createContext<IProgrammeConfigContextProps>(
    {} as IProgrammeConfigContextProps
  );

export function ProgrammeConfigProvider({
  children,
  programmeId,
  batchNumber,
}: IProgrammeConfigProviderProps) {
  const query = useQuery({
    queryKey: ['programmeConfig', programmeId, batchNumber],
    queryFn: async () => {
      const raw = await getProgrameConfigFieldsForCanvasByProgrammeId({
        programmeId,
        batchNumber,
      });
      if ('error' in raw) {
        throw new Error(raw.error || 'Failed to load programme config');
      }
      return raw;
    },
    select: (ok): NormalizedConfig => ({
      fieldConfigs: Array.isArray(ok?.data?.fields) ? ok.data.fields : [],
      programmeName: ok?.data?.programmeName,
    }),
    enabled: !!programmeId && !!batchNumber,
    refetchOnWindowFocus: false,
  });

  const value = useMemo<IProgrammeConfigContextProps>(() => {
    const { data, isLoading, error, refetch } = query;

    return {
      fieldConfigs: data?.fieldConfigs ?? [],
      programmeName: data?.programmeName,
      isLoading,
      errorMessage: error ? error.message : null,
      refetch,
    };
  }, [query.data, query.isLoading, query.error, query.refetch]);

  return (
    <ProgrammeConfigContext.Provider value={value}>
      {children}
    </ProgrammeConfigContext.Provider>
  );
}
