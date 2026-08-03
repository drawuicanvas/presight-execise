import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HeadlessMantineProvider } from '@mantine/core'
import { App } from './app'
import './styles/global.scss'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { staleTime: 30_000, retry: 1 },
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
