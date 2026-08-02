import { z } from 'zod'

/**
 * `hobbies` table.
 *
 * CREATE TABLE hobbies (
 *     id    TEXT PRIMARY KEY,
 *     label TEXT NOT NULL UNIQUE
 * );
 */
export const hobbySchema = z.object({
    id: z.string().min(1),
    label: z.string().min(1),
})

export type Hobby = z.infer<typeof hobbySchema>
