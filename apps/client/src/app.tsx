import { useMemo, useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useDebouncedValue } from '@mantine/hooks'
import type { SortDirection, UserSortField } from '@presight/schema'
import { fetchHobbies, fetchNationalities, fetchUsers, nextPageOffset } from './api/users-api'
import { type FacetOption, toHobbyOption, toNationalityOption, type UserFilters } from './api/types'
import { TextFilter } from './components/text-filter/text-filter'
import { SortControls } from './components/sort-controls/sort-controls'
import { FacetCombobox } from './components/facet-combobox/facet-combobox'
import { FilterChips, type Chip } from './components/filter-chips/filter-chips'
import { FacetPanel } from './components/facet-panel/facet-panel'
import { UserList } from './components/user-list/user-list'
import styles from './app.module.scss'

const DEFAULT_FILTERS: UserFilters = {
    search: '',
    hobbyIds: [],
    nationalityCodes: [],
    sortField: 'last_name',
    sortDir: 'asc',
}

/** Which filter list a value belongs to, so one toggle handler can serve both facets. */
type FacetKey = 'hobbyIds' | 'nationalityCodes'

/** Selected values are ids/codes; resolve them to labels for display. */
function labelOf(options: FacetOption[], value: string): string {
    return options.find((option) => option.value === value)?.label ?? value
}

export function App() {
    const [filters, setFilters] = useState<UserFilters>(DEFAULT_FILTERS)
    const patch = (p: Partial<UserFilters>) => setFilters((f) => ({ ...f, ...p }))

    const hobbiesQuery = useQuery({ queryKey: ['hobbies'], queryFn: fetchHobbies })
    const nationalitiesQuery = useQuery({ queryKey: ['nationalities'], queryFn: fetchNationalities })

    const hobbyOptions: FacetOption[] = useMemo(() => (hobbiesQuery.data ?? []).map(toHobbyOption), [hobbiesQuery.data])
    const nationalityOptions: FacetOption[] = useMemo(
        () => (nationalitiesQuery.data ?? []).map(toNationalityOption),
        [nationalitiesQuery.data],
    )

    // The API filters on a name prefix, so refetching on every keystroke would fire a request per
    // character. Debounce the value that reaches the query key, not the value in the input.
    const [debouncedSearch] = useDebouncedValue(filters.search, 300)
    const query = useMemo<UserFilters>(() => ({ ...filters, search: debouncedSearch }), [filters, debouncedSearch])

    const usersQuery = useInfiniteQuery({
        queryKey: ['users', query],
        queryFn: ({ pageParam }) => fetchUsers(query, pageParam),
        initialPageParam: 0,
        getNextPageParam: nextPageOffset,
    })

    const users = useMemo(() => usersQuery.data?.pages.flatMap((p) => p.users) ?? [], [usersQuery.data])
    // Facets and the total describe the whole filtered set, so the first page is as good as any.
    const firstPage = usersQuery.data?.pages[0]

    const toggle = (key: FacetKey, value: string) =>
        patch({
            [key]: filters[key].includes(value) ? filters[key].filter((x) => x !== value) : [...filters[key], value],
        })

    const chips: Chip[] = [
        ...filters.hobbyIds.map((id) => ({
            label: `HOBBY: ${labelOf(hobbyOptions, id).toUpperCase()}`,
            kind: 'hobby' as const,
            onRemove: () => toggle('hobbyIds', id),
        })),
        ...filters.nationalityCodes.map((code) => ({
            label: `NAT: ${labelOf(nationalityOptions, code).toUpperCase()}`,
            kind: 'nationality' as const,
            onRemove: () => toggle('nationalityCodes', code),
        })),
    ]
    const clearAll = () => setFilters(DEFAULT_FILTERS)

    return (
        <div className={styles.page}>
            {/* Block 1 — brand · text filter · sort */}
            <header className={styles.block1}>
                <div className={styles.brand}>
                    <span className={styles.logo}>LIST</span>
                    <div className={styles.title}>USER DIRECTORY</div>
                </div>
                <div className={styles.controls}>
                    <TextFilter value={filters.search} onChange={(search) => patch({ search })} />
                    <SortControls
                        field={filters.sortField}
                        dir={filters.sortDir}
                        onFieldChange={(sortField: UserSortField) => patch({ sortField })}
                        onDirChange={(sortDir: SortDirection) => patch({ sortDir })}
                    />
                </div>
            </header>

            {/* Block 2 — comboboxes · applied filters · result count */}
            <section className={styles.block2}>
                <div className={styles.filtersRow}>
                    <FacetCombobox
                        placeholder="+ HOBBY FILTER — TYPE TO SEARCH"
                        options={hobbyOptions}
                        selected={filters.hobbyIds}
                        onToggle={(id) => toggle('hobbyIds', id)}
                        accent="yellow"
                    />
                    <FacetCombobox
                        placeholder="+ NATIONALITY FILTER — TYPE TO SEARCH"
                        options={nationalityOptions}
                        selected={filters.nationalityCodes}
                        onToggle={(code) => toggle('nationalityCodes', code)}
                        accent="pink"
                    />
                    <FilterChips chips={chips} onClearAll={clearAll} />
                </div>
                {/* On failure the list itself reports the error; a placeholder count only adds noise. */}
                {!usersQuery.isError && (
                    <div className={styles.count}>
                        {firstPage
                            ? `${firstPage.pagination.total.toLocaleString()} USERS ON TRACK`
                            : '— USERS ON TRACK'}
                    </div>
                )}
            </section>

            {/* Block 3 — facet panels (sticky sidebar on md+) · user list */}
            <section className={styles.block3}>
                <aside className={styles.sidebar}>
                    <FacetPanel
                        title="TOP HOBBIES"
                        facets={firstPage?.top_hobbies ?? []}
                        selected={filters.hobbyIds}
                        onToggle={(id) => toggle('hobbyIds', id)}
                        accent="pink"
                    />
                    <FacetPanel
                        title="NATIONALITIES"
                        facets={firstPage?.top_nationalities ?? []}
                        selected={filters.nationalityCodes}
                        onToggle={(code) => toggle('nationalityCodes', code)}
                        accent="yellow"
                    />
                </aside>
                <main className={styles.list}>
                    <UserList
                        users={users}
                        total={firstPage?.pagination.total}
                        isLoading={usersQuery.isLoading}
                        isError={usersQuery.isError}
                        isFetchingNextPage={usersQuery.isFetchingNextPage}
                        hasNextPage={usersQuery.hasNextPage}
                        onLoadMore={() => {
                            if (usersQuery.hasNextPage && !usersQuery.isFetchingNextPage) usersQuery.fetchNextPage()
                        }}
                        onRetry={() =>
                            usersQuery.isLoading || users.length === 0
                                ? usersQuery.refetch()
                                : usersQuery.fetchNextPage()
                        }
                        onClearAll={clearAll}
                    />
                </main>
            </section>
        </div>
    )
}
