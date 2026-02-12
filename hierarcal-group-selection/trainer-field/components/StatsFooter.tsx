import { Box, Typography } from '@mui/material';
import React from 'react';
import { StatsFooterProps } from '../types';

/**
 * Footer component displaying statistical metadata about the current view.
 * Shows total counts, filtered counts, and the active selection mode.
 */
export default function StatsFooter({
  viewMode,
  treeNodesCount,
  flatOptionsCount,
  filteredCount,
  mode,
}: StatsFooterProps) {
  return (
    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant="caption" color="text.secondary">
        {viewMode === 'tree'
          ? `${treeNodesCount} groups, ${flatOptionsCount} total items`
          : `${filteredCount} search results`}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {mode === 'multi' ? 'Multi-select mode' : 'Single-select mode'}
      </Typography>
    </Box>
  );
}
