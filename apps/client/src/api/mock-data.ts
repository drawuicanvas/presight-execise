import type { User } from './types';

export const HOBBIES = [
  'Photography', 'Cooking', 'Cycling', 'Gaming', 'Hiking', 'Chess', 'Baking', 'Running',
  'Karting', 'Sim racing', 'Origami', 'Espresso', 'Padel', 'Guitar', 'Skiing', 'Pottery',
  'Climbing', 'Yoga', 'Painting', 'Surfing', 'Reading', 'Dancing', 'Fishing', 'Gardening',
];

export const NATIONALITIES = [
  'Indian', 'Italian', 'Japanese', 'Spanish', 'Nigerian', 'Norwegian', 'Lebanese', 'Brazilian',
  'German', 'French', 'Ghanaian', 'Russian', 'Pakistani', 'Czech', 'Swedish', 'Egyptian',
  'Chinese', 'Iranian', 'Portuguese', 'Mexican',
];

const FIRST = ['Amara', 'Luca', 'Yuki', 'Priya', 'Mateo', 'Ingrid', 'Omar', 'Sofia', 'Kwame', 'Elena', 'Hiro', 'Fatima', 'Diego', 'Anya', 'Noah', 'Leila', 'Marco', 'Sana', 'Felix', 'Aisha', 'Ravi', 'Clara', 'Tomas', 'Nadia', 'Jonas', 'Mei', 'Carlos', 'Zara', 'Erik', 'Bianca'];
const LAST = ['Okafor', 'Moretti', 'Tanaka', 'Sharma', 'García', 'Larsen', 'Haddad', 'Rossi', 'Mensah', 'Petrova', 'Sato', 'Khan', 'Fernández', 'Novak', 'Berg', 'Nasser', 'Ricci', 'Ali', 'Weber', 'Diallo', 'Iyer', 'Dubois', 'Silva', 'Aoki', 'Nilsen', 'Chen', 'Vargas', 'Amini', 'Lund', 'Costa'];

/** Deterministic PRNG so the dummy data is stable across reloads. */
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateUsers(count: number): User[] {
  const rnd = mulberry32(42);
  const out: User[] = [];
  for (let i = 0; i < count; i++) {
    const firstName = FIRST[Math.floor(rnd() * FIRST.length)];
    const lastName = LAST[Math.floor(rnd() * LAST.length)];
    // Power curve so some hobbies/nationalities are more common → interesting facet counts
    const nationality = NATIONALITIES[Math.floor(Math.pow(rnd(), 1.4) * NATIONALITIES.length)];
    const nHobbies = 1 + Math.floor(rnd() * 6);
    const hobbies: string[] = [];
    while (hobbies.length < nHobbies) {
      const h = HOBBIES[Math.floor(Math.pow(rnd(), 1.3) * HOBBIES.length)];
      if (!hobbies.includes(h)) hobbies.push(h);
    }
    out.push({
      id: `u-${i}`,
      firstName,
      lastName,
      nationality,
      age: 18 + Math.floor(rnd() * 41),
      hobbies,
      avatarHue: Math.floor(rnd() * 360),
    });
  }
  return out;
}

export const ALL_USERS = generateUsers(240);
