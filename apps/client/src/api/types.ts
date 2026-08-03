export interface User {
  id: string;
  firstName: string;
  lastName: string;
  nationality: string;
  age: number;
  hobbies: string[];
  avatarHue: number;
}

export type SortField = 'first_name' | 'last_name' | 'age' | 'nationality';
export type SortDir = 'asc' | 'desc';

export interface UserFilters {
  search: string;
  hobbies: string[];
  nationalities: string[];
  sortField: SortField;
  sortDir: SortDir;
}

export interface FacetCount {
  name: string;
  count: number;
}

export interface UsersPage {
  users: User[];
  nextPage: number | null;
  total: number;
  hobbyFacets: FacetCount[];       // top 20 for the CURRENT result set
  nationalityFacets: FacetCount[]; // top 20 for the CURRENT result set
}
