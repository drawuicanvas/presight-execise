import { useState } from 'react'
import { UserRound } from 'lucide-react'
import type { UserSearchItem } from '@presight/schema'
import { Flag } from '../flag/flag'
import styles from './user-card.module.scss'

interface UserCardProps {
    user: UserSearchItem
}

/**
 * |----------------------------------|
 * | avatar      first_name+last_name |
 * |             nationality      age |
 * |             (2 hobbies) (+n)     |
 * |----------------------------------|
 */
export function UserCard({ user }: UserCardProps) {
    const [first, second] = user.hobbies
    const extra = Math.max(0, user.hobbies.length - 2)

    // Avatars are third-party URLs that can 404 or be blocked. Storing the src that failed rather
    // than a boolean means the flag clears itself if this component is reused for another user —
    // a stale `true` would otherwise hide a perfectly good portrait.
    const [failedSrc, setFailedSrc] = useState<string | null>(null)
    const avatarUnavailable = failedSrc === user.avatar

    return (
        <article className={styles.card}>
            {avatarUnavailable ? (
                <span className={styles.avatarFallback} aria-hidden>
                    <UserRound size={22} strokeWidth={2} />
                </span>
            ) : (
                <img
                    className={styles.avatar}
                    src={user.avatar}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={() => setFailedSrc(user.avatar)}
                />
            )}
            <div className={styles.body}>
                <div className={styles.line}>
                    <span className={styles.name}>
                        {user.first_name} {user.last_name}
                    </span>
                    <span className={styles.age}>{user.age}</span>
                </div>
                <div className={styles.line}>
                    <span className={styles.nationality}>
                        <Flag code={user.nationality_code} />
                        {user.nationality_label.toUpperCase()}
                    </span>
                    <span className={styles.hobbies}>
                        {first && <span className={styles.hobby}>{first.label.toUpperCase()}</span>}
                        {second && <span className={styles.hobby}>{second.label.toUpperCase()}</span>}
                        {extra > 0 && <span className={styles.extra}>+{extra}</span>}
                    </span>
                </div>
            </div>
        </article>
    )
}
