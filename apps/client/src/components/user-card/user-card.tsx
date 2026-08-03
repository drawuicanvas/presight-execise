import type { User } from '../../api/types';
import styles from './user-card.module.scss';

interface UserCardProps {
  user: User;
}

/**
 * |----------------------------------|
 * | avatar      first_name+last_name |
 * |             nationality      age |
 * |             (2 hobbies) (+n)     |
 * |----------------------------------|
 */
export function UserCard({ user }: UserCardProps) {
  const [h1, h2] = user.hobbies;
  const extra = Math.max(0, user.hobbies.length - 2);
  return (
    <article className={styles.card}>
      <div
        className={styles.avatar}
        style={{ background: `hsl(${user.avatarHue}, 85%, 62%)` }}
        aria-hidden
      >
        {user.firstName[0]}
        {user.lastName[0]}
      </div>
      <div className={styles.body}>
        <div className={styles.line}>
          <span className={styles.name}>
            {user.firstName} {user.lastName}
          </span>
          <span className={styles.age}>{user.age}</span>
        </div>
        <div className={styles.line}>
          <span className={styles.nationality}>{user.nationality.toUpperCase()}</span>
          <span className={styles.hobbies}>
            {h1 && <span className={styles.hobby}>{h1.toUpperCase()}</span>}
            {h2 && <span className={styles.hobby}>{h2.toUpperCase()}</span>}
            {extra > 0 && <span className={styles.extra}>+{extra}</span>}
          </span>
        </div>
      </div>
    </article>
  );
}
