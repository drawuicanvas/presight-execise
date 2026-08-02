import express from 'express'
import type { User } from '@presight/schema'
import { userSchema } from '@presight/schema'
const app = express()
const port = Number(process.env.PORT ?? 3000)

app.get('/hello', (_req, res) => {
    const parsedUser = userSchema.parse(user)
    res.json({ message: 'Hello, world!', data: parsedUser })
})

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`)
})

const user: User = {
    id: '1',
    avatar: 'https://example.com/avatar.png',
    first_name: 'John',
    last_name: 'Doe',
    age: 30,
    nationality: 'US',
    hobbies: ['Reading', 'Traveling'],
}
console.log('User:', user)
