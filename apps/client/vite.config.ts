import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [react()],
    server: {
        // Must match the server's CORS_ORIGIN allowlist. strictPort makes a clash fail loudly
        // rather than silently drifting to another port that CORS would then reject.
        port: 5175,
        strictPort: true,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
})
