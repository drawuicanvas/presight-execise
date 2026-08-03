import styles from './text-filter.module.scss'

interface TextFilterProps {
    value: string
    onChange: (value: string) => void
}

/** Single search box — matches first_name OR last_name. */
export function TextFilter({ value, onChange }: TextFilterProps) {
    return (
        <input
            className={styles.input}
            type="search"
            value={value}
            placeholder="SEARCH NAME"
            aria-label="Filter by first or last name"
            onChange={(e) => onChange(e.currentTarget.value)}
        />
    )
}
