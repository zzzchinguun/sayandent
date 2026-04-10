import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth/jwt.js';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string; role: string };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  try {
    const payload = await verifyToken(token);
    if (!payload) {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }
    req.user = payload as AuthRequest['user'];
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'superadmin') {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return;
  }
  next();
}
