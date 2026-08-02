import { z } from 'zod'

/** Maximum number of hobbies a single user can have. */
export const MAX_HOBBIES_PER_USER = 10

export const userSchema = z.object({
    id: z.string().min(1),
    avatar: z.url(),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    age: z.number().int().min(0).max(120),
    nationality: z.string().min(1),
    hobbies: z.array(z.string().min(1)).min(0).max(MAX_HOBBIES_PER_USER),
})

export type User = z.infer<typeof userSchema>
