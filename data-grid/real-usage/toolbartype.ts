export type PaginatedResponse<T> = {
  success: boolean;
  message: string;
  count: number;
  limit: number;
  page: number;
  totalCount: number;
  totalPages: number;
  results: T[];
};

export type GetProgrameDataForCanvasResponse = PaginatedResponse<
  Record<string, unknown>
>;

export interface IFieldConfig {
  field_id: string;
  field_name: string;
  input_type: 'textbox' | 'number' | 'dropdown' | 'checkbox' | 'date';
  has_options?: boolean;
  field_values?: string[];
}

export type IFieldConfigInputType = IFieldConfig['input_type'];

/**
 * Map an input type to its normalized scalar value type.
 */
export type ScalarForInputType<TInput extends IFieldConfigInputType> =
  TInput extends 'textbox' | 'dropdown'
    ? string
    : TInput extends 'number'
      ? number | null
      : TInput extends 'date'
        ? string
        : TInput extends 'checkbox'
          ? string[]
          : never;

// - `isNew`: flag used to roll back or highlight newly added rows
export type BaseRow = {
  id: number | string;
  isNew: boolean;
  [fieldName: string]: unknown;
};
