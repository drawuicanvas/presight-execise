import { DatabaseSync } from 'node:sqlite'

/** Package root, so `DATABASE_FILE` can stay a path relative to it (as in `.env.example`). */
const PACKAGE_ROOT = new URL('../', import.meta.url)

const DB_FILE = new URL(process.env.DATABASE_FILE ?? 'data/user_data.db', PACKAGE_ROOT)

/** Shared read-only connection. The API never writes, seeding is done by `pnpm run data:seed`. */
export const db = new DatabaseSync(DB_FILE.pathname, { readOnly: true })
