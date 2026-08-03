import styles from './filter-chips.module.scss';

export interface Chip {
  label: string;
  kind: 'hobby' | 'nationality';
  onRemove: () => void;
}

interface FilterChipsProps {
  chips: Chip[];
  onClearAll: () => void;
}

export function FilterChips({ chips, onClearAll }: FilterChipsProps) {
  if (chips.length === 0) return null;
  return (
    <div className={styles.root}>
      {chips.map((chip) => (
        <button key={chip.label} type="button" className={styles.chip} data-kind={chip.kind} onClick={chip.onRemove}>
          {chip.label} <span className={styles.x}>✕</span>
        </button>
      ))}
      <button type="button" className={styles.clear} onClick={onClearAll}>
        CLEAR ALL
      </button>
    </div>
  );
}
