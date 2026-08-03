import type { FacetOption } from '../../api/types'
import {
    type FacetKind,
    selectClearAll,
    selectHobbyIds,
    selectNationalityCodes,
    useFiltersStore,
} from '../../store/filters-store'
import styles from './filter-chips.module.scss'

interface Chip {
    key: string
    label: string
    kind: FacetKind
    onRemove: () => void
}

interface FilterChipsProps {
    /** Reference lists, used only to turn the selected ids/codes into readable labels. */
    hobbyOptions: FacetOption[]
    nationalityOptions: FacetOption[]
}

function labelOf(options: FacetOption[], value: string): string {
    return options.find((option) => option.value === value)?.label ?? value
}

export function FilterChips({ hobbyOptions, nationalityOptions }: FilterChipsProps) {
    const hobbyIds = useFiltersStore(selectHobbyIds)
    const nationalityCodes = useFiltersStore(selectNationalityCodes)
    const toggleHobby = useFiltersStore((s) => s.toggleHobby)
    const toggleNationality = useFiltersStore((s) => s.toggleNationality)
    const onClearAll = useFiltersStore(selectClearAll)

    const chips: Chip[] = [
        ...hobbyIds.map((id) => ({
            key: `hobby:${id}`,
            label: `HOBBY: ${labelOf(hobbyOptions, id).toUpperCase()}`,
            kind: 'hobby' as const,
            onRemove: () => toggleHobby(id),
        })),
        ...nationalityCodes.map((code) => ({
            key: `nat:${code}`,
            label: `NAT: ${labelOf(nationalityOptions, code).toUpperCase()}`,
            kind: 'nationality' as const,
            onRemove: () => toggleNationality(code),
        })),
    ]

    if (chips.length === 0) return null

    return (
        <div className={styles.root}>
            {chips.map((chip) => (
                <button
                    key={chip.key}
                    type="button"
                    className={styles.chip}
                    data-kind={chip.kind}
                    onClick={chip.onRemove}
                >
                    {chip.label} <span className={styles.x}>✕</span>
                </button>
            ))}
            <button type="button" className={styles.clear} onClick={onClearAll}>
                CLEAR ALL
            </button>
        </div>
    )
}
