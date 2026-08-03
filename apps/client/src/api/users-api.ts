// Mock API layer — swap the bodies of these three functions with real fetch calls.
// Signatures are already shaped for TanStack Query (useQuery / useInfiniteQuery).
import { ALL_USERS, HOBBIES, NATIONALITIES } from './mock-data';
import type { FacetCount, SortField, User, UserFilters, UsersPage } from './types';

export const PAGE_SIZE = 40;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function topFacets(rows: User[], getValues: (u: User) => string[]): FacetCount[] {
  const m = new Map<string, number>();
  for (const u of rows) for (const v of getValues(u)) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => ({ name, count }));
}

/** GET /api/hobbies — predefined list for the combobox */
export async function fetchHobbies(): Promise<string[]> {
  await delay(300);
  return HOBBIES;
}

/** GET /api/nationalities — predefined list for the combobox */
export async function fetchNationalities(): Promise<string[]> {
  await delay(300);
  return NATIONALITIES;
}

/** GET /api/users?page=&search=&hobbies=&nationalities=&sort=&dir= */
export async function fetchUsers(filters: UserFilters, page: number): Promise<UsersPage> {
  await delay(550);
  const q = filters.search.trim().toLowerCase();
  let rows = ALL_USERS.filter(
    (u) =>
      (!q || u.firstName.toLowerCase().includes(q) || u.lastName.toLowerCase().includes(q)) &&
      (!filters.hobbies.length || u.hobbies.some((h) => filters.hobbies.includes(h))) &&
      (!filters.nationalities.length || filters.nationalities.includes(u.nationality)),
  );
  const dir = filters.sortDir === 'asc' ? 1 : -1;
  const key: Record<SortField, (u: User) => string | number> = {
    first_name: (u) => u.firstName,
    last_name: (u) => u.lastName,
    age: (u) => u.age,
    nationality: (u) => u.nationality,
  };
  const k = key[filters.sortField];
  rows = [...rows].sort((a, b) => {
    const x = k(a), y = k(b);
    return (x < y ? -1 : x > y ? 1 : 0) * dir;
  });
  const start = page * PAGE_SIZE;
  return {
    users: rows.slice(start, start + PAGE_SIZE),
    nextPage: start + PAGE_SIZE < rows.length ? page + 1 : null,
    total: rows.length,
    hobbyFacets: topFacets(rows, (u) => u.hobbies),
    nationalityFacets: topFacets(rows, (u) => [u.nationality]),
  };
}
