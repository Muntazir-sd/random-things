/**
 * Deeply removes empty objects, empty arrays, undefined, empty strings, and NaN values
 * from a data object (such as React Hook Form values) before validation or submission.
 *
 * Why is this needed?
 * - Libraries like react-hook-form register all fields by default (especially in always-visible dynamic forms),
 *   even if the user hasn't entered any values.
 * - Zod's .optional() will only skip validation if the field is truly undefined or missing;
 *   if you pass an empty object ({}), empty string (""), or NaN, it still attempts to validate children.
 * - This utility ensures only meaningful values are sent to Zod and/or your API,
 *   allowing your validation schema's .optional() and .partial() logic to work as intended.
 *
 * Typical usage:
 * - Call pruneEmpty recursively on your form data **before** sending to Zod or to your API.
 * - Especially helpful for large/nested forms with optional/conditional sections
 *   (e.g., address, packaging, extraDetails, etc).
 */
export default function pruneEmpty<T>(obj: T): T | undefined {
  // Handle primitives
  if (obj === undefined || obj === null) return undefined;
  if (typeof obj === 'string' && obj.trim() === '') return undefined;
  if (typeof obj === 'number' && Number.isNaN(obj)) return undefined;

  // Handle arrays
  if (Array.isArray(obj)) {
    const cleaned = obj
      .map((item) => pruneEmpty(item))
      .filter((item) => item !== undefined);
    return cleaned.length > 0 ? (cleaned as unknown as T) : undefined;
  }

  // Handle objects (excluding special cases like File, Date, etc.)
  if (typeof obj === 'object') {
    if (obj instanceof Date) return obj;
    if (obj instanceof File) return obj;
    const entries = Object.entries(obj)
      .map(([key, value]) => [key, pruneEmpty(value)])
      .filter(([_, value]) => value !== undefined);

    if (entries.length === 0) return undefined;
    return Object.fromEntries(entries) as T;
  }

  // Everything else (number, boolean, etc.)
  return obj;
}
