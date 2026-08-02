import type { UserSearchResult } from '@presight/schema'
import { useEffect, useState } from 'react'
import { fetchUsers } from './api/users.ts'

const PAGE_SIZE = 25

export function App() {
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)
    const [result, setResult] = useState<UserSearchResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const controller = new AbortController()
        const timer = setTimeout(() => {
            setIsLoading(true)
            setError(null)

            fetchUsers({ q: query, page, pageSize: PAGE_SIZE }, controller.signal)
                .then(setResult)
                .catch((cause: unknown) => {
                    if (controller.signal.aborted) return
                    setError(cause instanceof Error ? cause.message : 'Failed to load users')
                })
                .finally(() => {
                    if (!controller.signal.aborted) setIsLoading(false)
                })
        }, 250)

        return () => {
            clearTimeout(timer)
            controller.abort()
        }
    }, [query, page])

    return (
        <main className="app">
            <h1>User search</h1>

            <input
                type="search"
                className="search"
                placeholder="Search by name…"
                value={query}
                onChange={(event) => {
                    setQuery(event.target.value)
                    setPage(1)
                }}
            />

            {error && <p className="error">{error}</p>}
            {isLoading && <p className="status">Loading…</p>}

            {result && (
                <>
                    <p className="status">
                        {result.total} user(s) · page {result.page} of {Math.max(result.pageCount, 1)}
                    </p>

                    <ul className="users">
                        {result.items.map((user) => (
                            <li key={user.id} className="user">
                                <img src={user.avatar} alt="" width={48} height={48} loading="lazy" />
                                <div>
                                    <strong>
                                        {user.first_name} {user.last_name}
                                    </strong>
                                    <span>
                                        {user.age} · {user.nationality}
                                    </span>
                                    <span className="hobbies">{user.hobbies.join(', ') || 'No hobbies'}</span>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="pagination">
                        <button type="button" disabled={result.page <= 1} onClick={() => setPage(page - 1)}>
                            Previous
                        </button>
                        <button
                            type="button"
                            disabled={result.page >= result.pageCount}
                            onClick={() => setPage(page + 1)}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </main>
    )
}
