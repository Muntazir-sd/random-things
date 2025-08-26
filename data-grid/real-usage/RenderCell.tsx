import { IFieldConfig } from '@/types';
import { Box, Chip } from '@mui/material';
import { format } from 'date-fns';

/**
 * Render read-only cells according to type:
 * - checkbox fields as MUI Chips
 * - date fields formatted
 * - default: just value text
 */
export default function RenderCell(params: any, fieldConfig: IFieldConfig) {
  const { value } = params;
  switch (fieldConfig.input_type) {
    case 'checkbox':
      return (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
            height: '100%',
            width: '100%',
            justifyContent: 'start',
            alignItems: 'center',
          }}
        >
          {Array.isArray(value) &&
            value.map((item: string, index: number) => (
              <Chip key={index} label={item} size="small" />
            ))}
        </Box>
      );
    case 'date':
      return value ? format(value, 'dd/MMM/yyyy') : '';
    default:
      return value;
  }
}
