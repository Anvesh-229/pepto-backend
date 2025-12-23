import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';

const JWT_SECRET = process.env.JWT_SECRET!;

export const login = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    const user = await AuthService.findOrCreateUser(phone);

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'login failed' });
  }
};
