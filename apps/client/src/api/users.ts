import type { UserSearchResult } from '@presight/schema'
import { userSearchResultSchema } from '@presight/schema'

export interface FetchUsersParams {
    q?: string
    page?: number
    pageSize?: number
}

export async function fetchUsers(params: FetchUsersParams, signal?: AbortSignal): Promise<UserSearchResult> {
    const search = new URLSearchParams()

    if (params.q) search.set('q', params.q)
    if (params.page) search.set('page', String(params.page))
    if (params.pageSize) search.set('pageSize', String(params.pageSize))

    const response = await fetch(`/api/users?${search.toString()}`, {
        signal,
        headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
    }

    return userSearchResultSchema.parse(await response.json())
}
