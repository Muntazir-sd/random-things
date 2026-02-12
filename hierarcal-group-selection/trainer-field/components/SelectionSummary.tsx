import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

/**
 * Component to display a summary of currently selected items.
 *
 * Features:
 * - Shows count of selected items.
 * - In multi-select mode, displays a truncated list of selected IDs.
 * - Provides a clear button to reset selection.
 */
const SelectionSummary = ({
  selectedIds,
  onClear,
  mode,
}: {
  selectedIds: number[];
  onClear: () => void;
  mode: 'single' | 'multi';
}) => {
  if (selectedIds.length === 0) return null;

  return (
    <Box
      sx={{
        mt: 2,
        p: 1.5,
        backgroundColor: 'rgba(25, 118, 210, 0.08)',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'primary.light',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="subtitle2" color="primary" sx={{ mb: 0.5 }}>
            Selected {mode === 'single' ? 'Trainer' : 'Trainers'}:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''}{' '}
            selected
            {mode === 'multi' && selectedIds.length > 0 && (
              <Typography
                component="span"
                variant="body2"
                color="primary"
                sx={{ ml: 1, fontStyle: 'italic' }}
              >
                (IDs: {selectedIds.slice(0, 5).join(', ')}
                {selectedIds.length > 5 &&
                  `... +${selectedIds.length - 5} more`}
                )
              </Typography>
            )}
          </Typography>
        </Box>
        <Tooltip title="Clear selection">
          <IconButton size="small" onClick={onClear} color="primary">
            <ClearIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default SelectionSummary;
