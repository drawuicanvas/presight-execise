import type { UserSearchItem } from '@presight/schema'
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

    return (
        <article className={styles.card}>
            <img className={styles.avatar} src={user.avatar} alt="" loading="lazy" decoding="async" />
            <div className={styles.body}>
                <div className={styles.line}>
                    <span className={styles.name}>
                        {user.first_name} {user.last_name}
                    </span>
                    <span className={styles.age}>{user.age}</span>
                </div>
                <div className={styles.line}>
                    <span className={styles.nationality}>{user.nationality_label.toUpperCase()}</span>
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
