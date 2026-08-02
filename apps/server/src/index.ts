import express, { type ErrorRequestHandler } from 'express'
import { z } from 'zod'
import { type Hobby, hobbySchema, type Nationality, nationalitySchema } from '@presight/schema'
import { db } from './db.ts'

const app = express()
const port = Number(process.env.PORT ?? 3000)

/** Rows leave the database untyped, so every response is parsed before it reaches the client. */
const hobbyListSchema = z.array(hobbySchema)
const nationalityListSchema = z.array(nationalitySchema)

const selectHobbies = db.prepare('SELECT id, label FROM hobbies ORDER BY label')
const selectNationalities = db.prepare('SELECT code, label FROM nationalities ORDER BY label')

app.get('/hobbies', (_req, res) => {
    const hobbies: Hobby[] = hobbyListSchema.parse(selectHobbies.all())
    res.json(hobbies)
})

app.get('/nationalities', (_req, res) => {
    const nationalities: Nationality[] = nationalityListSchema.parse(selectNationalities.all())
    res.json(nationalities)
})

const handleError: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({ error: 'Internal Server Error' })
}

app.use(handleError)

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`)
})
