import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import chalk from 'chalk';
import type { SelectItem } from '../types.js';
import { t } from '../i18n/index.js';
import { filterItems } from './filterItems.js';

export interface AutocompleteSelectProps {
  items: SelectItem[];
  title: string;
  onSelect: (item: SelectItem) => void;
  onCancel?: () => void;
  initialFilter?: string;
  visibleLimit?: number;
}

export { filterItems };

export function AutocompleteSelect({
  items,
  title,
  onSelect,
  onCancel,
  initialFilter = '',
  visibleLimit = 12,
}: AutocompleteSelectProps): React.ReactElement {
  const [filter, setFilter] = useState(initialFilter);
  const [cursor, setCursor] = useState(0);

  const filtered = useMemo(() => filterItems(items, filter), [items, filter]);

  useEffect(() => {
    setCursor(0);
  }, [filter]);

  useInput((_input, key) => {
    if (key.escape && onCancel) {
      onCancel();
      return;
    }
    if (key.upArrow) {
      setCursor((c) => (filtered.length === 0 ? 0 : (c - 1 + filtered.length) % filtered.length));
      return;
    }
    if (key.downArrow) {
      setCursor((c) => (filtered.length === 0 ? 0 : (c + 1) % filtered.length));
      return;
    }
    if (key.return && filtered[cursor]) {
      onSelect(filtered[cursor]!);
    }
  });

  const windowStart = Math.max(0, Math.min(cursor - Math.floor(visibleLimit / 2), filtered.length - visibleLimit));
  const visible = filtered.slice(Math.max(0, windowStart), Math.max(0, windowStart) + visibleLimit);

  return (
    <Box flexDirection="column">
      <Text>{chalk.cyan(title)}</Text>
      <Box>
        <Text>{chalk.gray('> ')}</Text>
        <TextInput value={filter} onChange={setFilter} placeholder="…" />
      </Box>
      <Text dimColor>{t('filterHint', { filter: filter || '—' })}</Text>
      <Box flexDirection="column" marginTop={1}>
        {filtered.length === 0 ? (
          <Text dimColor>{t('filterEmpty')}</Text>
        ) : (
          visible.map((item) => {
            const absoluteIndex = filtered.indexOf(item);
            const selected = absoluteIndex === cursor;
            return (
              <Text key={item.value} color={selected ? 'green' : undefined}>
                {selected ? chalk.green('❯ ') : '  '}
                {item.label}
              </Text>
            );
          })
        )}
      </Box>
    </Box>
  );
}
