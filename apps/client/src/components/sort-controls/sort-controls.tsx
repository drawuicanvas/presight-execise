import type { SortDir, SortField } from '../../api/types';
import styles from './sort-controls.module.scss';

const FIELDS: { value: SortField; label: string }[] = [
  { value: 'first_name', label: 'FIRST NAME' },
  { value: 'last_name', label: 'LAST NAME' },
  { value: 'age', label: 'AGE' },
  { value: 'nationality', label: 'NATIONALITY' },
];

interface SortControlsProps {
  field: SortField;
  dir: SortDir;
  onFieldChange: (field: SortField) => void;
  onDirChange: (dir: SortDir) => void;
}

export function SortControls({ field, dir, onFieldChange, onDirChange }: SortControlsProps) {
  return (
    <div className={styles.root}>
      <label className={styles.selectWrap}>
        <span className={styles.prefix}>SORT:</span>
        <select
          className={styles.select}
          value={field}
          aria-label="Sort field"
          onChange={(e) => onFieldChange(e.currentTarget.value as SortField)}
        >
          {FIELDS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </label>
      <div className={styles.dirGroup} role="group" aria-label="Sort direction">
        <button
          type="button"
          className={styles.dirBtn}
          data-active={dir === 'asc' || undefined}
          onClick={() => onDirChange('asc')}
        >
          ASC
        </button>
        <button
          type="button"
          className={styles.dirBtn}
          data-active={dir === 'desc' || undefined}
          onClick={() => onDirChange('desc')}
        >
          DESC
        </button>
      </div>
    </div>
  );
}
