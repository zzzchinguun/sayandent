import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './client.js';

async function migrate() {
  const sql = readFileSync(join(import.meta.dirname, '001_initial.sql'), 'utf-8');
  console.log('Running migration...');
  await pool.query(sql);
  console.log('Migration complete.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
