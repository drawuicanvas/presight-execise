import { selectSearch, selectSetSearch, useFiltersStore } from '../../store/filters-store'
import styles from './text-filter.module.scss'

/** Single search box — matches first_name OR last_name. */
export function TextFilter() {
    const value = useFiltersStore(selectSearch)
    const setSearch = useFiltersStore(selectSetSearch)

    return (
        <input
            className={styles.input}
            type="search"
            value={value}
            placeholder="SEARCH NAME"
            aria-label="Filter by first or last name"
            onChange={(e) => setSearch(e.currentTarget.value)}
        />
    )
}
