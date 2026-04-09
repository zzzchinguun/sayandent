/**
 * One-shot script: rename existing staff rows in place by sort_order.
 * Preserves image_url and IDs (unlike re-running the seed).
 *
 * Run: npx tsx src/lib/db/update-staff-names.ts
 */
import { query } from './client';

const updates = [
  {
    mn: { name: 'Сонин Батсанаа', title: 'Нүүр амны мэс заслын их эмч, Согог заслын их эмч', bio: 'Нүүр амны мэс засал болон согог заслын мэргэжилтэн' },
    en: { name: 'Sonin Batsanaa', title: 'Oral Surgeon & Orthodontist', bio: 'Specialist in oral surgery and orthodontics' },
  },
  {
    mn: { name: 'Онон Эрдэнэбат', title: 'Нүүр амны их эмч', bio: 'Нүүр амны эрүүл мэндийн мэргэжилтэн' },
    en: { name: 'Onon Erdenebat', title: 'General Dentist', bio: 'General dentistry specialist' },
  },
  {
    mn: { name: 'Ганбаатар Эрдэнэзориг', title: 'Нүүр амны их эмч', bio: 'Нүүр амны эрүүл мэндийн мэргэжилтэн' },
    en: { name: 'Ganbaatar Erdenezorig', title: 'General Dentist', bio: 'General dentistry specialist' },
  },
  {
    mn: { name: 'Ганбаяр Хонгорзул', title: 'Нүүр амны их эмч', bio: 'Нүүр амны эрүүл мэндийн мэргэжилтэн' },
    en: { name: 'Ganbayar Khongorzul', title: 'General Dentist', bio: 'General dentistry specialist' },
  },
  {
    mn: { name: 'Ганболд Цэнгүүн', title: 'Нүүр амны их эмч', bio: 'Нүүр амны эрүүл мэндийн мэргэжилтэн' },
    en: { name: 'Ganbold Tsenguun', title: 'General Dentist', bio: 'General dentistry specialist' },
  },
];

async function main() {
  const staff = await query<{ id: string; sort_order: number }>(
    `SELECT id, sort_order FROM staff
     WHERE deleted_at IS NULL
     ORDER BY sort_order ASC
     LIMIT $1`,
    [updates.length]
  );

  if (staff.length === 0) {
    console.error('No staff rows found.');
    process.exit(1);
  }

  console.log(`Updating ${staff.length} staff rows...`);

  for (let i = 0; i < staff.length; i++) {
    const row = staff[i];
    const u = updates[i];
    if (!u) continue;

    await query(
      `UPDATE staff_translations
         SET name = $1, title = $2, bio = $3
       WHERE staff_id = $4 AND locale = 'mn'`,
      [u.mn.name, u.mn.title, u.mn.bio, row.id]
    );
    await query(
      `UPDATE staff_translations
         SET name = $1, title = $2, bio = $3
       WHERE staff_id = $4 AND locale = 'en'`,
      [u.en.name, u.en.title, u.en.bio, row.id]
    );

    console.log(`  ✓ ${u.en.name}`);
  }

  console.log('Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
