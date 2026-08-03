import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HeadlessMantineProvider } from '@mantine/core'
import { App } from './app'
import './styles/global.scss'

// No default staleTime: how long each response stays fresh depends on the data, so every query
// states its own (see STALE_TIME in app.tsx).
const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1 },
    },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <HeadlessMantineProvider>
                <App />
            </HeadlessMantineProvider>
        </QueryClientProvider>
    </React.StrictMode>,
)
