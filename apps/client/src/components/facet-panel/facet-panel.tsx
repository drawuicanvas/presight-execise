import { useState } from 'react'
import { Collapse } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import type { FacetValue } from '@presight/schema'
import styles from './facet-panel.module.scss'

interface FacetPanelProps {
    title: string
    /** Top 20 for the current result set. `value` is the id/code to filter by, `label` is shown. */
    facets: FacetValue[]
    /** Selected `value`s, not labels. */
    selected: string[]
    onToggle: (value: string) => void
    accent: 'yellow' | 'pink'
}

/** Facet list with counts. Collapsible on mobile (< 641px); always open on md+. */
export function FacetPanel({ title, facets, selected, onToggle, accent }: FacetPanelProps) {
    const isMdUp = useMediaQuery('(min-width: 641px)', false)
    const [open, setOpen] = useState(false)
    const opened = isMdUp || open

    return (
        <div className={styles.panel}>
            <button
                type="button"
                className={styles.header}
                onClick={() => setOpen((o) => !o)}
                aria-expanded={opened}
                disabled={isMdUp}
            >
                <span className={styles.title}>
                    {title} · {facets.length}
                </span>
                <span className={styles.caret}>{opened ? '▴' : '▾'}</span>
            </button>
            <Collapse expanded={opened}>
                <ul className={styles.rows}>
                    {facets.map((facet) => {
                        const isSelected = selected.includes(facet.value)
                        return (
                            <li key={facet.value}>
                                <button
                                    type="button"
                                    className={styles.row}
                                    data-selected={isSelected || undefined}
                                    data-accent={accent}
                                    aria-pressed={isSelected}
                                    onClick={() => onToggle(facet.value)}
                                >
                                    <span className={styles.name}>
                                        {isSelected && '● '}
                                        {facet.label}
                                    </span>
                                    <span className={styles.count} data-accent={accent}>
                                        {facet.count}
                                    </span>
                                </button>
                            </li>
                        )
                    })}
                    {facets.length === 0 && <li className={styles.none}>NO DATA</li>}
                </ul>
            </Collapse>
        </div>
    )
}
