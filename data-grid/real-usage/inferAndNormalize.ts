import {
  IFieldConfig,
  BaseRow,
  IFieldConfigInputType,
  ScalarForInputType,
} from '@/types';

/**
 * Convert a value-like thing into an ISO date string (yyyy-mm-dd).
 * Returns empty string if invalid or nullish.
 */
const normalizeToISODate = (value: unknown): string => {
  if (value == null || value === '') return '';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
};

/**
 * Convert various representations into a checkbox string array.
 * - Arrays are stringified element-wise
 * - Strings are split on commas/semicolons
 * - Nullish/empty -> []
 */
const normalizeToCheckboxArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (value == null || value === '') return [];
  return String(value)
    .split(/[;,]/)
    .map((piece) => piece.trim())
    .filter(Boolean);
};

/**
 * Coerce a raw cell value into the scalar shape required by an input type.
 * @template TInput
 * @param value - Any raw value from incoming rows
 * @param inputType - The field's input type (textbox, number, date, dropdown, checkbox)
 */
function coerceValueByInputType<TInput extends IFieldConfigInputType>(
  value: unknown,
  inputType: TInput
): ScalarForInputType<TInput> {
  switch (inputType) {
    case 'textbox':
    case 'dropdown':
      return (value == null ? '' : String(value)) as ScalarForInputType<TInput>;

    case 'number': {
      const n = typeof value === 'number' ? value : Number(value);
      return (Number.isFinite(n) ? n : null) as ScalarForInputType<TInput>;
    }

    case 'date':
      return normalizeToISODate(value) as ScalarForInputType<TInput>;

    case 'checkbox':
      return normalizeToCheckboxArray(value) as ScalarForInputType<TInput>;

    default:
      // Fallback to string for any unknown types
      return (value == null ? '' : String(value)) as ScalarForInputType<TInput>;
  }
}

/**
 * Canonicalize a key for fuzzy matching:
 * - trim
 * - lowercase
 * - strip spaces/underscores/hyphens
 */
const canonicalizeKey = (key: string) =>
  key
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

/**
 * Generate common key variants to improve matching between raw rows and schema fields.
 * Preserves the original, plus:
 * - lowercase
 * - spaces -> underscores
 * - remove spaces
 * - underscores/hyphens -> spaces
 */
const generateKeyVariants = (input?: string): string[] => {
  if (!input) return [];
  const lower = input.toLowerCase();
  return [
    input,
    lower,
    input.replace(/\s+/g, '_'),
    input.replace(/\s+/g, ''),
    input.replace(/[_-]+/g, ' '),
  ];
};

/**
 * Find an existing key in a raw row that matches a field by either
 * `field_id` or `field_name` (considering common name variants).
 * @param rawRow - Raw row object (as received from server/CSV/etc.)
 * @param fieldConfig - Target field configuration
 * @returns The matching key name from the raw row, if any
 */
const resolveRowKeyForField = (
  rawRow: Record<string, unknown>,
  fieldConfig: IFieldConfig
): string | undefined => {
  const rawKeys = Object.keys(rawRow);

  // Build a lookup of canonicalKey -> originalKey
  const canonicalToOriginal = new Map(
    rawKeys.map((original) => [canonicalizeKey(original), original] as const)
  );

  const candidateKeys = [
    ...generateKeyVariants(fieldConfig.field_id),
    ...generateKeyVariants(fieldConfig.field_name),
  ];

  const matchedCanonical = candidateKeys
    .map(canonicalizeKey)
    .find((canonical) => canonicalToOriginal.has(canonical));

  return matchedCanonical
    ? canonicalToOriginal.get(matchedCanonical)
    : undefined;
};

/**
 * Normalize an array of arbitrary row-like objects into a typed `BaseRow[]`
 * using the provided field schema. This:
 * - Resolves ids using preferred stable key candidates (e.g., id, emp_id, uid)
 * - Coerces values to the correct scalar type per field input type
 * - Maps incoming keys to `field_name`, with fuzzy matching on names/ids
 *
 * @param rawRows - Unknown array of row-like objects
 * @param fieldConfigs - Schema describing field names, ids, and types
 * @param options - Optional normalization options
 * @param options.stableKeyCandidates - Preferred keys to extract the row id from
 * @returns Normalized `BaseRow[]` with `id`, `isNew: false`, and field_name-based properties
 */
export default function normalizeRowsUsingSchema(
  rawRows: unknown[],
  fieldConfigs: IFieldConfig[],
  options?: { stableKeyCandidates?: string[] }
): BaseRow[] {
  const rowsArray = Array.isArray(rawRows)
    ? (rawRows as Record<string, unknown>[])
    : [];

  const stableKeyCandidates = options?.stableKeyCandidates ?? [
    'id',
    'emp_id',
    'uid',
  ];

  return rowsArray.map((rawRow, index) => {
    // Determine a stable id for the row
    const foundIdKey = stableKeyCandidates.find(
      (candidateKey) => rawRow[candidateKey] != null
    );
    const resolvedId = foundIdKey
      ? (rawRow[foundIdKey] as string | number)
      : index + 1; // fallback to 1-based index if none found

    // Build the normalized row by field_name
    const normalizedByFieldName = fieldConfigs.reduce<Record<string, unknown>>(
      (normalized, fieldConfig) => {
        const matchedRawKey = resolveRowKeyForField(rawRow, fieldConfig);
        const rawValue = matchedRawKey ? rawRow[matchedRawKey] : undefined;
        normalized[fieldConfig.field_name] = coerceValueByInputType(
          rawValue,
          fieldConfig.input_type
        );
        return normalized;
      },
      {}
    );

    return { id: resolvedId, isNew: false, ...normalizedByFieldName };
  });
}
