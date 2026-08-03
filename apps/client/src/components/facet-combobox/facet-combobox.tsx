import { useMemo, useState } from 'react';
import { Combobox, useCombobox } from '@mantine/core';
import styles from './facet-combobox.module.scss';

interface FacetComboboxProps {
  placeholder: string;
  options: string[]; // predefined list from the API
  selected: string[];
  onToggle: (value: string) => void;
  accent: 'yellow' | 'pink';
}

/** Type-to-filter multi-select over a predefined list (Mantine headless Combobox). */
export function FacetCombobox({ placeholder, options, selected, onToggle, accent }: FacetComboboxProps) {
  const [query, setQuery] = useState('');
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const filtered = useMemo(
    () => options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase())),
    [options, query],
  );

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(value) => {
        onToggle(value);
        setQuery('');
      }}
    >
      <Combobox.Target>
        <input
          className={styles.input}
          data-accent={accent}
          value={query}
          placeholder={placeholder}
          aria-label={placeholder}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => combobox.closeDropdown()}
          onChange={(e) => {
            setQuery(e.currentTarget.value);
            combobox.openDropdown();
          }}
        />
      </Combobox.Target>

      <Combobox.Dropdown className={styles.dropdown} data-accent={accent}>
        <Combobox.Options className={styles.options}>
          {filtered.length === 0 && (
            <Combobox.Empty className={styles.empty}>NO MATCH FOR “{query}”</Combobox.Empty>
          )}
          {filtered.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <Combobox.Option
                key={option}
                value={option}
                className={styles.option}
                data-selected={isSelected || undefined}
              >
                <span>{option.toUpperCase()}</span>
                {isSelected && <span className={styles.check}>✓</span>}
              </Combobox.Option>
            );
          })}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
