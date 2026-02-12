import React from 'react';

/**
 * Utility to highlight search terms within a string.
 *
 * Uses React.createElement instead of JSX syntax to ensure compatibility
 * if this file is treated as a standard TypeScript (.ts) file.
 */
export default function highlightText(
  text: string,
  highlight: string
): React.ReactNode {
  if (!highlight.trim()) return text;

  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return React.createElement(
    React.Fragment,
    null,
    parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase()
        ? React.createElement(
            'mark',
            { key: i, style: { backgroundColor: '#ffeb3b' } },
            part
          )
        : part
    )
  );
}
