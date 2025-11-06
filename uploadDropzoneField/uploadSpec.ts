/**
 * utils/uploadSpec.ts
 * -----------------------------------------------------------------------------
 * UPLOAD SPEC (Single Source of Truth)
 *
 * Overview
 * - Define base file *kinds* (CSV, XLSX, PDF, IMAGE) with their extensions,
 *   MIME types, and human labels.
 * - Declare *modes* as combinations of those kinds (e.g., "csv_xlsx_pdf_image").
 * - All derived artifacts (labels, <input accept> strings, validators) are
 *   auto-generated from config to keep behavior consistent across the app.
 *
 * Why
 * - Easier to reason about: one place to update file support.
 * - More robust: browsers can report flaky MIME types; prefer extension checks,
 *   fall back to MIME when needed.
 * - Reusable: works in components, hooks, and server checks.
 *
 * Quick Usage
 * ---------------------------------------------------------------------------
 * import {
 *   UploadMode,
 *   buildAcceptAttribute,
 *   HUMAN_LABEL_BY_MODE,
 *   isFileAllowedForMode,
 *   computeFileFingerprint,
 *   getAllowedKindsForMode
 * } from '@/utils/uploadSpec';
 *
 * const mode: UploadMode = 'pdf_image';
 * <input type="file" accept={buildAcceptAttribute(mode)} multiple />
 *
 * // Validation example
 * const ok = isFileAllowedForMode(file, mode);
 * if (!ok) showToast(`Only ${HUMAN_LABEL_BY_MODE[mode]} allowed`);
 * -----------------------------------------------------------------------------
 */

/** Atomic file kinds supported across the app. Add new kinds here (e.g., 'zip'). */
export type FileKind = 'csv' | 'xlsx' | 'pdf' | 'image';

/** Display + matching info for a file kind. */
type FileSpec = {
  /** Human-friendly label used to compose mode labels. */
  label: string;
  /** Case-insensitive file extensions (include the leading dot). */
  extensions: readonly string[];
  /** One or more MIME types commonly reported by browsers for this kind. */
  mimes: readonly string[];
};

/** Utility: unique values preserving first-seen order. */
function uniqueValues<T>(iterable: Iterable<T>): T[] {
  return Array.from(new Set(iterable));
}

