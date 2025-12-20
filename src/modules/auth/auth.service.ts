import jwt from 'jsonwebtoken';
import { AuthUser } from './auth-user.interface';

const JWT_SECRET = process.env.JWT_SECRET as string;

export class AuthService {

  static generateToken(user: AuthUser): string {
    return jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  static verifyToken(token: string): AuthUser {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  }
}
