import { Pool } from 'pg';

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

db.query('select 1')
  .then(() => console.log('✅ DB connected'))
  .catch(err => console.error('❌ DB error', err));