/** Utility: join labels with natural language glue. */
function joinWithNaturalLanguage(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? '';
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, or ${labels.at(-1)}`;
}

/**
 * Canonical specs for each FileKind.
 * Extend this object to add a new kind globally (e.g., 'zip', 'video', etc.).
 */
export const FILE_KIND_SPECS: Record<FileKind, FileSpec> = {
  csv: {
    label: 'CSV',
    extensions: ['.csv'],
    mimes: ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'],
  },
  xlsx: {
    label: 'XLSX/XLS',
    extensions: ['.xlsx', '.xls'],
    mimes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ],
  },
  pdf: {
    label: 'PDF',
    extensions: ['.pdf'],
    mimes: ['application/pdf'],
  },
  image: {
    label: 'Images (PNG, JPG, etc.)',
    extensions: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
    mimes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/webp'],
  },
} as const;

/**
 * A mode is a named combination of FileKinds.
 * Update or add modes here—everything else is generated.
 */
export const UPLOAD_MODE_CONFIG = {
  csv: ['csv'],
  xlsx: ['xlsx'],
  pdf: ['pdf'],
  image: ['image'],
  csv_xlsx: ['csv', 'xlsx'],
  csv_xlsx_pdf: ['csv', 'xlsx', 'pdf'],
  pdf_image: ['pdf', 'image'],
  csv_xlsx_image: ['csv', 'xlsx', 'image'],
  csv_xlsx_pdf_image: ['csv', 'xlsx', 'pdf', 'image'],
} as const;

/** All supported mode names. */
export type UploadMode = keyof typeof UPLOAD_MODE_CONFIG;

/** Derived policy for a specific mode. */
type ModePolicy = {
  /** Allowed extensions for the mode (lowercase, with leading dot). */
  extensions: string[];
  /** Allowed MIME types for the mode. */
  mimes: string[];
  /** Human-friendly label (e.g., "CSV, XLSX/XLS, PDF, or Images"). */
  label: string;
};

/** Build the label for a given list of kinds. */
function buildHumanLabelFromKinds(allowedKinds: readonly FileKind[]): string {
  const labels = allowedKinds.map((kind) => FILE_KIND_SPECS[kind].label);
  return joinWithNaturalLanguage(labels);
}

/**
 * Strongly-typed helper to transform an object’s values while preserving its keys.
 * No `as` casting — fully type-safe.
 */
function mapValues<T extends Record<string, unknown>, R>(
  obj: T,
  fn: <K extends keyof T>(key: K, value: T[K]) => R
): { [K in keyof T]: R } {
  const result: Partial<{ [K in keyof T]: R }> = {};
  (Object.keys(obj) as (keyof T)[]).forEach((key) => {
    result[key] = fn(key, obj[key]);
  });
  return result as { [K in keyof T]: R };
}

/** Map of per-mode policies, generated from UPLOAD_MODE_CONFIG + FILE_KIND_SPECS. */
export const UPLOAD_MODE_POLICY_MAP: Record<UploadMode, ModePolicy> = mapValues(
  UPLOAD_MODE_CONFIG,
  (_, allowedKinds): ModePolicy => {
    const extensions = uniqueValues(
      allowedKinds.flatMap((kind) => FILE_KIND_SPECS[kind].extensions)
    ).map((ext) => ext.toLowerCase());

    const mimes = uniqueValues(allowedKinds.flatMap((kind) => FILE_KIND_SPECS[kind].mimes));
    const label = buildHumanLabelFromKinds(allowedKinds);

    return { extensions, mimes, label };
  }
);

/**
 * Compatibility maps:
 * - ACCEPTED_EXTENSIONS_BY_MODE / ACCEPTED_MIME_TYPES_BY_MODE mirror your older shape
 *   so you can keep existing imports while migrating.
 */
export const ACCEPTED_EXTENSIONS_BY_MODE: Record<UploadMode, string[]> = mapValues(
  UPLOAD_MODE_POLICY_MAP,
  (_, policy) => policy.extensions
);

export const ACCEPTED_MIME_TYPES_BY_MODE: Record<UploadMode, string[]> = mapValues(
  UPLOAD_MODE_POLICY_MAP,
  (_, policy) => policy.mimes
);

/** Human-readable labels for display (“Choose CSV or XLSX/XLS”). */
export const HUMAN_LABEL_BY_MODE: Record<UploadMode, string> = mapValues(
  UPLOAD_MODE_POLICY_MAP,
  (_, policy) => policy.label
);

/**
 * Build a safe `<input type="file" accept="...">` string for a mode.
 *
 * @example
 * const accept = buildAcceptAttribute('pdf_image');
 * // -> ".pdf,.png,.jpg,.jpeg,.gif,.bmp,.webp,application/pdf,image/png,image/jpeg,..."
 */
export function buildAcceptAttribute(modeName: UploadMode): string {
  const modePolicy = UPLOAD_MODE_POLICY_MAP[modeName];
  return uniqueValues([...modePolicy.extensions, ...modePolicy.mimes]).join(',');
}

/**
 * Check if a file conforms to a mode.
 * Prefers extension checks (more reliable cross-browser), falls back to MIME.
 *
 * @returns true if file matches by extension or MIME
 */
export function isFileAllowedForMode(file: File, modeName: UploadMode): boolean {
  const modePolicy = UPLOAD_MODE_POLICY_MAP[modeName];
  const lowercaseName = file.name.toLowerCase();
  const matchesExtension = modePolicy.extensions.some((ext) => lowercaseName.endsWith(ext));
  const matchesMime = !!file.type && modePolicy.mimes.includes(file.type);
  return matchesExtension || matchesMime;
}

/**
 * Stable, human-insensitive fingerprint for deduping files in-memory.
 * (Good enough for UI duplicates; do not treat as a cryptographic hash.)
 *
 * @example
 * const fp = computeFileFingerprint(file); // "report.csv::1024::1712345678901"
 */
export function computeFileFingerprint(file: File): string {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

/**
 * Get the underlying FileKinds that a mode allows.
 * Useful for analytics, logging, or advanced UI logic.
 */
export function getAllowedKindsForMode(modeName: UploadMode): FileKind[] {
  return [...UPLOAD_MODE_CONFIG[modeName]];
}
