import { Router, Request, Response } from 'express';
import { query } from '../lib/db/client.js';
import { sendClinicNotification, contactEmailHTML, appointmentEmailHTML } from '../lib/email/resend.js';

const router = Router();

// Staff
router.get('/staff', async (req: Request, res: Response) => {
  try {
    const locale = (req.query.locale as string) || 'mn';
    const rows = await query(
      `SELECT s.id, s.slug, s.image_url, st.name, st.title, st.bio, s.sort_order
       FROM staff s
       JOIN staff_translations st ON st.staff_id = s.id AND st.locale = $1
       WHERE s.is_active = true AND s.deleted_at IS NULL
       ORDER BY s.sort_order ASC`,
      [locale]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[public/staff]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Services
router.get('/services', async (req: Request, res: Response) => {
  try {
    const locale = (req.query.locale as string) || 'mn';
    const rows = await query(
      `SELECT s.id, s.slug, s.image_url, st.title, st.description, s.sort_order
       FROM services s
       JOIN service_translations st ON st.service_id = s.id AND st.locale = $1
       WHERE s.is_active = true AND s.deleted_at IS NULL
       ORDER BY s.sort_order ASC`,
      [locale]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[public/services]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Testimonials
router.get('/testimonials', async (req: Request, res: Response) => {
  try {
    const locale = (req.query.locale as string) || 'mn';
    const rows = await query(
      `SELECT t.id, tt.name, tt.role, tt.content, tt.avatar, t.sort_order
       FROM testimonials t
       JOIN testimonial_translations tt ON tt.testimonial_id = t.id AND tt.locale = $1
       WHERE t.is_active = true AND t.deleted_at IS NULL
       ORDER BY t.sort_order ASC`,
      [locale]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[public/testimonials]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// FAQs
router.get('/faqs', async (req: Request, res: Response) => {
  try {
    const locale = (req.query.locale as string) || 'mn';
    const rows = await query(
      `SELECT f.id, ft.question, ft.answer, f.sort_order
       FROM faqs f
       JOIN faq_translations ft ON ft.faq_id = f.id AND ft.locale = $1
       WHERE f.is_active = true AND f.deleted_at IS NULL
       ORDER BY f.sort_order ASC`,
      [locale]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[public/faqs]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Contact form
router.post('/contact', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      res.status(400).json({ success: false, error: 'Name, email, and message are required' });
      return;
    }

    let id: string | null = null;
    try {
      const rows = await query<{ id: string }>(
        `INSERT INTO contacts (name, email, phone, message) VALUES ($1, $2, $3, $4) RETURNING id`,
        [name, email, phone ?? null, message]
      );
      id = rows[0]?.id ?? null;
    } catch (dbErr) {
      console.error('[contact] DB insert failed:', dbErr);
    }

    void sendClinicNotification({
      subject: `New contact: ${name}`,
      html: contactEmailHTML({ name, email, phone, message }),
      replyTo: email,
    });

    res.status(201).json({ success: true, data: { id, message: 'Message sent successfully' } });
  } catch (err) {
    console.error('[public/contact]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Appointment form
router.post('/appointments', async (req: Request, res: Response) => {
  try {
    const { fullName, phone, email, preferredDate, preferredTime, serviceType, notes } = req.body;
    if (!fullName || !phone || !email || !preferredDate || !preferredTime || !serviceType) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    let id: string | null = null;
    try {
      const rows = await query<{ id: string }>(
        `INSERT INTO appointments (full_name, phone, email, preferred_date, preferred_time, service_type, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [fullName, phone, email, preferredDate, preferredTime, serviceType, notes ?? null]
      );
      id = rows[0]?.id ?? null;
    } catch (dbErr) {
      console.error('[appointments] DB insert failed:', dbErr);
    }

    void sendClinicNotification({
      subject: `New appointment: ${fullName} — ${preferredDate} ${preferredTime}`,
      html: appointmentEmailHTML({ fullName, email, phone, preferredDate, preferredTime, serviceType, notes }),
      replyTo: email,
    });

    res.status(201).json({ success: true, data: { id, message: 'Appointment booked successfully' } });
  } catch (err) {
    console.error('[public/appointments]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
