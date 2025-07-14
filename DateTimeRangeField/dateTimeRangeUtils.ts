import { format as formatDate, parseISO } from 'date-fns';

/**
 * Represents a date-time range as [start, end], or nulls.
 */
export type DateTimeRange = [Date | null, Date | null];

/**
 * Parses a range string (e.g. "startISO|endISO") into a [Date, Date] tuple.
 * @param val - The range string.
 * @param delimiter - The character used to separate start and end (default: "|").
 * @returns {[Date|null, Date|null]}
 */
export function parseRangeString(val: string, delimiter = '|'): DateTimeRange {
  if (!val) return [null, null];
  const [start, end] = val.split(delimiter);
  return [start ? parseISO(start) : null, end ? parseISO(end) : null];
}

/**
 * Converts a [Date, Date] tuple into a single string for storage.
 * @param range - The [start, end] date tuple.
 * @param delimiter - The separator character (default: "|").
 * @returns {string} e.g. "startISO|endISO" or "" if not both
 */
export function toRangeString(range: DateTimeRange, delimiter = '|'): string {
  return range[0] && range[1]
    ? `${range[0].toISOString()}${delimiter}${range[1].toISOString()}`
    : '';
}

/**
 * Formats a JS Date using date-fns format string.
 * @param d - Date object or null.
 * @param dateFormat - date-fns format string (e.g. 'dd MMM yyyy, HH:mm').
 * @returns {string} Formatted date string or empty if null.
 */
export function formatDateTime(d: Date | null, dateFormat: string): string {
  return d ? formatDate(d, dateFormat) : '';
}

/**
 * Validates that end date is not before start date.
 * @param range - [start, end]
 * @returns {boolean} true if end is before start
 */
export function isInvalidRange(range: DateTimeRange): boolean {
  const [start, end] = range;
  return !!start && !!end && end.getTime() < start.getTime();
}
