'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider,
} from '@mui/material';

import TrainerField from './TrainerField';
// Importing mock data for demonstration purposes.
// In production, this data would come from an API response.
import mockTrainers from './trainers';

/**
 * ------------------------------------------------------------------
 * HIERARCHICAL FIELD USAGE EXAMPLE (PLAYGROUND)
 * ------------------------------------------------------------------
 *
 * This component acts as a "Storybook" or Playground entry to demonstrate
 * the capabilities of the `TrainerField` component.
 *
 * It showcases:
 * 1. Single Select Mode (Assigning a single parent/manager).
 * 2. Multi Select Mode (Filtering or mass assignment).
 * 3. Performance with large hierarchical datasets (~400 nodes).
 *
 * ==================================================================
 * API INTEGRATION GUIDE
 * ==================================================================
 *
 * To replace the mock data with a real API (e.g., using TanStack Query),
 * follow this pattern:
 *
 * ```tsx
 * import { useQuery } from '@tanstack/react-query';
 * import { getTrainers } from '@/api/trainers';
 *
 * export default function RealWorldUsage() {
 *   // 1. Fetch data
 *   const { data, isLoading } = useQuery({
 *     queryKey: ['trainers'],
 *     queryFn: getTrainers, // Should return IDashboardTrainer[]
 *   });
 *
 *   const trainers = data || [];
 *   const [selectedId, setSelectedId] = React.useState<number | null>(null);
 *
 *   // 2. Pass data and loading state to component
 *   return (
 *     <TrainerField
 *       trainers={trainers}
 *       loading={isLoading}
 *       value={selectedId}
 *       onChange={setSelectedId}
 *       mode="single"
 *     />
 *   );
 * }
 * ```
 * ==================================================================
 */
export default function HierarcalFieldUsage() {
  /**
   * STATE MANAGEMENT
   * ----------------
   * We maintain local state here to demonstrate how the component behaves
   * as a "Controlled Component".
   */

  // State for Single Select Mode
  const [selectedTrainer, setSelectedTrainer] =
    React.useState<number | null>(null);

  // State for Multi Select Mode
  const [selectedTrainers, setSelectedTrainers] =
    React.useState<number[]>([]);

  // Use static mock data
  const trainers = mockTrainers;

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h4" fontWeight={600}>
        TrainerField Playground
      </Typography>

      <Paper sx={{ p: 3, bgcolor: '#f8f9fa' }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Dataset Info:</strong> Loaded {trainers.length} mock records.
          Generates a deep hierarchy (Admins &rarr; Supervisors &rarr; Trainers).
        </Typography>
      </Paper>

      <Divider />

      {/* 
        SCENARIO 1: SINGLE SELECT
        Use Case: Selecting a direct report, assigning a manager.
      */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary">
            1. Single Select Mode
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Prop: <code>mode=&quot;single&quot;</code> (Default)
          </Typography>
        </Box>

        <TrainerField
          trainers={trainers}
          loading={false}
          value={selectedTrainer}
          onChange={setSelectedTrainer}
          mode="single"
        />

        <Box mt={2} display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle2">Current Value:</Typography>
          <Chip
            label={selectedTrainer ?? 'None'}
            color={selectedTrainer ? 'primary' : 'default'}
            variant="outlined"
          />
        </Box>
      </Paper>

      {/* 
        SCENARIO 2: MULTI SELECT
        Use Case: Filtering dashboard data by multiple entities.
      */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="secondary">
            2. Multi Select Mode
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Prop: <code>mode=&quot;multi&quot;</code> | Returns `number[]`
          </Typography>
        </Box>

        <TrainerField
          trainers={trainers}
          loading={false}
          value={null} // Ignored in multi mode
          onChange={() => {}} // Ignored in multi mode
          mode="multi"
          selectedIds={selectedTrainers}
          onMultiChange={setSelectedTrainers}
        />

        <Box mt={2}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Selected Items ({selectedTrainers.length}):
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {selectedTrainers.length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                No trainers selected
              </Typography>
            ) : (
              selectedTrainers.map((id) => (
                <Chip key={id} label={id} size="small" />
              ))
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}