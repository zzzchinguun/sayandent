import { Router, Response } from 'express';
import { query, queryOne } from '../lib/db/client.js';
import { AuthRequest, requireAuth, requireSuperAdmin } from '../middleware/auth.js';
import { hashPassword } from '../lib/auth/password.js';

const router = Router();

// All admin routes require auth
router.use(requireAuth);

// ────────────── Dashboard Stats ──────────────

router.get('/stats', async (_req: AuthRequest, res: Response) => {
  try {
    const [appointments, contacts, services, faqs, testimonials, staff] = await Promise.all([
      queryOne<{ count: string }>('SELECT COUNT(*) FROM appointments WHERE deleted_at IS NULL'),
      queryOne<{ count: string }>('SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL'),
      queryOne<{ count: string }>('SELECT COUNT(*) FROM services WHERE deleted_at IS NULL'),
      queryOne<{ count: string }>('SELECT COUNT(*) FROM faqs WHERE deleted_at IS NULL'),
      queryOne<{ count: string }>('SELECT COUNT(*) FROM testimonials WHERE deleted_at IS NULL'),
      queryOne<{ count: string }>('SELECT COUNT(*) FROM staff WHERE deleted_at IS NULL'),
    ]);
    res.json({
      success: true,
      data: {
        appointments: Number(appointments?.count ?? 0),
        contacts: Number(contacts?.count ?? 0),
        services: Number(services?.count ?? 0),
        faqs: Number(faqs?.count ?? 0),
        testimonials: Number(testimonials?.count ?? 0),
        staff: Number(staff?.count ?? 0),
      },
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ────────────── Appointments ──────────────

router.get('/appointments', async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const where = status
      ? 'WHERE a.deleted_at IS NULL AND a.status = $1'
      : 'WHERE a.deleted_at IS NULL';
    const params = status ? [status] : [];
    const rows = await query(
      `SELECT * FROM appointments a ${where} ORDER BY a.created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[admin/appointments]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.patch('/appointments/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await query('UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
    res.json({ success: true, data: { id, status } });
  } catch (err) {
    console.error('[admin/appointments/:id]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/appointments/:id', async (req: AuthRequest, res: Response) => {
  try {
    await query('UPDATE appointments SET deleted_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[admin/appointments/:id]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ────────────── Contacts ──────────────

router.get('/contacts', async (req: AuthRequest, res: Response) => {
  try {
    const isRead = req.query.isRead as string | undefined;
    let where = 'WHERE deleted_at IS NULL';
    const params: unknown[] = [];
    if (isRead === 'true') { where += ' AND is_read = true'; }
    else if (isRead === 'false') { where += ' AND is_read = false'; }
    const rows = await query(`SELECT * FROM contacts ${where} ORDER BY created_at DESC`, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[admin/contacts]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.patch('/contacts/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { is_read, is_replied } = req.body;
    const sets: string[] = ['updated_at = NOW()'];
    const params: unknown[] = [];
    if (is_read !== undefined) { params.push(is_read); sets.push(`is_read = $${params.length}`); }
    if (is_replied !== undefined) { params.push(is_replied); sets.push(`is_replied = $${params.length}`); }
    params.push(req.params.id);
    await query(`UPDATE contacts SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
    res.json({ success: true });
  } catch (err) {
    console.error('[admin/contacts/:id]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/contacts/:id', async (req: AuthRequest, res: Response) => {
  try {
    await query('UPDATE contacts SET deleted_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[admin/contacts/:id]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ────────────── Staff (translatable) ──────────────

router.get('/staff', async (req: AuthRequest, res: Response) => {
  try {
    const rows = await query(
      `SELECT s.*, st_mn.name as name_mn, st_mn.title as title_mn, st_en.name as name_en, st_en.title as title_en
       FROM staff s
       LEFT JOIN staff_translations st_mn ON st_mn.staff_id = s.id AND st_mn.locale = 'mn'
       LEFT JOIN staff_translations st_en ON st_en.staff_id = s.id AND st_en.locale = 'en'
       WHERE s.deleted_at IS NULL ORDER BY s.sort_order ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[admin/staff]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/staff', async (req: AuthRequest, res: Response) => {
  try {
    const { slug, image_url, sort_order, mn, en } = req.body;
    const row = await queryOne<{ id: string }>(
      'INSERT INTO staff (slug, image_url, sort_order, is_active) VALUES ($1, $2, $3, true) RETURNING id',
      [slug, image_url ?? null, sort_order ?? 0]
    );
    const id = row!.id;
    if (mn) await query('INSERT INTO staff_translations (staff_id, locale, name, title, bio) VALUES ($1, $2, $3, $4, $5)', [id, 'mn', mn.name, mn.title, mn.bio ?? '']);
    if (en) await query('INSERT INTO staff_translations (staff_id, locale, name, title, bio) VALUES ($1, $2, $3, $4, $5)', [id, 'en', en.name, en.title, en.bio ?? '']);
    res.status(201).json({ success: true, data: { id } });
  } catch (err) {
    console.error('[admin/staff POST]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.patch('/staff/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { slug, image_url, sort_order, is_active, mn, en } = req.body;
    const sets: string[] = ['updated_at = NOW()'];
    const params: unknown[] = [];
    if (slug !== undefined) { params.push(slug); sets.push(`slug = $${params.length}`); }
    if (image_url !== undefined) { params.push(image_url); sets.push(`image_url = $${params.length}`); }
    if (sort_order !== undefined) { params.push(sort_order); sets.push(`sort_order = $${params.length}`); }
    if (is_active !== undefined) { params.push(is_active); sets.push(`is_active = $${params.length}`); }
    params.push(id);
    await query(`UPDATE staff SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
    if (mn) await query('UPDATE staff_translations SET name = $1, title = $2, bio = $3 WHERE staff_id = $4 AND locale = $5', [mn.name, mn.title, mn.bio ?? '', id, 'mn']);
    if (en) await query('UPDATE staff_translations SET name = $1, title = $2, bio = $3 WHERE staff_id = $4 AND locale = $5', [en.name, en.title, en.bio ?? '', id, 'en']);
    res.json({ success: true, data: { id } });
  } catch (err) {
    console.error('[admin/staff/:id PATCH]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/staff/:id', async (req: AuthRequest, res: Response) => {
  try {
    await query('UPDATE staff SET deleted_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[admin/staff/:id DELETE]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ────────────── Users (superadmin only) ──────────────

router.get('/users', requireSuperAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await query('SELECT id, email, role, created_at FROM admin_users ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[admin/users]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/users', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, role } = req.body;
    const hash = await hashPassword(password);
    const row = await queryOne<{ id: string }>(
      'INSERT INTO admin_users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
      [email, hash, role ?? 'admin']
    );
    res.status(201).json({ success: true, data: { id: row!.id } });
  } catch (err) {
    console.error('[admin/users POST]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
