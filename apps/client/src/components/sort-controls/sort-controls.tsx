import { Combobox, useCombobox } from '@mantine/core'
import { ChevronDown } from 'lucide-react'
import type { UserSortField } from '@presight/schema'
import {
    selectSetSortDir,
    selectSetSortField,
    selectSortDir,
    selectSortField,
    useFiltersStore,
} from '../../store/filters-store'
import styles from './sort-controls.module.scss'

const FIELDS: { value: UserSortField; label: string }[] = [
    { value: 'first_name', label: 'FIRST NAME' },
    { value: 'last_name', label: 'LAST NAME' },
    { value: 'age', label: 'AGE' },
    { value: 'nationality', label: 'NATIONALITY' },
]

export function SortControls() {
    const field = useFiltersStore(selectSortField)
    const dir = useFiltersStore(selectSortDir)
    const onFieldChange = useFiltersStore(selectSetSortField)
    const onDirChange = useFiltersStore(selectSetSortDir)

    const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() })
    const activeLabel = FIELDS.find((f) => f.value === field)?.label ?? ''

    return (
        <div className={styles.root}>
            {/* Portalled on purpose: `.root` is skewed, and a transform applies to descendants, so
                an inline dropdown would render skewed too — unlike the facet pickers'.
                `floatingStrategy="fixed"` makes Mantine compute viewport-relative coordinates, which
                is what a body-portalled dropdown needs; `.dropdown` sets the matching
                `position: fixed`, since headless mode ships no Popover CSS to supply it. */}
            <Combobox
                store={combobox}
                floatingStrategy="fixed"
                onOptionSubmit={(value) => {
                    onFieldChange(value as UserSortField)
                    combobox.closeDropdown()
                }}
            >
                {/* `targetType="button"` gives the trigger Space/Enter handling and arrow-key nav. */}
                <Combobox.Target targetType="button" withExpandedAttribute>
                    <button
                        type="button"
                        className={styles.trigger}
                        aria-label="Sort field"
                        onClick={() => combobox.toggleDropdown()}
                    >
                        <span className={styles.prefix}>SORT:</span>
                        <span className={styles.value}>{activeLabel}</span>
                        <ChevronDown
                            className={styles.chevron}
                            size={14}
                            strokeWidth={3}
                            aria-hidden
                            data-open={combobox.dropdownOpened || undefined}
                        />
                    </button>
                </Combobox.Target>

                <Combobox.Dropdown className={styles.dropdown}>
                    <Combobox.Options className={styles.options}>
                        {FIELDS.map((f) => (
                            <Combobox.Option
                                key={f.value}
                                value={f.value}
                                active={f.value === field}
                                className={styles.option}
                                data-selected={f.value === field || undefined}
                            >
                                {f.label}
                            </Combobox.Option>
                        ))}
                    </Combobox.Options>
                </Combobox.Dropdown>
            </Combobox>

            <div className={styles.dirGroup} role="group" aria-label="Sort direction">
                <button
                    type="button"
                    className={styles.dirBtn}
                    data-active={dir === 'asc' || undefined}
                    aria-pressed={dir === 'asc'}
                    onClick={() => onDirChange('asc')}
                >
                    ASC
                </button>
                <button
                    type="button"
                    className={styles.dirBtn}
                    data-active={dir === 'desc' || undefined}
                    aria-pressed={dir === 'desc'}
                    onClick={() => onDirChange('desc')}
                >
                    DESC
                </button>
            </div>
        </div>
    )
}
