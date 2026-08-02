import { useState } from 'react'
import { userSchema, type User } from '@presight/schema'
export function App() {
    const [count, setCount] = useState(0)
    const user: User = {
        id: '1',
        avatar: 'https://example.com/avatar.png',
        first_name: 'John',
        last_name: 'Doe',
        age: 30,
        nationality: 'US',
        hobbies: ['Reading', 'Traveling'],
    }
    const parsedUser = userSchema.parse(user)
    console.log('Parsed User:', parsedUser)
    return (
        <main className="app">
            <button
                onClick={() => {
                    setCount(Number(count) + 1)
                }}
            >
                Increment
            </button>
            <p>{count}</p>
        </main>
    )
}
