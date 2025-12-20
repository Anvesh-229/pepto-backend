import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export const login = (req: Request, res: Response) => {
  const { phone, role } = req.body;

  if (!phone || !role) {
    return res.status(400).json({ message: 'phone and role required' });
  }

  // DEV ONLY: no password, no OTP
  const user = {
    id: phone,
    role
  };

  const token = jwt.sign(user, JWT_SECRET, {
    expiresIn: '7d'
  });

  return res.json({ token });
};
