// vite.config.js
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
export default defineConfig({
    build: {
        lib: {
            // Could also be a dictionary or array of multiple entry points.
            entry: 'src/index.ts',
            name: 'schema',
            fileName: 'index',
            // Change this to the formats you want to support.
            // Don't forgot to update your package.json as well.
            formats: ['es'],
        },
        sourcemap: true,
        outDir: 'dist',
        rollupOptions: {
            // External packages that should not be bundled into your library.
            external: ['zod'],
        },
        copyPublicDir: false,
    },
    plugins: [dts({ tsconfigPath: 'tsconfig.json' })],
})
