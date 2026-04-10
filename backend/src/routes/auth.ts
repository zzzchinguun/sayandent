import { Router, Request, Response } from 'express';
import { query } from '../lib/db/client.js';
import { comparePassword } from '../lib/auth/password.js';
import { signToken } from '../lib/auth/jwt.js';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password required' });
      return;
    }

    const rows = await query<{ id: string; email: string; password_hash: string; role: string }>(
      'SELECT id, email, password_hash, role FROM admin_users WHERE email = $1',
      [email]
    );

    const user = rows[0];
    if (!user || !(await comparePassword(password, user.password_hash))) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const token = await signToken({ userId: user.id, email: user.email, role: user.role });
    res.json({ success: true, data: { token, user: { id: user.id, email: user.email, role: user.role } } });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
