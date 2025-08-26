import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { IFieldConfig } from '@/types';
import RenderCell from './RenderCell';
import EditCellComponent from './EditCellComponent';

export default function BuildColumns(
  fieldConfigs: IFieldConfig[]
): GridColDef[] {
  return fieldConfigs.map((fc) => {
    const base: GridColDef = {
      field: fc.field_name,
      headerName: fc.field_name,
      width: 200,
      editable: true,
      sortable: true,
      filterable: true,
      valueFormatter: (value) => {
        if (fc.input_type === 'date' && value) {
          try {
            return format(new Date(String(value)), 'dd-MMM-yy');
          } catch {
            return '-';
          }
        }
        return value ?? '';
      },
      renderCell: (params) => RenderCell(params, fc),
      renderEditCell: (params: GridRenderCellParams) => (
        <EditCellComponent params={params} fieldConfig={fc} />
      ),
    };

    return base;
  });
}
