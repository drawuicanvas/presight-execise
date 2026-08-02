import { z } from 'zod'
import { userSchema } from './user'

/** Query params arrive as `string | string[]`, normalise them to `string[]`. */
const stringList = z
    .union([z.string(), z.array(z.string())])
    .transform((value) => (Array.isArray(value) ? value : value.split(',')))
    .pipe(z.array(z.string().trim().min(1)))

export const DEFAULT_PAGE_SIZE = 25
export const MAX_PAGE_SIZE = 100

export const userSearchQuerySchema = z.object({
    q: z.string().trim().max(100).optional(),
    nationality: stringList.optional(),
    hobbies: stringList.optional(),
    minAge: z.coerce.number().int().min(0).max(120).optional(),
    maxAge: z.coerce.number().int().min(0).max(120).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
})

export type UserSearchQuery = z.infer<typeof userSearchQuerySchema>
export type UserSearchQueryInput = z.input<typeof userSearchQuerySchema>

export const userSearchResultSchema = z.object({
    items: z.array(userSchema),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    pageCount: z.number().int().min(0),
})

export type UserSearchResult = z.infer<typeof userSearchResultSchema>

export const userFacetsSchema = z.object({
    nationalities: z.array(z.object({ value: z.string(), count: z.number().int().min(0) })),
    hobbies: z.array(z.object({ value: z.string(), count: z.number().int().min(0) })),
})

export type UserFacets = z.infer<typeof userFacetsSchema>

export const apiErrorSchema = z.object({
    error: z.object({
        message: z.string(),
        code: z.string(),
        details: z.unknown().optional(),
    }),
})

export type ApiError = z.infer<typeof apiErrorSchema>
