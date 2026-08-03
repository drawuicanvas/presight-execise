import { useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { fetchHobbies, fetchNationalities, fetchUsers } from './api/users-api';
import type { SortDir, SortField, UserFilters } from './api/types';
import { TextFilter } from './components/text-filter/text-filter';
import { SortControls } from './components/sort-controls/sort-controls';
import { FacetCombobox } from './components/facet-combobox/facet-combobox';
import { FilterChips, type Chip } from './components/filter-chips/filter-chips';
import { FacetPanel } from './components/facet-panel/facet-panel';
import { UserList } from './components/user-list/user-list';
import styles from './app.module.scss';

const DEFAULT_FILTERS: UserFilters = {
  search: '',
  hobbies: [],
  nationalities: [],
  sortField: 'last_name',
  sortDir: 'asc',
};

export function App() {
  const [filters, setFilters] = useState<UserFilters>(DEFAULT_FILTERS);
  const patch = (p: Partial<UserFilters>) => setFilters((f) => ({ ...f, ...p }));

  const hobbiesQuery = useQuery({ queryKey: ['hobbies'], queryFn: fetchHobbies });
  const nationalitiesQuery = useQuery({ queryKey: ['nationalities'], queryFn: fetchNationalities });

  const usersQuery = useInfiniteQuery({
    queryKey: ['users', filters],
    queryFn: ({ pageParam }) => fetchUsers(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
  });

  const users = useMemo(() => usersQuery.data?.pages.flatMap((p) => p.users) ?? [], [usersQuery.data]);
  const firstPage = usersQuery.data?.pages[0];

  const toggle = (key: 'hobbies' | 'nationalities', name: string) =>
    patch({
      [key]: filters[key].includes(name)
        ? filters[key].filter((x) => x !== name)
        : [...filters[key], name],
    });

  const chips: Chip[] = [
    ...filters.hobbies.map((h) => ({ label: `HOBBY: ${h.toUpperCase()}`, kind: 'hobby' as const, onRemove: () => toggle('hobbies', h) })),
    ...filters.nationalities.map((n) => ({ label: `NAT: ${n.toUpperCase()}`, kind: 'nationality' as const, onRemove: () => toggle('nationalities', n) })),
  ];
  const clearAll = () => setFilters(DEFAULT_FILTERS);

  return (
    <div className={styles.page}>
      {/* Block 1 — brand · text filter · sort */}
      <header className={styles.block1}>
        <div className={styles.brand}>
          <span className={styles.logo}>GRID<em>//</em></span>
          <span className={styles.title}>USER DIRECTORY</span>
        </div>
        <div className={styles.controls}>
          <TextFilter value={filters.search} onChange={(search) => patch({ search })} />
          <SortControls
            field={filters.sortField}
            dir={filters.sortDir}
            onFieldChange={(sortField: SortField) => patch({ sortField })}
            onDirChange={(sortDir: SortDir) => patch({ sortDir })}
          />
        </div>
      </header>

      {/* Block 2 — comboboxes · applied filters · result count */}
      <section className={styles.block2}>
        <div className={styles.filtersRow}>
          <FacetCombobox
            placeholder="+ HOBBY FILTER — TYPE TO SEARCH"
            options={hobbiesQuery.data ?? []}
            selected={filters.hobbies}
            onToggle={(h) => toggle('hobbies', h)}
            accent="yellow"
          />
          <FacetCombobox
            placeholder="+ NATIONALITY FILTER — TYPE TO SEARCH"
            options={nationalitiesQuery.data ?? []}
            selected={filters.nationalities}
            onToggle={(n) => toggle('nationalities', n)}
            accent="pink"
          />
          <FilterChips chips={chips} onClearAll={clearAll} />
        </div>
        <div className={styles.count}>
          {firstPage ? `${firstPage.total.toLocaleString()} USERS ON TRACK` : '— USERS ON TRACK'}
        </div>
      </section>

      {/* Block 3 — facet panels (sticky sidebar on md+) · user list */}
      <section className={styles.block3}>
        <aside className={styles.sidebar}>
          <FacetPanel
            title="TOP HOBBIES"
            facets={firstPage?.hobbyFacets ?? []}
            selected={filters.hobbies}
            onToggle={(h) => toggle('hobbies', h)}
            accent="pink"
          />
          <FacetPanel
            title="NATIONALITIES"
            facets={firstPage?.nationalityFacets ?? []}
            selected={filters.nationalities}
            onToggle={(n) => toggle('nationalities', n)}
            accent="yellow"
          />
        </aside>
        <main className={styles.list}>
          <UserList
            users={users}
            total={firstPage?.total}
            isLoading={usersQuery.isLoading}
            isError={usersQuery.isError}
            isFetchingNextPage={usersQuery.isFetchingNextPage}
            hasNextPage={usersQuery.hasNextPage}
            onLoadMore={() => {
              if (usersQuery.hasNextPage && !usersQuery.isFetchingNextPage) usersQuery.fetchNextPage();
            }}
            onRetry={() => (usersQuery.isLoading || users.length === 0 ? usersQuery.refetch() : usersQuery.fetchNextPage())}
            onClearAll={clearAll}
          />
        </main>
      </section>
    </div>
  );
}
