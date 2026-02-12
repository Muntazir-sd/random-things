import React from 'react';
import {
  Box,
  TextField,
  CircularProgress,
  IconButton,
  ButtonBase,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { ViewModes } from '../constants';
import { SearchHeaderProps } from '../types';

/**
 * Header component containing the search bar and view mode toggles.
 * Allows users to filter trainers and switch between Tree and List views.
 */
const SearchHeader: React.FC<SearchHeaderProps> = ({
  searchTerm,
  onSearchChange,
  onClearSearch,
  viewMode,
  onViewModeChange,
  loading,
}) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by name, role, or ID..."
          value={searchTerm}
          onChange={onSearchChange}
          slotProps={{
            input: {
              'aria-label': 'Search trainers',
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              ),
              endAdornment: searchTerm && (
                <IconButton size="small" onClick={onClearSearch}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              ),
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
              backgroundColor: '#f1f3f4',
              fontSize: 14,
              '& fieldset': { border: 'none' },
              '&:hover': { backgroundColor: '#e8eaed' },
              '&.Mui-focused': {
                backgroundColor: '#fff',
                boxShadow: '0 0 0 2px #1a73e8',
              },
            },
          }}
        />
        {loading && <CircularProgress size={20} sx={{ ml: 1 }} />}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
        {ViewModes.map((mode) => {
          const active = viewMode === mode;

          return (
            <ButtonBase
              key={mode}
              onClick={() => onViewModeChange(mode)}
              sx={{
                fontSize: 14,
                fontWeight: 500,
                color: active ? '#1a73e8' : '#5f6368',
                borderBottom: active
                  ? '2px solid #1a73e8'
                  : '2px solid transparent',
                pb: 0.5,
                textTransform: 'capitalize',
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: '#1a73e8',
                },
              }}
            >
              {mode === 'tree' ? 'Tree View' : 'Search Results'}
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
};

export default SearchHeader;
